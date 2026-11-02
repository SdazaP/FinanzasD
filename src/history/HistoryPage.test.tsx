import { fireEvent, render, screen, within } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { HistoryEntry } from './calc'
import HistoryPage from './HistoryPage'

const m = vi.hoisted(() => ({ useMonthHistory: vi.fn() }))
vi.mock('./useMonthHistory', () => ({ useMonthHistory: m.useMonthHistory }))

const nov: HistoryEntry[] = [
  { id: 's1', kind: 'spending', label: 'Café · Oxxo', amount: 4500, date: '2026-11-02', href: '/gastos-hormiga/a' },
  { id: 'r1', kind: 'fixed', label: 'Plan Telcel', amount: 29900, date: '2026-11-02', href: '/gastos-fijos/tel' },
  { id: 'c1', kind: 'msi', label: 'Excavadora', amount: 27810, date: '2026-11-01', href: '/creditos/exc' },
  { id: 'c2', kind: 'card', label: 'Nu', amount: 100000, date: '2026-11-01', href: '/creditos/nu' },
]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 2, 12))
  m.useMonthHistory.mockImplementation((_uid, month: string) => ({ ready: true, entries: month.startsWith('2026-11') ? nov : [] }))
})
afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

const renderPage = () =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    </AuthContext>,
  )

test('muestra el total del mes sin el pago de tarjeta, el desglose y abre el día de hoy', () => {
  renderPage()
  expect(screen.getByRole('heading', { name: 'Noviembre 2026' })).toBeInTheDocument()
  expect(screen.getByText('$622.10')).toBeInTheDocument()
  expect(screen.getByText('Hormiga $45.00 · Fijos $299.00 · Créditos $278.10')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled()

  const today = screen.getByRole('gridcell', { name: 'lunes, 2 de noviembre, $344.00' })
  expect(today).toHaveAttribute('aria-selected', 'true')
  expect(within(today).getByText('$344')).toBeInTheDocument()

  const detail = screen.getByRole('heading', { name: /2 de noviembre · \$344\.00/ }).parentElement!
  expect(within(detail).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/gastos-fijos/tel', '/gastos-hormiga/a'])
})

test('al tocar un día lista sus gastos; el pago de tarjeta se ve pero no suma', () => {
  renderPage()
  fireEvent.click(screen.getByRole('gridcell', { name: 'domingo, 1 de noviembre, $278.10' }))
  const detail = screen.getByRole('heading', { name: /1 de noviembre/ }).parentElement!
  expect(within(detail).getByText('Pago de tarjeta · no suma')).toBeInTheDocument()
  expect(within(detail).getByText('MSI')).toBeInTheDocument()
})

test('navega a meses anteriores y muestra el estado vacío', () => {
  renderPage()
  fireEvent.click(screen.getByRole('button', { name: 'Mes anterior' }))
  expect(screen.getByRole('heading', { name: 'Octubre 2026' })).toBeInTheDocument()
  expect(m.useMonthHistory).toHaveBeenLastCalledWith('owner', '2026-10-01')
  expect(screen.getByText('No registraste gastos en octubre.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Registrar un gasto' })).toHaveAttribute('href', '/gastos-hormiga')
  expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeEnabled()
})

import { render, screen, within } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Spending } from './calc'
import SpendingList from './SpendingList'

const api = vi.hoisted(() => ({
  watchMonthSpending: vi.fn(),
  watchCap: vi.fn(),
  watchSpendingCategories: vi.fn(() => () => {}),
  addSpending: vi.fn(),
  addSpendingCategory: vi.fn(),
  setCap: vi.fn(),
}))
vi.mock('./api', () => api)

const s = (id: string, date: string, amount: number, category: string, note?: string, createdAt = 0): Spending =>
  ({ id, date, amount, category, note, createdAt })

const items = [
  s('a', '2026-11-01', 4500, 'Café', 'Oxxo', 2),
  s('b', '2026-11-01', 12000, 'Salidas', undefined, 1),
  s('c', '2026-10-31', 8000, 'Antojos'),
]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 1, 12, 0))
  api.watchMonthSpending.mockImplementation((_uid, _from, _to, onData) => (onData(items), () => {}))
  api.watchCap.mockImplementation((_uid, onData) => (onData(20000), () => {}))
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

const renderList = () =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter initialEntries={['/gastos-hormiga']}>
        <SpendingList />
      </MemoryRouter>
    </AuthContext>,
  )

test('consulta el mes en curso y muestra total, tope excedido y grupos por día', () => {
  renderList()
  expect(api.watchMonthSpending.mock.calls[0].slice(1, 3)).toEqual(['2026-11-01', '2026-11-30'])

  expect(screen.getByText('$245.00')).toBeInTheDocument()
  expect(screen.getByText('3 gastos')).toBeInTheDocument()
  expect(screen.getByText('Te pasaste del tope de gastos hormiga por $45.00')).toBeInTheDocument()
  expect(screen.getByText('Urgente:')).toBeInTheDocument()

  const hoy = screen.getByRole('heading', { name: 'Hoy' }).closest('section')!
  expect(within(hoy).getByText('$165.00')).toBeInTheDocument()
  const links = within(hoy).getAllByRole('link')
  expect(links.map((l) => l.getAttribute('href'))).toEqual(['/gastos-hormiga/a', '/gastos-hormiga/b'])
  expect(within(hoy).getByText('Oxxo')).toBeInTheDocument()

  expect(screen.getByRole('heading', { name: 'Ayer' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Pagar/ })).not.toBeInTheDocument()
})

test('sin tope ofrece definirlo y sin gastos muestra el estado vacío', () => {
  api.watchCap.mockImplementation((_uid, onData) => (onData(undefined), () => {}))
  api.watchMonthSpending.mockImplementation((_uid, _from, _to, onData) => (onData([]), () => {}))
  renderList()
  expect(screen.getByRole('button', { name: 'Definir tope' })).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.getByText('Aún no registras gastos hormiga este mes.')).toBeInTheDocument()
})

import { fireEvent, render, screen, within } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Credit } from './api'
import CreditList from './CreditList'

const api = vi.hoisted(() => ({ watchCredits: vi.fn(), payCredit: vi.fn(), watchPeriodPayments: vi.fn() }))
vi.mock('./api', () => ({ watchCredits: api.watchCredits, payCredit: api.payCredit }))
vi.mock('../lib/periodPayments', () => ({ watchPeriodPayments: api.watchPeriodPayments }))

// Pagos del periodo de marzo por crédito (los que no aparecen no tienen pagos)
const periodPayments: Record<string, { amount: number; lastPaidAt: string | null }> = {}

const credits: Credit[] = [
  { id: 'c', kind: 'card', name: 'BBVA Azul', balance: 1250000, limit: 5000000, nextDue: '2026-03-12', dayOfMonth: 12 },
  {
    id: 'm', kind: 'msi', name: 'Laptop', card: 'Nu', total: 1200000, months: 12, balance: 900000, nextDue: '2026-03-31', dayOfMonth: 31,
  },
]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 2, 10))
  api.watchCredits.mockImplementation((_uid, onData) => (onData(credits), () => {}))
  api.watchPeriodPayments.mockImplementation((_uid, _col, id, _from, _to, onData) => (
    onData(periodPayments[id] ?? { amount: 0, lastPaidAt: null }), () => {}
  ))
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  for (const id of Object.keys(periodPayments)) delete periodPayments[id]
})

test('tarjeta pagada este mes (dos abonos) va a Pagado y un MSI que empieza en abril a Más adelante', () => {
  api.watchCredits.mockImplementation((_uid, onData) => (
    onData([
      { ...credits[0], nextDue: '2026-04-12' },
      { ...credits[1], id: 'tv', name: 'Tele', nextDue: '2026-04-30' },
    ]), () => {}
  ))
  periodPayments.c = { amount: 300000, lastPaidAt: '2026-03-08' }
  renderList()

  const group = (title: string) => screen.getByRole('heading', { name: title }).parentElement!
  expect(screen.queryByRole('heading', { name: 'Por pagar' })).not.toBeInTheDocument()

  const paid = group('Pagado este mes')
  expect(within(paid).getByText(/Pagado el 8 mar/)).toBeInTheDocument()
  expect(within(paid).getByText('Pagaste $3,000.00')).toBeInTheDocument()
  expect(within(paid).queryByRole('button')).not.toBeInTheDocument()

  expect(within(group('Más adelante')).getByText(/Vence el 30 abr/)).toBeInTheDocument()
})

const renderList = () =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter>
        <CreditList />
      </MemoryRouter>
    </AuthContext>,
  )

test('muestra la deuda total, el uso de la tarjeta y el avance del MSI', () => {
  renderList()
  expect(screen.getByText('$21,500.00')).toBeInTheDocument()

  const card = screen.getByText('BBVA Azul').closest('li')!
  expect(within(card).getByRole('progressbar', { name: 'Uso de BBVA Azul' })).toHaveAttribute('aria-valuenow', '25')
  expect(within(card).getByText('Pronto')).toBeInTheDocument()

  const msi = screen.getByText('Laptop').closest('li')!
  expect(within(msi).getByText('Nu · MSI · 31 mar')).toBeInTheDocument()
  expect(within(msi).getByRole('progressbar', { name: 'Pagado de Laptop' })).toHaveAttribute('aria-valuenow', '25')
  expect(within(msi).getByText(/9 de 12 pagos restantes · \$1,000\.00 al mes · termina 30 nov 2026/)).toBeInTheDocument()
})

test('pagar prellena la cuota, valida el monto y paga una sola vez con el monto editado', async () => {
  let finish!: () => void
  api.payCredit.mockReturnValue(new Promise<void>((ok) => (finish = ok)))
  renderList()

  fireEvent.click(screen.getByRole('button', { name: 'Pagar Laptop' }))
  const input = screen.getByLabelText('Monto a pagar')
  expect(input).toHaveValue('1000.00')

  fireEvent.change(input, { target: { value: '9500' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
  expect(screen.getByText('No puede ser mayor al saldo ($9,000.00).')).toBeInTheDocument()
  expect(api.payCredit).not.toHaveBeenCalled()

  fireEvent.change(input, { target: { value: '2,500' } })
  const confirm = screen.getByRole('button', { name: 'Confirmar' })
  fireEvent.click(confirm)
  fireEvent.click(confirm)
  expect(api.payCredit).toHaveBeenCalledTimes(1)
  expect(api.payCredit).toHaveBeenCalledWith('owner', credits[1], 250000)

  finish()
  await vi.waitFor(() => expect(screen.queryByLabelText('Monto a pagar')).not.toBeInTheDocument())
})

test('la tarjeta prellena el saldo y los créditos en $0 van a Liquidados', () => {
  api.watchCredits.mockImplementation((_uid, onData) => (onData([...credits, { ...credits[1], id: 'z', name: 'Tele', balance: 0 }]), () => {}))
  renderList()

  fireEvent.click(screen.getByRole('button', { name: 'Pagar BBVA Azul' }))
  expect(screen.getByLabelText('Monto a pagar')).toHaveValue('12500.00')

  const settled = screen.getByRole('heading', { name: 'Liquidados' }).parentElement!
  expect(within(settled).getByText('Tele')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Pagar Tele' })).not.toBeInTheDocument()
})

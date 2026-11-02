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

test('MSI: paga exactamente la cuota del mes, sin campo para cambiarla, una sola vez', async () => {
  let finish!: () => void
  api.payCredit.mockReturnValue(new Promise<void>((ok) => (finish = ok)))
  renderList()

  fireEvent.click(screen.getByRole('button', { name: 'Pagar cuota de marzo, Laptop' }))
  expect(screen.getByText('Cuota de marzo')).toBeInTheDocument()
  expect(screen.getByText('$1,000.00', { selector: 'span' })).toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

  const confirm = screen.getByRole('button', { name: 'Confirmar' })
  fireEvent.click(confirm)
  fireEvent.click(confirm)
  expect(api.payCredit).toHaveBeenCalledTimes(1)
  expect(api.payCredit).toHaveBeenCalledWith('owner', credits[1], 100000, undefined, [])

  finish()
  await vi.waitFor(() => expect(screen.queryByText('Cuota de marzo')).not.toBeInTheDocument())
})

test('tarjeta: un pago del mes con monto editable que no pasa del saldo; los de $0 van a Liquidados', () => {
  api.payCredit.mockResolvedValue(undefined)
  api.watchCredits.mockImplementation((_uid, onData) => (onData([...credits, { ...credits[1], id: 'z', name: 'Tele', balance: 0 }]), () => {}))
  renderList()

  fireEvent.click(screen.getByRole('button', { name: 'Pagar marzo, BBVA Azul' }))
  const input = screen.getByLabelText('Pago de marzo')
  expect(input).toHaveValue('12500.00')
  fireEvent.change(input, { target: { value: '13000' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
  expect(screen.getByText('No puede ser mayor al saldo ($12,500.00).')).toBeInTheDocument()
  expect(api.payCredit).not.toHaveBeenCalled()

  fireEvent.change(input, { target: { value: '2,500' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
  expect(api.payCredit).toHaveBeenCalledWith('owner', credits[0], 250000, undefined, [])

  const settled = screen.getByRole('heading', { name: 'Liquidados' }).parentElement!
  expect(within(settled).getByText('Tele')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Tele$/ })).not.toBeInTheDocument()
})

test('un crédito atrasado paga primero el mes más antiguo', () => {
  api.watchCredits.mockImplementation((_uid, onData) => (onData([{ ...credits[1], nextDue: '2026-02-28', dayOfMonth: 28 }]), () => {}))
  renderList()
  expect(screen.getByRole('button', { name: 'Pagar cuota de febrero, Laptop' })).toBeInTheDocument()
})

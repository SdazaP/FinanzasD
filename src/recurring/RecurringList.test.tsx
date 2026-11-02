import { fireEvent, render, screen, within } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Recurring } from './api'
import RecurringList from './RecurringList'

const api = vi.hoisted(() => ({ watchRecurring: vi.fn(), payRecurring: vi.fn(), watchPeriodPayments: vi.fn() }))
vi.mock('./api', () => ({ watchRecurring: api.watchRecurring, payRecurring: api.payRecurring }))
vi.mock('../lib/periodPayments', () => ({ watchPeriodPayments: api.watchPeriodPayments }))
const cardsMock = vi.hoisted(() => ({ value: { cards: [] as { id: string; name: string }[], credits: [], loaded: true, liveCardIds: [] as string[] } }))
vi.mock('../credits/useCards', () => ({ useCards: () => cardsMock.value }))

// Pagos del periodo de marzo por gasto (los que no aparecen no tienen pagos)
const periodPayments: Record<string, { amount: number; lastPaidAt: string | null }> = {}

const item = (over: Partial<Recurring>): Recurring => ({
  id: 'x', name: 'X', type: 'fixed', category: 'Otros', amount: 100, nextDue: '2026-03-20', dayOfMonth: 20, active: true, ...over,
})

const items = [
  item({ id: 'a', name: 'Renta', amount: 850000, nextDue: '2026-03-01' }),
  item({ id: 'b', name: 'Netflix', amount: 21900, nextDue: '2026-03-12' }),
  item({ id: 'c', name: 'Gimnasio', amount: 50000, nextDue: '2026-03-25' }),
  item({ id: 'd', name: 'Spotify', amount: 12900, active: false }),
]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 2, 10))
  api.watchRecurring.mockImplementation((_uid, onData) => (onData(items), () => {}))
  api.watchPeriodPayments.mockImplementation((_uid, _col, id, _from, _to, onData) => (
    onData(periodPayments[id] ?? { amount: 0, lastPaidAt: null }), () => {}
  ))
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  for (const id of Object.keys(periodPayments)) delete periodPayments[id]
})

const renderList = () =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter>
        <RecurringList />
      </MemoryRouter>
    </AuthContext>,
  )

test('muestra el total de los activos y marca vencidos y próximos', () => {
  renderList()
  expect(screen.getByText('$9,219.00')).toBeInTheDocument()
  expect(screen.getByText('3 gastos activos')).toBeInTheDocument()

  const card = (name: string) => screen.getByText(name).closest('li')!
  expect(within(card('Renta')).getByText('Vencido')).toBeInTheDocument()
  expect(within(card('Netflix')).getByText('Pronto')).toBeInTheDocument()
  expect(within(card('Gimnasio')).queryByText(/Vencido|Pronto/)).not.toBeInTheDocument()

  const paused = screen.getByRole('heading', { name: 'Pausados' }).parentElement!
  expect(within(paused).getByText('Spotify')).toBeInTheDocument()
  expect(within(paused).queryByRole('button')).not.toBeInTheDocument()
})

test('pagar desactiva el botón mientras guarda y solo paga una vez', async () => {
  let finish!: () => void
  api.payRecurring.mockReturnValue(new Promise<void>((ok) => (finish = ok)))
  renderList()

  const button = screen.getByRole('button', { name: 'Pagar Netflix' })
  fireEvent.click(button)
  fireEvent.click(button)

  expect(button).toBeDisabled()
  expect(api.payRecurring).toHaveBeenCalledTimes(1)
  expect(api.payRecurring).toHaveBeenCalledWith('owner', items[1], undefined, [])

  finish()
  await vi.waitFor(() => expect(button).toBeEnabled())
})

test('agrupa en Por pagar, Pagado este mes y Más adelante', () => {
  api.watchRecurring.mockImplementation((_uid, onData) => (
    onData([
      item({ id: 'luz', name: 'Luz', nextDue: '2026-03-15' }), // vence este mes
      item({ id: 'atrasado', name: 'Agua', nextDue: '2026-03-05' }), // pagó febrero en marzo: marzo sigue pendiente
      item({ id: 'renta', name: 'Renta', amount: 850000, nextDue: '2026-04-01' }), // ya pagó marzo
      item({ id: 'seguro', name: 'Seguro', nextDue: '2026-04-20' }), // primer pago en abril
    ]), () => {}
  ))
  periodPayments.renta = { amount: 850000, lastPaidAt: '2026-03-01' }
  renderList()

  const group = (title: string) => screen.getByRole('heading', { name: title }).parentElement!

  expect(within(group('Por pagar')).getByRole('button', { name: 'Pagar Luz' })).toBeInTheDocument()
  expect(within(group('Por pagar')).getByRole('button', { name: 'Pagar Agua' })).toBeInTheDocument()

  const paid = group('Pagado este mes')
  expect(within(paid).getByText('Renta')).toBeInTheDocument()
  expect(within(paid).getByText(/Pagado el 1 mar/)).toBeInTheDocument()
  expect(within(paid).queryByRole('button')).not.toBeInTheDocument()

  const later = group('Más adelante')
  expect(within(later).getByText(/Vence el 20 abr/)).toBeInTheDocument()
  expect(within(later).queryByRole('button')).not.toBeInTheDocument()
})

test('avisa si el pago falla', async () => {
  api.payRecurring.mockRejectedValue(new Error('offline'))
  renderList()
  fireEvent.click(screen.getByRole('button', { name: 'Pagar Renta' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo registrar el pago de Renta')
})

test('un gasto fijo se puede cargar a una tarjeta', () => {
  cardsMock.value = { cards: [{ id: 'oro', name: 'Oro' }], credits: [], loaded: true, liveCardIds: ['oro'] }
  api.payRecurring.mockResolvedValue(undefined)
  renderList()
  const row = screen.getByRole('button', { name: 'Pagar Netflix' }).closest('li')!
  fireEvent.change(within(row).getByRole('combobox'), { target: { value: 'card:oro' } })
  fireEvent.click(screen.getByRole('button', { name: 'Pagar Netflix' }))
  expect(api.payRecurring).toHaveBeenCalledWith('owner', items[1], 'card:oro', ['oro'])
  cardsMock.value = { cards: [], credits: [], loaded: true, liveCardIds: [] }
})

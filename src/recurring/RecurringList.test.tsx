import { fireEvent, render, screen, within } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Recurring } from './api'
import RecurringList from './RecurringList'

const api = vi.hoisted(() => ({ watchRecurring: vi.fn(), payRecurring: vi.fn() }))
vi.mock('./api', () => api)

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
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
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
  expect(api.payRecurring).toHaveBeenCalledWith('owner', items[1])

  finish()
  await vi.waitFor(() => expect(button).toBeEnabled())
})

test('avisa si el pago falla', async () => {
  api.payRecurring.mockRejectedValue(new Error('offline'))
  renderList()
  fireEvent.click(screen.getByRole('button', { name: 'Pagar Renta' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo registrar el pago de Renta')
})

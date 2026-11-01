import { render, screen, within } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Credit } from '../credits/api'
import type { Recurring } from '../recurring/api'
import type { Saving } from '../savings/api'
import Dashboard from './Dashboard'

const mocks = vi.hoisted(() => ({
  watchRecurring: vi.fn(),
  watchCredits: vi.fn(),
  watchSavings: vi.fn(),
  watchMonthPayments: vi.fn(),
  watchMonthSpending: vi.fn(),
}))
vi.mock('../spending/api', () => ({ watchMonthSpending: mocks.watchMonthSpending }))
vi.mock('../recurring/api', () => ({ watchRecurring: mocks.watchRecurring }))
vi.mock('../credits/api', () => ({ watchCredits: mocks.watchCredits }))
vi.mock('../savings/api', () => ({ watchSavings: mocks.watchSavings }))
vi.mock('../lib/periodPayments', () => ({ watchMonthPayments: mocks.watchMonthPayments }))

const recurring: Recurring[] = [
  { id: 'renta', name: 'Renta', type: 'fixed', category: 'Vivienda', amount: 850000, nextDue: '2026-11-01', dayOfMonth: 1, active: true },
  { id: 'luz', name: 'Luz', type: 'fixed', category: 'Servicios', amount: 40000, nextDue: '2026-12-02', dayOfMonth: 2, active: true },
]
const credits: Credit[] = [{ id: 'bbva', kind: 'card', name: 'BBVA', balance: 300000, nextDue: '2026-11-04', dayOfMonth: 4 }]
const savings: Saving[] = [
  { id: 'viaje', name: 'Viaje', balance: 1000000, target: 3000000, deadline: '2026-12-15' },
  { id: 'emer', name: 'Emergencias', balance: 500000 },
]

const feed = (data: { recurring?: Recurring[]; credits?: Credit[]; savings?: Saving[]; spending?: { amount: number }[] }) => {
  mocks.watchMonthSpending.mockImplementation((_uid, _from, _to, onData) => (onData(data.spending ?? []), () => {}))
  mocks.watchRecurring.mockImplementation((_uid, onData) => (onData(data.recurring ?? []), () => {}))
  mocks.watchCredits.mockImplementation((_uid, onData) => (onData(data.credits ?? []), () => {}))
  mocks.watchSavings.mockImplementation((_uid, onData) => (onData(data.savings ?? []), () => {}))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 2))
  // La luz ya se pagó este mes ($400)
  mocks.watchMonthPayments.mockImplementation((_uid, _col, id, _from, _to, onData) => (onData(id === 'luz' ? 40000 : 0), () => {}))
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

const renderDashboard = () =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </AuthContext>,
  )

test('muestra compromisos del mes, próximos pagos, saldos y metas', () => {
  feed({ recurring, credits, savings, spending: [{ amount: 4500 }, { amount: 25800 }] })
  renderDashboard()
  expect(mocks.watchMonthSpending.mock.calls[0].slice(1, 3)).toEqual(['2026-11-01', '2026-11-30'])

  // Total = pagado (luz) + pendiente (renta + tarjeta)
  expect(screen.getByText('$11,900.00')).toBeInTheDocument()
  expect(screen.getByText('$400.00')).toBeInTheDocument()
  expect(screen.getByText('$11,500.00')).toBeInTheDocument()
  expect(screen.getByText('Tarjetas: saldo completo')).toBeInTheDocument()

  const next = screen.getByRole('heading', { name: 'Próximos pagos' }).parentElement!
  const links = within(next).getAllByRole('link')
  expect(links.map((l) => l.getAttribute('href'))).toEqual(['/gastos-fijos/renta', '/creditos/bbva'])
  expect(within(links[0]).getByText('Vencido')).toBeInTheDocument()

  const balances = screen.getByRole('heading', { name: 'Tus saldos' }).parentElement!
  expect(within(balances).getByRole('link', { name: /Gastos fijos al mes \$8,900\.00/ })).toHaveAttribute('href', '/gastos-fijos')
  expect(within(balances).getByRole('link', { name: /Deuda total \$3,000\.00/ })).toHaveAttribute('href', '/creditos')
  expect(within(balances).getByRole('link', { name: /Total ahorrado \$15,000\.00/ })).toHaveAttribute('href', '/ahorro')
  expect(within(balances).getByRole('link', { name: /Gastos hormiga del mes \$303\.00/ })).toHaveAttribute('href', '/gastos-hormiga')

  const goals = screen.getByRole('heading', { name: 'Metas de ahorro' }).parentElement!
  expect(within(goals).getByText('Viaje')).toBeInTheDocument()
  expect(within(goals).queryByText('Emergencias')).not.toBeInTheDocument()
  // Hoy 2 nov, meta en diciembre: nov y dic → $20,000 / 2
  expect(within(goals).getByText('Ahorra $10,000.00 al mes')).toBeInTheDocument()
})

test('sin datos invita a empezar', () => {
  feed({})
  renderDashboard()
  expect(screen.getByRole('link', { name: 'Agregar gasto' })).toHaveAttribute('href', '/gastos-fijos/nuevo')
  expect(screen.queryByRole('heading', { name: 'Próximos pagos' })).not.toBeInTheDocument()
})

test('si una fuente falla avisa y muestra lo demás', () => {
  feed({ recurring, savings })
  mocks.watchCredits.mockImplementation((_uid, _onData, onError) => (onError(new Error('offline')), () => {}))
  renderDashboard()
  expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar: créditos')
  expect(screen.getByRole('heading', { name: 'Próximos pagos' })).toBeInTheDocument()
})

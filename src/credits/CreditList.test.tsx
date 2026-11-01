import { render, screen, within } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Credit } from './api'
import CreditList from './CreditList'

const api = vi.hoisted(() => ({ watchCredits: vi.fn(), payCredit: vi.fn() }))
vi.mock('./api', () => api)

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
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
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

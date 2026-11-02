import { fireEvent, render, screen, within } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Income } from './api'
import AccountsPage from './AccountsPage'
import type { Account } from './calc'

const mocks = vi.hoisted(() => ({
  useAccounts: vi.fn(),
  useMonthMoney: vi.fn(),
  addIncome: vi.fn(),
  updateIncome: vi.fn(),
  deleteIncome: vi.fn(),
}))
vi.mock('./useAccounts', () => ({ useAccounts: mocks.useAccounts }))
vi.mock('./useMonthMoney', () => ({ useMonthMoney: mocks.useMonthMoney }))
vi.mock('../alerts/api', () => ({ DEFAULT_RATIO: 50, watchAlertSettings: (_u: string, onData: (s: object) => void) => (onData({ ratioPct: 50, hidden: {} }), () => {}) }))
vi.mock('./api', () => ({ addIncome: mocks.addIncome, updateIncome: mocks.updateIncome, deleteIncome: mocks.deleteIncome }))

const accounts: Account[] = [
  { id: 'nomina', name: 'Nómina', type: 'debit', balance: 1500000 },
  { id: 'efectivo', name: 'Efectivo', type: 'cash', balance: -20000 },
]
const sueldo: Income = { id: 'i1', concept: 'Sueldo', amount: 1500000, date: '2026-10-31', accountId: 'nomina' }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 1, 12, 0))
  mocks.useAccounts.mockReturnValue({ accounts, defaultId: 'nomina', liveIds: ['nomina', 'efectivo'], error: false })
  mocks.useMonthMoney.mockReturnValue({ ready: true, failed: false, incomes: [sueldo], left: 650000, expected: 0, frequency: 'monthly' })
  mocks.addIncome.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

const renderPage = () =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>
    </AuthContext>,
  )

test('muestra disponible, lo que queda del mes y las cuentas con la predeterminada', () => {
  renderPage()
  expect(screen.getByText('$14,800.00')).toBeInTheDocument()
  expect(screen.getByText('$6,500.00')).toBeInTheDocument()
  const list = screen.getByRole('heading', { name: 'Tus cuentas' }).parentElement!
  expect(within(list).getByText('Débito · Predeterminada')).toBeInTheDocument()
  expect(within(list).getByText('-$200.00')).toHaveClass('text-red-600')
})

test('Repetir registra el mismo ingreso con fecha de hoy', () => {
  renderPage()
  fireEvent.click(screen.getByRole('button', { name: 'Repetir' }))
  expect(mocks.addIncome).toHaveBeenCalledWith('owner', { ...sueldo, date: '2026-11-01' }, ['nomina', 'efectivo'])
})

test('sin cuentas invita a crear la primera', () => {
  mocks.useAccounts.mockReturnValue({ accounts: [], defaultId: undefined, liveIds: [], error: false })
  renderPage()
  expect(screen.getByRole('link', { name: 'Crear mi primera cuenta' })).toHaveAttribute('href', '/cuentas/nueva')
})

test('calcula lo que queda con el disponible y avisa si incluye la quincena esperada', () => {
  mocks.useMonthMoney.mockReturnValue({ ready: true, failed: false, incomes: [sueldo], left: 650000, expected: 900000 })
  renderPage()
  expect(mocks.useMonthMoney).toHaveBeenCalledWith('owner', '2026-11-01', 1480000)
  expect(screen.getByText('Incluye tu segunda quincena esperada ($9,000.00)')).toBeInTheDocument()
})

test('muestra las preferencias de cobro y del aviso de gastos', () => {
  renderPage()
  expect(screen.getByRole('heading', { name: 'Preferencias' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'Mensual' })).toBeChecked()
})

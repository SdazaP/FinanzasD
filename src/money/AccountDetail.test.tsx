import { fireEvent, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import AccountDetail from './AccountDetail'
import type { Account } from './calc'

const mocks = vi.hoisted(() => ({
  useAccounts: vi.fn(),
  useAccountActivity: vi.fn(),
  adjustBalance: vi.fn(),
  deleteAccount: vi.fn(),
  setDefaultAccount: vi.fn(),
  updateAccount: vi.fn(),
}))
vi.mock('./useAccounts', () => ({ useAccounts: mocks.useAccounts }))
vi.mock('./useAccountActivity', () => ({ useAccountActivity: mocks.useAccountActivity }))
vi.mock('./api', () => ({
  adjustBalance: mocks.adjustBalance, deleteAccount: mocks.deleteAccount, setDefaultAccount: mocks.setDefaultAccount, updateAccount: mocks.updateAccount,
}))

const nomina: Account = { id: 'nomina', name: 'Nómina', type: 'debit', balance: 1250000 }
const efectivo: Account = { id: 'efectivo', name: 'Efectivo', type: 'cash', balance: 30000 }

beforeEach(() => {
  mocks.useAccounts.mockReturnValue({ accounts: [nomina, efectivo], defaultId: 'nomina', liveIds: ['nomina', 'efectivo'] })
  mocks.useAccountActivity.mockReturnValue([
    { id: 'p-1', label: 'Renta', amount: -850000, date: '2026-11-03', accountId: 'nomina' },
    { id: 'i-1', label: 'Sueldo', amount: 1500000, date: '2026-11-01', accountId: 'nomina' },
  ])
  for (const fn of [mocks.adjustBalance, mocks.deleteAccount, mocks.setDefaultAccount, mocks.updateAccount]) fn.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const renderAt = (id: string) =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter initialEntries={[`/cuentas/${id}`]}>
        <Routes>
          <Route path="/cuentas" element={<p>Lista</p>} />
          <Route path="/cuentas/:id" element={<AccountDetail />} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )

test('muestra el saldo y los movimientos del mes con signo', () => {
  renderAt('nomina')
  expect(screen.getByText('$12,500.00')).toBeInTheDocument()
  expect(screen.getByText('Nómina · Predeterminada')).toBeInTheDocument()
  expect(screen.getByText('-$8,500.00')).toBeInTheDocument()
  expect(screen.getByText('+$15,000.00')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Hacer predeterminada' })).not.toBeInTheDocument()
})

test('ajusta el saldo, incluso a $0', () => {
  renderAt('efectivo')
  fireEvent.change(screen.getByLabelText('Ajustar saldo'), { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: 'Ajustar' }))
  expect(mocks.adjustBalance).toHaveBeenCalledWith('owner', efectivo, 0)
})

test('puede hacerse predeterminada y eliminarse con confirmación', () => {
  vi.stubGlobal('confirm', vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true))
  renderAt('efectivo')
  fireEvent.click(screen.getByRole('button', { name: 'Hacer predeterminada' }))
  expect(mocks.setDefaultAccount).toHaveBeenCalledWith('owner', 'efectivo')

  fireEvent.click(screen.getByRole('button', { name: 'Eliminar cuenta' }))
  expect(mocks.deleteAccount).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar cuenta' }))
  expect(mocks.deleteAccount).toHaveBeenCalledWith('owner', 'efectivo', false)
})

test('una cuenta inexistente vuelve a la lista', () => {
  renderAt('no-existe')
  expect(screen.getByText('Lista')).toBeInTheDocument()
})

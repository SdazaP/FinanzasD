import { fireEvent, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Spending } from './calc'
import SpendingDetail from './SpendingDetail'

const api = vi.hoisted(() => ({
  watchSpending: vi.fn(),
  updateSpending: vi.fn(),
  deleteSpending: vi.fn(),
  addSpendingCategory: vi.fn(),
  watchSpendingCategories: vi.fn(() => () => {}),
}))
vi.mock('./api', () => api)

const cafe: Spending = { id: 'a', amount: 4500, date: '2026-10-31', category: 'Café', note: 'Oxxo', createdAt: 0 }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 1, 12, 0))
  api.watchSpending.mockImplementation((_uid, _id, onData) => (onData(cafe), () => {}))
  api.updateSpending.mockResolvedValue(undefined)
  api.deleteSpending.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const renderDetail = () =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter initialEntries={['/gastos-hormiga/a']}>
        <Routes>
          <Route path="/gastos-hormiga" element={<p>Lista</p>} />
          <Route path="/gastos-hormiga/:id" element={<SpendingDetail />} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )

test('precarga el gasto y guarda los cambios quitando la nota', async () => {
  renderDetail()
  expect(screen.getByLabelText('Monto')).toHaveValue('45.00')
  expect(screen.getByRole('button', { name: 'Café' })).toHaveAttribute('aria-pressed', 'true')

  fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '60' } })
  fireEvent.change(screen.getByLabelText('Nota (opcional)'), { target: { value: '' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

  expect(await screen.findByText('Lista')).toBeInTheDocument()
  expect(api.updateSpending).toHaveBeenCalledWith('owner', cafe, { amount: 6000, date: '2026-10-31', category: 'Café' }, [])
})

test('eliminar pide confirmación', () => {
  vi.stubGlobal('confirm', vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true))
  renderDetail()
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar gasto' }))
  expect(api.deleteSpending).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar gasto' }))
  expect(api.deleteSpending).toHaveBeenCalledWith('owner', cafe, [])
})

test('si el gasto no existe vuelve a la lista', () => {
  api.watchSpending.mockImplementation((_uid, _id, onData) => (onData(null), () => {}))
  renderDetail()
  expect(screen.getByText('Lista')).toBeInTheDocument()
})

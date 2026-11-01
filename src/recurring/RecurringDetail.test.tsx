import { fireEvent, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Recurring } from './api'
import RecurringDetail from './RecurringDetail'

const api = vi.hoisted(() => ({
  watchRecurringItem: vi.fn(),
  watchPayments: vi.fn(),
  updateRecurring: vi.fn(),
  setRecurringActive: vi.fn(),
  deleteRecurring: vi.fn(),
  deletePayment: vi.fn(),
}))
vi.mock('./api', () => api)

const renta: Recurring = {
  id: 'a', name: 'Renta', type: 'fixed', category: 'Vivienda', amount: 850000, nextDue: '2026-04-01', dayOfMonth: 1, active: true,
}

beforeEach(() => {
  api.watchRecurringItem.mockImplementation((_uid, _id, onData) => (onData(renta), () => {}))
  api.watchPayments.mockImplementation((_uid, _id, onData) => (
    onData([{ id: 'p2', dueDate: '2026-03-01', amount: 850000 }, { id: 'p1', dueDate: '2026-02-01', amount: 800000 }]), () => {}
  ))
  for (const fn of [api.updateRecurring, api.setRecurringActive, api.deleteRecurring, api.deletePayment]) fn.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const renderDetail = () =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter initialEntries={['/gastos-fijos/a']}>
        <Routes>
          <Route path="/gastos-fijos" element={<p>Lista</p>} />
          <Route path="/gastos-fijos/:id" element={<RecurringDetail />} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )

test('precarga el gasto y muestra el historial del más reciente al más antiguo', () => {
  renderDetail()
  expect(screen.getByLabelText('Nombre')).toHaveValue('Renta')
  const rows = screen.getAllByRole('listitem').map((li) => li.textContent)
  expect(rows[0]).toContain('$8,500.00')
  expect(rows[1]).toContain('$8,000.00')
})

test('pausar cambia el estado del gasto', () => {
  renderDetail()
  fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
  expect(api.setRecurringActive).toHaveBeenCalledWith('owner', 'a', false)
})

test('eliminar pide confirmación y no borra si se cancela', () => {
  const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true)
  vi.stubGlobal('confirm', confirm)
  renderDetail()

  fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
  expect(api.deleteRecurring).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
  expect(api.deleteRecurring).toHaveBeenCalledWith('owner', 'a')
})

test('si el gasto no existe vuelve a la lista', () => {
  api.watchRecurringItem.mockImplementation((_uid, _id, onData) => (onData(null), () => {}))
  renderDetail()
  expect(screen.getByText('Lista')).toBeInTheDocument()
})

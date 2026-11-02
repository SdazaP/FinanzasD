import { fireEvent, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Movement, Saving } from './api'
import SavingDetail from './SavingDetail'

const api = vi.hoisted(() => ({
  watchSaving: vi.fn(),
  watchMovements: vi.fn(),
  updateSaving: vi.fn(),
  deleteSaving: vi.fn(),
  deleteMovement: vi.fn(),
  spendPlanned: vi.fn(),
}))
vi.mock('./api', () => api)

const viaje: Saving = { id: 'v', name: 'Viaje', balance: 130000, target: 500000 }
const movements: Movement[] = [
  { id: 'm3', type: 'withdrawal', amount: 20000, date: '2026-10-31' },
  { id: 'm2', type: 'deposit', amount: 50000, date: '2026-10-31' },
  { id: 'm1', type: 'deposit', amount: 100000, date: '2026-10-30', initial: true },
]

beforeEach(() => {
  api.watchSaving.mockImplementation((_uid, _id, onData) => (onData(viaje), () => {}))
  api.watchMovements.mockImplementation((_uid, _id, onData) => (onData(movements), () => {}))
  for (const fn of [api.updateSaving, api.deleteSaving, api.deleteMovement]) fn.mockResolvedValue(undefined)
  vi.stubGlobal('confirm', vi.fn(() => true))
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const renderDetail = () =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter initialEntries={['/ahorro/v']}>
        <Routes>
          <Route path="/ahorro" element={<p>Lista</p>} />
          <Route path="/ahorro/:id" element={<SavingDetail />} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )

test('muestra el historial con etiquetas y montos con signo', () => {
  renderDetail()
  const rows = screen.getAllByRole('listitem').map((li) => li.textContent)
  expect(rows[0]).toContain('Retiro')
  expect(rows[0]).toContain('-$200.00')
  expect(rows[2]).toContain('Saldo inicial')
  expect(screen.queryByLabelText('Saldo inicial')).not.toBeInTheDocument()
})

test('borrar un retiro revierte el saldo', () => {
  renderDetail()
  fireEvent.click(screen.getByRole('button', { name: 'Borrar retiro del 31 oct 2026' }))
  expect(api.deleteMovement).toHaveBeenCalledWith('owner', 'v', movements[0], [])
})

test('no deja borrar un aporte mayor al saldo', () => {
  api.watchSaving.mockImplementation((_uid, _id, onData) => (onData({ ...viaje, balance: 30000 }), () => {}))
  renderDetail()
  fireEvent.click(screen.getByRole('button', { name: 'Borrar aporte del 31 oct 2026' }))
  expect(api.deleteMovement).not.toHaveBeenCalled()
  expect(screen.getByRole('alert')).toHaveTextContent('quedaría negativo')
})

test('eliminar pide confirmación y si no existe vuelve a la lista', () => {
  renderDetail()
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar apartado' }))
  expect(api.deleteSaving).toHaveBeenCalledWith('owner', 'v')
})

test('apartado inexistente vuelve a la lista', () => {
  api.watchSaving.mockImplementation((_uid, _id, onData) => (onData(null), () => {}))
  renderDetail()
  expect(screen.getByText('Lista')).toBeInTheDocument()
})

test('un gasto planeado se gasta antes de tiempo con el monto real, sin pasar de lo apartado', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 2))
  api.spendPlanned.mockResolvedValue(undefined)
  const lentes: Saving = { id: 'v', name: 'Lentes', balance: 250000, target: 300000, deadline: '2027-03-15', planned: true, category: 'Salud' }
  api.watchSaving.mockImplementation((_uid, _id, onData) => (onData(lentes), () => {}))
  api.watchMovements.mockImplementation((_uid, _id, onData) => (onData([{ id: 'g', type: 'spent', amount: 1000, date: '2026-11-01' }]), () => {}))
  renderDetail()
  expect(screen.getByText('Gastado')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Gastar antes de tiempo' }))
  const input = screen.getByLabelText('Monto gastado')
  expect(input).toHaveValue('3000.00')
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
  expect(screen.getByText('Te faltan $500.00: aporta antes de gastar.')).toBeInTheDocument()
  expect(api.spendPlanned).not.toHaveBeenCalled()

  fireEvent.change(input, { target: { value: '2,400' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
  expect(api.spendPlanned).toHaveBeenCalledWith('owner', lentes, 240000)
  vi.useRealTimers()
})

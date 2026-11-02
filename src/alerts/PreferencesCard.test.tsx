import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import PreferencesCard from './PreferencesCard'

const mocks = vi.hoisted(() => ({ watchAlertSettings: vi.fn(), setExpenseRatio: vi.fn(), setPayFrequency: vi.fn() }))
vi.mock('./api', () => ({ DEFAULT_RATIO: 50, watchAlertSettings: mocks.watchAlertSettings, setExpenseRatio: mocks.setExpenseRatio }))
vi.mock('../money/api', () => ({ setPayFrequency: mocks.setPayFrequency }))

const settings = (ratioPct: number | null) => mocks.watchAlertSettings.mockImplementation((_u, onData) => (onData({ ratioPct, hidden: {} }), () => {}))

beforeEach(() => {
  settings(50)
  mocks.setExpenseRatio.mockResolvedValue(undefined)
  mocks.setPayFrequency.mockResolvedValue(undefined)
})

afterEach(() => vi.clearAllMocks())

test('cambia la frecuencia de cobro', () => {
  render(<PreferencesCard uid="owner" frequency="monthly" />)
  expect(screen.getByRole('radio', { name: 'Mensual' })).toBeChecked()
  fireEvent.click(screen.getByRole('radio', { name: 'Quincenal' }))
  expect(mocks.setPayFrequency).toHaveBeenCalledWith('owner', 'biweekly')
})

test('quincenal explica que cuenta con la segunda quincena', () => {
  render(<PreferencesCard uid="owner" frequency="biweekly" />)
  expect(screen.getByText('Si solo ha llegado un sueldo en el mes, cuento con la segunda quincena.')).toBeInTheDocument()
})

test('cambia el % validando entre 1 y 100', () => {
  render(<PreferencesCard uid="owner" frequency="monthly" />)
  expect(screen.getByText('Avisarme si gasto más del 50% de mis ingresos.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Cambiar %' }))
  const input = screen.getByLabelText('Avisarme si gasto más del … % de mis ingresos')
  expect(input).toHaveValue('50')

  for (const bad of ['0', '101', '40.5', '']) {
    fireEvent.change(input, { target: { value: bad } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('Escribe un número entero entre 1 y 100.')).toBeInTheDocument()
  }
  expect(mocks.setExpenseRatio).not.toHaveBeenCalled()

  fireEvent.change(input, { target: { value: '70' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  expect(mocks.setExpenseRatio).toHaveBeenCalledWith('owner', 70)
})

test('desactivar y volver a activar', () => {
  render(<PreferencesCard uid="owner" frequency="monthly" />)
  fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }))
  expect(mocks.setExpenseRatio).toHaveBeenCalledWith('owner', null)
})

test('desactivado ofrece activarlo con 50%', () => {
  settings(null)
  render(<PreferencesCard uid="owner" frequency="monthly" />)
  fireEvent.click(screen.getByRole('button', { name: 'Activar (50%)' }))
  expect(mocks.setExpenseRatio).toHaveBeenCalledWith('owner', 50)
})

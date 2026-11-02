import { fireEvent, render, screen, within } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Saving } from './api'
import SavingList from './SavingList'

const api = vi.hoisted(() => ({ watchSavings: vi.fn(), moveSaving: vi.fn() }))
vi.mock('./api', () => api)

const savings: Saving[] = [
  { id: 'v', name: 'Viaje', balance: 1000000, target: 3000000, deadline: '2026-12-15' },
  { id: 'e', name: 'Emergencias', balance: 500000 },
  { id: 'c', name: 'Coche', balance: 2500000, target: 2000000 },
  { id: 'p', name: 'Pantalla', balance: 100000, target: 400000, deadline: '2026-09-30' },
]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 31))
  api.watchSavings.mockImplementation((_uid, onData) => (onData(savings), () => {}))
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

const renderList = () =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter>
        <SavingList />
      </MemoryRouter>
    </AuthContext>,
  )

const card = (name: string) => screen.getByText(name).closest('li')!

test('muestra el total, el progreso y la sugerencia mensual', () => {
  renderList()
  expect(screen.getByText('$41,000.00')).toBeInTheDocument()

  const viaje = card('Viaje')
  expect(within(viaje).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33')
  expect(within(viaje).getByText(/Faltan \$20,000\.00/)).toBeInTheDocument()
  expect(within(viaje).getByText('Ahorra $6,666.67 al mes hasta diciembre de 2026')).toBeInTheDocument()

  expect(within(card('Emergencias')).queryByRole('progressbar')).not.toBeInTheDocument()
  expect(within(card('Coche')).getByText(/Meta alcanzada/)).toBeInTheDocument()
  expect(within(card('Pantalla')).getByText('La fecha ya pasó')).toBeInTheDocument()
})

test('aportar guarda un depósito una sola vez', async () => {
  let finish!: () => void
  api.moveSaving.mockReturnValue(new Promise<void>((ok) => (finish = ok)))
  renderList()

  fireEvent.click(screen.getByRole('button', { name: 'Aportar a Viaje' }))
  fireEvent.change(screen.getByLabelText('Monto a aportar'), { target: { value: '2,000' } })
  const confirm = screen.getByRole('button', { name: 'Confirmar' })
  fireEvent.click(confirm)
  fireEvent.click(confirm)

  expect(api.moveSaving).toHaveBeenCalledTimes(1)
  expect(api.moveSaving).toHaveBeenCalledWith('owner', savings[0], 'deposit', 200000, undefined, [])
  finish()
  await vi.waitFor(() => expect(screen.queryByLabelText('Monto a aportar')).not.toBeInTheDocument())
})

test('retirar más del saldo se rechaza y sin saldo no hay botón de retirar', () => {
  api.watchSavings.mockImplementation((_uid, onData) => (onData([...savings, { id: 'z', name: 'Vacío', balance: 0 }]), () => {}))
  renderList()

  fireEvent.click(screen.getByRole('button', { name: 'Retirar de Emergencias' }))
  fireEvent.change(screen.getByLabelText('Monto a retirar'), { target: { value: '6000' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
  expect(screen.getByText('No puedes retirar más del saldo ($5,000.00).')).toBeInTheDocument()
  expect(api.moveSaving).not.toHaveBeenCalled()

  expect(screen.queryByRole('button', { name: 'Retirar de Vacío' })).not.toBeInTheDocument()
})

import { render, screen, within } from '@testing-library/react'
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

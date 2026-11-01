import { fireEvent, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter } from 'react-router'
import { expect, test, vi } from 'vitest'
import App from './App'
import { AuthContext } from './auth/context'

vi.mock('./firebase', () => ({ auth: {}, db: {} }))
vi.mock('./recurring/api', () => ({ watchCategories: () => () => {}, watchRecurring: () => () => {} }))
vi.mock('./lib/periodPayments', () => ({ watchMonthPayments: () => () => {}, watchPeriodPayments: () => () => {} }))
vi.mock('./credits/api', () => ({ watchCredits: () => () => {} }))
vi.mock('./savings/api', () => ({ watchSavings: () => () => {} }))

const renderAt = (path: string) =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </AuthContext>,
  )

test('la barra inferior navega entre secciones', () => {
  renderAt('/')
  expect(screen.getByRole('heading', { name: 'Resumen' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('link', { name: 'Créditos' }))

  expect(screen.getByRole('heading', { name: 'Créditos' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Créditos' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current')
})

test('las subrutas mantienen activa su sección', () => {
  renderAt('/gastos-fijos/nuevo')
  expect(screen.getByRole('heading', { name: 'Gastos fijos' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Gastos' })).toHaveAttribute('aria-current', 'page')
})

test('el encabezado muestra el mes en curso y la fecha de hoy', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 1, 10, 0))
  renderAt('/creditos')
  expect(screen.getByText('Noviembre 2026')).toBeInTheDocument()
  expect(screen.getByText('domingo, 1 de noviembre')).toBeInTheDocument()
  vi.useRealTimers()
})

test('una ruta desconocida vuelve al inicio', () => {
  renderAt('/no-existe')
  expect(screen.getByRole('heading', { name: 'Resumen' })).toBeInTheDocument()
})

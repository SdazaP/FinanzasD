import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
vi.mock('./alerts/useAlerts', () => ({ useAlerts: () => ({ visible: [], hidden: [] }) }))
vi.mock('./spending/api', () => ({ watchMonthSpending: () => () => {}, watchCap: () => () => {}, watchSpendingCategories: () => () => {} }))

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

test('Hormiga mantiene activa la pestaña Gastos con su propio título', () => {
  renderAt('/gastos-hormiga')
  expect(screen.getByRole('heading', { name: 'Gastos hormiga' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Gastos' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Hormiga' })).toHaveAttribute('aria-current', 'page')
})

test('el ícono de historial solo aparece en Gastos y lleva a su página', () => {
  renderAt('/gastos-hormiga')
  expect(screen.getByRole('link', { name: 'Historial de gastos' })).toHaveAttribute('href', '/gastos-historial')
  expect(screen.queryByRole('link', { name: 'Historial' })).not.toBeInTheDocument() // ya no es pestaña
  cleanup()

  renderAt('/creditos')
  expect(screen.queryByRole('link', { name: 'Historial de gastos' })).not.toBeInTheDocument()
  cleanup()

  renderAt('/gastos-historial')
  expect(screen.getByRole('heading', { name: 'Historial', level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Historial de gastos' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Gastos' })).toHaveAttribute('aria-current', 'page')
})

test('un solo menú con el logo; en pantallas anchas los avisos van en una columna fija y no hay campana', () => {
  renderAt('/')
  expect(screen.getAllByRole('navigation', { name: 'Secciones' })).toHaveLength(1)
  expect(screen.getByRole('link', { name: 'FinanzasD, inicio' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('button', { name: /^Avisos,/ })).toBeInTheDocument()
  cleanup()

  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(min-width: 1280px)', addEventListener() {}, removeEventListener() {} }))
  renderAt('/')
  expect(screen.getByRole('complementary', { name: 'Avisos' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^Avisos,/ })).not.toBeInTheDocument()
  vi.unstubAllGlobals()
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

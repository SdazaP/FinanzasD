import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import AlertBell from './AlertBell'
import type { Alert } from './calc'

const mocks = vi.hoisted(() => ({ useAlerts: vi.fn(), hideAlert: vi.fn(), showAlert: vi.fn() }))
vi.mock('./useAlerts', () => ({ useAlerts: mocks.useAlerts }))
vi.mock('./api', () => ({ hideAlert: mocks.hideAlert, showAlert: mocks.showAlert }))
const upload = vi.hoisted(() => ({ failed: false, dismiss: vi.fn() }))
vi.mock('../lib/saved', () => ({ useUploadFailed: () => upload.failed, dismissUploadFailed: upload.dismiss }))

const left: Alert = { key: 'left-red', level: 'red', text: 'Te faltan $500.00 para cubrir lo que te queda por pagar este mes', href: '/gastos-fijos' }
const cap: Alert = { key: 'cap-yellow', level: 'yellow', text: 'Llevas el 85% de tu tope de gastos hormiga; te quedan $150.00', href: '/gastos-hormiga' }
const ratio: Alert = { key: 'ratio-yellow', level: 'yellow', text: 'Tus gastos del mes son el 60% de tus ingresos', href: '/cuentas' }

beforeEach(() => {
  mocks.useAlerts.mockReturnValue({ visible: [left, cap], hidden: [ratio] })
  mocks.hideAlert.mockResolvedValue(undefined)
  mocks.showAlert.mockResolvedValue(undefined)
})

afterEach(() => vi.clearAllMocks())

const renderBell = () =>
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<><AlertBell uid="owner" now="2026-11-20" /><p>Afuera</p></>} />
        <Route path="/gastos-fijos" element={<p>Pantalla de gastos fijos</p>} />
      </Routes>
    </MemoryRouter>,
  )

const bell = () => screen.getByRole('button', { name: /^Avisos,/ })

test('la campana dice cuántos avisos hay y el globo es rojo si alguno es urgente', () => {
  renderBell()
  expect(bell()).toHaveAccessibleName('Avisos, 2 activos')
  expect(within(bell()).getByText('2')).toHaveClass('bg-red-600')
})

test('sin avisos la campana no lleva número', () => {
  mocks.useAlerts.mockReturnValue({ visible: [], hidden: [] })
  renderBell()
  expect(bell()).toHaveAccessibleName('Avisos, 0 activos')
  fireEvent.click(bell())
  expect(screen.getByText('No tienes avisos.')).toBeInTheDocument()
})

test('el panel recibe el foco, muestra nivel y texto, y se cierra con Escape devolviendo el foco', () => {
  renderBell()
  fireEvent.click(bell())
  const panel = screen.getByRole('dialog', { name: 'Avisos' })
  expect(panel).toHaveFocus()
  expect(within(panel).getByRole('link', { name: /Urgente: Te faltan \$500\.00/ })).toHaveAttribute('href', '/gastos-fijos')
  expect(within(panel).getByRole('link', { name: /Atención: Llevas el 85%/ })).toHaveAttribute('href', '/gastos-hormiga')

  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(bell()).toHaveFocus()
})

test('tocar fuera cierra el panel y un aviso lleva a su pantalla', () => {
  renderBell()
  fireEvent.click(bell())
  fireEvent.pointerDown(screen.getByText('Afuera'))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  fireEvent.click(bell())
  fireEvent.click(screen.getByRole('link', { name: /Urgente/ }))
  expect(screen.getByText('Pantalla de gastos fijos')).toBeInTheDocument()
})

test('ocultar este mes y volver a mostrar', () => {
  renderBell()
  fireEvent.click(bell())
  fireEvent.click(screen.getAllByRole('button', { name: 'Ocultar este mes' })[1])
  expect(mocks.hideAlert).toHaveBeenCalledWith('owner', 'cap-yellow', '2026-11')

  fireEvent.click(screen.getByRole('button', { name: 'Mostrar ocultos (1)' }))
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
  expect(mocks.showAlert).toHaveBeenCalledWith('owner', 'ratio-yellow')
})

test('un cambio sin conexión que no se pudo subir cuenta como aviso urgente y se descarta', () => {
  upload.failed = true
  mocks.useAlerts.mockReturnValue({ visible: [cap], hidden: [] })
  renderBell()
  expect(bell()).toHaveAccessibleName('Avisos, 2 activos')
  expect(within(bell()).getByText('2')).toHaveClass('bg-red-600')
  fireEvent.click(bell())
  expect(screen.getByText(/No se pudo subir un cambio que hiciste sin conexión/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Entendido' }))
  expect(upload.dismiss).toHaveBeenCalled()
  upload.failed = false
})

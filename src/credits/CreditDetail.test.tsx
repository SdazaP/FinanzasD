import { fireEvent, render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import type { Credit } from './api'
import CreditDetail from './CreditDetail'

const api = vi.hoisted(() => ({
  watchCredit: vi.fn(),
  watchCreditPayments: vi.fn(),
  updateCredit: vi.fn(),
  deleteCredit: vi.fn(),
  deleteCreditPayment: vi.fn(),
}))
vi.mock('./api', () => api)
const cardsMock = vi.hoisted(() => ({ value: { cards: [] as Credit[], credits: [] as Credit[], loaded: true, liveCardIds: [] as string[] } }))
vi.mock('./useCards', () => ({ useCards: () => cardsMock.value }))

const tarjeta: Credit = { id: 'c', kind: 'card', name: 'BBVA', balance: 500000, limit: 2000000, nextDue: '2026-04-10', dayOfMonth: 10 }

beforeEach(() => {
  api.watchCredit.mockImplementation((_uid, _id, onData) => (onData(tarjeta), () => {}))
  api.watchCreditPayments.mockImplementation((_uid, _id, onData) => (onData([{ id: 'p1', dueDate: '2026-03-10', amount: 300000, paidAt: '2026-03-09' }]), () => {}))
  for (const fn of [api.updateCredit, api.deleteCredit, api.deleteCreditPayment]) fn.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const renderDetail = () =>
  render(
    <AuthContext value={{ uid: 'owner' } as User}>
      <MemoryRouter initialEntries={['/creditos/c']}>
        <Routes>
          <Route path="/creditos" element={<p>Lista</p>} />
          <Route path="/creditos/:id" element={<CreditDetail />} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )

test('precarga la tarjeta, muestra el historial y guarda el saldo actualizado', async () => {
  renderDetail()
  expect(screen.getByLabelText('Saldo actual')).toHaveValue('5000.00')
  expect(screen.getByText('$3,000.00')).toBeInTheDocument()
  expect(screen.getByText('Marzo 2026')).toBeInTheDocument()
  expect(screen.getByText('Pagado el 9 mar')).toBeInTheDocument()

  fireEvent.change(screen.getByLabelText('Saldo actual'), { target: { value: '7,250.50' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

  expect(await screen.findByText('Lista')).toBeInTheDocument()
  expect(api.updateCredit).toHaveBeenCalledWith('owner', 'c', {
    kind: 'card', name: 'BBVA', balance: 725050, limit: 2000000, nextDue: '2026-04-10', dayOfMonth: 10,
  })
})

test('eliminar pide confirmación', () => {
  vi.stubGlobal('confirm', vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true))
  renderDetail()
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar crédito' }))
  expect(api.deleteCredit).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar crédito' }))
  expect(api.deleteCredit).toHaveBeenCalledWith('owner', 'c')
})

test('si el crédito no existe vuelve a la lista', () => {
  api.watchCredit.mockImplementation((_uid, _id, onData) => (onData(null), () => {}))
  renderDetail()
  expect(screen.getByText('Lista')).toBeInTheDocument()
})

test('una tarjeta lista los MSI que usan su crédito', () => {
  const tele: Credit = { id: 't', kind: 'msi', name: 'Tele', cardId: 'c', total: 600000, months: 6, balance: 400000, nextDue: '2026-04-15', dayOfMonth: 15 }
  const pagado: Credit = { ...tele, id: 'x', name: 'Liquidado', balance: 0 }
  cardsMock.value = { cards: [tarjeta], credits: [tarjeta, tele, pagado], loaded: true, liveCardIds: ['c'] }
  renderDetail()
  const section = screen.getByRole('heading', { name: 'Meses sin intereses' }).parentElement!
  expect(section).toHaveTextContent('TeleFaltan $4,000.00')
  expect(section).not.toHaveTextContent('Liquidado')
  cardsMock.value = { cards: [], credits: [], loaded: true, liveCardIds: [] }
})

import { renderHook } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { useAlerts } from './useAlerts'

const mocks = vi.hoisted(() => ({
  useAccounts: vi.fn(),
  useMonthMoney: vi.fn(),
  watchMonthSpending: vi.fn(),
  watchCap: vi.fn(),
  watchAlertSettings: vi.fn(),
}))
vi.mock('../money/useAccounts', () => ({ useAccounts: mocks.useAccounts }))
vi.mock('../money/useMonthMoney', () => ({ useMonthMoney: mocks.useMonthMoney }))
vi.mock('../spending/api', () => ({ watchMonthSpending: mocks.watchMonthSpending, watchCap: mocks.watchCap }))
vi.mock('./api', () => ({ watchAlertSettings: mocks.watchAlertSettings }))
const cardsMock = vi.hoisted(() => ({ value: { cards: [] as object[], credits: [] as object[], loaded: true, liveCardIds: [] as string[] } }))
vi.mock('../credits/useCards', () => ({ useCards: () => cardsMock.value }))

beforeEach(() => {
  mocks.useAccounts.mockReturnValue({ accounts: [{ id: 'a', name: 'BBVA', type: 'debit', balance: 1000000 }] })
  // Ingresos del mes: $8,000 + quincena esperada $2,000 = $10,000
  mocks.useMonthMoney.mockReturnValue({ ready: true, left: 100, monthIncomes: [{ amount: 800000 }], expected: 200000, paid: 300000, pending: 200000 })
  mocks.watchMonthSpending.mockImplementation((_u, _f, _t, onData) => (onData([{ amount: 60000 }, { amount: 40000 }]), () => {}))
  mocks.watchCap.mockImplementation((_u, onData) => (onData(100000), () => {}))
  mocks.watchAlertSettings.mockImplementation((_u, onData) => (onData({ ratioPct: 50, hidden: {} }), () => {}))
})

test('gastos = pagado + pendiente + hormiga, contra ingresos con la quincena esperada', () => {
  const { result } = renderHook(() => useAlerts('owner', '2026-11-01'))
  expect(mocks.useMonthMoney).toHaveBeenCalledWith('owner', '2026-11-01', 1000000)
  // $3,000 + $2,000 + $1,000 = $6,000 de $10,000 → 60%; el tope de $1,000 está lleno
  expect(result.current.visible.map((a) => a.text)).toEqual(['Llegaste a tu tope de gastos hormiga', 'Tus gastos del mes son el 60% de tus ingresos'])
})

test('los ocultos de este mes van aparte', () => {
  mocks.watchAlertSettings.mockImplementation((_u, onData) => (onData({ ratioPct: 50, hidden: { 'cap-red': '2026-11' } }), () => {}))
  const { result } = renderHook(() => useAlerts('owner', '2026-11-20'))
  expect(result.current.visible.map((a) => a.key)).toEqual(['ratio-yellow'])
  expect(result.current.hidden.map((a) => a.key)).toEqual(['cap-red'])
})

test('mientras carga no muestra avisos', () => {
  mocks.useMonthMoney.mockReturnValue({ ready: false })
  const { result } = renderHook(() => useAlerts('owner', '2026-11-01'))
  expect(result.current.visible).toEqual([])
})

test('una tarjeta cerca de su límite (contando sus MSI) avisa', () => {
  const oro = { id: 'oro', kind: 'card', name: 'Oro', balance: 600000, limit: 1000000 }
  cardsMock.value = { cards: [oro], credits: [oro, { kind: 'msi', cardId: 'oro', balance: 350000 }], loaded: true, liveCardIds: ['oro'] }
  const { result } = renderHook(() => useAlerts('owner', '2026-11-01'))
  expect(result.current.visible.map((a) => a.text)).toContain('Oro: usas el 95% de tu límite')
  cardsMock.value = { cards: [], credits: [], loaded: true, liveCardIds: [] }
})

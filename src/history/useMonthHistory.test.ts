import { renderHook } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { useMonthHistory } from './useMonthHistory'

const m = vi.hoisted(() => ({
  watchRecurring: vi.fn(), watchCredits: vi.fn(), watchMonthSpending: vi.fn(), watchMonthPaymentDocs: vi.fn(), watchSavings: vi.fn(), watchMonthMovements: vi.fn(),
}))
vi.mock('../recurring/api', () => ({ watchRecurring: m.watchRecurring }))
vi.mock('../credits/api', () => ({ watchCredits: m.watchCredits }))
vi.mock('../spending/api', () => ({ watchMonthSpending: m.watchMonthSpending }))
vi.mock('../lib/periodPayments', () => ({ watchMonthPaymentDocs: m.watchMonthPaymentDocs }))
vi.mock('../savings/api', () => ({ watchSavings: m.watchSavings, watchMonthMovements: m.watchMonthMovements }))

beforeEach(() => {
  m.watchRecurring.mockImplementation((_u, onData) => (onData([{ id: 'tel', name: 'Plan Telcel' }]), () => {}))
  m.watchCredits.mockImplementation((_u, onData) => (onData([{ id: 'exc', kind: 'msi', name: 'Excavadora' }, { id: 'nu', kind: 'card', name: 'Nu' }]), () => {}))
  m.watchMonthSpending.mockImplementation((_u, _f, _t, onData) => (onData([{ id: 'a', amount: 4500, date: '2026-10-03', category: 'Café', note: 'Oxxo' }]), () => {}))
  const docs: Record<string, object[]> = {
    tel: [{ id: 'p1', amount: 29900, date: '2026-10-05' }],
    exc: [{ id: 'p2', amount: 27810, date: '2026-10-06' }],
    nu: [{ id: 'p3', amount: 100000, date: '2026-10-20' }],
  }
  m.watchMonthPaymentDocs.mockImplementation((_u, _col, id, _f, _t, onData) => (onData(docs[id] ?? []), () => {}))
  m.watchSavings.mockImplementation((_u, onData) => (onData([{ id: 'viaje', name: 'Viaje', balance: 1 }]), () => {}))
  m.watchMonthMovements.mockImplementation((_u, _id, _f, _t, onData) => (onData([]), () => {}))
})

test('reúne los gastos del mes elegido con su tipo y enlace', () => {
  const { result } = renderHook(() => useMonthHistory('owner', '2026-10-15'))
  expect(m.watchMonthSpending.mock.calls[0].slice(1, 3)).toEqual(['2026-10-01', '2026-10-31'])
  expect(m.watchMonthPaymentDocs.mock.calls[0].slice(3, 5)).toEqual([new Date(2026, 9, 1), new Date(2026, 10, 1)])
  expect(result.current.ready).toBe(true)
  expect(result.current.entries.map((e) => [e.kind, e.label, e.amount, e.date, e.href])).toEqual([
    ['spending', 'Café · Oxxo', 4500, '2026-10-03', '/gastos-hormiga/a'],
    ['fixed', 'Plan Telcel', 29900, '2026-10-05', '/gastos-fijos/tel'],
    ['msi', 'Excavadora', 27810, '2026-10-06', '/creditos/exc'],
    ['card', 'Nu', 100000, '2026-10-20', '/creditos/nu'],
  ])
})

test('mientras no llegan los pagos no está listo', () => {
  m.watchMonthPaymentDocs.mockImplementation(() => () => {})
  const { result } = renderHook(() => useMonthHistory('owner', '2026-10-15'))
  expect(result.current.ready).toBe(false)
})

test('gastos planeados: el gastado suma en su día, el por venir aparece en su fecha y marca hasta dónde navegar', () => {
  m.watchSavings.mockImplementation((_u, onData) => (
    onData([
      { id: 'bici', name: 'Bici', balance: 0, target: 400000, deadline: '2026-10-25', planned: true, spentAt: '2026-10-20' },
      { id: 'lentes', name: 'Lentes', balance: 0, target: 300000, deadline: '2026-10-28', planned: true },
      { id: 'tele', name: 'Tele', balance: 0, target: 900000, deadline: '2027-06-01', planned: true },
    ]),
    () => {}
  ))
  m.watchMonthMovements.mockImplementation((_u, id, _f, _t, onData) => (onData(id === 'bici' ? [{ id: 'g', type: 'spent', amount: 390000, date: '2026-10-20' }, { id: 'd', type: 'deposit', amount: 5, date: '2026-10-02' }] : []), () => {}))
  const { result } = renderHook(() => useMonthHistory('owner', '2026-10-15'))
  expect(m.watchMonthMovements).toHaveBeenCalledTimes(3) // solo los planeados
  const planned = result.current.entries.filter((e) => e.kind === 'planned' || e.kind === 'upcoming')
  expect(planned.map((e) => [e.kind, e.label, e.amount, e.date])).toEqual([
    ['planned', 'Bici', 390000, '2026-10-20'],
    ['upcoming', 'Lentes', 300000, '2026-10-28'],
  ])
  expect(result.current.lastPlanned).toBe('2027-06-01')
})

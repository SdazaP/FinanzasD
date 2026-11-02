import { renderHook } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { useMonthHistory } from './useMonthHistory'

const m = vi.hoisted(() => ({ watchRecurring: vi.fn(), watchCredits: vi.fn(), watchMonthSpending: vi.fn(), watchMonthPaymentDocs: vi.fn() }))
vi.mock('../recurring/api', () => ({ watchRecurring: m.watchRecurring }))
vi.mock('../credits/api', () => ({ watchCredits: m.watchCredits }))
vi.mock('../spending/api', () => ({ watchMonthSpending: m.watchMonthSpending }))
vi.mock('../lib/periodPayments', () => ({ watchMonthPaymentDocs: m.watchMonthPaymentDocs }))

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

import { describe, expect, test } from 'vitest'
import { goalSummary, monthsLeft, movementError, plannedSaved, spendError, totalSaved } from './calc'

test.each([
  ['2026-10-31', '2026-12-15', 3],
  ['2026-10-01', '2026-10-31', 1],
  ['2026-10-31', '2027-01-10', 4],
  ['2026-10-31', '2026-10-30', 0],
])('monthsLeft(%s, %s) → %i', (now, deadline, expected) => {
  expect(monthsLeft(now, deadline)).toBe(expected)
})

describe('goalSummary', () => {
  const now = '2026-10-31'

  test('sin objetivo', () => {
    expect(goalSummary({ balance: 5000 }, now)).toEqual({ status: 'no-target' })
  })

  test('con fecha: sugiere el aporte mensual redondeado hacia arriba', () => {
    expect(goalSummary({ balance: 1000000, target: 3000000, deadline: '2026-12-15' }, now)).toEqual({
      status: 'on-track', progress: 1 / 3, missing: 2000000, monthly: 666667,
    })
  })

  test('sin fecha: progreso y faltante, sin sugerencia', () => {
    expect(goalSummary({ balance: 500, target: 2000 }, now)).toEqual({ status: 'on-track', progress: 0.25, missing: 1500 })
  })

  test('meta alcanzada o superada', () => {
    expect(goalSummary({ balance: 2500, target: 2000, deadline: '2026-01-01' }, now)).toEqual({ status: 'reached', progress: 1, missing: 0 })
  })

  test('fecha pasada sin alcanzar', () => {
    expect(goalSummary({ balance: 500, target: 2000, deadline: '2026-10-30' }, now)).toEqual({ status: 'overdue', progress: 0.25, missing: 1500 })
  })
})

test('totalSaved suma saldos', () => {
  expect(totalSaved([{ balance: 100 }, { balance: 250 }])).toBe(350)
})

test.each([
  [null, 'deposit', 0, 'Escribe un monto mayor a $0.'],
  [0, 'withdrawal', 1000, 'Escribe un monto mayor a $0.'],
  [5000, 'deposit', 0, ''],
  [1001, 'withdrawal', 1000, 'No puedes retirar más del saldo ($10.00).'],
  [1000, 'withdrawal', 1000, ''],
] as const)('movementError(%j, %s, %i) → %j', (amount, type, balance, expected) => {
  expect(movementError(amount, type, balance)).toBe(expected)
})

test('spendError: con lo apartado, sin pasarse', () => {
  expect(spendError(null, 1000)).toBe('Escribe un monto mayor a $0.')
  expect(spendError(0, 1000)).toBe('Escribe un monto mayor a $0.')
  expect(spendError(1000, 1000)).toBe('')
  expect(spendError(500, 1000)).toBe('')
  expect(spendError(1500, 1000)).toBe('Te faltan $5.00: aporta antes de gastar.')
})

test('plannedSaved suma solo los planeados sin gastar', () => {
  expect(plannedSaved([{ balance: 100 }, { balance: 200, planned: true }, { balance: 300, planned: true, spentAt: '2026-11-01' }])).toBe(200)
})

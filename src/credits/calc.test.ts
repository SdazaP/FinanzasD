import { describe, expect, test } from 'vitest'
import { debtTotal, installments, msiSummary, paymentError } from './calc'

test('installments reparte el total y la última absorbe el redondeo', () => {
  expect(installments(100000, 3)).toEqual([33333, 33333, 33334])
  expect(installments(120000, 12)).toEqual(Array(12).fill(10000))
  expect(installments(100, 3)).toEqual([33, 33, 34])
})

describe('msiSummary', () => {
  const base = { total: 100000, months: 3, dayOfMonth: 31, nextDue: '2026-11-30' }

  test('compra nueva', () => {
    expect(msiSummary({ ...base, balance: 100000 })).toEqual({
      installment: 33333, paid: 0, remaining: 3, endDate: '2027-01-31', progress: 0, suggested: 33333,
    })
  })

  test('falta solo la última cuota (la del redondeo)', () => {
    expect(msiSummary({ ...base, balance: 33334, nextDue: '2027-01-31' })).toMatchObject({
      remaining: 1, endDate: '2027-01-31', suggested: 33334,
    })
  })

  test('saldo parcial después de un abono libre', () => {
    expect(msiSummary({ ...base, balance: 50000 })).toMatchObject({ paid: 50000, remaining: 2, progress: 0.5, suggested: 33333 })
  })

  test('liquidado', () => {
    expect(msiSummary({ ...base, balance: 0 })).toMatchObject({ remaining: 0, endDate: null, progress: 1, suggested: 0 })
  })
})

test('debtTotal suma los saldos', () => {
  expect(debtTotal([{ balance: 100 }, { balance: 0 }, { balance: 250 }])).toBe(350)
})

test.each([
  [null, 1000, 'Escribe un monto mayor a $0.'],
  [0, 1000, 'Escribe un monto mayor a $0.'],
  [-5, 1000, 'Escribe un monto mayor a $0.'],
  [1001, 1000, 'No puede ser mayor al saldo ($10.00).'],
  [1000, 1000, ''],
  [1, 1000, ''],
])('paymentError(%j, %i) → %j', (amount, balance, expected) => {
  expect(paymentError(amount, balance)).toBe(expected)
})

import { describe, expect, test } from 'vitest'
import { creditPaymentError, debtTotal, installments, msiSummary, paymentError } from './calc'

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

describe('creditPaymentError: un pago = un mes', () => {
  const msi = { kind: 'msi' as const, total: 100000, months: 3, balance: 100000, nextDue: '2026-11-30', dayOfMonth: 30 }
  test('MSI exige la cuota del mes exacta', () => {
    expect(creditPaymentError(msi, 33333)).toBe('')
    expect(creditPaymentError(msi, 66666)).toBe('En meses sin intereses se paga la cuota del mes ($333.33).')
    expect(creditPaymentError(msi, 100)).toBe('En meses sin intereses se paga la cuota del mes ($333.33).')
  })
  test('MSI: la última cuota absorbe el redondeo y un saldo menor se paga completo', () => {
    expect(creditPaymentError({ ...msi, balance: 33334 }, 33334)).toBe('')
    expect(creditPaymentError({ ...msi, balance: 20000 }, 20000)).toBe('')
    expect(creditPaymentError({ ...msi, balance: 20000 }, 33333)).toBe('En meses sin intereses se paga la cuota del mes ($200.00).')
  })
  test('tarjeta: cualquier monto de $0.01 al saldo', () => {
    const card = { kind: 'card' as const, balance: 500000 }
    expect(creditPaymentError(card, 1)).toBe('')
    expect(creditPaymentError(card, 500000)).toBe('')
    expect(creditPaymentError(card, 500001)).toBe('No puede ser mayor al saldo ($5,000.00).')
  })
})

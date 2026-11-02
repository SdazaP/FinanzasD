import { expect, test } from 'vitest'
import { accountActivity, availableTotal, expectedSecondHalf, incomeMonth, leftThisMonth, type ActivityEntry } from './calc'

test('availableTotal suma saldos, incluidos negativos', () => {
  expect(availableTotal([{ balance: 1500000 }, { balance: -20000 }, { balance: 0 }])).toBe(1480000)
})

test('leftThisMonth es disponible − pendiente más la quincena esperada', () => {
  expect(leftThisMonth(2290869, 109510)).toBe(2181359)
  expect(leftThisMonth(100000, 400000)).toBe(-300000)
  expect(leftThisMonth(100000, 400000, 500000)).toBe(200000)
})

test('incomeMonth: solo el sueldo de los últimos 3 días cuenta para el mes siguiente', () => {
  expect(incomeMonth({ concept: 'Sueldo', date: '2026-10-28' })).toBe('2026-10')
  expect(incomeMonth({ concept: 'Sueldo', date: '2026-10-29' })).toBe('2026-11')
  expect(incomeMonth({ concept: 'Sueldo', date: '2026-10-31' })).toBe('2026-11')
  expect(incomeMonth({ concept: 'Sueldo', date: '2026-11-02' })).toBe('2026-11')
  expect(incomeMonth({ concept: 'Sueldo', date: '2026-12-30' })).toBe('2027-01')
  expect(incomeMonth({ concept: 'Sueldo', date: '2027-02-26' })).toBe('2027-03')
  expect(incomeMonth({ concept: 'Extra', date: '2026-10-30' })).toBe('2026-10')
})

test('expectedSecondHalf: solo quincenal y con un único sueldo en el mes', () => {
  const sueldo = (date: string, amount = 900000) => ({ concept: 'Sueldo' as const, date, amount })
  const extra = { concept: 'Extra' as const, date: '2026-11-05', amount: 15000 }
  expect(expectedSecondHalf([sueldo('2026-10-30'), extra], '2026-11', 'biweekly')).toBe(900000)
  expect(expectedSecondHalf([sueldo('2026-10-30'), sueldo('2026-11-15', 950000)], '2026-11', 'biweekly')).toBe(0)
  expect(expectedSecondHalf([sueldo('2026-10-30')], '2026-11', 'monthly')).toBe(0)
  expect(expectedSecondHalf([extra], '2026-11', 'biweekly')).toBe(0)
  // El sueldo del 28 de octubre es de octubre: en noviembre aún no llega ninguno
  expect(expectedSecondHalf([sueldo('2026-10-28')], '2026-11', 'biweekly')).toBe(0)
})

test('accountActivity filtra por cuenta y ordena del más reciente al más antiguo', () => {
  const entries: ActivityEntry[] = [
    { id: 'i1', label: 'Sueldo', amount: 1500000, date: '2026-11-01', accountId: 'nomina' },
    { id: 'p1', label: 'Renta', amount: -850000, date: '2026-11-03', accountId: 'nomina' },
    { id: 'g1', label: 'Café', amount: -4500, date: '2026-11-03', accountId: 'efectivo' },
    { id: 'old', label: 'Pago viejo', amount: -1000, date: '2026-11-02' },
  ]
  expect(accountActivity(entries, 'nomina').map((e) => e.id)).toEqual(['p1', 'i1'])
})

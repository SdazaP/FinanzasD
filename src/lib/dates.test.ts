import { describe, expect, test } from 'vitest'
import { addDays, monthlyTotal, nextDueAfter, status, today } from './dates'

describe('nextDueAfter', () => {
  test.each([
    ['2026-01-15', 15, '2026-02-15'],
    ['2026-01-31', 31, '2026-02-28'],
    ['2028-01-30', 30, '2028-02-29'],
    ['2026-02-28', 31, '2026-03-31'],
    ['2026-12-15', 15, '2027-01-15'],
  ])('%s (día %i) → %s', (due, day, expected) => {
    expect(nextDueAfter(due, day)).toBe(expected)
  })
})

describe('status', () => {
  const now = '2026-03-10'
  test.each([
    ['2026-03-09', 'overdue'],
    ['2026-03-10', 'soon'],
    ['2026-03-17', 'soon'],
    ['2026-03-18', 'ok'],
  ])('%s → %s', (due, expected) => {
    expect(status(due, now)).toBe(expected)
  })
})

test('addDays cruza fin de mes y de año', () => {
  expect(addDays('2026-12-28', 7)).toBe('2027-01-04')
})

test('monthlyTotal suma solo los activos', () => {
  expect(
    monthlyTotal([
      { amount: 1000, active: true },
      { amount: 250, active: true },
      { amount: 9999, active: false },
    ]),
  ).toBe(1250)
})

test('today usa la fecha local en formato YYYY-MM-DD', () => {
  expect(today(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
})

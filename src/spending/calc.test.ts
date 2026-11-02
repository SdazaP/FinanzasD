import { describe, expect, test } from 'vitest'
import { capSummary, groupByDay, totalsByCategory, type Spending } from './calc'

const s = (id: string, date: string, amount: number, category = 'Café', createdAt = 0): Spending => ({ id, date, amount, category, createdAt })

describe('groupByDay', () => {
  test('agrupa por día, del más reciente al más antiguo, con Hoy, Ayer y subtotal', () => {
    const groups = groupByDay(
      [s('a', '2026-10-29', 5000), s('b', '2026-11-01', 4500, 'Café', 1), s('c', '2026-10-31', 12000), s('d', '2026-11-01', 3000, 'Antojos', 2)],
      '2026-11-01',
    )
    expect(groups.map((g) => [g.label, g.total, g.items.map((i) => i.id)])).toEqual([
      ['Hoy', 7500, ['d', 'b']],
      ['Ayer', 12000, ['c']],
      ['jueves 29 de oct', 5000, ['a']],
    ])
  })
})

test('totalsByCategory suma y ordena de mayor a menor', () => {
  expect(totalsByCategory([s('a', '2026-11-01', 4500, 'Café'), s('b', '2026-11-01', 12000, 'Salidas'), s('c', '2026-11-01', 3000, 'Café')])).toEqual([
    { category: 'Salidas', total: 12000 },
    { category: 'Café', total: 7500 },
  ])
})

describe('capSummary', () => {
  test.each([
    [5000, undefined, null],
    [5000, 20000, { progress: 0.25, remaining: 15000 }],
    [20000, 20000, { progress: 1, remaining: 0 }],
    [26000, 20000, { progress: 1, remaining: 0 }],
  ])('total %i con tope %s', (total, cap, expected) => {
    expect(capSummary(total, cap)).toEqual(expected)
  })
})

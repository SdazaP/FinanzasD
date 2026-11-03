import { expect, test } from 'vitest'
import type { HistoryEntry } from '../history/calc'
import { byCategory, compareText, lastMonths, monthTotals } from './calc'

let n = 0
const e = (category: string, amount: number, date = '2026-11-02', kind: HistoryEntry['kind'] = 'spending'): HistoryEntry =>
  ({ id: `${n++}`, kind, category, label: category, amount, date, href: '/' })

test('suma hormiga y fijos con el mismo nombre; créditos y planeados en su grupo; tarjeta y por venir no cuentan', () => {
  const { total, slices } = byCategory([
    e('Suscripción', 10000),
    e('Suscripción', 5000, '2026-11-03', 'fixed'),
    e('Créditos', 20000, '2026-11-01', 'msi'),
    e('Créditos', 99999, '2026-11-01', 'card'),
    e('Planeados', 7000, '2026-11-05', 'planned'),
    e('Planeados', 50000, '2026-11-20', 'upcoming'),
  ])
  expect(total).toBe(42000)
  expect(slices.map((s) => [s.name, s.amount, s.slot])).toEqual([
    ['Créditos', 20000, 1],
    ['Suscripción', 15000, 2],
    ['Planeados', 7000, 3],
  ])
  expect(slices.reduce((s, x) => s + x.pct, 0)).toBe(100)
})

test('más de 5 categorías: top 4 y el resto en Otros (gris); los % suman 100', () => {
  const { slices } = byCategory([e('A', 300), e('B', 300), e('C', 300), e('D', 100), e('E', 50), e('F', 50)])
  expect(slices.map((s) => [s.name, s.slot])).toEqual([['A', 1], ['B', 2], ['C', 3], ['D', 4], ['Otros', 0]])
  expect(slices.at(-1)!.amount).toBe(100)
  expect(slices.reduce((s, x) => s + x.pct, 0)).toBe(100)
})

test('5 categorías justas: la quinta conserva su nombre en gris', () => {
  const { slices } = byCategory([e('A', 50), e('B', 40), e('C', 30), e('D', 20), e('E', 10)])
  expect(slices.at(-1)).toMatchObject({ name: 'E', slot: 0 })
})

test('sin gastos no hay segmentos', () => {
  expect(byCategory([])).toEqual({ total: 0, slices: [] })
})

test('últimos 6 meses cruzando el año', () => {
  expect(lastMonths('2026-02-15')).toEqual(['2025-09-01', '2025-10-01', '2025-11-01', '2025-12-01', '2026-01-01', '2026-02-01'])
})

test('totales por mes: null antes del primer gasto, 0 si después no hubo gastos, el actual nunca null', () => {
  const totals = monthTotals([e('A', 1000, '2026-08-10'), e('A', 500, '2026-08-20'), e('B', 300, '2026-10-01')], '2026-11-03')
  expect(totals.map((t) => t.total)).toEqual([null, null, 1500, 0, 300, 0])
  expect(monthTotals([], '2026-11-03').map((t) => t.total)).toEqual([null, null, null, null, null, 0])
})

test('comparación con el mes pasado', () => {
  expect(compareText(1000, 225000)).toBe('Vas $2,240.00 por debajo del mes pasado')
  expect(compareText(5000, 4000)).toBe('Vas $10.00 por encima del mes pasado')
  expect(compareText(4000, 4000)).toBe('Igual que el mes pasado')
  expect(compareText(4000, null)).toBeNull()
  expect(compareText(4000, 0)).toBeNull()
})

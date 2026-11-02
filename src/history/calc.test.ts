import { expect, test } from 'vitest'
import { compactMXN, dayTotals, monthGrid, monthSummary, type HistoryEntry } from './calc'

test('monthGrid: semanas de domingo a sábado con huecos', () => {
  // Noviembre 2026 empieza en domingo y tiene 30 días
  const nov = monthGrid('2026-11-15')
  expect(nov[0]).toEqual(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'])
  expect(nov.at(-1)).toEqual(['2026-11-29', '2026-11-30', null, null, null, null, null])
  // Agosto 2026 empieza en sábado: 6 huecos antes y 6 semanas
  const ago = monthGrid('2026-08-01')
  expect(ago[0]).toEqual([null, null, null, null, null, null, '2026-08-01'])
  expect(ago).toHaveLength(6)
  // Febrero 2028 (bisiesto) termina en el 29; diciembre 2026 en el 31
  expect(monthGrid('2028-02-10').flat().filter(Boolean).at(-1)).toBe('2028-02-29')
  expect(monthGrid('2026-12-01').flat().filter(Boolean).at(-1)).toBe('2026-12-31')
  expect(monthGrid('2026-12-01').every((w) => w.length === 7)).toBe(true)
})

const e = (kind: HistoryEntry['kind'], amount: number, date: string): HistoryEntry => ({ id: `${kind}${date}${amount}`, kind, label: kind, amount, date, href: '/' })

test('totales por día y del mes: el pago de tarjeta no suma, los MSI sí', () => {
  const entries = [e('spending', 4500, '2026-11-03'), e('fixed', 29900, '2026-11-03'), e('msi', 27810, '2026-11-06'), e('card', 500000, '2026-11-06')]
  expect(dayTotals(entries)).toEqual({ '2026-11-03': 34400, '2026-11-06': 27810 })
  expect(monthSummary(entries)).toEqual({ total: 62210, spending: 4500, fixed: 29900, credits: 27810, planned: 0, upcoming: 0 })
  expect(monthSummary([])).toEqual({ total: 0, spending: 0, fixed: 0, credits: 0, planned: 0, upcoming: 0 })
})

test('un planeado gastado suma; uno por venir se muestra aparte y no suma', () => {
  const entries = [e('planned', 280000, '2027-03-10'), e('upcoming', 900000, '2027-03-20')]
  expect(dayTotals(entries)).toEqual({ '2027-03-10': 280000 })
  expect(monthSummary(entries)).toMatchObject({ total: 280000, planned: 280000, upcoming: 900000 })
})

test.each([
  [50, '$0.50'],
  [25800, '$258'],
  [99940, '$999'],
  [99960, '$1k'],
  [123400, '$1.2k'],
  [397890, '$4k'],
  [1234567, '$12k'],
  [12345600, '$123k'],
  [150000000, '$1.5M'],
])('compactMXN(%i) → %s', (cents, text) => {
  expect(compactMXN(cents)).toBe(text)
})

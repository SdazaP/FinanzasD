import { counts, type HistoryEntry } from '../history/calc'
import { formatMXN } from '../lib/money'

// slot 1–4: color de la gráfica (--color-chart-N); 0: "Otros", en gris
export type Slice = { name: string; amount: number; pct: number; slot: number }

const MAX_COLORS = 4

// Las 4 categorías más grandes y el resto en "Otros". pct son enteros que suman 100 (residuo mayor)
export function byCategory(entries: HistoryEntry[]): { total: number; slices: Slice[] } {
  const sums = new Map<string, number>()
  for (const e of entries) if (counts(e)) sums.set(e.category, (sums.get(e.category) ?? 0) + e.amount)
  const sorted = [...sums].filter(([, a]) => a > 0).sort((a, b) => b[1] - a[1])
  const total = sorted.reduce((s, [, a]) => s + a, 0)
  if (!total) return { total: 0, slices: [] }

  const top = sorted.length > MAX_COLORS + 1 ? sorted.slice(0, MAX_COLORS) : sorted.slice(0, MAX_COLORS + 1)
  const rest = sorted.slice(top.length).reduce((s, [, a]) => s + a, 0)
  const groups = [...top.map(([name, amount], i) => ({ name, amount, slot: i < MAX_COLORS ? i + 1 : 0 })), ...(rest ? [{ name: 'Otros', amount: rest, slot: 0 }] : [])]
  // Con 5 categorías justas, la quinta se pinta en gris pero conserva su nombre

  const exact = groups.map((g) => (g.amount / total) * 100)
  const pct = exact.map(Math.floor)
  let left = 100 - pct.reduce((s, p) => s + p, 0)
  ;[...exact.keys()].sort((a, b) => exact[b] - pct[b] - (exact[a] - pct[a])).forEach((i) => left-- > 0 && pct[i]++)
  return { total, slices: groups.map((g, i) => ({ ...g, pct: pct[i] })) }
}

const pad = (n: number) => String(n).padStart(2, '0')

// Primer día de cada uno de los últimos `n` meses, del más antiguo al actual
export function lastMonths(today: string, n = 6) {
  const [y, m] = today.split('-').map(Number)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(y, m - 1 - (n - 1 - i), 1)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
  })
}

// Total gastado por mes; null en los meses antes del primer gasto registrado (no son $0). El mes actual nunca es null
export function monthTotals(entries: HistoryEntry[], today: string, n = 6) {
  const months = lastMonths(today, n)
  const totals = new Map<string, number>()
  for (const e of entries) if (counts(e)) totals.set(e.date.slice(0, 7), (totals.get(e.date.slice(0, 7)) ?? 0) + e.amount)
  const first = [...totals.keys()].sort()[0]
  return months.map((month, i) => {
    const key = month.slice(0, 7)
    const known = i === n - 1 || (first !== undefined && key >= first)
    return { month, total: known ? (totals.get(key) ?? 0) : null }
  })
}

// "Vas $1,240.00 por debajo del mes pasado"; null si el mes pasado no tiene datos
export function compareText(current: number, previous: number | null) {
  if (!previous) return null
  const diff = current - previous
  if (diff === 0) return 'Igual que el mes pasado'
  return `Vas ${formatMXN(Math.abs(diff))} ${diff < 0 ? 'por debajo' : 'por encima'} del mes pasado`
}

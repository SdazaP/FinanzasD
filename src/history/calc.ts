// Un gasto visto en el historial. 'card' = pago de una tarjeta: se muestra, pero no suma (ya se contó al gastar con ella)
export type HistoryKind = 'spending' | 'fixed' | 'msi' | 'card'
export type HistoryEntry = { id: string; kind: HistoryKind; label: string; amount: number; date: string; href: string }

const pad = (n: number) => String(n).padStart(2, '0')

// Semanas del mes de domingo a sábado; null en los huecos antes del día 1 y después del último
export function monthGrid(date: string): (string | null)[][] {
  const [y, m] = date.split('-').map(Number)
  const first = new Date(y, m - 1, 1).getDay()
  const days = new Date(y, m, 0).getDate()
  const cells: (string | null)[] = [
    ...Array<null>(first).fill(null),
    ...Array.from({ length: days }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`),
  ]
  while (cells.length % 7) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
}

const counts = (e: HistoryEntry) => e.kind !== 'card'

export function dayTotals(entries: HistoryEntry[]) {
  const totals: Record<string, number> = {}
  for (const e of entries) if (counts(e)) totals[e.date] = (totals[e.date] ?? 0) + e.amount
  return totals
}

export function monthSummary(entries: HistoryEntry[]) {
  const sum = (kind: HistoryKind) => entries.filter((e) => e.kind === kind).reduce((s, e) => s + e.amount, 0)
  const spending = sum('spending')
  const fixed = sum('fixed')
  const credits = sum('msi')
  return { total: spending + fixed + credits, spending, fixed, credits }
}

// Monto corto para la celda del calendario: "$0.50", "$258", "$1.2 mil", "$1.5 M"
export function compactMXN(cents: number) {
  const pesos = cents / 100
  if (pesos < 1) return `$${pesos.toFixed(2)}`
  if (Math.round(pesos) < 1000) return `$${Math.round(pesos)}`
  const short = (n: number) => n.toFixed(1).replace(/\.0$/, '')
  return pesos < 999_950 ? `$${short(pesos / 1000)} mil` : `$${short(pesos / 1_000_000)} M`
}


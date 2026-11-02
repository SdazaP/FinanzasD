import { addDays } from '../lib/dates'

export type Spending = { id: string; amount: number; date: string; category: string; note?: string; accountId?: string; createdAt: number }

const dayLabel = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })

function labelFor(date: string, today: string) {
  if (date === today) return 'Hoy'
  if (date === addDays(today, -1)) return 'Ayer'
  const [y, m, d] = date.split('-').map(Number)
  return dayLabel.format(new Date(y, m - 1, d))
}

// Más reciente primero; dentro del mismo día, el último registrado arriba
export function groupByDay(items: Spending[], today: string) {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
  const groups: { date: string; label: string; total: number; items: Spending[] }[] = []
  for (const item of sorted) {
    let group = groups.at(-1)
    if (group?.date !== item.date) {
      group = { date: item.date, label: labelFor(item.date, today), total: 0, items: [] }
      groups.push(group)
    }
    group.total += item.amount
    group.items.push(item)
  }
  return groups
}

export function totalsByCategory(items: Spending[]) {
  const totals = new Map<string, number>()
  for (const i of items) totals.set(i.category, (totals.get(i.category) ?? 0) + i.amount)
  return [...totals].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)
}

export function capSummary(total: number, cap?: number) {
  if (!cap) return null
  return { progress: Math.min(total / cap, 1), remaining: Math.max(cap - total, 0), over: Math.max(total - cap, 0) }
}

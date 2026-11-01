// Fechas sin hora como 'YYYY-MM-DD' en hora local: new Date('YYYY-MM-DD') las leería en UTC
const pad = (n: number) => String(n).padStart(2, '0')
const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (date: string) => date.split('-').map(Number) as [number, number, number]

export const today = (now = new Date()) => format(now)

export function addDays(date: string, days: number) {
  const [y, m, d] = parse(date)
  return format(new Date(y, m - 1, d + days))
}

export function nextDueAfter(due: string, dayOfMonth: number) {
  const [y, m] = parse(due)
  const lastDay = new Date(y, m + 1, 0).getDate() // día 0 del mes siguiente = último del mes destino
  return format(new Date(y, m, Math.min(dayOfMonth, lastDay)))
}

export type DueStatus = 'overdue' | 'soon' | 'ok'

export function status(nextDue: string, now = today()): DueStatus {
  if (nextDue < now) return 'overdue'
  return nextDue <= addDays(now, 7) ? 'soon' : 'ok'
}

export const monthlyTotal = (items: { amount: number; active: boolean }[]) =>
  items.reduce((sum, item) => (item.active ? sum + item.amount : sum), 0)

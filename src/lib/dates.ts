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

// Primer y último día del mes de `date`
export function monthRange(date: string): [string, string] {
  const [y, m] = parse(date)
  return [format(new Date(y, m - 1, 1)), format(new Date(y, m, 0))]
}

export type DueStatus = 'overdue' | 'soon' | 'ok'

export function status(nextDue: string, now = today()): DueStatus {
  if (nextDue < now) return 'overdue'
  return nextDue <= addDays(now, 7) ? 'soon' : 'ok'
}

const dayMonth = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })
const dayMonthYear = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatDay(date: string, withYear = false) {
  const [y, m, d] = parse(date)
  return (withYear ? dayMonthYear : dayMonth).format(new Date(y, m - 1, d))
}

const monthName = new Intl.DateTimeFormat('es-MX', { month: 'long' })
const longDate = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

// 'Noviembre 2026' (Intl daría 'noviembre de 2026')
export function formatMonthLabel(date: string) {
  const [y, m] = parse(date)
  const name = monthName.format(new Date(y, m - 1, 1))
  return `${name[0].toUpperCase()}${name.slice(1)} ${y}`
}

// 'noviembre': para "Pagar cuota de noviembre"
export function formatMonthName(date: string) {
  const [y, m] = parse(date)
  return monthName.format(new Date(y, m - 1, 1))
}

// 'domingo, 1 de noviembre'
export function formatLongDate(date: string) {
  const [y, m, d] = parse(date)
  return longDate.format(new Date(y, m - 1, d))
}

export const monthlyTotal = (items: { amount: number; active: boolean }[]) =>
  items.reduce((sum, item) => (item.active ? sum + item.amount : sum), 0)

import { addDays, monthRange } from '../lib/dates'

export type AccountType = 'debit' | 'cash' | 'other'
export type Account = { id: string; name: string; type: AccountType; balance: number }

export const accountTypes: [AccountType, string][] = [['debit', 'Débito'], ['cash', 'Efectivo'], ['other', 'Otra']]

// Un movimiento de cualquier módulo visto desde una cuenta: monto con signo (+ entra, − sale)
export type ActivityEntry = { id: string; label: string; amount: number; date: string; accountId?: string }

export const availableTotal = (accounts: { balance: number }[]) => accounts.reduce((sum, a) => sum + a.balance, 0)

// Lo pagado, gastado y apartado desde una cuenta ya salió del disponible (SPEC-alerts, decisión 1)
export const leftThisMonth = (available: number, pending: number, expected = 0) => available - pending + expected

export type PayFrequency = 'monthly' | 'biweekly'
type IncomeLike = { concept: string; date: string; amount: number }

// Mes ('YYYY-MM') al que cuenta un ingreso: el sueldo de los últimos 3 días del mes es del siguiente
export function incomeMonth(income: { concept: string; date: string }) {
  const end = monthRange(income.date)[1]
  return income.concept === 'Sueldo' && income.date >= addDays(end, -2) ? addDays(end, 1).slice(0, 7) : income.date.slice(0, 7)
}

// Quincenal con un solo sueldo en el mes: se espera otro igual
export function expectedSecondHalf(incomes: IncomeLike[], month: string, frequency: PayFrequency) {
  if (frequency !== 'biweekly') return 0
  const sueldos = incomes.filter((i) => i.concept === 'Sueldo' && incomeMonth(i) === month)
  return sueldos.length === 1 ? sueldos[0].amount : 0
}

export const accountActivity = (entries: ActivityEntry[], accountId: string) =>
  entries.filter((e) => e.accountId === accountId).sort((a, b) => b.date.localeCompare(a.date))

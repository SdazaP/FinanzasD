export type AccountType = 'debit' | 'cash' | 'other'
export type Account = { id: string; name: string; type: AccountType; balance: number }

export const accountTypes: [AccountType, string][] = [['debit', 'Débito'], ['cash', 'Efectivo'], ['other', 'Otra']]

// Un movimiento de cualquier módulo visto desde una cuenta: monto con signo (+ entra, − sale)
export type ActivityEntry = { id: string; label: string; amount: number; date: string; accountId?: string }

export const availableTotal = (accounts: { balance: number }[]) => accounts.reduce((sum, a) => sum + a.balance, 0)

// Fórmula aprobada: ingresos − pagado − gastado − ahorrado neto − pendiente del mes
export const leftThisMonth = (m: { incomes: number; paid: number; spent: number; savedNet: number; pending: number }) =>
  m.incomes - m.paid - m.spent - m.savedNet - m.pending

// El saldo inicial de un apartado no salió de ninguna cuenta este mes, así que no cuenta
export function savingsNet(movements: { type: 'deposit' | 'withdrawal'; amount: number; date: string; initial?: boolean }[], from: string, to: string) {
  return movements
    .filter((m) => !m.initial && m.date >= from && m.date <= to)
    .reduce((sum, m) => sum + (m.type === 'deposit' ? m.amount : -m.amount), 0)
}

export const accountActivity = (entries: ActivityEntry[], accountId: string) =>
  entries.filter((e) => e.accountId === accountId).sort((a, b) => b.date.localeCompare(a.date))

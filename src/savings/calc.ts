import { formatMXN } from '../lib/money'

// Meses calendario desde el mes de `now` hasta el de `deadline`, contando el actual; 0 si ya pasó
export function monthsLeft(now: string, deadline: string) {
  if (deadline < now) return 0
  const [ny, nm] = now.split('-').map(Number)
  const [dy, dm] = deadline.split('-').map(Number)
  return (dy - ny) * 12 + (dm - nm) + 1
}

type Goal = { balance: number; target?: number; deadline?: string }

export function goalSummary({ balance, target, deadline }: Goal, now: string) {
  if (!target) return { status: 'no-target' as const }
  const progress = Math.min(balance / target, 1)
  const missing = Math.max(target - balance, 0)
  if (!missing) return { status: 'reached' as const, progress, missing }
  if (!deadline) return { status: 'on-track' as const, progress, missing }
  const months = monthsLeft(now, deadline)
  if (!months) return { status: 'overdue' as const, progress, missing }
  return { status: 'on-track' as const, progress, missing, monthly: Math.ceil(missing / months) }
}

export const totalSaved = (items: { balance: number }[]) => items.reduce((sum, s) => sum + s.balance, 0)

export function movementError(amount: number | null, type: 'deposit' | 'withdrawal', balance: number) {
  if (!amount || amount <= 0) return 'Escribe un monto mayor a $0.'
  if (type === 'withdrawal' && amount > balance) return `No puedes retirar más del saldo (${formatMXN(balance)}).`
  return ''
}

// Gastar un planeado: con lo apartado, sin pasarse
export function spendError(amount: number | null, balance: number) {
  if (!amount || amount <= 0) return 'Escribe un monto mayor a $0.'
  if (amount > balance) return `Te faltan ${formatMXN(amount - balance)}: aporta antes de gastar.`
  return ''
}

// Lo apartado para gastos planeados que aún no se gastan (va incluido en el total ahorrado)
export const plannedSaved = (items: { balance: number; planned?: true; spentAt?: string }[]) =>
  items.reduce((sum, s) => (s.planned && !s.spentAt ? sum + s.balance : sum), 0)

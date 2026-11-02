import { nextDueAfter } from '../lib/dates'
import { formatMXN } from '../lib/money'

export function installments(total: number, months: number) {
  const each = Math.round(total / months)
  return Array.from({ length: months }, (_, i) => (i === months - 1 ? total - each * (months - 1) : each))
}

type Msi = { total: number; months: number; balance: number; nextDue: string; dayOfMonth: number }

export function msiSummary({ total, months, balance, nextDue, dayOfMonth }: Msi) {
  const plan = installments(total, months)
  // Cuotas que faltan: las últimas del plan que alcanzan a cubrir el saldo
  let remaining = 0
  for (let covered = 0; covered < balance && remaining < months; remaining++) covered += plan[months - 1 - remaining]

  let endDate: string | null = remaining ? nextDue : null
  for (let i = 1; i < remaining; i++) endDate = nextDueAfter(endDate!, dayOfMonth)

  return {
    installment: plan[0],
    paid: total - balance,
    remaining,
    endDate,
    progress: total ? (total - balance) / total : 1,
    suggested: Math.min(balance, plan[months - remaining] ?? 0),
  }
}

export const debtTotal = (credits: { balance: number }[]) => credits.reduce((sum, c) => sum + c.balance, 0)

export function paymentError(amount: number | null, balance: number) {
  if (!amount || amount <= 0) return 'Escribe un monto mayor a $0.'
  if (amount > balance) return `No puede ser mayor al saldo (${formatMXN(balance)}).`
  return ''
}

type Payable = { kind: 'card'; balance: number } | (Msi & { kind: 'msi' })

// Un pago = un mes: en MSI solo se acepta la cuota de ese mes (no se adelantan ni juntan meses)
export function creditPaymentError(credit: Payable, amount: number | null) {
  if (credit.kind === 'msi') {
    const due = msiSummary(credit).suggested
    return amount === due ? '' : `En meses sin intereses se paga la cuota del mes (${formatMXN(due)}).`
  }
  return paymentError(amount, credit.balance)
}

// Crédito usado = deuda de contado + lo que falta de sus MSI (la deuda no incluye las mensualidades)
export function cardUsage(card: { id: string; balance: number; limit?: number }, credits: { kind: string; cardId?: string; balance: number }[]) {
  const msiPending = credits.filter((c) => c.kind === 'msi' && c.cardId === card.id).reduce((sum, c) => sum + c.balance, 0)
  const used = card.balance + msiPending
  return {
    debt: card.balance,
    msiPending,
    used,
    available: card.limit ? card.limit - used : null,
    ratio: card.limit ? used / card.limit : null,
  }
}

import type { Credit } from '../credits/api'
import { msiSummary } from '../credits/calc'
import { addDays, monthRange } from '../lib/dates'
import type { Recurring } from '../recurring/api'

export { monthRange }

export type Upcoming = { id: string; name: string; typeLabel: string; nextDue: string; amount: number; href: string }

// Lo que se pagaría hoy por cada crédito: saldo de la tarjeta o la cuota del MSI
const creditAmount = (c: Credit) => (c.kind === 'card' ? c.balance : msiSummary(c).suggested)

function due(recurring: Recurring[], credits: Credit[]): Upcoming[] {
  return [
    ...recurring
      .filter((r) => r.active)
      .map((r) => ({
        id: r.id, name: r.name, typeLabel: r.type === 'fixed' ? 'Gasto fijo' : 'Suscripción', nextDue: r.nextDue, amount: r.amount,
        href: `/gastos-fijos/${r.id}`,
      })),
    ...credits
      .filter((c) => c.balance > 0)
      .map((c) => ({
        id: c.id, name: c.name, typeLabel: c.kind === 'card' ? 'Tarjeta' : 'MSI', nextDue: c.nextDue, amount: creditAmount(c),
        href: `/creditos/${c.id}`,
      })),
  ]
}

export function upcoming(recurring: Recurring[], credits: Credit[], today: string) {
  const limit = addDays(today, 7)
  return due(recurring, credits)
    .filter((u) => u.nextDue <= limit)
    .sort((a, b) => a.nextDue.localeCompare(b.nextDue) || a.name.localeCompare(b.name, 'es'))
}

// Pagado = pagos registrados este mes; pendiente = lo que vence hasta fin de mes (incluye vencidos).
// Lo pagado ya movió su nextDue al mes siguiente, así que no cuenta dos veces.
export function monthCommitments(recurring: Recurring[], credits: Credit[], paid: number, today: string) {
  const [, end] = monthRange(today)
  const pending = due(recurring, credits)
    .filter((u) => u.nextDue <= end)
    .reduce((sum, u) => sum + u.amount, 0)
  return { paid, pending, total: paid + pending }
}

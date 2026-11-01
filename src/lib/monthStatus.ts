import { monthRange } from './dates'

export type MonthStatus = 'due' | 'paid' | 'later'

// Por pagar si vence a más tardar este mes (incluye vencidos). Si no, pagado cuando hay
// un pago cuyo periodo cae en este mes; si no hay, su primer vencimiento es más adelante.
export function monthStatus(nextDue: string, paidThisPeriod: boolean, today: string): MonthStatus {
  if (nextDue <= monthRange(today)[1]) return 'due'
  return paidThisPeriod ? 'paid' : 'later'
}

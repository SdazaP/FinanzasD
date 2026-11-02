import { Timestamp, collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { today } from './dates'

export type PaymentsCollection = 'recurring' | 'credits'
export type PeriodPayments = { amount: number; lastPaidAt: string | null }

const paymentsCol = (uid: string, col: PaymentsCollection, id: string) => collection(db, 'users', uid, col, id, 'payments')

// Pagos hechos (paidAt) en un rango de fechas: lo que usa Inicio para "pagado este mes".
// shortcut: una suscripción por gasto/crédito; si llegan a cientos, cambiar a una consulta collectionGroup con índice
export function watchMonthPayments(
  uid: string, col: PaymentsCollection, id: string, from: Date, to: Date, onData: (sum: number) => void,
) {
  return onSnapshot(
    query(paymentsCol(uid, col, id), where('paidAt', '>=', Timestamp.fromDate(from)), where('paidAt', '<', Timestamp.fromDate(to))),
    (snap) => onData(snap.docs.reduce((sum, d) => sum + (d.data().amount as number), 0)),
    () => onData(0),
  )
}

export type PaymentDoc = { id: string; amount: number; date: string; accountId?: string }

// Los pagos hechos en el rango, con su cuenta y fecha de pago (para la actividad de una cuenta).
// Se filtra por cuenta en el cliente: igualdad + rango en campos distintos pediría un índice compuesto.
export function watchMonthPaymentDocs(
  uid: string, col: PaymentsCollection, id: string, from: Date, to: Date, onData: (docs: PaymentDoc[]) => void,
) {
  return onSnapshot(
    query(paymentsCol(uid, col, id), where('paidAt', '>=', Timestamp.fromDate(from)), where('paidAt', '<', Timestamp.fromDate(to))),
    (snap) =>
      onData(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' })
          return { id: d.id, amount: data.amount, accountId: data.accountId, date: today((data.paidAt as Timestamp).toDate()) }
        }),
      ),
    () => onData([]),
  )
}

// Pagos cuyo periodo (dueDate) cae entre `from` y `to` ('YYYY-MM-DD'): lo que decide "Pagado este mes"
export function watchPeriodPayments(
  uid: string, col: PaymentsCollection, id: string, from: string, to: string, onData: (data: PeriodPayments) => void,
) {
  return onSnapshot(
    query(paymentsCol(uid, col, id), where('dueDate', '>=', from), where('dueDate', '<=', to)),
    (snap) => {
      let amount = 0
      let lastPaidAt: string | null = null
      snap.docs.forEach((d) => {
        const data = d.data({ serverTimestamps: 'estimate' })
        amount += data.amount as number
        const paidAt = data.paidAt ? today((data.paidAt as Timestamp).toDate()) : null
        if (paidAt && (!lastPaidAt || paidAt > lastPaidAt)) lastPaidAt = paidAt
      })
      onData({ amount, lastPaidAt })
    },
    () => onData({ amount: 0, lastPaidAt: null }),
  )
}

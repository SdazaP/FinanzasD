import { Timestamp, collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'

// shortcut: una suscripción por gasto/crédito; si llegan a cientos, cambiar a una consulta collectionGroup con índice
export function watchMonthPayments(
  uid: string, col: 'recurring' | 'credits', id: string, from: Date, to: Date, onData: (sum: number) => void,
) {
  return onSnapshot(
    query(
      collection(db, 'users', uid, col, id, 'payments'),
      where('paidAt', '>=', Timestamp.fromDate(from)),
      where('paidAt', '<', Timestamp.fromDate(to)),
    ),
    (snap) => onData(snap.docs.reduce((sum, d) => sum + (d.data().amount as number), 0)),
    () => onData(0),
  )
}

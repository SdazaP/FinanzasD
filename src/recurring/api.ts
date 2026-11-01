import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { nextDueAfter } from './dates'
import type { RecurringInput } from './RecurringForm'

export type Recurring = RecurringInput & { id: string; active: boolean }

const recurringCol = (uid: string) => collection(db, 'users', uid, 'recurring')

export function watchRecurring(uid: string, onData: (items: Recurring[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(recurringCol(uid), orderBy('nextDue')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Recurring)),
    onError,
  )
}

export const addRecurring = (uid: string, input: RecurringInput) =>
  addDoc(recurringCol(uid), { ...input, active: true, createdAt: serverTimestamp() })

// Registra el pago del periodo y avanza un mes, ambos o ninguno
export function payRecurring(uid: string, item: Recurring) {
  const ref = doc(recurringCol(uid), item.id)
  const batch = writeBatch(db)
  batch.set(doc(collection(ref, 'payments')), { dueDate: item.nextDue, paidAt: serverTimestamp(), amount: item.amount })
  batch.update(ref, { nextDue: nextDueAfter(item.nextDue, item.dayOfMonth) })
  return batch.commit()
}

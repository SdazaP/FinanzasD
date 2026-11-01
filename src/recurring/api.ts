import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
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

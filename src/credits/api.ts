import { addDoc, collection, doc, increment, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { nextDueAfter } from '../lib/dates'
import type { CreditInput } from './CreditForm'

export type Credit = CreditInput & { id: string }

const creditsCol = (uid: string) => collection(db, 'users', uid, 'credits')

export function watchCredits(uid: string, onData: (items: Credit[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(creditsCol(uid), orderBy('nextDue')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Credit)),
    onError,
  )
}

export const addCredit = (uid: string, input: CreditInput) => addDoc(creditsCol(uid), { ...input, createdAt: serverTimestamp() })

// Pago + saldo + fecha en un batch; increment evita pisar el saldo si se paga desde otra pestaña
export function payCredit(uid: string, credit: Credit, amount: number) {
  const ref = doc(creditsCol(uid), credit.id)
  const batch = writeBatch(db)
  batch.set(doc(collection(ref, 'payments')), { dueDate: credit.nextDue, paidAt: serverTimestamp(), amount })
  batch.update(ref, { balance: increment(-amount), nextDue: nextDueAfter(credit.nextDue, credit.dayOfMonth) })
  return batch.commit()
}

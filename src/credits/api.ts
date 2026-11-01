import {
  addDoc, collection, deleteDoc, deleteField, doc, getDocs, increment, onSnapshot, orderBy, query, serverTimestamp, updateDoc, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { nextDueAfter } from '../lib/dates'
import type { Payment } from '../lib/PaymentHistory'
import type { CreditInput } from './CreditForm'

export type Credit = CreditInput & { id: string }

const creditsCol = (uid: string) => collection(db, 'users', uid, 'credits')
const creditDoc = (uid: string, id: string) => doc(creditsCol(uid), id)
const paymentsCol = (uid: string, id: string) => collection(creditDoc(uid, id), 'payments')

// null = el crédito no existe (o se acaba de eliminar)
export function watchCredit(uid: string, id: string, onData: (credit: Credit | null) => void, onError: (e: Error) => void) {
  return onSnapshot(creditDoc(uid, id), (snap) => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Credit) : null), onError)
}

export function watchCreditPayments(uid: string, id: string, onData: (payments: Payment[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(paymentsCol(uid, id), orderBy('dueDate', 'desc')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment)),
    onError,
  )
}

// Los opcionales vacíos se borran explícitamente; updateDoc conservaría el valor anterior
export const updateCredit = (uid: string, id: string, input: CreditInput) =>
  updateDoc(
    creditDoc(uid, id),
    input.kind === 'card' ? { ...input, limit: input.limit ?? deleteField() } : { ...input, card: input.card ?? deleteField() },
  )

// shortcut: un batch admite 500 escrituras (~40 años de pagos mensuales), partirlo si algún día no alcanza
export async function deleteCredit(uid: string, id: string) {
  const payments = await getDocs(paymentsCol(uid, id))
  const batch = writeBatch(db)
  payments.forEach((p) => batch.delete(p.ref))
  batch.delete(creditDoc(uid, id))
  return batch.commit()
}

export const deleteCreditPayment = (uid: string, id: string, paymentId: string) => deleteDoc(doc(paymentsCol(uid, id), paymentId))

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
  const ref = creditDoc(uid, credit.id)
  const batch = writeBatch(db)
  batch.set(doc(paymentsCol(uid, credit.id)),{ dueDate: credit.nextDue, paidAt: serverTimestamp(), amount })
  batch.update(ref, { balance: increment(-amount), nextDue: nextDueAfter(credit.nextDue, credit.dayOfMonth) })
  return batch.commit()
}

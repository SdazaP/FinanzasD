import {
  addDoc, collection, deleteField, doc, getDocs, increment, onSnapshot, orderBy, query, serverTimestamp, updateDoc, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { applyAccountDelta } from '../lib/accountBalance'
import { nextDueAfter } from '../lib/dates'
import { creditPaymentError } from './calc'
import type { Payment } from '../lib/PaymentHistory'
import { toPayment } from '../lib/periodPayments'
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
    (snap) => onData(snap.docs.map(toPayment)),
    onError,
  )
}

// Los opcionales vacíos se borran explícitamente; updateDoc conservaría el valor anterior
export const updateCredit = (uid: string, id: string, input: CreditInput) =>
  updateDoc(
    creditDoc(uid, id),
    input.kind === 'card'
      ? { ...input, limit: input.limit ?? deleteField() }
      : { ...input, card: input.card ?? deleteField(), cardId: input.cardId ?? deleteField() },
  )

// shortcut: un batch admite 500 escrituras (~40 años de pagos mensuales), partirlo si algún día no alcanza
export async function deleteCredit(uid: string, id: string) {
  const payments = await getDocs(paymentsCol(uid, id))
  const batch = writeBatch(db)
  payments.forEach((p) => batch.delete(p.ref))
  batch.delete(creditDoc(uid, id))
  return batch.commit()
}

// Devuelve el dinero a la cuenta de origen; el saldo del crédito no cambia (ver SPEC-credits)
export function deleteCreditPayment(uid: string, id: string, payment: Payment, liveAccountIds: string[] = []) {
  const batch = writeBatch(db)
  batch.delete(doc(paymentsCol(uid, id), payment.id))
  applyAccountDelta(batch, uid, payment.accountId, payment.amount, liveAccountIds)
  return batch.commit()
}

export function watchCredits(uid: string, onData: (items: Credit[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(creditsCol(uid), orderBy('nextDue')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Credit)),
    onError,
  )
}

export const addCredit = (uid: string, input: CreditInput) => addDoc(creditsCol(uid), { ...input, createdAt: serverTimestamp() })

// Pago + saldo + fecha en un batch; increment evita pisar el saldo si se paga desde otra pestaña
export function payCredit(uid: string, credit: Credit, amount: number, accountId?: string, liveAccountIds: string[] = []) {
  const error = creditPaymentError(credit, amount)
  if (error) return Promise.reject(new Error(error))
  const ref = creditDoc(uid, credit.id)
  const batch = writeBatch(db)
  batch.set(doc(paymentsCol(uid, credit.id)), { dueDate: credit.nextDue, paidAt: serverTimestamp(), amount, ...(accountId && { accountId }) })
  batch.update(ref, { balance: increment(-amount), nextDue: nextDueAfter(credit.nextDue, credit.dayOfMonth) })
  applyAccountDelta(batch, uid, accountId, -amount, liveAccountIds)
  return batch.commit()
}

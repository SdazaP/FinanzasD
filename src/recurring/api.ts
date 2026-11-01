import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { nextDueAfter } from './dates'
import type { RecurringInput } from './RecurringForm'

export type Recurring = RecurringInput & { id: string; active: boolean }
export type Payment = { id: string; dueDate: string; amount: number }

const recurringCol = (uid: string) => collection(db, 'users', uid, 'recurring')
const recurringDoc = (uid: string, id: string) => doc(recurringCol(uid), id)
const paymentsCol = (uid: string, id: string) => collection(recurringDoc(uid, id), 'payments')

export function watchRecurring(uid: string, onData: (items: Recurring[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(recurringCol(uid), orderBy('nextDue')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Recurring)),
    onError,
  )
}

// null = el gasto no existe (o se acaba de eliminar)
export function watchRecurringItem(uid: string, id: string, onData: (item: Recurring | null) => void, onError: (e: Error) => void) {
  return onSnapshot(
    recurringDoc(uid, id),
    (snap) => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Recurring) : null),
    onError,
  )
}

export function watchPayments(uid: string, id: string, onData: (payments: Payment[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(paymentsCol(uid, id), orderBy('dueDate', 'desc')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment)),
    onError,
  )
}

export const addRecurring = (uid: string, input: RecurringInput) =>
  addDoc(recurringCol(uid), { ...input, active: true, createdAt: serverTimestamp() })

export const updateRecurring = (uid: string, id: string, input: RecurringInput) => updateDoc(recurringDoc(uid, id), input)

export const setRecurringActive = (uid: string, id: string, active: boolean) => updateDoc(recurringDoc(uid, id), { active })

// Registra el pago del periodo y avanza un mes, ambos o ninguno
export function payRecurring(uid: string, item: Recurring) {
  const ref = recurringDoc(uid, item.id)
  const batch = writeBatch(db)
  batch.set(doc(paymentsCol(uid, item.id)), { dueDate: item.nextDue, paidAt: serverTimestamp(), amount: item.amount })
  batch.update(ref, { nextDue: nextDueAfter(item.nextDue, item.dayOfMonth) })
  return batch.commit()
}

// Borra el gasto y sus pagos juntos para no dejar pagos huérfanos.
// shortcut: un batch admite 500 escrituras (~40 años de pagos mensuales), partirlo si algún día no alcanza
export async function deleteRecurring(uid: string, id: string) {
  const payments = await getDocs(paymentsCol(uid, id))
  const batch = writeBatch(db)
  payments.forEach((p) => batch.delete(p.ref))
  batch.delete(recurringDoc(uid, id))
  return batch.commit()
}

const categoriesCol = (uid: string) => collection(db, 'users', uid, 'categories')

export function watchCategories(uid: string, onData: (names: string[]) => void) {
  // Si falla la lectura, el formulario sigue con las categorías por defecto
  return onSnapshot(categoriesCol(uid), (snap) => onData(snap.docs.map((d) => d.data().name as string)), () => onData([]))
}

export const addCategory = (uid: string, name: string) => addDoc(categoriesCol(uid), { name })

export const deletePayment =(uid: string, id: string, paymentId: string) => deleteDoc(doc(paymentsCol(uid, id), paymentId))

import {
  Timestamp, addDoc, collection, deleteField, doc, onSnapshot, query, serverTimestamp, setDoc, where, writeBatch,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase'
import { saved } from '../lib/saved'
import { applyMoneyChange, applyMoneyDelta } from '../lib/accountBalance'
import { isPastMonth, today } from '../lib/dates'
import type { Spending } from './calc'

export type SpendingInput = { amount: number; date: string; category: string; note?: string; accountId?: string; cardId?: string }

const spendingCol = (uid: string) => collection(db, 'users', uid, 'spending')
const categoriesCol = (uid: string) => collection(db, 'users', uid, 'spendingCategories')
const capDoc = (uid: string) => doc(db, 'users', uid, 'settings', 'spending')

// createdAt pendiente (recién guardado) se estima para poder ordenar al instante
const toSpending = (d: DocumentSnapshot): Spending => {
  const data = d.data({ serverTimestamps: 'estimate' })!
  return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? Date.now() } as Spending
}

// Rango del mes por `date`; el orden se hace en el cliente para no requerir un índice compuesto
export function watchMonthSpending(uid: string, from: string, to: string, onData: (items: Spending[]) => void, onError: (e: Error) => void) {
  return onSnapshot(query(spendingCol(uid), where('date', '>=', from), where('date', '<=', to)), (snap) => onData(snap.docs.map(toSpending)), onError)
}

// null = el gasto no existe (o se acaba de eliminar)
export function watchSpending(uid: string, id: string, onData: (item: Spending | null) => void, onError: (e: Error) => void) {
  return onSnapshot(doc(spendingCol(uid), id), (snap) => onData(snap.exists() ? toSpending(snap) : null), onError)
}

// Un gasto de un mes anterior es historial: se guarda sin cuenta ni tarjeta y no mueve saldos
function asHistory(input: SpendingInput): SpendingInput {
  if (!isPastMonth(input.date, today())) return input
  const { accountId: _a, cardId: _c, ...rest } = input
  return rest
}

export function addSpending(uid: string, data: SpendingInput, liveAccountIds: string[] = []) {
  const input = asHistory(data)
  const batch = writeBatch(db)
  batch.set(doc(spendingCol(uid)), { ...input, createdAt: serverTimestamp() })
  applyMoneyDelta(batch, uid, input, -input.amount, liveAccountIds)
  return saved(batch.commit())
}

// Devuelve el gasto anterior a su cuenta o tarjeta y cobra el nuevo (puede ser otro origen u otro monto).
// La nota, la cuenta y la tarjeta vacías se borran explícitamente; updateDoc conservaría las anteriores.
export function updateSpending(uid: string, old: Spending, data: SpendingInput, liveAccountIds: string[] = []) {
  const input = asHistory(data)
  const batch = writeBatch(db)
  batch.update(doc(spendingCol(uid), old.id), {
    ...input, note: input.note ?? deleteField(), accountId: input.accountId ?? deleteField(), cardId: input.cardId ?? deleteField(),
  })
  applyMoneyChange(batch, uid, old, input, liveAccountIds)
  return saved(batch.commit())
}

export function deleteSpending(uid: string, item: Spending, liveAccountIds: string[] = []) {
  const batch = writeBatch(db)
  batch.delete(doc(spendingCol(uid), item.id))
  applyMoneyDelta(batch, uid, item, item.amount, liveAccountIds)
  return saved(batch.commit())
}

export function watchSpendingCategories(uid: string, onData: (names: string[]) => void) {
  // Si falla la lectura, el formulario sigue con las categorías por defecto
  return onSnapshot(categoriesCol(uid), (snap) => onData(snap.docs.map((d) => d.data().name as string)), () => onData([]))
}

export const addSpendingCategory = (uid: string, name: string) => saved(addDoc(categoriesCol(uid), { name }))

export function watchCap(uid: string, onData: (cap: number | undefined) => void) {
  return onSnapshot(capDoc(uid), (snap) => onData(snap.data()?.monthlyCap as number | undefined), () => onData(undefined))
}

export const setCap = (uid: string, cap: number | null) => saved(setDoc(capDoc(uid), { monthlyCap: cap ?? deleteField() }, { merge: true }))

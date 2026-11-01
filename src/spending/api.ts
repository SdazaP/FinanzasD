import {
  Timestamp, addDoc, collection, deleteDoc, deleteField, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Spending } from './calc'

export type SpendingInput = { amount: number; date: string; category: string; note?: string }

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

export const addSpending = (uid: string, input: SpendingInput) => addDoc(spendingCol(uid), { ...input, createdAt: serverTimestamp() })

// La nota vacía se borra explícitamente; updateDoc conservaría la anterior
export const updateSpending = (uid: string, id: string, input: SpendingInput) =>
  updateDoc(doc(spendingCol(uid), id), { ...input, note: input.note ?? deleteField() })

export const deleteSpending = (uid: string, id: string) => deleteDoc(doc(spendingCol(uid), id))

export function watchSpendingCategories(uid: string, onData: (names: string[]) => void) {
  // Si falla la lectura, el formulario sigue con las categorías por defecto
  return onSnapshot(categoriesCol(uid), (snap) => onData(snap.docs.map((d) => d.data().name as string)), () => onData([]))
}

export const addSpendingCategory = (uid: string, name: string) => addDoc(categoriesCol(uid), { name })

export function watchCap(uid: string, onData: (cap: number | undefined) => void) {
  return onSnapshot(capDoc(uid), (snap) => onData(snap.data()?.monthlyCap as number | undefined), () => onData(undefined))
}

export const setCap = (uid: string, cap: number | null) => setDoc(capDoc(uid), { monthlyCap: cap ?? deleteField() }, { merge: true })

import {
  collection, deleteField, doc, getDocs, increment, onSnapshot, orderBy, query, serverTimestamp, updateDoc, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { today } from '../lib/dates'
import type { NewSavingInput, SavingInput } from './SavingForm'

export type Saving = SavingInput & { id: string; balance: number }
export type MovementType = 'deposit' | 'withdrawal'
export type Movement = { id: string; type: MovementType; amount: number; date: string; initial?: boolean }

const savingsCol = (uid: string) => collection(db, 'users', uid, 'savings')
const savingDoc = (uid: string, id: string) => doc(savingsCol(uid), id)
const movementsCol = (uid: string, id: string) => collection(savingDoc(uid, id), 'movements')

export function watchSavings(uid: string, onData: (items: Saving[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(savingsCol(uid), orderBy('createdAt')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Saving)),
    onError,
  )
}

// null = el apartado no existe (o se acaba de eliminar)
export function watchSaving(uid: string, id: string, onData: (saving: Saving | null) => void, onError: (e: Error) => void) {
  return onSnapshot(savingDoc(uid, id), (snap) => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Saving) : null), onError)
}

export function watchMovements(uid: string, id: string, onData: (movements: Movement[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(movementsCol(uid, id), orderBy('createdAt', 'desc')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Movement)),
    onError,
  )
}

// Movimiento + saldo en un batch; increment evita pisar el saldo si se mueve desde otra pestaña
export function moveSaving(uid: string, saving: Saving, type: MovementType, amount: number) {
  const batch = writeBatch(db)
  batch.set(doc(movementsCol(uid, saving.id)), { type, amount, date: today(), createdAt: serverTimestamp() })
  batch.update(savingDoc(uid, saving.id), { balance: increment(type === 'deposit' ? amount : -amount) })
  return batch.commit()
}

// Borrar un movimiento deshace su efecto en el saldo, en el mismo batch
export function deleteMovement(uid: string, savingId: string, movement: Movement) {
  const batch = writeBatch(db)
  batch.delete(doc(movementsCol(uid, savingId), movement.id))
  batch.update(savingDoc(uid, savingId), { balance: increment(movement.type === 'deposit' ? -movement.amount : movement.amount) })
  return batch.commit()
}

// El saldo inicial queda también como primer movimiento, para que el historial sume el saldo
export function addSaving(uid: string, input: NewSavingInput) {
  const ref = doc(savingsCol(uid))
  const batch = writeBatch(db)
  batch.set(ref, { ...input, createdAt: serverTimestamp() })
  if (input.balance > 0) {
    batch.set(doc(movementsCol(uid, ref.id)), {
      type: 'deposit', amount: input.balance, date: today(), initial: true, createdAt: serverTimestamp(),
    })
  }
  return batch.commit()
}

// Los opcionales vacíos se borran explícitamente; updateDoc conservaría el valor anterior
export const updateSaving = (uid: string, id: string, input: SavingInput) =>
  updateDoc(savingDoc(uid, id), { name: input.name, target: input.target ?? deleteField(), deadline: input.deadline ?? deleteField() })

// shortcut: un batch admite 500 escrituras; partirlo si un apartado llega a ~500 movimientos
export async function deleteSaving(uid: string, id: string) {
  const movements = await getDocs(movementsCol(uid, id))
  const batch = writeBatch(db)
  movements.forEach((m) => batch.delete(m.ref))
  batch.delete(savingDoc(uid, id))
  return batch.commit()
}

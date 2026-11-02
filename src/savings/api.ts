import {
  collection, deleteField, doc, getDocs, increment, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { saved } from '../lib/saved'
import { applyAccountDelta } from '../lib/accountBalance'
import { today } from '../lib/dates'
import type { NewSavingInput, SavingInput } from './SavingForm'

export type Saving = SavingInput & { id: string; balance: number }
export type MovementType = 'deposit' | 'withdrawal'
// 'spent' = se gastó un gasto planeado: baja el apartado y no toca cuentas (el dinero salió al aportar)
export type Movement = { id: string; type: MovementType | 'spent'; amount: number; date: string; initial?: boolean; accountId?: string }

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

// Movimientos de un apartado con fecha en el rango (para el ahorro neto del mes)
export function watchMonthMovements(uid: string, id: string, from: string, to: string, onData: (movements: Movement[]) => void) {
  return onSnapshot(
    query(movementsCol(uid, id), where('date', '>=', from), where('date', '<=', to)),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Movement)),
    () => onData([]),
  )
}

export function watchMovements(uid: string, id: string, onData: (movements: Movement[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(movementsCol(uid, id), orderBy('createdAt', 'desc')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Movement)),
    onError,
  )
}

// Movimiento + saldo en un batch; increment evita pisar el saldo si se mueve desde otra pestaña
// Aportar saca dinero de la cuenta y retirar lo regresa
export function moveSaving(uid: string, saving: Saving, type: MovementType, amount: number, accountId?: string, liveAccountIds: string[] = []) {
  const sign = type === 'deposit' ? 1 : -1
  const batch = writeBatch(db)
  batch.set(doc(movementsCol(uid, saving.id)), { type, amount, date: today(), createdAt: serverTimestamp(), ...(accountId && { accountId }) })
  batch.update(savingDoc(uid, saving.id), { balance: increment(sign * amount) })
  applyAccountDelta(batch, uid, accountId, -sign * amount, liveAccountIds)
  return saved(batch.commit())
}

// Borrar un movimiento deshace su efecto en el apartado y en su cuenta, en el mismo batch
export function deleteMovement(uid: string, savingId: string, movement: Movement, liveAccountIds: string[] = []) {
  const sign = movement.type === 'deposit' ? 1 : -1
  const batch = writeBatch(db)
  batch.delete(doc(movementsCol(uid, savingId), movement.id))
  // Borrar un "Gastado" devuelve el dinero al apartado y lo vuelve a dejar pendiente de gastar
  batch.update(savingDoc(uid, savingId), { balance: increment(-sign * movement.amount), ...(movement.type === 'spent' && { spentAt: deleteField() }) })
  applyAccountDelta(batch, uid, movement.accountId, sign * movement.amount, liveAccountIds)
  return saved(batch.commit())
}

// Gastar un gasto planeado con lo apartado, en un batch: movimiento, saldo y fecha en que se gastó
export function spendPlanned(uid: string, saving: Saving, amount: number) {
  const date = today()
  const batch = writeBatch(db)
  batch.set(doc(movementsCol(uid, saving.id)), { type: 'spent', amount, date, createdAt: serverTimestamp() })
  batch.update(savingDoc(uid, saving.id), { balance: increment(-amount), spentAt: date })
  return saved(batch.commit())
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
  return saved(batch.commit())
}

// Los opcionales vacíos se borran explícitamente; updateDoc conservaría el valor anterior
export const updateSaving = (uid: string, id: string, input: SavingInput) =>
  saved(updateDoc(savingDoc(uid, id), { name: input.name, target: input.target ?? deleteField(), deadline: input.deadline ?? deleteField() }))

// shortcut: un batch admite 500 escrituras; partirlo si un apartado llega a ~500 movimientos
export async function deleteSaving(uid: string, id: string) {
  const movements = await getDocs(movementsCol(uid, id))
  const batch = writeBatch(db)
  movements.forEach((m) => batch.delete(m.ref))
  batch.delete(savingDoc(uid, id))
  return saved(batch.commit())
}

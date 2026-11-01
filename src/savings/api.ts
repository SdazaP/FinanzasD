import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { today } from '../lib/dates'
import type { NewSavingInput, SavingInput } from './SavingForm'

export type Saving = SavingInput & { id: string; balance: number }

const savingsCol = (uid: string) => collection(db, 'users', uid, 'savings')
const movementsCol = (uid: string, id: string) => collection(doc(savingsCol(uid), id), 'movements')

export function watchSavings(uid: string, onData: (items: Saving[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(savingsCol(uid), orderBy('createdAt')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Saving)),
    onError,
  )
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

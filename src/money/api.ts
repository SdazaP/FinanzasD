import {
  collection, deleteField, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { applyAccountDelta } from '../lib/accountBalance'
import { today } from '../lib/dates'
import type { Account, AccountType, PayFrequency } from './calc'

export type IncomeConcept = 'Sueldo' | 'Extra' | 'Reembolso' | 'Otro'
export type IncomeInput = { concept: IncomeConcept; amount: number; date: string; accountId: string; note?: string }
export type Income = IncomeInput & { id: string }

const accountsCol = (uid: string) => collection(db, 'users', uid, 'accounts')
const incomesCol = (uid: string) => collection(db, 'users', uid, 'incomes')
const settingsDoc = (uid: string) => doc(db, 'users', uid, 'settings', 'money')

export function watchAccounts(uid: string, onData: (accounts: Account[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(accountsCol(uid), orderBy('createdAt')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Account)),
    onError,
  )
}

export function watchDefaultAccount(uid: string, onData: (id: string | undefined) => void) {
  return onSnapshot(settingsDoc(uid), (snap) => onData(snap.data()?.defaultAccountId as string | undefined), () => onData(undefined))
}

export function watchPayFrequency(uid: string, onData: (f: PayFrequency) => void) {
  return onSnapshot(settingsDoc(uid), (snap) => onData(snap.data()?.payFrequency === 'biweekly' ? 'biweekly' : 'monthly'), () => onData('monthly'))
}

export const setPayFrequency = (uid: string, payFrequency: PayFrequency) => setDoc(settingsDoc(uid), { payFrequency }, { merge: true })

// La primera cuenta queda como predeterminada
export function addAccount(uid: string, input: { name: string; type: AccountType; balance: number }, makeDefault: boolean) {
  const ref = doc(accountsCol(uid))
  const batch = writeBatch(db)
  batch.set(ref, { ...input, createdAt: serverTimestamp() })
  if (makeDefault) batch.set(settingsDoc(uid), { defaultAccountId: ref.id }, { merge: true })
  return batch.commit().then(() => ref.id)
}

export const updateAccount = (uid: string, id: string, input: { name: string; type: AccountType }) => updateDoc(doc(accountsCol(uid), id), input)

export const setDefaultAccount = (uid: string, id: string) => setDoc(settingsDoc(uid), { defaultAccountId: id }, { merge: true })

// Los pagos y gastos que salieron de ella se conservan; solo dejan de mover saldo
export function deleteAccount(uid: string, id: string, wasDefault: boolean) {
  const batch = writeBatch(db)
  batch.delete(doc(accountsCol(uid), id))
  if (wasDefault) batch.set(settingsDoc(uid), { defaultAccountId: deleteField() }, { merge: true })
  return batch.commit()
}

// Guarda la diferencia como ajuste para no perder el historial
export function adjustBalance(uid: string, account: Account, newBalance: number) {
  const diff = newBalance - account.balance
  if (!diff) return Promise.resolve()
  const batch = writeBatch(db)
  batch.set(doc(collection(doc(accountsCol(uid), account.id), 'adjustments')), { amount: diff, date: today(), createdAt: serverTimestamp() })
  applyAccountDelta(batch, uid, account.id, diff, [account.id])
  return batch.commit()
}

export function watchMonthIncomes(uid: string, from: string, to: string, onData: (incomes: Income[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(incomesCol(uid), where('date', '>=', from), where('date', '<=', to)),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Income).sort((a, b) => b.date.localeCompare(a.date))),
    onError,
  )
}

export function addIncome(uid: string, input: IncomeInput, liveAccountIds: string[]) {
  const batch = writeBatch(db)
  batch.set(doc(incomesCol(uid)), { ...input, createdAt: serverTimestamp() })
  applyAccountDelta(batch, uid, input.accountId, input.amount, liveAccountIds)
  return batch.commit()
}

// Revierte el ingreso anterior en su cuenta y aplica el nuevo (puede ser otra cuenta)
export function updateIncome(uid: string, old: Income, input: IncomeInput, liveAccountIds: string[]) {
  const batch = writeBatch(db)
  batch.update(doc(incomesCol(uid), old.id), { ...input, note: input.note ?? deleteField() })
  if (old.accountId === input.accountId) {
    applyAccountDelta(batch, uid, input.accountId, input.amount - old.amount, liveAccountIds)
  } else {
    applyAccountDelta(batch, uid, old.accountId, -old.amount, liveAccountIds)
    applyAccountDelta(batch, uid, input.accountId, input.amount, liveAccountIds)
  }
  return batch.commit()
}

export function deleteIncome(uid: string, income: Income, liveAccountIds: string[]) {
  const batch = writeBatch(db)
  batch.delete(doc(incomesCol(uid), income.id))
  applyAccountDelta(batch, uid, income.accountId, -income.amount, liveAccountIds)
  return batch.commit()
}

export const watchAdjustments = (uid: string, accountId: string, from: string, to: string, onData: (items: { id: string; amount: number; date: string }[]) => void) =>
  onSnapshot(
    query(collection(doc(accountsCol(uid), accountId), 'adjustments'), where('date', '>=', from), where('date', '<=', to)),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as { id: string; amount: number; date: string })),
    () => onData([]),
  )

import { deleteField, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export type AlertSettings = { ratioPct: number | null; hidden: Record<string, string> }

export const DEFAULT_RATIO = 50

const settingsDoc = (uid: string) => doc(db, 'users', uid, 'settings', 'alerts')

const toSettings = (data: Record<string, unknown> | undefined): AlertSettings => ({
  ratioPct: data?.expenseRatioOff ? null : ((data?.expenseRatioPct as number | undefined) ?? DEFAULT_RATIO),
  hidden: (data?.hidden as Record<string, string> | undefined) ?? {},
})

export function watchAlertSettings(uid: string, onData: (s: AlertSettings) => void) {
  return onSnapshot(settingsDoc(uid), (snap) => onData(toSettings(snap.data())), () => onData(toSettings(undefined)))
}

// null desactiva el aviso de gastos sobre el ingreso
export const setExpenseRatio = (uid: string, pct: number | null) =>
  setDoc(settingsDoc(uid), pct === null ? { expenseRatioOff: true } : { expenseRatioPct: pct, expenseRatioOff: deleteField() }, { merge: true })

export const hideAlert = (uid: string, key: string, month: string) => setDoc(settingsDoc(uid), { hidden: { [key]: month } }, { merge: true })

export const showAlert = (uid: string, key: string) => setDoc(settingsDoc(uid), { hidden: { [key]: deleteField() } }, { merge: true })

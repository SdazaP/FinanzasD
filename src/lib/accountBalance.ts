import { doc, increment, type WriteBatch } from 'firebase/firestore'
import { db } from '../firebase'

// Agrega al batch el cambio de saldo de una cuenta. Se omite si el registro no tiene cuenta
// (anterior al módulo de cuentas) o si la cuenta ya fue eliminada: update fallaría el batch entero.
export function applyAccountDelta(batch: WriteBatch, uid: string, accountId: string | undefined, delta: number, liveAccountIds: string[]) {
  if (!accountId || !delta || !liveAccountIds.includes(accountId)) return
  batch.update(doc(db, 'users', uid, 'accounts', accountId), { balance: increment(delta) })
}

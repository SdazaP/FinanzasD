import { doc, increment, type WriteBatch } from 'firebase/firestore'
import { db } from '../firebase'

// Agrega al batch el cambio de saldo de una cuenta. Se omite si el registro no tiene cuenta
// (anterior al módulo de cuentas) o si la cuenta ya fue eliminada: update fallaría el batch entero.
export function applyAccountDelta(batch: WriteBatch, uid: string, accountId: string | undefined, delta: number, liveAccountIds: string[]) {
  if (!accountId || !delta || !liveAccountIds.includes(accountId)) return
  batch.update(doc(db, 'users', uid, 'accounts', accountId), { balance: increment(delta) })
}

// De dónde sale el dinero: una cuenta o una tarjeta de crédito. El selector usa 'card:{id}' para tarjetas.
export type MoneySource = { accountId?: string; cardId?: string }

export function toSource(value: string | undefined): MoneySource {
  if (!value) return {}
  return value.startsWith('card:') ? { cardId: value.slice(5) } : { accountId: value }
}

// delta desde tu bolsillo (− gastas, + te regresa). En una tarjeta es al revés: gastar sube su deuda (credits/{id}.balance).
// liveIds incluye cuentas y tarjetas vivas; una eliminada se omite para no fallar el batch.
export function applyMoneyDelta(batch: WriteBatch, uid: string, source: MoneySource, delta: number, liveIds: string[]) {
  applyAccountDelta(batch, uid, source.accountId, delta, liveIds)
  if (!source.cardId || !delta || !liveIds.includes(source.cardId)) return
  batch.update(doc(db, 'users', uid, 'credits', source.cardId), { balance: increment(-delta) })
}

const sourceKey = (s: MoneySource) => (s.cardId ? `card:${s.cardId}` : (s.accountId ?? ''))

// Editar un registro: si el origen es el mismo aplica la diferencia; si cambió, revierte el viejo y cobra el nuevo
export function applyMoneyChange(
  batch: WriteBatch, uid: string, old: MoneySource & { amount: number }, next: MoneySource & { amount: number }, liveIds: string[],
) {
  if (sourceKey(old) === sourceKey(next)) return applyMoneyDelta(batch, uid, next, old.amount - next.amount, liveIds)
  applyMoneyDelta(batch, uid, old, old.amount, liveIds)
  applyMoneyDelta(batch, uid, next, -next.amount, liveIds)
}

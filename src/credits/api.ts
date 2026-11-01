import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { CreditInput } from './CreditForm'

export type Credit = CreditInput & { id: string }

const creditsCol = (uid: string) => collection(db, 'users', uid, 'credits')

export function watchCredits(uid: string, onData: (items: Credit[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(creditsCol(uid), orderBy('nextDue')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Credit)),
    onError,
  )
}

export const addCredit = (uid: string, input: CreditInput) => addDoc(creditsCol(uid), { ...input, createdAt: serverTimestamp() })

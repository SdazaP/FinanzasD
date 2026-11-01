import { useEffect, useState } from 'react'
import { watchAccounts, watchDefaultAccount } from './api'
import type { Account } from './calc'

// Cuentas del usuario y la predeterminada (si no hay una marcada o se eliminó, la primera)
export function useAccounts(uid: string) {
  const [accounts, setAccounts] = useState<Account[]>()
  const [storedDefault, setStoredDefault] = useState<string>()
  const [error, setError] = useState(false)

  useEffect(() => watchAccounts(uid, setAccounts, () => setError(true)), [uid])
  useEffect(() => watchDefaultAccount(uid, setStoredDefault), [uid])

  const list = accounts ?? []
  const defaultId = list.some((a) => a.id === storedDefault) ? storedDefault : list[0]?.id
  return { accounts, defaultId, liveIds: list.map((a) => a.id), error }
}

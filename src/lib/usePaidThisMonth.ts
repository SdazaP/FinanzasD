import { useEffect, useState } from 'react'
import { monthRange } from './dates'
import { watchMonthPayments } from './periodPayments'

// Suma lo pagado este mes (por fecha de pago) en todos los gastos fijos y créditos: una suscripción por elemento
export function usePaidThisMonth(uid: string, recurringIds: string[], creditIds: string[], now: string) {
  const [paid, setPaid] = useState<Record<string, number>>({})
  const [from] = monthRange(now)
  const keys = [...recurringIds.map((id) => `recurring/${id}`), ...creditIds.map((id) => `credits/${id}`)]
  const keyList = keys.join(',')

  useEffect(() => {
    if (!keyList) return
    const [y, m] = from.split('-').map(Number)
    const unsubscribes = keyList.split(',').map((key) => {
      const [col, id] = key.split('/') as ['recurring' | 'credits', string]
      return watchMonthPayments(uid, col, id, new Date(y, m - 1, 1), new Date(y, m, 1), (sum) => setPaid((p) => ({ ...p, [`${from}/${key}`]: sum })))
    })
    return () => unsubscribes.forEach((u) => u())
  }, [uid, keyList, from])

  return keys.reduce((sum, key) => sum + (paid[`${from}/${key}`] ?? 0), 0)
}

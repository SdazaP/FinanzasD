import { useEffect, useState } from 'react'
import { monthRange } from './dates'
import { watchPeriodPayments, type PaymentsCollection, type PeriodPayments } from './periodPayments'

// Pagos del periodo del mes en curso por elemento. Un id sin entrada todavía no ha cargado.
export function usePeriodPayments(uid: string, col: PaymentsCollection, ids: string[], today: string) {
  const [data, setData] = useState<Record<string, PeriodPayments>>({})
  const idList = ids.join(',')
  const [from, to] = monthRange(today)

  useEffect(() => {
    if (!idList) return
    const unsubscribes = idList
      .split(',')
      .map((id) => watchPeriodPayments(uid, col, id, from, to, (d) => setData((prev) => ({ ...prev, [`${from}/${id}`]: d }))))
    return () => unsubscribes.forEach((u) => u())
  }, [uid, col, idList, from, to])

  // Las entradas se guardan por mes para no usar datos del mes anterior al cambiar de mes
  return (id: string): PeriodPayments | undefined => data[`${from}/${id}`]
}

import { useEffect, useState } from 'react'
import { watchCredits, type Credit } from '../credits/api'
import { monthCommitments } from '../dashboard/calc'
import { addDays, monthRange } from '../lib/dates'
import { watchRecurring, type Recurring } from '../recurring/api'
import { watchMonthIncomes, watchPayFrequency, type Income } from './api'
import { expectedSecondHalf, incomeMonth, leftThisMonth, type PayFrequency } from './calc'

// "Te queda este mes" = disponible − pendiente (+ segunda quincena esperada si el cobro es quincenal)
export function useMonthMoney(uid: string, now: string, available: number) {
  const [from, to] = monthRange(now)
  const month = from.slice(0, 7)
  // Desde 3 días antes: un sueldo adelantado del mes anterior cuenta para este
  const windowFrom = addDays(from, -3)
  const [recurring, setRecurring] = useState<Recurring[]>()
  const [credits, setCredits] = useState<Credit[]>()
  const [fetched, setFetched] = useState<Income[]>()
  const [frequency, setFrequency] = useState<PayFrequency>('monthly')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const fail = () => setFailed(true)
    const unsubscribes = [watchRecurring(uid, setRecurring, fail), watchCredits(uid, setCredits, fail), watchPayFrequency(uid, setFrequency)]
    return () => unsubscribes.forEach((u) => u())
  }, [uid])
  useEffect(() => watchMonthIncomes(uid, windowFrom, to, setFetched, () => setFailed(true)), [uid, windowFrom, to])

  const ready = !!(recurring && credits && fetched)
  const all = fetched ?? []
  const pending = monthCommitments(recurring ?? [], credits ?? [], 0, now).pending
  const expected = expectedSecondHalf(all, month, frequency)

  return {
    ready,
    failed,
    frequency,
    // Lista de Cuentas: mes calendario; avisos: el mes al que cuenta cada ingreso
    incomes: all.filter((i) => i.date >= from),
    monthIncomes: all.filter((i) => incomeMonth(i) === month),
    pending,
    expected,
    left: leftThisMonth(available, pending, expected),
  }
}

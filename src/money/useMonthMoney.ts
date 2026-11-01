import { useEffect, useState } from 'react'
import { watchCredits, type Credit } from '../credits/api'
import { monthCommitments } from '../dashboard/calc'
import { monthRange } from '../lib/dates'
import { usePaidThisMonth } from '../lib/usePaidThisMonth'
import { watchRecurring, type Recurring } from '../recurring/api'
import { watchMonthMovements, watchSavings, type Movement } from '../savings/api'
import { watchMonthSpending } from '../spending/api'
import type { Spending } from '../spending/calc'
import { watchMonthIncomes, type Income } from './api'
import { leftThisMonth, savingsNet } from './calc'

// Reúne los términos de "te queda este mes". shortcut: una suscripción por apartado para el ahorro neto;
// si llegan a decenas, guardar el neto del mes en el propio apartado.
export function useMonthMoney(uid: string, now: string) {
  const [from, to] = monthRange(now)
  const [recurring, setRecurring] = useState<Recurring[]>()
  const [credits, setCredits] = useState<Credit[]>()
  const [savingIds, setSavingIds] = useState<string[]>()
  const [spending, setSpending] = useState<Spending[]>()
  const [incomes, setIncomes] = useState<Income[]>()
  const [movements, setMovements] = useState<Record<string, Movement[]>>({})
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const fail = () => setFailed(true)
    const unsubscribes = [
      watchRecurring(uid, setRecurring, fail),
      watchCredits(uid, setCredits, fail),
      watchSavings(uid, (s) => setSavingIds(s.map((x) => x.id)), fail),
    ]
    return () => unsubscribes.forEach((u) => u())
  }, [uid])
  useEffect(() => watchMonthSpending(uid, from, to, setSpending, () => setFailed(true)), [uid, from, to])
  useEffect(() => watchMonthIncomes(uid, from, to, setIncomes, () => setFailed(true)), [uid, from, to])

  const savingList = (savingIds ?? []).join(',')
  useEffect(() => {
    if (!savingList) return
    const unsubscribes = savingList
      .split(',')
      .map((id) => watchMonthMovements(uid, id, from, to, (m) => setMovements((prev) => ({ ...prev, [`${from}/${id}`]: m }))))
    return () => unsubscribes.forEach((u) => u())
  }, [uid, savingList, from, to])

  const paid = usePaidThisMonth(uid, (recurring ?? []).map((r) => r.id), (credits ?? []).map((c) => c.id), now)

  const ready = !!(recurring && credits && savingIds && spending && incomes)
  const incomesTotal = (incomes ?? []).reduce((sum, i) => sum + i.amount, 0)
  const spent = (spending ?? []).reduce((sum, s) => sum + s.amount, 0)
  const savedNet = savingsNet((savingIds ?? []).flatMap((id) => movements[`${from}/${id}`] ?? []), from, to)
  const pending = monthCommitments(recurring ?? [], credits ?? [], 0, now).pending
  const terms = { incomes: incomesTotal, paid, spent, savedNet, pending }

  return { ready, failed, incomes: incomes ?? [], terms, left: leftThisMonth(terms) }
}

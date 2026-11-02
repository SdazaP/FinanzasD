import { useEffect, useState } from 'react'
import { watchCredits, type Credit } from '../credits/api'
import { monthRange } from '../lib/dates'
import { watchMonthPaymentDocs, type PaymentDoc } from '../lib/periodPayments'
import { watchRecurring, type Recurring } from '../recurring/api'
import { watchMonthMovements, watchSavings, type Movement, type Saving } from '../savings/api'
import { watchMonthSpending } from '../spending/api'
import type { Spending } from '../spending/calc'
import { watchAdjustments, watchMonthIncomes, type Income } from './api'
import { accountActivity, type ActivityEntry } from './calc'

type Adjustment = { id: string; amount: number; date: string }

// Todo lo que movió el saldo de una cuenta en el mes en curso, con signo (+ entra, − sale).
// shortcut: una suscripción por gasto fijo, crédito y apartado; si llegan a cientos, guardar los
// movimientos de cada cuenta en una subcolección propia.
export function useAccountActivity(uid: string, accountId: string, now: string) {
  const [from, to] = monthRange(now)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [spending, setSpending] = useState<Spending[]>([])
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [recurring, setRecurring] = useState<Recurring[]>([])
  const [credits, setCredits] = useState<Credit[]>([])
  const [savings, setSavings] = useState<Saving[]>([])
  const [payments, setPayments] = useState<Record<string, PaymentDoc[]>>({})
  const [movements, setMovements] = useState<Record<string, Movement[]>>({})

  useEffect(() => watchMonthIncomes(uid, from, to, setIncomes, () => setIncomes([])), [uid, from, to])
  useEffect(() => watchMonthSpending(uid, from, to, setSpending, () => setSpending([])), [uid, from, to])
  useEffect(() => watchAdjustments(uid, accountId, from, to, setAdjustments), [uid, accountId, from, to])
  useEffect(() => {
    const unsubscribes = [
      watchRecurring(uid, setRecurring, () => setRecurring([])),
      watchCredits(uid, setCredits, () => setCredits([])),
      watchSavings(uid, setSavings, () => setSavings([])),
    ]
    return () => unsubscribes.forEach((u) => u())
  }, [uid])

  const payKeys = [...recurring.map((r) => `recurring/${r.id}`), ...credits.map((c) => `credits/${c.id}`)].join(',')
  useEffect(() => {
    if (!payKeys) return
    const [y, m] = from.split('-').map(Number)
    const unsubscribes = payKeys.split(',').map((key) => {
      const [col, id] = key.split('/') as ['recurring' | 'credits', string]
      return watchMonthPaymentDocs(uid, col, id, new Date(y, m - 1, 1), new Date(y, m, 1), (docs) => setPayments((p) => ({ ...p, [key]: docs })))
    })
    return () => unsubscribes.forEach((u) => u())
  }, [uid, payKeys, from])

  const savingIds = savings.map((s) => s.id).join(',')
  useEffect(() => {
    if (!savingIds) return
    const unsubscribes = savingIds.split(',').map((id) => watchMonthMovements(uid, id, from, to, (m) => setMovements((prev) => ({ ...prev, [id]: m }))))
    return () => unsubscribes.forEach((u) => u())
  }, [uid, savingIds, from, to])

  const entries: ActivityEntry[] = [
    ...incomes.map((i) => ({ id: `i-${i.id}`, label: i.note ? `${i.concept} · ${i.note}` : i.concept, amount: i.amount, date: i.date, accountId: i.accountId })),
    ...spending.map((s) => ({ id: `s-${s.id}`, label: s.note ? `${s.category} · ${s.note}` : s.category, amount: -s.amount, date: s.date, accountId: s.accountId })),
    ...adjustments.map((a) => ({ id: `a-${a.id}`, label: 'Ajuste', amount: a.amount, date: a.date, accountId })),
    ...recurring.flatMap((r) => (payments[`recurring/${r.id}`] ?? []).map((p) => ({ id: `p-${p.id}`, label: r.name, amount: -p.amount, date: p.date, accountId: p.accountId }))),
    ...credits.flatMap((c) => (payments[`credits/${c.id}`] ?? []).map((p) => ({ id: `p-${p.id}`, label: `Pago ${c.name}`, amount: -p.amount, date: p.date, accountId: p.accountId }))),
    ...savings.flatMap((s) =>
      (movements[s.id] ?? []).map((m) => ({
        id: `m-${m.id}`,
        label: m.type === 'deposit' ? `Aporte a ${s.name}` : `Retiro de ${s.name}`,
        amount: m.type === 'deposit' ? -m.amount : m.amount,
        date: m.date,
        accountId: m.accountId,
      })),
    ),
  ]
  return accountActivity(entries, accountId)
}

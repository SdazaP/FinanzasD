import { useEffect, useState } from 'react'
import { watchCredits, type Credit } from '../credits/api'
import { monthRange } from '../lib/dates'
import { watchMonthPaymentDocs, type PaymentDoc } from '../lib/periodPayments'
import { watchRecurring, type Recurring } from '../recurring/api'
import { watchMonthMovements, watchSavings, type Movement, type Saving } from '../savings/api'
import { watchMonthSpending } from '../spending/api'
import type { Spending } from '../spending/calc'
import type { HistoryEntry } from './calc'

// Gastos hormiga, pagos de gastos fijos y pagos de créditos del mes de `date`.
// shortcut: una suscripción por gasto fijo y por crédito (como Inicio); si llegan a decenas, guardar el mes en cada pago
export function useMonthHistory(uid: string, date: string) {
  const [from, to] = monthRange(date)
  const [recurring, setRecurring] = useState<Recurring[]>()
  const [credits, setCredits] = useState<Credit[]>()
  // Guardados con su mes: al navegar no se muestran los del mes anterior mientras llegan los nuevos
  const [loaded, setLoaded] = useState<{ from: string; items: Spending[] }>()
  const [payments, setPayments] = useState<Record<string, PaymentDoc[]>>({})
  const [savings, setSavings] = useState<Saving[]>()
  const [spentMoves, setSpentMoves] = useState<Record<string, Movement[]>>({})

  useEffect(() => {
    const unsubscribes = [
      watchRecurring(uid, setRecurring, () => setRecurring([])),
      watchCredits(uid, setCredits, () => setCredits([])),
      watchSavings(uid, setSavings, () => setSavings([])),
    ]
    return () => unsubscribes.forEach((u) => u())
  }, [uid])

  useEffect(
    () => watchMonthSpending(uid, from, to, (items) => setLoaded({ from, items }), () => setLoaded({ from, items: [] })),
    [uid, from, to],
  )
  const spending = loaded?.from === from ? loaded.items : undefined

  // Claves 'recurring/{id}' y 'credits/{id}'; el mes va en la clave guardada para no mezclar meses al navegar
  const keys = [...(recurring ?? []).map((r) => `recurring/${r.id}`), ...(credits ?? []).map((c) => `credits/${c.id}`)].join(',')
  useEffect(() => {
    if (!keys) return
    const [y, m] = from.split('-').map(Number)
    const unsubscribes = keys.split(',').map((key) => {
      const [col, id] = key.split('/') as ['recurring' | 'credits', string]
      return watchMonthPaymentDocs(uid, col, id, new Date(y, m - 1, 1), new Date(y, m, 1), (docs) => setPayments((p) => ({ ...p, [`${from}/${key}`]: docs })))
    })
    return () => unsubscribes.forEach((u) => u())
  }, [uid, keys, from])

  // Solo los gastos planeados pueden tener movimientos 'spent' (gastados)
  const planned = (savings ?? []).filter((s) => s.planned)
  const plannedIds = planned.map((s) => s.id).join(',')
  useEffect(() => {
    if (!plannedIds) return
    const unsubscribes = plannedIds.split(',').map((id) => watchMonthMovements(uid, id, from, to, (m) => setSpentMoves((p) => ({ ...p, [`${from}/${id}`]: m }))))
    return () => unsubscribes.forEach((u) => u())
  }, [uid, plannedIds, from, to])

  const paymentsOf = (key: string) => payments[`${from}/${key}`]
  const ready = !!(recurring && credits && spending && savings) && !!keys.split(',').filter(Boolean).every((k) => paymentsOf(k))

  const entries: HistoryEntry[] = [
    ...(spending ?? []).map((s) => ({
      id: `s-${s.id}`, kind: 'spending' as const, label: s.note ? `${s.category} · ${s.note}` : s.category, amount: s.amount, date: s.date, href: `/gastos-hormiga/${s.id}`,
    })),
    ...(recurring ?? []).flatMap((r) =>
      (paymentsOf(`recurring/${r.id}`) ?? []).map((p) => ({ id: `r-${p.id}`, kind: 'fixed' as const, label: r.name, amount: p.amount, date: p.date, href: `/gastos-fijos/${r.id}` })),
    ),
    ...(credits ?? []).flatMap((c) =>
      (paymentsOf(`credits/${c.id}`) ?? []).map((p) => ({
        id: `c-${p.id}`, kind: c.kind === 'card' ? ('card' as const) : ('msi' as const), label: c.name, amount: p.amount, date: p.date, href: `/creditos/${c.id}`,
      })),
    ),
    ...planned.flatMap((s) =>
      (spentMoves[`${from}/${s.id}`] ?? [])
        .filter((m) => m.type === 'spent')
        .map((m) => ({ id: `p-${m.id}`, kind: 'planned' as const, label: s.name, amount: m.amount, date: m.date, href: `/ahorro/${s.id}` })),
    ),
    ...planned
      .filter((s) => !s.spentAt && s.deadline! >= from && s.deadline! <= to)
      .map((s) => ({ id: `u-${s.id}`, kind: 'upcoming' as const, label: s.name, amount: s.target!, date: s.deadline!, href: `/ahorro/${s.id}` })),
  ]
  // Hasta qué mes se puede avanzar: el del último gasto planeado por venir
  const lastPlanned = planned.filter((s) => !s.spentAt).reduce((max, s) => (s.deadline! > max ? s.deadline! : max), '')
  return { ready, entries, lastPlanned }
}

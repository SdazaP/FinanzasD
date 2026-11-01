import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { watchCredits, type Credit } from '../credits/api'
import { debtTotal } from '../credits/calc'
import { formatDay, monthlyTotal, status, today } from '../lib/dates'
import { formatMXN } from '../lib/money'
import ProgressBar from '../lib/ProgressBar'
import { watchRecurring, type Recurring } from '../recurring/api'
import { watchSavings, type Saving } from '../savings/api'
import { goalSummary, totalSaved } from '../savings/calc'
import { watchMonthPayments } from '../lib/periodPayments'
import { monthCommitments, monthRange, upcoming } from './calc'

const badges = {
  overdue: { text: 'Vencido', className: 'bg-red-50 text-red-700' },
  soon: { text: 'Pronto', className: 'bg-accent-yellow/35 text-amber-900' },
  ok: null,
}

const card = 'rounded-3xl bg-white p-5 shadow-card'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={card}>
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

// Suma lo pagado este mes en todos los gastos fijos y créditos (una suscripción por elemento)
function usePaidThisMonth(uid: string, recurring?: Recurring[], credits?: Credit[]) {
  const [paid, setPaid] = useState<Record<string, number>>({})
  const keys = [...(recurring ?? []).map((r) => `recurring/${r.id}`), ...(credits ?? []).map((c) => `credits/${c.id}`)]
  const keyList = keys.join(',')

  useEffect(() => {
    if (!keyList) return
    const [from] = monthRange(today())
    const [y, m] = from.split('-').map(Number)
    const unsubscribes = keyList.split(',').map((key) => {
      const [col, id] = key.split('/') as ['recurring' | 'credits', string]
      return watchMonthPayments(uid, col, id, new Date(y, m - 1, 1), new Date(y, m, 1), (sum) => setPaid((p) => ({ ...p, [key]: sum })))
    })
    return () => unsubscribes.forEach((u) => u())
  }, [uid, keyList])

  return keys.reduce((sum, key) => sum + (paid[key] ?? 0), 0)
}

export default function Dashboard() {
  const uid = useAuth()!.uid
  const [recurring, setRecurring] = useState<Recurring[]>()
  const [credits, setCredits] = useState<Credit[]>()
  const [savings, setSavings] = useState<Saving[]>()
  const [failed, setFailed] = useState<string[]>([])

  useEffect(() => {
    const fail = (what: string) => () => setFailed((f) => (f.includes(what) ? f : [...f, what]))
    const unsubscribes = [
      watchRecurring(uid, setRecurring, fail('gastos fijos')),
      watchCredits(uid, setCredits, fail('créditos')),
      watchSavings(uid, setSavings, fail('ahorro')),
    ]
    return () => unsubscribes.forEach((u) => u())
  }, [uid])

  const paid = usePaidThisMonth(uid, recurring, credits)

  const loading = [recurring, credits, savings].some((x, i) => !x && !failed.includes(['gastos fijos', 'créditos', 'ahorro'][i]))
  if (loading) return <p className="text-zinc-500">Cargando…</p>

  const now = today()
  const r = recurring ?? []
  const c = credits ?? []
  const s = savings ?? []
  const month = monthCommitments(r, c, paid, now)
  const next = upcoming(r, c, now)
  const goals = s.filter((saving) => ['on-track', 'overdue'].includes(goalSummary(saving, now).status))
  const hasCardPending = c.some((credit) => credit.kind === 'card' && credit.balance > 0 && credit.nextDue <= monthRange(now)[1])

  if (!failed.length && !r.length && !c.length && !s.length) {
    return (
      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="font-display text-lg font-medium leading-snug">Empieza registrando lo que pagas y lo que ahorras.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[['/gastos-fijos/nuevo', 'Agregar gasto'], ['/creditos/nuevo', 'Agregar crédito'], ['/ahorro/nuevo', 'Agregar apartado']].map(([to, text]) => (
            <Link key={to} to={to} className="flex min-h-11 items-center rounded-xl bg-white/15 px-4 text-sm font-medium active:bg-white/25">
              {text}
            </Link>
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      {failed.length > 0 && (
        <p role="alert" className="text-sm text-red-700">No se pudieron cargar: {failed.join(', ')}. Revisa tu conexión.</p>
      )}

      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="text-sm text-white/80">Este mes</p>
        <p className="mt-1 font-display text-4xl font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatMXN(month.total)}</p>
        <div className="mt-4">
          <ProgressBar value={month.total ? month.paid / month.total : 0} label="Pagado este mes" onDark />
        </div>
        <div className="mt-2 flex justify-between gap-3 text-sm">
          <p>
            <span className="text-white/80">Pagado </span>
            <span className="font-medium tabular-nums">{formatMXN(month.paid)}</span>
          </p>
          <p>
            <span className="text-white/80">Pendiente </span>
            <span className="font-medium tabular-nums">{formatMXN(month.pending)}</span>
          </p>
        </div>
        {hasCardPending && <p className="mt-2 text-xs text-white/70">Tarjetas: saldo completo</p>}
      </section>

      <Section title="Próximos pagos">
        {next.length === 0 ? (
          <p className="text-zinc-500">Nada vence en los próximos 7 días.</p>
        ) : (
          <ul className="-mx-2">
            {next.map((item) => {
              const badge = badges[status(item.nextDue, now)]
              return (
                <li key={item.href}>
                  <Link to={item.href} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 active:bg-zinc-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="truncate text-sm text-zinc-500">
                        {item.typeLabel} · {formatDay(item.nextDue)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium tabular-nums">{formatMXN(item.amount)}</p>
                      {badge && <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>{badge.text}</span>}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section title="Tus saldos">
        <ul className="-mx-2">
          {[
            ['/gastos-fijos', 'Gastos fijos al mes', monthlyTotal(r)],
            ['/creditos', 'Deuda total', debtTotal(c)],
            ['/ahorro', 'Total ahorrado', totalSaved(s)],
          ].map(([to, label, amount]) => (
            <li key={to}>
              <Link to={to as string} className="flex min-h-12 items-center gap-3 rounded-2xl px-2 active:bg-zinc-50">
                <p className="min-w-0 flex-1 text-zinc-600">{label}</p>
                <p className="shrink-0 font-display font-semibold tabular-nums">{formatMXN(amount as number)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {goals.length > 0 && (
        <Section title="Metas de ahorro">
          <ul className="-mx-2 space-y-1">
            {goals.map((saving) => {
              const goal = goalSummary(saving, now)
              return (
                <li key={saving.id}>
                  <Link to={`/ahorro/${saving.id}`} className="block space-y-1.5 rounded-2xl px-2 py-2.5 active:bg-zinc-50">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate font-medium">{saving.name}</p>
                      <p className="shrink-0 text-sm text-zinc-500 tabular-nums">{goal.status !== 'no-target' && Math.round(goal.progress * 100)}%</p>
                    </div>
                    {goal.status !== 'no-target' && <ProgressBar value={goal.progress} label={`Avance de ${saving.name}`} />}
                    {goal.status === 'on-track' && goal.monthly && (
                      <p className="text-sm text-primary">Ahorra {formatMXN(goal.monthly)} al mes</p>
                    )}
                    {goal.status === 'overdue' && <p className="text-sm text-red-700">La fecha ya pasó</p>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </Section>
      )}
    </div>
  )
}

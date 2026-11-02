import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { watchCredits, type Credit } from '../credits/api'
import { debtTotal } from '../credits/calc'
import { formatDay, monthlyTotal, status } from '../lib/dates'
import { formatMXN } from '../lib/money'
import ProgressBar from '../lib/ProgressBar'
import { watchRecurring, type Recurring } from '../recurring/api'
import { watchSavings, type Saving } from '../savings/api'
import { goalSummary, totalSaved } from '../savings/calc'
import { usePaidThisMonth } from '../lib/usePaidThisMonth'
import { useToday } from '../lib/useToday'
import { availableTotal, type Account } from '../money/calc'
import { useAccounts } from '../money/useAccounts'
import { useMonthMoney } from '../money/useMonthMoney'
import { watchMonthSpending } from '../spending/api'
import type { Spending } from '../spending/calc'
import { monthCommitments, monthRange, upcoming } from './calc'

const badges = {
  overdue: { text: 'Vencido', className: 'bg-red-50 text-red-700' },
  soon: { text: 'Pronto', className: 'bg-accent-yellow/35 text-amber-900' },
  ok: null,
}

const card = 'rounded-3xl bg-surface p-5 shadow-card'

// Separado para que useMonthMoney solo se suscriba cuando hay cuentas
function MoneyLine({ uid, now, accounts }: { uid: string; now: string; accounts: Account[] }) {
  const total = availableTotal(accounts)
  const month = useMonthMoney(uid, now, total)
  return (
    <Link to="/cuentas" className={`${card} flex items-center gap-4 active:bg-zinc-50`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-500">Disponible</p>
        <p className={`font-display text-2xl font-semibold tabular-nums [overflow-wrap:anywhere] ${total < 0 ? 'text-red-600' : ''}`}>{formatMXN(total)}</p>
      </div>
      <div className="min-w-0 flex-1 text-right">
        <p className="text-sm text-zinc-500">Te queda este mes</p>
        <p className={`font-display text-lg font-semibold tabular-nums [overflow-wrap:anywhere] ${month.ready && month.left < 0 ? 'text-red-600' : ''}`}>
          {month.ready ? formatMXN(month.left) : '…'}
        </p>
      </div>
    </Link>
  )
}

function Money({ uid, now }: { uid: string; now: string }) {
  const { accounts } = useAccounts(uid)
  if (!accounts) return null
  if (!accounts.length) {
    return (
      <Link to="/cuentas/nueva" className={`${card} block active:bg-zinc-50`}>
        <p className="font-medium text-primary">Crea tu primera cuenta</p>
        <p className="text-sm text-zinc-500">Para saber cuánto tienes disponible y cuánto te queda en el mes.</p>
      </Link>
    )
  }
  return <MoneyLine uid={uid} now={now} accounts={accounts} />
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={card}>
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export default function Dashboard() {
  const uid = useAuth()!.uid
  const [recurring, setRecurring] = useState<Recurring[]>()
  const [credits, setCredits] = useState<Credit[]>()
  const [savings, setSavings] = useState<Saving[]>()
  const [spending, setSpending] = useState<Spending[]>()
  const [failed, setFailed] = useState<string[]>([])
  const now = useToday()
  const [monthStart, monthEnd] = monthRange(now)

  useEffect(() => {
    const fail = (what: string) => () => setFailed((f) => (f.includes(what) ? f : [...f, what]))
    const unsubscribes = [
      watchRecurring(uid, setRecurring, fail('gastos fijos')),
      watchCredits(uid, setCredits, fail('créditos')),
      watchSavings(uid, setSavings, fail('ahorro')),
    ]
    return () => unsubscribes.forEach((u) => u())
  }, [uid])

  useEffect(
    () => watchMonthSpending(uid, monthStart, monthEnd, setSpending, () => setFailed((f) => (f.includes('gastos hormiga') ? f : [...f, 'gastos hormiga']))),
    [uid, monthStart, monthEnd],
  )

  const paid = usePaidThisMonth(uid, (recurring ?? []).map((r) => r.id), (credits ?? []).map((c) => c.id), now)

  const sources = ['gastos fijos', 'créditos', 'ahorro', 'gastos hormiga']
  const loading = [recurring, credits, savings, spending].some((x, i) => !x && !failed.includes(sources[i]))
  if (loading) return <p className="text-zinc-500">Cargando…</p>

  const r = recurring ?? []
  const c = credits ?? []
  const s = savings ?? []
  const ant = spending ?? []
  const month = monthCommitments(r, c, paid, now)
  const next = upcoming(r, c, now)
  const goals = s.filter((saving) => ['on-track', 'overdue'].includes(goalSummary(saving, now).status))
  const hasCardPending = c.some((credit) => credit.kind === 'card' && credit.balance > 0 && credit.nextDue <= monthRange(now)[1])

  if (!failed.length && !r.length && !c.length && !s.length && !ant.length) {
    return (
      <div className="space-y-4">
        <Money uid={uid} now={now} />
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
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {failed.length > 0 && (
        <p role="alert" className="text-sm text-red-700">No se pudieron cargar: {failed.join(', ')}. Revisa tu conexión.</p>
      )}

      <Money uid={uid} now={now} />

      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="text-sm text-white/80">Este mes</p>
        <p className="mt-1 font-display text-[clamp(1.5rem,8vw,2.25rem)] font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatMXN(month.total)}</p>
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
            ['/gastos-hormiga', 'Gastos hormiga del mes', ant.reduce((sum, i) => sum + i.amount, 0)],
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

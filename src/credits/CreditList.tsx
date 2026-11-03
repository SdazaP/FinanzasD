import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import AmountAction from '../lib/AmountAction'
import AccountPicker from '../money/AccountPicker'
import { useAccounts } from '../money/useAccounts'
import { formatDay, formatMonthName, status } from '../lib/dates'
import { formatMXN } from '../lib/money'
import { monthStatus } from '../lib/monthStatus'
import Bar from '../lib/ProgressBar'
import { usePeriodPayments } from '../lib/usePeriodPayments'
import { useToday } from '../lib/useToday'
import { payCredit, watchCredits, type Credit } from './api'
import { creditPaymentError, debtTotal, msiSummary } from './calc'

const badges = {
  overdue: { text: 'Vencido', className: 'bg-red-50 text-red-700' },
  soon: { text: 'Pronto', className: 'bg-accent-yellow/35 text-amber-900' },
  ok: null,
}

function Details({ credit }: { credit: Credit }) {
  if (credit.kind === 'card') {
    if (!credit.limit) return null
    const usage = credit.balance / credit.limit
    return (
      <div className="mt-3 space-y-1.5">
        <Bar value={usage} label={`Uso de ${credit.name}`} />
        <p className="text-xs text-zinc-500">
          {Math.round(usage * 100)}% de {formatMXN(credit.limit)}
        </p>
      </div>
    )
  }
  const s = msiSummary(credit)
  return (
    <div className="mt-3 space-y-1.5">
      <Bar value={s.progress} label={`Pagado de ${credit.name}`} />
      <p className="text-xs text-zinc-500">
        {s.remaining === 1 ? 'Último pago' : `${s.remaining} de ${credit.months} pagos restantes`} · {formatMXN(s.installment)} al mes
        {s.endDate && ` · termina ${formatDay(s.endDate, true)}`}
      </p>
    </div>
  )
}

type Accounts = ReturnType<typeof useAccounts>

function PayRow({ uid, credit, badge, money }: { uid: string; credit: Credit; badge: (typeof badges)[keyof typeof badges]; money: Accounts }) {
  const [open, setOpen] = useState(false)
  const [accountId, setAccountId] = useState<string>()
  const from = accountId ?? money.defaultId
  // El próximo pago pendiente es el mes que se paga (en un atrasado, el más antiguo)
  const month = formatMonthName(credit.nextDue)
  const msi = credit.kind === 'msi'
  const action = msi ? `Pagar cuota de ${month}` : `Pagar ${month}`

  if (!open) {
    return (
      <div className="mt-3 flex items-center justify-between gap-2">
        {badge ? <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>{badge.text}</span> : <span />}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${action}, ${credit.name}`}
          className="min-h-11 rounded-xl bg-primary/10 px-3 text-sm font-medium whitespace-nowrap text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          {action}
        </button>
      </div>
    )
  }

  return (
    <AmountAction
      id={`pay-${credit.id}`}
      label={msi ? `Cuota de ${month}` : `Pago de ${month}`}
      initialCents={msi ? msiSummary(credit).suggested : credit.balance}
      fixed={msi}
      validate={(cents) => creditPaymentError(credit, cents)}
      onConfirm={(cents) => payCredit(uid, credit, cents, from, money.liveIds)}
      onDone={() => setOpen(false)}
    >
      <AccountPicker accounts={money.accounts ?? []} value={from} onChange={setAccountId} label="Desde" />
    </AmountAction>
  )
}

function GroupTitle({ children }: { children: string }) {
  return <h2 className="mb-2 px-1 text-sm font-medium text-zinc-500">{children}</h2>
}

// Encabezado común de la tarjeta de un crédito: nombre, tipo, detalle del mes y saldo
function CreditHeader({ credit, detail, cardNames }: { credit: Credit; detail: string; cardNames: Record<string, string> }) {
  const cardName = credit.kind === 'msi' ? (credit.cardId ? cardNames[credit.cardId] : credit.card) : undefined
  const subtitle = credit.kind === 'card' ? 'Tarjeta' : [cardName, 'MSI'].filter(Boolean).join(' · ')
  return (
    <Link to={`/creditos/${credit.id}`} className="-m-2 block rounded-2xl p-2 active:bg-zinc-50">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{credit.name}</p>
          <p className="truncate text-sm text-zinc-500">
            {subtitle} · {detail}
          </p>
        </div>
        <p className="shrink-0 font-display text-lg font-semibold tabular-nums">{formatMXN(credit.balance)}</p>
      </div>
      <Details credit={credit} />
    </Link>
  )
}

export default function CreditList() {
  const uid = useAuth()!.uid
  const now = useToday()
  const [items, setItems] = useState<Credit[]>()
  const [loadError, setLoadError] = useState(false)
  const money = useAccounts(uid)

  useEffect(() => watchCredits(uid, setItems, () => setLoadError(true)), [uid])

  const active = (items ?? []).filter((c) => c.balance > 0)
  const periodOf = usePeriodPayments(uid, 'credits', active.map((c) => c.id), now)

  if (loadError) return <p role="alert" className="text-red-700">No se pudieron cargar tus créditos. Revisa tu conexión.</p>
  if (!items) return <p className="text-zinc-500">Cargando…</p>

  const settled = items.filter((c) => c.balance <= 0)
  const cardNames = Object.fromEntries(items.filter((c) => c.kind === 'card').map((c) => [c.id, c.name]))
  const statusOf = (credit: Credit) => monthStatus(credit.nextDue, !!periodOf(credit.id)?.amount, now)
  const due = active.filter((c) => statusOf(c) === 'due')
  // Lo que no vence este mes espera a sus pagos del periodo para no saltar de "Más adelante" a "Pagado"
  const notDue = active.filter((c) => statusOf(c) !== 'due')
  const notDueLoaded = notDue.every((c) => periodOf(c.id))
  const paid = notDue.filter((c) => statusOf(c) === 'paid')
  const later = notDue.filter((c) => statusOf(c) === 'later')

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="text-sm text-white/80">Deuda total</p>
        <p className="mt-1 font-display text-[clamp(1.5rem,8vw,2.25rem)] font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatMXN(debtTotal(items))}</p>
        <p className="mt-1 text-sm text-white/80">{active.length === 1 ? '1 crédito activo' : `${active.length} créditos activos`}</p>
      </section>

      <Link
        to="/creditos/nuevo"
        className="flex min-h-12 items-center justify-center rounded-2xl bg-surface font-medium text-primary shadow-card transition-transform duration-150 ease-out active:scale-[0.98] md:max-w-xs"
      >
        Agregar crédito
      </Link>

      {items.length === 0 && (
        <p className="rounded-3xl bg-surface p-6 text-zinc-600 shadow-card">
          Aún no tienes créditos. Agrega tus tarjetas y tus compras a meses sin intereses para ver cuánto debes.
        </p>
      )}

      {due.length > 0 && (
        <section>
          <GroupTitle>Por pagar</GroupTitle>
          <ul className="grid gap-3 space-y-0 lg:grid-cols-2 lg:gap-4">
            {due.map((credit) => (
              <li key={credit.id} className="rounded-3xl bg-surface p-4 shadow-card">
                <CreditHeader credit={credit} detail={formatDay(credit.nextDue)} cardNames={cardNames} />
                <PayRow uid={uid} credit={credit} badge={badges[status(credit.nextDue, now)]} money={money} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {notDue.length > 0 && !notDueLoaded && <p className="px-1 text-sm text-zinc-500">Cargando pagos del mes…</p>}

      {notDueLoaded && paid.length > 0 && (
        <section>
          <GroupTitle>Pagado este mes</GroupTitle>
          <ul className="grid gap-3 space-y-0 lg:grid-cols-2 lg:gap-4">
            {paid.map((credit) => {
              const period = periodOf(credit.id)!
              const when = period.lastPaidAt ? ` el ${formatDay(period.lastPaidAt)}` : ''
              return (
                <li key={credit.id} className="rounded-3xl bg-surface p-4 shadow-card">
                  <CreditHeader credit={credit} detail={`Pagado${when}`} cardNames={cardNames} />
                  <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                    Pagaste {formatMXN(period.amount)}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {notDueLoaded && later.length > 0 && (
        <section>
          <GroupTitle>Más adelante</GroupTitle>
          <ul className="grid gap-3 space-y-0 lg:grid-cols-2 lg:gap-4">
            {later.map((credit) => (
              <li key={credit.id} className="rounded-3xl bg-surface p-4 shadow-card">
                <CreditHeader credit={credit} detail={`Vence el ${formatDay(credit.nextDue)}`} cardNames={cardNames} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {settled.length > 0 && (
        <section>
          <GroupTitle>Liquidados</GroupTitle>
          <ul className="grid gap-3 space-y-0 lg:grid-cols-2 lg:gap-4">
            {settled.map((credit) => (
              <li key={credit.id}>
                <Link to={`/creditos/${credit.id}`} className="flex items-center gap-3 rounded-3xl bg-surface/60 p-4 text-zinc-500 active:bg-surface">
                  <p className="min-w-0 flex-1 truncate">{credit.name}</p>
                  <p className="shrink-0 text-sm">Liquidado</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

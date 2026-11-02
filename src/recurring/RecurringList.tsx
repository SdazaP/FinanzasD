import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import GastosTabs from '../layout/GastosTabs'
import AccountPicker from '../money/AccountPicker'
import { useAccounts } from '../money/useAccounts'
import { formatDay, monthlyTotal, status } from '../lib/dates'
import { formatMXN } from '../lib/money'
import { monthStatus } from '../lib/monthStatus'
import { usePeriodPayments } from '../lib/usePeriodPayments'
import { useToday } from '../lib/useToday'
import { payRecurring, watchRecurring, type Recurring } from './api'

const badges = {
  overdue: { text: 'Vencido', className: 'bg-red-50 text-red-700' },
  soon: { text: 'Pronto', className: 'bg-accent-yellow/35 text-amber-900' },
  ok: null,
}

function GroupTitle({ children }: { children: string }) {
  return <h2 className="mb-2 px-1 text-sm font-medium text-zinc-500">{children}</h2>
}

export default function RecurringList() {
  const uid = useAuth()!.uid
  const now = useToday()
  const [items, setItems] = useState<Recurring[]>()
  const [loadError, setLoadError] = useState(false)
  const [paying, setPaying] = useState<string>()
  const [payError, setPayError] = useState('')
  const { accounts, defaultId, liveIds } = useAccounts(uid)
  const [chosenAccount, setChosenAccount] = useState<Record<string, string>>({}) // cuenta elegida por gasto; si no, la predeterminada

  useEffect(() => watchRecurring(uid, setItems, () => setLoadError(true)), [uid])

  const active = (items ?? []).filter((i) => i.active)
  const periodOf = usePeriodPayments(uid, 'recurring', active.map((i) => i.id), now)

  if (loadError) return <><GastosTabs /><p role="alert" className="mt-4 text-red-700">No se pudieron cargar tus gastos. Revisa tu conexión.</p></>
  if (!items) return <><GastosTabs /><p className="mt-4 text-zinc-500">Cargando…</p></>

  const paused = items.filter((i) => !i.active)
  const statusOf = (item: Recurring) => monthStatus(item.nextDue, !!periodOf(item.id)?.amount, now)
  const due = active.filter((i) => statusOf(i) === 'due')
  // Lo que no vence este mes espera a sus pagos del periodo para no saltar de "Más adelante" a "Pagado"
  const notDue = active.filter((i) => statusOf(i) !== 'due')
  const notDueLoaded = notDue.every((i) => periodOf(i.id))
  const paid = notDue.filter((i) => statusOf(i) === 'paid')
  const later = notDue.filter((i) => statusOf(i) === 'later')

  async function pay(item: Recurring) {
    setPaying(item.id)
    setPayError('')
    try {
      await payRecurring(uid, item, chosenAccount[item.id] ?? defaultId, liveIds)
    } catch {
      setPayError(`No se pudo registrar el pago de ${item.name}. Intenta de nuevo.`)
    } finally {
      setPaying(undefined)
    }
  }

  const header = (item: Recurring, detail: string, amount = item.amount) => (
    <Link to={`/gastos-fijos/${item.id}`} className="-m-2 flex items-start gap-3 rounded-2xl p-2 active:bg-zinc-50">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="truncate text-sm text-zinc-500">
          {item.category} · {detail}
        </p>
      </div>
      <p className="shrink-0 font-display text-lg font-semibold tabular-nums">{formatMXN(amount)}</p>
    </Link>
  )

  return (
    <div className="space-y-4">
      <GastosTabs />
      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="text-sm text-white/80">Total mensual</p>
        <p className="mt-1 font-display text-[clamp(1.5rem,8vw,2.25rem)] font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatMXN(monthlyTotal(items))}</p>
        <p className="mt-1 text-sm text-white/80">
          {active.length === 1 ? '1 gasto activo' : `${active.length} gastos activos`}
        </p>
      </section>

      <Link
        to="/gastos-fijos/nuevo"
        className="flex min-h-12 items-center justify-center rounded-2xl bg-white font-medium text-primary shadow-card transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        Agregar gasto
      </Link>

      {payError && <p role="alert" className="text-sm text-red-700">{payError}</p>}

      {items.length === 0 && (
        <p className="rounded-3xl bg-white p-6 text-zinc-600 shadow-card">
          Aún no tienes gastos fijos. Agrega tu renta, servicios o suscripciones para ver cuánto pagas al mes.
        </p>
      )}

      {due.length > 0 && (
        <section>
          <GroupTitle>Por pagar</GroupTitle>
          <ul className="space-y-3">
            {due.map((item) => {
              const badge = badges[status(item.nextDue, now)]
              return (
                <li key={item.id} className="rounded-3xl bg-white p-4 shadow-card">
                  {header(item, formatDay(item.nextDue))}
                  <div className="mt-2">
                    <AccountPicker
                      compact
                      label="Desde"
                      accounts={accounts ?? []}
                      value={chosenAccount[item.id] ?? defaultId}
                      onChange={(accountId) => setChosenAccount((c) => ({ ...c, [item.id]: accountId }))}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    {badge ? <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>{badge.text}</span> : <span />}
                    <button
                      type="button"
                      onClick={() => pay(item)}
                      disabled={paying === item.id}
                      aria-label={`Pagar ${item.name}`}
                      className="min-h-11 rounded-xl bg-primary/10 px-5 text-sm font-medium text-primary transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
                    >
                      {paying === item.id ? 'Guardando…' : 'Pagar'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {notDue.length > 0 && !notDueLoaded && <p className="px-1 text-sm text-zinc-500">Cargando pagos del mes…</p>}

      {notDueLoaded && paid.length > 0 && (
        <section>
          <GroupTitle>Pagado este mes</GroupTitle>
          <ul className="space-y-3">
            {paid.map((item) => {
              const period = periodOf(item.id)!
              return (
                <li key={item.id} className="rounded-3xl bg-white p-4 shadow-card">
                  {header(item, period.lastPaidAt ? `Pagado el ${formatDay(period.lastPaidAt)}` : 'Pagado', period.amount)}
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                    Pagado
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
          <ul className="space-y-3">
            {later.map((item) => (
              <li key={item.id} className="rounded-3xl bg-white p-4 shadow-card">
                {header(item, `Vence el ${formatDay(item.nextDue)}`)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {paused.length > 0 && (
        <section>
          <GroupTitle>Pausados</GroupTitle>
          <ul className="space-y-3">
            {paused.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/gastos-fijos/${item.id}`}
                  className="flex items-center gap-3 rounded-3xl bg-white/60 p-4 text-zinc-500 active:bg-white"
                >
                  <p className="min-w-0 flex-1 truncate">{item.name}</p>
                  <p className="shrink-0 tabular-nums">{formatMXN(item.amount)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

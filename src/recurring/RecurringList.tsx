import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { formatMXN } from '../lib/money'
import { payRecurring, watchRecurring, type Recurring } from './api'
import { formatDay, monthlyTotal, status, today } from './dates'

const badges = {
  overdue: { text: 'Vencido', className: 'bg-red-50 text-red-700' },
  soon: { text: 'Pronto', className: 'bg-accent-yellow/35 text-amber-900' },
  ok: null,
}

export default function RecurringList() {
  const uid = useAuth()!.uid
  const [items, setItems] = useState<Recurring[]>()
  const [loadError, setLoadError] = useState(false)
  const [paying, setPaying] = useState<string>()
  const [payError, setPayError] = useState('')

  useEffect(() => watchRecurring(uid, setItems, () => setLoadError(true)), [uid])

  if (loadError) return <p role="alert" className="text-red-700">No se pudieron cargar tus gastos. Revisa tu conexión.</p>
  if (!items) return <p className="text-zinc-500">Cargando…</p>

  const active = items.filter((i) => i.active)
  const paused = items.filter((i) => !i.active)
  const now = today()

  async function pay(item: Recurring) {
    setPaying(item.id)
    setPayError('')
    try {
      await payRecurring(uid, item)
    } catch {
      setPayError(`No se pudo registrar el pago de ${item.name}. Intenta de nuevo.`)
    } finally {
      setPaying(undefined)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="text-sm text-white/80">Total mensual</p>
        <p className="mt-1 font-display text-4xl font-semibold tracking-tight tabular-nums">{formatMXN(monthlyTotal(items))}</p>
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

      {active.length > 0 && (
        <ul className="space-y-3">
          {active.map((item) => {
            const badge = badges[status(item.nextDue, now)]
            return (
              <li key={item.id} className="rounded-3xl bg-white p-4 shadow-card">
                <Link to={`/gastos-fijos/${item.id}`} className="-m-2 flex items-start gap-3 rounded-2xl p-2 active:bg-zinc-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="truncate text-sm text-zinc-500">
                      {item.category} · {formatDay(item.nextDue)}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-lg font-semibold tabular-nums">{formatMXN(item.amount)}</p>
                </Link>
                <div className="mt-3 flex items-center justify-between gap-3">
                  {badge ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>{badge.text}</span>
                  ) : (
                    <span />
                  )}
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
      )}

      {paused.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-medium text-zinc-500">Pausados</h2>
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

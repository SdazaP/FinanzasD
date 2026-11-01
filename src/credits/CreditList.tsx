import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { formatDay, status, today } from '../lib/dates'
import { formatMXN } from '../lib/money'
import { watchCredits, type Credit } from './api'
import { debtTotal, msiSummary } from './calc'

const badges = {
  overdue: { text: 'Vencido', className: 'bg-red-50 text-red-700' },
  soon: { text: 'Pronto', className: 'bg-accent-yellow/35 text-amber-900' },
  ok: null,
}

function Bar({ value, label }: { value: number; label: string }) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-zinc-100">
      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  )
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

export default function CreditList() {
  const uid = useAuth()!.uid
  const [items, setItems] = useState<Credit[]>()
  const [loadError, setLoadError] = useState(false)

  useEffect(() => watchCredits(uid, setItems, () => setLoadError(true)), [uid])

  if (loadError) return <p role="alert" className="text-red-700">No se pudieron cargar tus créditos. Revisa tu conexión.</p>
  if (!items) return <p className="text-zinc-500">Cargando…</p>

  const now = today()

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="text-sm text-white/80">Deuda total</p>
        <p className="mt-1 font-display text-4xl font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatMXN(debtTotal(items))}</p>
        <p className="mt-1 text-sm text-white/80">{items.length === 1 ? '1 crédito' : `${items.length} créditos`}</p>
      </section>

      <Link
        to="/creditos/nuevo"
        className="flex min-h-12 items-center justify-center rounded-2xl bg-white font-medium text-primary shadow-card transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        Agregar crédito
      </Link>

      {items.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-zinc-600 shadow-card">
          Aún no tienes créditos. Agrega tus tarjetas y tus compras a meses sin intereses para ver cuánto debes.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((credit) => {
            const badge = badges[status(credit.nextDue, now)]
            const subtitle = credit.kind === 'card' ? 'Tarjeta' : [credit.card, 'MSI'].filter(Boolean).join(' · ')
            return (
              <li key={credit.id} className="rounded-3xl bg-white p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{credit.name}</p>
                    <p className="truncate text-sm text-zinc-500">
                      {subtitle} · {formatDay(credit.nextDue)}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-lg font-semibold tabular-nums">{formatMXN(credit.balance)}</p>
                </div>
                <Details credit={credit} />
                {badge && <span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>{badge.text}</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { formatDay, status, today } from '../lib/dates'
import { formatMXN, toCents } from '../lib/money'
import { fieldClass } from '../lib/ui'
import { payCredit, watchCredits, type Credit } from './api'
import { debtTotal, msiSummary, paymentError } from './calc'

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

function PayRow({ uid, credit, badge }: { uid: string; credit: Credit; badge: (typeof badges)[keyof typeof badges] }) {
  const [amount, setAmount] = useState<string | null>(null) // null = cerrado
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const suggested = credit.kind === 'card' ? credit.balance : msiSummary(credit).suggested

  async function confirm() {
    const cents = toCents(amount ?? '')
    const problem = paymentError(cents, credit.balance)
    setError(problem)
    if (problem || !cents) return
    setSaving(true)
    try {
      await payCredit(uid, credit, cents)
      setAmount(null)
    } catch {
      setError('No se pudo registrar el pago. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (amount === null) {
    return (
      <div className="mt-3 flex items-center justify-between gap-3">
        {badge ? <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>{badge.text}</span> : <span />}
        <button
          type="button"
          onClick={() => setAmount((suggested / 100).toFixed(2))}
          aria-label={`Pagar ${credit.name}`}
          className="min-h-11 rounded-xl bg-primary/10 px-5 text-sm font-medium text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Pagar
        </button>
      </div>
    )
  }

  const inputId = `pay-${credit.id}`
  return (
    <div className="mt-3 rounded-2xl bg-canvas p-3">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">Monto a pagar</label>
      <input
        id={inputId}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        autoFocus
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={fieldClass}
      />
      {error && <p id={`${inputId}-error`} className="mt-1 text-sm text-red-700">{error}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setAmount(null)
            setError('')
          }}
          className="min-h-11 rounded-xl bg-white text-sm font-medium active:scale-[0.97]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={saving}
          className="min-h-11 rounded-xl bg-primary text-sm font-medium text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Confirmar'}
        </button>
      </div>
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
  const active = items.filter((c) => c.balance > 0)
  const settled = items.filter((c) => c.balance <= 0)

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="text-sm text-white/80">Deuda total</p>
        <p className="mt-1 font-display text-4xl font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatMXN(debtTotal(items))}</p>
        <p className="mt-1 text-sm text-white/80">{active.length === 1 ? '1 crédito activo' : `${active.length} créditos activos`}</p>
      </section>

      <Link
        to="/creditos/nuevo"
        className="flex min-h-12 items-center justify-center rounded-2xl bg-white font-medium text-primary shadow-card transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        Agregar crédito
      </Link>

      {items.length === 0 && (
        <p className="rounded-3xl bg-white p-6 text-zinc-600 shadow-card">
          Aún no tienes créditos. Agrega tus tarjetas y tus compras a meses sin intereses para ver cuánto debes.
        </p>
      )}

      {active.length > 0 && (
        <ul className="space-y-3">
          {active.map((credit) => {
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
                <PayRow uid={uid} credit={credit} badge={badge} />
              </li>
            )
          })}
        </ul>
      )}

      {settled.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-medium text-zinc-500">Liquidados</h2>
          <ul className="space-y-3">
            {settled.map((credit) => (
              <li key={credit.id} className="flex items-center gap-3 rounded-3xl bg-white/60 p-4 text-zinc-500">
                <p className="min-w-0 flex-1 truncate">{credit.name}</p>
                <p className="shrink-0 text-sm">Liquidado</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import { formatMXN } from '../lib/money'
import {
  addCategory, deletePayment, deleteRecurring, setRecurringActive, updateRecurring, watchPayments, watchRecurringItem,
  type Payment, type Recurring,
} from './api'
import { formatDay } from '../lib/dates'
import RecurringForm from './RecurringForm'
import { useCategories } from './useCategories'

const card = 'rounded-3xl bg-white p-5 shadow-card'

export default function RecurringDetail() {
  const uid = useAuth()!.uid
  const id = useParams().id!
  const navigate = useNavigate()
  const [item, setItem] = useState<Recurring | null>()
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const allCategories = useCategories(uid)

  useEffect(() => watchRecurringItem(uid, id, setItem, () => setError('No se pudo cargar el gasto. Revisa tu conexión.')), [uid, id])
  useEffect(() => watchPayments(uid, id, setPayments, () => setError('No se pudo cargar el historial.')), [uid, id])

  if (item === null) return <Navigate to="/gastos-fijos" replace />
  if (!item) return error ? <p role="alert" className="text-red-700">{error}</p> : <p className="text-zinc-500">Cargando…</p>

  async function run(action: () => Promise<unknown>, failure: string) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch {
      setError(failure)
    } finally {
      setBusy(false)
    }
  }

  const categories = allCategories.includes(item.category) ? allCategories : [...allCategories, item.category]

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <section className={card}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="truncate font-display text-lg font-semibold">{item.name}</h2>
          {!item.active && <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">Pausado</span>}
        </div>
        <RecurringForm
          key={item.id}
          categories={categories}
          initial={item}
          onCreateCategory={(name) => addCategory(uid, name)}
          onSubmit={async (input) => {
            await updateRecurring(uid, id, input)
            navigate('/gastos-fijos')
          }}
        />
      </section>

      <section className={`${card} grid grid-cols-2 gap-3`}>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => setRecurringActive(uid, id, !item.active), 'No se pudo cambiar el estado.')}
          className="min-h-12 rounded-2xl bg-zinc-100 font-medium transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
        >
          {item.active ? 'Pausar' : 'Reactivar'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm(`¿Eliminar "${item.name}" y todo su historial de pagos? No se puede deshacer.`)) {
              run(() => deleteRecurring(uid, id), 'No se pudo eliminar el gasto.')
            }
          }}
          className="min-h-12 rounded-2xl bg-red-50 font-medium text-red-700 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
        >
          Eliminar
        </button>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-display text-lg font-semibold">Historial de pagos</h2>
        {payments.length === 0 ? (
          <p className="text-zinc-500">Todavía no hay pagos registrados.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <p className="min-w-0 flex-1 text-zinc-600">{formatDay(p.dueDate, true)}</p>
                <p className="shrink-0 font-medium tabular-nums">{formatMXN(p.amount)}</p>
                <button
                  type="button"
                  aria-label={`Borrar pago del ${formatDay(p.dueDate, true)}`}
                  onClick={() => {
                    if (confirm(`¿Borrar el pago del ${formatDay(p.dueDate, true)}?`)) {
                      run(() => deletePayment(uid, id, p.id), 'No se pudo borrar el pago.')
                    }
                  }}
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-zinc-400 transition-colors duration-150 active:bg-red-50 active:text-red-700"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

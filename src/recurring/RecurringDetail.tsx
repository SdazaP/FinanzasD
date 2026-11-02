import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import PaymentHistory, { type Payment } from '../lib/PaymentHistory'
import {
  addCategory, deletePayment, deleteRecurring, setRecurringActive, updateRecurring, watchPayments, watchRecurringItem,
  type Recurring,
} from './api'
import { useAccounts } from '../money/useAccounts'
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
  const { liveIds } = useAccounts(uid)

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

      <PaymentHistory payments={payments} onDelete={(p) => run(() => deletePayment(uid, id, p, liveIds), 'No se pudo borrar el pago.')} />
    </div>
  )
}

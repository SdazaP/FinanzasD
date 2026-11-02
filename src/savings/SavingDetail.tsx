import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import { formatMXN } from '../lib/money'
import PaymentHistory from '../lib/PaymentHistory'
import { deleteMovement, deleteSaving, updateSaving, watchMovements, watchSaving, type Movement, type Saving } from './api'
import { useAccounts } from '../money/useAccounts'
import SavingForm from './SavingForm'

const card = 'rounded-3xl bg-surface p-5 shadow-card'

const movementLabel = (m: Movement) => (m.initial ? 'Saldo inicial' : m.type === 'deposit' ? 'Aporte' : 'Retiro')

export default function SavingDetail() {
  const uid = useAuth()!.uid
  const id = useParams().id!
  const navigate = useNavigate()
  const [saving, setSaving] = useState<Saving | null>()
  const [movements, setMovements] = useState<Movement[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { liveIds } = useAccounts(uid)

  useEffect(() => watchSaving(uid, id, setSaving, () => setError('No se pudo cargar el apartado. Revisa tu conexión.')), [uid, id])
  useEffect(() => watchMovements(uid, id, setMovements, () => setError('No se pudo cargar el historial.')), [uid, id])

  if (saving === null) return <Navigate to="/ahorro" replace />
  if (!saving) return error ? <p role="alert" className="text-red-700">{error}</p> : <p className="text-zinc-500">Cargando…</p>

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

  function removeMovement(m: Movement) {
    // Borrar un aporte resta del saldo: no puede dejarlo negativo
    if (m.type === 'deposit' && m.amount > saving!.balance) {
      setError(`No se puede borrar: el saldo (${formatMXN(saving!.balance)}) quedaría negativo. Borra antes los retiros posteriores.`)
      return
    }
    run(() => deleteMovement(uid, id, m, liveIds), 'No se pudo borrar el movimiento.')
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <section className={card}>
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="truncate font-display text-lg font-semibold">{saving.name}</h2>
          <p className="shrink-0 font-display text-lg font-semibold tabular-nums">{formatMXN(saving.balance)}</p>
        </div>
        <SavingForm
          key={saving.id}
          initial={saving}
          onSubmit={async (input) => {
            await updateSaving(uid, id, input)
            navigate('/ahorro')
          }}
        />
      </section>

      <section className={card}>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm(`¿Eliminar "${saving.name}" y todos sus movimientos? No se puede deshacer.`)) {
              run(() => deleteSaving(uid, id), 'No se pudo eliminar el apartado.')
            }
          }}
          className="min-h-12 w-full rounded-2xl bg-red-50 font-medium text-red-700 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
        >
          Eliminar apartado
        </button>
      </section>

      <PaymentHistory
        title="Historial de movimientos"
        emptyText="Todavía no hay movimientos."
        payments={movements.map((m) => ({
          id: m.id, dueDate: m.date, amount: m.type === 'deposit' ? m.amount : -m.amount, label: movementLabel(m),
        }))}
        onDelete={(p) => removeMovement(movements.find((m) => m.id === p.id)!)}
      />
    </div>
  )
}

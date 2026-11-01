import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import { useToday } from '../lib/useToday'
import { addSpendingCategory, deleteSpending, updateSpending, watchSpending } from './api'
import type { Spending } from './calc'
import { useSpendingCategories } from './categories'
import SpendingForm from './SpendingForm'

const card = 'rounded-3xl bg-white p-5 shadow-card'

export default function SpendingDetail() {
  const uid = useAuth()!.uid
  const id = useParams().id!
  const navigate = useNavigate()
  const now = useToday()
  const allCategories = useSpendingCategories(uid)
  const [item, setItem] = useState<Spending | null>()
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => watchSpending(uid, id, setItem, () => setError('No se pudo cargar el gasto. Revisa tu conexión.')), [uid, id])

  if (item === null) return <Navigate to="/gastos-hormiga" replace />
  if (!item) return error ? <p role="alert" className="text-red-700">{error}</p> : <p className="text-zinc-500">Cargando…</p>

  // Conserva la categoría del gasto aunque ya no esté en la lista
  const categories = allCategories.includes(item.category) ? allCategories : [...allCategories, item.category]

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <section className={card}>
        <h2 className="mb-4 font-display text-lg font-semibold">Editar gasto</h2>
        <SpendingForm
          key={item.id}
          categories={categories}
          today={now}
          initial={item}
          submitLabel="Guardar"
          onCreateCategory={(name) => addSpendingCategory(uid, name)}
          onSubmit={async (input) => {
            await updateSpending(uid, id, input)
            navigate('/gastos-hormiga')
          }}
        />
      </section>

      <section className={card}>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            if (!confirm('¿Eliminar este gasto? No se puede deshacer.')) return
            setDeleting(true)
            setError('')
            try {
              await deleteSpending(uid, id)
            } catch {
              setError('No se pudo eliminar el gasto.')
              setDeleting(false)
            }
          }}
          className="min-h-12 w-full rounded-2xl bg-red-50 font-medium text-red-700 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
        >
          Eliminar gasto
        </button>
      </section>
    </div>
  )
}

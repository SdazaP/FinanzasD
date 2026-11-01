import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { formatMXN } from '../lib/money'
import { watchRecurring, type Recurring } from './api'

export default function RecurringList() {
  const uid = useAuth()!.uid
  const [items, setItems] = useState<Recurring[]>()
  const [error, setError] = useState(false)

  useEffect(() => watchRecurring(uid, setItems, () => setError(true)), [uid])

  if (error) return <p role="alert" className="text-red-700">No se pudieron cargar tus gastos. Revisa tu conexión.</p>
  if (!items) return <p className="text-zinc-500">Cargando…</p>

  return (
    <div className="space-y-4">
      <Link
        to="/gastos-fijos/nuevo"
        className="flex min-h-12 items-center justify-center rounded-2xl bg-primary font-medium text-white shadow-card transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        Agregar gasto
      </Link>

      {items.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-zinc-600 shadow-card">
          Aún no tienes gastos fijos. Agrega tu renta, servicios o suscripciones para ver cuánto pagas al mes.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <p className="truncate text-sm text-zinc-500">{item.category}</p>
              </div>
              <p className="shrink-0 font-display text-lg font-semibold tabular-nums">{formatMXN(item.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

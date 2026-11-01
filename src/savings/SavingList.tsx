import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { today } from '../lib/dates'
import AmountAction from '../lib/AmountAction'
import { formatMXN } from '../lib/money'
import ProgressBar from '../lib/ProgressBar'
import { moveSaving, watchSavings, type MovementType, type Saving } from './api'
import { goalSummary, movementError, totalSaved } from './calc'

const monthYear = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' })
const formatMonth = (date: string) => {
  const [y, m] = date.split('-').map(Number)
  return monthYear.format(new Date(y, m - 1, 1))
}

function Goal({ saving, now }: { saving: Saving; now: string }) {
  const goal = goalSummary(saving, now)
  if (goal.status === 'no-target') return null
  return (
    <div className="mt-3 space-y-1.5">
      <ProgressBar value={goal.progress} label={`Avance de ${saving.name}`} />
      <p className="text-xs text-zinc-500">
        {Math.round(goal.progress * 100)}% de {formatMXN(saving.target!)}
        {goal.status === 'reached' && <span className="font-medium text-emerald-700"> · Meta alcanzada</span>}
        {goal.status === 'overdue' && <> · Faltan {formatMXN(goal.missing)} · <span className="font-medium text-red-700">La fecha ya pasó</span></>}
        {goal.status === 'on-track' && ` · Faltan ${formatMXN(goal.missing)}`}
      </p>
      {goal.status === 'on-track' && goal.monthly && (
        <p className="text-sm font-medium text-primary">
          Ahorra {formatMXN(goal.monthly)} al mes hasta {formatMonth(saving.deadline!)}
        </p>
      )}
    </div>
  )
}

const actionButton = 'min-h-11 rounded-xl px-5 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.97]'

function Movements({ uid, saving }: { uid: string; saving: Saving }) {
  const [open, setOpen] = useState<MovementType | null>(null)

  if (open) {
    return (
      <AmountAction
        id={`${open}-${saving.id}`}
        label={open === 'deposit' ? 'Monto a aportar' : 'Monto a retirar'}
        validate={(cents) => movementError(cents, open, saving.balance)}
        onConfirm={(cents) => moveSaving(uid, saving, open, cents)}
        onDone={() => setOpen(null)}
      />
    )
  }

  return (
    <div className="mt-3 flex justify-end gap-2">
      {saving.balance > 0 && (
        <button type="button" onClick={() => setOpen('withdrawal')} aria-label={`Retirar de ${saving.name}`} className={`${actionButton} bg-zinc-100`}>
          Retirar
        </button>
      )}
      <button type="button" onClick={() => setOpen('deposit')} aria-label={`Aportar a ${saving.name}`} className={`${actionButton} bg-primary/10 text-primary`}>
        Aportar
      </button>
    </div>
  )
}

export default function SavingList() {
  const uid = useAuth()!.uid
  const [items, setItems] = useState<Saving[]>()
  const [loadError, setLoadError] = useState(false)

  useEffect(() => watchSavings(uid, setItems, () => setLoadError(true)), [uid])

  if (loadError) return <p role="alert" className="text-red-700">No se pudo cargar tu ahorro. Revisa tu conexión.</p>
  if (!items) return <p className="text-zinc-500">Cargando…</p>

  const now = today()

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="text-sm text-white/80">Total ahorrado</p>
        <p className="mt-1 font-display text-4xl font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatMXN(totalSaved(items))}</p>
        <p className="mt-1 text-sm text-white/80">{items.length === 1 ? '1 apartado' : `${items.length} apartados`}</p>
      </section>

      <Link
        to="/ahorro/nuevo"
        className="flex min-h-12 items-center justify-center rounded-2xl bg-white font-medium text-primary shadow-card transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        Agregar apartado
      </Link>

      {items.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-zinc-600 shadow-card">
          Aún no tienes apartados. Crea uno para tu fondo de emergencias o para una meta como un viaje.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((saving) => (
            <li key={saving.id} className="rounded-3xl bg-white p-4 shadow-card">
              <Link to={`/ahorro/${saving.id}`} className="-m-2 block rounded-2xl p-2 active:bg-zinc-50">
                <div className="flex items-start gap-3">
                  <p className="min-w-0 flex-1 truncate font-medium">{saving.name}</p>
                  <p className="shrink-0 font-display text-lg font-semibold tabular-nums">{formatMXN(saving.balance)}</p>
                </div>
                <Goal saving={saving} now={now} />
              </Link>
              <Movements uid={uid} saving={saving} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

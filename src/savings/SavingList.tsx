import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { today } from '../lib/dates'
import AmountAction from '../lib/AmountAction'
import AccountPicker from '../money/AccountPicker'
import { useAccounts } from '../money/useAccounts'
import { formatMXN } from '../lib/money'
import ProgressBar from '../lib/ProgressBar'
import { moveSaving, watchSavings, type MovementType, type Saving } from './api'
import { goalSummary, movementError, plannedSaved, totalSaved } from './calc'
import { formatDay } from '../lib/dates'

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
        {goal.status === 'reached' && <span className="font-medium text-emerald-700"> · {saving.planned ? 'Ya tienes todo' : 'Meta alcanzada'}</span>}
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

function Movements({ uid, saving, money }: { uid: string; saving: Saving; money: ReturnType<typeof useAccounts> }) {
  const [open, setOpen] = useState<MovementType | null>(null)
  const [accountId, setAccountId] = useState<string>()
  const account = accountId ?? money.defaultId

  if (open) {
    return (
      <AmountAction
        id={`${open}-${saving.id}`}
        label={open === 'deposit' ? 'Monto a aportar' : 'Monto a retirar'}
        validate={(cents) => movementError(cents, open, saving.balance)}
        onConfirm={(cents) => moveSaving(uid, saving, open, cents, account, money.liveIds)}
        onDone={() => setOpen(null)}
      >
        <AccountPicker accounts={money.accounts ?? []} value={account} onChange={setAccountId} label={open === 'deposit' ? 'Desde' : 'Hacia'} />
      </AmountAction>
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
  const money = useAccounts(uid)

  useEffect(() => watchSavings(uid, setItems, () => setLoadError(true)), [uid])

  if (loadError) return <p role="alert" className="text-red-700">No se pudo cargar tu ahorro. Revisa tu conexión.</p>
  if (!items) return <p className="text-zinc-500">Cargando…</p>

  const now = today()
  const planned = items.filter((s) => s.planned && !s.spentAt).sort((a, b) => a.deadline!.localeCompare(b.deadline!))
  const spent = items.filter((s) => s.planned && s.spentAt)
  const regular = items.filter((s) => !s.planned)
  const forPlanned = plannedSaved(items)

  const row = (saving: Saving, subtitle?: string) => (
    <li key={saving.id} className="rounded-3xl bg-surface p-4 shadow-card">
      <Link to={`/ahorro/${saving.id}`} className="-m-2 block rounded-2xl p-2 active:bg-zinc-50">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{saving.name}</p>
            {subtitle && <p className="truncate text-sm text-zinc-500">{subtitle}</p>}
          </div>
          <p className="shrink-0 font-display text-lg font-semibold tabular-nums">{formatMXN(saving.balance)}</p>
        </div>
        {!saving.spentAt && <Goal saving={saving} now={now} />}
        {saving.spentAt && saving.balance > 0 && <p className="mt-2 text-sm text-primary">Te sobraron {formatMXN(saving.balance)}: retíralos a una cuenta</p>}
      </Link>
      {(!saving.spentAt || saving.balance > 0) && <Movements uid={uid} saving={saving} money={money} />}
    </li>
  )

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="text-sm text-white/80">Total ahorrado</p>
        <p className="mt-1 font-display text-[clamp(1.5rem,8vw,2.25rem)] font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatMXN(totalSaved(items))}</p>
        <p className="mt-1 text-sm text-white/80">{items.length === 1 ? '1 apartado' : `${items.length} apartados`}</p>
        {forPlanned > 0 && <p className="mt-1 text-sm text-white/80">De eso, <span className="font-medium text-white tabular-nums">{formatMXN(forPlanned)}</span> para gastos planeados</p>}
      </section>

      <div className="grid grid-cols-2 gap-3">
        {[['/ahorro/nuevo', 'Agregar apartado'], ['/ahorro/planear', 'Planear gasto']].map(([to, text]) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-12 items-center justify-center rounded-2xl bg-surface text-sm font-medium text-primary shadow-card transition-transform duration-150 ease-out active:scale-[0.98]"
          >
            {text}
          </Link>
        ))}
      </div>

      {planned.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-medium text-zinc-500">Gastos planeados</h2>
          <ul className="space-y-3">{planned.map((s) => row(s, `${s.category} · ${formatDay(s.deadline!, true)}`))}</ul>
        </section>
      )}

      {regular.length > 0 && planned.length > 0 && <h2 className="-mb-2 px-1 text-sm font-medium text-zinc-500">Apartados</h2>}
      {items.length === 0 ? (
        <p className="rounded-3xl bg-surface p-6 text-zinc-600 shadow-card">
          Aún no tienes apartados. Crea uno para tu fondo de emergencias o para una meta como un viaje.
        </p>
      ) : (
        <ul className="space-y-3">{regular.map((s) => row(s))}</ul>
      )}

      {spent.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-medium text-zinc-500">Gastados</h2>
          <ul className="space-y-3">{spent.map((s) => row(s, `Gastado el ${formatDay(s.spentAt!, true)}`))}</ul>
        </section>
      )}
    </div>
  )
}

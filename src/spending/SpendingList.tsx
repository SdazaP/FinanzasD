import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import GastosTabs from '../layout/GastosTabs'
import AmountAction from '../lib/AmountAction'
import { monthRange } from '../lib/dates'
import { formatMXN } from '../lib/money'
import ProgressBar from '../lib/ProgressBar'
import { useToday } from '../lib/useToday'
import { useAccounts } from '../money/useAccounts'
import { addSpending, addSpendingCategory, setCap, watchCap, watchMonthSpending } from './api'
import { capSummary, groupByDay, totalsByCategory, type Spending } from './calc'
import { useSpendingCategories } from './categories'
import SpendingForm from './SpendingForm'

function MonthCard({ uid, total, count, cap }: { uid: string; total: number; count: number; cap?: number }) {
  const [editing, setEditing] = useState(false)
  const summary = capSummary(total, cap)

  return (
    <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
      <p className="text-sm text-white/80">Gastado este mes</p>
      <p className="mt-1 font-display text-4xl font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatMXN(total)}</p>
      <p className="mt-1 text-sm text-white/80">{count === 1 ? '1 gasto' : `${count} gastos`}</p>

      {summary && (
        <div className="mt-4 space-y-1.5">
          <ProgressBar value={summary.progress} label="Avance del tope" onDark />
          <p className="text-sm">
            {summary.over ? (
              <span className="font-medium">Te pasaste por {formatMXN(summary.over)}</span>
            ) : (
              <>Te quedan <span className="font-medium tabular-nums">{formatMXN(summary.remaining)}</span> de {formatMXN(cap!)}</>
            )}
          </p>
        </div>
      )}

      {editing ? (
        <div className="text-ink">
          <AmountAction
            id="spending-cap"
            label="Tope mensual"
            initialCents={cap}
            validate={(cents) => (cents && cents > 0 ? '' : 'Escribe un tope mayor a $0.')}
            onConfirm={(cents) => setCap(uid, cents)}
            onDone={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setEditing(true)} className="min-h-11 rounded-xl bg-white/15 px-4 text-sm font-medium active:bg-white/25">
            {cap ? 'Cambiar tope' : 'Definir tope'}
          </button>
          {cap && (
            <button type="button" onClick={() => setCap(uid, null)} className="min-h-11 rounded-xl px-4 text-sm font-medium text-white/80 active:bg-white/15">
              Quitar tope
            </button>
          )}
        </div>
      )}
    </section>
  )
}

export default function SpendingList() {
  const uid = useAuth()!.uid
  const now = useToday()
  const [from, to] = monthRange(now)
  const [items, setItems] = useState<Spending[]>()
  const [cap, setCapValue] = useState<number>()
  const [loadError, setLoadError] = useState(false)
  const categories = useSpendingCategories(uid)
  const money = useAccounts(uid)

  useEffect(() => watchMonthSpending(uid, from, to, setItems, () => setLoadError(true)), [uid, from, to])
  useEffect(() => watchCap(uid, setCapValue), [uid])

  const total = (items ?? []).reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="space-y-4">
      <GastosTabs />

      {loadError && <p role="alert" className="text-red-700">No se pudieron cargar tus gastos hormiga. Revisa tu conexión.</p>}
      {!items && !loadError && <p className="text-zinc-500">Cargando…</p>}

      {items && (
        <>
          <MonthCard uid={uid} total={total} count={items.length} cap={cap} />

          <section className="rounded-3xl bg-white p-5 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold">Registrar gasto</h2>
            <SpendingForm
              categories={categories}
              today={now}
              accounts={money.accounts}
              defaultAccountId={money.defaultId}
              onSubmit={(input) => addSpending(uid, input, money.liveIds)}
              onCreateCategory={(name) => addSpendingCategory(uid, name)}
            />
          </section>

          {items.length === 0 ? (
            <p className="rounded-3xl bg-white p-6 text-zinc-600 shadow-card">Aún no registras gastos hormiga este mes.</p>
          ) : (
            <>
              <details className="rounded-3xl bg-white p-5 shadow-card">
                <summary className="cursor-pointer font-display text-lg font-semibold">Por categoría</summary>
                <ul className="mt-3 divide-y divide-zinc-100">
                  {totalsByCategory(items).map(({ category, total: catTotal }) => (
                    <li key={category} className="flex justify-between gap-3 py-2">
                      <span className="min-w-0 truncate text-zinc-600">{category}</span>
                      <span className="shrink-0 font-medium tabular-nums">{formatMXN(catTotal)}</span>
                    </li>
                  ))}
                </ul>
              </details>

              {groupByDay(items, now).map((group) => (
                <section key={group.date} className="rounded-3xl bg-white p-5 shadow-card">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h2 className="font-medium first-letter:uppercase">{group.label}</h2>
                    <p className="text-sm text-zinc-500 tabular-nums">{formatMXN(group.total)}</p>
                  </div>
                  <ul className="-mx-2">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link to={`/gastos-hormiga/${item.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 active:bg-zinc-50">
                          <div className="min-w-0 flex-1">
                            <p className="truncate">{item.category}</p>
                            {item.note && <p className="truncate text-sm text-zinc-500">{item.note}</p>}
                          </div>
                          <p className="shrink-0 font-medium tabular-nums">{formatMXN(item.amount)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

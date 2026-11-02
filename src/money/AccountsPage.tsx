import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { formatDay } from '../lib/dates'
import { formatMXN } from '../lib/money'
import { useToday } from '../lib/useToday'
import { addIncome, deleteIncome, updateIncome, type Income } from './api'
import { accountTypes, availableTotal } from './calc'
import IncomeForm from './IncomeForm'
import { useAccounts } from './useAccounts'
import { useMonthMoney } from './useMonthMoney'

const card = 'rounded-3xl bg-white p-5 shadow-card'
const typeLabel = Object.fromEntries(accountTypes)

const signed = (cents: number) => (cents < 0 ? 'text-red-600' : '')

export default function AccountsPage() {
  const uid = useAuth()!.uid
  const now = useToday()
  const { accounts, defaultId, liveIds, error } = useAccounts(uid)
  const month = useMonthMoney(uid, now, availableTotal(accounts ?? []))
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string>()
  const [actionError, setActionError] = useState('')

  if (error) return <p role="alert" className="text-red-700">No se pudieron cargar tus cuentas. Revisa tu conexión.</p>
  if (!accounts) return <p className="text-zinc-500">Cargando…</p>

  if (accounts.length === 0) {
    return (
      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="font-display text-lg font-medium leading-snug">
          Registra dónde tienes tu dinero para saber cuánto tienes disponible y cuánto te queda en el mes.
        </p>
        <Link to="/cuentas/nueva" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-medium text-primary">
          Crear mi primera cuenta
        </Link>
      </section>
    )
  }

  async function repeat(income: Income) {
    setActionError('')
    try {
      await addIncome(uid, { ...income, date: now }, liveIds)
    } catch {
      setActionError('No se pudo repetir el ingreso.')
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="text-sm text-white/80">Disponible</p>
        <p className="mt-1 font-display text-[clamp(1.5rem,8vw,2.25rem)] font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatMXN(availableTotal(accounts))}</p>
        <p className="mt-2 text-sm">
          <span className="text-white/80">Te queda este mes </span>
          <span className="font-medium tabular-nums">{month.ready ? formatMXN(month.left) : '…'}</span>
        </p>
        {month.ready && month.expected > 0 && (
          <p className="mt-1 text-xs text-white/70">Incluye tu segunda quincena esperada ({formatMXN(month.expected)})</p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          aria-expanded={adding}
          className="min-h-12 rounded-2xl bg-white font-medium text-primary shadow-card transition-transform duration-150 ease-out active:scale-[0.98]"
        >
          Registrar ingreso
        </button>
        <Link to="/cuentas/nueva" className="flex min-h-12 items-center justify-center rounded-2xl bg-white font-medium text-primary shadow-card active:scale-[0.98]">
          Agregar cuenta
        </Link>
      </div>

      {adding && (
        <section className={card}>
          <h2 className="mb-4 font-display text-lg font-semibold">Nuevo ingreso</h2>
          <IncomeForm
            accounts={accounts}
            defaultAccountId={defaultId}
            today={now}
            onSubmit={async (input) => {
              await addIncome(uid, input, liveIds)
              setAdding(false)
            }}
          />
        </section>
      )}

      {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}

      <section className={card}>
        <h2 className="mb-2 font-display text-lg font-semibold">Tus cuentas</h2>
        <ul className="-mx-2">
          {accounts.map((a) => (
            <li key={a.id}>
              <Link to={`/cuentas/${a.id}`} className="flex min-h-14 items-center gap-3 rounded-2xl px-2 active:bg-zinc-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="text-sm text-zinc-500">
                    {typeLabel[a.type]}
                    {a.id === defaultId && ' · Predeterminada'}
                  </p>
                </div>
                <p className={`shrink-0 font-display font-semibold tabular-nums ${signed(a.balance)}`}>{formatMXN(a.balance)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="mb-2 font-display text-lg font-semibold">Ingresos del mes</h2>
        {month.incomes.length === 0 ? (
          <p className="text-zinc-500">Aún no registras ingresos este mes.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {month.incomes.map((income) => (
              <li key={income.id} className="py-2.5">
                {editing === income.id ? (
                  <div className="space-y-3">
                    <IncomeForm
                      accounts={accounts}
                      today={now}
                      initial={income}
                      submitLabel="Guardar"
                      onSubmit={async (input) => {
                        await updateIncome(uid, income, input, liveIds)
                        setEditing(undefined)
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setEditing(undefined)} className="min-h-11 rounded-xl bg-zinc-100 text-sm font-medium">
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('¿Eliminar este ingreso? Se restará de su cuenta.')) return
                          try {
                            await deleteIncome(uid, income, liveIds)
                          } catch {
                            setActionError('No se pudo eliminar el ingreso.')
                          }
                        }}
                        className="min-h-11 rounded-xl bg-red-50 text-sm font-medium text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setEditing(income.id)} className="min-w-0 flex-1 text-left" aria-label={`Editar ingreso ${income.concept} del ${formatDay(income.date)}`}>
                      <p className="truncate font-medium">{income.concept}{income.note ? ` · ${income.note}` : ''}</p>
                      <p className="truncate text-sm text-zinc-500">
                        {formatDay(income.date)} · {accounts.find((a) => a.id === income.accountId)?.name ?? 'Cuenta eliminada'}
                      </p>
                    </button>
                    <p className="shrink-0 font-medium text-emerald-700 tabular-nums">+{formatMXN(income.amount)}</p>
                    <button type="button" onClick={() => repeat(income)} className="min-h-11 shrink-0 rounded-xl bg-primary/10 px-3 text-sm font-medium text-primary">
                      Repetir
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

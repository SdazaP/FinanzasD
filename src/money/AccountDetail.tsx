import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import { formatDay } from '../lib/dates'
import { formatMXN, toCents } from '../lib/money'
import { fieldClass } from '../lib/ui'
import { useToday } from '../lib/useToday'
import AccountForm from './AccountForm'
import { adjustBalance, deleteAccount, setDefaultAccount, updateAccount } from './api'
import type { Account } from './calc'
import { useAccountActivity } from './useAccountActivity'
import { useAccounts } from './useAccounts'

const card = 'rounded-3xl bg-surface p-5 shadow-card'

function AdjustBalance({ uid, account }: { uid: string; account: Account }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const cents = toCents(value)
    if (cents === null || !value.trim()) {
      setError('Escribe el saldo real (puede ser 0).')
      return
    }
    setSaving(true)
    setError('')
    try {
      await adjustBalance(uid, account, cents)
      setValue('')
    } catch {
      setError('No se pudo ajustar el saldo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className={card}>
      <label htmlFor="adjust" className="mb-1.5 block font-display text-lg font-semibold">Ajustar saldo</label>
      <p className="mb-3 text-sm text-zinc-500">Si no coincide con tu banco, escribe el saldo real. La diferencia queda como "Ajuste".</p>
      <div className="flex gap-2">
        <input
          id="adjust"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="decimal"
          placeholder={(account.balance / 100).toFixed(2)}
          aria-invalid={!!error}
          aria-describedby={error ? 'adjust-error' : undefined}
          className={`${fieldClass} min-w-0 flex-1`}
        />
        <button type="submit" disabled={saving} className="min-h-12 shrink-0 rounded-2xl bg-primary px-5 font-medium text-white disabled:opacity-60">
          {saving ? '…' : 'Ajustar'}
        </button>
      </div>
      {error && <p id="adjust-error" className="mt-1 text-sm text-red-700">{error}</p>}
    </form>
  )
}

export default function AccountDetail() {
  const uid = useAuth()!.uid
  const id = useParams().id!
  const navigate = useNavigate()
  const now = useToday()
  const { accounts, defaultId } = useAccounts(uid)
  const activity = useAccountActivity(uid, id, now)
  const [error, setError] = useState('')

  if (!accounts) return <p className="text-zinc-500">Cargando…</p>
  const account = accounts.find((a) => a.id === id)
  if (!account) return <Navigate to="/cuentas" replace />
  const isDefault = account.id === defaultId

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <section className="rounded-3xl bg-primary p-6 text-white shadow-card">
        <p className="truncate text-sm text-white/80">{account.name}{isDefault && ' · Predeterminada'}</p>
        <p className="mt-1 font-display text-[clamp(1.5rem,8vw,2.25rem)] font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{formatMXN(account.balance)}</p>
        {!isDefault && (
          <button
            type="button"
            onClick={() => setDefaultAccount(uid, account.id).catch(() => setError('No se pudo marcar como predeterminada.'))}
            className="mt-3 min-h-11 rounded-xl bg-white/15 px-4 text-sm font-medium active:bg-white/25"
          >
            Hacer predeterminada
          </button>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-3 font-display text-lg font-semibold">Movimientos del mes</h2>
        {activity.length === 0 ? (
          <p className="text-zinc-500">Sin movimientos este mes.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {activity.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate">{e.label}</p>
                  <p className="text-sm text-zinc-500">{formatDay(e.date)}</p>
                </div>
                <p className={`shrink-0 font-medium tabular-nums ${e.amount > 0 ? 'text-emerald-700' : ''}`}>
                  {e.amount > 0 ? '+' : ''}{formatMXN(e.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AdjustBalance uid={uid} account={account} />

      <section className={card}>
        <h2 className="mb-5 font-display text-lg font-semibold">Editar cuenta</h2>
        <AccountForm
          key={account.id}
          initial={account}
          withBalance={false}
          onSubmit={async ({ name, type }) => {
            await updateAccount(uid, account.id, { name, type })
            navigate('/cuentas')
          }}
        />
      </section>

      <section className={card}>
        <button
          type="button"
          onClick={async () => {
            if (!confirm(`¿Eliminar "${account.name}"? Los pagos y gastos que salieron de ella se conservan, pero ya no moverán ningún saldo.`)) return
            try {
              await deleteAccount(uid, account.id, isDefault)
            } catch {
              setError('No se pudo eliminar la cuenta.')
            }
          }}
          className="min-h-12 w-full rounded-2xl bg-red-50 font-medium text-red-700 transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Eliminar cuenta
        </button>
      </section>
    </div>
  )
}

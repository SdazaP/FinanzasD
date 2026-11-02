import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import PaymentHistory, { type Payment } from '../lib/PaymentHistory'
import { deleteCredit, deleteCreditPayment, updateCredit, watchCredit, watchCreditPayments, type Credit } from './api'
import { useAccounts } from '../money/useAccounts'
import { formatMXN } from '../lib/money'
import CreditForm from './CreditForm'
import { useCards } from './useCards'

const card = 'rounded-3xl bg-surface p-5 shadow-card'

// MSI de una tarjeta: lo que falta de cada uno cuenta como crédito usado
function CardMsis({ msis }: { msis: Credit[] }) {
  if (!msis.length) return null
  return (
    <section className={card}>
      <h2 className="mb-2 font-display text-lg font-semibold">Meses sin intereses</h2>
      <ul className="-mx-2">
        {msis.map((m) => (
          <li key={m.id}>
            <Link to={`/creditos/${m.id}`} className="flex min-h-12 items-center gap-3 rounded-2xl px-2 active:bg-zinc-50">
              <p className="min-w-0 flex-1 truncate">{m.name}</p>
              <p className="shrink-0 text-sm text-zinc-500 tabular-nums">Faltan {formatMXN(m.balance)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function CreditDetail() {
  const uid = useAuth()!.uid
  const id = useParams().id!
  const navigate = useNavigate()
  const [credit, setCredit] = useState<Credit | null>()
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { liveIds } = useAccounts(uid)
  const { cards, credits } = useCards(uid)

  useEffect(() => watchCredit(uid, id, setCredit, () => setError('No se pudo cargar el crédito. Revisa tu conexión.')), [uid, id])
  useEffect(() => watchCreditPayments(uid, id, setPayments, () => setError('No se pudo cargar el historial.')), [uid, id])

  if (credit === null) return <Navigate to="/creditos" replace />
  if (!credit) return error ? <p role="alert" className="text-red-700">{error}</p> : <p className="text-zinc-500">Cargando…</p>

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

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <section className={card}>
        <h2 className="mb-5 truncate font-display text-lg font-semibold">{credit.name}</h2>
        <CreditForm
          key={credit.id}
          initial={credit}
          cards={cards.filter((c) => c.id !== credit.id)}
          onSubmit={async (input) => {
            await updateCredit(uid, id, input)
            navigate('/creditos')
          }}
        />
      </section>

      {credit.kind === 'card' && <CardMsis msis={credits.filter((c) => c.kind === 'msi' && c.cardId === credit.id && c.balance > 0)} />}

      <section className={card}>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm(`¿Eliminar "${credit.name}" y todo su historial de pagos? No se puede deshacer.`)) {
              run(() => deleteCredit(uid, id), 'No se pudo eliminar el crédito.')
            }
          }}
          className="min-h-12 w-full rounded-2xl bg-red-50 font-medium text-red-700 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
        >
          Eliminar crédito
        </button>
      </section>

      <PaymentHistory byMonth payments={payments} onDelete={(p) => run(() => deleteCreditPayment(uid, id, p, liveIds), 'No se pudo borrar el pago.')} />
    </div>
  )
}

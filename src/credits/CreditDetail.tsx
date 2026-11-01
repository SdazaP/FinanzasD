import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import PaymentHistory, { type Payment } from '../lib/PaymentHistory'
import { deleteCredit, deleteCreditPayment, updateCredit, watchCredit, watchCreditPayments, type Credit } from './api'
import CreditForm from './CreditForm'

const card = 'rounded-3xl bg-white p-5 shadow-card'

export default function CreditDetail() {
  const uid = useAuth()!.uid
  const id = useParams().id!
  const navigate = useNavigate()
  const [credit, setCredit] = useState<Credit | null>()
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
          onSubmit={async (input) => {
            await updateCredit(uid, id, input)
            navigate('/creditos')
          }}
        />
      </section>

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

      <PaymentHistory payments={payments} onDelete={(p) => run(() => deleteCreditPayment(uid, id, p.id), 'No se pudo borrar el pago.')} />
    </div>
  )
}

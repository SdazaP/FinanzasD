import { useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { addCredit } from '../credits/api'
import CreditForm from '../credits/CreditForm'

// Agregar una tarjeta desde Cuentas: es un crédito de tipo tarjeta (se paga en Créditos)
export default function CardNew() {
  const uid = useAuth()!.uid
  const navigate = useNavigate()

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-card">
      <h2 className="mb-5 font-display text-lg font-semibold">Nueva tarjeta de crédito</h2>
      <CreditForm
        onlyCard
        onSubmit={async (input) => {
          await addCredit(uid, input)
          navigate('/cuentas')
        }}
      />
    </section>
  )
}

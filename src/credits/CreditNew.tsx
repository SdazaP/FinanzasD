import { useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { addCredit } from './api'
import CreditForm from './CreditForm'
import { useCards } from './useCards'

export default function CreditNew() {
  const uid = useAuth()!.uid
  const navigate = useNavigate()
  const { cards } = useCards(uid)

  return (
    <section className="rounded-3xl bg-white p-5 shadow-card">
      <h2 className="mb-5 font-display text-lg font-semibold">Nuevo crédito</h2>
      <CreditForm
        cards={cards}
        onSubmit={async (input) => {
          await addCredit(uid, input)
          navigate('/creditos')
        }}
      />
    </section>
  )
}

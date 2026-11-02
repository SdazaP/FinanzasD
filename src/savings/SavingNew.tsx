import { useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { addSaving } from './api'
import SavingForm from './SavingForm'

export default function SavingNew() {
  const uid = useAuth()!.uid
  const navigate = useNavigate()

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-card">
      <h2 className="mb-5 font-display text-lg font-semibold">Nuevo apartado</h2>
      <SavingForm
        onSubmit={async (input) => {
          await addSaving(uid, input)
          navigate('/ahorro')
        }}
      />
    </section>
  )
}

import { useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { useToday } from '../lib/useToday'
import { useSpendingCategories } from '../spending/categories'
import { addSaving } from './api'
import PlannedForm from './PlannedForm'

export default function PlannedNew() {
  const uid = useAuth()!.uid
  const navigate = useNavigate()
  const now = useToday()
  const categories = useSpendingCategories(uid)

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-card">
      <h2 className="mb-5 font-display text-lg font-semibold">Planear gasto</h2>
      <PlannedForm
        categories={categories}
        today={now}
        onSubmit={async (input) => {
          await addSaving(uid, input)
          navigate('/ahorro')
        }}
      />
    </section>
  )
}

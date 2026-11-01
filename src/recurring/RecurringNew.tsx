import { useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { addRecurring } from './api'
import { defaultCategories } from './categories'
import RecurringForm from './RecurringForm'

export default function RecurringNew() {
  const uid = useAuth()!.uid
  const navigate = useNavigate()

  return (
    <section className="rounded-3xl bg-white p-5 shadow-card">
      <h2 className="mb-5 font-display text-lg font-semibold">Nuevo gasto</h2>
      <RecurringForm
        categories={defaultCategories}
        onSubmit={async (input) => {
          await addRecurring(uid, input)
          navigate('/gastos-fijos')
        }}
      />
    </section>
  )
}

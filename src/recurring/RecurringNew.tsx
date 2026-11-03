import { useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { addCategory, addRecurring } from './api'
import RecurringForm from './RecurringForm'
import { useCategories } from './useCategories'

export default function RecurringNew() {
  const uid = useAuth()!.uid
  const navigate = useNavigate()
  const categories = useCategories(uid)

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-card md:mx-auto md:max-w-[35rem] md:p-7">
      <h2 className="mb-5 font-display text-lg font-semibold">Nuevo gasto</h2>
      <RecurringForm
        categories={categories}
        onCreateCategory={(name) => addCategory(uid, name)}
        onSubmit={async (input) => {
          await addRecurring(uid, input)
          navigate('/gastos-fijos')
        }}
      />
    </section>
  )
}

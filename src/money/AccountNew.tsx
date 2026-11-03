import { useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import AccountForm from './AccountForm'
import { addAccount } from './api'
import { useAccounts } from './useAccounts'

export default function AccountNew() {
  const uid = useAuth()!.uid
  const navigate = useNavigate()
  const { accounts } = useAccounts(uid)

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-card md:mx-auto md:max-w-[35rem] md:p-7">
      <h2 className="mb-5 font-display text-lg font-semibold">Nueva cuenta</h2>
      <AccountForm
        withBalance
        onSubmit={async (input) => {
          await addAccount(uid, input, !accounts?.length)
          navigate('/cuentas')
        }}
      />
    </section>
  )
}

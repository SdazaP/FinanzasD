import { signOut } from 'firebase/auth'
import type { ReactNode } from 'react'
import { auth } from '../firebase'
import { useAuth } from './context'
import LoginPage from './LoginPage'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuth()

  if (user === undefined) return null
  if (!user) return <LoginPage />
  if (user.uid !== import.meta.env.VITE_OWNER_UID) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center text-zinc-900">
        <h1 className="text-2xl font-semibold">Acceso no autorizado</h1>
        <p className="text-zinc-600">Esta cuenta no tiene acceso. Tu uid:</p>
        <code className="max-w-full rounded bg-zinc-200 px-2 py-1 break-all select-all">{user.uid}</code>
        <button
          type="button"
          onClick={() => signOut(auth)}
          className="min-h-11 rounded-lg border border-zinc-300 px-6 font-medium active:bg-zinc-100"
        >
          Salir
        </button>
      </main>
    )
  }
  return children
}

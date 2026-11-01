import { FirebaseError } from 'firebase/app'
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { useState } from 'react'
import { auth } from '../firebase'

const provider = new GoogleAuthProvider()

export default function LoginPage() {
  const [error, setError] = useState('')

  async function signIn() {
    setError('')
    try {
      await signInWithPopup(auth, provider)
    } catch (e) {
      const code = e instanceof FirebaseError ? e.code : ''
      // Safari en iOS suele bloquear el popup
      if (code === 'auth/popup-blocked') return signInWithRedirect(auth, provider)
      if (code !== 'auth/popup-closed-by-user') setError('No se pudo iniciar sesión. Intenta de nuevo.')
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5">
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Finanzas</h1>
        <p className="mt-2 text-zinc-500">Tus gastos, créditos, ahorro e inversiones.</p>
      </div>
      <button
        type="button"
        onClick={signIn}
        className="min-h-12 rounded-2xl bg-primary px-7 font-medium text-white shadow-card transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        Entrar con Google
      </button>
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </main>
  )
}

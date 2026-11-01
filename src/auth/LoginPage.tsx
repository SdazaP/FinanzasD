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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-zinc-50 px-4 text-zinc-900">
      <h1 className="text-3xl font-semibold tracking-tight">Finanzas</h1>
      <button
        type="button"
        onClick={signIn}
        className="min-h-11 rounded-lg bg-zinc-900 px-6 font-medium text-white active:bg-zinc-700"
      >
        Entrar con Google
      </button>
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </main>
  )
}

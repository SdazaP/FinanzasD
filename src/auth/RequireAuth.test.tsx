import { render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { beforeEach, expect, test, vi } from 'vitest'
import { AuthContext } from './context'
import RequireAuth from './RequireAuth'

vi.mock('../firebase', () => ({ auth: {} }))

beforeEach(() => {
  vi.stubEnv('VITE_OWNER_UID', 'owner-uid')
})

function renderWith(user: User | null) {
  render(
    <AuthContext value={user}>
      <RequireAuth>
        <p>Contenido privado</p>
      </RequireAuth>
    </AuthContext>,
  )
}

test('sin sesión muestra el login', () => {
  renderWith(null)
  expect(screen.getByRole('button', { name: 'Entrar con Google' })).toBeInTheDocument()
  expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
})

test('con otra cuenta muestra acceso no autorizado y su uid', () => {
  renderWith({ uid: 'otro-uid' } as User)
  expect(screen.getByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument()
  expect(screen.getByText('otro-uid')).toBeInTheDocument()
  expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
})

test('con la cuenta del dueño muestra el contenido', () => {
  renderWith({ uid: 'owner-uid' } as User)
  expect(screen.getByText('Contenido privado')).toBeInTheDocument()
})

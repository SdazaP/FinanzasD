import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useState, type ReactNode } from 'react'
import { auth } from '../firebase'
import { AuthContext } from './context'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  return <AuthContext value={user}>{children}</AuthContext>
}

import type { User } from 'firebase/auth'
import { createContext, use } from 'react'

// undefined = todavía no sabemos si hay sesión
export const AuthContext = createContext<User | null | undefined>(undefined)

export const useAuth = () => use(AuthContext)

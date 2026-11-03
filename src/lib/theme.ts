import { useSyncExternalStore } from 'react'

export type Theme = 'system' | 'light' | 'dark'

// Misma clave y colores que el script en línea de index.html, que aplica el tema antes de pintar
const KEY = 'theme'
const barColor = { light: '#f6f6fa', dark: '#111216' }
const systemQuery = '(prefers-color-scheme: dark)'

const listeners = new Set<() => void>()

export function getTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system' // modo privado o almacenamiento bloqueado
  }
}

// data-theme siempre lleva el tema efectivo ('light' o 'dark'); el CSS solo mira ese atributo
export function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? (window.matchMedia?.(systemQuery).matches ? 'dark' : 'light') : theme
  document.documentElement.dataset.theme = resolved
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', barColor[resolved])
}

export function setTheme(theme: Theme) {
  try {
    if (theme === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    // sin almacenamiento el tema aplica solo mientras la app está abierta
  }
  applyTheme(theme)
  listeners.forEach((l) => l())
}

// En "Sistema", sigue al dispositivo si cambia de modo con la app abierta
export function followSystemTheme() {
  window.matchMedia?.(systemQuery).addEventListener('change', () => {
    if (getTheme() === 'system') applyTheme('system')
  })
}

export function useTheme() {
  return useSyncExternalStore((onChange) => {
    listeners.add(onChange)
    return () => listeners.delete(onChange)
  }, getTheme)
}

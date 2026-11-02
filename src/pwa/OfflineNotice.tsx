import { useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

// Avisa que la app está sin conexión: se ve lo último guardado y lo registrado se sube al volver la señal
export default function OfflineNotice() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine)
  if (online) return null
  return (
    <p role="status" className="mt-3 flex items-center gap-2 rounded-2xl bg-accent-yellow/35 px-3 py-2 text-sm text-amber-900">
      <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 8.8a15 15 0 0 1 4.2-2.6M10 5.1a15 15 0 0 1 12 3.7M5 12.9a10 10 0 0 1 5-2.6M19 12.9a10 10 0 0 0-2.2-1.5M8.5 16.4a5 5 0 0 1 7 0M12 20h.01M3 3l18 18" />
      </svg>
      <span>
        <span className="font-semibold">Sin conexión.</span> Ves lo último guardado; lo que registres se subirá al volver la señal.
      </span>
    </p>
  )
}

import { applyUpdate, useWaitingUpdate } from './pwa'

// Aviso fijo sobre la barra inferior cuando ya se descargó una versión nueva de la app
export default function UpdateBanner() {
  const available = useWaitingUpdate()
  if (!available) return null
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-30 md:bottom-6 md:left-24 lg:left-64 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink py-2 pr-2 pl-4 text-sm text-canvas shadow-card"
    >
      <p className="min-w-0 flex-1">Hay una versión nueva</p>
      <button type="button" onClick={applyUpdate} className="min-h-11 shrink-0 rounded-xl bg-primary px-4 font-medium text-white active:scale-[0.97]">
        Actualizar
      </button>
    </div>
  )
}

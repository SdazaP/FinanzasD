import { useSyncExternalStore } from 'react'

// Estado de la app instalable: una versión nueva esperando y el aviso de instalación de Chrome.
// Vive fuera de React porque beforeinstallprompt llega una sola vez, a veces antes del primer render.
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let waiting: ServiceWorker | null = null
let installEvent: InstallPromptEvent | null = null
let updating = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l))

function setWaiting(worker: ServiceWorker | null) {
  waiting = worker
  notify()
}

// Solo en producción: en desarrollo el service worker guardaría archivos que Vite cambia a cada rato
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', async () => {
    const reg = await navigator.serviceWorker.register('/sw.js')
    // Hay versión nueva solo si ya había una controlando la página (no en la primera instalación)
    if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting)
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) setWaiting(worker)
      })
    })
    // La app instalada puede quedar abierta días: busca versión nueva al volver a ella
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && reg.update())
  })
  // Recarga solo cuando tú pediste actualizar, para no perder un formulario a medias
  navigator.serviceWorker.addEventListener('controllerchange', () => updating && window.location.reload())
}

export function applyUpdate() {
  if (!waiting) return
  updating = true
  waiting.postMessage('SKIP_WAITING')
}

export const useWaitingUpdate = () => useSyncExternalStore(subscribe, () => waiting !== null)

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault() // se muestra con el botón "Instalar app"
  installEvent = e as InstallPromptEvent
  notify()
})
window.addEventListener('appinstalled', () => {
  installEvent = null
  notify()
})

const installed = () => window.matchMedia?.('(display-mode: standalone)').matches ?? false

export const useCanInstall = () => useSyncExternalStore(subscribe, () => installEvent !== null && !installed())

export async function promptInstall() {
  const event = installEvent
  if (!event) return
  installEvent = null // el aviso de Chrome solo se puede mostrar una vez
  notify()
  await event.prompt()
}


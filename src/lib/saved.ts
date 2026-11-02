import { useSyncExternalStore } from 'react'

// Firestore aplica cada escritura en el dispositivo al instante, pero su promesa termina cuando el SERVIDOR confirma.
// Sin conexión eso no pasa hasta que vuelve la señal y los botones se quedarían en "Guardando…".
// saved() da la escritura por hecha sin conexión, o si el servidor tarda más de WAIT_MS, y la deja subiendo.
export const WAIT_MS = 3000

let uploadFailed = false
const listeners = new Set<() => void>()
const setUploadFailed = (value: boolean) => {
  uploadFailed = value
  listeners.forEach((l) => l())
}

// Un cambio que ya dimos por guardado y luego el servidor rechazó: no se pierde en silencio
function reportLater(error: unknown) {
  console.error('No se pudo subir un cambio hecho sin conexión', error)
  setUploadFailed(true)
}

export function saved(write: Promise<unknown>): Promise<void> {
  if (!navigator.onLine) {
    write.catch(reportLater)
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      write.catch(reportLater)
      resolve()
    }, WAIT_MS)
    write.then(
      () => (clearTimeout(timer), resolve()),
      (error) => (clearTimeout(timer), reject(error)), // después de resolver no hace nada: lo avisa reportLater
    )
  })
}

export const useUploadFailed = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => uploadFailed,
  )

export const dismissUploadFailed = () => setUploadFailed(false)

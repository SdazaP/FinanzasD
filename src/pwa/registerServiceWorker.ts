// Solo en producción: en desarrollo el service worker guardaría archivos que Vite cambia a cada rato
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}

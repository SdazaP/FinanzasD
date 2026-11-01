import { useEffect, useState } from 'react'
import { today } from './dates'

// Fecha de hoy ('YYYY-MM-DD') que se actualiza a medianoche y al volver a la app,
// porque el navegador congela los timers con la pantalla bloqueada.
export function useToday() {
  const [value, setValue] = useState(today)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      clearTimeout(timer)
      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = setTimeout(refresh, nextMidnight.getTime() - now.getTime() + 1000)
    }
    const refresh = () => {
      setValue(today())
      schedule()
    }
    const onVisible = () => document.visibilityState === 'visible' && refresh()

    schedule()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return value
}

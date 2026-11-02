import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { hideAlert, showAlert } from './api'
import type { Alert } from './calc'
import { dismissUploadFailed, useUploadFailed } from '../lib/saved'
import { useAlerts } from './useAlerts'

const svg = 'size-5 shrink-0'
const levelStyle = {
  red: { word: 'Urgente', icon: 'text-red-600', badge: 'bg-red-600 text-white' },
  yellow: { word: 'Atención', icon: 'text-amber-600', badge: 'bg-accent-yellow text-ink' },
}

export function LevelIcon({ level }: { level: Alert['level'] }) {
  return (
    <svg viewBox="0 0 24 24" className={`${svg} ${levelStyle[level].icon}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {level === 'red' ? <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></> : <><path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /><path d="M12 9.5v4M12 17h.01" /></>}
    </svg>
  )
}

export default function AlertBell({ uid, now }: { uid: string; now: string }) {
  const { visible, hidden } = useAlerts(uid, now)
  const [open, setOpen] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [error, setError] = useState('')
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const month = now.slice(0, 7)
  // Un cambio hecho sin conexión que el servidor rechazó también cuenta como aviso urgente
  const uploadFailed = useUploadFailed()
  const count = visible.length + (uploadFailed ? 1 : 0)
  const level = uploadFailed || visible.some((a) => a.level === 'red') ? 'red' : 'yellow'

  function close() {
    setOpen(false)
    button.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  async function run(action: Promise<unknown>) {
    setError('')
    try {
      await action
    } catch {
      setError('No se pudo guardar. Revisa tu conexión.')
    }
  }

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={`Avisos, ${count} activos`}
        aria-expanded={open}
        aria-controls={panelId}
        className="relative flex size-10 items-center justify-center rounded-full bg-surface text-ink shadow-card transition-transform duration-150 ease-out active:scale-95"
      >
        <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />
        </svg>
        {count > 0 && (
          <span className={`absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums ring-2 ring-canvas ${levelStyle[level].badge}`}>
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panel}
          id={panelId}
          role="dialog"
          aria-label="Avisos"
          tabIndex={-1}
          className="absolute top-full right-0 z-30 mt-2 max-h-[calc(100dvh-13rem)] w-[min(22rem,calc(100vw-2.5rem))] origin-top-right overflow-y-auto overscroll-contain rounded-3xl bg-surface p-4 shadow-card outline-none"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Avisos</h2>
            <button type="button" onClick={close} className="min-h-11 rounded-xl px-3 text-sm font-medium text-zinc-500 active:bg-zinc-100">
              Cerrar
            </button>
          </div>

          {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}

          {uploadFailed && (
            <div className="flex gap-3 border-b border-zinc-100 py-3">
              <LevelIcon level="red" />
              <div className="min-w-0 flex-1 text-sm">
                <p>
                  <span className="block font-semibold text-red-600">
                    Urgente<span className="sr-only">:</span>
                  </span>{' '}
                  No se pudo subir un cambio que hiciste sin conexión. Revisa tus registros.
                </p>
                <button type="button" onClick={dismissUploadFailed} className="mt-1 -ml-2 min-h-11 rounded-xl px-2 font-medium text-primary active:bg-primary/10">
                  Entendido
                </button>
              </div>
            </div>
          )}

          {count === 0 ? (
            <p className="py-2 text-zinc-500">No tienes avisos.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {visible.map((a) => (
                <li key={a.key} className="py-3">
                  <Link to={a.href} onClick={() => setOpen(false)} className="flex gap-3 rounded-xl active:bg-zinc-50">
                    <LevelIcon level={a.level} />
                    <span className="min-w-0 flex-1 text-sm [overflow-wrap:anywhere]">
                      <span className={`block font-semibold ${levelStyle[a.level].icon}`}>
                        {levelStyle[a.level].word}
                        <span className="sr-only">:</span>
                      </span>{' '}
                      {a.text}
                    </span>
                  </Link>
                  <button type="button" onClick={() => run(hideAlert(uid, a.key, month))} className="mt-1 ml-8 min-h-11 rounded-xl px-2 text-sm font-medium text-primary active:bg-primary/10">
                    Ocultar este mes
                  </button>
                </li>
              ))}
            </ul>
          )}

          {hidden.length > 0 && (
            <div className="mt-2 border-t border-zinc-100 pt-2">
              <button type="button" onClick={() => setShowHidden((s) => !s)} aria-expanded={showHidden} className="min-h-11 rounded-xl px-2 text-sm font-medium text-zinc-500 active:bg-zinc-100">
                {showHidden ? 'Esconder ocultos' : `Mostrar ocultos (${hidden.length})`}
              </button>
              {showHidden && (
                <ul className="space-y-2">
                  {hidden.map((a) => (
                    <li key={a.key} className="flex items-center gap-3 text-sm text-zinc-500">
                      <LevelIcon level={a.level} />
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{a.text}</span>
                      <button type="button" onClick={() => run(showAlert(uid, a.key))} className="min-h-11 shrink-0 rounded-xl px-2 font-medium text-primary active:bg-primary/10">
                        Mostrar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

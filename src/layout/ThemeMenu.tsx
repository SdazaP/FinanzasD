import { useEffect, useId, useRef, useState } from 'react'
import { setTheme, useTheme, type Theme } from '../lib/theme'

const icons: Record<Theme, React.ReactNode> = {
  system: <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.5zM8.5 21h7M12 17v4" />,
  light: <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />,
  dark: <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11" />,
}

const options: [Theme, string][] = [
  ['system', 'Sistema'],
  ['light', 'Claro'],
  ['dark', 'Oscuro'],
]

const Icon = ({ theme, className = 'size-5' }: { theme: Theme; className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {icons[theme]}
  </svg>
)

// up: el menú abre hacia arriba (barra lateral, abajo de la pantalla); si no, hacia abajo (encabezado).
// photoURL: en el celular el botón es tu foto con el ícono del tema encima, para no sumar un ícono al encabezado
export default function ThemeMenu({ up = false, photoURL }: { up?: boolean; photoURL?: string | null }) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const label = options.find(([t]) => t === theme)![1]

  function close() {
    setOpen(false)
    button.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    panel.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus()
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

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={`Tema: ${label}`}
        title={`Tema: ${label}`}
        aria-expanded={open}
        aria-controls={panelId}
        className="relative flex size-9 items-center justify-center rounded-full bg-surface text-ink shadow-card transition-transform duration-150 ease-out active:scale-95"
      >
        {photoURL ? (
          <>
            <img src={photoURL} alt="" referrerPolicy="no-referrer" className="size-9 rounded-full ring-2 ring-surface" />
            <span className="absolute -right-1 -bottom-1 flex size-[18px] items-center justify-center rounded-full bg-surface text-ink ring-2 ring-canvas">
              <Icon theme={theme} className="size-3" />
            </span>
          </>
        ) : (
          <Icon theme={theme} />
        )}
      </button>

      {open && (
        <div
          ref={panel}
          id={panelId}
          role="group"
          aria-label="Tema"
          className={`absolute z-30 w-44 rounded-2xl bg-surface p-1.5 shadow-card ${up ? 'bottom-full left-0 mb-2 lg:right-0 lg:left-auto' : 'top-full right-0 mt-2'}`}
        >
          {options.map(([t, name]) => (
            <button
              key={t}
              type="button"
              aria-pressed={t === theme}
              onClick={() => {
                setTheme(t)
                close()
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-600 active:bg-zinc-100 md:hover:bg-zinc-100 aria-pressed:bg-primary/10 aria-pressed:text-primary"
            >
              <Icon theme={t} />
              <span className="flex-1 text-left">{name}</span>
              {t === theme && (
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12 5 5 9-10" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

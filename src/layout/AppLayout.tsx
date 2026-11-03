import { Link, Outlet, useLocation } from 'react-router'
import AlertBell, { AlertsRail } from '../alerts/AlertBell'
import { useAuth } from '../auth/context'
import OfflineNotice from '../pwa/OfflineNotice'
import UpdateBanner from '../pwa/UpdateBanner'
import { formatLongDate, formatMonthLabel } from '../lib/dates'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useToday } from '../lib/useToday'
import ThemeMenu from './ThemeMenu'
import { sections } from '../sections'

export default function AppLayout() {
  const user = useAuth()
  const { pathname } = useLocation()
  const owns = (s: (typeof sections)[number]) =>
    s.path === '/' ? pathname === '/' : [s.path, ...Object.keys(s.also ?? {})].some((p) => pathname.startsWith(p))
  const section = sections.find(owns) ?? sections[0]
  const title = Object.entries(section.also ?? {}).find(([p]) => pathname.startsWith(p))?.[1] ?? section.title
  const firstName = user?.displayName?.split(' ')[0]
  const now = useToday()
  // Desde 1280 px los avisos viven en la columna derecha y la campana sobra
  const wide = useMediaQuery('(min-width: 1280px)')
  // Un solo botón de tema: en el encabezado del celular o en la barra lateral desde 768 px
  const rail = useMediaQuery('(min-width: 768px)')

  return (
    // Celular: columna de 576 px con barra inferior. Desde 768 px la barra se vuelve lateral y el contenido se ensancha
    <div className="min-h-dvh md:pl-20 lg:pl-60">
      <div className="mx-auto max-w-xl md:max-w-3xl md:px-3 lg:max-w-[1100px] lg:px-6 xl:grid xl:max-w-[1480px] xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-x-6">
      <header className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-5 md:pt-10 md:pb-7 xl:col-start-1">
        {/* Fecha y mes arriba; así el título solo comparte línea con la campana. El saludo solo cabe en pantallas anchas */}
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[13px] text-zinc-500 first-letter:uppercase sm:text-sm">
            <span className="hidden sm:inline">{firstName ? `Hola, ${firstName}` : 'Hola'} · </span>
            <time dateTime={now}>{formatLongDate(now)}</time>
          </p>
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium whitespace-nowrap text-primary">{formatMonthLabel(now)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate font-display text-[22px] leading-tight font-semibold tracking-tight sm:text-[1.75rem] lg:text-[2rem]">{title}</h1>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Historial solo en la sección Gastos */}
            {section.path === '/gastos-fijos' && (
              <Link
                to="/gastos-historial"
                aria-label="Historial de gastos"
                aria-current={pathname.startsWith('/gastos-historial') ? 'page' : undefined}
                className="flex size-9 items-center justify-center rounded-full bg-surface text-ink shadow-card transition-transform duration-150 ease-out active:scale-95 aria-[current=page]:bg-primary aria-[current=page]:text-white"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
                  <path d="M8 2.5v4M16 2.5v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
                </svg>
              </Link>
            )}
            {user && !wide && <AlertBell uid={user.uid} now={now} />}
            {!rail && <ThemeMenu photoURL={user?.photoURL} />}
          </div>
        </div>
        <OfflineNotice />
      </header>

      <main className="px-5 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-12 xl:col-start-1 xl:row-start-2">
        <Outlet />
      </main>

      {user && wide && (
        <aside aria-label="Avisos" className="sticky top-6 col-start-2 row-start-2 self-start">
          <AlertsRail uid={user.uid} now={now} />
        </aside>
      )}
      </div>

      <UpdateBanner />

      {/* Un solo menú: barra inferior en el celular, columna de íconos en tablet y barra lateral con nombres desde 1024 px */}
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200/70 bg-surface/90 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:inset-y-0 md:right-auto md:flex md:w-20 md:flex-col md:border-t-0 md:bg-canvas md:pb-0 md:backdrop-blur-none lg:w-60"
      >
        <Link to="/" aria-label="FinanzasD, inicio" className="hidden items-center gap-3 px-5 pt-9 pb-8 md:flex md:justify-center lg:justify-start lg:px-7">
          <img src="/icon.svg" alt="" className="size-10 shrink-0" />
          <span className="hidden font-display text-xl font-semibold tracking-tight lg:inline">FinanzasD</span>
        </Link>
        <ul className="mx-auto flex max-w-xl md:mx-0 md:max-w-none md:flex-1 md:flex-col md:gap-1 md:px-3 lg:px-4">
          {sections.map((s) => (
            <li key={s.path} className="flex-1 md:flex-none">
              <Link
                to={s.path}
                title={s.label}
                aria-current={owns(s) ? 'page' : undefined}
                className={`group flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150 md:min-h-12 md:rounded-2xl lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-[15px] lg:aria-[current=page]:bg-primary lg:aria-[current=page]:text-white ${
                  owns(s) ? 'text-primary' : 'text-zinc-500 active:text-ink md:hover:text-ink lg:hover:bg-surface'
                }`}
              >
                <span className="rounded-full px-4 py-1 transition-[background-color,color,transform] duration-150 ease-out group-active:scale-95 group-aria-[current=page]:bg-primary group-aria-[current=page]:text-white lg:px-0 lg:py-0 lg:group-aria-[current=page]:bg-transparent">
                  {s.icon}
                </span>
                <span className="md:sr-only lg:not-sr-only">{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        {user && (
          <div className="hidden flex-col-reverse items-center gap-3 px-5 py-7 md:flex lg:flex-row lg:px-7">
            {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-full ring-2 ring-surface" />}
            <span className="hidden min-w-0 flex-1 truncate text-sm font-medium lg:block">{user.displayName}</span>
            {rail && <ThemeMenu up />}
          </div>
        )}
      </nav>
    </div>
  )
}

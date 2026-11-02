import { Link, Outlet, useLocation } from 'react-router'
import AlertBell from '../alerts/AlertBell'
import { useAuth } from '../auth/context'
import { formatLongDate, formatMonthLabel } from '../lib/dates'
import { useToday } from '../lib/useToday'
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

  return (
    <div className="mx-auto min-h-dvh max-w-xl">
      <header className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-5">
        {/* Fecha y mes arriba; así el título solo comparte línea con la campana. El saludo solo cabe en pantallas anchas */}
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[13px] text-zinc-500 first-letter:uppercase sm:text-sm">
            <span className="hidden sm:inline">{firstName ? `Hola, ${firstName}` : 'Hola'} · </span>
            <time dateTime={now}>{formatLongDate(now)}</time>
          </p>
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium whitespace-nowrap text-primary">{formatMonthLabel(now)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate font-display text-2xl leading-tight font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
          <div className="flex shrink-0 items-center gap-2">
            {user && <AlertBell uid={user.uid} now={now} />}
            {user?.photoURL && (
              <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="hidden size-10 rounded-full ring-2 ring-white sm:block" />
            )}
          </div>
        </div>
      </header>

      <main className="px-5 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
        <Outlet />
      </main>

      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 border-t border-zinc-200/70 bg-white/90 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md"
      >
        <ul className="mx-auto flex max-w-xl">
          {sections.map((s) => (
            <li key={s.path} className="flex-1">
              <Link
                to={s.path}
                aria-current={owns(s) ? 'page' : undefined}
                className={`group flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150 ${
                  owns(s) ? 'text-primary' : 'text-zinc-500 active:text-ink'
                }`}
              >
                <span className="rounded-full px-4 py-1 transition-[background-color,color,transform] duration-150 ease-out group-active:scale-95 group-aria-[current=page]:bg-primary group-aria-[current=page]:text-white">
                  {s.icon}
                </span>
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

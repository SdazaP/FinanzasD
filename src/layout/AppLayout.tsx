import { NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/context'
import { sections } from '../sections'

export default function AppLayout() {
  const user = useAuth()
  const { pathname } = useLocation()
  const section = sections.find((s) => s.path === pathname) ?? sections[0]
  const firstName = user?.displayName?.split(' ')[0]

  return (
    <div className="mx-auto min-h-dvh max-w-xl">
      <header className="flex items-end justify-between gap-4 px-5 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-5">
        <div className="min-w-0">
          <p className="text-sm text-zinc-500">{firstName ? `Hola, ${firstName}` : 'Hola'}</p>
          <h1 className="truncate font-display text-[1.75rem] leading-tight font-semibold tracking-tight">{section.title}</h1>
        </div>
        {user?.photoURL && (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-full ring-2 ring-white" />
        )}
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
              <NavLink
                to={s.path}
                end
                className={({ isActive }) =>
                  `group flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150 ${
                    isActive ? 'text-primary' : 'text-zinc-500 active:text-ink'
                  }`
                }
              >
                <span className="rounded-full px-4 py-1 transition-[background-color,color,transform] duration-150 ease-out group-active:scale-95 group-aria-[current=page]:bg-primary group-aria-[current=page]:text-white">
                  {s.icon}
                </span>
                {s.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

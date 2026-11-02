import { NavLink } from 'react-router'

// Selector Fijos | Hormiga dentro de la sección Gastos (el historial va como ícono en el encabezado)
export default function GastosTabs() {
  return (
    <nav aria-label="Tipo de gasto" className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-200/60 p-1">
      {[['/gastos-fijos', 'Fijos'], ['/gastos-hormiga', 'Hormiga']].map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex min-h-11 items-center justify-center rounded-xl text-sm font-medium transition-colors duration-150 ${
              isActive ? 'bg-surface text-ink shadow-sm' : 'text-zinc-600 active:bg-surface/60'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

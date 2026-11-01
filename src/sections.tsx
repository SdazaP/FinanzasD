import type { ReactNode } from 'react'

const icon = (paths: ReactNode) => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
)

type Section = { path: string; label: string; title: string; empty: string; icon: ReactNode; also?: Record<string, string> }

export const sections: Section[] = [
  {
    path: '/',
    label: 'Inicio',
    title: 'Resumen',
    empty: 'Aquí verás tu mes de un vistazo: lo que vence pronto, lo que debes y lo que ahorras.',
    icon: icon(<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />),
  },
  {
    path: '/gastos-fijos',
    label: 'Gastos',
    title: 'Gastos fijos',
    // Otras rutas que pertenecen a esta pestaña, con su título
    also: { '/gastos-hormiga': 'Gastos hormiga' },
    empty: 'Pronto podrás registrar tus gastos fijos y suscripciones.',
    icon: icon(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></>),
  },
  {
    path: '/creditos',
    label: 'Créditos',
    title: 'Créditos',
    empty: 'Pronto podrás registrar tus créditos y sus fechas de pago.',
    icon: icon(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>),
  },
  {
    path: '/ahorro',
    label: 'Ahorro',
    title: 'Ahorro',
    empty: 'Pronto podrás crear metas de ahorro y registrar tus aportes.',
    icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v10M14.8 9.5c-.5-.9-1.5-1.3-2.8-1.3-1.6 0-2.8.8-2.8 1.9s1.2 1.6 2.8 1.9 2.8.8 2.8 1.9-1.2 1.9-2.8 1.9c-1.3 0-2.3-.4-2.8-1.3" /></>),
  },
  {
    path: '/cuentas',
    label: 'Cuentas',
    title: 'Cuentas',
    empty: '',
    // Inversiones está pospuesta: salió de la barra pero sigue accesible por su URL
    also: { '/inversiones': 'Inversiones' },
    icon: icon(<><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M16 15h2M7 6V4h10v2" /></>),
  },
]

export const investmentsSection: Section = {
  path: '/inversiones',
  label: 'Inversiones',
  title: 'Inversiones',
  empty: 'Estamos trabajando en esto.',
  icon: icon(<path d="m3 17 6-6 4 4 8-8M15 7h6v6" />),
}

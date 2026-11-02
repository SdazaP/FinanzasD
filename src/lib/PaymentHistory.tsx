import { formatDay } from './dates'
import { formatMXN } from './money'

export type Payment = { id: string; dueDate: string; amount: number; label?: string; accountId?: string }

type Props = {
  payments: Payment[]
  onDelete: (p: Payment) => void
  title?: string
  emptyText?: string
}

export default function PaymentHistory({
  payments, onDelete, title = 'Historial de pagos', emptyText = 'Todavía no hay pagos registrados.',
}: Props) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-card">
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      {payments.length === 0 ? (
        <p className="text-zinc-500">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-zinc-600">{formatDay(p.dueDate, true)}</p>
                {p.label && <p className="text-xs text-zinc-500">{p.label}</p>}
              </div>
              <p className="shrink-0 font-medium tabular-nums">{formatMXN(p.amount)}</p>
              <button
                type="button"
                aria-label={`Borrar ${p.label ? p.label.toLowerCase() : 'pago'} del ${formatDay(p.dueDate, true)}`}
                onClick={() => {
                  if (confirm(`¿Borrar ${p.label ? `el ${p.label.toLowerCase()}` : 'el pago'} del ${formatDay(p.dueDate, true)}?`)) onDelete(p)
                }}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-zinc-400 transition-colors duration-150 active:bg-red-50 active:text-red-700"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

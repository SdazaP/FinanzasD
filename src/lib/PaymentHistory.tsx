import { formatDay } from './dates'
import { formatMXN } from './money'

export type Payment = { id: string; dueDate: string; amount: number }

export default function PaymentHistory({ payments, onDelete }: { payments: Payment[]; onDelete: (p: Payment) => void }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-card">
      <h2 className="mb-3 font-display text-lg font-semibold">Historial de pagos</h2>
      {payments.length === 0 ? (
        <p className="text-zinc-500">Todavía no hay pagos registrados.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <p className="min-w-0 flex-1 text-zinc-600">{formatDay(p.dueDate, true)}</p>
              <p className="shrink-0 font-medium tabular-nums">{formatMXN(p.amount)}</p>
              <button
                type="button"
                aria-label={`Borrar pago del ${formatDay(p.dueDate, true)}`}
                onClick={() => {
                  if (confirm(`¿Borrar el pago del ${formatDay(p.dueDate, true)}?`)) onDelete(p)
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

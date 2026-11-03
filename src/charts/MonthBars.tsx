import { useState } from 'react'
import { compactMXN } from '../history/calc'
import { formatMonthName } from '../lib/dates'
import { formatMXN } from '../lib/money'
import { compareText } from './calc'

type MonthTotal = { month: string; total: number | null }

const short = (month: string) => formatMonthName(month).slice(0, 3)

// Paso "redondo" (1, 2 o 5 × 10^n centavos) para que 3 líneas guía cubran el máximo
function niceStep(max: number) {
  const raw = max / 3
  const pow = 10 ** Math.floor(Math.log10(raw))
  return [1, 2, 5, 10].map((f) => f * pow).find((s) => s >= raw)!
}

export default function MonthBars({ months }: { months: MonthTotal[] }) {
  const last = months.length - 1
  const [active, setActive] = useState(last)
  const max = Math.max(0, ...months.map((m) => m.total ?? 0))
  const step = max ? niceStep(max) : 0
  const top = step * 3 || 1
  const compare = compareText(months[last].total ?? 0, months[last - 1]?.total ?? null)

  return (
    <div>
      {compare && <p className="mb-4 text-sm text-zinc-600">{compare}</p>}

      <div className="flex gap-2">
        {/* Un solo eje: montos compactos y líneas guía tenues */}
        <div className="relative h-40 w-10 shrink-0 text-right text-[11px] text-zinc-500 tabular-nums" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(i / 3) * 100}%` }}>
              {i ? compactMXN(step * i) : "$0"}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 h-40" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`absolute inset-x-0 border-t ${i ? 'border-dashed border-zinc-200/70' : 'border-zinc-200'}`} style={{ bottom: `${(i / 3) * 100}%` }} />
            ))}
          </div>

          <ul className="relative grid grid-cols-6" onMouseLeave={() => setActive(last)}>
            {months.map((m, i) => (
              <li key={m.month} className="flex flex-col items-center">
                {m.total === null ? (
                  <>
                    <div className="h-40" />
                    <span className="mt-2 text-xs text-zinc-400">{short(m.month)}</span>
                    <span className="sr-only">{formatMonthName(m.month)}: sin datos</span>
                  </>
                ) : (
                  <button
                    type="button"
                    aria-label={`${formatMonthName(m.month)}: ${formatMXN(m.total)}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className="group flex w-full flex-col items-center outline-none"
                  >
                    <span className="relative flex h-40 w-full items-end justify-center">
                      {active === i && (
                        <span
                          className="absolute left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-canvas tabular-nums"
                          style={{ bottom: `${(m.total / top) * 100}%` }}
                        >
                          {compactMXN(m.total)}
                        </span>
                      )}
                      <span
                        className={`w-[min(1.5rem,60%)] rounded-t-md transition-[background-color,height] duration-200 ease-out group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-surface ${
                          i === last ? 'bg-primary' : active === i ? 'bg-primary/55' : 'bg-primary/30'
                        }`}
                        style={{ height: `${Math.max((m.total / top) * 100, m.total ? 2 : 0)}%` }}
                      />
                    </span>
                    <span className={`mt-2 text-xs ${i === last ? 'font-medium text-ink' : 'text-zinc-500'}`}>{short(m.month)}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <table className="sr-only">
        <caption>Total gastado por mes</caption>
        <thead>
          <tr><th scope="col">Mes</th><th scope="col">Gastado</th></tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}><th scope="row">{formatMonthName(m.month)}</th><td>{m.total === null ? 'Sin datos' : formatMXN(m.total)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

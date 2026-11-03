import { useState } from 'react'
import { compactMXN } from '../history/calc'
import { formatMXN } from '../lib/money'
import type { Slice } from './calc'

// Clases completas para que Tailwind las encuentre; el índice es el slot (0 = "Otros")
export const strokeOf = ['stroke-chart-0', 'stroke-chart-1', 'stroke-chart-2', 'stroke-chart-3', 'stroke-chart-4']
export const bgOf = ['bg-chart-0', 'bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4']

const R = 47
const C = 2 * Math.PI * R
const GAP = 2 // separación entre segmentos, en unidades del viewBox (≈2 px)

// En el centro cabe "$12,345.67" a 15 px; más largo se abrevia ("$123k")
const centerAmount = (cents: number) => (formatMXN(cents).length > 10 ? compactMXN(cents) : formatMXN(cents))

export default function CategoryDonut({ total, slices }: { total: number; slices: Slice[] }) {
  const [active, setActive] = useState<number>()
  const current = active === undefined ? undefined : slices[active]

  let offset = 0
  const arcs = slices.map((s) => {
    const length = (s.amount / total) * C
    const arc = { length: Math.max(length - (slices.length > 1 ? GAP : 0), 0.5), offset }
    offset += length
    return arc
  })

  return (
    <div className="grid justify-items-center gap-4">
      <div className="relative size-36" onMouseLeave={() => setActive(undefined)}>
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="12" className="stroke-zinc-100" />
          {slices.map((s, i) => (
            <circle
              key={s.name}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth={active === i ? 14 : 12}
              strokeDasharray={`${arcs[i].length} ${C}`}
              strokeDashoffset={-arcs[i].offset}
              className={`${strokeOf[s.slot]} transition-[opacity,stroke-width] duration-150 ease-out ${active !== undefined && active !== i ? 'opacity-30' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(active === i ? undefined : i)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
          <p className="max-w-full truncate font-display text-[15px] font-semibold tabular-nums">{centerAmount(current?.amount ?? total)}</p>
          <p className="max-w-full truncate text-xs text-zinc-500">{current ? current.name : 'Gastado'}</p>
        </div>
      </div>

      <ul className="grid w-full min-w-0 grid-cols-2 gap-x-2 gap-y-0.5">
        {slices.map((s, i) => (
          <li key={s.name}>
            <button
              type="button"
              aria-label={`${s.name}: ${formatMXN(s.amount)}, ${s.pct}%`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(undefined)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(undefined)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-opacity duration-150 ${active !== undefined && active !== i ? 'opacity-50' : ''}`}
            >
              <span className={`size-2.5 shrink-0 rounded-full ${bgOf[s.slot]}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{s.name}</span>
                <span className="block truncate text-xs text-zinc-500 tabular-nums">
                  {formatMXN(s.amount)} · <span className="font-medium text-ink">{s.pct}%</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>Gastos del mes por categoría</caption>
        <thead>
          <tr><th scope="col">Categoría</th><th scope="col">Monto</th><th scope="col">Porcentaje</th></tr>
        </thead>
        <tbody>
          {slices.map((s) => (
            <tr key={s.name}><th scope="row">{s.name}</th><td>{formatMXN(s.amount)}</td><td>{s.pct}%</td></tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th scope="row">Total</th><td>{formatMXN(total)}</td><td>100%</td></tr>
        </tfoot>
      </table>
    </div>
  )
}

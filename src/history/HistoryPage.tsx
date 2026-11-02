import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { addDays, formatLongDate, formatMonthLabel, formatMonthName, monthRange } from '../lib/dates'
import { formatMXN } from '../lib/money'
import { useToday } from '../lib/useToday'
import { compactMXN, dayTotals, monthGrid, monthSummary, type HistoryKind } from './calc'
import { useMonthHistory } from './useMonthHistory'

const card = 'rounded-3xl bg-surface p-5 shadow-card'
const weekdays = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const kindLabel: Record<HistoryKind, string> = {
  spending: 'Hormiga', fixed: 'Fijo', msi: 'MSI', card: 'Pago de tarjeta · no suma', planned: 'Planeado', upcoming: 'Planeado · aún no se gasta',
}

// Intensidad del día según lo gastado contra el día más alto del mes
const heat = (amount: number, max: number) => {
  if (!amount) return ''
  const r = amount / max
  return r > 0.66 ? 'bg-primary/45' : r > 0.33 ? 'bg-primary/25' : 'bg-primary/12'
}

export default function HistoryPage() {
  const uid = useAuth()!.uid
  const now = useToday()
  const current = monthRange(now)[0]
  const [month, setMonth] = useState(current)
  const [picked, setPicked] = useState<string>()
  const { ready, entries, lastPlanned } = useMonthHistory(uid, month)
  // Se avanza hasta el mes actual, o hasta el del último gasto planeado
  const lastMonth = lastPlanned && lastPlanned > current ? monthRange(lastPlanned)[0] : current

  const [, end] = monthRange(month)
  // Día abierto: el que tocaste en este mes; si no, hoy (mes actual) o el último día del mes
  const selected = picked && picked >= month && picked <= end ? picked : month === current ? now : end
  const totals = dayTotals(entries)
  const max = Math.max(0, ...Object.values(totals))
  const summary = monthSummary(entries)
  const dayEntries = entries.filter((e) => e.date === selected).sort((a, b) => b.amount - a.amount)
  const upcomingDays = new Set(entries.filter((e) => e.kind === 'upcoming').map((e) => e.date))
  const monthName = formatMonthName(month)

  const go = (delta: -1 | 1) => setMonth(monthRange(delta < 0 ? addDays(month, -1) : addDays(end, 1))[0])

  return (
    <div className="space-y-4">
      <section className={card}>
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => go(-1)} aria-label="Mes anterior" className="grid size-11 place-items-center rounded-xl text-primary active:bg-primary/10">
            ‹
          </button>
          <h2 className="font-display text-lg font-semibold">{formatMonthLabel(month)}</h2>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={month >= lastMonth}
            aria-label="Mes siguiente"
            className="grid size-11 place-items-center rounded-xl text-primary active:bg-primary/10 disabled:opacity-30"
          >
            ›
          </button>
        </div>

        {!ready ? (
          <p className="py-6 text-center text-zinc-500">Cargando…</p>
        ) : entries.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-zinc-500">No registraste gastos en {monthName}.</p>
            <Link to="/gastos-hormiga" className="mt-2 inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-primary active:bg-primary/10">
              Registrar un gasto
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-zinc-500">
              Gastaste <span className="font-display text-base font-semibold text-ink tabular-nums">{formatMXN(summary.total)}</span> en {monthName}
            </p>
            <p className="mt-1 text-center text-xs text-zinc-500 tabular-nums">
              Hormiga {formatMXN(summary.spending)} · Fijos {formatMXN(summary.fixed)} · Créditos {formatMXN(summary.credits)}
              {summary.planned > 0 && ` · Planeados ${formatMXN(summary.planned)}`}
            </p>
            {summary.upcoming > 0 && (
              <p className="mt-1 text-center text-xs font-medium text-primary tabular-nums">
                Planeado para {monthName}: {formatMXN(summary.upcoming)}
              </p>
            )}

            <div role="grid" aria-label={`Calendario de ${monthName}`} className="mt-4">
              <div role="row" className="grid grid-cols-7 text-center text-xs font-medium text-zinc-500">
                {weekdays.map((d, i) => (
                  <span key={i} role="columnheader" className="py-1">{d}</span>
                ))}
              </div>
              {monthGrid(month).map((week, w) => (
                <div key={w} role="row" className="grid grid-cols-7 gap-0.5">
                  {week.map((day, i) =>
                    day ? (
                      <button
                        key={day}
                        type="button"
                        role="gridcell"
                        onClick={() => setPicked(day)}
                        aria-selected={day === selected}
                        aria-label={`${formatLongDate(day)}, ${totals[day] ? formatMXN(totals[day]) : 'sin gastos'}`}
                        className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-sm ${heat(totals[day] ?? 0, max)} ${
                          day === selected ? 'ring-2 ring-primary' : ''
                        } ${day === now ? 'font-bold text-primary' : ''} ${upcomingDays.has(day) ? 'border border-dashed border-primary' : ''}`}
                      >
                        <span>{Number(day.slice(8))}</span>
                        {totals[day] ? <span className="text-[10px] leading-tight tabular-nums">{compactMXN(totals[day])}</span> : null}
                      </button>
                    ) : (
                      <span key={`e${i}`} role="gridcell" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {ready && entries.length > 0 && (
        <section className={card}>
          <h2 className="mb-2 font-display text-lg font-semibold first-letter:uppercase">
            {formatLongDate(selected)} · <span className="tabular-nums">{formatMXN(totals[selected] ?? 0)}</span>
          </h2>
          {dayEntries.length === 0 ? (
            <p className="text-zinc-500">Sin gastos este día.</p>
          ) : (
            <ul className="-mx-2">
              {dayEntries.map((e) => (
                <li key={e.id}>
                  <Link to={e.href} className="flex min-h-12 items-center gap-3 rounded-2xl px-2 active:bg-zinc-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{e.label}</p>
                      <p className="text-sm text-zinc-500">{kindLabel[e.kind]}</p>
                    </div>
                    <p className={`shrink-0 font-medium tabular-nums ${e.kind === 'card' || e.kind === 'upcoming' ? 'text-zinc-500' : ''}`}>{formatMXN(e.amount)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

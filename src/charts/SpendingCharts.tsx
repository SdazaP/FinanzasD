import { useHistoryRange } from '../history/useMonthHistory'
import { monthRange } from '../lib/dates'
import { byCategory, lastMonths, monthTotals } from './calc'
import CategoryDonut from './CategoryDonut'
import MonthBars from './MonthBars'

const card = 'rounded-3xl bg-surface p-5 shadow-card md:col-span-1 lg:col-span-3'

// Esqueleto del tamaño final mientras cargan los 6 meses, para que Inicio no salte
function Loading({ title }: { title: string }) {
  return (
    <section className={card} aria-busy="true">
      <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>
      <div className="flex h-36 items-center gap-5 motion-safe:animate-pulse">
        <div className="size-36 shrink-0 rounded-full border-[14px] border-zinc-100" />
        <div className="flex-1 space-y-3">
          <div className="h-3 w-3/4 rounded-full bg-zinc-100" />
          <div className="h-3 w-1/2 rounded-full bg-zinc-100" />
          <div className="h-3 w-2/3 rounded-full bg-zinc-100" />
        </div>
      </div>
      <p className="sr-only">Cargando…</p>
    </section>
  )
}

// Las gráficas de Inicio: todos los gastos (como el Historial) de los últimos 6 meses
export default function SpendingCharts({ uid, now }: { uid: string; now: string }) {
  const [monthStart, monthEnd] = monthRange(now)
  const { ready, entries } = useHistoryRange(uid, lastMonths(now)[0], monthEnd)

  if (!ready) {
    return (
      <>
        <Loading title="En qué se fue" />
        <Loading title="Últimos 6 meses" />
      </>
    )
  }

  const { total, slices } = byCategory(entries.filter((e) => e.date >= monthStart))

  return (
    <>
    <section className={card}>
      <h2 className="mb-4 font-display text-lg font-semibold">En qué se fue</h2>
      {total ? (
        <CategoryDonut total={total} slices={slices} />
      ) : (
        <div className="flex items-center gap-5">
          <div className="size-36 shrink-0 rounded-full border-[14px] border-zinc-100" aria-hidden="true" />
          <p className="text-zinc-500">Aún no registras gastos este mes.</p>
        </div>
      )}
    </section>

    <section className={card}>
      <h2 className="mb-4 font-display text-lg font-semibold">Últimos 6 meses</h2>
      <MonthBars months={monthTotals(entries, now)} />
    </section>
    </>
  )
}

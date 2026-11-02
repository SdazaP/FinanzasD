import { Link } from 'react-router'
import { cardUsage } from '../credits/calc'
import type { Card } from '../credits/useCards'
import { formatDay } from '../lib/dates'
import { formatMXN } from '../lib/money'
import ProgressBar from '../lib/ProgressBar'

const addLink = 'flex min-h-11 items-center rounded-xl px-2 text-sm font-medium text-primary active:bg-primary/10'

// Tarjetas de crédito en Cuentas: deuda, uso (con sus MSI) y crédito disponible. No suman al disponible.
export default function CardsSection({ cards, credits }: { cards: Card[]; credits: { kind: string; cardId?: string; balance: number }[] }) {
  if (!cards.length) {
    return (
      <Link to="/cuentas/tarjeta-nueva" className={`${addLink} justify-center`}>
        + Agregar tarjeta de crédito
      </Link>
    )
  }

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-card">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Tarjetas de crédito</h2>
        <Link to="/cuentas/tarjeta-nueva" className={addLink}>Agregar</Link>
      </div>
      <ul className="-mx-2">
        {cards.map((card) => {
          const u = cardUsage(card, credits)
          return (
            <li key={card.id}>
              <Link to={`/creditos/${card.id}`} className="block space-y-1.5 rounded-2xl px-2 py-2.5 active:bg-zinc-50">
                <div className="flex items-baseline gap-3">
                  <p className="min-w-0 flex-1 truncate font-medium">{card.name}</p>
                  <p className="shrink-0 font-display font-semibold tabular-nums">{formatMXN(u.debt)}</p>
                </div>
                {u.ratio === null ? (
                  <p className="text-sm text-primary">Agrega su límite</p>
                ) : (
                  <>
                    <ProgressBar value={u.ratio} label={`Uso de ${card.name}`} />
                    <p className={`text-sm ${u.available! < 0 ? 'text-red-700' : 'text-zinc-500'}`}>
                      {u.available! < 0 ? `Te pasaste por ${formatMXN(-u.available!)}` : `Disponible ${formatMXN(u.available!)}`} de {formatMXN(card.limit!)}
                    </p>
                  </>
                )}
                <p className="text-xs text-zinc-500">
                  {u.msiPending > 0 && `Incluye ${formatMXN(u.msiPending)} de meses sin intereses · `}Paga el {formatDay(card.nextDue)}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { cardUsage } from '../credits/calc'
import { useCards } from '../credits/useCards'
import { monthRange } from '../lib/dates'
import { availableTotal } from '../money/calc'
import { useAccounts } from '../money/useAccounts'
import { useMonthMoney } from '../money/useMonthMoney'
import { watchCap, watchMonthSpending } from '../spending/api'
import { watchAlertSettings, type AlertSettings } from './api'
import { buildAlerts, visibleAlerts } from './calc'

// Reúne los datos del mes para los avisos. shortcut: duplica suscripciones de Inicio y Cuentas; si pesa, mover a un contexto
export function useAlerts(uid: string, now: string) {
  const [from, to] = monthRange(now)
  const { accounts } = useAccounts(uid)
  const available = availableTotal(accounts ?? [])
  const month = useMonthMoney(uid, now, available)
  const { cards, credits, loaded: cardsLoaded } = useCards(uid)
  const [spent, setSpent] = useState<number>()
  const [cap, setCap] = useState<number>()
  const [settings, setSettings] = useState<AlertSettings>()

  useEffect(() => watchMonthSpending(uid, from, to, (items) => setSpent(items.reduce((sum, i) => sum + i.amount, 0)), () => setSpent(0)), [uid, from, to])
  useEffect(() => watchCap(uid, setCap), [uid])
  useEffect(() => watchAlertSettings(uid, setSettings), [uid])

  if (!accounts || !month.ready || spent === undefined || !settings || !cardsLoaded) return { visible: [], hidden: [] }

  const alerts = buildAlerts({
    hasAccounts: accounts.length > 0,
    available,
    left: month.left,
    spent,
    cap,
    incomes: month.monthIncomes.reduce((sum, i) => sum + i.amount, 0) + month.expected,
    expenses: month.paid + month.pending + spent,
    ratioPct: settings.ratioPct,
    cards: cards.map((c) => ({ id: c.id, name: c.name, used: cardUsage(c, credits).used, limit: c.limit })),
  })
  return visibleAlerts(alerts, settings.hidden, from.slice(0, 7))
}

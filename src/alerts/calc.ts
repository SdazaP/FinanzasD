import { formatMXN } from '../lib/money'

export type AlertLevel = 'red' | 'yellow'
// key = tipo + nivel: ocultar el amarillo no tapa el rojo del mismo tipo
export type Alert = { key: string; level: AlertLevel; text: string; href: string }

export type AlertInput = {
  hasAccounts: boolean
  available: number
  left: number
  spent: number // gastos hormiga del mes
  cap?: number
  incomes: number // ingresos que cuentan para el mes (incluye la quincena esperada)
  expenses: number // pagado + pendiente + gastos hormiga
  ratioPct: number | null // null = aviso desactivado
  cards?: { id: string; name: string; used: number; limit?: number }[] // crédito usado = deuda + MSI pendientes
}

const alert = (type: string, level: AlertLevel, text: string, href: string): Alert => ({ key: `${type}-${level}`, level, text, href })

// Comparaciones en enteros: 79.9% no llega al 80%
export function capAlert(spent: number, cap?: number) {
  if (!cap || spent * 100 < cap * 80) return null
  if (spent < cap) {
    return alert('cap', 'yellow', `Llevas el ${Math.floor((spent * 100) / cap)}% de tu tope de gastos hormiga; te quedan ${formatMXN(cap - spent)}`, '/gastos-hormiga')
  }
  const text = spent === cap ? 'Llegaste a tu tope de gastos hormiga' : `Te pasaste del tope de gastos hormiga por ${formatMXN(spent - cap)}`
  return alert('cap', 'red', text, '/gastos-hormiga')
}

// Tarjeta al 90% de su límite: amarillo; por encima del límite: rojo. Una clave por tarjeta para ocultarlas por separado.
export function cardAlert(card: { id: string; name: string; used: number; limit?: number }) {
  if (!card.limit || card.used * 100 < card.limit * 90) return null
  if (card.used > card.limit) {
    return alert(`card-${card.id}`, 'red', `${card.name}: te pasaste de tu límite por ${formatMXN(card.used - card.limit)}`, '/cuentas')
  }
  return alert(`card-${card.id}`, 'yellow', `${card.name}: usas el ${Math.floor((card.used * 100) / card.limit)}% de tu límite`, '/cuentas')
}

export function buildAlerts(m: AlertInput) {
  const alerts: (Alert | null)[] = [
    m.hasAccounts && m.available < 0 ? alert('available', 'red', `Tu disponible está en ${formatMXN(m.available)}`, '/cuentas') : null,
    m.hasAccounts && m.left < 0
      ? alert('left', 'red', `Te faltan ${formatMXN(-m.left)} para cubrir lo que te queda por pagar este mes`, '/gastos-fijos')
      : null,
    capAlert(m.spent, m.cap),
    m.hasAccounts && m.ratioPct !== null && m.incomes > 0 && m.expenses * 100 > m.incomes * m.ratioPct
      ? alert(
          'ratio',
          m.expenses > m.incomes ? 'red' : 'yellow',
          `Tus gastos del mes son el ${Math.floor((m.expenses * 100) / m.incomes)}% de tus ingresos`,
          '/cuentas',
        )
      : null,
    ...(m.cards ?? []).map(cardAlert),
  ]
  const present = alerts.filter((a) => a !== null)
  return [...present.filter((a) => a.level === 'red'), ...present.filter((a) => a.level === 'yellow')]
}

// hidden: { key: 'YYYY-MM' } — un aviso oculto vuelve el mes siguiente
export function visibleAlerts(alerts: Alert[], hidden: Record<string, string>, month: string) {
  return { visible: alerts.filter((a) => hidden[a.key] !== month), hidden: alerts.filter((a) => hidden[a.key] === month) }
}

import { expect, test } from 'vitest'
import { buildAlerts, capAlert, visibleAlerts, type AlertInput } from './calc'

// Sin ningún aviso: todo en orden
const base: AlertInput = { hasAccounts: true, available: 100000, left: 50000, spent: 0, incomes: 1000000, expenses: 100000, ratioPct: 50 }
const keys = (input: Partial<AlertInput>) => buildAlerts({ ...base, ...input }).map((a) => a.key)

test('sin problemas no hay avisos', () => {
  expect(keys({})).toEqual([])
})

test('disponible y lo que queda: avisan desde −1¢, no en 0', () => {
  expect(keys({ available: 0, left: 0 })).toEqual([])
  const alerts = buildAlerts({ ...base, available: -1, left: -250000 })
  expect(alerts.map((a) => a.key)).toEqual(['available-red', 'left-red'])
  expect(alerts[0]).toMatchObject({ text: 'Tu disponible está en -$0.01', href: '/cuentas' })
  expect(alerts[1]).toMatchObject({ text: 'Te faltan $2,500.00 para cubrir lo que te queda por pagar este mes', href: '/gastos-fijos' })
})

test('tope de gastos hormiga: 79.9% nada, 80% amarillo, 100% y más rojo', () => {
  expect(capAlert(79900, 100000)).toBeNull()
  expect(capAlert(80000, 100000)).toMatchObject({ level: 'yellow', text: 'Llevas el 80% de tu tope de gastos hormiga; te quedan $200.00' })
  expect(capAlert(99999, 100000)).toMatchObject({ level: 'yellow', text: 'Llevas el 99% de tu tope de gastos hormiga; te quedan $0.01' })
  expect(capAlert(100000, 100000)).toMatchObject({ level: 'red', text: 'Llegaste a tu tope de gastos hormiga' })
  expect(capAlert(120000, 100000)).toMatchObject({ level: 'red', text: 'Te pasaste del tope de gastos hormiga por $200.00' })
  expect(capAlert(500000, undefined)).toBeNull()
  expect(keys({ spent: 90000, cap: 100000 })).toEqual(['cap-yellow'])
})

test('gastos sobre el % del ingreso', () => {
  expect(keys({ expenses: 500000 })).toEqual([]) // igual al 50%: no lo supera
  expect(keys({ expenses: 500001 })).toEqual(['ratio-yellow'])
  expect(buildAlerts({ ...base, expenses: 1200000 })[0]).toMatchObject({ key: 'ratio-red', text: 'Tus gastos del mes son el 120% de tus ingresos', href: '/cuentas' })
  expect(keys({ expenses: 999999, incomes: 0 })).toEqual([]) // sin ingresos no se compara
  expect(keys({ expenses: 999999, ratioPct: null })).toEqual([]) // desactivado
})

test('sin cuentas solo queda el aviso del tope', () => {
  expect(keys({ hasAccounts: false, available: -100, left: -100, expenses: 9999999, spent: 100000, cap: 100000 })).toEqual(['cap-red'])
})

test('primero los rojos y luego los amarillos', () => {
  expect(keys({ expenses: 600000, spent: 90000, cap: 100000, left: -1 })).toEqual(['left-red', 'cap-yellow', 'ratio-yellow'])
})

test('ocultar vale solo para ese mes y nivel', () => {
  const alerts = buildAlerts({ ...base, left: -1, spent: 90000, cap: 100000 })
  const result = visibleAlerts(alerts, { 'cap-yellow': '2026-11', 'left-red': '2026-10' }, '2026-11')
  expect(result.visible.map((a) => a.key)).toEqual(['left-red'])
  expect(result.hidden.map((a) => a.key)).toEqual(['cap-yellow'])

  // Si el tope pasa a rojo, el amarillo oculto ya no lo tapa
  const worse = buildAlerts({ ...base, spent: 110000, cap: 100000 })
  expect(visibleAlerts(worse, { 'cap-yellow': '2026-11' }, '2026-11').visible.map((a) => a.key)).toEqual(['cap-red'])
})

test('tarjetas: desde el 90% de su límite amarillo, por encima del límite rojo, una clave por tarjeta', () => {
  const card = (used: number, limit?: number) => ({ id: 'oro', name: 'BBVA Oro', used, limit })
  const one = (c: ReturnType<typeof card>) => buildAlerts({ ...base, cards: [c] })
  expect(one(card(8999, 10000))).toEqual([])
  expect(one(card(9000, 10000))).toEqual([
    { key: 'card-oro-yellow', level: 'yellow', text: 'BBVA Oro: usas el 90% de tu límite', href: '/cuentas' },
  ])
  expect(one(card(10000, 10000))[0]).toMatchObject({ key: 'card-oro-yellow', text: 'BBVA Oro: usas el 100% de tu límite' })
  expect(one(card(10101, 10000))[0]).toMatchObject({ key: 'card-oro-red', level: 'red', text: 'BBVA Oro: te pasaste de tu límite por $1.01' })
  expect(one(card(999999))).toEqual([]) // sin límite no hay aviso
  expect(keys({ cards: [card(9500, 10000), { id: 'nu', name: 'Nu', used: 20000, limit: 10000 }], left: -1 })).toEqual([
    'left-red', 'card-nu-red', 'card-oro-yellow',
  ])
})

import { describe, expect, test } from 'vitest'
import type { Credit } from '../credits/api'
import type { Recurring } from '../recurring/api'
import { monthCommitments, monthRange, upcoming } from './calc'

test.each([
  ['2026-02-10', ['2026-02-01', '2026-02-28']],
  ['2028-02-29', ['2028-02-01', '2028-02-29']],
  ['2026-04-30', ['2026-04-01', '2026-04-30']],
  ['2026-12-01', ['2026-12-01', '2026-12-31']],
])('monthRange(%s)', (today, expected) => {
  expect(monthRange(today)).toEqual(expected)
})

const recurring = (over: Partial<Recurring>): Recurring => ({
  id: 'r', name: 'R', type: 'fixed', category: 'Otros', amount: 1000, nextDue: '2026-11-05', dayOfMonth: 5, active: true, ...over,
})

const items: Recurring[] = [
  recurring({ id: 'renta', name: 'Renta', amount: 850000, nextDue: '2026-11-01' }),
  recurring({ id: 'netflix', name: 'Netflix', type: 'subscription', amount: 21900, nextDue: '2026-11-07' }),
  recurring({ id: 'gym', name: 'Gym', amount: 50000, nextDue: '2026-11-20' }),
  recurring({ id: 'luz', name: 'Luz', amount: 40000, nextDue: '2026-12-02' }), // ya pagada este mes
  recurring({ id: 'spotify', name: 'Spotify', amount: 12900, nextDue: '2026-11-03', active: false }),
]

const credits: Credit[] = [
  { id: 'bbva', kind: 'card', name: 'BBVA', balance: 300000, nextDue: '2026-11-04', dayOfMonth: 4 },
  { id: 'tv', kind: 'msi', name: 'Tele', total: 1200000, months: 12, balance: 900000, nextDue: '2026-11-25', dayOfMonth: 25 },
  { id: 'cel', kind: 'msi', name: 'Cel', total: 300000, months: 3, balance: 0, nextDue: '2026-11-02', dayOfMonth: 2 },
]

describe('upcoming', () => {
  test('vencidos y los próximos 7 días, ordenados y con su tipo, sin pausados ni liquidados', () => {
    expect(upcoming(items, credits, '2026-11-02')).toEqual([
      { id: 'renta', name: 'Renta', typeLabel: 'Gasto fijo', nextDue: '2026-11-01', amount: 850000, href: '/gastos-fijos/renta' },
      { id: 'bbva', name: 'BBVA', typeLabel: 'Tarjeta', nextDue: '2026-11-04', amount: 300000, href: '/creditos/bbva' },
      { id: 'netflix', name: 'Netflix', typeLabel: 'Suscripción', nextDue: '2026-11-07', amount: 21900, href: '/gastos-fijos/netflix' },
    ])
  })

  test('incluye MSI con su cuota cuando entra en la ventana', () => {
    expect(upcoming([], credits, '2026-11-20')).toContainEqual({
      id: 'tv', name: 'Tele', typeLabel: 'MSI', nextDue: '2026-11-25', amount: 100000, href: '/creditos/tv',
    })
  })
})

test('monthCommitments suma lo pagado y lo pendiente hasta fin de mes sin doble conteo', () => {
  // Pendiente: renta + netflix + gym + tarjeta (saldo) + cuota de la tele. Luz ya avanzó a diciembre.
  expect(monthCommitments(items, credits, 40000, '2026-11-02')).toEqual({
    paid: 40000,
    pending: 850000 + 21900 + 50000 + 300000 + 100000,
    total: 40000 + 850000 + 21900 + 50000 + 300000 + 100000,
  })
})

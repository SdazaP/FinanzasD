import { expect, test } from 'vitest'
import { accountActivity, availableTotal, leftThisMonth, savingsNet, type ActivityEntry } from './calc'

test('availableTotal suma saldos, incluidos negativos', () => {
  expect(availableTotal([{ balance: 1500000 }, { balance: -20000 }, { balance: 0 }])).toBe(1480000)
})

test('leftThisMonth aplica la fórmula', () => {
  // 20,000 de ingresos − 6,000 pagado − 1,500 hormiga − 2,000 ahorrado − 4,000 pendiente
  expect(leftThisMonth({ incomes: 2000000, paid: 600000, spent: 150000, savedNet: 200000, pending: 400000 })).toBe(650000)
  expect(leftThisMonth({ incomes: 0, paid: 0, spent: 5000, savedNet: 0, pending: 0 })).toBe(-5000)
})

test('savingsNet resta retiros a aportes del mes y no cuenta el saldo inicial', () => {
  expect(
    savingsNet(
      [
        { type: 'deposit', amount: 300000, date: '2026-11-02' },
        { type: 'withdrawal', amount: 50000, date: '2026-11-10' },
        { type: 'deposit', amount: 999999, date: '2026-11-01', initial: true },
        { type: 'deposit', amount: 70000, date: '2026-10-31' },
      ],
      '2026-11-01',
      '2026-11-30',
    ),
  ).toBe(250000)
})

test('accountActivity filtra por cuenta y ordena del más reciente al más antiguo', () => {
  const entries: ActivityEntry[] = [
    { id: 'i1', label: 'Sueldo', amount: 1500000, date: '2026-11-01', accountId: 'nomina' },
    { id: 'p1', label: 'Renta', amount: -850000, date: '2026-11-03', accountId: 'nomina' },
    { id: 'g1', label: 'Café', amount: -4500, date: '2026-11-03', accountId: 'efectivo' },
    { id: 'old', label: 'Pago viejo', amount: -1000, date: '2026-11-02' },
  ]
  expect(accountActivity(entries, 'nomina').map((e) => e.id)).toEqual(['p1', 'i1'])
})

import { expect, test } from 'vitest'
import { monthStatus } from './monthStatus'

test.each([
  ['vence este mes', '2026-11-20', false, '2026-11-01', 'due'],
  ['vence el último día del mes', '2026-11-30', false, '2026-11-15', 'due'],
  ['vencido del mes anterior', '2026-10-31', false, '2026-11-01', 'due'],
  ['vencido aunque haya pago de este periodo (un abono parcial)', '2026-11-05', true, '2026-11-10', 'due'],
  ['pagado: ya avanzó al mes siguiente y hay pago del periodo', '2026-12-05', true, '2026-11-10', 'paid'],
  ['primer pago el mes siguiente, sin pago este mes', '2026-12-05', false, '2026-11-10', 'later'],
  ['diciembre a enero', '2027-01-15', true, '2026-12-31', 'paid'],
] as const)('%s', (_name, nextDue, paid, today, expected) => {
  expect(monthStatus(nextDue, paid, today)).toBe(expected)
})

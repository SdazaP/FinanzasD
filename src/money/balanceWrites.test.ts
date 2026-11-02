// Comprueba que cada operación que mueve dinero cambia la cuenta correcta, con el signo correcto,
// en el mismo batch que el registro. Firestore se simula: doc() devuelve la ruta e increment() su valor.
import { beforeEach, expect, test, vi } from 'vitest'

const batch = vi.hoisted(() => ({ set: vi.fn(), update: vi.fn(), delete: vi.fn(), commit: vi.fn(() => Promise.resolve()) }))

vi.mock('../firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  writeBatch: () => batch,
  doc: (...parts: unknown[]) => (typeof parts[0] === 'string' ? parts.join('/') : parts.slice(1).length ? `${parts[0]}/${parts.slice(1).join('/')}` : `${parts[0]}/nuevo`),
  collection: (...parts: unknown[]) => (typeof parts[0] === 'object' ? parts.slice(1).join('/') : parts.join('/')),
  increment: (n: number) => ({ increment: n }),
  deleteField: () => 'DELETE',
  serverTimestamp: () => 'TS',
  Timestamp: class {},
}))

const { applyAccountDelta } = await import('../lib/accountBalance')
const { payRecurring, deletePayment } = await import('../recurring/api')
const { moveSaving, deleteMovement } = await import('../savings/api')
const { payCredit } = await import('../credits/api')
const { addSpending, updateSpending, deleteSpending } = await import('../spending/api')

const live = ['nomina', 'efectivo']
// Cambios de deuda de tarjetas registrados en el batch: { tarjeta: delta }
const cardDeltas = () =>
  Object.fromEntries(
    batch.update.mock.calls
      .filter(([path]) => String(path).includes('/credits/'))
      .map(([path, data]) => [String(path).split('/').pop(), (data as { balance: { increment: number } }).balance.increment]),
  )
// Cambios de saldo de cuentas registrados en el batch: { cuenta: delta }
const accountDeltas = () =>
  Object.fromEntries(
    batch.update.mock.calls
      .filter(([path]) => String(path).includes('/accounts/'))
      .map(([path, data]) => [String(path).split('/').pop(), (data as { balance: { increment: number } }).balance.increment]),
  )

beforeEach(() => vi.clearAllMocks())

test('applyAccountDelta omite registros sin cuenta y cuentas eliminadas', () => {
  applyAccountDelta(batch as never, 'u', undefined, -100, live)
  applyAccountDelta(batch as never, 'u', 'borrada', -100, live)
  applyAccountDelta(batch as never, 'u', 'nomina', 0, live)
  expect(batch.update).not.toHaveBeenCalled()
})

test('pagar un gasto fijo resta de la cuenta y borrar el pago la devuelve', async () => {
  const renta = { id: 'renta', name: 'Renta', type: 'fixed' as const, category: 'Vivienda', amount: 850000, nextDue: '2026-11-01', dayOfMonth: 1, active: true }
  await payRecurring('u', renta, 'nomina', live)
  expect(accountDeltas()).toEqual({ nomina: -850000 })
  expect(batch.set.mock.calls[0][1]).toMatchObject({ amount: 850000, accountId: 'nomina' })

  vi.clearAllMocks()
  await deletePayment('u', 'renta', { id: 'p1', dueDate: '2026-11-01', amount: 850000, accountId: 'nomina' }, live)
  expect(accountDeltas()).toEqual({ nomina: 850000 })
})

test('sin cuenta, pagar no mueve saldos ni guarda accountId', async () => {
  const luz = { id: 'luz', name: 'Luz', type: 'fixed' as const, category: 'Servicios', amount: 40000, nextDue: '2026-11-05', dayOfMonth: 5, active: true }
  await payRecurring('u', luz, undefined, live)
  expect(accountDeltas()).toEqual({})
  expect(batch.set.mock.calls[0][1]).not.toHaveProperty('accountId')
})

test('aportar resta, retirar suma, y borrar un aporte devuelve a la cuenta', async () => {
  const viaje = { id: 'viaje', name: 'Viaje', balance: 0 }
  await moveSaving('u', viaje, 'deposit', 200000, 'nomina', live)
  expect(accountDeltas()).toEqual({ nomina: -200000 })

  vi.clearAllMocks()
  await moveSaving('u', viaje, 'withdrawal', 50000, 'efectivo', live)
  expect(accountDeltas()).toEqual({ efectivo: 50000 })

  vi.clearAllMocks()
  await deleteMovement('u', 'viaje', { id: 'm1', type: 'deposit', amount: 200000, date: '2026-11-01', accountId: 'nomina' }, live)
  expect(accountDeltas()).toEqual({ nomina: 200000 })
})

test('gasto hormiga: registrar resta, editar entre cuentas corrige ambas y borrar devuelve', async () => {
  await addSpending('u', { amount: 4500, date: '2026-11-01', category: 'Café', accountId: 'efectivo' }, live)
  expect(accountDeltas()).toEqual({ efectivo: -4500 })

  vi.clearAllMocks()
  const cafe = { id: 'c', amount: 4500, date: '2026-11-01', category: 'Café', accountId: 'efectivo', createdAt: 0 }
  await updateSpending('u', cafe, { amount: 6000, date: '2026-11-01', category: 'Café', accountId: 'nomina' }, live)
  expect(accountDeltas()).toEqual({ efectivo: 4500, nomina: -6000 })

  vi.clearAllMocks()
  await updateSpending('u', cafe, { amount: 6000, date: '2026-11-01', category: 'Café', accountId: 'efectivo' }, live)
  expect(accountDeltas()).toEqual({ efectivo: -1500 })

  vi.clearAllMocks()
  await deleteSpending('u', cafe, live)
  expect(accountDeltas()).toEqual({ efectivo: 4500 })
})

test('pagar un MSI con otro monto que la cuota se rechaza sin escribir', async () => {
  const audifonos = { id: 'aud', kind: 'msi' as const, name: 'Audífonos', total: 300000, months: 3, balance: 300000, nextDue: '2026-11-06', dayOfMonth: 6 }
  await expect(payCredit('u', audifonos, 200000, 'nomina', live)).rejects.toThrow('cuota del mes ($1,000.00)')
  expect(batch.set).not.toHaveBeenCalled()
  expect(batch.commit).not.toHaveBeenCalled()

  await payCredit('u', audifonos, 100000, 'nomina', live)
  expect(accountDeltas()).toEqual({ nomina: -100000 })
  expect(batch.set.mock.calls[0][1]).toMatchObject({ dueDate: '2026-11-06', amount: 100000 })
})

test('cargar a una tarjeta sube su deuda y no toca cuentas; borrar revierte', async () => {
  const liveAll = [...live, 'oro']
  const luz = { id: 'luz', name: 'Luz', type: 'fixed' as const, category: 'Servicios', amount: 40000, nextDue: '2026-11-05', dayOfMonth: 5, active: true }
  await payRecurring('u', luz, 'card:oro', liveAll)
  expect(cardDeltas()).toEqual({ oro: 40000 })
  expect(accountDeltas()).toEqual({})
  expect(batch.set.mock.calls[0][1]).toMatchObject({ cardId: 'oro' })
  expect(batch.set.mock.calls[0][1]).not.toHaveProperty('accountId')

  vi.clearAllMocks()
  await deletePayment('u', 'luz', { id: 'p1', dueDate: '2026-11-05', amount: 40000, cardId: 'oro' }, liveAll)
  expect(cardDeltas()).toEqual({ oro: -40000 })

  vi.clearAllMocks()
  await addSpending('u', { amount: 4500, date: '2026-11-01', category: 'Café', cardId: 'oro' }, liveAll)
  expect(cardDeltas()).toEqual({ oro: 4500 })
  expect(accountDeltas()).toEqual({})

  vi.clearAllMocks()
  const cafe = { id: 'c', amount: 4500, date: '2026-11-01', category: 'Café', cardId: 'oro', createdAt: 0 }
  await deleteSpending('u', cafe, liveAll)
  expect(cardDeltas()).toEqual({ oro: -4500 })
})

test('editar un gasto entre tarjeta y cuenta corrige ambos y no guarda las dos', async () => {
  const liveAll = [...live, 'oro']
  const cafe = { id: 'c', amount: 4500, date: '2026-11-01', category: 'Café', cardId: 'oro', createdAt: 0 }
  await updateSpending('u', cafe, { amount: 6000, date: '2026-11-01', category: 'Café', accountId: 'nomina' }, liveAll)
  expect(cardDeltas()).toEqual({ oro: -4500 })
  expect(accountDeltas()).toEqual({ nomina: -6000 })
  expect(batch.update.mock.calls[0][1]).toMatchObject({ accountId: 'nomina', cardId: 'DELETE' })

  vi.clearAllMocks()
  const enCuenta = { ...cafe, cardId: undefined, accountId: 'nomina', amount: 6000 }
  await updateSpending('u', enCuenta, { amount: 6000, date: '2026-11-01', category: 'Café', cardId: 'oro' }, liveAll)
  expect(accountDeltas()).toEqual({ nomina: 6000 })
  expect(cardDeltas()).toEqual({ oro: 6000 })
  expect(batch.update.mock.calls[0][1]).toMatchObject({ cardId: 'oro', accountId: 'DELETE' })

  vi.clearAllMocks()
  await addSpending('u', { amount: 100, date: '2026-11-01', category: 'Café', cardId: 'borrada' }, liveAll)
  expect(cardDeltas()).toEqual({})
})

test('sin conexión, registrar un gasto termina aunque el servidor no haya confirmado', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  batch.commit.mockReturnValueOnce(new Promise(() => {})) // el servidor nunca responde
  await expect(addSpending('u', { amount: 4500, date: '2026-11-01', category: 'Café', accountId: 'nomina' }, live)).resolves.toBeUndefined()
  expect(accountDeltas()).toEqual({ nomina: -4500 })
  vi.restoreAllMocks()
})

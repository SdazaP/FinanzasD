import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { dismissUploadFailed, saved, useUploadFailed, WAIT_MS } from './saved'

// Una escritura que controla el test: termina o falla cuando se le pide
const pendingWrite = () => {
  let ok!: () => void, fail!: (e: Error) => void
  const promise = new Promise<void>((res, rej) => ((ok = res), (fail = rej)))
  return { promise, ok, fail }
}
const offline = (value: boolean) => vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(!value)
// Estado de la promesa después de vaciar las pendientes (sin avanzar el reloj)
async function state(p: Promise<unknown>) {
  let s = 'pendiente'
  p.then(() => (s = 'resuelto'), () => (s = 'falló'))
  await vi.advanceTimersByTimeAsync(0)
  return s
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  act(() => dismissUploadFailed())
})

test('con conexión espera la confirmación del servidor', async () => {
  offline(false)
  const w = pendingWrite()
  const p = saved(w.promise)
  expect(await state(p)).toBe('pendiente')
  w.ok()
  expect(await state(p)).toBe('resuelto')
})

test('con conexión, un error antes de 3 s llega al formulario y no a la campana', async () => {
  offline(false)
  const { result } = renderHook(() => useUploadFailed())
  const w = pendingWrite()
  const p = saved(w.promise)
  w.fail(new Error('permission-denied'))
  await expect(p).rejects.toThrow('permission-denied')
  expect(result.current).toBe(false)
})

test('sin conexión termina de inmediato aunque el servidor no confirme', async () => {
  offline(true)
  expect(await state(saved(pendingWrite().promise))).toBe('resuelto')
})

test('con señal que no responde termina a los 3 segundos', async () => {
  offline(false)
  const p = saved(pendingWrite().promise)
  await vi.advanceTimersByTimeAsync(WAIT_MS - 1)
  expect(await state(p)).toBe('pendiente')
  await vi.advanceTimersByTimeAsync(1)
  expect(await state(p)).toBe('resuelto')
})

test('si un cambio ya dado por guardado falla al subir, se avisa', async () => {
  offline(true)
  const { result } = renderHook(() => useUploadFailed())
  const w = pendingWrite()
  await saved(w.promise)
  await act(async () => w.fail(new Error('permission-denied')))
  expect(result.current).toBe(true)
  act(() => dismissUploadFailed())
  expect(result.current).toBe(false)
})

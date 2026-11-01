import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useToday } from './useToday'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 1, 23, 59, 30))
})

afterEach(() => {
  vi.useRealTimers()
})

test('cambia de día al pasar la medianoche', () => {
  const { result } = renderHook(() => useToday())
  expect(result.current).toBe('2026-11-01')
  act(() => vi.advanceTimersByTime(31_000))
  expect(result.current).toBe('2026-11-02')
})

test('se recalcula al volver al primer plano otro día', () => {
  const { result } = renderHook(() => useToday())
  vi.setSystemTime(new Date(2026, 10, 5, 8, 0))
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(result.current).toBe('2026-11-05')
})

test('limpia el timer al desmontar', () => {
  const { unmount } = renderHook(() => useToday())
  expect(vi.getTimerCount()).toBe(1)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

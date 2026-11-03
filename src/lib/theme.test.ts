import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { applyTheme, getTheme, setTheme, useTheme } from './theme'

const root = document.documentElement
const bar = () => document.querySelector('meta[name="theme-color"]')!.getAttribute('content')
const systemDark = (dark: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: dark && q.includes('dark'), addEventListener() {}, removeEventListener() {} }))

beforeEach(() => {
  document.head.innerHTML = '<meta name="theme-color" content="#f6f6fa">'
  localStorage.clear()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete root.dataset.theme
})

test('sin elección guardada o con un valor inválido es "system"', () => {
  expect(getTheme()).toBe('system')
  localStorage.setItem('theme', 'azul')
  expect(getTheme()).toBe('system')
})

test('si localStorage falla, usa "system" y setTheme no truena', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado') })
  expect(getTheme()).toBe('system')
  expect(() => setTheme('dark')).not.toThrow()
  expect(root.dataset.theme).toBe('dark')
})

test('setTheme guarda la elección y aplica el tema y la barra', () => {
  setTheme('dark')
  expect(getTheme()).toBe('dark')
  expect(root.dataset.theme).toBe('dark')
  expect(bar()).toBe('#111216')

  setTheme('light')
  expect(root.dataset.theme).toBe('light')
  expect(bar()).toBe('#f6f6fa')

  setTheme('system')
  expect(localStorage.getItem('theme')).toBeNull()
})

test('"system" sigue el modo del dispositivo', () => {
  systemDark(true)
  applyTheme('system')
  expect(root.dataset.theme).toBe('dark')
  systemDark(false)
  applyTheme('system')
  expect(root.dataset.theme).toBe('light')
})

test('useTheme se actualiza al cambiar el tema', () => {
  const { result } = renderHook(() => useTheme())
  expect(result.current).toBe('system')
  act(() => setTheme('light'))
  expect(result.current).toBe('light')
})

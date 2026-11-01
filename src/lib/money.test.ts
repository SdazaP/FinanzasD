import { describe, expect, test } from 'vitest'
import { formatMXN, toCents } from './money'

describe('formatMXN', () => {
  test('formatea centavos como pesos', () => {
    expect(formatMXN(12350)).toBe('$123.50')
    expect(formatMXN(123456789)).toBe('$1,234,567.89')
    expect(formatMXN(0)).toBe('$0.00')
  })
})

describe('toCents', () => {
  test('convierte texto a centavos', () => {
    expect(toCents('1,234.5')).toBe(123450)
    expect(toCents('$ 99.99')).toBe(9999)
    expect(toCents('0.1')).toBe(10)
    expect(toCents('1.005')).toBe(101)
  })

  test('rechaza texto inválido, vacío o negativo', () => {
    for (const text of ['', '   ', 'abc', '12abc', '-5', 'Infinity']) {
      expect(toCents(text)).toBeNull()
    }
  })
})

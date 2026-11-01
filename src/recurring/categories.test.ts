import { expect, test } from 'vitest'
import { categoryError, defaultCategories, mergeCategories } from './categories'

test('mezcla las por defecto con las propias, ordenadas y sin repetir', () => {
  expect(mergeCategories(['Mascotas', 'Ahorro casa', 'Mascotas'])).toEqual([...defaultCategories, 'Ahorro casa', 'Mascotas'])
})

test.each([
  ['', 'Escribe un nombre.'],
  ['   ', 'Escribe un nombre.'],
  ['x'.repeat(31), 'Máximo 30 caracteres.'],
  ['vivienda', 'Esa categoría ya existe.'],
  [' Mascotas ', 'Esa categoría ya existe.'],
  ['Gimnasio', ''],
])('categoryError(%j) → %j', (name, expected) => {
  expect(categoryError(name, [...defaultCategories, 'Mascotas'])).toBe(expected)
})

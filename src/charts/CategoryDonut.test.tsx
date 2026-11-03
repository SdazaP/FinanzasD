import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import CategoryDonut from './CategoryDonut'

const slices = [
  { name: 'Comida', amount: 239580, pct: 52, slot: 1 },
  { name: 'Compras', amount: 158310, pct: 34, slot: 2 },
  { name: 'Otros', amount: 62827, pct: 14, slot: 0 },
]

test('muestra el total al centro, una fila por segmento y la tabla para lectores de pantalla', () => {
  render(<CategoryDonut total={460717} slices={slices} />)
  expect(screen.getByText('$4,607.17', { selector: 'p' })).toBeInTheDocument()
  expect(screen.getByText('Gastado')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Comida: $2,395.80, 52%' })).toBeInTheDocument()
  expect(screen.getAllByRole('button')).toHaveLength(3)
  const table = screen.getByRole('table', { name: 'Gastos del mes por categoría' })
  expect(within(table).getByRole('rowheader', { name: 'Otros' })).toBeInTheDocument()
})

test('al enfocar una fila, el centro muestra esa categoría', () => {
  render(<CategoryDonut total={460717} slices={slices} />)
  fireEvent.focus(screen.getByRole('button', { name: /^Compras/ }))
  expect(screen.getByText('$1,583.10', { selector: 'p' })).toBeInTheDocument()
  expect(screen.getByText('Compras', { selector: 'p' })).toBeInTheDocument()
  fireEvent.blur(screen.getByRole('button', { name: /^Compras/ }))
  expect(screen.getByText('Gastado')).toBeInTheDocument()
})

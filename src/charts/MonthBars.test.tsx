import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import MonthBars from './MonthBars'

const months = [
  { month: '2026-06-01', total: null },
  { month: '2026-07-01', total: null },
  { month: '2026-08-01', total: 120000 },
  { month: '2026-09-01', total: 0 },
  { month: '2026-10-01', total: 534143 },
  { month: '2026-11-01', total: 460717 },
]

const pill = () => document.querySelector('.bg-ink')?.textContent

test('la etiqueta va en el mes actual, la comparación arriba y los meses sin datos no tienen barra', () => {
  render(<MonthBars months={months} />)
  expect(pill()).toBe('$4.6k')
  expect(screen.getByText('Vas $734.26 por debajo del mes pasado')).toBeInTheDocument()
  expect(screen.getAllByRole('button')).toHaveLength(4)
  expect(screen.getByText('junio: sin datos')).toBeInTheDocument()
})

test('con foco o al pasar el cursor, la etiqueta pasa a esa barra', () => {
  render(<MonthBars months={months} />)
  fireEvent.focus(screen.getByRole('button', { name: 'octubre: $5,341.43' }))
  expect(pill()).toBe('$5.3k')
  fireEvent.mouseEnter(screen.getByRole('button', { name: 'agosto: $1,200.00' }))
  expect(pill()).toBe('$1.2k')
})

test('la tabla oculta tiene cada mes', () => {
  render(<MonthBars months={months} />)
  const table = screen.getByRole('table', { name: 'Total gastado por mes' })
  expect(within(table).getAllByRole('row')).toHaveLength(7)
  expect(within(table).getByRole('row', { name: 'septiembre $0.00' })).toBeInTheDocument()
})

test('sin mes pasado no hay comparación', () => {
  render(<MonthBars months={months.map((m, i) => (i < 5 ? { ...m, total: null } : m))} />)
  expect(screen.queryByText(/mes pasado/)).not.toBeInTheDocument()
})

import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import AccountPicker from './AccountPicker'
import type { Account } from './calc'

const accounts: Account[] = [
  { id: 'nomina', name: 'Nómina', type: 'debit', balance: 1500000 },
  { id: 'efectivo', name: 'Efectivo', type: 'cash', balance: 30000 },
]

test('muestra la cuenta elegida y avisa al cambiar', () => {
  const onChange = vi.fn()
  render(<AccountPicker accounts={accounts} value="nomina" onChange={onChange} label="Desde" />)
  const select = screen.getByLabelText('Desde')
  expect(select).toHaveValue('nomina')
  fireEvent.change(select, { target: { value: 'efectivo' } })
  expect(onChange).toHaveBeenCalledWith('efectivo')
})

test('sin cuentas no se muestra', () => {
  const { container } = render(<AccountPicker accounts={[]} value={undefined} onChange={vi.fn()} />)
  expect(container).toBeEmptyDOMElement()
})

test('con tarjetas las muestra aparte con valor card:{id}', () => {
  const onChange = vi.fn()
  render(<AccountPicker accounts={accounts} value="nomina" onChange={onChange} label="Desde" cards={[{ id: 'oro', name: 'Oro' }]} />)
  const option = screen.getByRole('option', { name: 'Oro (crédito)' })
  expect(option).toHaveValue('card:oro')
  expect(option.parentElement).toHaveAttribute('label', 'Tarjetas')
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: 'card:oro' } })
  expect(onChange).toHaveBeenCalledWith('card:oro')
})

test('solo con tarjetas empieza en "sin cuenta" para no cargar a crédito por accidente', () => {
  render(<AccountPicker accounts={[]} value={undefined} onChange={vi.fn()} label="Desde" cards={[{ id: 'oro', name: 'Oro' }]} />)
  expect(screen.getByLabelText('Desde')).toHaveValue('')
})

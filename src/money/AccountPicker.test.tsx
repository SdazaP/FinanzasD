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

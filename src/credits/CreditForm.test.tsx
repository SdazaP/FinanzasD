import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import CreditForm, { type CreditInput } from './CreditForm'

const setup = (initial?: CreditInput) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<CreditForm onSubmit={onSubmit} initial={initial} />)
  const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
  const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  return { onSubmit, type, submit }
}

test('tarjeta: acepta saldo 0 y límite vacío', async () => {
  const { onSubmit, type, submit } = setup()
  type('Nombre de la tarjeta', 'BBVA Azul')
  type('Saldo actual', '0')
  type('Próximo pago', '2026-11-20')
  submit()
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({ kind: 'card', name: 'BBVA Azul', balance: 0, nextDue: '2026-11-20', dayOfMonth: 20 }),
  )
})

test('tarjeta: rechaza saldo vacío y límite en 0', async () => {
  const { onSubmit, type, submit } = setup()
  type('Nombre de la tarjeta', 'BBVA')
  type('Límite de crédito (opcional)', '0')
  submit()
  expect(await screen.findByText('Escribe el saldo (puede ser 0).')).toBeInTheDocument()
  expect(screen.getByText('Escribe un límite mayor a $0 o déjalo vacío.')).toBeInTheDocument()
  expect(screen.getByLabelText('Saldo actual')).toHaveFocus()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('MSI: valida meses y saldo pendiente mayor al total', async () => {
  const { onSubmit, type, submit } = setup()
  fireEvent.click(screen.getByLabelText('Meses sin intereses'))
  type('Qué compraste', 'Laptop')
  type('Monto total', '12000')
  type('Meses', '49')
  type('Saldo pendiente', '13000')
  type('Próximo pago', '2026-11-15')
  submit()
  expect(await screen.findByText('Entre 2 y 48 meses.')).toBeInTheDocument()
  expect(screen.getByText('No puede ser mayor al total.')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('MSI: sin saldo pendiente usa el total', async () => {
  const { onSubmit, type, submit } = setup()
  fireEvent.click(screen.getByLabelText('Meses sin intereses'))
  type('Qué compraste', 'Laptop')
  type('Tarjeta (opcional)', ' Nu ')
  type('Monto total', '12,000')
  type('Meses', '12')
  type('Próximo pago', '2026-11-15')
  submit()
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({
      kind: 'msi', name: 'Laptop', card: 'Nu', total: 1200000, months: 12, balance: 1200000, nextDue: '2026-11-15', dayOfMonth: 15,
    }),
  )
})

test('al editar no se puede cambiar el tipo', () => {
  setup({ kind: 'msi', name: 'Laptop', total: 1200000, months: 12, balance: 600000, nextDue: '2026-11-15', dayOfMonth: 15 })
  expect(screen.getByLabelText('Tarjeta')).toBeDisabled()
  expect(screen.getByLabelText('Saldo pendiente')).toHaveValue('6000.00')
})

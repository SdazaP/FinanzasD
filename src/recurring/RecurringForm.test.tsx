import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { defaultCategories } from './categories'
import RecurringForm from './RecurringForm'

const setup = (initial?: Parameters<typeof RecurringForm>[0]['initial']) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<RecurringForm categories={defaultCategories} onSubmit={onSubmit} initial={initial} />)
  const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
  const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  return { onSubmit, type, submit }
}

test('muestra los errores y no envía si faltan datos', async () => {
  const { onSubmit, type, submit } = setup()
  type('Monto', '0')
  submit()
  expect(await screen.findByText('Escribe un nombre.')).toBeInTheDocument()
  expect(screen.getByText('Escribe un monto mayor a $0.')).toBeInTheDocument()
  expect(screen.getByText('Elige la fecha del próximo pago.')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('rechaza nombres de más de 60 caracteres y montos inválidos', async () => {
  const { onSubmit, type, submit } = setup()
  type('Nombre', 'x'.repeat(61))
  type('Monto', '12abc')
  submit()
  expect(await screen.findByText('Máximo 60 caracteres.')).toBeInTheDocument()
  expect(screen.getByText('Escribe un monto mayor a $0.')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('envía el monto en centavos y el día del mes', async () => {
  const { onSubmit, type, submit } = setup()
  type('Nombre', '  Netflix ')
  fireEvent.click(screen.getByLabelText('Suscripción'))
  type('Categoría', 'Entretenimiento')
  type('Monto', '219')
  type('Próximo pago', '2026-03-31')
  submit()
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Netflix',
      type: 'subscription',
      category: 'Entretenimiento',
      amount: 21900,
      nextDue: '2026-03-31',
      dayOfMonth: 31,
    }),
  )
})

test('precarga los valores al editar', () => {
  setup({ name: 'Renta', type: 'fixed', category: 'Vivienda', amount: 850050, nextDue: '2026-04-01' })
  expect(screen.getByLabelText('Nombre')).toHaveValue('Renta')
  expect(screen.getByLabelText('Monto')).toHaveValue('8500.50')
  expect(screen.getByLabelText('Gasto fijo')).toBeChecked()
})

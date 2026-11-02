import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import PlannedForm from './PlannedForm'

const setup = () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<PlannedForm categories={['Comida', 'Compras', 'Salud']} today="2026-11-02" onSubmit={onSubmit} />)
  const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
  return { onSubmit, type, submit: () => fireEvent.click(screen.getByRole('button', { name: 'Planear gasto' })) }
}

test('valida qué, monto y fecha (no pasada)', async () => {
  const { onSubmit, type, submit } = setup()
  type('Fecha', '2026-11-01')
  submit()
  expect(await screen.findByText('Escribe qué vas a comprar o pagar.')).toBeInTheDocument()
  expect(screen.getByText('Escribe un monto mayor a $0.')).toBeInTheDocument()
  expect(screen.getByText('Debe ser hoy o una fecha futura.')).toBeInTheDocument()
  expect(screen.getByLabelText('Qué vas a comprar o pagar')).toHaveFocus()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('guarda un apartado planeado con monto, fecha, categoría y lo ya apartado', async () => {
  const { onSubmit, type, submit } = setup()
  type('Qué vas a comprar o pagar', ' Lentes ')
  type('Monto', '3,000')
  type('Fecha', '2027-03-15')
  fireEvent.click(screen.getByRole('button', { name: 'Salud' }))
  type('Ya tengo apartado (opcional)', '500')
  submit()
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Lentes', target: 300000, deadline: '2027-03-15', planned: true, category: 'Salud', balance: 50000 }),
  )
})

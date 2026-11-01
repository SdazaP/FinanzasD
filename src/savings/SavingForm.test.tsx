import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import SavingForm from './SavingForm'

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

test('alta mínima: solo nombre, saldo inicial 0 y sin objetivo', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<SavingForm onSubmit={onSubmit} />)
  expect(screen.queryByLabelText('Fecha límite (opcional)')).not.toBeInTheDocument()
  type('Nombre', ' Emergencias ')
  submit()
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Emergencias', balance: 0 }))
})

test('con objetivo aparece la fecha y se envía en centavos', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<SavingForm onSubmit={onSubmit} />)
  type('Nombre', 'Viaje')
  type('Saldo inicial', '1,500')
  type('Objetivo (opcional)', '30000')
  type('Fecha límite (opcional)', '2026-12-15')
  submit()
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Viaje', balance: 150000, target: 3000000, deadline: '2026-12-15' }),
  )
})

test('rechaza nombre vacío y objetivo en 0', async () => {
  const onSubmit = vi.fn()
  render(<SavingForm onSubmit={onSubmit} />)
  type('Objetivo (opcional)', '0')
  submit()
  expect(await screen.findByText('Escribe un nombre.')).toBeInTheDocument()
  expect(screen.getByText('Escribe un objetivo mayor a $0 o déjalo vacío.')).toBeInTheDocument()
  expect(screen.getByLabelText('Nombre')).toHaveFocus()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('al editar no pide saldo inicial y quitar el objetivo quita la fecha', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<SavingForm initial={{ name: 'Viaje', target: 3000000, deadline: '2026-12-15' }} onSubmit={onSubmit} />)
  expect(screen.queryByLabelText('Saldo inicial')).not.toBeInTheDocument()
  type('Objetivo (opcional)', '')
  submit()
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Viaje' }))
})

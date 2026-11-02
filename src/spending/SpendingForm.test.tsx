import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { defaultSpendingCategories } from './categories'
import SpendingForm from './SpendingForm'

vi.mock('./api', () => ({ watchSpendingCategories: () => () => {} }))

const setup = () => {
  let finish!: () => void
  const onSubmit = vi.fn(() => new Promise<void>((ok) => (finish = ok)))
  const onCreateCategory = vi.fn().mockResolvedValue(undefined)
  render(<SpendingForm categories={defaultSpendingCategories} today="2026-11-01" onSubmit={onSubmit} onCreateCategory={onCreateCategory} />)
  const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
  return { onSubmit, onCreateCategory, type, finish: () => finish() }
}

test('rechaza monto vacío, nota larga y fecha futura', async () => {
  const { onSubmit, type } = setup()
  type('Nota (opcional)', 'x'.repeat(81))
  type('Fecha', '2026-11-02')
  fireEvent.click(screen.getByRole('button', { name: 'Agregar' }))
  expect(await screen.findByText('Escribe un monto mayor a $0.')).toBeInTheDocument()
  expect(screen.getByText('Máximo 80 caracteres.')).toBeInTheDocument()
  expect(screen.getByText('No puede ser una fecha futura.')).toBeInTheDocument()
  expect(screen.getByLabelText('Monto')).toHaveFocus()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('guarda una sola vez, se limpia y conserva la categoría elegida', async () => {
  const { onSubmit, type, finish } = setup()
  type('Monto', '45')
  fireEvent.click(screen.getByRole('button', { name: 'Antojos' }))
  type('Nota (opcional)', ' Oxxo ')
  const save = screen.getByRole('button', { name: 'Agregar' })
  fireEvent.click(save)
  fireEvent.click(screen.getByRole('button', { name: 'Guardando…' }))

  expect(onSubmit).toHaveBeenCalledTimes(1)
  expect(onSubmit).toHaveBeenCalledWith({ amount: 4500, date: '2026-11-01', category: 'Antojos', note: 'Oxxo' })

  finish()
  await waitFor(() => expect(screen.getByLabelText('Monto')).toHaveValue(''))
  expect(screen.getByLabelText('Nota (opcional)')).toHaveValue('')
  expect(screen.getByRole('button', { name: 'Antojos' })).toHaveAttribute('aria-pressed', 'true')
})

const accounts = [
  { id: 'nomina', name: 'Nómina', type: 'debit' as const, balance: 100000 },
  { id: 'efectivo', name: 'Efectivo', type: 'cash' as const, balance: 5000 },
]

test('con cuentas, el gasto sale de la predeterminada', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(
    <SpendingForm categories={defaultSpendingCategories} today="2026-11-01" accounts={accounts} defaultAccountId="nomina" onSubmit={onSubmit} onCreateCategory={vi.fn()} />,
  )
  expect(screen.getByLabelText('Desde')).toHaveValue('nomina')
  fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '30' } })
  fireEvent.click(screen.getByRole('button', { name: 'Agregar' }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 3000, accountId: 'nomina' })))
})

test('al editar un gasto anterior a las cuentas no le asigna ninguna', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(
    <SpendingForm
      categories={defaultSpendingCategories}
      today="2026-11-01"
      initial={{ amount: 4500, date: '2026-10-31', category: 'Café' }}
      submitLabel="Guardar"
      accounts={accounts}
      defaultAccountId="nomina"
      onSubmit={onSubmit}
      onCreateCategory={vi.fn()}
    />,
  )
  expect(screen.getByLabelText('Desde')).toHaveValue('')
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ amount: 4500, date: '2026-10-31', category: 'Café' }))
})

test('crea una categoría nueva y la selecciona', async () => {
  const { onCreateCategory, type } = setup()
  fireEvent.click(screen.getByRole('button', { name: '+ Nueva' }))
  type('Nombre de la nueva categoría', 'café')
  fireEvent.click(screen.getByRole('button', { name: 'Crear' }))
  expect(await screen.findByText('Esa categoría ya existe.')).toBeInTheDocument()
  type('Nombre de la nueva categoría', 'Gimnasio')
  fireEvent.click(screen.getByRole('button', { name: 'Crear' }))
  await waitFor(() => expect(onCreateCategory).toHaveBeenCalledWith('Gimnasio'))
})

test('cargar a una tarjeta guarda cardId y no accountId; al editar la preselecciona', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const cards = [{ id: 'oro', name: 'Oro' }]
  const { unmount } = render(
    <SpendingForm categories={defaultSpendingCategories} today="2026-11-01" accounts={accounts} defaultAccountId="nomina" cards={cards} onSubmit={onSubmit} onCreateCategory={vi.fn()} />,
  )
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: 'card:oro' } })
  fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '30' } })
  fireEvent.click(screen.getByRole('button', { name: 'Agregar' }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ amount: 3000, date: '2026-11-01', category: 'Comida', cardId: 'oro' }))
  unmount()

  render(
    <SpendingForm
      categories={defaultSpendingCategories}
      today="2026-11-01"
      initial={{ amount: 3000, date: '2026-11-01', category: 'Comida', cardId: 'oro' }}
      submitLabel="Guardar"
      accounts={accounts}
      cards={cards}
      onSubmit={vi.fn()}
      onCreateCategory={vi.fn()}
    />,
  )
  expect(screen.getByLabelText('Desde')).toHaveValue('card:oro')
})

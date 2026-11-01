import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import type { Account } from './calc'
import IncomeForm from './IncomeForm'

const accounts: Account[] = [
  { id: 'nomina', name: 'Nómina', type: 'debit', balance: 0 },
  { id: 'efectivo', name: 'Efectivo', type: 'cash', balance: 0 },
]

test('valida monto y fecha, y registra en la cuenta predeterminada', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<IncomeForm accounts={accounts} defaultAccountId="nomina" today="2026-11-01" onSubmit={onSubmit} />)

  fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-11-05' } })
  fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))
  expect(await screen.findByText('Escribe un monto mayor a $0.')).toBeInTheDocument()
  expect(screen.getByText('No puede ser una fecha futura.')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()

  fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '15,000' } })
  fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-11-01' } })
  fireEvent.click(screen.getByRole('button', { name: 'Extra' }))
  fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ concept: 'Extra', amount: 1500000, date: '2026-11-01', accountId: 'nomina' }))
})

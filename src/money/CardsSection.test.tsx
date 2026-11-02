import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'
import type { Card } from '../credits/useCards'
import CardsSection from './CardsSection'

const oro: Card = { id: 'oro', kind: 'card', name: 'BBVA Oro', balance: 300000, limit: 1000000, nextDue: '2026-11-20', dayOfMonth: 20 }
const nu: Card = { id: 'nu', kind: 'card', name: 'Nu', balance: 1200000, limit: 1000000, nextDue: '2026-11-05', dayOfMonth: 5 }
const vieja: Card = { id: 'vieja', kind: 'card', name: 'Vieja', balance: 0, nextDue: '2026-11-10', dayOfMonth: 10 }
const msis = [{ kind: 'msi', cardId: 'oro', balance: 200000 }]

const renderSection = (cards: Card[]) =>
  render(
    <MemoryRouter>
      <CardsSection cards={cards} credits={msis} />
    </MemoryRouter>,
  )

test('muestra deuda, uso con sus MSI, disponible y fecha; cada tarjeta abre su detalle', () => {
  renderSection([oro, nu, vieja])
  const [first, second, third] = screen.getAllByRole('listitem')

  expect(within(first).getByRole('link')).toHaveAttribute('href', '/creditos/oro')
  expect(within(first).getByText('$3,000.00')).toBeInTheDocument()
  expect(within(first).getByRole('progressbar', { name: 'Uso de BBVA Oro' })).toHaveAttribute('aria-valuenow', '50')
  expect(within(first).getByText('Disponible $5,000.00 de $10,000.00')).toBeInTheDocument()
  expect(within(first).getByText(/Incluye \$2,000\.00 de meses sin intereses · Paga el 20 nov/)).toBeInTheDocument()

  expect(within(second).getByText('Te pasaste por $2,000.00 de $10,000.00')).toHaveClass('text-red-700')
  expect(within(third).getByText('Agrega su límite')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Agregar' })).toHaveAttribute('href', '/cuentas/tarjeta-nueva')
})

test('sin tarjetas solo invita a agregar una', () => {
  renderSection([])
  expect(screen.queryByRole('heading', { name: 'Tarjetas de crédito' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: '+ Agregar tarjeta de crédito' })).toHaveAttribute('href', '/cuentas/tarjeta-nueva')
})

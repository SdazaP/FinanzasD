import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'
import App from './App'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

test('la barra inferior navega entre secciones', () => {
  renderAt('/')
  expect(screen.getByRole('heading', { name: 'Resumen' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('link', { name: 'Créditos' }))

  expect(screen.getByRole('heading', { name: 'Créditos' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Créditos' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current')
})

test('una ruta desconocida vuelve al inicio', () => {
  renderAt('/no-existe')
  expect(screen.getByRole('heading', { name: 'Resumen' })).toBeInTheDocument()
})

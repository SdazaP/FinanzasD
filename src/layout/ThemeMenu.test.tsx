import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import ThemeMenu from './ThemeMenu'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

test('el botón anuncia el tema y el menú marca la opción actual', () => {
  render(<ThemeMenu />)
  const button = screen.getByRole('button', { name: 'Tema: Sistema' })
  fireEvent.click(button)
  expect(screen.getByRole('button', { name: 'Sistema' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Sistema' })).toHaveFocus()
  expect(screen.getByRole('button', { name: 'Oscuro' })).toHaveAttribute('aria-pressed', 'false')
})

test('elegir Oscuro lo aplica, lo guarda y cierra el menú', () => {
  render(<ThemeMenu />)
  fireEvent.click(screen.getByRole('button', { name: 'Tema: Sistema' }))
  fireEvent.click(screen.getByRole('button', { name: 'Oscuro' }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('theme')).toBe('dark')
  expect(screen.queryByRole('group', { name: 'Tema' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tema: Oscuro' })).toHaveFocus()
})

test('Escape cierra el menú sin cambiar el tema', () => {
  render(<ThemeMenu />)
  fireEvent.click(screen.getByRole('button', { name: 'Tema: Sistema' }))
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('group', { name: 'Tema' })).not.toBeInTheDocument()
  expect(localStorage.getItem('theme')).toBeNull()
})

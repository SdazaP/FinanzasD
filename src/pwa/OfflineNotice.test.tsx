import { act, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import OfflineNotice from './OfflineNotice'

afterEach(() => vi.restoreAllMocks())

const setOnline = (value: boolean) => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'))
  })
}

test('con conexión no muestra nada; sin conexión avisa, y al volver la señal se quita', () => {
  render(<OfflineNotice />)
  expect(screen.queryByRole('status')).not.toBeInTheDocument()

  setOnline(false)
  expect(screen.getByRole('status')).toHaveTextContent('Sin conexión. Ves lo último guardado; lo que registres se subirá al volver la señal.')

  setOnline(true)
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

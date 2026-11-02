import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import UpdateBanner from './UpdateBanner'

const pwa = vi.hoisted(() => ({ useWaitingUpdate: vi.fn(), applyUpdate: vi.fn() }))
vi.mock('./pwa', () => pwa)

test('sin versión nueva no muestra nada', () => {
  pwa.useWaitingUpdate.mockReturnValue(false)
  const { container } = render(<UpdateBanner />)
  expect(container).toBeEmptyDOMElement()
})

test('con versión nueva avisa y "Actualizar" la activa', () => {
  pwa.useWaitingUpdate.mockReturnValue(true)
  render(<UpdateBanner />)
  expect(screen.getByRole('status')).toHaveTextContent('Hay una versión nueva')
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
  expect(pwa.applyUpdate).toHaveBeenCalled()
})

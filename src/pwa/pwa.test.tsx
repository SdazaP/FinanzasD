import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

// El módulo guarda el aviso de Chrome en memoria: se importa de nuevo en cada test
let InstallButton: typeof import('./InstallButton').default

beforeEach(async () => {
  vi.resetModules()
  InstallButton = (await import('./InstallButton')).default
})

afterEach(() => vi.unstubAllGlobals())

const offerInstall = () => {
  const prompt = vi.fn().mockResolvedValue(undefined)
  act(() => {
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) }))
  })
  return prompt
}

test('sin aviso de Chrome no hay botón', () => {
  render(<InstallButton />)
  expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
})

test('cuando Chrome ofrece instalar aparece el botón y abre su aviso una sola vez', async () => {
  render(<InstallButton />)
  const prompt = offerInstall()
  fireEvent.click(screen.getByRole('button', { name: 'Instalar app' }))
  expect(prompt).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
})

test('ya instalada (pantalla completa) no ofrece instalar', () => {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(display-mode: standalone)' }))
  render(<InstallButton />)
  offerInstall()
  expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
})

test('al terminar la instalación el botón desaparece', () => {
  render(<InstallButton />)
  offerInstall()
  act(() => {
    window.dispatchEvent(new Event('appinstalled'))
  })
  expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
})

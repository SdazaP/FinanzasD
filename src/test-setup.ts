import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(cleanup)

// Por defecto, sin cuentas: los flujos se comportan como antes del módulo de dinero.
// Los tests de cuentas lo sobrescriben con su propio vi.mock.
vi.mock('./money/useAccounts', () => ({ useAccounts: () => ({ accounts: [], defaultId: undefined, liveIds: [], error: false }) }))
vi.mock('./credits/useCards', () => ({ useCards: () => ({ cards: [], credits: [], loaded: true, liveCardIds: [] }) }))

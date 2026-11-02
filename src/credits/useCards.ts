import { useEffect, useState } from 'react'
import { watchCredits, type Credit } from './api'

export type Card = Extract<Credit, { kind: 'card' }>

// Tarjetas de crédito (y todos los créditos, para sumar sus MSI al uso). Si falla la lectura, sin tarjetas.
export function useCards(uid: string) {
  const [credits, setCredits] = useState<Credit[]>()
  useEffect(() => watchCredits(uid, setCredits, () => setCredits([])), [uid])
  const all = credits ?? []
  const cards = all.filter((c): c is Card => c.kind === 'card')
  return { cards, credits: all, loaded: !!credits, liveCardIds: cards.map((c) => c.id) }
}

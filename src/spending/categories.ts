import { useEffect, useState } from 'react'
import { mergeCategories } from '../lib/categories'
import { watchSpendingCategories } from './api'

export const defaultSpendingCategories = ['Comida', 'Café', 'Antojos', 'Salidas', 'Transporte', 'Compras', 'Otros']

export function useSpendingCategories(uid: string) {
  const [custom, setCustom] = useState<string[]>([])
  useEffect(() => watchSpendingCategories(uid, setCustom), [uid])
  return mergeCategories(custom, defaultSpendingCategories)
}

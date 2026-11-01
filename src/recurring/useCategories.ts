import { useEffect, useState } from 'react'
import { watchCategories } from './api'
import { mergeCategories } from './categories'

export function useCategories(uid: string) {
  const [custom, setCustom] = useState<string[]>([])
  useEffect(() => watchCategories(uid, setCustom), [uid])
  return mergeCategories(custom)
}

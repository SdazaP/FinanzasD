// Las fijas primero en su orden; las propias después, ordenadas y sin repetir
export const mergeCategories = (custom: string[], defaults: string[]) => [
  ...defaults,
  ...[...new Set(custom)].filter((c) => !defaults.includes(c)).sort((a, b) => a.localeCompare(b, 'es')),
]

export function categoryError(name: string, existing: string[]) {
  const clean = name.trim()
  if (!clean) return 'Escribe un nombre.'
  if (clean.length > 30) return 'Máximo 30 caracteres.'
  if (existing.some((c) => c.toLowerCase() === clean.toLowerCase())) return 'Esa categoría ya existe.'
  return ''
}

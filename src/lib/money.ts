const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export const formatMXN = (cents: number) => mxn.format(cents / 100)

// Parsea el texto sin pasar por float: 1.005 * 100 da 100.49999…
export function toCents(text: string): number | null {
  const match = /^(\d*)(?:\.(\d*))?$/.exec(text.replace(/[$,\s]/g, ''))
  if (!match || !/\d/.test(match[0])) return null
  const [, whole, fraction = ''] = match
  const digits = fraction.padEnd(3, '0')
  const cents = Number(whole || 0) * 100 + Number(digits.slice(0, 2)) + (Number(digits[2]) >= 5 ? 1 : 0)
  return Number.isSafeInteger(cents) ? cents : null
}

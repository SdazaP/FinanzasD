import { useId } from 'react'
import { formatMXN } from '../lib/money'
import type { Account } from './calc'

type Props = {
  accounts: Account[]
  value: string | undefined
  onChange: (id: string) => void // '' = sin cuenta (solo con allowNone)
  label?: string
  compact?: boolean
  allowNone?: boolean
}

// Selector de "de qué cuenta sale/entra el dinero". Sin cuentas no se muestra: los flujos siguen como antes.
export default function AccountPicker({ accounts, value, onChange, label = 'Cuenta', compact = false, allowNone = false }: Props) {
  const id = useId()
  if (!accounts.length) return null

  if (compact) {
    return (
      <label className="flex min-w-0 items-center gap-1 text-sm text-zinc-500">
        <span className="shrink-0">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-11 min-w-0 truncate rounded-xl bg-transparent pr-1 font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {allowNone && <option value="">Sin cuenta (no mueve saldos)</option>}
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} · {formatMXN(a.balance)}
          </option>
        ))}
      </select>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { toCents } from '../lib/money'
import { fieldClass, primaryButtonClass } from '../lib/ui'
import { accountTypes, type AccountType } from './calc'

type Props = {
  initial?: { name: string; type: AccountType }
  // Al crear se pide el saldo inicial; al editar el saldo solo cambia con movimientos o un ajuste
  withBalance: boolean
  onSubmit: (input: { name: string; type: AccountType; balance: number }) => Promise<unknown>
}

export default function AccountForm({ initial, withBalance, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<AccountType>(initial?.type ?? 'debit')
  const [balance, setBalance] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found: Record<string, string> = {}
    const clean = name.trim()
    if (!clean) found.name = 'Escribe un nombre.'
    else if (clean.length > 40) found.name = 'Máximo 40 caracteres.'
    const cents = balance.trim() ? toCents(balance) : 0
    if (withBalance && cents === null) found.balance = 'Escribe un saldo válido (puede ser 0).'
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(`account-${first}`)?.focus()
      return
    }
    setSaving(true)
    try {
      await onSubmit({ name: clean, type, balance: cents ?? 0 })
    } catch {
      setErrors({ form: 'No se pudo guardar. Intenta de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  const error = (key: string) => errors[key] && <p id={`account-${key}-error`} className="mt-1 text-sm text-red-700">{errors[key]}</p>
  const invalid = (key: string) => ({ 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? `account-${key}-error` : undefined })

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <label htmlFor="account-name" className="mb-1.5 block text-sm font-medium">Nombre</label>
        <input id="account-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Nómina BBVA" autoComplete="off" className={fieldClass} {...invalid('name')} />
        {error('name')}
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Tipo</legend>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-zinc-200/60 p-1">
          {accountTypes.map(([value, label]) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="account-type" value={value} checked={type === value} onChange={() => setType(value)} className="peer sr-only" />
              <span className="flex min-h-11 items-center justify-center rounded-xl text-sm font-medium text-zinc-600 transition-colors duration-150 peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {withBalance && (
        <div>
          <label htmlFor="account-balance" className="mb-1.5 block text-sm font-medium">Saldo actual</label>
          <input id="account-balance" value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" placeholder="0.00" className={fieldClass} {...invalid('balance')} />
          {error('balance')}
        </div>
      )}
      {error('form')}

      <button type="submit" disabled={saving} className={primaryButtonClass}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}

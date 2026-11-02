import { useState, type FormEvent } from 'react'
import { toCents } from '../lib/money'
import { fieldClass, primaryButtonClass } from '../lib/ui'
import type { NewSavingInput } from './SavingForm'

type Props = { categories: string[]; today: string; onSubmit: (input: NewSavingInput) => Promise<void> }

const chip = 'min-h-10 rounded-full px-3.5 text-sm font-medium transition-colors duration-150'

// "Planear gasto": un apartado con monto (meta), fecha y categoría
export default function PlannedForm({ categories, today, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [balance, setBalance] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found: Record<string, string> = {}
    const cleanName = name.trim()
    if (!cleanName) found.name = 'Escribe qué vas a comprar o pagar.'
    else if (cleanName.length > 60) found.name = 'Máximo 60 caracteres.'
    const cents = toCents(amount)
    if (!cents) found.amount = 'Escribe un monto mayor a $0.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) found.date = 'Elige la fecha del gasto.'
    else if (date < today) found.date = 'Debe ser hoy o una fecha futura.'
    const balanceCents = balance.trim() ? toCents(balance) : 0
    if (balanceCents === null) found.balance = 'Escribe un monto válido (puede ser 0).'
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(`planned-${first}`)?.focus()
      return
    }
    setSaving(true)
    try {
      await onSubmit({ name: cleanName, target: cents!, deadline: date, planned: true, category, balance: balanceCents! })
    } catch {
      setErrors({ form: 'No se pudo guardar. Intenta de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  const error = (key: string) => errors[key] && <p id={`planned-${key}-error`} className="mt-1 text-sm text-red-700">{errors[key]}</p>
  const invalid = (key: string) => ({ 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? `planned-${key}-error` : undefined })

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <label htmlFor="planned-name" className="mb-1.5 block text-sm font-medium">Qué vas a comprar o pagar</label>
        <input id="planned-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Lentes" autoComplete="off" className={fieldClass} {...invalid('name')} />
        {error('name')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="planned-amount" className="mb-1.5 block text-sm font-medium">Monto</label>
          <input id="planned-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className={fieldClass} {...invalid('amount')} />
        </div>
        <div>
          <label htmlFor="planned-date" className="mb-1.5 block text-sm font-medium">Fecha</label>
          <input id="planned-date" type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className={fieldClass} {...invalid('date')} />
        </div>
      </div>
      {error('amount')}
      {error('date')}

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Categoría</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={c === category}
              onClick={() => setCategory(c)}
              className={`${chip} ${c === category ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="planned-balance" className="mb-1.5 block text-sm font-medium">Ya tengo apartado (opcional)</label>
        <input id="planned-balance" value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" placeholder="0.00" className={fieldClass} {...invalid('balance')} />
        {error('balance')}
      </div>
      {error('form')}

      <button type="submit" disabled={saving} className={primaryButtonClass}>
        {saving ? 'Guardando…' : 'Planear gasto'}
      </button>
    </form>
  )
}

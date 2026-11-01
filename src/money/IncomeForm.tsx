import { useState, type FormEvent } from 'react'
import { toCents } from '../lib/money'
import { fieldClass, primaryButtonClass } from '../lib/ui'
import AccountPicker from './AccountPicker'
import type { IncomeConcept, IncomeInput } from './api'
import type { Account } from './calc'

const concepts: IncomeConcept[] = ['Sueldo', 'Extra', 'Reembolso', 'Otro']

type Props = {
  accounts: Account[]
  defaultAccountId?: string
  today: string
  initial?: IncomeInput
  submitLabel?: string
  onSubmit: (input: IncomeInput) => Promise<unknown>
}

export default function IncomeForm({ accounts, defaultAccountId, today, initial, submitLabel = 'Registrar', onSubmit }: Props) {
  const [concept, setConcept] = useState<IncomeConcept>(initial?.concept ?? 'Sueldo')
  const [amount, setAmount] = useState(initial ? (initial.amount / 100).toFixed(2) : '')
  const [date, setDate] = useState(initial?.date ?? today)
  const [accountId, setAccountId] = useState(initial?.accountId ?? defaultAccountId)
  const [note, setNote] = useState(initial?.note ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const cents = toCents(amount)
    const found: Record<string, string> = {}
    if (!cents) found.amount = 'Escribe un monto mayor a $0.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) found.date = 'Elige una fecha.'
    else if (date > today) found.date = 'No puede ser una fecha futura.'
    if (note.trim().length > 80) found.note = 'Máximo 80 caracteres.'
    if (!accountId) found.account = 'Elige la cuenta donde entra el dinero.'
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(`income-${first}`)?.focus()
      return
    }
    const input: IncomeInput = { concept, amount: cents!, date, accountId: accountId! }
    if (note.trim()) input.note = note.trim()
    setSaving(true)
    try {
      await onSubmit(input)
    } catch {
      setErrors({ form: 'No se pudo guardar. Intenta de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  const error = (key: string) => errors[key] && <p id={`income-${key}-error`} className="mt-1 text-sm text-red-700">{errors[key]}</p>
  const invalid = (key: string) => ({ 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? `income-${key}-error` : undefined })

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Concepto</legend>
        <div className="flex flex-wrap gap-2">
          {concepts.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={concept === c}
              onClick={() => setConcept(c)}
              className={`min-h-10 rounded-full px-3.5 text-sm font-medium transition-colors duration-150 ${concept === c ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="income-amount" className="mb-1.5 block text-sm font-medium">Monto</label>
        <input id="income-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className={fieldClass} {...invalid('amount')} />
        {error('amount')}
      </div>

      <AccountPicker accounts={accounts} value={accountId} onChange={setAccountId} label="Entra a" />
      {error('account')}

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="min-w-0">
          <label htmlFor="income-note" className="mb-1.5 block text-sm font-medium">Nota (opcional)</label>
          <input id="income-note" value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" className={fieldClass} {...invalid('note')} />
        </div>
        <div>
          <label htmlFor="income-date" className="mb-1.5 block text-sm font-medium">Fecha</label>
          <input id="income-date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className={`${fieldClass} w-40`} {...invalid('date')} />
        </div>
      </div>
      {error('note')}
      {error('date')}
      {error('form')}

      <button type="submit" disabled={saving} className={primaryButtonClass}>
        {saving ? 'Guardando…' : submitLabel}
      </button>
    </form>
  )
}

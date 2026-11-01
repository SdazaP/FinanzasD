import { useState, type FormEvent, type ReactNode } from 'react'
import { toCents } from '../lib/money'
import { fieldClass, primaryButtonClass } from '../lib/ui'

export type SavingInput = { name: string; target?: number; deadline?: string }
export type NewSavingInput = SavingInput & { balance: number }

type Props =
  | { initial?: undefined; onSubmit: (input: NewSavingInput) => Promise<void> }
  | { initial: SavingInput; onSubmit: (input: SavingInput) => Promise<void> }

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  )
}

export default function SavingForm({ initial, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [balance, setBalance] = useState('')
  const [target, setTarget] = useState(initial?.target ? (initial.target / 100).toFixed(2) : '')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found: Record<string, string> = {}
    const cleanName = name.trim()
    if (!cleanName) found.name = 'Escribe un nombre.'
    else if (cleanName.length > 60) found.name = 'Máximo 60 caracteres.'
    const balanceCents = balance.trim() ? toCents(balance) : 0
    if (!initial && balanceCents === null) found.balance = 'Escribe un saldo válido (puede ser 0).'
    const targetCents = target.trim() ? toCents(target) : undefined
    if (targetCents === null || targetCents === 0) found.target = 'Escribe un objetivo mayor a $0 o déjalo vacío.'

    setErrors(found)
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus() // lleva al error aunque esté fuera de pantalla
      return
    }

    const input: SavingInput = { name: cleanName }
    if (targetCents) {
      input.target = targetCents
      if (deadline) input.deadline = deadline
    }
    setSaving(true)
    try {
      await (initial ? onSubmit(input) : onSubmit({ ...input, balance: balanceCents! }))
    } finally {
      setSaving(false)
    }
  }

  const invalid = (id: string) => ({ 'aria-invalid': !!errors[id], 'aria-describedby': errors[id] ? `${id}-error` : undefined })

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field id="name" label="Nombre" error={errors.name}>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="Ej. Viaje, Emergencias" className={fieldClass} {...invalid('name')} />
      </Field>

      {!initial && (
        <Field id="balance" label="Saldo inicial" error={errors.balance}>
          <input id="balance" value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" placeholder="0.00" className={fieldClass} {...invalid('balance')} />
        </Field>
      )}

      <Field id="target" label="Objetivo (opcional)" error={errors.target}>
        <input id="target" value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" placeholder="0.00" className={fieldClass} {...invalid('target')} />
      </Field>

      {target.trim() && (
        <Field id="deadline" label="Fecha límite (opcional)">
          <input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={fieldClass} />
        </Field>
      )}

      <button type="submit" disabled={saving} className={primaryButtonClass}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}

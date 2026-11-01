import { useState } from 'react'
import { toCents } from './money'
import { fieldClass } from './ui'

type Props = {
  id: string
  label: string
  initialCents?: number
  validate: (cents: number | null) => string
  onConfirm: (cents: number) => Promise<unknown>
  onDone: () => void // al confirmar con éxito o cancelar
}

// Campo de monto en línea con Confirmar / Cancelar (pagos, aportes, retiros)
export default function AmountAction({ id, label, initialCents, validate, onConfirm, onDone }: Props) {
  const [amount, setAmount] = useState(initialCents ? (initialCents / 100).toFixed(2) : '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function confirm() {
    const cents = toCents(amount)
    const problem = validate(cents)
    setError(problem)
    if (problem || !cents) return
    setSaving(true)
    try {
      await onConfirm(cents)
      onDone()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 rounded-2xl bg-canvas p-3">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        id={id}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        placeholder="0.00"
        autoFocus
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClass}
      />
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-700">{error}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onDone} className="min-h-11 rounded-xl bg-white text-sm font-medium active:scale-[0.97]">
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={saving}
          className="min-h-11 rounded-xl bg-primary text-sm font-medium text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { categoryError } from '../lib/categories'
import { toCents } from '../lib/money'
import { fieldClass, primaryButtonClass } from '../lib/ui'
import type { SpendingInput } from './api'

type Props = {
  categories: string[]
  today: string
  initial?: SpendingInput
  submitLabel?: string
  onSubmit: (input: SpendingInput) => Promise<unknown>
  onCreateCategory: (name: string) => Promise<unknown>
}

const chip = 'min-h-10 rounded-full px-3.5 text-sm font-medium transition-colors duration-150'

// Registro rápido (sin `initial`: se limpia al guardar y conserva la categoría) y edición (con `initial`)
export default function SpendingForm({ categories, today, initial, submitLabel = 'Agregar', onSubmit, onCreateCategory }: Props) {
  const [amount, setAmount] = useState(initial ? (initial.amount / 100).toFixed(2) : '')
  const [category, setCategory] = useState(initial?.category ?? categories[0])
  const [note, setNote] = useState(initial?.note ?? '')
  const [date, setDate] = useState(initial?.date ?? today)
  const [newCategory, setNewCategory] = useState<string | null>(null) // null = no se está creando
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function createCategory() {
    const clean = (newCategory ?? '').trim()
    const problem = categoryError(clean, categories)
    setErrors((prev) => ({ ...prev, category: problem }))
    if (problem) return
    try {
      await onCreateCategory(clean)
      setCategory(clean)
      setNewCategory(null)
    } catch {
      setErrors((prev) => ({ ...prev, category: 'No se pudo guardar la categoría. Intenta de nuevo.' }))
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const cents = toCents(amount)
    const found: Record<string, string> = {}
    if (!cents) found.amount = 'Escribe un monto mayor a $0.'
    if (note.trim().length > 80) found.note = 'Máximo 80 caracteres.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) found.date = 'Elige una fecha.'
    else if (date > today) found.date = 'No puede ser una fecha futura.'
    setErrors(found)
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) {
      document.getElementById(`spending-${firstInvalid}`)?.focus()
      return
    }

    const input: SpendingInput = { amount: cents!, date, category }
    if (note.trim()) input.note = note.trim()
    setSaving(true)
    try {
      await onSubmit(input)
      if (!initial) {
        setAmount('')
        setNote('')
        setDate(today)
      }
    } catch {
      setErrors({ form: 'No se pudo guardar. Intenta de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  const error = (key: string) =>
    errors[key] && (
      <p id={`spending-${key}-error`} className="mt-1 text-sm text-red-700">
        {errors[key]}
      </p>
    )
  const invalid = (key: string) => ({ 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? `spending-${key}-error` : undefined })

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="spending-amount" className="mb-1.5 block text-sm font-medium">Monto</label>
        <input id="spending-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className={fieldClass} {...invalid('amount')} />
        {error('amount')}
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Categoría</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`${chip} ${category === c ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200'}`}
            >
              {c}
            </button>
          ))}
          <button type="button" onClick={() => setNewCategory('')} className={`${chip} border border-dashed border-zinc-300 text-zinc-600`}>
            + Nueva
          </button>
        </div>
        {newCategory !== null && (
          <div className="mt-3 flex gap-2">
            <input
              aria-label="Nombre de la nueva categoría"
              placeholder="Ej. Gimnasio"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  createCategory()
                }
              }}
              autoFocus
              className={`${fieldClass} min-w-0 flex-1`}
              {...invalid('category')}
            />
            <button type="button" onClick={createCategory} className="min-h-12 shrink-0 rounded-2xl bg-primary/10 px-4 font-medium text-primary">
              Crear
            </button>
            <button
              type="button"
              aria-label="Cancelar nueva categoría"
              onClick={() => {
                setNewCategory(null)
                setErrors((prev) => ({ ...prev, category: '' }))
              }}
              className="grid size-12 shrink-0 place-items-center rounded-2xl text-zinc-500 active:bg-zinc-100"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        )}
        {error('category')}
      </fieldset>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="min-w-0">
          <label htmlFor="spending-note" className="mb-1.5 block text-sm font-medium">Nota (opcional)</label>
          <input id="spending-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. Oxxo" autoComplete="off" className={fieldClass} {...invalid('note')} />
        </div>
        <div>
          <label htmlFor="spending-date" className="mb-1.5 block text-sm font-medium">Fecha</label>
          <input id="spending-date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className={`${fieldClass} w-40`} {...invalid('date')} />
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

import { useState, type FormEvent } from 'react'
import { toCents } from '../lib/money'
import { categoryError } from './categories'

const NEW_CATEGORY = '__new__'

export type RecurringType = 'fixed' | 'subscription'

export type RecurringInput = {
  name: string
  type: RecurringType
  category: string
  amount: number
  nextDue: string
  dayOfMonth: number
}

type Props = {
  categories: string[]
  initial?: Omit<RecurringInput, 'dayOfMonth'>
  onSubmit: (input: RecurringInput) => Promise<void>
  onCreateCategory: (name: string) => Promise<unknown>
}

const field = 'min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 aria-invalid:border-red-500'

export default function RecurringForm({ categories, initial, onSubmit, onCreateCategory }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<RecurringType>(initial?.type ?? 'fixed')
  const [category, setCategory] = useState(initial?.category ?? categories[0])
  const [amount, setAmount] = useState(initial ? (initial.amount / 100).toFixed(2) : '')
  const [nextDue, setNextDue] = useState(initial?.nextDue ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [newCategory, setNewCategory] = useState<string | null>(null) // null = no se está creando

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
    if (!name.trim()) found.name = 'Escribe un nombre.'
    else if (name.trim().length > 60) found.name = 'Máximo 60 caracteres.'
    if (!cents) found.amount = 'Escribe un monto mayor a $0.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDue)) found.nextDue = 'Elige la fecha del próximo pago.'
    setErrors(found)
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) document.getElementById(firstInvalid)?.focus() // lleva al error aunque esté fuera de pantalla
    if (firstInvalid || !cents) return

    setSaving(true)
    try {
      await onSubmit({ name: name.trim(), type, category, amount: cents, nextDue, dayOfMonth: Number(nextDue.slice(8)) })
    } finally {
      setSaving(false)
    }
  }

  const error = (key: string) =>
    errors[key] && (
      <p id={`${key}-error`} className="mt-1 text-sm text-red-700">
        {errors[key]}
      </p>
    )

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">Nombre</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name && 'name-error'}
          className={field}
        />
        {error('name')}
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Tipo</legend>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-200/60 p-1">
          {([['fixed', 'Gasto fijo'], ['subscription', 'Suscripción']] as const).map(([value, label]) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} className="peer sr-only" />
              <span className="flex min-h-11 items-center justify-center rounded-xl text-sm font-medium text-zinc-600 transition-colors duration-150 peer-checked:bg-white peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="category" className="mb-1.5 block text-sm font-medium">Categoría</label>
        <select
          id="category"
          value={category}
          onChange={(e) => (e.target.value === NEW_CATEGORY ? setNewCategory('') : setCategory(e.target.value))}
          className={field}
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
          <option value={NEW_CATEGORY}>Nueva categoría…</option>
        </select>
        {newCategory !== null && (
          <div className="mt-3 flex gap-2">
            <input
              aria-label="Nombre de la nueva categoría"
              placeholder="Ej. Mascotas"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  createCategory()
                }
              }}
              autoFocus
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? 'category-error' : undefined}
              className={`${field} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={createCategory}
              className="min-h-12 shrink-0 rounded-2xl bg-primary/10 px-4 font-medium text-primary active:scale-[0.97]"
            >
              Agregar
            </button>
            <button
              type="button"
              onClick={() => {
                setNewCategory(null)
                setErrors((prev) => ({ ...prev, category: '' }))
              }}
              aria-label="Cancelar nueva categoría"
              className="grid size-12 shrink-0 place-items-center rounded-2xl text-zinc-500 active:bg-zinc-100"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        )}
        {error('category')}
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="amount" className="mb-1.5 block text-sm font-medium">Monto</label>
          <input
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount && 'amount-error'}
            className={field}
          />
          {error('amount')}
        </div>
        <div>
          <label htmlFor="nextDue" className="mb-1.5 block text-sm font-medium">Próximo pago</label>
          <input
            id="nextDue"
            type="date"
            value={nextDue}
            onChange={(e) => setNextDue(e.target.value)}
            aria-invalid={!!errors.nextDue}
            aria-describedby={errors.nextDue && 'nextDue-error'}
            className={field}
          />
          {error('nextDue')}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="min-h-12 w-full rounded-2xl bg-primary font-medium text-white shadow-card transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}

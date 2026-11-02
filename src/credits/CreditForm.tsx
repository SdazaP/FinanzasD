import { useState, type FormEvent, type ReactNode } from 'react'
import { toCents } from '../lib/money'
import { fieldClass, primaryButtonClass } from '../lib/ui'

type Common = { name: string; nextDue: string; dayOfMonth: number; balance: number }
export type CardInput = Common & { kind: 'card'; limit?: number }
export type MsiInput = Common & { kind: 'msi'; card?: string; cardId?: string; total: number; months: number }
export type CreditInput = CardInput | MsiInput

type Props = {
  initial?: CreditInput
  onSubmit: (input: CreditInput) => Promise<void>
}

const centsText = (cents?: number) => (cents === undefined ? '' : (cents / 100).toFixed(2))

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-zinc-500">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  )
}

export default function CreditForm({ initial, onSubmit }: Props) {
  const [kind, setKind] = useState(initial?.kind ?? 'card')
  const [name, setName] = useState(initial?.name ?? '')
  const [nextDue, setNextDue] = useState(initial?.nextDue ?? '')
  const [balance, setBalance] = useState(centsText(initial?.balance))
  const [limit, setLimit] = useState(initial?.kind === 'card' ? centsText(initial.limit) : '')
  const [card, setCard] = useState(initial?.kind === 'msi' ? (initial.card ?? '') : '')
  const [total, setTotal] = useState(initial?.kind === 'msi' ? centsText(initial.total) : '')
  const [months, setMonths] = useState(initial?.kind === 'msi' ? String(initial.months) : '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found: Record<string, string> = {}
    const cleanName = name.trim()
    if (!cleanName) found.name = 'Escribe un nombre.'
    else if (cleanName.length > 60) found.name = 'Máximo 60 caracteres.'

    let input: CreditInput | undefined
    if (kind === 'card') {
      const balanceCents = toCents(balance)
      const limitCents = limit.trim() ? toCents(limit) : undefined
      if (balanceCents === null || !balance.trim()) found.balance = 'Escribe el saldo (puede ser 0).'
      if (limitCents === null || limitCents === 0) found.limit = 'Escribe un límite mayor a $0 o déjalo vacío.'
      if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDue)) found.nextDue = 'Elige la fecha del próximo pago.'
      if (!Object.keys(found).length) {
        input = { kind, name: cleanName, balance: balanceCents!, nextDue, dayOfMonth: Number(nextDue.slice(8)) }
        if (limitCents) input.limit = limitCents
      }
    } else {
      const totalCents = toCents(total)
      const monthsNum = Number(months)
      const pendingCents = balance.trim() ? toCents(balance) : totalCents
      if (card.trim().length > 40) found.card = 'Máximo 40 caracteres.'
      if (!totalCents) found.total = 'Escribe el monto total de la compra.'
      if (!Number.isInteger(monthsNum) || monthsNum < 2 || monthsNum > 48) found.months = 'Entre 2 y 48 meses.'
      if (pendingCents === null || (totalCents && pendingCents > totalCents)) found.balance = 'No puede ser mayor al total.'
      if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDue)) found.nextDue = 'Elige la fecha del próximo pago.'
      if (!Object.keys(found).length) {
        input = {
          kind, name: cleanName, total: totalCents!, months: monthsNum, balance: pendingCents!, nextDue, dayOfMonth: Number(nextDue.slice(8)),
        }
        if (card.trim()) input.card = card.trim()
      }
    }

    setErrors(found)
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) document.getElementById(firstInvalid)?.focus() // lleva al error aunque esté fuera de pantalla
    if (!input) return

    setSaving(true)
    try {
      await onSubmit(input)
    } finally {
      setSaving(false)
    }
  }

  const invalid = (id: string) => ({ 'aria-invalid': !!errors[id], 'aria-describedby': errors[id] ? `${id}-error` : undefined })

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <fieldset disabled={!!initial} className="disabled:opacity-60">
        <legend className="mb-1.5 text-sm font-medium">Tipo</legend>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-200/60 p-1">
          {([['card', 'Tarjeta'], ['msi', 'Meses sin intereses']] as const).map(([value, label]) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="peer sr-only" />
              <span className="flex min-h-11 items-center justify-center rounded-xl px-2 text-center text-sm font-medium text-zinc-600 transition-colors duration-150 peer-checked:bg-white peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field id="name" label={kind === 'card' ? 'Nombre de la tarjeta' : 'Qué compraste'} error={errors.name}>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className={fieldClass} {...invalid('name')} />
      </Field>

      {kind === 'card' ? (
        <>
          <Field id="balance" label="Saldo actual" error={errors.balance} hint="Sin tus compras a meses sin intereses pendientes: regístralas aparte para no contarlas dos veces.">
            <input id="balance" value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" placeholder="0.00" className={fieldClass} {...invalid('balance')} />
          </Field>
          <Field id="limit" label="Límite de crédito (opcional)" error={errors.limit}>
            <input id="limit" value={limit} onChange={(e) => setLimit(e.target.value)} inputMode="decimal" placeholder="0.00" className={fieldClass} {...invalid('limit')} />
          </Field>
        </>
      ) : (
        <>
          <Field id="card" label="Tarjeta (opcional)" error={errors.card}>
            <input id="card" value={card} onChange={(e) => setCard(e.target.value)} autoComplete="off" className={fieldClass} {...invalid('card')} />
          </Field>
          <Field id="total" label="Monto total" error={errors.total}>
            <input id="total" value={total} onChange={(e) => setTotal(e.target.value)} inputMode="decimal" placeholder="0.00" className={fieldClass} {...invalid('total')} />
          </Field>
          <Field id="months" label="Meses" error={errors.months}>
            <input id="months" value={months} onChange={(e) => setMonths(e.target.value)} inputMode="numeric" placeholder="12" className={fieldClass} {...invalid('months')} />
          </Field>
          <Field id="balance" label="Saldo pendiente" error={errors.balance} hint={initial ? undefined : 'Déjalo vacío si es una compra nueva.'}>
            <input id="balance" value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" placeholder={total || '0.00'} className={fieldClass} {...invalid('balance')} />
          </Field>
        </>
      )}

      <Field id="nextDue" label="Próximo pago" error={errors.nextDue}>
        <input id="nextDue" type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} className={fieldClass} {...invalid('nextDue')} />
      </Field>

      <button type="submit" disabled={saving} className={primaryButtonClass}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}

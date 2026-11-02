import { useEffect, useState, type FormEvent } from 'react'
import { fieldClass } from '../lib/ui'
import { setPayFrequency } from '../money/api'
import type { PayFrequency } from '../money/calc'
import { DEFAULT_RATIO, setExpenseRatio, watchAlertSettings } from './api'

const frequencies: [PayFrequency, string][] = [['monthly', 'Mensual'], ['biweekly', 'Quincenal']]
const smallButton = 'min-h-11 rounded-xl px-3 text-sm font-medium'

export default function PreferencesCard({ uid, frequency }: { uid: string; frequency: PayFrequency }) {
  const [ratio, setRatio] = useState<number | null>()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  useEffect(() => watchAlertSettings(uid, (s) => setRatio(s.ratioPct)), [uid])

  async function run(action: Promise<unknown>) {
    setError('')
    try {
      await action
    } catch {
      setError('No se pudo guardar. Revisa tu conexión.')
    }
  }

  function save(e: FormEvent) {
    e.preventDefault()
    const pct = Number(draft)
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
      setError('Escribe un número entero entre 1 y 100.')
      document.getElementById('expense-ratio')?.focus()
      return
    }
    setEditing(false)
    run(setExpenseRatio(uid, pct))
  }

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-card">
      <h2 className="mb-4 font-display text-lg font-semibold">Preferencias</h2>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Cobro</legend>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-200/60 p-1">
          {frequencies.map(([value, label]) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="pay-frequency"
                value={value}
                checked={frequency === value}
                onChange={() => run(setPayFrequency(uid, value))}
                className="peer sr-only"
              />
              <span className="flex min-h-11 items-center justify-center rounded-xl text-sm font-medium text-zinc-600 transition-colors duration-150 peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                {label}
              </span>
            </label>
          ))}
        </div>
        {frequency === 'biweekly' && <p className="mt-1.5 text-sm text-zinc-500">Si solo ha llegado un sueldo en el mes, cuento con la segunda quincena.</p>}
      </fieldset>

      <div className="mt-5 border-t border-zinc-100 pt-4">
        {ratio === undefined ? (
          <p className="text-zinc-500">Cargando…</p>
        ) : editing ? (
          <form onSubmit={save} noValidate className="space-y-3">
            <label htmlFor="expense-ratio" className="block text-sm font-medium">Avisarme si gasto más del … % de mis ingresos</label>
            <input
              id="expense-ratio"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              inputMode="numeric"
              autoFocus
              className={fieldClass}
              aria-invalid={!!error}
              aria-describedby={error ? 'expense-ratio-error' : undefined}
            />
            {error && <p id="expense-ratio-error" className="text-sm text-red-700">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => (setEditing(false), setError(''))} className={`${smallButton} bg-zinc-100`}>
                Cancelar
              </button>
              <button type="submit" className={`${smallButton} bg-primary text-white`}>
                Guardar
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-sm">
              {ratio === null ? 'No te aviso si tus gastos pasan de un porcentaje de tus ingresos.' : `Avisarme si gasto más del ${ratio}% de mis ingresos.`}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ratio === null ? (
                <button type="button" onClick={() => run(setExpenseRatio(uid, DEFAULT_RATIO))} className={`${smallButton} bg-primary/10 text-primary`}>
                  Activar ({DEFAULT_RATIO}%)
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => (setDraft(String(ratio)), setEditing(true))} className={`${smallButton} bg-primary/10 text-primary`}>
                    Cambiar %
                  </button>
                  <button type="button" onClick={() => run(setExpenseRatio(uid, null))} className={`${smallButton} text-zinc-500 active:bg-zinc-100`}>
                    Desactivar
                  </button>
                </>
              )}
            </div>
            {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
          </>
        )}
      </div>
    </section>
  )
}

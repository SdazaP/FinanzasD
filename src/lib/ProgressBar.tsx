export default function ProgressBar({ value, label, onDark = false }: { value: number; label: string; onDark?: boolean }) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-2 overflow-hidden rounded-full ${onDark ? 'bg-white/25' : 'bg-zinc-100'}`}
    >
      <div className={`h-full rounded-full ${onDark ? 'bg-white' : 'bg-primary'}`} style={{ width: `${percent}%` }} />
    </div>
  )
}

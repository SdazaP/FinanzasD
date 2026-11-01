import { sections } from '../sections'

// Placeholder de una sección que todavía no tiene módulo
export default function SectionPage({ section }: { section: (typeof sections)[number] }) {
  return (
    <section className="rounded-3xl bg-white p-6 text-zinc-600 shadow-card">
      <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">{section.icon}</div>
      <p>{section.empty}</p>
    </section>
  )
}

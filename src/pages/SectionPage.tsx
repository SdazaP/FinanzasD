import { sections } from '../sections'

// Placeholder de cada sección hasta que su módulo la reemplace
export default function SectionPage({ section }: { section: (typeof sections)[number] }) {
  const isHome = section.path === '/'
  return (
    <section
      className={`rounded-3xl p-6 shadow-card ${isHome ? 'bg-primary text-white' : 'bg-white text-zinc-600'}`}
    >
      <div className={`mb-4 inline-flex rounded-2xl p-3 ${isHome ? 'bg-white/15' : 'bg-primary/10 text-primary'}`}>
        {section.icon}
      </div>
      <p className={isHome ? 'font-display text-lg font-medium leading-snug' : ''}>{section.empty}</p>
    </section>
  )
}

import { promptInstall, useCanInstall } from './pwa'

// Solo aparece cuando Chrome ofrece instalar y la app aún no está instalada
export default function InstallButton() {
  const canInstall = useCanInstall()
  if (!canInstall) return null
  return (
    <div className="mt-5 border-t border-zinc-100 pt-4">
      <p className="text-sm">Instala Finanzas para abrirla como app, con su ícono y sin conexión.</p>
      <button type="button" onClick={promptInstall} className="mt-2 min-h-11 rounded-xl bg-primary px-4 text-sm font-medium text-white active:scale-[0.97]">
        Instalar app
      </button>
    </div>
  )
}

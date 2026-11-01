# Tareas: month-context

(Las tareas anteriores están completas; ver historial de git.)

- [ ] 1. Formatos de mes y fecha larga
  - Acceptance: `formatMonthLabel('2026-11-01')` → "Noviembre 2026"; `formatLongDate('2026-11-01')` → "domingo, 1 de noviembre"; casos de diciembre y sábado.
  - Verify: `npm test`
  - Files: `src/lib/dates.ts`, `src/lib/dates.test.ts`

- [ ] 2. Hook `useToday`
  - Acceptance: devuelve `today()`; cambia al pasar la medianoche y al recibir `visibilitychange`/`focus`; limpia el timer y los listeners al desmontar.
  - Verify: `npm test`
  - Files: `src/lib/useToday.ts`, `src/lib/useToday.test.ts`

- [ ] 3. Encabezado y deploy
  - Acceptance: todas las secciones muestran la fecha en la línea del saludo y la píldora del mes; a 360 px no se desborda con un nombre largo; deploy con tu permiso.
  - Verify: `npm run lint && npm test && npm run build`; revisión en el panel y en tu celular.
  - Files: `src/layout/AppLayout.tsx`, `src/App.test.tsx`

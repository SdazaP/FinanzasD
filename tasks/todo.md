# Tareas: dashboard

(Las tareas de los módulos anteriores están completas; ver historial de git.)

- [x] 1. Cálculos de Inicio
  - Acceptance:
    - `monthRange('2026-02-10')` → `['2026-02-01', '2026-02-28']` (y 30/31 días).
    - `upcoming` incluye vencidos y hasta +7 días, excluye pausados y créditos en $0, y ordena por fecha mezclando tipos.
    - `monthCommitments` suma pagado (pagos hechos en el mes, `paidAt`) y pendiente (`nextDue` ≤ fin de mes, con monto, cuota MSI o saldo de tarjeta), sin doble conteo.
  - Verify: `npm test`
  - Files: `src/dashboard/calc.ts`, `src/dashboard/calc.test.ts`

- [x] 2. Pantalla de Inicio
  - Acceptance:
    - `watchMonthPayments` por elemento.
    - Tarjeta de compromisos con total, pagado, pendiente, barra y la nota de tarjetas.
    - Próximos pagos enlazados a su detalle.
    - Tres tarjetas de saldos enlazadas a su sección.
    - Metas en curso.
    - Estados de carga, error parcial y vacío.
    - `/` usa `Dashboard`.
  - Verify: `npm test && npm run build`; revisión en el panel con tus datos.
  - Files: `src/dashboard/api.ts`, `src/dashboard/Dashboard.tsx`, `src/dashboard/Dashboard.test.tsx`, `src/App.tsx`, `src/App.test.tsx`

- [x] 3. Revisión y deploy
  - Acceptance:
    - A 360 px, sin scroll horizontal con tus datos.
    - Los números coinciden con cada sección.
    - Deploy con tu permiso.
  - Verify: `npm run lint && npm test && npm run build`; prueba en tu celular.
  - Files: ajustes según la revisión

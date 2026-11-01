# Tareas: paid-status

(Las tareas anteriores están completas; ver historial de git.)

- [ ] 1. Regla `monthStatus`
  - Acceptance: `due` si `nextDue ≤ fin de mes` (incluye vencidos); `paid` si no y hay pago del periodo; `later` si no hay pago; casos de último día del mes y diciembre a enero.
  - Verify: `npm test`
  - Files: `src/lib/monthStatus.ts`, `src/lib/monthStatus.test.ts`

- [ ] 2. Pagos del periodo
  - Acceptance:
    - `src/lib/periodPayments.ts` con `watchMonthPayments` (movido de Inicio) y `watchPeriodPayments`, que devuelve `{ amount, lastPaidAt }` de los pagos con `dueDate` en el mes.
    - `usePeriodPayments(uid, col, ids, today)` devuelve un mapa por id y si ya cargó.
    - Inicio importa desde `src/lib`.
  - Verify: `npm test` (Inicio en verde).
  - Files: `src/lib/periodPayments.ts`, `src/lib/usePeriodPayments.ts`, `src/dashboard/api.ts` (se elimina), `src/dashboard/Dashboard.tsx`, `src/dashboard/Dashboard.test.tsx`, `src/App.test.tsx`

- [ ] 3. Gastos fijos por estado del mes
  - Acceptance:
    - Secciones Por pagar (con Pagar), Pagado este mes ("Pagado el …" y monto) y Más adelante ("Vence el …"), y Pausados al final.
    - Tras pagar, el elemento pasa a Pagado este mes.
  - Verify: `npm test`
  - Files: `src/recurring/RecurringList.tsx`, `src/recurring/RecurringList.test.tsx`

- [ ] 4. Créditos por estado del mes
  - Acceptance:
    - Las mismas tres secciones para tarjetas y MSI con saldo, y Liquidados al final.
    - Dos abonos del periodo se suman.
  - Verify: `npm test`
  - Files: `src/credits/CreditList.tsx`, `src/credits/CreditList.test.tsx`

- [ ] 5. Revisión y deploy
  - Acceptance: a 360 px con tus datos, sin desbordes; pagar algo lo mueve a Pagado este mes; deploy con tu permiso.
  - Verify: `npm run lint && npm test && npm run build`; prueba en tu celular.
  - Files: ajustes según la revisión

# Tareas: spending

(Las tareas anteriores están completas; ver historial de git.)

- [x] 1. Categorías compartidas
  - Acceptance: `src/lib/categories.ts` con `categoryError(name, existing)` y `mergeCategories(custom, defaults)`; gastos fijos las usa con sus defaults; sin cambios de comportamiento.
  - Verify: `npm test` (gastos fijos en verde).
  - Files: `src/lib/categories.ts`, `src/lib/categories.test.ts`, `src/recurring/categories.ts`, `src/recurring/categories.test.ts`, `src/recurring/useCategories.ts`, `src/recurring/RecurringForm.tsx`

- [x] 2. Cálculos de hormiga
  - Acceptance: `groupByDay` con "Hoy" / "Ayer" / fecha y subtotal; `totalsByCategory` de mayor a menor; `capSummary` sin tope, por debajo, exacto y excedido.
  - Verify: `npm test`
  - Files: `src/spending/calc.ts`, `src/spending/calc.test.ts`

- [x] 3. API y registro rápido
  - Acceptance:
    - `api.ts` con `watchMonthSpending` (rango del mes, orden cliente), `addSpending`, categorías propias y tope.
    - `QuickAdd`: monto (> 0), chips de categoría con "+ Nueva", nota opcional (≤ 80), fecha (hoy por defecto, no futura).
    - Al guardar se limpia y conserva la categoría; un solo guardado con doble toque.
  - Verify: `npm test`
  - Files: `src/spending/api.ts`, `src/spending/QuickAdd.tsx`, `src/spending/QuickAdd.test.tsx`, `src/spending/useSpendingCategories.ts`

- [x] 4. Pantalla de hormiga
  - Acceptance:
    - `/gastos-hormiga` con el selector Fijos | Hormiga (también en `/gastos-fijos`).
    - Título "Gastos hormiga" y "Gastos" activo en la barra.
    - Tarjeta del mes con total, cantidad, barra del tope y "Definir tope".
    - Lista por día con subtotales; resumen por categoría colapsable; estado vacío.
  - Verify: `npm test && npm run build`; registro en el panel y en tu celular.
  - Files: `src/spending/SpendingList.tsx`, `src/spending/SpendingList.test.tsx`, `src/layout/GastosTabs.tsx`, `src/recurring/RecurringList.tsx`, `src/App.tsx`, `src/sections.tsx`, `src/layout/AppLayout.tsx`

- [x] 5. Detalle
  - Acceptance: `/gastos-hormiga/:id` edita monto, categoría, nota y fecha, y elimina con confirmación; un id inexistente vuelve a la lista.
  - Verify: `npm test`
  - Files: `src/spending/SpendingDetail.tsx`, `src/spending/SpendingDetail.test.tsx`, `src/spending/api.ts`, `src/App.tsx`

- [x] 6. Inicio, reglas, revisión y deploy
  - Acceptance:
    - Fila "Gastos hormiga del mes" en Tus saldos.
    - Tests de reglas para `spending`, `spendingCategories` y `settings`.
    - Revisión a 360 px con 30 gastos, nota larga, sin tope y tope excedido.
    - Deploy con tu permiso.
  - Verify: `npm run lint && npm test && npm run test:rules && npm run build`; prueba en tu celular.
  - Files: `src/dashboard/Dashboard.tsx`, `src/dashboard/Dashboard.test.tsx`, `tests/rules/firestore.test.ts`

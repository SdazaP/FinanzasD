# Tareas: recurring

(Las 8 tareas de `core` están completas; ver historial de git.)

- [x] 1. Lógica de fechas y totales
  - Acceptance: `nextDueAfter('2026-01-31', 31)` → `'2026-02-28'`; `('2028-01-30', 30)` → `'2028-02-29'`; `('2026-12-15', 15)` → `'2027-01-15'`; `status` devuelve `overdue` / `soon` (hoy a +7 días) / `ok`; `monthlyTotal` suma solo activos; `today()` en hora local.
  - Verify: `npm test`
  - Files: `src/recurring/dates.ts`, `src/recurring/dates.test.ts`

- [x] 2. Formulario y categorías por defecto
  - Acceptance: campos nombre, tipo, categoría, monto, próximo pago; errores visibles por campo (nombre vacío o > 60, monto inválido o 0, fecha vacía); `onSubmit` recibe `amount` en centavos y `dayOfMonth` de la fecha; acepta valores iniciales para editar.
  - Verify: `npm test`
  - Files: `src/recurring/RecurringForm.tsx`, `src/recurring/RecurringForm.test.tsx`, `src/recurring/categories.ts`

- [x] 3. Guardar y listar en Firestore
  - Acceptance: `api.ts` con `watchRecurring` (onSnapshot) y `addRecurring`; rutas `/gastos-fijos` y `/gastos-fijos/nuevo`; lista ordenada por `nextDue`; estado vacío con botón "Agregar"; NavLink "Gastos" activo en subrutas y título por prefijo.
  - Verify: `npm test && npm run build`; alta manual en el panel y en tu celular.
  - Files: `src/recurring/api.ts`, `src/recurring/RecurringList.tsx`, `src/App.tsx`, `src/layout/AppLayout.tsx`, `src/sections.tsx`

- [x] 4. Pagar, estados y total
  - Acceptance: botón "Pagar" con `writeBatch` (pago + `nextDue` avanzado) y deshabilitado mientras guarda; etiquetas Vencido / Pronto; tarjeta morada con el total mensual; sección "Pausados".
  - Verify: `npm test`; pagar uno vencido en el panel avanza un mes y aparece en el historial.
  - Files: `src/recurring/api.ts`, `src/recurring/RecurringList.tsx`

- [x] 5. Detalle: editar, pausar, eliminar, historial
  - Acceptance: `/gastos-fijos/:id` con el formulario precargado; pausar/reactivar; eliminar con confirmación borrando sus pagos en el mismo batch; historial del más reciente al más antiguo con opción de borrar un pago; id inexistente vuelve a la lista.
  - Verify: `npm test && npm run build`; flujo completo en el panel a 360 px.
  - Files: `src/recurring/RecurringDetail.tsx`, `src/recurring/api.ts`, `src/App.tsx`

- [ ] 6. Categorías propias
  - Acceptance: opción "Nueva categoría…" en el select pide el nombre (1–30 caracteres, sin duplicar una existente ignorando mayúsculas) y la guarda en `users/{uid}/categories`; el select muestra por defecto + propias ordenadas.
  - Verify: `npm test`; crear una categoría y usarla en otro gasto.
  - Files: `src/recurring/categories.ts`, `src/recurring/RecurringForm.tsx`, `src/recurring/RecurringForm.test.tsx`, `src/recurring/api.ts`

- [ ] 7. Reglas, revisión visual y deploy
  - Acceptance: tests de reglas para `recurring/{id}/payments` y `categories`; revisión a 360 px con nombres largos, montos de 7 cifras y lista vacía (skill `break-ui`); deploy con tu permiso.
  - Verify: `npm run lint && npm test && npm run test:rules && npm run build`; prueba en tu celular.
  - Files: `tests/rules/firestore.test.ts`, ajustes de estilo según la revisión

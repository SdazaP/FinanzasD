# Tareas: savings

(Las tareas de `core`, `recurring` y `credits` están completas; ver historial de git.)

- [x] 1. Extraer `AmountAction`
  - Acceptance: componente con etiqueta, monto inicial, validación inyectada (`validate(cents) → mensaje`), `onConfirm(cents)`, "Confirmar" desactivado mientras guarda y "Cancelar"; créditos lo usa sin cambiar su comportamiento.
  - Verify: `npm test` (tests de créditos en verde).
  - Files: `src/lib/AmountAction.tsx`, `src/credits/CreditList.tsx`

- [x] 2. Cálculos de ahorro
  - Acceptance:
    - `monthsLeft('2026-10-31', '2026-12-15')` → 3; mismo mes → 1; fecha pasada → 0.
    - `goalSummary` da progreso (máx. 1), faltante, sugerencia redondeada hacia arriba y estado (`reached` / `overdue` / `on-track` / `no-target`).
    - `totalSaved` suma saldos.
    - `movementError` rechaza 0 y un retiro mayor al saldo.
  - Verify: `npm test`
  - Files: `src/savings/calc.ts`, `src/savings/calc.test.ts`

- [x] 3. Formulario de apartado
  - Acceptance:
    - Campos: nombre, saldo inicial (solo al crear), objetivo opcional (> 0) y fecha límite opcional.
    - La fecha límite solo se muestra si hay objetivo.
    - Errores por campo con foco en el primero.
    - `onSubmit` recibe centavos y omite los opcionales vacíos.
  - Verify: `npm test`
  - Files: `src/savings/SavingForm.tsx`, `src/savings/SavingForm.test.tsx`

- [x] 4. Guardar y listar en Firestore
  - Acceptance:
    - `api.ts` con `watchSavings` y `addSaving`. Si el saldo inicial es > 0, el alta crea también el movimiento "Saldo inicial" en el mismo batch.
    - Rutas `/ahorro` y `/ahorro/nuevo`.
    - Total ahorrado; por apartado, progreso, "Faltan", sugerencia y mensajes especiales.
    - Estado vacío.
  - Verify: `npm test && npm run build`; alta en el panel y en tu celular.
  - Files: `src/savings/api.ts`, `src/savings/SavingList.tsx`, `src/savings/SavingList.test.tsx`, `src/savings/SavingNew.tsx`, `src/App.tsx`

- [ ] 5. Aportar y retirar
  - Acceptance:
    - Botones "Aportar" y "Retirar" (este último solo si el saldo es > 0) con `AmountAction`.
    - Un batch guarda el movimiento y aplica `increment(±monto)`.
    - Un retiro mayor al saldo se rechaza.
  - Verify: `npm test`; aportar y retirar en el panel.
  - Files: `src/savings/api.ts`, `src/savings/SavingList.tsx`, `src/savings/SavingList.test.tsx`

- [ ] 6. Detalle
  - Acceptance:
    - `/ahorro/:id` con el formulario precargado, sin saldo inicial.
    - Historial con etiqueta Aporte/Retiro (y "Saldo inicial").
    - Borrar un movimiento revierte el saldo en un batch y se bloquea si lo dejaría negativo.
    - Eliminar con confirmación junto con sus movimientos.
    - Un id inexistente vuelve a la lista.
  - Verify: `npm test && npm run build`; flujo en el panel a 360 px.
  - Files: `src/savings/SavingDetail.tsx`, `src/savings/SavingDetail.test.tsx`, `src/savings/api.ts`, `src/App.tsx`

- [ ] 7. Reglas, revisión y deploy
  - Acceptance:
    - Tests de reglas para `savings` y `movements`.
    - Revisión a 360 px con nombre largo, saldo de 7 cifras, meta superada y lista vacía.
    - Deploy con tu permiso.
  - Verify: `npm run lint && npm test && npm run test:rules && npm run build`; prueba en tu celular.
  - Files: `tests/rules/firestore.test.ts`, ajustes según la revisión

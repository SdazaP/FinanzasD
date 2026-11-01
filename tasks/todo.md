# Tareas: credits

(Las tareas de `core` y `recurring` están completas; ver historial de git.)

- [x] 1. Mover `dates.ts` a `src/lib`
  - Acceptance: `src/lib/dates.ts` y su test; `recurring` importa de ahí; sin cambios de comportamiento.
  - Verify: `npm test` (40 tests en verde) y `npm run build`.
  - Files: `src/lib/dates.ts`, `src/lib/dates.test.ts`, `src/recurring/RecurringList.tsx`, `src/recurring/RecurringDetail.tsx`, `src/recurring/api.ts`

- [x] 2. Cálculos de crédito
  - Acceptance:
    - `installments(100000, 3)` → `[33333, 33333, 33334]`.
    - `msiSummary` da cuota, pagados, pagos restantes, fecha de término y progreso.
    - `debtTotal` suma saldos.
    - `paymentError(monto, saldo)` rechaza 0, negativo, inválido y mayor al saldo; acepta igual al saldo.
  - Verify: `npm test`
  - Files: `src/credits/calc.ts`, `src/credits/calc.test.ts`

- [x] 3. Formulario de crédito
  - Acceptance:
    - Selector de tipo, con nombre y próximo pago comunes.
    - **Tarjeta:** saldo (puede ser 0) y límite opcional (> 0 si se llena), con nota de doble conteo.
    - **MSI:** tarjeta opcional, total > 0, meses entre 2 y 48, y saldo pendiente (por defecto el total, ≤ total).
    - Errores visibles por campo y foco en el primero.
    - `onSubmit` recibe centavos y `dayOfMonth`, y acepta valores iniciales.
  - Verify: `npm test`
  - Files: `src/credits/CreditForm.tsx`, `src/credits/CreditForm.test.tsx`

- [x] 4. Guardar y listar en Firestore
  - Acceptance:
    - `api.ts` con `watchCredits` y `addCredit`.
    - Rutas `/creditos` y `/creditos/nuevo`.
    - Tarjeta morada con la deuda total.
    - Cada crédito muestra saldo, próximo pago y etiqueta. La tarjeta lleva barra de uso si tiene límite; el MSI, cuota, pagos restantes, fecha de término y barra de progreso.
    - Estado vacío.
  - Verify: `npm test && npm run build`; alta manual en el panel y en tu celular.
  - Files: `src/credits/api.ts`, `src/credits/CreditList.tsx`, `src/credits/CreditList.test.tsx`, `src/credits/CreditNew.tsx`, `src/App.tsx`

- [x] 5. Pagar y liquidados
  - Acceptance:
    - "Pagar" muestra el monto prellenado y editable con "Confirmar" / "Cancelar".
    - Valida con `paymentError`.
    - Un solo `writeBatch` guarda el pago, aplica `increment(-monto)` y avanza `nextDue`.
    - "Confirmar" se desactiva mientras guarda.
    - Los créditos con saldo 0 van a "Liquidados", sin botón de pagar.
  - Verify: `npm test`; pagar en el panel con monto editado.
  - Files: `src/credits/api.ts`, `src/credits/CreditList.tsx`, `src/credits/CreditList.test.tsx`

- [x] 6. Detalle
  - Acceptance:
    - `/creditos/:id` con el formulario precargado para editar.
    - Historial de pagos y borrar pago con confirmación.
    - Eliminar con confirmación junto con sus pagos.
    - Un id inexistente vuelve a la lista.
  - Verify: `npm test && npm run build`; flujo en el panel a 360 px.
  - Files: `src/credits/CreditDetail.tsx`, `src/credits/CreditDetail.test.tsx`, `src/credits/api.ts`, `src/App.tsx`

- [x] 7. Reglas, revisión y deploy
  - Acceptance:
    - Tests de reglas para `credits` y sus `payments`.
    - Revisión a 360 px con nombre largo, saldo de 7 cifras, MSI de 48 meses y lista vacía.
    - Deploy con tu permiso.
  - Verify: `npm run lint && npm test && npm run test:rules && npm run build`; prueba en tu celular.
  - Files: `tests/rules/firestore.test.ts`, ajustes según la revisión

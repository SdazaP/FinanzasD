# Tareas: credit-cards

(Las tareas anteriores están completas; ver historial de git.)

- [x] 1. Cálculo de uso y cargos a tarjeta
  - Acceptance:
    - `cardUsage` cubre: sin MSI, con MSI, sin límite, sobre el límite y deuda $0.
    - `applyCardCharge` sube o baja `credits/{id}.balance` con `increment` y omite tarjetas eliminadas.
    - Pagar un gasto fijo o registrar un gasto hormiga con `cardId` sube la deuda y no toca cuentas; borrar revierte.
    - Editar un gasto hormiga de tarjeta a cuenta (y al revés) corrige ambos; un registro nunca guarda `accountId` y `cardId` a la vez.
  - Verify: `npm test`
  - Files: `src/credits/calc.ts` (+ test), `src/lib/accountBalance.ts`, `src/recurring/api.ts`, `src/spending/api.ts`, `src/money/balanceWrites.test.ts`

- [x] 2. Selector "Desde" con tarjetas
  - Acceptance:
    - `useCards` devuelve las tarjetas y sus ids vivos.
    - `AccountPicker` con `cards` muestra el grupo "Tarjetas" ("BBVA Oro (crédito)").
    - Gastos fijos (Pagar) y gastos hormiga (registrar y editar) lo usan.
    - Ingresos, ahorro y créditos no muestran tarjetas.
  - Verify: `npm test`
  - Files: `src/credits/useCards.ts`, `src/money/AccountPicker.tsx` (+ test), `src/recurring/RecurringList.tsx`, `src/spending/SpendingForm.tsx`, `src/spending/SpendingList.tsx`, `src/spending/SpendingDetail.tsx` (+ tests)

- [x] 3. Tarjetas en Cuentas
  - Acceptance:
    - Sección "Tarjetas de crédito" con deuda, barra de uso, "Disponible $X de $Y" y fecha de pago; cada tarjeta abre su detalle.
    - Una tarjeta sin límite muestra "Agrega su límite".
    - "Agregar tarjeta" crea una tarjeta con el límite obligatorio; en Créditos, una tarjeta nueva también lo exige.
    - Sin tarjetas, la sección no aparece.
  - Verify: `npm test && npm run build`; revisión en el panel.
  - Files: `src/money/CardsSection.tsx` (+ test), `src/money/AccountsPage.tsx`, `src/credits/CreditForm.tsx` (+ test), `src/App.tsx`

- [x] 4. MSI ligados a tarjeta
  - Acceptance:
    - El formulario de MSI elige tarjeta de una lista (opcional); los MSI de antes conservan su texto.
    - El uso de la tarjeta suma lo que falta de sus MSI.
    - El detalle de la tarjeta lista sus MSI.
  - Verify: `npm test`
  - Files: `src/credits/CreditForm.tsx`, `src/credits/CreditList.tsx`, `src/credits/CreditDetail.tsx`, `src/money/CardsSection.tsx` (+ tests)

- [x] 5. Aviso de uso de tarjeta
  - Acceptance:
    - Desde el 90% del límite, aviso amarillo "{tarjeta}: usas el N% de tu límite"; por encima del límite, rojo. Lleva a Cuentas.
    - Al 89% no hay aviso; uno por tarjeta, con su propia clave para ocultarlo.
  - Verify: `npm test`
  - Files: `src/alerts/calc.ts`, `src/alerts/useAlerts.ts` (+ tests)

- [ ] 6. Revisión y deploy
  - Acceptance:
    - Revisión a 360 px con 3 tarjetas, una sobre el límite, nombres largos y montos de 7 cifras.
    - Mapa de capacidades: `credit-cards` en "Listo".
    - Deploy con tu permiso.
  - Verify: `npm run lint && npm test && npm run test:rules && npm run build`; prueba en tu celular.
  - Files: `CAPABILITY-MAP.md`

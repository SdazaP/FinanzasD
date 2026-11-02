# Tareas: monthly-payment

(Las tareas anteriores están completas; ver historial de git.)

- [x] 1. Lógica y API del pago por mes
  - Acceptance:
    - `periodLabel` da el mes en español a partir del `dueDate`, incluido diciembre → enero.
    - La cuota exigida de un MSI es la del mes (la última absorbe el redondeo, o el saldo si es menor).
    - `payCredit` rechaza un MSI con un monto distinto a la cuota, sin escribir nada; la tarjeta acepta de $0.01 al saldo.
  - Verify: `npm test`
  - Files: `src/credits/calc.ts`, `src/credits/calc.test.ts`, `src/credits/api.ts`, `src/money/balanceWrites.test.ts`

- [x] 2. Pagar con el mes en la lista
  - Acceptance:
    - MSI: "Pagar cuota de {mes}" muestra la cuota sin campo editable, con "Desde", y paga exactamente eso.
    - Tarjeta: "Pagar {mes}" con el monto editable, como hoy.
    - Un crédito atrasado muestra el mes más antiguo pendiente.
    - Gastos hormiga y el tope siguen igual (`AmountAction` compartido).
  - Verify: `npm test`
  - Files: `src/credits/CreditList.tsx`, `src/credits/CreditList.test.tsx`, `src/lib/AmountAction.tsx`

- [ ] 3. Historial con el mes, revisión y deploy
  - Acceptance:
    - El historial de créditos y de gastos fijos muestra "Noviembre 2026" y "Pagado el 1 nov"; el de ahorro no cambia.
    - Revisión a 360 px con "Pagar cuota de septiembre" y un nombre largo.
    - Mapa de capacidades: `monthly-payment` en "Listo".
    - Deploy con tu permiso.
  - Verify: `npm run lint && npm test && npm run build`; prueba en tu celular.
  - Files: `src/lib/PaymentHistory.tsx`, `src/lib/periodPayments.ts` o las APIs de pagos, `src/credits/CreditDetail.tsx`, `src/recurring/RecurringDetail.tsx` (+ tests), `CAPABILITY-MAP.md`

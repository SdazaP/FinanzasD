# Tareas: money

(Las tareas anteriores están completas; ver historial de git.)

- [x] 1. Cálculos de dinero
  - Acceptance:
    - `availableTotal` suma saldos (incluye negativos).
    - `leftThisMonth({ incomes, paid, spent, savedNet, pending })` aplica la fórmula.
    - `savingsNet(movements, mes)` = aportes − retiros del mes.
    - `accountActivity` une ingresos, pagos, gastos, ahorro y ajustes de una cuenta, con signo y ordenados por fecha.
  - Verify: `npm test`
  - Files: `src/money/calc.ts`, `src/money/calc.test.ts`

- [x] 2. API, cuentas y selector
  - Acceptance:
    - `api.ts`: `watchAccounts`, `addAccount` (la primera queda predeterminada), `updateAccount`, `deleteAccount`, `setDefaultAccount`, `adjustBalance` (ajuste + `increment` en batch), `addIncome` / `updateIncome` / `deleteIncome` (con `increment` y corrección entre cuentas), `watchMonthIncomes`.
    - `useAccounts` devuelve cuentas y predeterminada.
    - `AccountPicker` preselecciona la predeterminada y no se muestra sin cuentas.
  - Verify: `npm test`
  - Files: `src/money/api.ts`, `src/money/useAccounts.ts`, `src/money/AccountPicker.tsx`, `src/money/AccountPicker.test.tsx`

- [x] 3. Pantalla Cuentas
  - Acceptance:
    - `/cuentas` reemplaza a Inversiones en la barra (Inversiones sigue por URL).
    - Tarjeta con disponible total y te queda este mes; lista de cuentas con la predeterminada marcada; ingresos del mes con "Repetir".
    - `/cuentas/nueva` y formulario de ingreso con validación (monto > 0, fecha no futura, cuenta).
    - Estado sin cuentas que invita a crear la primera.
  - Verify: `npm test && npm run build`; crear cuentas e ingreso en el panel y en tu celular.
  - Files: `src/money/AccountsPage.tsx`, `src/money/AccountForm.tsx`, `src/money/IncomeForm.tsx` (+ tests), `src/sections.tsx`, `src/App.tsx`

- [x] 4. Detalle de cuenta
  - Acceptance:
    - `/cuentas/:id` para editar nombre y tipo, marcar como predeterminada, ajustar saldo y eliminar con confirmación.
    - Actividad del mes de esa cuenta; un id inexistente vuelve a la lista.
  - Verify: `npm test`
  - Files: `src/money/AccountDetail.tsx`, `src/money/AccountDetail.test.tsx`, `src/money/api.ts`

- [x] 5. Gastos fijos y créditos con cuenta
  - Acceptance:
    - Pagar muestra "desde {cuenta}" con selector, y el pago guarda `accountId` y resta de la cuenta en el mismo batch.
    - Borrar un pago con cuenta la devuelve.
    - Sin cuentas, todo igual que antes.
  - Verify: `npm test` (tests existentes en verde + nuevos).
  - Files: `src/recurring/api.ts`, `src/recurring/RecurringList.tsx`, `src/credits/api.ts`, `src/credits/CreditList.tsx` (+ tests)

- [x] 6. Ahorro y hormiga con cuenta
  - Acceptance:
    - Aportar resta y retirar suma a la cuenta elegida.
    - El gasto hormiga resta; editarlo corrige la cuenta anterior y la nueva; borrarlo devuelve.
    - Borrar un movimiento de ahorro revierte la cuenta.
    - Sin cuentas, todo igual.
  - Verify: `npm test`
  - Files: `src/savings/api.ts`, `src/savings/SavingList.tsx`, `src/spending/api.ts`, `src/spending/SpendingForm.tsx` (+ tests)

- [ ] 7. Inicio, reglas, revisión y deploy
  - Acceptance:
    - Inicio muestra Disponible y Te queda este mes enlazados a Cuentas.
    - Tests de reglas para `accounts`, `adjustments`, `incomes` y `settings/money`.
    - Revisión a 360 px con saldo negativo, nombres largos y 5 cuentas.
    - Deploy con tu permiso.
  - Verify: `npm run lint && npm test && npm run test:rules && npm run build`; prueba completa en tu celular.
  - Files: `src/dashboard/Dashboard.tsx`, `src/dashboard/Dashboard.test.tsx`, `tests/rules/firestore.test.ts`

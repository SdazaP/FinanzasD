# Tareas: alerts

(Las tareas anteriores están completas; ver historial de git.)

- [x] 1. Nueva fórmula de "te queda este mes"
  - Acceptance:
    - `leftThisMonth(available, pending)` = disponible − pendiente; se borra `savingsNet`.
    - `useMonthMoney` ya no se suscribe a los movimientos de ahorro.
    - `useMonthMoney` devuelve los ingresos del mes calendario (para Cuentas) y los de la ventana de 3 días (para avisos).
    - Frecuencia de cobro: `settings/money.payFrequency` (`watchPayFrequency`, `setPayFrequency`).
    - `expectedSecondHalf`: si el cobro es quincenal y solo llegó un "Sueldo" en el mes, devuelve el último "Sueldo"; si no, $0. Se suma a "te queda".
    - Inicio y Cuentas muestran el nuevo valor; Cuentas muestra la nota "incluye tu segunda quincena esperada ($X)".
  - Verify: `npm test`; en el panel, Inicio muestra disponible − pendiente con tus datos.
  - Files: `src/money/calc.ts`, `src/money/calc.test.ts`, `src/money/api.ts`, `src/money/useMonthMoney.ts`, `src/money/AccountsPage.tsx`, `src/dashboard/Dashboard.tsx`

- [x] 2. Lógica de avisos
  - Acceptance:
    - `incomeMonth` (ya en `money/calc.ts`, se reutiliza): un "Sueldo" del 28 de octubre cuenta para octubre; uno del 29 o 30 de octubre o del 2 de noviembre cuenta para noviembre; un "Extra" del 30 de octubre cuenta para octubre.
    - El aviso de % suma la segunda quincena esperada a los ingresos cuando el cobro es quincenal.
    - `buildAlerts` cubre los 4 avisos con sus límites (−1¢ / 0; tope al 79.9%, 80%, 100% y 120%; % por debajo, igual y por encima; sin ingresos; desactivado; sin cuentas) y los ordena rojo → amarillo.
    - `visibleAlerts` oculta solo en el mes guardado, y un aviso que pasa a rojo reaparece.
  - Verify: `npm test`
  - Files: `src/alerts/calc.ts`, `src/alerts/calc.test.ts`

- [ ] 3. Datos de avisos
  - Acceptance:
    - `api.ts`: `watchAlertSettings`, `setExpenseRatio` (1–100 o desactivado), `hideAlert`, `showAlert`.
    - `useAlerts(uid, now)` devuelve los avisos visibles y los ocultos.
    - Reglas: `settings/alerts` solo para el dueño.
  - Verify: `npm test && npm run test:rules`
  - Files: `src/alerts/api.ts`, `src/alerts/useAlerts.ts`, `tests/rules/firestore.test.ts`

- [ ] 4. Campana en la barra superior
  - Acceptance:
    - Campana junto al mes, con nombre accesible "Avisos, N activos".
    - Globo rojo o amarillo con el número; sin avisos, la campana va sin número.
    - El panel recibe el foco, se cierra con el botón de cerrar, con Escape o al tocar fuera, y devuelve el foco a la campana.
    - Cada aviso tiene ícono, la palabra "Urgente" o "Atención", un enlace a su pantalla y "Ocultar este mes".
    - "Mostrar ocultos (N)" los lista y permite volver a mostrarlos.
  - Verify: `npm test && npm run build`; en el panel a 360 px.
  - Files: `src/alerts/AlertBell.tsx`, `src/alerts/AlertBell.test.tsx`, `src/layout/AppLayout.tsx`

- [ ] 5. Aviso del tope y preferencias
  - Acceptance:
    - Gastos hormiga muestra bajo la barra el mismo texto del aviso del tope (80% amarillo, 100% o más rojo).
    - Cuentas tiene la tarjeta "Preferencias":
      - "Cobro" Mensual | Quincenal;
      - "Avisarme si gasto más del 50% de mis ingresos": cambiar el % (1–100, con validación) y desactivar.
    - Cambiar cualquiera de las dos actualiza "te queda este mes" y la campana al instante.
  - Verify: `npm test`
  - Files: `src/spending/SpendingList.tsx`, `src/alerts/PreferencesCard.tsx` (+ test), `src/money/AccountsPage.tsx`

- [ ] 6. Revisión y deploy
  - Acceptance:
    - Revisión a 360 px con globo de 2 dígitos y el panel con 4 avisos y montos grandes.
    - Mapa de capacidades: `alerts` en "Listo".
    - Deploy con tu permiso.
  - Verify: `npm run lint && npm test && npm run test:rules && npm run build`; prueba en tu celular.
  - Files: `CAPABILITY-MAP.md`

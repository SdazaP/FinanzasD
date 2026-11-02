# Plan: history

Implementa `SPEC-history.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Orden

1. **Gastos pasados sin mover saldos.**
   - `isPastMonth` (TDD).
   - `addSpending` y `updateSpending` ignoran la cuenta o tarjeta con fecha de un mes anterior.
   - `SpendingForm` oculta "Desde" y muestra el aviso.
   - Va primero porque es lo que protege tus saldos.
2. **Cálculo del calendario (TDD):**
   - `monthGrid` (semanas de domingo a sábado);
   - totales por día y resumen del mes (sin pagos de tarjeta, con MSI);
   - formato corto "$1.2k".
3. **Datos del mes:** `useMonthHistory` reúne gastos hormiga y pagos de fijos y créditos del mes elegido, con `watchMonthSpending` y `watchMonthPaymentDocs`, que ya existen.
4. **Pantalla Historial:**
   - pestaña y ruta `/gastos-historial`;
   - navegación de meses, total y desglose;
   - calendario y detalle del día;
   - estado vacío.
5. **Cierre:** revisión a 360 px en claro y oscuro, mapa de capacidades y deploy con tu permiso.

## Riesgos

- **Suscripciones:** el historial abre una suscripción por gasto fijo y por crédito en el mes elegido (como Inicio). Al cambiar de mes se cierran las anteriores. Para un solo usuario es aceptable.
- **Calendario a 360 px:** 7 columnas de unos 44 px; el monto corto debe caber. Se revisa en la tarea 5.

## Verificación

`npm run lint && npm test` en cada tarea; `npm run build` y revisión en el panel en la 4 y la 5.

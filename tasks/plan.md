# Plan: alerts

Implementa `SPEC-alerts.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Componentes y dependencias

```
nueva fórmula en money (calc + useMonthMoney) ─┐
alerts/calc.ts (puro: buildAlerts, incomeMonth) ┼─→ api + useAlerts ─┬─→ campana en la barra superior
                                                │                    └─→ aviso del tope en Gastos hormiga + % en Cuentas
                                                └──────────────────────────────────────→ reglas + revisión + deploy
```

## Orden

1. **Fórmula de money.**
   - `leftThisMonth(available, pending)` = disponible − pendiente.
   - `useMonthMoney` deja de suscribirse a los movimientos de ahorro (se borra `savingsNet`) y recibe el disponible.
   - Lee los ingresos desde 3 días antes del mes para la ventana del aviso de %; la lista de Cuentas sigue mostrando solo los del mes calendario.
   - Frecuencia de cobro en `settings/money` y la segunda quincena esperada, que se suma a "te queda" cuando el cobro es quincenal.
   - Va primero porque cambia lo que ya está publicado (Inicio y Cuentas).
2. **`alerts/calc.ts`** (TDD):
   - `incomeMonth(date)`: los últimos 3 días de un mes cuentan para el siguiente;
   - `buildAlerts(...)` → avisos ordenados con `key` (tipo + nivel), `level`, `text` y `href`;
   - `visibleAlerts(alerts, hidden, mes)`.
3. **Datos.**
   - `alerts/api.ts`: `settings/alerts` con el %, la opción de desactivar y los ocultos por mes.
   - `useAlerts(uid, now)` reúne cuentas, mes, gasto hormiga y tope.
   - Test de reglas para `settings/alerts`.
4. **Campana** en `AppLayout`: globo con el número, panel accesible (foco, Escape, tocar fuera), "Ocultar este mes" y "Mostrar ocultos".
5. **Pantallas.**
   - Texto del aviso del tope bajo la barra en Gastos hormiga.
   - Tarjeta "Preferencias" en Cuentas: cobro Mensual | Quincenal y "Avisarme si gasto más del 50%…".
6. **Cierre:** revisión a 360 px, mapa de capacidades y deploy con tu permiso.

## Riesgos

- **Suscripciones duplicadas.** La campana vive en la barra superior y carga los mismos datos que Inicio y Cuentas: unas 6 suscripciones más. Para un solo usuario es aceptable. Si se nota, se mueven a un contexto compartido.
- **Cambio de una cifra publicada.** "Te queda este mes" cambia de valor en Inicio y Cuentas. La tarea 1 actualiza sus tests y se revisa en el panel con tus datos.
- **Panel en el celular.** Debe caber a 360 px y no quedar detrás de la barra inferior. Se revisa en la tarea 6.

## Verificación entre tareas

`npm run lint && npm test` en cada tarea; `npm run test:rules` en la 3; `npm run build` y revisión en el panel en la 4 y la 6.

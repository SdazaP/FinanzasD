# Plan: paid-status

Implementa `SPEC-paid-status.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Orden

1. `monthStatus` puro (TDD).
2. Mover `watchMonthPayments` a `src/lib/periodPayments.ts`, agregar `watchPeriodPayments` (por `dueDate`) y el hook `usePeriodPayments`. Inicio sigue en verde.
3. Gastos fijos agrupados en Por pagar, Pagado este mes y Más adelante.
4. Créditos agrupados igual.
5. Revisión a 360 px con tus datos y deploy.

Las tareas 3 y 4 son independientes una vez hecha la 2.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Un elemento parpadea entre secciones mientras cargan los pagos del mes | No mostrar "Más adelante" ni "Pagado" hasta que llegue la consulta de ese elemento; mientras, se queda en su grupo por `nextDue` |
| Romper Inicio al mover `watchMonthPayments` | Tarea separada y tests de Inicio como red |
| Pago de un periodo atrasado tomado como pago del mes | Se usa `dueDate` del pago (periodo), con un test específico |
| Muchas suscripciones | Igual que en Inicio, aceptable con decenas; `shortcut:` ya documentado |

## Acciones que te pido antes de hacer

Cada `git push` y cada deploy.

# Plan: month-context

Implementa `SPEC-month-context.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Orden

1. Formatos `formatMonthLabel` y `formatLongDate` en `src/lib/dates.ts` (TDD).
2. Hook `useToday`, que se actualiza a medianoche y al volver al primer plano (TDD con timers simulados).
3. Encabezado de `AppLayout` con la fecha en la línea del saludo y la píldora del mes; revisión a 360 px; deploy.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Timer de medianoche que se pierde con la pantalla bloqueada (el navegador congela timers) | También recalcular en `visibilitychange` y `focus` |
| Encabezado que se desborda con nombre largo | `truncate` en la línea del saludo y píldora con `shrink-0` |
| Fuga de timers o listeners al desmontar | Limpiar en el `return` del efecto; test |

## Acciones que te pido antes de hacer

Cada `git push` y cada deploy.

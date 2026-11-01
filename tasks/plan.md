# Plan: credits

Implementa `SPEC-credits.md`. Tareas en `tasks/todo.md`. (Los planes de `core` y `recurring` están completos; quedan en el historial de git.)

## Componentes y dependencias

```
mover dates.ts a src/lib ─┐
                          ├─→ api + lista + alta ─→ pagar (monto editable) + liquidados ─→ detalle ─→ reglas, revisión y deploy
calc.ts (puro) ───────────┤
CreditForm ───────────────┘
```

## Orden

1. Mover `src/recurring/dates.ts` a `src/lib/dates.ts` y actualizar imports; `recurring` debe seguir en verde.
2. `calc.ts`: cuota, resumen de MSI, deuda total y validación del pago (TDD).
3. `CreditForm` con los dos tipos y su validación (TDD).
4. Capa `api.ts`, rutas, lista con deuda total, progreso y pagos restantes, y alta. Es el primer corte vertical que guarda en Firestore real.
5. Pagar con monto editable en la tarjeta, validación y sección "Liquidados".
6. Detalle: editar, historial, borrar pago y eliminar.
7. Tests de reglas, revisión a 360 px con datos extremos y deploy.

Las tareas 1, 2 y 3 no dependen entre sí.

## Checkpoints

- Tras 4: registras una tarjeta y una compra a MSI desde el celular.
- Tras 6: flujo completo revisado en el panel a 360 px.
- Tras 7: deploy y prueba en tu celular.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Saldo negativo por pagar de más o por dos toques | Validar monto ≤ saldo y desactivar "Confirmar" mientras guarda |
| Saldo desactualizado si pagas desde dos pestañas a la vez | `increment(-monto)` en lugar de escribir el saldo calculado en el cliente |
| Doble conteo tarjeta + MSI | Nota bajo el campo de saldo de la tarjeta (spec, pregunta 1) |
| Romper `recurring` al mover `dates.ts` | Tarea separada con su propio commit y los 40 tests como red |
| Redondeo de cuotas | La última cuota absorbe la diferencia; probado con $1,000 / 3 |

## Acciones que te pido antes de hacer

Dependencias (no prevemos ninguna), cambios de reglas (no previstos), cada `git push`, cada deploy.

# Plan: savings

Implementa `SPEC-savings.md`. Tareas en `tasks/todo.md`. (Los planes de `core`, `recurring` y `credits` están completos; quedan en el historial de git.)

## Componentes y dependencias

```
AmountAction (extraído de credits) ─┐
calc.ts (puro) ─────────────────────┼─→ api + lista + alta ─→ aportar / retirar ─→ detalle (historial que revierte) ─→ reglas, revisión y deploy
SavingForm ─────────────────────────┘
```

## Orden

1. Extraer `AmountAction` de `credits/CreditList.tsx` a `src/lib`; créditos sigue en verde.
2. `calc.ts`: meses restantes, resumen de meta, total y validación del movimiento (TDD).
3. `SavingForm` con objetivo y fecha opcionales (TDD).
4. Capa `api.ts` (alta con movimiento "Saldo inicial"), rutas y lista con total, progreso y sugerencia.
5. Aportar y retirar con `AmountAction`.
6. Detalle: editar, historial con borrado que revierte el saldo y eliminar.
7. Tests de reglas, revisión a 360 px con datos extremos y deploy.

Las tareas 1, 2 y 3 no dependen entre sí.

## Checkpoints

- Tras 4: creas un apartado con meta desde el celular.
- Tras 6: flujo completo revisado en el panel.
- Tras 7: deploy y prueba en tu celular.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Saldo negativo por retiro o por borrar un aporte | Validar en cliente con el saldo actual; borrar movimiento usa `increment` inverso y se bloquea si dejaría el saldo < 0 |
| Sugerencia mal calculada en cambio de año | Tests con oct → ene del año siguiente |
| Romper créditos al extraer `AmountAction` | Tarea separada, con sus tests como red |

## Acciones que te pido antes de hacer

Dependencias (no prevemos ninguna), cambios de reglas (no previstos), cada `git push`, cada deploy.

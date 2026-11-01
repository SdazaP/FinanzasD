# Plan: dashboard

Implementa `SPEC-dashboard.md`. Tareas en `tasks/todo.md`. (Los planes de los módulos anteriores están completos; quedan en el historial de git. `investments` está pospuesto.)

## Componentes y dependencias

```
calc.ts (puro, reutiliza cálculos de recurring / credits / savings) ─┐
api.ts (pagos del mes por elemento) ─────────────────────────────────┼─→ Dashboard en "/" ─→ revisión y deploy
watchers existentes (recurring, credits, savings) ───────────────────┘
```

## Orden

1. `calc.ts`: rango del mes, próximos pagos y compromisos del mes (TDD).
2. `api.ts` + `Dashboard.tsx`: secciones, estados de carga, error y vacío, y enlaces. Reemplaza el placeholder de `/`.
3. Revisión a 360 px con tus datos y deploy.

## Checkpoints

- Tras 2: revisas Inicio en el panel con tus datos reales.
- Tras 3: deploy y prueba en tu celular.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Doble conteo: algo pagado este mes también aparece como pendiente | Pendiente usa `nextDue` (que ya avanzó al pagar); test específico |
| Muchas suscripciones a Firestore (una por elemento) | Aceptable con decenas de elementos; `shortcut:` en el código si crece |
| Mes con fechas de fin de mes (28–31) | Tests de `monthRange` |
| El placeholder de Inicio y su test dejan de existir | Actualizar `App.test.tsx` y `SectionPage` |

## Acciones que te pido antes de hacer

Dependencias (no prevemos ninguna), cambios de reglas o índices (no previstos), cada `git push`, cada deploy.

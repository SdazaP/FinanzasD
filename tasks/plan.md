# Plan: spending

Implementa `SPEC-spending.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Orden

1. Mover `categoryError` y `mergeCategories` a `src/lib/categories.ts` (con defaults por parámetro); gastos fijos sigue en verde.
2. `spending/calc.ts`: agrupado por día, totales por categoría, resumen del tope (TDD).
3. `spending/api.ts` y el registro rápido `QuickAdd` con chips de categoría (TDD).
4. Pantalla `/gastos-hormiga`: selector Fijos | Hormiga, tarjeta del mes con tope, lista por día y resumen por categoría. Primer corte vertical con Firestore real.
5. Detalle para editar y eliminar.
6. Fila de hormiga en Inicio, tests de reglas, revisión a 360 px y deploy.

Las tareas 1, 2 y 3 no dependen entre sí, salvo que 3 usa 1.

## Checkpoints

- Tras 4: registras gastos desde el celular y ves el total y el tope.
- Tras 6: deploy y prueba en tu celular.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Romper gastos fijos al mover las categorías | Tarea separada y sus tests como red |
| Orden entre gastos del mismo día sin índice compuesto | Consulta por rango de `date` y orden por `createdAt` en el cliente; test |
| Doble registro por doble toque al guardar | Botón desactivado mientras guarda; test |
| `serverTimestamp` pendiente al ordenar recién guardado | Leer con `serverTimestamps: 'estimate'` |
| Fecha futura por zona horaria | Comparar strings `YYYY-MM-DD` con `useToday` |

## Acciones que te pido antes de hacer

Dependencias (no prevemos), índices o cambios de reglas (no previstos), cada `git push`, cada deploy.

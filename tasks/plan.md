# Plan: charts

Implementa `SPEC-charts.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Orden

1. **Datos y cálculos:**
   - `HistoryEntry` gana `category` (hormiga y fijos con la suya, créditos "Créditos", planeados "Planeados");
   - `useSpendingMonths(uid, today)` trae todos los gastos de los últimos 6 meses con las mismas fuentes que el Historial, en un solo rango;
   - `charts/calc.ts`: `byCategory` (top 4 + Otros con %), `monthTotals` (6 meses; null si no hay datos) y `compareText`.

   Va primero porque las dos gráficas dependen de esto y es lo que más se presta a errores (sumas y meses). Todo lleva pruebas unitarias.
2. **Dona por categoría:**
   - tokens `--color-chart-1…4` en claro y oscuro;
   - `CategoryDonut` con SVG, el centro, la leyenda, resaltar al tocar o con el teclado, el estado vacío, el esqueleto y la tabla oculta;
   - colocada en Inicio.
3. **Barras de 6 meses:** `MonthBars` con un eje, líneas guía tenues, la etiqueta flotante en el mes actual que se mueve con hover o foco, la comparación en texto, los meses sin datos, el esqueleto y la tabla oculta. Va al lado de la dona desde 1024 px.
4. **Cierre:**
   - revisión en el panel a 360, 768, 1024 y 1440 px, en claro y oscuro;
   - la lista de addy;
   - las capturas de taste;
   - el detector de impeccable;
   - el mapa de capacidades;
   - el deploy con tu permiso.

Antes de cada componente se cargan el contexto de impeccable y su craft-floor, taste (pantallas de app), addy (frontend-ui-engineering) y dataviz (marcas e interacción).

## Riesgos

- **Suscripciones:** las 6 lecturas por mes del Historial se harían 6 veces más. Se usa una sola suscripción por fuente con un rango de 6 meses, no una por mes.
- **Categorías repetidas** entre fijos y hormiga ("Suscripción" está en las dos): se suman por nombre exacto.
- **Inicio en el celular** se hace más largo: las gráficas van después de "Este mes" y antes de "Próximos pagos". Si se siente pesado, te lo muestro antes de seguir.
- **Dona con un solo segmento:** el arco de 360° se dibuja como círculo, porque un arco SVG completo no se pinta.

## Verificación

`npm run lint && npm test && npm run build` en cada tarea, y revisión en el panel en los anchos que toca cada una.

# Plan: theme

Implementa `SPEC-theme.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Orden

1. **Base del tema:**
   - `src/lib/theme.ts` lee y guarda la elección, la aplica a `<html>` y a `theme-color`, y sigue al sistema en "Sistema";
   - `index.css`: los colores oscuros aplican con `data-theme="dark"`, o en "Sistema" cuando el dispositivo está en oscuro;
   - `index.html`: un script en línea aplica el tema antes de pintar.

   Va primero porque el botón solo llama a `setTheme`. Se prueba cambiando `localStorage` a mano y recargando.
2. **Botón y menú:**
   - `ThemeMenu` con el ícono del tema actual y el menú de tres opciones (teclado, Escape, tocar fuera);
   - colocado en el encabezado del celular y en la barra lateral de escritorio;
   - revisar que el título de Gastos no se corte a 360 px.
3. **Cierre:**
   - revisión en el panel a 360, 768 y 1440 px, con el sistema en claro y en oscuro;
   - recargar sin destello;
   - mapa de capacidades;
   - deploy con tu permiso.

Antes de cada cambio de interfaz se aplican las reglas de impeccable (craft-floor), taste y addy (frontend-ui-engineering).

## Riesgos

- **Destello al abrir:** si el tema se aplicara desde React, se vería el otro tema un instante. Por eso va un script en línea en `index.html`.
- **Colores duplicados en CSS:** evitado. `data-theme` siempre lleva el tema efectivo, así que el bloque oscuro aparece una sola vez.
- **Encabezado en el celular:** son cuatro íconos en Gastos. Se revisa a 360 px, y si no cabe, te lo muestro antes de seguir.
- **CSP:** el script en línea no se bloquea porque hoy no hay `Content-Security-Policy`. Si se agrega después, hay que permitirlo.

## Verificación

`npm run lint && npm test && npm run build` en cada tarea, y revisión en el panel en los anchos que toca cada una.

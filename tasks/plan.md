# Plan: desktop

Implementa `SPEC-desktop.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Orden

1. **Estructura:**
   - `AppLayout` con el mismo `<nav>` como barra inferior en el celular y barra lateral desde 768 px;
   - encabezado con saludo y título grande;
   - ancho máximo del contenido;
   - `AlertsPanel` compartido por la campana y la columna fija desde 1280 px.

   Va primero porque todas las pantallas viven dentro.
2. **Inicio y Cuentas:** cuadrícula de 3 y de 2 columnas.
3. **Gastos:** Gastos fijos (2 columnas), Gastos hormiga (formulario | lista) e Historial (calendario | día).
4. **Créditos, Ahorro, detalles y formularios nuevos:** cuadrículas de 2 columnas; detalle con el formulario | historial; formularios centrados de hasta 560 px.
5. **Cierre:**
   - revisión en el panel a 360, 768, 1024, 1280 y 1440 px, en claro y oscuro;
   - detector de impeccable;
   - mapa de capacidades;
   - deploy con tu permiso.

Antes de cada cambio de interfaz se aplican las reglas de calidad de impeccable (craft-floor), la skill de taste (design-taste-frontend) y la de addy (frontend-ui-engineering).

## Riesgos

- **Celular:** que algo cambie sin querer a 360 px. Todo se agrega con `md:`, `lg:` y `xl:`, y en cada tarea se revisa 360 px.
- **Menú duplicado:** dos menús en el DOM romperían los tests y la accesibilidad. Es un solo `<nav>` con clases según el ancho.
- **Formularios estirados:** se limitan a 560 px.

## Verificación

`npm run lint && npm test && npm run build` en cada tarea y revisión en el panel en los anchos que toca cada una.

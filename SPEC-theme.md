# Spec: theme (elegir modo claro, oscuro o el del sistema)

**Estado:** aprobado.

## Objetivo

Hoy la app usa siempre el modo del teléfono o de la computadora. Con este cambio eliges el tema desde un ícono en el encabezado:

- **Sistema:** sigue al dispositivo, como ahora; es la opción por defecto.
- **Claro:** siempre claro.
- **Oscuro:** siempre oscuro.

La elección se guarda solo en ese dispositivo y aplica al instante, sin parpadeo al abrir y sin conexión.

## Criterios de aceptación

1. **Botón de tema** en el encabezado:
   - En el celular es tu foto, con el ícono del tema encima: con un ícono más, el título de Gastos se cortaba a 360 px (decidido contigo).
   - En escritorio va en la barra lateral, junto a tu nombre. El panel de avisos no cambia.
   - Su ícono muestra el tema elegido (sol, luna o monitor). Su nombre accesible es "Tema: Sistema", "Tema: Claro" o "Tema: Oscuro".
2. **Menú de opciones:** al tocar el botón se abre un menú pequeño con las tres opciones, que se elige con dedo o teclado.
   - La opción actual va marcada.
   - El menú se cierra al elegir, con Escape o al tocar fuera.
3. **Cambio inmediato:** al elegir, toda la app cambia de colores al momento, sin recargar.
   - En "Sistema", si cambias el modo del dispositivo con la app abierta, la app lo sigue.
4. **Recuerda la elección** en ese dispositivo (`localStorage`), también en la app instalada y sin conexión.
   - Al abrir no hay destello del otro tema: el tema se aplica antes de pintar la página.
5. **Barra del sistema:** la barra de estado de Android (`theme-color`) toma el color del tema elegido, no el del sistema.
   - Los controles nativos (fecha, selects, scroll) usan el tema elegido mediante `color-scheme`.
6. **Celular a 360 px:** el título del encabezado no se corta, ni en Gastos (historial, campana y foto-tema).
7. **Sin cambios** en los colores de cada tema, en los datos ni en las reglas.
   - Si `localStorage` no está disponible (modo privado), la app usa "Sistema" y no falla.

Fuera de alcance:
- guardar el tema en tu cuenta para todos tus dispositivos;
- programar el tema por horario;
- otros temas o colores de acento.

## Commands

```
Tests:  npm test · npm run lint · npm run build
Prueba: panel a 360, 768 y 1440 px; elegir cada opción y recargar; Android instalado
Deploy: git push a main (Vercel), con tu permiso
```

## Project Structure

```
index.html              → script en línea, antes de pintar: lee la elección y pone data-theme
                          en <html>; quita el media de los theme-color
src/index.css           → los colores oscuros aplican con data-theme="dark", o con "Sistema"
                          cuando el dispositivo está en oscuro; color-scheme según el tema
src/lib/theme.ts (+test)→ leer/guardar la elección, aplicarla a <html> y a theme-color,
                          y seguir al sistema en "Sistema"
src/layout/ThemeMenu.tsx→ botón con ícono y el menú de tres opciones
src/layout/AppLayout.tsx→ ThemeMenu en el encabezado (celular) y en la barra lateral (escritorio)
```

## Code Style

Un solo atributo en `<html>` decide el tema, y las clases de Tailwind no cambian:

```css
:root[data-theme='dark'] { /* colores oscuros, una sola vez */ }
/* data-theme siempre lleva el tema efectivo: en "Sistema" lo resuelve theme.ts según el dispositivo */
```

```ts
export type Theme = 'system' | 'light' | 'dark'
setTheme('dark') // guarda, pone data-theme y actualiza theme-color
```

## Testing Strategy

- **Unit (`theme.test.ts`):**
  - lee y guarda la elección;
  - un valor inválido o un `localStorage` que falla da "system";
  - `applyTheme` pone o quita `data-theme` y cambia `theme-color`.
- **Componente (`ThemeMenu`):**
  - el botón anuncia el tema actual;
  - el menú marca la opción elegida;
  - elegir "Oscuro" pone `data-theme="dark"` y lo guarda;
  - Escape cierra el menú.
- **Regresión:** los 246 tests siguen en verde; lint y build pasan.
- **En el panel:**
  - las tres opciones en claro y en oscuro del sistema, a 360, 768 y 1440 px;
  - recargar sin destello;
  - el título de Gastos no se corta a 360 px.
- **En tu Android:** elegir un tema distinto al del teléfono, cerrar y abrir la app instalada; la barra de estado coincide.

## Boundaries

- **Always:**
  - "Sistema" por defecto;
  - el tema se aplica antes de pintar;
  - el botón y el menú funcionan con teclado y lector de pantalla.
- **Ask first:**
  - guardar el tema en Firestore;
  - mover el botón a otro lugar;
  - agregar dependencias.
- **Never:**
  - duplicar las clases con variantes `dark:` en cada pantalla;
  - cambiar los colores de los temas sin preguntarte.

## Open Questions

Ninguna. Si a 360 px el título de Gastos no cabe con cuatro íconos, propongo achicar el título y te lo muestro antes de seguir.

# Spec: desktop

Versión para tablet y escritorio, con el mismo estilo de la app (ver `CAPABILITY-MAP.md`, iteración 5). Depende de `core` (layout) y toca la presentación de todas las pantallas. No toca datos ni lógica.

**Estado:** aprobado.

## Objetivo

Hoy la app está pensada para el celular: en una pantalla grande se ve como una columna angosta de 576 px al centro. Esta versión aprovecha el espacio:
- la navegación queda siempre a la vista;
- las tarjetas se reparten en columnas;
- los avisos se ven sin abrir la campana.

Todo con el mismo lenguaje visual que ya tiene la app:
- el morado #6C5DD3 y el amarillo #FFCE73;
- Poppins en títulos e Inter en el texto;
- tarjetas blancas muy redondeadas con sombra suave;
- la tarjeta morada protagonista y el modo oscuro.

**Referencia:** el kit "Unity" que mandaste, del que tomamos:
- la barra lateral izquierda con el logo, íconos con nombre y el activo en una pastilla morada;
- el saludo pequeño sobre un título grande;
- la tarjeta morada arriba;
- la cuadrícula de tarjetas;
- el panel de notificaciones a la derecha.

**No copiamos** las ilustraciones 3D ni el contenido de la referencia, solo la estructura y el ritmo.

**Modo de diseño (impeccable):** *Operate*, una herramienta de uso diario. Importan más la lectura rápida, la consistencia y los patrones que ya conoces que el efecto. La marca vive en los detalles: el morado, los radios y las cifras grandes.

## Decisiones (tus respuestas)

1. **Navegación:** barra lateral con el logo, cada sección con ícono y nombre, y tu foto abajo. En tablet se reduce a solo íconos y en el celular sigue la barra inferior de hoy.
2. **Avisos:** en pantallas de 1280 px o más, panel fijo a la derecha. En pantallas más angostas siguen en la campana.
3. **Contenido:** cada pantalla reparte sus tarjetas en 2 o 3 columnas.

## Criterios de aceptación

### Tamaños de pantalla

| Ancho | Navegación | Contenido | Avisos |
|---|---|---|---|
| < 768 px (celular) | Barra inferior (sin cambios) | Una columna (sin cambios) | Campana |
| 768–1023 px (tablet) | Barra lateral de solo íconos, 80 px, con el nombre en un tooltip | 1–2 columnas | Campana |
| 1024–1279 px (laptop) | Barra lateral con nombres, 240 px | 2–3 columnas, hasta 1100 px de ancho | Campana |
| ≥ 1280 px (escritorio) | Barra lateral con nombres | 2–3 columnas | Panel fijo a la derecha, 320 px; sin campana |

- El contenido nunca se estira más de 1100 px. En pantallas enormes queda centrado en su columna.
- El celular (360–767 px) se ve **exactamente como hoy**.

### Estructura general (escritorio)

1. **Barra lateral:**
   - **Arriba:** el logo (`icon.svg`) con "FinanzasD".
   - **En medio:** Inicio, Gastos, Créditos, Ahorro y Cuentas, cada uno con ícono y nombre. El activo va en una pastilla morada con texto blanco, como en la referencia; los demás se marcan al pasar el mouse.
   - **Abajo:** tu foto y tu nombre.
   - Es fija mientras haces scroll.
2. **Encabezado:**
   - **A la izquierda:**
     - "Hola, {nombre} · martes, 3 de noviembre" en pequeño;
     - el título de la sección grande (32 px).
   - **A la derecha:**
     - la píldora del mes;
     - el ícono de historial (en Gastos);
     - la campana (hasta 1279 px).
   - La foto pasa a la barra lateral.
3. **Barra inferior:** desaparece desde 768 px. Es **el mismo menú**, acomodado distinto según el ancho, no uno nuevo.
4. **Avisos sin conexión y de versión nueva:** se mantienen, ubicados dentro de la columna de contenido.

### Pantallas (≥ 1024 px)

- **Inicio:**
  - **Fila 1:** la tarjeta morada "Este mes" a lo ancho de 2 columnas y, a su lado, Disponible y Te queda este mes.
  - **Fila 2:** Próximos pagos, Tus saldos y Metas de ahorro, en 3 columnas.
- **Gastos fijos, Créditos y Ahorro:** la tarjeta del total y sus botones arriba; las tarjetas de cada elemento en una cuadrícula de 2 columnas, separadas por sección (Por pagar, Pagado este mes, etc.).
- **Gastos hormiga:**
  - **Columna izquierda:** la tarjeta del mes y "Registrar gasto".
  - **Columna derecha:** la lista por día. Registras y ves el resultado sin hacer scroll.
- **Historial:** el calendario ocupa 2/3 del ancho y el detalle del día 1/3. Al tocar un día, el detalle cambia al lado, sin bajar.
- **Cuentas:**
  - **Fila 1:** el disponible y los botones.
  - **Columna izquierda:** Tus cuentas y Tarjetas de crédito.
  - **Columna derecha:** Ingresos del mes y Preferencias.
- **Detalles** (un gasto fijo, crédito, apartado, cuenta o gasto hormiga): el formulario a la izquierda; el historial, "Gastar" y "Eliminar" a la derecha.
- **Formularios nuevos** (Agregar gasto, crédito, tarjeta, cuenta, apartado, Planear gasto): una tarjeta centrada de hasta 560 px. Un formulario no se estira a lo ancho.

### Calidad

- **Mouse:** las tarjetas que son enlace se elevan apenas al pasar el mouse, solo en dispositivos con mouse (`@media (hover: hover)`). Nada depende del hover para funcionar.
- **Teclado:**
  - todo se usa con Tab y Enter;
  - el foco se ve con un anillo morado;
  - el menú lateral mantiene `aria-current`.
- **Modo oscuro:** igual de cuidado en todas las pantallas nuevas.
- **Movimiento:** solo transiciones de color y elevación de 150 ms, respetando `prefers-reduced-motion`.
- **Sin cambios** en datos, reglas, cálculos ni textos.

Fuera de alcance:
- atajos de teclado;
- arrastrar y soltar;
- tablas con muchas columnas;
- gráficas nuevas;
- menú contextual;
- buscador (la referencia tiene uno, pero la app no tiene qué buscar todavía).

## Commands

```
Dev:     npm run dev          (revisar en el panel a 360, 768, 1024, 1280 y 1440 px, claro y oscuro)
Tests:   npm test · npm run lint · npm run build
Diseño:  impeccable detect --json <archivos cambiados> al terminar
Deploy:  git push a main (Vercel), con tu permiso
```

## Project Structure

```
src/layout/AppLayout.tsx    → contenedor responsive: barra lateral / barra inferior, encabezado, columna de avisos
src/layout/Sidebar...       → (dentro de AppLayout) el mismo <nav> con estilos por ancho; logo y perfil
src/alerts/AlertsPanel.tsx  → lista de avisos compartida por la campana y la columna fija
src/alerts/AlertBell.tsx    → usa AlertsPanel; se oculta desde 1280 px
src/index.css               → utilidades de hover y foco, y el ancho máximo
Pantallas (solo clases de Tailwind, sin cambiar la lógica):
  dashboard/Dashboard.tsx, recurring/*, spending/*, history/HistoryPage.tsx,
  credits/*, savings/*, money/*
```

## Code Style

**Mobile first:** las clases de hoy son el celular, y encima se agregan `md:`, `lg:` y `xl:`. Ninguna pantalla cambia su JSX salvo para envolver columnas.

```tsx
// Inicio en escritorio: dos columnas para la tarjeta morada, una para el dinero
<div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0">
  <section className="... lg:col-span-2">Este mes</section>
  <Money />
</div>
```

## Testing Strategy

- **Unit / componentes:**
  - **Menú:** se renderiza una sola vez y conserva `aria-current`, así que los tests actuales siguen valiendo.
  - **`AlertsPanel`:** la campana y la columna fija muestran los mismos avisos; "Ocultar este mes" funciona desde la columna.
  - **Perfil:** la barra lateral muestra tu nombre y tu foto.
- **Regresión:** los 245 tests siguen en verde. Los tests de jsdom no ven el CSS, así que el layout se verifica en el panel.
- **Visual, en el panel**, a 360, 768, 1024, 1280 y 1440 px, en claro y oscuro, con tus datos reales:
  - Inicio, Gastos fijos, Gastos hormiga, Historial, Créditos, Ahorro y Cuentas;
  - un detalle y un formulario nuevo;
  - sin scroll horizontal y sin textos cortados;
  - a 360 px, igual que hoy.
- **Diseño:** el detector de impeccable sin hallazgos en los archivos tocados.

## Boundaries

- **Always:**
  - mobile first;
  - un solo menú en el DOM;
  - nada depende del hover;
  - foco visible;
  - modo oscuro;
  - el celular igual que hoy.
- **Ask first:**
  - nuevas dependencias;
  - cambiar textos o la arquitectura de navegación;
  - quitar algo de alguna pantalla;
  - agregar el buscador.
- **Never:**
  - estirar el contenido a todo lo ancho en pantallas grandes;
  - duplicar pantallas para escritorio;
  - cambiar datos o cálculos;
  - copiar las ilustraciones 3D de la referencia.

## Success Criteria

1. En la laptop abro la app y veo la barra lateral, el saludo y, en Inicio, la tarjeta morada y mis datos en columnas, sin una columna angosta al centro.
2. A 1440 px los avisos se ven a la derecha sin abrir nada.
3. En el celular nada cambió.
4. Lint, tests y build pasan, y el detector de diseño queda limpio.

## Open Questions

Ninguna.

# Spec: charts (gastos por categoría y tendencia de 6 meses en Inicio)

**Estado:** aprobado.

## Objetivo

Que Inicio conteste dos preguntas que los números solos no contestan:

1. **¿En qué se me va el dinero este mes?** Una dona por categoría.
2. **¿Este mes voy mejor o peor que antes?** Barras de los últimos 6 meses.

El estilo toma como referencia el kit Unity: la dona "Earnings By Item" con el total al centro, y las barras redondeadas con una etiqueta flotante sobre la barra activa. Usa los colores, las tarjetas y el modo oscuro de la app.

## Qué cuenta como gasto

Lo mismo que el Historial:
- gastos hormiga;
- pagos de gastos fijos;
- pagos de créditos (MSI y tarjetas);
- gastos planeados que ya gastaste.

No cuentan los ingresos, los aportes a ahorro ni los pagos que aún no hiciste.

## Criterios de aceptación

### Dona "En qué se fue" (mes actual)

1. **Agrupación:**
   - Los gastos hormiga van por su categoría (Comida, Café…) y los fijos por la suya (Renta, Servicios…). Si se llaman igual, se suman.
   - Los pagos de créditos van juntos en "Créditos" y los gastos planeados en "Planeados".
2. **Segmentos:** las 4 categorías más grandes, cada una con su color, y el resto junto en "Otros", en gris. Los colores siguen el orden de tamaño del mes.
3. **Centro:** el total gastado en el mes, con "Gastado" debajo.
4. **Leyenda bajo la dona:** una fila por segmento con un punto de color, el nombre, el monto y el %. El color nunca es la única pista, porque cada fila lleva su nombre escrito.
5. **Al tocar o pasar el cursor** sobre un segmento o una fila, ese segmento se resalta y los demás se atenúan. El centro muestra su nombre y su monto.
6. **Sin gastos en el mes:** un anillo gris vacío y el texto "Aún no registras gastos este mes."

### Barras "Últimos 6 meses"

7. **Barras:** una por mes, del más antiguo al actual, con el total gastado. El mes actual va en el morado de la app y los anteriores en morado suave. Debajo, la etiqueta del mes ("jun", "jul"…).
8. **Eje:** un solo eje con 3 o 4 líneas guía tenues y montos compactos ($5k, $10k), como el calendario. No hay segundo eje.
9. **Etiqueta flotante** con el monto ("$12.3k") sobre la barra del mes actual. Al tocar o pasar el cursor por otra barra, la etiqueta pasa a esa.
10. **Comparación en texto** sobre la gráfica, según el caso:
    - "Vas $1,240 por debajo del mes pasado";
    - "…por encima…";
    - "Igual que el mes pasado".

    Si no hay mes pasado con gastos, no se muestra.
11. **Meses sin datos** (antes de que empezaras a usar la app): no tienen barra y su etiqueta va atenuada. Sus barras no son de $0.

### En las dos

12. **Ubicación:** en Inicio, debajo de "Este mes".
    - En el celular van una debajo de otra.
    - Desde 1024 px van lado a lado, en la cuadrícula de 6 columnas: 3 columnas cada una.
13. **Accesibilidad:** cada gráfica tiene un título visible y una tabla oculta para lectores de pantalla con los mismos datos. Las barras y los segmentos se pueden recorrer con el teclado y anuncian su valor.
14. **Modo oscuro:** cada modo tiene sus propios colores, ya validados (abajo), así que no es una inversión automática.
15. **Carga y datos:**
    - Mientras cargan, cada tarjeta muestra un esqueleto tenue del tamaño final, para que nada salte.
    - Los datos se actualizan solos al registrar un gasto, como el resto de Inicio.
16. **Sin cambios** en los datos ni en las reglas, y sin dependencias nuevas.

Fuera de alcance:
- elegir el rango de meses;
- filtros;
- otras gráficas, como la proyección del saldo o la deuda;
- exportar.

## Colores (validados con el validador de dataviz)

En el orden de los segmentos de la dona. "Otros" va siempre en gris (`zinc-300` en claro, `zinc-400` en oscuro).

| Lugar | Claro (sobre `#ffffff`) | Oscuro (sobre `#1c1e25`) |
|---|---|---|
| 1 | `#6c5dd3` | `#7d6fe6` |
| 2 | `#ec7aa5` | `#cc6690` |
| 3 | `#d9962b` | `#c08425` |
| 4 | `#2f9bc0` | `#3a9cc4` |

Resultado del validador:
- **Claro:** todo pasa. El rosa y el ámbar tienen poco contraste con la tarjeta (2.5:1), lo que obliga a etiquetas visibles. La leyenda con nombre y monto ya lo cubre.
- **Oscuro:** pasan los cinco checks, incluido el de colorblind (ΔE ≥ 12.6).

## Skills de diseño

- **impeccable:**
  - Antes de escribir cada componente se cargan el contexto y las reglas de calidad (craft-floor).
  - Al terminar, se corre su detector sobre los archivos nuevos.
  - Es una pantalla de uso diario (modo Operate): precisión y claridad antes que efectos.
- **taste (design-taste-frontend), en su modo de pantallas de app:**
  - nada de degradados, brillos, colores arcoíris ni números de adorno;
  - una idea clara por gráfica;
  - se revisan capturas a tres anchos y se corrige lo que se vea mal.
- **addy (frontend-ui-engineering):**
  - accesibilidad WCAG AA: teclado, nombres, tabla y contraste;
  - estados de carga, vacío y error;
  - responsive a 320, 768, 1024 y 1440 px;
  - componentes chicos, con el cálculo separado del dibujo.
- **dataviz:**
  - forma de cada gráfica, grosor de marcas, 2 px de separación entre segmentos y barras, un solo eje y tooltip al pasar el cursor;
  - los colores ya pasaron su validador.

## Commands

```
Tests:  npm test · npm run lint · npm run build
Prueba: panel a 360, 1024 y 1440 px, claro y oscuro; mes con y sin gastos
Deploy: git push a main (Vercel), con tu permiso
```

## Project Structure

```
src/charts/calc.ts (+test)      → byCategory(entries): top 4 + Otros con %; monthTotals(entries, meses);
                                   comparación con el mes pasado
src/charts/useSpendingMonths.ts → todos los gastos de los últimos 6 meses (mismas fuentes que el
                                   Historial, en un solo rango de fechas por suscripción)
src/charts/CategoryDonut.tsx    → dona SVG + leyenda + tabla oculta
src/charts/MonthBars.tsx        → barras SVG + etiqueta flotante + tabla oculta
src/history/                    → HistoryEntry gana `category` para agrupar fijos y hormiga
src/dashboard/Dashboard.tsx     → las dos tarjetas bajo "Este mes"
src/index.css                   → tokens --color-chart-1…4 (claro y oscuro)
```

## Code Style

Cálculos puros y probados; los componentes solo dibujan. El SVG usa tokens de color, no hex sueltos:

```ts
const slices = byCategory(entries) // [{ name: 'Comida', amount: 482000, pct: 0.38, color: 1 }, …, { name: 'Otros', … }]
```

```tsx
<path d={arc(slice)} className="fill-chart-1" />  // los colores cambian solos con el tema
```

## Testing Strategy

- **Unit (`charts/calc.test.ts`):**
  - agrupar hormiga y fijos con el mismo nombre de categoría;
  - créditos y planeados en su grupo;
  - top 4 más "Otros" y porcentajes que suman 100;
  - total de cada mes;
  - meses sin datos;
  - texto de la comparación (abajo, arriba, igual, sin mes pasado).
- **Componentes:**
  - la dona muestra el total y una fila por segmento;
  - el estado vacío;
  - las barras ponen la etiqueta en el mes actual y la cambian con foco o hover;
  - las tablas ocultas tienen los datos.
- **Regresión:** las 254 pruebas siguen en verde; lint y build pasan.
- **En el panel:**
  - Inicio a 360, 1024 y 1440 px, en claro y oscuro;
  - la dona con 1, 3 y más de 5 categorías;
  - las barras con meses vacíos;
  - el detector de impeccable;
  - la lista de verificación de addy (teclado, lector de pantalla, 320–1440 px, estados);
  - la revisión de capturas de taste.

## Boundaries

- **Always:**
  - montos en centavos y `formatMXN`;
  - un solo eje;
  - leyenda con nombres;
  - tabla para lectores de pantalla;
  - colores por token.
- **Ask first:**
  - agregar una librería de gráficas;
  - cambiar qué cuenta como gasto;
  - mover las gráficas de Inicio.
- **Never:**
  - más de 5 colores en la dona;
  - una barra de $0 para meses sin datos;
  - texto pintado del color de la serie.

## Open Questions

Ninguna. Cargar 6 meses abre una suscripción por gasto fijo y por crédito, igual que el Historial, pero con un rango de fechas más amplio. Si llegas a tener decenas, lo optimizo guardando el mes en cada pago.

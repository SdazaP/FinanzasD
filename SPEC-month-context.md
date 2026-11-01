# Spec: month-context

Mes en curso y fecha de hoy visibles en todas las secciones (ver `CAPABILITY-MAP.md`, iteración 2). Depende de `core`.

## Objetivo

En cualquier pantalla quiero saber en qué mes estoy y qué día es hoy, porque "por pagar", "pagado este mes" y los totales del mes dependen de eso.

Criterios de aceptación:

1. El encabezado de todas las secciones (Inicio, Gastos, Créditos, Ahorro, Inversiones y sus subpantallas) muestra:
   - una etiqueta con el **mes en curso**, p. ej. "Noviembre 2026";
   - la **fecha de hoy** completa, p. ej. "domingo, 1 de noviembre".
2. El formato es `es-MX`, con hora local del dispositivo y la primera letra del mes en mayúscula.
3. Si la app sigue abierta al cambiar el día (medianoche) o vuelve al primer plano otro día, el encabezado se actualiza sin recargar.
4. No ocupa más de una línea extra a 360 px y no desplaza el título.
5. La pantalla de login y la de acceso no autorizado no lo muestran.

Fuera de alcance: elegir otro mes para ver datos pasados o futuros (navegar entre meses) y zona horaria distinta a la del dispositivo.

## Diseño

Encabezado actual:

```
Hola, Sebastian
Resumen                      [foto]
```

Nuevo:

```
Hola, Sebastian · domingo, 1 de noviembre
Resumen          [Noviembre 2026] [foto]
```

- La fecha se agrega al saludo, en la misma línea y con el mismo estilo gris pequeño. **Ajuste tras la revisión a 360 px:** ahí "Hola, Sebastian · domingo, 1 de noviembre" no cabe junto a la píldora y la fecha quedaba en "d…". La fecha va en su propia línea a todo el ancho, sobre el título; en celular muestra solo la fecha ("Domingo, 1 de noviembre") y el saludo se agrega desde 640 px. Para que "Gastos fijos" quepa junto a la píldora más larga ("Septiembre 2026"), en celular el título baja a 24 px y la foto se oculta (vuelve desde 640 px).
- El mes va como una píldora (`bg-primary/10 text-primary`) a la izquierda de la foto, alineada con el título.
- Si el saludo y la fecha no caben a 360 px, la línea se trunca con "…". El título no se mueve.

## Estructura

```
src/lib/dates.ts          → formatMonthLabel(date) 'Noviembre 2026', formatLongDate(date) 'domingo, 1 de noviembre'
src/lib/dates.test.ts     → casos de formato
src/lib/useToday.ts       → hook: devuelve today() y se actualiza a medianoche y al volver a primer plano
src/lib/useToday.test.ts
src/layout/AppLayout.tsx  → muestra ambos en el encabezado
```

`useToday` también queda disponible para que los módulos siguientes (`paid-status`, `spending`, `money`) calculen "este mes" con el mismo día.

## Testing Strategy

- **Unit:** formato del mes y de la fecha larga (inicio y fin de año, mes con acento: "Diciembre", "sábado").
- **Hook:** con fecha simulada en 23:59:30, el valor cambia al día siguiente al pasar la medianoche, y se recalcula en `visibilitychange`.
- **Layout:** el encabezado muestra mes y fecha con la fecha simulada.
- **Revisión a 360 px:** con nombre largo en el saludo.

## Boundaries

- **Always:** hora local; `Intl.DateTimeFormat('es-MX')`; limpiar el timer y el listener al desmontar.
- **Ask first:** dependencias de fechas (no hacen falta).
- **Never:** usar `new Date('YYYY-MM-DD')` (se interpreta en UTC).

## Success Criteria

1. En el celular, cada sección muestra "Noviembre 2026" y "domingo, 1 de noviembre" (o la fecha real del día).
2. Si dejas la app abierta a medianoche, al día siguiente la fecha ya cambió.
3. Lint, tests y build pasan.

## Open Questions

Ninguna.

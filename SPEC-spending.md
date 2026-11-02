# Spec: spending

Gastos discrecionales u hormiga (ver `CAPABILITY-MAP.md`, iteración 2). Depende de `core` y `month-context`; reutiliza categorías, formularios y fechas de `recurring` y `src/lib`.

## Objetivo

Registrar rápido los gastos chicos y variables del mes (café, antojos, salidas, apps) y ver cuánto llevo gastado en ellos este mes, comparado con un tope opcional. Solo es un registro: no hay botón "Pagar" ni fechas de vencimiento.

## Criterios de aceptación

1. **Dónde vive.** Dentro de la sección **Gastos**, con un selector arriba: **Fijos | Hormiga**.
   - "Fijos" es la pantalla actual (`/gastos-fijos`) y "Hormiga" la nueva (`/gastos-hormiga`).
   - La barra inferior marca "Gastos" en ambas.
   - El título del encabezado cambia: "Gastos fijos" o "Gastos hormiga".
2. **Registro rápido.** Arriba de la lista hay un formulario corto, pensado para usar con una mano:
   - **monto** (obligatorio, > $0, teclado decimal);
   - **categoría** con chips de un toque: lista fija (Comida, Café, Antojos, Salidas, Transporte, Compras, Otros) más las propias, y una opción "+ Nueva" igual que en gastos fijos;
   - **nota** opcional (máx. 80 caracteres), p. ej. "Oxxo";
   - **fecha**: hoy por defecto, editable, nunca futura.
   - Al guardar, el formulario se limpia, conserva la categoría elegida y el gasto aparece en la lista.
3. **Tarjeta del mes** (morada):
   - total gastado en hormiga en el mes en curso y cuántos gastos son;
   - si hay **tope mensual**: barra de avance, "Te quedan $X" o "Te pasaste por $X";
   - un enlace para definir o cambiar el tope (monto > $0, o vacío para quitarlo).
4. **Lista del mes.**
   - Los gastos del mes en curso, agrupados por día ("Hoy", "Ayer", "jueves 29 oct"), del más reciente al más antiguo.
   - Cada fila muestra categoría, nota y monto, y lleva a su detalle.
   - Cada día muestra su subtotal.
5. **Por categoría.** Un resumen colapsable con el total del mes por categoría, de mayor a menor.
6. **Detalle.** `/gastos-hormiga/:id` para editar o eliminar (con confirmación). Un id inexistente regresa a la lista.
7. **Inicio.** "Tus saldos" agrega la fila **Gastos hormiga del mes**, enlazada a `/gastos-hormiga`.

Fuera de alcance:
- ver meses anteriores;
- restar de una cuenta (lo hará `money`);
- avisos al acercarse al tope (lo hará `alerts`; aquí solo se ve la barra);
- fotos de tickets;
- gastos repetidos automáticos.

## Modelo de datos

```
users/{uid}/spending/{id}
  amount: number       // centavos > 0
  date: string         // 'YYYY-MM-DD', ≤ hoy
  category: string
  note?: string        // 1–80
  createdAt: Timestamp

users/{uid}/spendingCategories/{id}
  name: string         // categorías propias de hormiga (separadas de las de gastos fijos)

users/{uid}/settings/spending
  monthlyCap?: number  // centavos > 0
```

- La lista lee solo el mes en curso: consulta con `date` entre el primer y el último día del mes, ordenada por `date` desc y `createdAt` desc.
- Ese orden por dos campos **requiere un índice compuesto** (`date` desc + `createdAt` desc) en `firestore.indexes.json`, que se despliega con las reglas. Alternativa sin índice: ordenar solo por `date` y desempatar en el cliente. **Propuesta: la alternativa**, para no agregar índices.

## Estructura

```
src/lib/categories.ts        → categoryError y mergeCategories(custom, defaults), movidos desde recurring y generalizados
src/spending/
  calc.ts, calc.test.ts      → groupByDay, totalsByCategory, capSummary (avance, restante, excedido)
  api.ts                     → watchMonthSpending, addSpending, updateSpending, deleteSpending, watch/addCategory, watch/setCap
  QuickAdd.tsx, QuickAdd.test.tsx
  SpendingList.tsx, SpendingList.test.tsx
  SpendingDetail.tsx, SpendingDetail.test.tsx
src/layout/GastosTabs.tsx    → selector Fijos | Hormiga, usado por las dos pantallas
```

Cambios en código existente:
- `recurring/categories.ts` pasa a usar `src/lib/categories.ts`;
- `sections.tsx` y `AppLayout` resuelven el título y el estado activo para `/gastos-hormiga`;
- `Dashboard` suma la fila de hormiga.

## Testing Strategy

- **Unit (`calc.test.ts`):**
  - agrupado por día con "Hoy" y "Ayer";
  - subtotal por día;
  - totales por categoría ordenados;
  - tope: sin tope, por debajo, exacto y excedido.
- **Componentes:**
  - el registro rápido valida monto y nota, rechaza fechas futuras, conserva la categoría tras guardar y guarda una sola vez con doble toque;
  - la lista muestra total, tope y grupos;
  - el detalle edita y elimina con confirmación.
  - **Regresión:** gastos fijos sigue igual tras mover las categorías.
- **Reglas:** agregar `spending`, `spendingCategories` y `settings` a los tests.
- **Revisión a 360 px:** con 30 gastos en el mes, nota larga, sin tope y con tope excedido.

## Boundaries

- **Always:** centavos; fecha local; validar antes de escribir; confirmar antes de eliminar.
- **Ask first:** índices compuestos (por eso la propuesta evita uno); cambios de reglas (no hacen falta: `users/{uid}/**` ya cubre las colecciones nuevas).
- **Never:** botón "Pagar" en hormiga; mezclar las categorías de hormiga con las de gastos fijos.

## Success Criteria

1. Desde el celular registro un gasto hormiga en menos de 10 segundos (monto, chip, guardar).
2. El total del mes y la barra del tope se actualizan al instante.
3. Inicio muestra el total de hormiga del mes.
4. Lint, tests, tests de reglas y build pasan; gastos fijos sigue igual.

## Open Questions

1. **Ubicación:** ¿te parece bien que Hormiga viva dentro de Gastos con el selector Fijos | Hormiga? La alternativa sería reemplazar en la barra inferior la pestaña de Inversiones, que está pospuesta. Propuesta: el selector, porque deja Inversiones en su lugar para cuando la retomemos.
2. **Lista fija de categorías:** Comida, Café, Antojos, Salidas, Transporte, Compras, Otros. ¿Agregarías o quitarías alguna?

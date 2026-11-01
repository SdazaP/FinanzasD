# Spec: dashboard

Pantalla de Inicio (ver `CAPABILITY-MAP.md`). Depende de `recurring`, `credits` y `savings`. `investments` está pospuesto y no aparece aquí.

## Objetivo

Al abrir la app, ver de un vistazo qué tengo que pagar pronto, cuánto me toca pagar este mes y cuánto llevo, cómo están mis saldos y cuánto ahorrar para mis metas. Inicio es de solo lectura: cada elemento enlaza a su sección y los pagos se hacen ahí.

Historias y criterios de aceptación:

1. **Compromisos del mes** (tarjeta morada, arriba). Muestra:
   - **Total del mes** = pagado este mes + pendiente este mes;
   - **Pagado este mes** = suma de los pagos de gastos fijos y créditos **hechos** en el mes actual (`paidAt`). Se usa la fecha de pago y no el periodo para que pagar algo vencido del mes anterior sume a lo pagado al salir de lo pendiente;
   - **Pendiente** = suma de lo que vence hasta fin de mes, incluyendo lo vencido. Cuenta:
     - **gasto fijo activo:** su monto;
     - **MSI:** la cuota sugerida;
     - **tarjeta:** su saldo.
   - una barra de progreso con pagado ÷ total.
2. **Próximos pagos.** Una sola lista con los gastos fijos activos y los créditos con saldo que vencen en **7 días o menos**, más los **vencidos**, ordenada por fecha.
   - Cada fila muestra nombre, tipo (Gasto fijo / Suscripción / Tarjeta / MSI), fecha, monto y la etiqueta Vencido o Pronto.
   - Tocar una fila abre su detalle (`/gastos-fijos/:id` o `/creditos/:id`).
   - Sin pagos próximos: "Nada vence en los próximos 7 días."
3. **Resumen de saldos.** Tres tarjetas enlazadas a su sección:
   - gastos fijos al mes;
   - deuda total;
   - total ahorrado.
4. **Metas de ahorro.** Los apartados con objetivo que no han llegado a la meta, cada uno con su progreso, y la sugerencia mensual si tiene fecha. Tocar uno abre su detalle. Sin metas: se oculta la sección.
5. **Estados.**
   - Mientras carga, un texto "Cargando…".
   - Si falla una fuente, aviso visible sin romper las demás.
   - Si todo está vacío, una invitación a agregar el primer gasto, crédito o apartado.

Fuera de alcance: pagar desde Inicio, gráficas históricas, inversiones, comparación entre meses, notificaciones.

## Datos

Reutiliza los watchers existentes: `watchRecurring`, `watchCredits` y `watchSavings`.

Para "pagado este mes" se agrega una lectura por elemento:

- consulta `payments` de cada gasto fijo y de cada crédito con `paidAt` desde el inicio del mes hasta el inicio del siguiente;
- son N suscripciones pequeñas, una por elemento, aceptable para uso personal (decenas de elementos);
- no requiere índices compuestos ni cambios en las reglas: la regla actual de `users/{uid}/**` ya cubre la lectura.

La lógica es pura y vive en `src/dashboard/calc.ts`:

- `monthRange(today)` → primer y último día del mes;
- `upcoming(recurring, credits, today)` → lista unificada y ordenada de próximos pagos;
- `monthCommitments(recurring, credits, paidThisMonth, today)` → `{ paid, pending, total }`.

## Estructura

```
src/dashboard/
  calc.ts, calc.test.ts
  api.ts            → watchMonthPayments(uid, collection, id, desde, hasta, onData)
  Dashboard.tsx     → reemplaza el placeholder de "/"
  Dashboard.test.tsx
```

## Testing Strategy

- **Unit (`calc.test.ts`):**
  - rango del mes con meses de 28, 30 y 31 días;
  - `upcoming`: incluye vencidos y hasta +7 días, excluye pausados y créditos en $0, ordena por fecha y mezcla los tipos;
  - `monthCommitments`: suma por tipo, pendiente con vencidos, y algo ya pagado este mes que no vuelve a contar como pendiente porque su `nextDue` ya avanzó.
- **Componente (`Dashboard.test.tsx`, con la API simulada):**
  - muestra el total, lo pagado y lo pendiente;
  - la lista de próximos con enlaces correctos;
  - las tres tarjetas de saldos con su total;
  - las metas en curso;
  - los estados vacíos.
- **Revisión a 360 px:** con los datos reales y con todo vacío.

## Boundaries

- **Always:** solo lectura; reutilizar los cálculos de cada módulo (`msiSummary`, `goalSummary`, `monthlyTotal`, `debtTotal`, `totalSaved`, `status`); centavos.
- **Ask first:** cambios de reglas o índices (no previstos); nuevas dependencias.
- **Never:** escribir datos desde Inicio; duplicar lógica que ya existe en otro módulo.

## Success Criteria

1. Abro la app y veo el total del mes, cuánto llevo pagado y cuánto falta, y los números coinciden con mis secciones.
2. Los pagos de los próximos 7 días y los vencidos aparecen juntos, ordenados por fecha, y llevan a su detalle.
3. Al pagar algo en su sección, Inicio se actualiza sola: sube lo pagado, baja lo pendiente y el pago sale de "Próximos".
4. Lint, tests y build pasan.

## Open Questions

1. **Tarjetas en el pendiente:** contar el saldo completo de la tarjeta como pendiente del mes puede inflar el total si no planeas liquidarla. Propuesta: contarlo completo (es lo que pagarías para no generar intereses) y mostrar la nota "Tarjetas: saldo completo" bajo el total.

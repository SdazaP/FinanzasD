# Spec: planned

Gastos planeados en Ahorro (ver `CAPABILITY-MAP.md`, iteración 4). Depende de `savings`, `spending` y `history`.

**Estado:** pendiente de tu aprobación. Aún no hay código.

## Objetivo

Planear un gasto futuro, por ejemplo "Lentes, $3,000, marzo 2027", para:
- juntar el dinero poco a poco, sabiendo cuánto apartar cada mes;
- verlo en el calendario en su fecha;
- cuando llegue el momento, registrarlo como gasto pagado con lo ahorrado, sin descuadrar tus cuentas.

## Decisiones

1. **Un gasto planeado es un apartado de Ahorro** con marca de "planeado". Así reutiliza todo lo que ya existe:
   - los aportes y retiros desde una cuenta;
   - la barra de avance;
   - "Ahorra $X al mes", calculado con la fecha del gasto.
2. **"Gastar" no toca tus cuentas.** El dinero ya salió de tu cuenta cuando lo aportaste al apartado. Gastar solo vacía el apartado y deja el gasto en tu historial.
3. **Los gastos planeados no van a Gastos hormiga** (no cuentan para su total ni su tope). Se ven en Ahorro y en el calendario del historial.

## Criterios de aceptación

1. **Planear un gasto** (Ahorro → "Planear gasto"):
   - qué es (1–60 caracteres), monto (> $0), fecha (de hoy en adelante), categoría (las de gastos hormiga) y, opcional, lo que ya tienes apartado;
   - se guarda como apartado con `target` = monto, `deadline` = fecha, `planned: true` y `category`.
2. **En Ahorro**, nueva sección "Gastos planeados", arriba de los apartados, ordenada por fecha. Cada uno muestra:
   - nombre, monto y fecha ("Lentes · $3,000 · 15 mar 2027");
   - barra de avance y "Ahorra $X al mes", o "Ya tienes todo", o "La fecha ya pasó";
   - se abre en su detalle, con aportes, retiros y edición, igual que cualquier apartado.
   - Lo apartado para planeados **sí** se suma en "Total ahorrado" (tu decisión), y la tarjeta agrega la línea "De eso, $X para gastos planeados".
3. **Gastar** (en el detalle, disponible desde el día de la fecha planeada; antes, con la etiqueta "Gastar antes de tiempo"):
   - El monto empieza en el planeado y se puede ajustar al real, hasta lo que tienes apartado.
     - Si te falta, el botón dice "Te faltan $X: aporta antes de gastar" y no deja continuar.
   - En un solo `writeBatch`, se registra un movimiento "Gastado" (`type: 'spent'`, sin cuenta) que baja el saldo del apartado, y el apartado queda marcado con `spentAt` (la fecha).
   - Si sobra dinero, la app lo indica: "Te sobraron $X: retíralos a una cuenta". Se retira con el "Retirar" de siempre.
   - Un planeado ya gastado pasa a una sección "Gastados", sin botón de gastar.
4. **Calendario del historial.**
   - **Meses futuros:** ahora se puede avanzar hasta el mes del último gasto planeado. Los días con planeados se marcan con borde punteado, y en el detalle se leen como "Planeado · $3,000". **No suman** al total ("Planeado para marzo: $3,000" va aparte).
   - **Gasto hecho:** el "Gastado" aparece en su día como "Planeado · Lentes" y **sí suma** al total del mes, porque es un gasto real. El desglose agrega "Planeados".
5. **Sin cambios** en saldos de cuentas, "Te queda este mes", avisos ni apartados normales.

Fuera de alcance:
- planeados que se repiten (anuales);
- aportes automáticos;
- avisos de "se acerca tu gasto planeado";
- pagar un planeado con tarjeta.

## Modelo de datos

```
users/{uid}/savings/{id}                 // campos nuevos, opcionales
  planned?: true
  category?: string                      // la de gastos hormiga
  spentAt?: string                       // 'YYYY-MM-DD' al gastarlo
  // target = monto planeado, deadline = fecha planeada (ya existen)

users/{uid}/savings/{id}/movements/{m}
  type: 'deposit' | 'withdrawal' | 'spent'   // 'spent' es nuevo: sin cuenta
```

Sin cambios de reglas ni índices.

## Estructura

```
src/savings/
  calc.ts (+ test)         → plannedSummary (avance, mensual, listo, vencido), spendError, plannedSaved (lo apartado para planeados)
  api.ts                   → addPlanned, spendPlanned (batch: movimiento 'spent' + increment(-monto) + spentAt)
  PlannedForm.tsx (+ test) → formulario de "Planear gasto"
  SavingList.tsx           → secciones "Gastos planeados" y "Gastados"; total aparte
  SavingDetail.tsx         → "Gastar" y el historial con "Gastado"
src/history/
  calc.ts, useMonthHistory.ts, HistoryPage.tsx → planeados futuros (no suman) y gastados (suman); navegar a meses futuros
App.tsx                    → /ahorro/planear
```

## Testing Strategy

- **Unit:**
  - `plannedSummary`: mensual con la fecha, completo, vencido y gastado;
  - `spendError`: 0, más que lo apartado, exacto y menos;
  - `totalSaved` incluye los planeados y `plannedSaved` suma solo los planeados sin gastar;
  - historial: los planeados futuros no suman, los gastados sí, y el límite para navegar meses futuros.
- **API (Firestore simulado):** `spendPlanned` escribe el movimiento, el `increment` y `spentAt` en un batch y no toca cuentas.
- **Componentes:**
  - el formulario valida;
  - Ahorro muestra las secciones y los totales separados;
  - "Gastar" pide el monto, bloquea si falta y avisa si sobra;
  - el calendario muestra un planeado futuro punteado.
- **Regresión:** los 235 tests siguen en verde.
- **Revisión a 360 px:** nombre largo, monto de 6 cifras y los estados vencido y listo, en modo claro y oscuro.

## Boundaries

- **Always:**
  - "Gastar" en un solo `writeBatch` con `increment`;
  - el movimiento "Gastado" nunca mueve cuentas;
  - montos en centavos.
- **Ask first:**
  - contar los planeados en Gastos hormiga o en "Te queda este mes";
  - permitir gastar más de lo apartado;
  - cambiar reglas.
- **Never:**
  - descontar dos veces de una cuenta (al aportar y al gastar);
  - borrar el historial de un planeado al gastarlo.

## Success Criteria

1. Planeo "Lentes, $3,000, 15 de marzo" y veo cuánto ahorrar al mes y el día marcado en marzo del calendario.
2. Aporto desde BBVA: baja mi saldo y sube lo apartado.
3. El 15 de marzo toco "Gastar": el apartado queda en $0, aparece en "Gastados" y en el calendario de marzo como gasto; mi saldo de BBVA no cambia.
4. Lint, tests, tests de reglas y build pasan.

## Open Questions

Ninguna. Resueltas:
1. Se puede gastar antes de la fecha ("Gastar antes de tiempo").
2. Lo apartado para planeados se suma al "Total ahorrado", con su parte indicada aparte.

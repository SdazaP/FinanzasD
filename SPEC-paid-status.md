# Spec: paid-status

"Por pagar" y "Pagado este mes" en gastos fijos y créditos (ver `CAPABILITY-MAP.md`, iteración 2). Depende de `recurring`, `credits` y `month-context` (`useToday`).

## Objetivo

Hoy, al pagar, el gasto salta al mes siguiente: muestra "5 dic" y vuelve a tener botón "Pagar", como si debiera algo. Quiero ver claramente qué me falta pagar **este mes** y qué ya pagué. "Pagar" solo debe aparecer mientras el pago del mes esté pendiente, y volver solo cuando cambie el mes.

## Regla de estado del mes

Para cada gasto fijo activo y cada crédito con saldo, con `hoy` de `useToday` y `finDeMes` = último día del mes en curso:

| Estado | Condición | Se muestra |
|---|---|---|
| **Por pagar** | `nextDue ≤ finDeMes` (incluye vencidos de meses anteriores) | Fecha, monto, etiqueta Vencido o Pronto, botón **Pagar** |
| **Pagado este mes** | No está por pagar y tiene al menos un pago cuyo periodo (`dueDate`) cae en el mes en curso | "Pagado el {fecha de pago}", monto pagado, sin botón |
| **Más adelante** | No está por pagar y no tiene pago con periodo este mes (p. ej. su primer pago es el mes que viene) | "Vence el {nextDue}", sin botón |

Por qué así:

- **Por qué funciona sin cambiar cómo se paga:** al pagar, la fecha (`nextDue`) sigue avanzando un mes, igual que ahora. La pantalla solo agrupa por mes. Cuando empieza el mes siguiente, `nextDue` ya cae dentro de ese mes y el elemento vuelve solo a **Por pagar**.
- **Un pago atrasado no cuenta como pago del mes actual:** si pagas en noviembre un periodo vencido de octubre, `nextDue` pasa a noviembre y el elemento sigue en **Por pagar**, porque el periodo de noviembre aún no está pagado.
- **Se usa el periodo del pago (`dueDate`), no el día en que pagaste:** en esta pantalla importa qué mes quedó cubierto.

## Criterios de aceptación

1. **Gastos fijos:** la lista activa se divide en "Por pagar", "Pagado este mes" y "Más adelante", en ese orden y cada sección solo si tiene elementos. "Pausados" sigue al final, igual que hoy.
2. **Créditos:** igual, para tarjetas y MSI con saldo. "Liquidados" sigue al final. El pago con monto libre no cambia.
3. "Pagar" solo existe en **Por pagar**. Al confirmar, el elemento pasa a **Pagado este mes** sin recargar.
4. En **Pagado este mes** se ve la fecha en que pagaste y el monto. Si hubo varios pagos del periodo (p. ej. dos abonos a una tarjeta), se suman y se muestra la fecha del último.
5. Las tarjetas de total (total mensual, deuda total) no cambian.
6. Inicio no cambia: sus "Próximos pagos" ya solo muestran lo que vence en 7 días.
7. Si borras desde el historial el pago del mes, el elemento vuelve a **Por pagar**, siempre que su `nextDue` se corrija editándolo (como hoy, borrar un pago no mueve la fecha).

Fuera de alcance: "deshacer pago" desde la lista, frecuencias distintas a mensual, cambiar cómo se registran los pagos.

## Datos

Sin cambios de modelo ni de reglas. Para saber qué está pagado este mes:

- `watchPeriodPayments(uid, col, id, desde, hasta, onData)` consulta `payments` con `dueDate` entre el primer y el último día del mes, y devuelve `{ amount, lastPaidAt }`;
- son N suscripciones pequeñas (una por elemento), igual que en Inicio;
- se reutiliza el patrón de `src/dashboard/api.ts`, que se mueve a `src/lib/periodPayments.ts` con la consulta por `paidAt` (Inicio) y por `dueDate` (listas).

La regla vive en una función pura:

```ts
// src/lib/monthStatus.ts
export function monthStatus(nextDue: string, paidThisPeriod: boolean, today: string): 'due' | 'paid' | 'later'
```

## Estructura

```
src/lib/monthStatus.ts, monthStatus.test.ts
src/lib/periodPayments.ts        → watchMonthPayments (paidAt, ya existe) + watchPeriodPayments (dueDate)
src/lib/usePeriodPayments.ts     → hook: { [id]: { amount, lastPaidAt } } para una lista de elementos
src/recurring/RecurringList.tsx  → agrupa con monthStatus
src/credits/CreditList.tsx       → agrupa con monthStatus
src/dashboard/*                  → importa watchMonthPayments desde src/lib
```

## Testing Strategy

- **Unit (`monthStatus`):**
  - vence este mes → `due`;
  - vencido del mes anterior → `due`;
  - pagado: `nextDue` el mes siguiente con pago del periodo → `paid`;
  - `nextDue` el mes siguiente sin pago → `later`;
  - último día del mes;
  - diciembre a enero.
- **Componentes (API simulada):**
  - gastos fijos y créditos muestran las tres secciones con los elementos correctos;
  - "Pagar" solo en Por pagar;
  - "Pagado el 1 nov" con el monto sumado de dos abonos;
  - un pago de octubre hecho en noviembre deja el elemento en Por pagar.
- **Regresión:** los tests de Inicio y de pago siguen en verde tras mover `watchMonthPayments`.
- **Revisión a 360 px:** con tus datos.

## Boundaries

- **Always:** usar `useToday` para "este mes"; centavos; reutilizar los componentes existentes.
- **Ask first:** cambiar el modelo o las reglas (no previsto).
- **Never:** dejar de avanzar `nextDue` al pagar; mostrar "Pagar" en un elemento ya pagado este mes.

## Success Criteria

1. Pago un gasto fijo y queda en "Pagado este mes" con la fecha de hoy, sin botón.
2. El 1 del mes siguiente, ese gasto aparece de nuevo en "Por pagar".
3. Lo mismo con una tarjeta y un MSI.
4. Lint, tests y build pasan.

## Open Questions

Ninguna.

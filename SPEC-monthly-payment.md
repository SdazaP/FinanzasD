# Spec: monthly-payment

**Estado:** aprobado.

Un pago por mes en Créditos (ver `CAPABILITY-MAP.md`, iteración 3). Depende de `credits` y `paid-status`.

## Objetivo

Cada pago de un crédito corresponde a **un mes**. Ciertos pagos son de ese mes en particular, así que la app no debe dejarme juntar ni adelantar meses en un solo pago.

## Cómo funciona hoy

- "Pagar" solo aparece si el crédito vence este mes o está vencido (`paid-status`). Al pagar, el próximo pago avanza un mes y el crédito pasa a "Pagado este mes".
- El monto es editable en los dos tipos (de $0.01 hasta el saldo):
  - en un **MSI** puedo pagar más que la cuota, y eso adelanta meses;
  - el historial no dice de qué mes es cada pago.

## Criterios de aceptación

1. **MSI: el pago es la cuota del mes.**
   - Al tocar "Pagar" se muestra la cuota de ese mes, sin campo para cambiarla (la última cuota absorbe el redondeo, o el saldo si es menor), con el selector "Desde" y "Confirmar" / "Cancelar".
   - La API rechaza un pago de MSI distinto de esa cuota.
2. **Tarjeta: un pago por mes, del monto que elijas.**
   - El monto sigue siendo editable (mayor a $0 y no mayor al saldo).
   - Después de pagar, la tarjeta pasa a "Pagado este mes" y no se puede volver a pagar hasta el mes siguiente (como hoy).
3. **Cada pago dice de qué mes es.**
   - El botón y la confirmación muestran el mes: "Pagar cuota de noviembre" en MSI y "Pagar noviembre" en tarjeta.
   - El historial del crédito muestra "Noviembre 2026" en cada pago (de su `dueDate`), además de la fecha en que se pagó.
4. **Vencidos de meses anteriores.**
   - Si un crédito está atrasado (su próximo pago es de un mes anterior), "Pagar" cubre **el mes más antiguo pendiente**, con su etiqueta ("Pagar cuota de octubre").
   - Al confirmar avanza un solo mes. Si aún falta el mes actual, el crédito sigue en "Por pagar" y se paga en otro pago.
5. **Sin cambios** en: liquidar, editar, eliminar, borrar pagos del historial, cuentas de origen ni gastos fijos.

Fuera de alcance:
- abonos extra o pagos anticipados a un MSI (si se necesitan, se corrige el saldo editando el crédito);
- varios pagos de una tarjeta en el mismo mes;
- tarjetas como cuentas (lo hará `credit-cards`).

## Modelo de datos

Sin cambios: `credits/{id}/payments/{p}.dueDate` ya guarda el mes del pago. Los pagos anteriores con montos distintos a la cuota se quedan como están.

## Estructura

```
src/credits/calc.ts        → periodLabel(dueDate); msiInstallmentDue(credit) (la cuota exacta del mes, ya calculada como `suggested`)
src/credits/api.ts         → payCredit valida que el pago de un MSI sea la cuota
src/credits/CreditList.tsx → PayRow: MSI con monto fijo; etiquetas con el mes
src/lib/PaymentHistory.tsx → mes del pago en cada fila (gastos fijos también se benefician)
(+ tests de cada uno)
```

## Testing Strategy

- **Unit (`calc.test.ts`):**
  - etiqueta del mes, incluido diciembre → enero;
  - cuota exigida en la primera, una intermedia y la última (con redondeo) y cuando el saldo es menor a la cuota.
- **API:** `payCredit` de un MSI con monto distinto a la cuota se rechaza sin escribir.
- **Componentes:**
  - el MSI muestra la cuota sin campo editable y paga exactamente eso;
  - la tarjeta conserva el monto editable;
  - el botón dice el mes, y uno atrasado dice el mes más antiguo;
  - el historial muestra el mes de cada pago.
- **Regresión:** los 176 tests actuales siguen en verde.
- **Revisión a 360 px:** "Pagar cuota de septiembre" con un MSI de nombre largo.

## Boundaries

- **Always:** un pago = un mes (`dueDate`); centavos; el pago, el saldo y la fecha en un solo `writeBatch`.
- **Ask first:** permitir abonos extra a MSI; cambiar pagos ya registrados.
- **Never:** avanzar más de un mes en un pago; cambiar montos de pagos antiguos.

## Success Criteria

1. Pago la cuota de noviembre de "Audífonos" con un toque, sin poder cambiar el monto, y pasa a "Pagado este mes".
2. El historial dice de qué mes es cada pago.
3. Lint, tests y build pasan.

## Open Questions

Ninguna.

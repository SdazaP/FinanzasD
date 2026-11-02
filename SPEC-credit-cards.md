# Spec: credit-cards

**Estado:** aprobado.

Tarjetas de crédito en Cuentas (ver `CAPABILITY-MAP.md`, iteración 3). Depende de `money`, `credits`, `monthly-payment` y `alerts`.

## Objetivo

Ver mis tarjetas de crédito junto a mis cuentas, con su **límite**, lo que **debo** y lo que **me queda de crédito**. Además, que la sección de Créditos tenga sentido con ellas:
- les cargo gastos;
- las pago desde mi cuenta de débito;
- mis compras a MSI usan su crédito.

## Decisiones

1. **Dónde se guardan.** Una tarjeta sigue siendo un crédito de tipo "Tarjeta" (`credits/{id}`, `kind: 'card'`), con lo que ya tiene: deuda, fecha de pago, pagos e historial. No se copia a otra colección; Cuentas la muestra y la crea.
   - **Por qué:** así no hay dos registros que se desincronicen, no hace falta migrar nada, y "Por pagar", el pago por mes y el historial siguen funcionando igual.
   - **Para ti:** se ve y se crea desde Cuentas, como pediste. Tus tarjetas actuales aparecen ahí solas.
2. **El disponible no cambia.** Solo suma cuentas de débito, efectivo y otras; una tarjeta es deuda, no dinero tuyo.
3. **Cargar a la tarjeta sube su deuda.** "Te queda este mes" lo refleja solo, porque la deuda de una tarjeta ya cuenta como pendiente del mes en que vence.
4. **La deuda de la tarjeta no incluye sus MSI.** Cada MSI se sigue pagando con su cuota en Créditos, y lo que le falta cuenta como **crédito usado** de su tarjeta. Así nada se paga ni se cuenta dos veces. (Confirmado: así lo manejas.)

## Criterios de aceptación

1. **Tarjetas en Cuentas.**
   - Nueva sección "Tarjetas de crédito" debajo de "Tus cuentas". Cada tarjeta muestra:
     - nombre y deuda;
     - barra de uso, crédito disponible y límite: "Disponible $X de $Y";
     - fecha de pago.
   - Uso = (deuda + lo que falta de sus MSI) ÷ límite.
   - Una tarjeta sin límite (de antes) dice "Agrega su límite" y lleva a editarla.
   - Al tocarla se abre su detalle (el mismo de Créditos).
2. **Agregar tarjeta desde Cuentas.**
   - Botón "Agregar tarjeta" con nombre, **límite (obligatorio)**, deuda actual y fecha de pago.
   - Desde Créditos también se puede, como hoy, y ahí el límite también pasa a ser obligatorio para tarjetas nuevas.
3. **Cargar gastos a la tarjeta.**
   - El selector "Desde" de **gastos fijos** (Pagar) y de **gastos hormiga** muestra tus cuentas y, en un grupo aparte, tus tarjetas: "BBVA Oro (crédito)".
   - Elegir una tarjeta guarda `cardId` en el registro y sube la deuda de la tarjeta en el mismo `writeBatch`; no mueve ninguna cuenta.
   - Borrar o editar el registro lo revierte, también al cambiar de cuenta a tarjeta o al revés.
   - Ingresos, aportes y retiros de ahorro, y pagos de créditos **no** ofrecen tarjetas: no se paga crédito con crédito.
4. **Pagar la tarjeta.** Sin cambios: en Créditos, "Pagar noviembre" desde una cuenta de débito baja la deuda de la tarjeta y el saldo de la cuenta.
5. **MSI ligados a una tarjeta.**
   - El formulario de MSI cambia el texto libre "Tarjeta" por un selector de tus tarjetas (opcional).
   - Los MSI de antes conservan su texto hasta que elijas una tarjeta.
   - La tarjeta suma lo que falta de sus MSI a su crédito usado, y su detalle lista esos MSI.
6. **Avisos.**
   - Una tarjeta al 90% o más de su límite: aviso amarillo "BBVA Oro: usas el 92% de tu límite".
   - Por encima del límite: aviso rojo.
   - Llevan a Cuentas, entran a la campana y se ocultan por mes como los demás.
7. **Sin tarjetas.** Todo funciona como hoy y la sección no aparece.

Fuera de alcance:
- fecha de corte e intereses;
- pago mínimo;
- estado de cuenta;
- conciliar la deuda con el banco (se corrige editando el saldo, como hoy);
- cargar MSI nuevos desde un gasto.

## Modelo de datos

```
users/{uid}/credits/{id}            // sin colección nueva
  kind: 'card'
  limit: number                      // obligatorio en tarjetas nuevas; opcional en las de antes
  kind: 'msi'
  cardId?: string                    // nuevo: tarjeta del MSI (reemplaza a `card` como texto)

Campo nuevo y opcional `cardId` en:
  recurring/{id}/payments/{p}, spending/{id}
  // un registro tiene accountId o cardId, nunca los dos
```

Sin cambios de reglas.

## Estructura

```
src/lib/accountBalance.ts      → applyCardCharge(batch, uid, cardId, delta, liveCardIds): increment en credits/{id}.balance
src/credits/calc.ts            → cardUsage(card, msis): { debt, msiPending, used, available, ratio }
src/credits/useCards.ts        → tarjetas del usuario (filtra watchCredits) + liveCardIds
src/money/AccountPicker.tsx    → grupo "Tarjetas" opcional; el valor distingue cuenta y tarjeta
src/money/CardsSection.tsx     → sección de Cuentas (+ "Agregar tarjeta")
src/recurring/api.ts, src/spending/api.ts → cargos y reversas con cardId
src/credits/CreditForm.tsx     → límite obligatorio en tarjeta nueva; selector de tarjeta en MSI
src/alerts/calc.ts             → aviso de uso de tarjeta
(+ tests de cada uno)
```

## Testing Strategy

- **Unit:**
  - `cardUsage` con y sin MSI, sin límite, sobre el límite y con deuda $0;
  - avisos al 89%, 90%, 100% y 101%.
- **API (Firestore simulado, como `balanceWrites.test.ts`):**
  - un gasto hormiga y un pago de gasto fijo cargados a una tarjeta suben su deuda y no tocan cuentas;
  - borrar revierte;
  - editar de tarjeta a cuenta, y al revés, corrige ambos;
  - una tarjeta eliminada no se mueve.
- **Componentes:**
  - Cuentas muestra la sección con disponible y barra, y la tarjeta sin límite;
  - el selector "Desde" incluye tarjetas solo donde corresponde;
  - el formulario de MSI elige tarjeta;
  - la tarjeta nueva exige límite.
- **Regresión:** los 181 tests actuales siguen en verde; sin tarjetas nada cambia.
- **Revisión a 360 px:** 3 tarjetas, una sobre el límite, nombres largos y montos de 7 cifras.

## Boundaries

- **Always:** el registro y el cambio de deuda o saldo en el mismo `writeBatch` con `increment`; centavos; un registro con `accountId` o `cardId`, no ambos.
- **Ask first:** mover tarjetas a la colección de cuentas; cambiar cómo se pagan los MSI; tocar pagos ya registrados.
- **Never:** sumar deuda al disponible; pagar un crédito con una tarjeta; recalcular saldos en el cliente.

## Success Criteria

1. Agrego mi tarjeta con su límite desde Cuentas y veo cuánto crédito me queda, contando mis MSI.
2. Registro un gasto hormiga con la tarjeta: su deuda sube y mi disponible no cambia. Lo borro y todo vuelve.
3. Pago la tarjeta desde BBVA débito en Créditos: baja su deuda y mi saldo.
4. Lint, tests, tests de reglas y build pasan.

## Open Questions

Ninguna. (Aviso de tarjeta al 90% de su límite: confirmado.)

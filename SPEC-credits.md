# Spec: credits

Tarjetas de crédito y compras a meses sin intereses (ver `CAPABILITY-MAP.md`). Depende de `core`; reutiliza las utilidades de fechas de `recurring`.

## Objetivo

Saber cuánto debo en total, qué pago viene y cuándo termino cada compra a meses, registrando mis pagos.

Hay dos tipos de crédito:

- **Tarjeta:** deuda que sube y baja. Registro el saldo que dice mi estado de cuenta y la app le resta mis pagos.
- **Meses sin intereses (MSI):** una compra de monto total dividido en N pagos mensuales iguales.

No hay cálculo de intereses: el saldo de la tarjeta lo actualizo yo.

Historias y criterios de aceptación:

1. **Registrar una tarjeta.** Nombre, saldo actual, límite de crédito (opcional) y fecha del próximo pago (se repite cada mes el mismo día, igual que en gastos fijos).
2. **Registrar una compra a MSI.** Nombre, tarjeta con la que se compró (texto opcional), monto total, número de meses (2–48) y fecha del primer pago.
   - Cuota = total ÷ meses redondeado a centavos; la última cuota absorbe la diferencia del redondeo.
3. **Ver la lista.** Tarjeta morada con la **deuda total** (suma de saldos). Cada crédito muestra:
   - **Tarjeta:** saldo, próximo pago y, si tiene límite, barra de uso (saldo ÷ límite).
   - **MSI:** saldo, cuota, **pagos restantes**, **fecha en que termino** y barra de **progreso** (pagado ÷ total).
   - Etiquetas **Vencido** / **Pronto** con las mismas reglas que gastos fijos.
4. **Pagar.** "Pagar" abre el monto prellenado (MSI: la cuota, o el saldo si es menor; tarjeta: el saldo) y lo puedo cambiar. Al confirmar, en una sola escritura atómica:
   - se guarda el pago en el historial;
   - el saldo baja en ese monto;
   - el próximo pago avanza un mes.

   El monto debe ser mayor que $0 y no mayor que el saldo.
5. **Liquidar.** Un crédito con saldo $0 pasa a la sección **Liquidados**, sin botón de pagar. Una tarjeta vuelve a la lista activa si le actualizo el saldo.
6. **Editar, historial y eliminar.** Igual que en gastos fijos: al abrir un crédito edito sus datos (en la tarjeta, aquí actualizo el saldo con cada estado de cuenta) y veo y borro pagos del historial. También lo elimino con confirmación junto con sus pagos.
   - Borrar un pago **no** devuelve el monto al saldo; si hace falta, se corrige editando el saldo.

Fuera de alcance: tasas e intereses, pago mínimo, fecha de corte, recordatorios, varias monedas, ligar automáticamente el saldo de la tarjeta con sus MSI.

## Modelo de datos

```
users/{uid}/credits/{id}
  kind: 'card' | 'msi'
  name: string             // 1–60
  balance: number          // centavos, ≥ 0 — lo que debo hoy
  nextDue: string          // 'YYYY-MM-DD'
  dayOfMonth: number       // 1–31
  createdAt: Timestamp
  // solo card
  limit?: number           // centavos > 0, opcional
  // solo msi
  card?: string            // nombre de la tarjeta, opcional
  total: number            // centavos > 0
  months: number           // 2–48

users/{uid}/credits/{id}/payments/{paymentId}
  dueDate: string, paidAt: Timestamp, amount: number
```

Para MSI, los valores derivados se calculan, no se guardan:

- `installment = round(total / months)`
- `paid = total − balance`
- `remaining = ceil(balance / installment)`
- `endDate` = `nextDue` + (`remaining` − 1) meses
- progreso = `paid / total`

## Rutas y UI

| Ruta | Pantalla |
|---|---|
| `/creditos` | Deuda total; activos por próximo pago; sección "Liquidados"; botón "Agregar" |
| `/creditos/nuevo` | Elegir tipo (Tarjeta / Meses sin intereses) y su formulario |
| `/creditos/:id` | Edición, eliminar e historial de pagos |

- Pagar se confirma en la misma tarjeta: al tocar "Pagar" aparece un campo con el monto y "Confirmar" / "Cancelar". No se abre un modal.
- La barra de progreso es un `<progress>` o un `div` con `role="progressbar"` y su valor en texto.

## Estructura

```
src/lib/dates.ts            → se mueve aquí desde src/recurring/dates.ts (compartido)
src/credits/
  calc.ts                   → installment, msiSummary (remaining, endDate, progress), debtTotal, validatePayment
  calc.test.ts
  CreditForm.tsx            → formulario por tipo, con validación
  CreditForm.test.tsx
  api.ts                    → watch, add, update, pay (writeBatch + increment), delete, pagos
  CreditList.tsx, CreditList.test.tsx
  CreditNew.tsx, CreditDetail.tsx, CreditDetail.test.tsx
```

## Code Style

Igual que `recurring`: lógica pura en `calc.ts`, componentes delgados y textos en español.

## Testing Strategy

- **Unit (`calc.test.ts`):**
  - cuota con redondeo (p. ej. $1,000 en 3 meses → 33,333 / 33,333 / 33,334 centavos);
  - pagos restantes con saldo parcial y fecha de término cruzando fin de mes y de año;
  - progreso;
  - deuda total;
  - validación del pago: 0, negativo, mayor al saldo e igual al saldo.
- **Componentes:**
  - el formulario valida por tipo (MSI exige total y meses 2–48; en la tarjeta el límite es opcional);
  - la lista muestra la deuda total, los pagos restantes y las secciones;
  - pagar con un monto editado llama a la API una sola vez;
  - el detalle elimina con confirmación.
- **Reglas:** agregar `credits/{id}` y `credits/{id}/payments/{p}` a los tests (las reglas actuales ya lo permiten solo al dueño).
- **Revisión a 360 px:** con nombres largos, saldos de 7 cifras, un MSI de 48 meses y la lista vacía.

## Boundaries

- **Always:** centavos; pagar en un `writeBatch` usando `increment(-monto)` para el saldo; nunca dejar saldo negativo; confirmar antes de eliminar.
- **Ask first:** cambiar reglas; agregar dependencias; mover `dates.ts` cambia imports de `recurring` (está incluido en este plan).
- **Never:** calcular intereses; guardar valores derivados; borrar sin confirmación.

## Success Criteria

1. Registro una tarjeta y una compra a MSI desde el celular y veo la deuda total correcta.
2. Pagar con monto editado reduce el saldo exacto, avanza la fecha y aparece en el historial.
3. Un MSI muestra pagos restantes y fecha de término correctos, y al liquidarse pasa a "Liquidados".
4. Lint, tests, tests de reglas y build pasan; `recurring` sigue funcionando tras mover `dates.ts`.

## Open Questions

1. **Doble conteo:** si el saldo de tu tarjeta en el estado de cuenta ya incluye lo que falta de tus compras a MSI, la deuda total las contaría dos veces. Propuesta: en la tarjeta registra el saldo **sin** las compras a MSI pendientes y registra cada compra a MSI aparte. La app lo indicará con una nota bajo el campo de saldo.
2. ¿Una compra a MSI que ya va a la mitad se registra con el total original y los meses originales, indicando cuánto queda? Propuesta: el formulario de MSI pide el total, los meses y el **saldo pendiente** (por defecto, igual al total).

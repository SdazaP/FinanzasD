# Spec: money

Cuentas, ingresos y dinero disponible (ver `CAPABILITY-MAP.md`, iteración 2). Depende de `recurring`, `credits`, `savings` y `spending`, porque sus pagos, aportes y gastos pasan a mover el saldo de una cuenta.

## Objetivo

Saber cuánto dinero tengo de verdad (en total y por cuenta) y cuánto me queda este mes después de lo que ya pagué, gasté y aparté, y de lo que aún me falta pagar.

## Conceptos

- **Cuenta:** dónde está mi dinero (débito, efectivo, otra). Tiene un saldo que yo fijo al crearla y que luego cambia solo con movimientos.
- **Ingreso:** dinero que entra a una cuenta (sueldo, extra, reembolso).
- **Disponible total:** suma de los saldos de todas las cuentas.
- **Te queda este mes:**

  ```
  disponible total − pendiente del mes (lo que vence hasta fin de mes, igual que en Inicio)
  + segunda quincena esperada (solo si el cobro es quincenal y aún no llega el segundo "Sueldo" del mes)
  ```

  Cambio definido en `SPEC-alerts.md`. Antes era `ingresos − pagado − gastado − ahorrado − pendiente`, pero salía negativo cuando el sueldo llegaba unos días antes de que empezara el mes. Lo pagado, gastado y apartado desde una cuenta ya está descontado del disponible.

## Criterios de aceptación

1. **Cuentas.**
   - Creo una cuenta con nombre (1–40), tipo (Débito, Efectivo, Otra) y saldo inicial (puede ser $0).
   - Una cuenta se marca como **predeterminada**: la primera que creo lo es, y puedo cambiarla.
   - Edito el nombre y el tipo, y elimino una cuenta con confirmación. Eliminarla no borra los pagos ni los gastos que salieron de ella: quedan registrados sin cuenta.
   - El saldo puede quedar negativo (sobregiro o error de registro); se muestra en rojo.
2. **Ajuste de saldo.** Si el saldo real de mi banco no coincide, registro un **ajuste** con el saldo correcto. Se guarda como movimiento ("Ajuste") por la diferencia, para no perder el historial.
3. **Ingresos.**
   - Registro un ingreso: concepto (Sueldo, Extra, Reembolso, Otro), monto (> $0), fecha (no futura), cuenta destino y nota opcional.
   - Suma al saldo de la cuenta en la misma escritura atómica.
   - Lo puedo editar o eliminar, y el saldo se corrige.
   - "Repetir" crea uno igual con fecha de hoy (útil para el sueldo).
4. **De qué cuenta sale el dinero.** Cada flujo que mueve dinero elige una cuenta, preseleccionando la predeterminada:
   - **Pagar** un gasto fijo: un toque sigue pagando desde la cuenta mostrada ("desde Nómina ▾"); el selector permite cambiarla antes.
   - **Pagar** un crédito: el campo de monto incluye el selector de cuenta.
   - **Gasto hormiga:** el registro rápido incluye el selector de cuenta.
   - **Aportar a ahorro** resta de la cuenta; **retirar** suma a la cuenta.

   Cada operación guarda `accountId` y mueve el saldo de la cuenta en el mismo `writeBatch` (`increment`).
5. **Deshacer.**
   - Borrar un pago, gasto, movimiento de ahorro o ingreso que tenga `accountId` revierte su efecto en esa cuenta.
   - Editar el monto o la cuenta de un gasto hormiga o de un ingreso corrige las cuentas afectadas (la anterior y la nueva).
   - Los registros anteriores a este módulo (sin `accountId`) no mueven ninguna cuenta.
6. **Pantalla de Cuentas.**
   - Tarjeta morada con el **disponible total** y **te queda este mes**.
   - Lista de cuentas con su saldo; la predeterminada marcada.
   - Ingresos del mes.
   - Botones "Agregar cuenta" y "Registrar ingreso".
   - Cada cuenta abre su detalle con sus movimientos del mes (ingresos, pagos, gastos, ahorro y ajustes) en orden de fecha.
7. **Inicio.** La tarjeta morada "Este mes" agrega **Disponible** y **Te queda este mes**, enlazados a Cuentas. Si aún no hay cuentas, invita a crear la primera.
8. **Sin cuentas.** Mientras no exista ninguna cuenta, todos los flujos funcionan como hoy, sin selector y sin mover saldos.

Fuera de alcance:
- transferencias entre cuentas;
- ingresos recurrentes automáticos;
- conciliación con el banco;
- tarjetas de crédito como cuenta (siguen en Créditos);
- avisos (los hará `alerts`).

## Modelo de datos

```
users/{uid}/accounts/{id}
  name: string               // 1–40
  type: 'debit' | 'cash' | 'other'
  balance: number            // centavos; puede ser < 0
  createdAt: Timestamp

users/{uid}/accounts/{id}/adjustments/{adjId}
  amount: number             // diferencia con signo
  date: string, createdAt: Timestamp

users/{uid}/incomes/{id}
  concept: 'Sueldo' | 'Extra' | 'Reembolso' | 'Otro'
  amount: number             // centavos > 0
  date: string               // 'YYYY-MM-DD', ≤ hoy
  accountId: string
  note?: string
  createdAt: Timestamp

users/{uid}/settings/money
  defaultAccountId?: string

Campo nuevo y opcional `accountId` en:
  recurring/{id}/payments/{p}, credits/{id}/payments/{p},
  savings/{id}/movements/{m}, spending/{id}
```

Sin cambios de reglas: `users/{uid}/**` cubre todo.

El detalle de una cuenta lee sus movimientos del mes con consultas por `accountId` en cada colección. Los pagos están en subcolecciones, así que se consultan por elemento (como en Inicio). Para no multiplicar suscripciones, el detalle muestra solo los movimientos del mes en curso.

## Estructura

```
src/money/
  calc.ts, calc.test.ts            → availableTotal, leftThisMonth, accountActivity (unifica movimientos para el detalle)
  api.ts                           → cuentas, ajustes, ingresos, predeterminada
  AccountPicker.tsx                → selector de cuenta reutilizable (se oculta si no hay cuentas)
  useAccounts.ts                   → cuentas + predeterminada
  AccountsPage.tsx, AccountForm.tsx, AccountDetail.tsx, IncomeForm.tsx (+ tests)
Cambios en módulos existentes (cada uno con sus tests):
  recurring/api.ts (payRecurring, deletePayment), recurring/RecurringList.tsx
  credits/api.ts (payCredit, deleteCreditPayment), credits/CreditList.tsx
  savings/api.ts (moveSaving, deleteMovement), savings/SavingList.tsx
  spending/api.ts (add/update/deleteSpending), spending/SpendingForm.tsx
  dashboard/Dashboard.tsx
```

## Testing Strategy

- **Unit (`calc.test.ts`):**
  - disponible con saldos negativos;
  - `leftThisMonth` con cada término de la fórmula;
  - ahorro neto (aportes − retiros);
  - registros sin cuenta excluidos de los movimientos de la cuenta.
- **API (con Firestore simulado o el emulador):**
  - cada operación que mueve dinero escribe el registro y el `increment` correcto de la cuenta en un batch;
  - borrar revierte;
  - editar un gasto hormiga de la cuenta A a la B con otro monto ajusta las dos.
- **Componentes:**
  - el selector preselecciona la predeterminada y se oculta sin cuentas;
  - Pagar en gastos fijos usa la cuenta mostrada;
  - el formulario de ingreso valida;
  - "Repetir" usa la fecha de hoy;
  - la pantalla de Cuentas muestra el disponible, lo que queda del mes y las cuentas.
- **Regresión:** los 131 tests actuales siguen en verde, con o sin cuentas.
- **Reglas:** agregar `accounts`, `adjustments`, `incomes` y `settings/money`.
- **Revisión a 360 px:** con saldo negativo, nombres largos y 5 cuentas.

## Boundaries

- **Always:** toda operación que mueve dinero guarda el registro y el `increment` de la cuenta en el mismo `writeBatch`; centavos; confirmar antes de eliminar.
- **Ask first:** índices compuestos; cambiar el comportamiento de flujos existentes más allá del selector de cuenta.
- **Never:** recalcular y sobrescribir saldos desde el cliente (siempre `increment`); mover saldos por registros sin `accountId`.

## Success Criteria

1. Creo mis cuentas con su saldo real y veo el disponible total.
2. Registro mi sueldo y el saldo de la cuenta sube.
3. Pago un gasto fijo, un crédito, registro un gasto hormiga y aporto a ahorro: cada saldo baja exactamente por ese monto en la cuenta elegida.
4. Borro cualquiera de esos registros y el saldo vuelve a como estaba.
5. "Te queda este mes" coincide con la fórmula y se actualiza al instante.
6. Lint, tests, tests de reglas y build pasan.

## Open Questions

1. **Ubicación de Cuentas:** propongo que reemplace a Inversiones en la barra inferior (Inicio, Gastos, Créditos, Ahorro, **Cuentas**), porque Inversiones está pospuesta y sigue accesible por URL. ¿Te parece, o prefieres Cuentas dentro de Inicio?
2. **Transferencias entre cuentas** (p. ej. retirar efectivo del cajero): están fuera de alcance. Mientras tanto se resuelven con dos ajustes. ¿Las necesitas ya?

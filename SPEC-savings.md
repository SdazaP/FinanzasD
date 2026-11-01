# Spec: savings

Apartados de ahorro con o sin meta (ver `CAPABILITY-MAP.md`). Depende de `core`; reutiliza `src/lib` (fechas, dinero, estilos, componentes).

## Objetivo

Saber cuánto tengo ahorrado en total y en cada apartado, registrar aportes y retiros, y, cuando un apartado tiene meta con fecha, saber cuánto ahorrar al mes para llegar.

Historias y criterios de aceptación:

1. **Crear un apartado.** Pide:
   - nombre (1–60);
   - saldo inicial (≥ $0, por defecto $0);
   - monto objetivo (opcional, > $0);
   - fecha límite (opcional, solo si hay objetivo).
2. **Aportar y retirar.** Desde la lista, "Aportar" o "Retirar" abre un campo de monto con "Confirmar" / "Cancelar", igual que el pago de créditos.
   - Cada movimiento guarda tipo, monto y fecha (hoy).
   - El saldo cambia en la misma escritura atómica (`increment`).
   - Un retiro no puede ser mayor al saldo.
3. **Ver la lista.** Tarjeta morada con el **total ahorrado**. Cada apartado muestra:
   - nombre y saldo;
   - si tiene objetivo: barra de progreso (saldo ÷ objetivo, máx. 100%) y "Faltan $X";
   - si además tiene fecha límite: "Ahorra $Y al mes hasta {mes año}".
   - Mensajes especiales:
     - **Meta alcanzada** si el saldo ≥ objetivo;
     - **La fecha ya pasó** si la fecha límite es anterior a hoy y no se alcanzó.
4. **Editar, historial y eliminar.** Al abrir un apartado edito nombre, objetivo y fecha. El saldo no se edita a mano: cambia solo con movimientos.
   - Veo el historial (fecha, Aporte/Retiro, monto) del más reciente al más antiguo.
   - Borrar un movimiento revierte su efecto en el saldo, en la misma escritura. No se permite si dejaría el saldo negativo.
   - Elimino el apartado con confirmación, junto con sus movimientos.

Fuera de alcance: rendimientos o intereses (eso es `investments`), aportes automáticos, transferencias entre apartados, recordatorios.

## Cálculo de la sugerencia mensual

- Meses restantes = meses calendario desde el mes actual hasta el mes de la fecha límite, contando el mes actual. Ejemplo: hoy 31 oct y límite 15 dic → oct, nov, dic = 3.
- Sugerencia = `ceil((objetivo − saldo) / meses restantes)` en centavos.
- Sin sugerencia si no hay fecha, si la meta ya se alcanzó o si la fecha ya pasó.

## Modelo de datos

```
users/{uid}/savings/{id}
  name: string
  balance: number          // centavos ≥ 0; solo cambia con movimientos (o el saldo inicial al crear)
  target?: number          // centavos > 0
  deadline?: string        // 'YYYY-MM-DD'
  createdAt: Timestamp

users/{uid}/savings/{id}/movements/{movementId}
  type: 'deposit' | 'withdrawal'
  amount: number           // centavos > 0
  date: string             // 'YYYY-MM-DD'
  createdAt: Timestamp
```

## Rutas y UI

| Ruta | Pantalla |
|---|---|
| `/ahorro` | Total ahorrado; apartados con progreso, sugerencia, "Aportar" y "Retirar"; botón "Agregar apartado" |
| `/ahorro/nuevo` | Formulario de alta |
| `/ahorro/:id` | Edición, eliminar e historial de movimientos |

- El campo de monto en línea se extrae de `credits` (`PayRow`) a un componente compartido `src/lib/AmountAction.tsx`. Créditos lo sigue usando.
- El historial reutiliza el estilo de `PaymentHistory`, con una etiqueta Aporte/Retiro por fila.

## Estructura

```
src/lib/AmountAction.tsx    → campo de monto + Confirmar/Cancelar (extraído de credits)
src/savings/
  calc.ts                   → monthsLeft, goalSummary (progreso, faltante, sugerencia, estado), totalSaved, movementError
  calc.test.ts
  SavingForm.tsx, SavingForm.test.tsx
  api.ts                    → watch, add, update, move (writeBatch + increment), deleteMovement (revierte), delete
  SavingList.tsx, SavingList.test.tsx
  SavingNew.tsx, SavingDetail.tsx, SavingDetail.test.tsx
```

## Testing Strategy

- **Unit (`calc.test.ts`):**
  - meses restantes: mismo mes, cambio de año y fecha pasada;
  - sugerencia con redondeo hacia arriba;
  - meta alcanzada y sin objetivo;
  - progreso topado en 100%;
  - total ahorrado;
  - validación de retiro: mayor al saldo, igual al saldo y cero.
- **Componentes:**
  - el formulario valida objetivo opcional y fecha solo con objetivo;
  - la lista muestra total, progreso, sugerencia y mensajes especiales;
  - aportar y retirar llaman a la API una vez con el tipo correcto;
  - un retiro mayor al saldo se rechaza;
  - el detalle elimina con confirmación.
- **Reglas:** agregar `savings/{id}` y `savings/{id}/movements/{m}`.
- **Créditos:** sus tests siguen en verde tras extraer `AmountAction`.
- **Revisión a 360 px:** nombre largo, saldo de 7 cifras, meta superada y lista vacía.

## Boundaries

- **Always:** centavos; cada movimiento y su efecto en el saldo van en un `writeBatch` con `increment`; nunca saldo negativo; confirmar antes de eliminar.
- **Ask first:** cambiar reglas; agregar dependencias.
- **Never:** editar el saldo a mano después de crear; guardar valores derivados (progreso, sugerencia).

## Success Criteria

1. Creo un apartado con meta y fecha desde el celular y veo cuánto ahorrar al mes.
2. Aportar y retirar cambian el saldo exacto y quedan en el historial.
3. Borrar un movimiento revierte el saldo.
4. El total ahorrado coincide con la suma de saldos.
5. Lint, tests, tests de reglas y build pasan; créditos sigue funcionando.

## Open Questions

1. ¿El saldo inicial al crear debe aparecer como un primer movimiento ("Saldo inicial") en el historial? Propuesta: **sí**, así el historial siempre suma el saldo. Al borrarlo se revierte como cualquier aporte.

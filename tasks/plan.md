# Plan: money

Implementa `SPEC-money.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Componentes y dependencias

```
calc.ts (puro) ──┐
api + useAccounts + AccountPicker ─┬─→ pantalla Cuentas + ingresos ─→ detalle de cuenta + ajustes
                                   ├─→ integrar gastos fijos y créditos
                                   └─→ integrar ahorro y hormiga ──────────────┐
                                                                              ├─→ Inicio + reglas + revisión + deploy
```

## Orden

1. `calc.ts`: disponible, "te queda este mes" y actividad de una cuenta (TDD).
2. `api.ts`, `useAccounts` y `AccountPicker`: cuentas, predeterminada, ajustes e ingresos (escrituras en batch con `increment`).
3. Pantalla **Cuentas** (reemplaza a Inversiones en la barra): totales, cuentas, ingresos del mes, alta de cuenta e ingreso, y "Repetir".
4. Detalle de cuenta: editar, eliminar, ajustar saldo y actividad del mes.
5. Gastos fijos y créditos: elegir cuenta al pagar y revertir al borrar un pago.
6. Ahorro y hormiga: cuenta en aportar, retirar y registrar gasto; revertir y corregir al editar o borrar.
7. Inicio con Disponible y Te queda este mes, tests de reglas, revisión a 360 px y deploy.

Las tareas 5 y 6 son independientes entre sí una vez hecha la 2. Hasta la tarea 7 nada cambia para ti si no creas cuentas.

## Checkpoints

- Tras 3: creas tus cuentas reales y registras tu sueldo desde el celular.
- Tras 6: pagas, gastas y aportas desde una cuenta y los saldos cuadran.
- Tras 7: deploy y prueba completa en el celular.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Saldo descuadrado si una escritura falla a la mitad | Registro + `increment` en el mismo `writeBatch`; nunca escribir el saldo calculado |
| Editar un gasto o ingreso y cambiar de cuenta | Revertir en la cuenta anterior y aplicar en la nueva en un batch; test |
| Romper los flujos actuales | Sin cuentas todo funciona igual (selector oculto, sin `accountId`); los 131 tests como red |
| Registros viejos sin `accountId` | No mueven saldos; test |
| Cuenta eliminada con registros que la apuntan | Se dejan sin cambios; revertir un registro cuya cuenta ya no existe se omite (sin error) |
| Muchas suscripciones en el detalle de cuenta | Solo el mes en curso; `shortcut:` documentado |

## Acciones que te pido antes de hacer

Dependencias (no prevemos), índices o reglas (no previstos), cada `git push`, cada deploy.

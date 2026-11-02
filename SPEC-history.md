# Spec: history

Historial de gastos por meses con calendario (ver `CAPABILITY-MAP.md`, iteración 4). Depende de `spending`, `recurring`, `credits` y `money`.

**Estado:** aprobado.

## Objetivo

1. Registrar gastos de meses pasados para tener tu historial completo, **sin cambiar tus saldos actuales**.
2. Ver en un calendario cuánto gastaste cada día de cualquier mes, y qué fue.

## Decisiones (tus respuestas)

1. **Todos los gastos van al calendario:** gastos hormiga (por su fecha), pagos de gastos fijos y pagos de créditos (por el día en que se pagaron).
2. **Gasto pasado automático por mes:** un gasto hormiga con fecha de un mes anterior al actual se guarda como historial y no mueve ninguna cuenta ni tarjeta. Los del mes actual siguen como hoy.
3. **Pestaña "Historial" en Gastos**, junto a Fijos | Hormiga.

## Criterios de aceptación

1. **Registrar un gasto pasado.**
   - Al elegir en "Fecha" un día de un mes anterior, el selector "Desde" se oculta. En su lugar aparece: "Es de un mes anterior: queda en tu historial y no mueve tus saldos."
   - Se guarda sin `accountId` ni `cardId`.
   - La API lo garantiza también: aunque llegue una cuenta, un gasto de un mes anterior no la mueve.
   - **Al editar:**
     - si cambias un gasto del mes actual a una fecha de un mes anterior, se devuelve a su cuenta o tarjeta;
     - si cambias uno del historial al mes actual, puedes elegir "Desde" como en un gasto nuevo.
   - Sigue sin aceptar fechas futuras (los gastos futuros serán del módulo `planned`).
2. **Pestaña Historial** (`/gastos-historial`):
   - **Encabezado:** "‹ Noviembre 2026 ›".
     - Las flechas cambian de mes.
     - No se avanza más allá del mes actual (los meses futuros llegarán con `planned`).
   - **Total del mes:** "Gastaste $X en noviembre", y debajo el desglose: hormiga · fijos · créditos.
   - **Calendario:**
     - semana de domingo a sábado ("D L M M J V S");
     - cada día muestra su número y, si hubo gastos, el total en corto ("$258", "$1.2 mil");
     - el fondo se intensifica según el monto del día;
     - hoy queda marcado.
   - **Detalle del día:**
     - al tocar un día, debajo del calendario aparece "Martes 3 de noviembre · $X" con su lista: nombre o categoría, tipo (Hormiga, Fijo, MSI o Tarjeta) y monto;
     - cada elemento lleva a su detalle;
     - por defecto se abre el día de hoy (o el último día del mes, en meses pasados).
   - **Sin gastos en el mes:** "No registraste gastos en octubre." con un enlace a Gastos hormiga para agregar uno.
3. **Pagos de tarjeta en el calendario.**
   - **Qué se muestra:** el pago de una tarjeta de crédito aparece en el detalle del día como "Pago de tarjeta".
   - **Qué no se cuenta:** ese pago **no** suma al total del mes, porque ese dinero ya se contó cuando hiciste los gastos con la tarjeta, y contarlo otra vez lo duplicaría.
   - **Los MSI sí suman,** porque cada cuota es la parte del gasto de ese mes.
4. **Nada cambia fuera de aquí.**
   - "Te queda este mes", los avisos, Inicio y el total de Gastos hormiga siguen contando solo el mes actual.
   - Un gasto del historial nunca toca saldos.

Fuera de alcance:
- registrar pagos pasados de gastos fijos o créditos (se registran solos al pagar);
- gráficas por categoría;
- exportar;
- comparar meses;
- meses futuros y gastos planeados (lo hará `planned`).

## Modelo de datos

Sin cambios. Se reutilizan:
- `spending` (por `date`);
- `recurring/{id}/payments` y `credits/{id}/payments` (por `paidAt`), con `watchMonthPaymentDocs`, que ya existe.

Sin índices nuevos y sin cambios de reglas.

## Estructura

```
src/history/
  calc.ts, calc.test.ts     → monthGrid(mes): semanas de domingo a sábado; dayTotals(entradas); monthSummary;
                              compactMXN ("$1.2 mil"); isPastMonth(fecha, hoy)
  useMonthHistory.ts        → reúne gastos hormiga, pagos de fijos y de créditos del mes elegido
  HistoryPage.tsx (+ test)  → navegación de meses, total, calendario y detalle del día
Cambios:
  spending/SpendingForm.tsx → oculta "Desde" en meses anteriores, con el aviso
  spending/api.ts           → add/updateSpending no mueven saldos con fecha de un mes anterior
  layout/GastosTabs.tsx     → tercera pestaña "Historial"
  sections.tsx, App.tsx     → ruta /gastos-historial
```

## Code Style

Igual que el resto: la lógica del calendario es pura y vive en `calc.ts`, los componentes son delgados y los textos están en español.

```ts
// Un gasto de un mes anterior es historial: no mueve saldos
const source = isPastMonth(input.date, today()) ? {} : input
```

## Testing Strategy

- **Unit (`history/calc.test.ts`):**
  - `monthGrid` para un mes que empieza en domingo, uno que empieza en sábado, febrero bisiesto y diciembre;
  - totales por día con varios tipos;
  - el pago de tarjeta se excluye del total y los MSI se incluyen;
  - formato corto ($0.50, $258, $1,234 → "$1.2 mil", $12,345.67 → "$12.3 mil");
  - `isPastMonth` en el cambio de mes y de año.
- **API (`balanceWrites.test.ts`):**
  - un gasto de octubre con cuenta, registrado en noviembre, no mueve la cuenta;
  - editar uno de noviembre a octubre lo devuelve a la cuenta.
- **Componentes:**
  - el formulario oculta "Desde" y muestra el aviso con fecha de un mes anterior;
  - la página de historial:
    - navega de mes y no pasa del actual;
    - muestra el total y el desglose;
    - al tocar un día lista sus gastos con enlaces;
    - muestra el estado vacío.
- **Regresión:** los 215 tests siguen en verde.
- **Revisión a 360 px:** un mes con gastos casi todos los días, montos de 6 cifras, en modo claro y oscuro.

## Boundaries

- **Always:**
  - un gasto de un mes anterior no mueve saldos (en el formulario y en la API);
  - montos en centavos;
  - fechas locales `YYYY-MM-DD`.
- **Ask first:**
  - índices compuestos;
  - permitir registrar pagos pasados de fijos o créditos;
  - cambiar qué cuenta en el total del mes.
- **Never:**
  - cambiar saldos por registros del historial;
  - contar dos veces el pago de una tarjeta.

## Success Criteria

1. Registro un gasto hormiga de octubre con mi cuenta elegida: aparece en el historial de octubre y mi saldo de BBVA no cambia.
2. En la pestaña Historial veo noviembre con el total del mes y cada día con su monto; toco un día y veo qué pagué.
3. Navego a octubre y veo los gastos que registré.
4. Lint, tests y build pasan.

## Open Questions

Ninguna. Excluir los pagos de tarjeta del total del mes es una decisión mía, para no contar dos veces el mismo dinero. Si prefieres verlos sumados, dime.

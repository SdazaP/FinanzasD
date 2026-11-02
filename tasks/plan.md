# Plan: monthly-payment

Implementa `SPEC-monthly-payment.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Componentes y dependencias

```
calc (periodLabel, cuota exigida) ─→ payCredit valida la cuota ─→ PayRow (MSI fijo, etiquetas) ─→ historial con el mes ─→ revisión + deploy
```

## Orden

1. **Lógica y API** (TDD):
   - `periodLabel(dueDate)` → "noviembre" / "Noviembre 2026";
   - la cuota exigida de un MSI (hoy `msiSummary().suggested`);
   - `payCredit` rechaza un MSI con otro monto antes de escribir nada.
2. **Pagar en la lista:**
   - MSI con monto fijo y sin campo (mismo `AmountAction` con un modo de solo lectura, o un bloque propio si queda más simple);
   - etiquetas "Pagar cuota de {mes}" y "Pagar {mes}";
   - un atrasado muestra el mes más antiguo.
3. **Historial y cierre:**
   - el historial de créditos y de gastos fijos muestra el mes del pago y la fecha en que se pagó (`paidAt`); el de ahorro no cambia;
   - revisión a 360 px y deploy con tu permiso.

## Riesgos

- **`AmountAction` es compartido** (gastos hormiga, tope, créditos). Un modo de solo lectura no debe cambiar a los demás: se prueba con sus tests actuales.
- **`paidAt` puede faltar** en pagos recién escritos (`serverTimestamp` pendiente). Se estima, como ya se hace en otras listas.

## Verificación

`npm run lint && npm test` en cada tarea; `npm run build` y revisión en el panel en la 3.

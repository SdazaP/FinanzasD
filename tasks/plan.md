# Plan: credit-cards

Implementa `SPEC-credit-cards.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Componentes y dependencias

```
cardUsage + applyCardCharge (puro y escrituras) ─┬─→ selector "Desde" con tarjetas (gastos fijos, hormiga)
                                                 ├─→ sección de tarjetas en Cuentas + agregar tarjeta
                                                 ├─→ MSI ligado a tarjeta
                                                 └─→ aviso de uso de tarjeta ─→ revisión + deploy
```

## Orden

1. **Cálculo y escrituras.**
   - `cardUsage` (deuda, MSI pendiente, usado, disponible, uso).
   - `applyCardCharge`, junto a `applyAccountDelta`.
   - `payRecurring`, `deletePayment`, `addSpending`, `updateSpending` y `deleteSpending` aceptan una tarjeta (`cardId`) y la revierten. Con tests de Firestore simulado, como `balanceWrites.test.ts`.
   - Va primero porque todo lo demás usa estas piezas.
2. **Selector "Desde" con tarjetas.**
   - `useCards` y un grupo "Tarjetas" en `AccountPicker`, solo donde se pide (gastos fijos y gastos hormiga).
   - El valor distingue cuenta de tarjeta (`card:{id}`).
3. **Tarjetas en Cuentas.**
   - `CardsSection` con disponible, barra y fecha.
   - "Agregar tarjeta" con el límite obligatorio (el mismo formulario de crédito).
   - Una tarjeta sin límite pide agregarlo.
4. **MSI ligados a tarjeta.**
   - Selector de tarjeta en el formulario de MSI.
   - El uso de la tarjeta suma sus MSI.
   - El detalle de la tarjeta lista sus MSI.
5. **Aviso de uso de tarjeta** en `buildAlerts` y `useAlerts`, al 90% y por encima del límite.
6. **Cierre:** revisión a 360 px, reglas, mapa de capacidades y deploy con tu permiso.

## Riesgos

- **Más superficie en escrituras de dinero.** Cada operación que hoy mueve una cuenta podrá mover una tarjeta. Se cubre con tests de cada combinación: cuenta → tarjeta, tarjeta → cuenta, tarjeta eliminada.
- **El valor del selector cambia de forma** (`card:{id}`). Los formularios convierten a `accountId` o `cardId` en un solo lugar para no repetir la lógica.
- **`useAlerts` y Cuentas cargan los créditos otra vez**: una suscripción más. Es aceptable para un solo usuario.

## Verificación

`npm run lint && npm test` en cada tarea; `npm run build` y revisión en el panel en la 3 y la 6; `npm run test:rules` en la 6.

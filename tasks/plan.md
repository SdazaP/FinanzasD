# Plan: planned

Implementa `SPEC-planned.md`. Tareas en `tasks/todo.md`. (Los planes anteriores están en el historial de git.)

## Orden

1. **Cálculo y API (TDD):**
   - `plannedSummary`, `spendError` y `plannedSaved`;
   - `addPlanned`;
   - `spendPlanned`: un solo batch con el movimiento 'spent', el `increment` y `spentAt`, sin tocar cuentas.
   - Va primero porque todo lo demás lo usa.
2. **Planear un gasto:** `PlannedForm` y la ruta `/ahorro/planear`, con validación.
3. **Ahorro:**
   - secciones "Gastos planeados" y "Gastados";
   - "De eso, $X para gastos planeados" en la tarjeta del total;
   - en el detalle: "Gastar", "Gastar antes de tiempo", el aviso si falta o sobra dinero, y "Gastado" en el historial de movimientos.
4. **Calendario:**
   - navegar hasta el mes del último planeado;
   - planeados futuros punteados, que no suman;
   - "Gastado" en su día, que sí suma, con "Planeados" en el desglose.
5. **Cierre:** revisión a 360 px (claro y oscuro), tests de reglas, mapa de capacidades y deploy con tu permiso.

## Riesgos

- **Un tipo de movimiento nuevo (`'spent'`)** pasa por pantallas que hoy asumen aporte o retiro:
  - la etiqueta del historial;
  - `savingsNet` ya no existe;
  - `deleteMovement` revierte según el tipo.

  Borrar un "Gastado" debe devolver el saldo al apartado y quitar `spentAt`. Se cubre con un test.
- **El historial lee los movimientos de cada apartado** del mes elegido: una suscripción por apartado, como ya hacen Cuentas e Inicio.

## Verificación

`npm run lint && npm test` en cada tarea; `npm run build` y revisión en el panel en la 3, la 4 y la 5.

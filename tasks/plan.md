# Plan: recurring

Implementa `SPEC-recurring.md`. Tareas en `tasks/todo.md`. (El plan de `core` está completo; queda en el historial de git.)

## Componentes y dependencias

```
dates.ts (puro) ──┐
                  ├─→ api.ts + lista + alta ─→ pagar + estados + total ─→ detalle (editar, pausar, eliminar, historial) ─┐
RecurringForm ────┘                                                                                                      ├─→ verificación y deploy
categorías por defecto ─────────────────────────────────────→ categorías propias ───────────────────────────────────────┘
```

## Orden

1. Lógica de fechas y totales, sin Firestore (TDD).
2. Formulario con validación y categorías por defecto, sin Firestore (TDD).
3. Capa `api.ts`, rutas y lista con alta: primer corte vertical que guarda en Firestore real.
4. Pagar, etiquetas Vencido/Pronto y tarjeta del total.
5. Detalle: editar, pausar/reactivar, eliminar con sus pagos, historial y borrar pago.
6. Categorías propias creadas desde el formulario.
7. Tests de reglas para `payments` y `categories`, revisión visual con datos extremos y deploy.

Las tareas 1 y 2 no dependen entre sí. La 6 puede ir después de la 3.

## Checkpoints

- Tras 3: agregas un gasto desde el celular y aparece en la lista.
- Tras 5: flujo completo (pagar, editar, pausar, eliminar) revisado en el panel a 360 px.
- Tras 7: deploy en Vercel y prueba en tu celular.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Fechas corridas un día por zona horaria | Fechas como `YYYY-MM-DD` en hora local; nunca `new Date('YYYY-MM-DD')` (se interpreta en UTC) |
| Pago guardado pero fecha sin avanzar (o al revés) | `writeBatch` para ambas escrituras |
| Pagos huérfanos al eliminar un gasto | Borrar pagos y gasto en el mismo batch (límite 500 escrituras: suficiente para ~40 años de pagos mensuales) |
| Doble toque en "Pagar" registra dos pagos | Deshabilitar el botón mientras se guarda |
| La barra inferior no marca "Gastos" en `/gastos-fijos/:id` | Quitar `end` del NavLink salvo en Inicio; título por prefijo |

## Acciones que te pido antes de hacer

Instalar dependencias (no prevemos ninguna), cambiar reglas, cada `git push`, cada deploy.

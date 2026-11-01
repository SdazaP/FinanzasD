# Spec: recurring

Gastos fijos y suscripciones (ver `CAPABILITY-MAP.md`). Depende de `core` (`SPEC-core.md`): auth, layout, `money.ts`, reglas de Firestore.

## Objetivo

Registrar lo que pago cada mes, saber cuánto suma al mes y qué vence pronto, y marcar cada pago para llevar un historial.

Historias y criterios de aceptación:

1. **Registrar un gasto.** Como dueño, agrego un gasto con nombre, tipo (gasto fijo o suscripción), categoría, monto y fecha del próximo pago.
   - Nombre obligatorio (máx. 60 caracteres); monto > $0 con `toCents`; fecha válida.
   - Se repite **cada mes** el mismo día; si el mes es más corto (p. ej. día 31 en febrero), vence el último día del mes.
2. **Categorías.** Elijo de una lista fija (Vivienda, Servicios, Transporte, Entretenimiento, Salud, Educación, Otros) o creo una nueva desde el formulario; las nuevas quedan disponibles para los siguientes gastos.
3. **Ver la lista.** Veo el **total mensual** de los gastos activos y la lista ordenada por próximo pago, cada uno con nombre, categoría, monto y fecha.
   - Etiqueta **Vencido** si la fecha ya pasó y **Pronto** si vence en los próximos 7 días (incluido hoy).
4. **Marcar como pagado.** Con un botón "Pagar" registro el pago del periodo: se guarda en el historial (fecha de vencimiento, fecha de pago, monto) y la fecha del próximo pago avanza un mes. Ambas escrituras son atómicas.
5. **Editar y ver historial.** Al abrir un gasto edito sus datos (incluida la fecha del próximo pago, para corregir errores) y veo su historial de pagos, del más reciente al más antiguo. Puedo borrar un pago del historial.
6. **Pausar sin borrar.** Pauso o reactivo un gasto; los pausados salen del total y de los avisos, y se listan aparte en "Pausados".
7. **Eliminar.** Elimino un gasto con confirmación; se borran también sus pagos.

Fuera de alcance: frecuencias distintas a mensual, recordatorios fuera de la app, gráficas, editar o borrar categorías creadas, adjuntar comprobantes, uso sin conexión.

## Modelo de datos

```
users/{uid}/recurring/{id}
  name: string            // 1–60 caracteres
  type: 'fixed' | 'subscription'
  category: string        // nombre de la categoría
  amount: number          // centavos, entero > 0
  dayOfMonth: number      // 1–31, se toma de la fecha del primer pago
  nextDue: string         // 'YYYY-MM-DD'
  active: boolean
  createdAt: Timestamp

users/{uid}/recurring/{id}/payments/{paymentId}
  dueDate: string         // 'YYYY-MM-DD' del periodo pagado
  paidAt: Timestamp
  amount: number          // centavos; el monto del gasto al pagar

users/{uid}/categories/{id}
  name: string            // solo categorías creadas por el usuario
```

Las categorías por defecto viven en el código, no en Firestore. Las fechas sin hora se comparan en la zona horaria del dispositivo.

## Rutas y UI

| Ruta | Pantalla |
|---|---|
| `/gastos-fijos` | Tarjeta morada con el total mensual; lista de activos por fecha; sección "Pausados"; botón "Agregar" |
| `/gastos-fijos/nuevo` | Formulario de alta |
| `/gastos-fijos/:id` | Edición, pausar/reactivar, eliminar e historial de pagos |

- La barra inferior marca "Gastos" también en las subrutas y el título del header se resuelve por prefijo de ruta.
- Monto con `inputmode="decimal"`; fecha con `<input type="date">`; categoría con `<select>` que incluye "Nueva categoría…".
- Lectura en tiempo real con `onSnapshot`; las tarjetas siguen el estilo de `core`.

## Estructura

```
src/recurring/
  dates.ts            → nextDueAfter, status (vencido/pronto/al día), monthlyTotal, today()
  dates.test.ts
  categories.ts       → lista por defecto + hook que mezcla las del usuario
  api.ts              → lecturas y escrituras de Firestore (alta, edición, pagar, pausar, eliminar)
  RecurringForm.tsx   → formulario controlado con validación; recibe onSubmit
  RecurringForm.test.tsx
  RecurringList.tsx   → página /gastos-fijos
  RecurringDetail.tsx → página /gastos-fijos/:id
```

## Code Style

Igual que `SPEC-core.md`. La lógica de fechas y montos va en funciones puras sin Firestore, para probarla sin emulador:

```ts
// '2026-01-31' con día 31 → '2026-02-28'
export function nextDueAfter(due: string, dayOfMonth: number): string
```

## Testing Strategy

- **Unit (`dates.test.ts`):** avance de mes con fin de mes (31 → feb, 30 → feb en año bisiesto), cambio de año (dic → ene), estado vencido / pronto (límite de 7 días y hoy) / al día, total mensual ignorando pausados.
- **Componente (`RecurringForm.test.tsx`):** rechaza nombre vacío, monto inválido o cero y fecha vacía con mensajes visibles; envía los datos en centavos y con `dayOfMonth` correcto.
- **Reglas:** se agregan casos para `payments` y `categories` (dueño sí, otro no); las reglas actuales ya los cubren.
- Revisión visual a 360 px con datos reales y con datos extremos (nombres largos, montos de 7 cifras, lista vacía).

## Boundaries

- **Always:** montos en centavos; pagar = escritura atómica (`writeBatch`); validar el formulario antes de escribir; confirmar antes de eliminar.
- **Ask first:** cambiar `firestore.rules`; agregar dependencias; cambiar el modelo de datos.
- **Never:** guardar montos con decimales; borrar un gasto sin confirmación; dejar pagos huérfanos al eliminar.

## Success Criteria

1. Puedo crear, editar, pausar, reactivar y eliminar un gasto en https://finanzasd.vercel.app desde el celular.
2. El total mensual coincide con la suma de los gastos activos.
3. "Pagar" agrega el pago al historial y mueve la fecha al mes siguiente, respetando fin de mes.
4. Los gastos vencidos y los que vencen en ≤ 7 días se distinguen a simple vista.
5. `npm run lint`, `npm test`, `npm run test:rules` y `npm run build` pasan.

## Open Questions

1. ¿"Pagar" debe permitir cambiar el monto de ese pago (p. ej. la luz varía cada mes) o siempre registra el monto del gasto? Propuesta: siempre el del gasto; si varía, editas el gasto antes de pagar.
2. ¿Pagar un gasto vencido de hace 2 meses debe avanzar solo un mes (quedando aún vencido) o saltar hasta el próximo futuro? Propuesta: un mes por pago, para que el historial refleje cada periodo.

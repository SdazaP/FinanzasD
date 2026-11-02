# Capability Map: Finanzas personales

App web mobile-first para una sola persona. Moneda única: MXN.
Stack: React + Vite, Firebase (Auth + Firestore), hosting en Vercel, repo en GitHub (`https://github.com/SdazaP/FinanzasD`).

| Módulo | Estado | Responsabilidad | Depende de |
|---|---|---|---|
| `core` | Listo | Proyecto base, login con Google, layout móvil, navegación, reglas de Firestore, deploy | — |
| `recurring` | Listo | Gastos fijos y suscripciones (campo `tipo`): monto, próximo pago, pagos, pausa | core |
| `credits` | Listo | Tarjetas y compras a MSI: saldo, cuotas, pagos, liquidados | core |
| `savings` | Listo | Apartados con o sin meta, aportes y retiros | core |
| `investments` | **Pospuesto** | Inversiones: aportado, valor actual (manual), ganancia/pérdida. Hoy la sección muestra "Estamos trabajando en esto." | core |
| `dashboard` | Listo (sin inversiones) | Compromisos del mes, próximos pagos, saldos y metas | recurring, credits, savings (investments cuando exista) |

Orden de construcción: core → recurring, credits, savings, investments (cualquier orden) → dashboard

## Iteración 2: disponible, gastos hormiga y estado de pago

| Módulo | Estado | Responsabilidad | Depende de |
|---|---|---|---|
| `month-context` | Listo | Encabezado con el mes en curso y la fecha de hoy en todas las secciones | core |
| `paid-status` | Listo | Gastos fijos y créditos agrupados en "Por pagar" y "Pagado este mes"; "Pagar" solo si falta pagar este mes | recurring, credits |
| `spending` | Listo | Gastos discrecionales/hormiga: monto, fecha, categoría, nota; total del mes y tope mensual opcional; sin botón Pagar | core |
| `money` | Listo | Cuentas con saldo e ingresos del mes; pagos, gastos hormiga y aportes a ahorro restan de una cuenta; disponible total y "te queda este mes" (disponible − pendiente del mes) | recurring, credits, savings, spending |
| `alerts` | Pendiente | Campana de avisos en la barra superior: disponible negativo, no alcanza para el mes, tope de gastos hormiga (80% y 100%), gastos sobre un % del ingreso; ocultar por mes | money, spending, dashboard |

Orden: month-context → paid-status, spending (cualquier orden) → money → alerts

Specs: `SPEC-<módulo>.md` en la raíz.

Fuera de alcance: importar extractos bancarios, gráficas avanzadas, gastos variables por categoría, presupuestos, notificaciones push/correo, multi-moneda, precios automáticos.

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
| `alerts` | Listo | Campana de avisos en la barra superior: disponible negativo, no alcanza para el mes, tope de gastos hormiga (80% y 100%), gastos sobre un % del ingreso; ocultar por mes | money, spending, core |

Orden: month-context → paid-status, spending (cualquier orden) → money → alerts

## Iteración 3: créditos por mes y tarjetas de crédito (aprobada)

| Módulo | Estado | Responsabilidad | Depende de |
|---|---|---|---|
| `monthly-payment` | Listo | Un pago por mes en Créditos: MSI paga exactamente la cuota del mes (no se adelantan ni juntan meses); tarjeta, un solo pago por mes del monto que elijas | credits, paid-status |
| `credit-cards` | Pendiente | Tarjetas de crédito como tipo de cuenta en Cuentas, con límite, deuda y disponible; las tarjetas de Créditos se mudan ahí; Créditos las paga desde una cuenta de débito; los selectores "Desde" pueden cargar a una tarjeta (sube su deuda); cada MSI se liga a una tarjeta y lo que falta cuenta como crédito usado | money, credits, monthly-payment, alerts |

Orden: monthly-payment → credit-cards

Specs: `SPEC-<módulo>.md` en la raíz.

Fuera de alcance: importar extractos bancarios, gráficas avanzadas, gastos variables por categoría, presupuestos, notificaciones push/correo, multi-moneda, precios automáticos.

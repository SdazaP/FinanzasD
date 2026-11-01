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

Specs: `SPEC-<módulo>.md` en la raíz.

Fuera de alcance: importar extractos bancarios, gráficas avanzadas, gastos variables por categoría, presupuestos, notificaciones push/correo, multi-moneda, precios automáticos.

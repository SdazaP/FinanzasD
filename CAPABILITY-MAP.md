# Capability Map: Finanzas personales

App web mobile-first para una sola persona. Moneda única: MXN.
Stack: React + Vite, Firebase (Auth + Firestore), hosting en Vercel, repo en GitHub (`https://github.com/SdazaP/FinanzasD`).

| Módulo | Responsabilidad | Depende de |
|---|---|---|
| `core` | Proyecto base, login con Google, layout móvil, navegación, reglas de Firestore, deploy | — |
| `recurring` | Gastos fijos y suscripciones (campo `tipo`): monto, frecuencia, próximo pago, activo | core |
| `credits` | Créditos: saldo, cuota, tasa, plazo, fechas de pago, registro de pagos | core |
| `savings` | Metas de ahorro y aportes | core |
| `investments` | Inversiones: aportado, valor actual (manual), ganancia/pérdida | core |
| `dashboard` | Resumen del mes y próximos vencimientos | recurring, credits, savings, investments |

Orden de construcción: core → recurring, credits, savings, investments (cualquier orden) → dashboard

Specs: `SPEC-<módulo>.md` en la raíz.

Fuera de alcance: importar extractos bancarios, gráficas avanzadas, gastos variables por categoría, presupuestos, notificaciones push/correo, multi-moneda, precios automáticos.

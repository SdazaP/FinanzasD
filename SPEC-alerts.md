# Spec: alerts

**Estado:** aprobado (incluye la frecuencia de cobro configurable).

Avisos dentro de la app (ver `CAPABILITY-MAP.md`, iteración 2). Depende de `money` (disponible y "te queda este mes"), `spending` (gastado y tope) y `core` (barra superior, donde viven los avisos).

## Objetivo

Que la app me diga, sin tener que hacer cuentas, cuándo voy mal: si ya no tengo dinero, si lo que tengo no alcanza para lo que me falta pagar este mes, si me estoy acercando a mi tope de gastos hormiga o si estoy gastando una parte demasiado grande de lo que gano.

## Decisiones (respuestas a las preguntas abiertas)

1. **Mi sueldo llega 1 o 2 días antes o después del inicio del mes**, así que el dinero que tengo hoy ya es el de este mes. Por eso:
   - **"Te queda este mes" cambia de fórmula** (cambio en `money`): `disponible − pendiente del mes`. Lo que ya pagué, gasté o aparté desde una cuenta ya salió del disponible, y no depende de la fecha del ingreso.
   - Límite conocido: si el sueldo del mes siguiente llega antes (p. ej. el 29), desde ese día "te queda" ya lo incluye. Es dinero real en tus cuentas, así que se acepta.
   - Para el aviso de % del ingreso, un **"Sueldo"** cuenta para el **mes que empieza en los 3 días siguientes** si llega en los últimos 3 días del mes anterior. Así, el sueldo del 30 de octubre cuenta para noviembre, y el del 2 de noviembre también.
   - Los demás ingresos ("Extra", "Reembolso", "Otro", incluidos los depósitos chicos de cualquier día) cuentan en su mes calendario. Un depósito de $150 el 30 de octubre cuenta para octubre.
2. **Umbral por defecto: 50%** de los ingresos del mes, configurable.
3. **Avisos en la barra superior.**
   - Una campana con el número de avisos activos, visible en todas las secciones.
   - Al tocarla, un panel con la lista.
   - Cada aviso se puede **ocultar por el resto del mes**, y además desaparece solo cuando su condición deja de cumplirse.
4. **Frecuencia de cobro configurable:** **Mensual** (por defecto) o **Quincenal**.
   - La regla de los 3 días vale para las dos: el pago de fin de mes cuenta para el mes siguiente, y el de quincena (alrededor del 15) se queda en su mes.
   - **Quincenal, antes de la segunda quincena:** a mitad de mes solo tienes la mitad del sueldo. Para no dar falsas alarmas, mientras solo haya llegado un "Sueldo" en el mes se suma una **segunda quincena esperada**, igual al último "Sueldo" registrado:
     - en "te queda este mes", que muestra la nota "incluye tu segunda quincena esperada ($X)";
     - en los ingresos del aviso de %.
   - Al registrar el segundo "Sueldo" del mes, la estimación desaparece y se usa el real.
   - Mensual: nada se estima.

## Supuestos

1. Solo dentro de la app: nada de notificaciones push ni correos.
2. Los avisos se **calculan en el momento** con los datos de la app. Solo se guardan las preferencias (% y frecuencia de cobro) y los avisos ocultos del mes.
3. "Gastos del mes" para el aviso de % del ingreso = **pagado + pendiente del mes + gastos hormiga**. Los aportes a ahorro no cuentan como gasto.
4. Hoy cobras una vez al mes, alrededor del día 1: es el valor por defecto.
5. Solo los ingresos con concepto "Sueldo" cuentan para estimar la segunda quincena; "Extra", "Reembolso" y "Otro" se suman tal cual.

## Criterios de aceptación

1. **Disponible negativo.** Si el disponible total es menor a $0, aviso rojo "Tu disponible está en −$X". Lleva a Cuentas.
2. **No alcanza para el mes.** Si "te queda este mes" (disponible − pendiente, más la segunda quincena esperada si cobras por quincena) es menor a $0, aviso rojo "Te faltan $X para cubrir lo que te queda por pagar este mes". Lleva a Gastos fijos.
3. **Tope de gastos hormiga** (solo si hay tope):
   - del 80% hasta antes del 100%: aviso amarillo "Llevas el N% de tu tope de gastos hormiga; te quedan $X";
   - al llegar al 100% o más: aviso rojo "Te pasaste del tope de gastos hormiga por $X" (o "Llegaste a tu tope" si es exacto);
   - lleva a Gastos hormiga, donde la tarjeta del mes muestra el mismo texto bajo la barra.
4. **Gastos sobre un % del ingreso** (solo si hay ingresos que cuenten para el mes):
   - si los gastos del mes superan el % elegido (50% por defecto), aviso amarillo "Tus gastos del mes son el N% de tus ingresos";
   - si superan el 100%, el aviso es rojo;
   - lleva a Cuentas.
5. **Campana en la barra superior.**
   - Ícono de campana junto al mes, en todas las secciones.
   - Si hay avisos, muestra un globo con el número (rojo si alguno es rojo, amarillo si no). Sin avisos, la campana va sin número.
   - Al tocarla se abre un panel con los avisos: primero los rojos, después los amarillos, con un máximo de 4 (uno por tipo).
   - Cada aviso es un enlace a su pantalla y tiene un botón **"Ocultar este mes"**.
   - El panel se cierra con el botón de cerrar, con Escape o al tocar fuera.
6. **Ocultar.**
   - Un aviso oculto no cuenta en la campana hasta el mes siguiente.
   - Si sube de nivel (de amarillo a rojo), vuelve a aparecer.
   - En el panel, "Mostrar ocultos (N)" los lista y permite volver a mostrarlos.
7. **Configuración en Cuentas** (tarjeta "Preferencias"):
   - "Cobro": selector **Mensual | Quincenal** (Mensual por defecto). Cambiarlo actualiza "te queda este mes" y los avisos al instante.
   - "Avisarme si gasto más del 50% de mis ingresos": cambiar el % (entre 1 y 100) o desactivar este aviso.
8. **Sin cuentas.** Los avisos 1, 2 y 4 no aparecen; el 3 sí.
9. **Accesibilidad.**
   - La campana tiene el nombre "Avisos, N activos".
   - Cada aviso lleva un ícono y la palabra "Urgente" o "Atención", así que no depende solo del color.
   - El panel recibe el foco al abrirse y lo devuelve a la campana al cerrarse.

Fuera de alcance:
- notificaciones push o por correo;
- historial de avisos;
- avisos de pagos próximos (ya están en "Próximos pagos" de Inicio);
- avisos por cuenta individual en negativo (ya se ve en rojo en Cuentas).

## Modelo de datos

```
users/{uid}/settings/alerts
  expenseRatioPct?: number          // 1–100; ausente = 50
  expenseRatioOff?: true            // aviso 4 desactivado
  hidden?: { [alertKey]: 'YYYY-MM' } // alertKey = tipo + nivel, p. ej. 'cap-red'; vale para ese mes

users/{uid}/settings/money          // ya existe (defaultAccountId)
  payFrequency?: 'monthly' | 'biweekly' // ausente = 'monthly'
```

Sin cambios de reglas: `users/{uid}/**` ya lo cubre.

## Estructura

```
src/alerts/
  calc.ts, calc.test.ts     → buildAlerts(datos) → [{ key, level, text, href }]; incomeMonth(fecha) para la regla de 3 días
  PreferencesCard.tsx (+ test) → cobro mensual/quincenal y % del ingreso, en Cuentas
  api.ts                    → watchAlertSettings, setExpenseRatio, hideAlert, showAlert
  useAlerts.ts              → reúne useAccounts, useMonthMoney, gasto hormiga y tope; filtra los ocultos
  AlertBell.tsx (+ test)    → campana, globo y panel

Cambios:
  money/calc.ts             → leftThisMonth = disponible − pendiente (y sus tests)
  money/useMonthMoney.ts    → ingresos con la ventana de 3 días; segunda quincena esperada; deja de necesitar ahorro neto
  money/calc.ts             → expectedSecondHalf(ingresos del mes, frecuencia)
  money/api.ts              → watchPayFrequency, setPayFrequency
  layout/AppLayout.tsx      → campana en la barra superior
  spending/SpendingList.tsx → texto del aviso bajo la barra del tope
  money/AccountsPage.tsx    → tarjeta de preferencias; nota de la quincena esperada
```

`buildAlerts` es una función pura: toda la lógica de umbrales se prueba ahí.

## Testing Strategy

- **Unit (`alerts/calc.test.ts`):**
  - límites de cada regla: disponible −1¢ / 0; te queda −1¢ / 0;
  - tope al 79.9%, 80%, 100% exacto y 120%;
  - % del ingreso por debajo, igual y por encima del umbral, sin ingresos y desactivado;
  - ventana de ingresos: un "Sueldo" del 28 de octubre cuenta para octubre; uno del 29 o 30 de octubre o del 2 de noviembre cuenta para noviembre; un "Extra" del 30 de octubre cuenta para octubre;
  - quincenal: con un solo "Sueldo" en el mes se suma la segunda quincena esperada; con dos, no; mensual nunca estima; "Extra" no cuenta para estimar;
  - ocultos del mes pasado vuelven a aparecer; un oculto en amarillo reaparece al pasar a rojo;
  - sin cuentas; orden rojo → amarillo.
- **Money:** `leftThisMonth` con la nueva fórmula; actualizar los tests de Cuentas e Inicio.
- **Componentes:**
  - la campana muestra el número correcto y su nombre accesible;
  - el panel abre y cierra (incluso con Escape), enlaza, oculta y vuelve a mostrar;
  - la tarjeta de Gastos hormiga muestra el aviso;
  - la configuración valida el rango 1–100.
- **Reglas:** agregar `settings/alerts`.
- **Regresión:** los 153 tests actuales siguen en verde.
- **Revisión a 360 px:** campana con globo de 2 dígitos y el panel con 4 avisos y montos grandes.

## Boundaries

- **Always:** centavos; porcentajes redondeados hacia abajo al mostrarlos (79.9% se muestra como 79% y no da aviso); textos completos en español.
- **Ask first:** notificaciones fuera de la app; nuevas dependencias.
- **Never:** escribir saldos ni registros desde la lógica de avisos; avisos que solo se distingan por color.

## Success Criteria

1. Con mis datos reales, "te queda este mes" deja de salir negativo: es mi disponible menos lo que me falta pagar.
2. Con un tope de gastos hormiga, la campana muestra 1 al llegar al 80%, y el aviso pasa a rojo al pasarlo.
3. Oculto un aviso y la campana baja a 0 hasta el mes siguiente.
4. Cambio el % o la frecuencia de cobro en Cuentas y los avisos y "te queda este mes" se actualizan al instante.
5. Lint, tests, tests de reglas y build pasan.

## Open Questions

Ninguna.

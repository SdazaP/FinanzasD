# FinanzasD

App web personal, pensada primero para el celular, para llevar tus finanzas en pesos mexicanos (MXN). En un solo lugar ves cuánto dinero tienes, qué te toca pagar este mes y cuánto te queda. Se puede instalar en el celular como app y funciona sin conexión.

Publicada en <https://finanzasd.vercel.app>.

## Características

- **Inicio:** compromisos del mes (pagado y pendiente), próximos pagos, saldos, metas de ahorro, tu disponible y lo que te queda este mes.
- **Gastos fijos y suscripciones:** próximo pago, "Por pagar" y "Pagado este mes", e historial con el mes de cada pago.
- **Gastos hormiga:** registro rápido por categoría y tope mensual opcional. Un gasto con fecha de un mes anterior queda como historial y no mueve saldos.
- **Historial:** calendario por mes con lo gastado cada día y el detalle de cada día. Incluye gastos hormiga, gastos fijos, créditos y gastos planeados.
- **Créditos:**
  - tarjetas de crédito y compras a meses sin intereses (MSI);
  - un pago por mes, y en MSI exactamente la cuota del mes;
  - cada MSI se puede ligar a una tarjeta.
- **Cuentas:**
  - cuentas de débito, efectivo u otras, con su saldo e ingresos del mes;
  - tarjetas de crédito con límite, deuda y crédito disponible;
  - cada pago, gasto o aporte se descuenta de la cuenta o tarjeta que elijas.
- **Ahorro:** apartados con meta y fecha, con cuánto ahorrar al mes, y gastos planeados que se pagan con lo apartado.
- **Avisos:**
  - una campana con aviso si tu disponible es negativo, si no te alcanza para el mes o si llegas al tope de gastos hormiga;
  - también si tus gastos pasan de un porcentaje de tus ingresos, o si una tarjeta está cerca de su límite;
  - cada aviso se puede ocultar por el resto del mes.
- **App instalable (PWA):** se instala desde Chrome, abre sin conexión y te avisa cuando hay una versión nueva. Lo que registras sin conexión se sube al volver la señal.
- **Modo oscuro**, según la configuración de tu sistema.

## Tecnologías

- **Interfaz:** React 19, TypeScript, Vite, React Router y Tailwind CSS 4.
- **Datos e inicio de sesión:** Firebase (Firestore con caché local e inicio de sesión con Google).
- **Pruebas y calidad:** Vitest con Testing Library; `@firebase/rules-unit-testing` para las reglas; oxlint para el lint.
- **Hosting:** Vercel.

## Requisitos

- **Node.js** `^20.19.0` o `>=22.12.0`, que es lo que exige Vite.
- **Un proyecto de Firebase**, con Firestore y el inicio de sesión con Google activados.
- **Solo para los tests de reglas:**
  - la [Firebase CLI](https://firebase.google.com/docs/cli) (`firebase-tools`);
  - Java, para el emulador de Firestore.

## Instalación

```bash
git clone https://github.com/SdazaP/FinanzasD.git
cd FinanzasD
npm install
```

Copia `.env.example` a `.env.local` y rellena los valores (ver [Configuración](#configuración)). Después:

```bash
npm run dev
```

La app queda en `http://localhost:5173`. En desarrollo el service worker no se registra; para probarlo, usa la versión de producción:

```bash
npm run build
```

```bash
npm run preview
```

## Configuración

### Variables de entorno

Van en `.env.local`, que git ignora.

| Variable | Qué es |
|---|---|
| `VITE_FIREBASE_API_KEY` | Configuración web de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Configuración web de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Configuración web de Firebase |
| `VITE_FIREBASE_APP_ID` | Configuración web de Firebase |
| `VITE_OWNER_UID` | uid de tu cuenta de Google en Firebase Auth; aparece después del primer inicio de sesión |

Los cuatro primeros valores los da:

```bash
firebase apps:sdkconfig WEB --project <tu-proyecto>
```

### La app es de un solo usuario

Las reglas de Firestore (`firestore.rules`) solo dejan leer y escribir a un uid fijo, y solo dentro de `users/{uid}`. Si usas tu propio proyecto de Firebase:
1. cambia ese uid en `firestore.rules`;
2. publica las reglas:

```bash
firebase deploy --only firestore:rules
```

## Estructura del proyecto

```
src/
  auth/        Inicio de sesión con Google y protección de rutas
  layout/      Encabezado (fecha, mes, historial, campana) y barra inferior
  dashboard/   Inicio
  recurring/   Gastos fijos y suscripciones
  spending/    Gastos hormiga
  history/     Calendario mensual de gastos
  credits/     Tarjetas de crédito y MSI
  money/       Cuentas, ingresos, disponible y "te queda este mes"
  savings/     Apartados y gastos planeados
  alerts/      Avisos y preferencias
  pwa/         Instalación, aviso de versión nueva y aviso sin conexión
  lib/         Fechas, dinero, saldos, guardado sin conexión y componentes compartidos
public/        Ícono, manifest y service worker (sw.js)
tests/rules/   Tests de las reglas de Firestore
SPEC-*.md      Especificación de cada módulo
CAPABILITY-MAP.md   Módulos de la app, su estado y sus dependencias
```

## Pruebas

Tests unitarios y de componentes:

```bash
npm test
```

Tests de las reglas de Firestore (levanta el emulador; necesita la Firebase CLI y Java):

```bash
npm run test:rules
```

Lint:

```bash
npm run lint
```

Tipado y build de producción:

```bash
npm run build
```

## Despliegue

Vercel publica `main` automáticamente. `vercel.json`:
- manda todas las rutas a `index.html`, porque es una SPA;
- sirve `sw.js` sin caché, para que las actualizaciones lleguen.

Las variables de entorno se configuran también en el proyecto de Vercel.

## Licencia

<!-- TODO: confirmar --> El repositorio no incluye un archivo `LICENSE`.

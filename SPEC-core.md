# Spec: core

Módulo base de la app de finanzas personales (ver `CAPABILITY-MAP.md`).

## Objetivo

Dejar lista la base sobre la que se construyen los demás módulos: una app web mobile-first, accesible solo para su dueño, publicada en Vercel y versionada en GitHub.

Usuario: una sola persona (el dueño), principalmente desde el celular.

Historias:
- Como dueño, entro con mi cuenta de Google y veo la app; cualquier otra cuenta ve "Acceso no autorizado" y no puede leer ni escribir datos.
- Como dueño, navego entre secciones con una barra inferior usable con el pulgar.
- Como dueño, abro la URL de Vercel desde el celular y la app carga y funciona.

## Tech Stack

- React 19 + Vite + TypeScript
- React Router (navegación)
- Firebase JS SDK: Auth (proveedor Google) + Firestore
- Tailwind CSS v4 (plugin `@tailwindcss/vite`)
- Vitest + Testing Library (unit/componentes)
- oxlint (lint, viene con la plantilla de Vite)
- Firebase Emulator Suite + `@firebase/rules-unit-testing` (reglas de Firestore)
- Node 22, npm, Git + GitHub, Vercel

## Commands

```
Instalar:        npm install
Dev:             npm run dev
Build:           npm run build
Lint:            npm run lint
Tests:           npm test
Tests de reglas: npm run test:rules        # levanta el emulador de Firestore y corre tests/rules
Deploy reglas:   npx firebase deploy --only firestore:rules
Deploy app:      automático en Vercel al hacer push a main
```

## Project Structure

```
src/
  main.tsx            → punto de entrada, router
  firebase.ts         → init de Firebase (lee VITE_FIREBASE_*)
  auth/               → AuthProvider, RequireAuth, pantalla de login
  layout/             → AppLayout con barra de navegación inferior
  lib/money.ts        → formateo y conversión de montos MXN
  pages/              → una página por sección (placeholders en core)
tests/rules/          → tests de firestore.rules contra el emulador
firestore.rules       → reglas de seguridad
firebase.json         → config de emulador y deploy de reglas
vercel.json           → rewrite SPA a index.html
.env.example          → nombres de las variables VITE_FIREBASE_* y VITE_OWNER_UID, sin valores
CAPABILITY-MAP.md, SPEC-*.md → specs
```

Los tests de componentes y de `lib` van junto al archivo: `money.test.ts`.

## Modelo de datos (contrato para los demás módulos)

- Todo dato vive bajo `users/{uid}/<colección>`; cada módulo define su colección en su spec.
- Montos: enteros en **centavos** (`amount: 12350` = $123.50 MXN). Nunca floats.
- Fechas: `Timestamp` de Firestore; fechas sin hora (vencimientos) como string `YYYY-MM-DD`.
- `src/lib/money.ts` expone `toCents(text)` y `formatMXN(cents)` (usa `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`).

## Code Style

TypeScript estricto, componentes funcionales, nombres en inglés en el código y textos de la UI en español.

```tsx
// src/lib/money.ts
const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export const formatMXN = (cents: number) => mxn.format(cents / 100)

export function toCents(text: string): number | null {
  const n = Number(text.replace(/[$,\s]/g, ''))
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}
```

- Un componente por archivo, `PascalCase.tsx`; utilidades en `camelCase.ts`.
- Sin estado global extra: `AuthProvider` (Context) y lecturas de Firestore en cada página.
- Mobile first con Tailwind: clases base para ~360 px, prefijos `md:` solo para ampliar. Sin CSS propio salvo `src/index.css` (`@import "tailwindcss"`).
- Accesibilidad: botones y enlaces reales, `label` en cada input, objetivos táctiles ≥ 44 px, contraste AA.

## Testing Strategy

- **Reglas de Firestore (obligatorio):** el dueño lee y escribe en `users/{su uid}/**`; un usuario autenticado distinto y uno anónimo reciben `permission-denied` en lectura y escritura.
- **Unit:** `money.ts` (formato, centavos, entradas inválidas).
- **Componentes:** `RequireAuth` muestra login sin sesión, "Acceso no autorizado" con otro uid y el contenido con el uid del dueño (Firebase Auth mockeado).
- Sin meta de cobertura numérica; toda lógica con ramas lleva test.

## Boundaries

- **Always:** correr `npm run lint`, `npm test` y `npm run build` antes de cada commit; commits pequeños con mensajes en formato Conventional Commits; montos en centavos; validar entradas de formularios.
- **Ask first:** agregar dependencias; cambiar `firestore.rules`; cambiar el modelo de datos; crear el repo en GitHub o el proyecto en Vercel/Firebase; hacer push.
- **Never:** commitear `.env.local` ni credenciales; desactivar reglas de seguridad (ni "modo prueba"); borrar o saltar tests para que pasen; usar floats para dinero.

## Success Criteria

1. `npm run build`, `npm run lint`, `npm test` y `npm run test:rules` pasan.
2. Login con la cuenta de Google del dueño muestra la app; otra cuenta ve "Acceso no autorizado".
3. Los tests de reglas prueban que solo el uid del dueño accede a `users/{uid}/**`, y las reglas están desplegadas en Firebase.
4. La app está publicada en Vercel; recargar una ruta interna (p. ej. `/creditos`) no da 404.
5. En un viewport de 360 px no hay scroll horizontal y la barra inferior navega a las 5 secciones (Inicio, Gastos fijos, Créditos, Ahorro, Inversiones).
6. El código está en GitHub, rama `main`, sin `.env.local` en el historial.

## Open Questions

1. Firebase: uso el MCP de Firebase para crear el proyecto, registrar la app web, obtener la config y desplegar reglas (cada acción con tu permiso). Activar el proveedor Google en Auth se hace en la consola si el MCP no lo permite.
2. ~~GitHub~~ Resuelto: repo `https://github.com/SdazaP/FinanzasD` (ya tiene `README.md` en `main`; se trae con `git pull` antes del primer commit).
3. El uid del dueño se fija en `firestore.rules` y en `VITE_OWNER_UID`; lo obtenemos tras tu primer login.

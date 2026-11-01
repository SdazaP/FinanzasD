# Tareas: core

- [x] 1. Conectar con GitHub y commitear specs
  - Acceptance: `git init`, remoto `origin` = `https://github.com/SdazaP/FinanzasD.git`, `main` trae el README remoto; `.gitignore` (node_modules, dist, .env*.local, emulador); commit `docs: add capability map and core spec`; push con tu permiso.
  - Verify: `git log --oneline` muestra el commit del README y el de las specs; `git status` limpio.
  - Files: `.gitignore`, `CAPABILITY-MAP.md`, `SPEC-core.md`, `tasks/*`

- [x] 2. Scaffold: Vite + React + TS + Tailwind + Vitest + oxlint
  - Acceptance: plantilla `react-ts` de Vite, Tailwind v4 con `@tailwindcss/vite`, Vitest + Testing Library con entorno jsdom, scripts `dev/build/lint/test`; página de inicio con un texto estilado por Tailwind y un test que la renderiza.
  - Verify: `npm run lint && npm test && npm run build` pasan; `npm run dev` muestra la página.
  - Files: `package.json`, `vite.config.ts`, `src/index.css`, `src/App.tsx`, `src/App.test.tsx` (más los que genera la plantilla)

- [x] 3. Utilidades de dinero
  - Acceptance: `formatMXN(12350)` → `$123.50`; `toCents('1,234.5')` → `123450`; texto inválido o negativo → `null`.
  - Verify: `npm test`
  - Files: `src/lib/money.ts`, `src/lib/money.test.ts`

- [x] 4. Proyecto Firebase y conexión
  - Acceptance: proyecto y app web creados (MCP o consola, con tu permiso); Auth con proveedor Google activo; Firestore creado en modo producción; `src/firebase.ts` lee `import.meta.env.VITE_FIREBASE_*`; `.env.example` sin valores y `.env.local` con valores, no commiteado.
  - Verify: `npm run build` pasa; `git status` no lista `.env.local`.
  - Files: `src/firebase.ts`, `.env.example`, `.env.local`, `package.json`

- [x] 5. Login con Google y guarda de acceso
  - Acceptance: `AuthProvider` expone el usuario; `RequireAuth` muestra login sin sesión, "Acceso no autorizado" (con botón de salir) si `uid !== VITE_OWNER_UID`, y el contenido si coincide; la pantalla de acceso muestra tu uid para copiarlo.
  - Verify: `npm test` (3 casos de `RequireAuth` con Auth mockeado); login manual en `npm run dev`.
  - Files: `src/auth/AuthProvider.tsx`, `src/auth/RequireAuth.tsx`, `src/auth/RequireAuth.test.tsx`, `src/auth/LoginPage.tsx`, `src/main.tsx`

- [ ] 6. Reglas de Firestore con tests
  - Acceptance: solo `request.auth.uid == '<tu uid>' && uid == request.auth.uid` lee/escribe `users/{uid}/**`; todo lo demás denegado; script `test:rules` corre el emulador y los tests; reglas desplegadas con tu permiso.
  - Verify: `npm run test:rules` (dueño permitido; otro usuario y anónimo denegados en lectura y escritura).
  - Files: `firestore.rules`, `firebase.json`, `.firebaserc`, `tests/rules/firestore.test.ts`, `package.json`

- [ ] 7. Layout móvil y navegación
  - Acceptance: React Router con 5 rutas (`/`, `/gastos-fijos`, `/creditos`, `/ahorro`, `/inversiones`); barra inferior fija con enlaces de ≥ 44 px y estado activo; páginas placeholder con su título; sin scroll horizontal a 360 px.
  - Verify: `npm test` (la barra navega entre rutas); revisión visual a 360 px.
  - Files: `src/layout/AppLayout.tsx`, `src/layout/AppLayout.test.tsx`, `src/pages/*.tsx`, `src/main.tsx`

- [ ] 8. Deploy en Vercel
  - Acceptance: `vercel.json` con rewrite a `index.html`; repo importado en Vercel con las variables `VITE_*`; dominio de Vercel en dominios autorizados de Firebase Auth; push a `main` despliega.
  - Verify: la URL pública carga en el celular, el login funciona, recargar `/creditos` no da 404; todos los criterios de `SPEC-core.md` cumplidos.
  - Files: `vercel.json`

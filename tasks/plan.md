# Plan: core

Implementa `SPEC-core.md`. Tareas en `tasks/todo.md`.

## Componentes y dependencias

```
git + repo ─→ scaffold (Vite/TS/Tailwind/Vitest/ESLint) ─┬─→ money.ts
                                                          ├─→ Firebase (proyecto + firebase.ts) ─→ auth ─→ reglas + tests ─┐
                                                          └─→ layout + router + páginas ─────────────────────────────────────┴─→ Vercel
```

## Orden

1. Git: conectar la carpeta al repo de GitHub y commitear las specs.
2. Scaffold del proyecto con todas las herramientas de verificación.
3. `money.ts` (sin dependencias de Firebase).
4. Proyecto Firebase vía MCP + `firebase.ts` + variables de entorno.
5. Login con Google + `RequireAuth`. Aquí obtenemos tu uid.
6. Reglas de Firestore con tests en emulador; desplegarlas.
7. Layout móvil, router y las 5 páginas placeholder.
8. Deploy en Vercel y verificación final de los criterios de éxito.

Las tareas 3 y 7 no dependen de Firebase y pueden adelantarse si el paso 4 se bloquea.

## Checkpoints (paro y te muestro)

- Tras 2: `npm run dev` abre la app; lint, test y build en verde.
- Tras 5: inicias sesión y me pasas el uid que muestra la app.
- Tras 6: tests de reglas en verde; despliegue de reglas con tu permiso.
- Tras 8: revisas la URL de Vercel en el celular.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El MCP de Firebase no carga en la sesión | Crear proyecto y app web en la consola; tú me pasas la config |
| Login con Google falla en Vercel (`auth/unauthorized-domain`) | Agregar el dominio de Vercel en Firebase Auth → dominios autorizados |
| Popup de Google bloqueado en iOS Safari | Usar `signInWithRedirect` en móvil si `signInWithPopup` falla |
| Emulador de Firestore requiere Java | Java 25 ya instalado |
| `.env.local` llega a GitHub | `.gitignore` desde el primer commit; revisar `git status` antes de cada push |
| Conflicto con el `README.md` del repo | `git pull origin main` antes del primer commit local |

## Acciones que te pido antes de hacer

Crear el proyecto de Firebase, instalar dependencias, cada `git push`, desplegar reglas, conectar Vercel.

# Spec: pwa (app instalable y sin conexión)

**Estado:** verificado contra el código y la documentación; pendiente de tu aprobación. El ícono ya está creado (`public/icon.svg`).

## Objetivo

Instalar Finanzas desde Chrome en tu Android, con estas metas:
- abre como app, a pantalla completa y con su ícono;
- carga rápido;
- se puede consultar y registrar sin conexión (lo registrado se sube al volver la señal).

**Usuario:** solo tú, en Android con Chrome.

## Verificación del plan

Esto es lo que revisé, y lo que cambia respecto al plan que te mostré:

| Punto del plan | Resultado | Cambio |
|---|---|---|
| Requisitos de Chrome para instalar | **Bien.** Hacen falta HTTPS (Vercel ya lo da), un manifest con nombre, `start_url`, `display: standalone` e íconos de 192 y 512 px, y un service worker. Hay fuentes que dicen que Chrome ya no exige el fetch handler y otras que sí; el nuestro lo tiene de todos modos por el modo sin conexión. | Ninguno. |
| "Colores claro y oscuro en el manifest" | **Incorrecto.** El manifest admite un solo `theme_color` y un solo `background_color`. | El manifest usa los colores claros; el color oscuro de la barra ya lo da `index.html` con `<meta name="theme-color" media=…>`. |
| Pasos de instalación para iPhone y `apple-touch-icon` | **No aplica:** usas Android. | Se quitan. Se puede agregar después si cambias de celular. |
| Guardar la app con una lista fija de archivos | **No es posible sin un plugin.** Vite les pone un hash al nombre en cada build y no hay lista. Hoy el build es un solo JS y un solo CSS. | El service worker guarda lo que se va cargando: **la app funciona sin conexión después de abrirla una vez con conexión.** |
| `vercel.json` reescribe todo a `index.html` | **Bien.** En Vercel, un archivo que existe se sirve antes que las reescrituras, así que `/sw.js` y `/manifest.webmanifest` no se ven afectados. | Solo se agrega el encabezado `Cache-Control: no-cache` para `sw.js`. |
| Firestore sin conexión | **Bien.** `persistentLocalCache` y `persistentMultipleTabManager` existen en la versión instalada (firebase 12.19.0). | `getFirestore` cambia a `initializeFirestore` con esa caché. |
| PNG del ícono "sin dependencias" | **Posible:** se dibuja el SVG en un canvas del navegador del panel y se guarda el PNG. Pillow (ya instalado en tu Python) no lee SVG. | Es un paso de una sola vez; los PNG quedan en `public/` y no se agrega nada al proyecto. |
| Inicio de sesión con Google en la app instalada | **Riesgo real en Android:** hay reportes de que la redirección se rompe dentro de una app instalada, mientras que la ventana emergente sí funciona. Además, la redirección necesita cookies del dominio `firebaseapp.com`, que Chrome puede bloquear como de terceros. | Se mantiene la ventana emergente (como hoy). Si en tu celular la redirección de respaldo falla, el arreglo es servir `/__/auth/*` desde `finanzasd.vercel.app` con una reescritura a Firebase y usarlo como `authDomain`. **Se hace solo si la prueba falla**, porque requiere tocar la configuración de Firebase y Google Cloud. |
| Fuentes de Google sin conexión | **Faltaba.** Vienen de otro dominio. | El service worker también guarda `fonts.googleapis.com` y `fonts.gstatic.com`. Sin ellas, la app usa la fuente del sistema. |
| Tu foto sin conexión | **Faltaba.** Viene de `googleusercontent.com` y no se guarda. | Sin conexión, la foto puede no verse. Se acepta así. |

Fuentes:
- [web.dev: requisitos de instalación](https://web.dev/articles/install-criteria?hl=es)
- [Taller de PWA: instalación](https://pwa-workshop.js.org/5-pwa-install/)
- [Vercel: configuración y prioridad del sistema de archivos](https://vercel.com/docs/configuration)
- [Firebase: buenas prácticas de redirección](https://firebase.google.com/docs/auth/web/redirect-best-practices?hl=hi)
- [firebaseui-web #522: redirección en PWA](https://github.com/firebase/firebaseui-web/issues/522)
- [firebase-js-sdk #77: autenticación en PWA](https://github.com/firebase/firebase-js-sdk/issues/77)

## Criterios de aceptación

1. **Ícono.**
   - `public/icon.svg` como favicon (reemplaza el rayo de Vite).
   - `icon-192.png`, `icon-512.png` e `icon-maskable-512.png` (fondo morado a todo el borde; la cartera queda dentro de la zona segura del 80%).
2. **Manifest** (`public/manifest.webmanifest`):
   - nombre "Finanzas", `start_url: "/"` y `scope: "/"`;
   - `display: "standalone"`;
   - `theme_color` y `background_color` #f6f6fa;
   - `lang: "es-MX"` y los tres íconos.
   - Enlazado en `index.html`.
3. **Service worker** (`public/sw.js`):
   - **Navegación:** red primero; sin conexión, el `index.html` guardado.
   - **Archivos de `/assets/` y el ícono:** caché primero (llevan hash).
   - **Fuentes de Google:** se muestra lo guardado y se actualiza en segundo plano.
   - **Todo lo demás** (Firebase, Google, fotos) pasa directo, sin guardar.
   - Se registra solo en producción (`import.meta.env.PROD`), para no estorbar al servidor de desarrollo.
4. **Actualización.**
   - Si hay un service worker nuevo esperando, aparece "Hay una versión nueva" con el botón "Actualizar".
   - "Actualizar" lo activa y recarga la página.
   - No recarga sola, para no perder un formulario a medias.
5. **Datos sin conexión.**
   - Firestore con `persistentLocalCache` y `persistentMultipleTabManager`.
   - Sin conexión se ve lo último cargado.
   - Lo que registras sin conexión se sube al volver la señal, con sus saldos (`increment` se aplica en el servidor).
6. **Botón "Instalar app"** en Cuentas → Preferencias:
   - Aparece solo cuando Chrome ofrece la instalación (`beforeinstallprompt`) y la app no está instalada (`display-mode: standalone`).
   - Al tocarlo se abre el aviso de Chrome.
7. **Sin cambios** en datos, reglas, saldos ni flujos actuales.

Fuera de alcance:
- notificaciones push;
- sincronización en segundo plano (Background Sync);
- iPhone;
- atajos del ícono;
- capturas de pantalla para la tienda de apps.

## Commands

```
Dev:    npm run dev            (sin service worker)
Build:  npm run build
Prueba: npm run preview        (con service worker, para probarlo en local)
Tests:  npm test · npm run test:rules · npm run lint
Deploy: git push a main (Vercel), con tu permiso
```

## Project Structure

```
public/
  icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png
  manifest.webmanifest
  sw.js                       → service worker (JS plano, fuera del build de Vite)
src/
  firebase.ts                 → initializeFirestore con caché local
  main.tsx                    → registra el service worker en producción
  pwa/
    useServiceWorker.ts       → registro y "hay una versión nueva"
    UpdateBanner.tsx (+ test) → aviso de actualización
    useInstallPrompt.ts       → beforeinstallprompt y display-mode
    InstallButton.tsx (+ test)
index.html                    → manifest y favicon nuevos
vercel.json                   → encabezado no-cache para /sw.js
```

## Code Style

Igual que el resto de la app: hooks pequeños, textos en español y un comentario solo donde hace falta explicar el porqué. Ejemplo de la regla del service worker:

```js
// Los archivos con hash no cambian: caché primero. El HTML siempre intenta la red.
if (url.pathname.startsWith('/assets/')) return cacheFirst(request)
```

## Testing Strategy

- **Unit / componentes:**
  - `UpdateBanner` aparece con un service worker en espera y "Actualizar" le avisa que se active;
  - `InstallButton` aparece solo después de `beforeinstallprompt` y no en modo instalado;
  - `firebase.ts` sigue igual para los tests (ya se simula).
- **Sin tests automáticos para `sw.js`.** Es un archivo sin build y probarlo exige un navegador real. Se verifica a mano con `npm run preview` y Chrome DevTools: Application → Manifest sin errores, el service worker activo, y modo sin conexión.
- **Regresión:** los 201 tests y los 49 de reglas siguen en verde.
- **En tu Android**, después del deploy:
  - aparece "Instalar app";
  - la app instalada abre con su ícono;
  - el inicio de sesión funciona dentro de la app instalada;
  - con el modo avión ves tus datos y registras un gasto que se sube al volver la señal;
  - al publicar una versión nueva aparece "Hay una versión nueva".

## Boundaries

- **Always:**
  - el HTML se pide a la red primero;
  - `sw.js` se sirve sin caché;
  - el service worker no guarda respuestas de Firebase ni de autenticación;
  - el service worker se registra solo en producción.
- **Ask first:**
  - agregar `vite-plugin-pwa` u otra dependencia;
  - cambiar `authDomain` o la configuración de Firebase o Google Cloud (solo si falla el inicio de sesión);
  - precargar la app completa.
- **Never:**
  - guardar en caché respuestas autenticadas o de Firestore desde el service worker;
  - recargar la app sola sin tu acción;
  - mantener la app en una versión vieja sin avisar.

## Tareas

- [ ] 1. **Ícono:** favicon nuevo y PNG de 192, 512 y maskable, generados desde el SVG en el navegador del panel.
- [ ] 2. **Manifest y `index.html`:** manifest, favicon y enlace.
  - Verify: DevTools → Manifest sin errores.
- [ ] 3. **Service worker:** `sw.js`, registro en producción y encabezado en `vercel.json`.
  - Verify: `npm run preview` → service worker activo; recargar sin conexión abre la app.
- [ ] 4. **Firestore sin conexión.**
  - Verify: en preview sin conexión se ven Inicio y Cuentas.
- [ ] 5. **"Hay una versión nueva" y "Instalar app"**, con tests.
  - Verify: `npm test`.
- [ ] 6. **Deploy con tu permiso y prueba en tu Android:** instalar, iniciar sesión, modo avión y actualización.

## Open Questions

Ninguna. La única decisión pendiente depende de la prueba en tu celular: si el inicio de sesión falla en la app instalada, te pediré permiso para servir `/__/auth/*` desde tu dominio.

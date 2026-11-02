# Plan: app instalable (PWA)

**Estado:** preguntas respondidas; pendiente de tu aprobación para implementar. Ícono creado.

## Objetivo

Instalar Finanzas desde el navegador del celular ("Agregar a la pantalla de inicio" o "Instalar app") para que:
- abra como una app, a pantalla completa, sin la barra del navegador;
- tenga su propio ícono;
- cargue rápido;
- se pueda consultar aunque no haya conexión.

## Decisiones propuestas

1. **Sin dependencias nuevas.** Las piezas son pocas y caben en archivos propios:
   - un `manifest.webmanifest`;
   - los íconos;
   - un service worker de unas 40 líneas.

   La alternativa es `vite-plugin-pwa` (Workbox), que genera todo esto pero agrega una dependencia y configuración que no necesitamos.
2. **Ícono propio.** El ícono actual es el rayo morado de Vite, que no es de la app. Propongo:
   - un cuadrado morado (#6C5DD3) con esquinas redondeadas y una cartera o una "F" en blanco;
   - un SVG como fuente, del que salen los PNG de 192 y 512 px, la versión "maskable" para Android y los 180 px para iPhone.

   Te muestro el ícono antes de seguir.
3. **Sin conexión, solo lectura.**
   - El service worker guarda la app (HTML, JS, CSS, fuentes e íconos).
   - Firestore guarda tus datos en el celular (`persistentLocalCache`), así que sin conexión ves lo último que cargaste.
   - Lo que registres sin conexión se envía al volver la señal: Firestore ya lo hace.
4. **Actualizaciones.** Cuando publique una versión nueva, la app muestra "Hay una versión nueva · Actualizar" en lugar de quedarse con la vieja.
5. **Botón "Instalar app"** en Cuentas → Preferencias:
   - en Android y en computadora usa el aviso de instalación del navegador;
   - en iPhone muestra los pasos: Compartir → "Agregar a inicio";
   - si ya está instalada, no aparece.

## Riesgos

- **Inicio de sesión con Google en la app instalada.**
  - En iPhone, la ventana emergente puede abrirse fuera de la app y no volver.
  - La app ya cambia a redirección si el navegador bloquea la ventana. Si al probar en tu iPhone no regresa, se usa redirección siempre en modo instalado.
- **Caché vieja.**
  - Un service worker mal configurado puede dejar la app atorada en una versión anterior.
  - Para evitarlo:
    - el HTML siempre se pide primero a la red;
    - solo los archivos con hash se sirven desde la caché;
    - Vercel sirve `sw.js` sin caché.
- **Firestore sin conexión** usa almacenamiento del navegador. Si el navegador lo borra, solo se pierde la copia local, no tus datos.

## Tareas

- [ ] 1. **Ícono:** SVG fuente y PNG de 192, 512, maskable y 180 px. Reemplaza el favicon. *(Te lo muestro antes de seguir.)*
  - Verify: se ve bien en claro y oscuro, y recortado en círculo (Android).
- [ ] 2. **Manifest y metadatos:**
  - `manifest.webmanifest` con nombre "Finanzas", `display: standalone`, colores claro y oscuro, íconos e idioma es-MX;
  - en `index.html`, los enlaces al manifest, el `apple-touch-icon` y `apple-mobile-web-app-*`.
  - Verify: Chrome → Application → Manifest sin errores; aparece la opción "Instalar".
- [ ] 3. **Service worker:**
  - `public/sw.js`: red primero para el HTML, caché primero para los archivos con hash, sin tocar Firebase ni Google;
  - registro en `main.tsx` solo en producción;
  - en `vercel.json`, `sw.js` con `Cache-Control: no-cache`.
  - Verify: Lighthouse PWA en verde; la app abre sin conexión después de una visita.
- [ ] 4. **Datos sin conexión:** `initializeFirestore` con `persistentLocalCache` (varias pestañas).
  - Verify: sin conexión se ven Inicio y Cuentas; un gasto registrado sin conexión se sube al volver.
- [ ] 5. **Actualizar e instalar:**
  - aviso de "Hay una versión nueva";
  - botón "Instalar app" con los pasos para iPhone. Con tests de los dos.
  - Verify: `npm test`; en el panel y en tu celular.
- [ ] 6. **Prueba en tu celular y deploy** con tu permiso:
  - instalar en Android o iPhone;
  - iniciar sesión dentro de la app instalada;
  - abrir sin conexión;
  - recibir una actualización.

## Respuestas

1. **Android.** Se instala con el aviso de Chrome ("Instalar app"). El riesgo del inicio de sesión en iPhone no aplica; igual se prueba en tu Android dentro de la app instalada.
2. **Ícono:** `public/icon.svg`.
   - Cuadrado redondeado morado (#6C5DD3, con un brillo suave arriba);
   - una cartera blanca con broche lila;
   - una tarjeta amarilla (#FFCE73) asomando.

   Revisado de 192 a 16 px en fondo claro y oscuro. Falta generar los PNG y la versión maskable (tarea 1).
3. **Modo sin conexión: sí.** Se hacen las tareas 3 y 4.

Ninguna pregunta abierta.

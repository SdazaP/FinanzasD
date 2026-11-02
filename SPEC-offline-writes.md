# Spec: offline-writes (guardar sin conexión sin que los botones se queden cargando)

**Estado:** aprobado.

## Objetivo

Sin conexión, cada vez que guardas algo el botón vuelve de inmediato a su estado normal, como cuando hay señal. Así puedes registrar varias cosas seguidas (gastos, pagos, ingresos, aportes). Lo que guardes se ve en la app al instante y se sube solo al volver la conexión.

## Por qué pasa hoy

Cada botón espera a que Firestore **confirme en el servidor** que guardó: `commit()`, `setDoc`, `addDoc` y los demás terminan solo cuando el servidor responde.
- Sin conexión, Firestore aplica el cambio en tu dispositivo al momento, y por eso ya ves el gasto y el saldo nuevo.
- Pero la confirmación del servidor no llega hasta que vuelve la señal, y el botón se queda en "Guardando…".

Esto está documentado por Firebase: sin conexión, las escrituras se aplican a la caché local y la promesa se resuelve al sincronizar con el servidor.

## Criterios de aceptación

1. **Sin conexión** (`navigator.onLine` es falso): toda operación que guarda, edita o borra termina para la app en cuanto Firestore la acepta en tu dispositivo.
   - El botón vuelve a "Guardar" o "Agregar".
   - El formulario se limpia o navega, como cuando hay señal.
2. **Conexión que no responde** (el celular dice que hay internet, pero no llega nada): si el servidor no confirma en **3 segundos**, la app da el cambio por guardado en el dispositivo y lo deja subiendo en segundo plano. Así el botón tampoco se queda atorado con mala señal.
3. **Con buena conexión**, todo sigue igual: se espera la confirmación, y si falla, se muestra el error de siempre ("No se pudo guardar…").
4. **Si un cambio guardado sin conexión falla al subir** (caso raro: reglas de seguridad o un dato que ya no existe), la campana muestra un aviso rojo:
   - Texto: "No se pudo subir un cambio que hiciste sin conexión. Revisa tus registros."
   - Se descarta con "Entendido".
   - No se pierde en silencio.
5. **Varios cambios seguidos sin conexión** (por ejemplo, 3 gastos hormiga y un pago) se ven todos en la app y con los saldos correctos, y suben juntos al volver la señal.
6. **Sin cambios** en datos, reglas ni en cómo se calculan los saldos: siguen siendo los mismos `writeBatch` con `increment`.

Fuera de alcance:
- contador de "cambios por subir";
- reintentos manuales;
- avisos por cada cambio que sube.

## Commands

```
Tests:  npm test · npm run lint · npm run build
Prueba: modo avión en tu Android con la app instalada
Deploy: git push a main (Vercel), con tu permiso
```

## Project Structure

```
src/lib/saved.ts (+ test)  → saved(write): espera la confirmación con conexión; sin conexión o tras 3 s
                             la da por guardada y deja la subida corriendo; avisa si luego falla
src/*/api.ts               → las 34 escrituras pasan por saved() (alerts, credits, money, recurring,
                             savings, spending). Las pantallas no cambian.
src/alerts/                → aviso rojo "No se pudo subir un cambio…" en la campana
```

## Code Style

Un solo lugar decide cuándo un cambio "ya quedó", y las APIs solo lo envuelven:

```ts
// Antes
return batch.commit()
// Después
return saved(batch.commit())
```

## Testing Strategy

- **Unit (`saved.test.ts`, con tiempos simulados):**
  - con conexión espera la confirmación y propaga el error;
  - sin conexión resuelve de inmediato;
  - con conexión lenta resuelve a los 3 s;
  - si la subida falla después, se registra el aviso;
  - con conexión, un error antes de los 3 s se muestra en el formulario y no como aviso de la campana.
- **API:** un test de `balanceWrites` comprueba que, sin conexión, `addSpending` resuelve aunque `commit()` nunca termine.
- **Componentes:** el aviso rojo aparece en la campana y "Entendido" lo quita.
- **Regresión:** los 208 tests siguen en verde.
- **En tu Android, en modo avión:**
  - registrar 3 gastos hormiga seguidos y pagar un gasto fijo, sin que ningún botón se quede cargando;
  - quitar el modo avión y confirmar que todo subió y los saldos cuadran.

## Boundaries

- **Always:**
  - los cambios siguen pasando por Firestore (nada de colas propias);
  - con buena conexión se muestran los errores como hoy;
  - un fallo al subir más tarde se avisa.
- **Ask first:**
  - guardar una cola propia en el dispositivo;
  - cambiar el tiempo de espera de 3 s.
- **Never:**
  - dar por guardado algo que Firestore no aceptó en el dispositivo;
  - ocultar un error de subida.

## Open Questions

Ninguna. El tiempo de espera de 3 s con señal débil es una propuesta: si lo prefieres más corto o más largo, dime.

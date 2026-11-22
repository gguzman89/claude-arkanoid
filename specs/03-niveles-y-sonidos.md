# SPEC 03 — Cinco niveles de dificultad creciente y sonidos de rebote y rotura

> **Status:** Implemented
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-22
> **Objective:** El juego pasa a tener 5 niveles que suben la dificultad (bola más rápida, paddle más chico y bloques `gray` resistentes) y reproduce `ball-bounce.mp3` en cada rebote y `break-sound.mp3` al romper un bloque.

---

## Alcance

**Dentro:**

- 5 niveles definidos en una tabla `LEVELS`. Por nivel cambian: velocidad de la bola, ancho del paddle, cantidad de filas `gray` y golpes que aguanta cada `gray`.

  | Nivel | Bola (px/frame) | Paddle (px) | Filas gray | Golpes por gray | Bloques | Puntaje del nivel |
  | --- | --- | --- | --- | --- | --- | --- |
  | 1 | 6   | 120 | 0 | — | 60 | 600 |
  | 2 | 6.5 | 110 | 0 | — | 60 | 600 |
  | 3 | 7   | 100 | 1 | 2 | 70 | 800 |
  | 4 | 7.5 | 90  | 2 | 2 | 80 | 1000 |
  | 5 | 8   | 80  | 3 | 3 | 90 | 1500 |

- Grilla rectangular de 10 columnas. Las filas `gray` van **arriba** de las 6 filas de color (se suman, no las reemplazan). Las 6 filas de color siguen en el mismo orden que SPEC 01.
- Bloque `gray`: aguanta N golpes (tabla). Cada golpe suma 10 puntos y hace rebotar la bola. Los golpes que no lo rompen no generan explosión; el bloque se oscurece según el daño recibido. El último golpe lo rompe con la explosión de SPEC 02 (`EXPLOSION_FRAMES.gray`, que reutiliza los frames de red).
- Oscurecimiento: sobre el sprite `block_gray` se dibuja un rectángulo negro con opacidad `0.6 × golpesRecibidos / golpesTotales`.
- Los bloques de color siguen rompiéndose con 1 golpe y 10 puntos.
- Transición: al romper todos los bloques de los niveles 1 a 4 (con victoria diferida de SPEC 02), aparece un overlay "NIVEL N" (N = nivel siguiente). Click o Espacio carga ese nivel con la bola pegada al paddle; otro click o Espacio la lanza.
- Puntaje y vidas se mantienen entre niveles. Las vidas **no** se recargan.
- Al completar el nivel 5 aparece el overlay de victoria de SPEC 01.
- Game over (0 vidas) en cualquier nivel: el reinicio vuelve al nivel 1, puntaje 0, 3 vidas.
- HUD: muestra `Nivel N/5` centrado arriba, además de puntaje y vidas.
- Sonidos:
  - `assets/sounds/ball-bounce.mp3`: rebote en paredes laterales, techo, paddle y golpe a un `gray` que no lo rompe.
  - `assets/sounds/break-sound.mp3`: bloque roto (de color o `gray` en su último golpe).
  - Sin sonido al perder una vida, al lanzar la bola ni en los overlays.
  - Cada reproducción usa `cloneNode()` del `Audio` base, así los sonidos se superponen.
  - Si el audio falla (archivo ausente, autoplay bloqueado), el error se ignora y el juego sigue en silencio.
- Único archivo modificado: `game.js`.

**Fuera de alcance (specs futuros):**

- Patrones de bloques distintos por nivel (pirámides, huecos).
- Bloques indestructibles.
- Tecla de mute, control de volumen, música de fondo.
- Selector de nivel, menú inicial, pausa.
- Puntaje máximo persistente / localStorage.
- Power-ups, vidas extra.
- Rebote del paddle con ángulo según el punto de impacto.
- Cambios en `assets/spritesheet.js`, `index.html` o `style.css`.

## Modelo de datos

No hay archivos nuevos. Cambios en `game.js`:

```js
// Constantes nuevas
const LEVELS = [
  { ballSpeed: 6,   paddleW: 120, grayRows: 0, grayHits: 0 },
  { ballSpeed: 6.5, paddleW: 110, grayRows: 0, grayHits: 0 },
  { ballSpeed: 7,   paddleW: 100, grayRows: 1, grayHits: 2 },
  { ballSpeed: 7.5, paddleW: 90,  grayRows: 2, grayHits: 2 },
  { ballSpeed: 8,   paddleW: 80,  grayRows: 3, grayHits: 3 },
];
const GRAY_MAX_DARKEN = 0.6;

const SOUNDS = {
  bounce: new Audio('assets/sounds/ball-bounce.mp3'),
  break:  new Audio('assets/sounds/break-sound.mp3'),
};

// Estado: campos nuevos / cambios
const state = {
  status: 'ready',            // 'ready' | 'playing' | 'levelClear' | 'won' | 'lost'
  level: 1,                   // 1..5, índice en LEVELS = level - 1
  // ...resto de campos de SPEC 01 y SPEC 02 sin cambios
};

// Bloque: campos nuevos
// { x, y, w, h, color, alive, explodedAt, hits, maxHits }
//   maxHits: golpes totales (1 para color, grayHits para gray)
//   hits:    golpes restantes; al llegar a 0 -> alive = false, explodedAt = state.time
```

Convenciones:

- `BALL_SPEED` y `PADDLE_W` dejan de usarse para la partida; los valores salen de `LEVELS[state.level - 1]`. `state.paddle.w` es la fuente del ancho del paddle (clamp en `setPaddleX` y centrado del mouse usan `state.paddle.w`).
- `'levelClear'` = nivel 1-4 terminado, overlay "NIVEL N" visible, juego detenido.
- Altura de la grilla en nivel 5: 9 filas → termina en y = 340. Sin cambios en `GRID_TOP`.
- Funciones nuevas: `loadLevel(n)` (fija `state.level`, recrea bloques, ajusta `paddle.w`, centra paddle, bola pegada, `status = 'ready'`) y `playSound(name)`.
- `createBlocks()` lee `grayRows` y `grayHits` del nivel actual.

## Plan de implementación

1. Sonidos: agregar `SOUNDS` y `playSound(name)` (`cloneNode()` + `play().catch(() => {})`). Llamar `bounce` en paredes, techo y paddle; `break` al romper un bloque. Prueba: se oyen ambos sonidos; varios rebotes seguidos se superponen; renombrar temporalmente un `.mp3` no rompe el juego.
2. Tabla de niveles: agregar `LEVELS`, `state.level` y `loadLevel(n)`. `launchBall()` usa `ballSpeed` del nivel; `setPaddleX` y el mouse usan `state.paddle.w`. `resetGame()` llama `loadLevel(1)` además de resetear puntaje y vidas. Prueba: el nivel 1 se juega igual que antes; en consola `loadLevel(5)` deja paddle de 80 px y la bola sale a 8 px/frame.
3. Bloques `gray`: `createBlocks()` agrega `grayRows` filas `gray` arriba de las 6 de color, con `hits` y `maxHits`. La colisión resta `hits`, suma 10, y solo rompe (explosión + `break`) cuando `hits === 0`; si no rompe, suena `bounce`. `draw()` oscurece los `gray` dañados. Prueba: `loadLevel(3)` muestra 7 filas; un `gray` se oscurece al primer golpe y explota al segundo.
4. Transición entre niveles: la victoria diferida pasa a `'levelClear'` si `state.level < 5` y a `'won'` si `state.level === 5`. En `'levelClear'`, click o Espacio llama `loadLevel(state.level + 1)`. `drawOverlay()` muestra "NIVEL N" y "Click o Espacio para empezar". Prueba: completar el nivel 1 muestra "NIVEL 2"; tras click el paddle mide 110 px y puntaje y vidas se conservan.
5. HUD: dibujar `Nivel N/5` centrado arriba. Prueba: el texto cambia al pasar de nivel y vuelve a `Nivel 1/5` tras game over.

## Criterios de aceptación

- [x] El juego carga con `file://` sin errores en consola.
- [x] Rebotar en pared lateral, techo o paddle reproduce `ball-bounce.mp3`.
- [x] Romper un bloque reproduce `break-sound.mp3` y no `ball-bounce.mp3`.
- [x] Golpear un `gray` sin romperlo reproduce `ball-bounce.mp3`.
- [x] Perder una vida no reproduce ningún sonido.
- [ ] Dos sonidos en frames cercanos se oyen superpuestos, sin cortar el anterior.
- [x] Con un `.mp3` ausente el juego funciona igual y la consola no muestra errores no capturados.
- [x] El nivel 1 tiene 60 bloques, paddle de 120 px y bola a 6 px/frame.
- [x] Cada nivel usa exactamente la velocidad, ancho de paddle, filas `gray` y golpes de la tabla `LEVELS`.
- [ ] Las filas `gray` aparecen arriba de las 6 filas de color.
- [x] Un `gray` de 2 golpes: el 1er golpe suma 10, rebota, no explota y lo oscurece; el 2do suma 10 y explota.
- [x] Un `gray` de 3 golpes (nivel 5) se rompe recién al 3er golpe y suma 30 en total.
- [x] El paddle no se sale del canvas con ningún ancho (120 a 80 px), con mouse y con teclado.
- [x] Completar los niveles 1 a 4 muestra el overlay "NIVEL N" con N = siguiente nivel.
- [x] Tras el overlay "NIVEL N", la bola queda pegada al paddle hasta click o Espacio.
- [ ] Puntaje y vidas se conservan al pasar de nivel.
- [x] Completar el nivel 5 muestra el overlay de victoria; sin perder bloques el puntaje final es 4500.
- [x] Game over en cualquier nivel y reinicio vuelven al nivel 1 con puntaje 0 y 3 vidas.
- [x] El HUD muestra `Nivel N/5` con el nivel actual.
- [x] `assets/spritesheet.js`, `index.html` y `style.css` no cambian.

## Decisiones tomadas y descartadas

- **Sí:** niveles y sonidos en un solo spec. Decisión del usuario.
- **No:** dos specs separados. Propuesto por ser features independientes; el usuario prefirió uno.
- **Sí:** dificultad por velocidad de bola, ancho de paddle y bloques `gray`. Decisión del usuario.
- **No:** más filas de color por nivel. Las filas extra vienen solo de `gray`.
- **Sí:** grilla rectangular para todos los niveles. Decisión del usuario: simple.
- **No:** patrones por nivel (matriz de strings). Queda para un spec futuro.
- **Sí:** golpes de `gray` crecientes (2, 2, 3 en niveles 3, 4, 5). Decisión del usuario.
- **No:** `gray` indestructibles. Complica la condición de victoria.
- **Sí:** filas `gray` arriba y sumadas a las de color, desde el nivel 3. Decisión del usuario.
- **Sí:** 10 puntos por cada golpe a un `gray`. Decisión del usuario: recompensa inmediata, coherente con SPEC 01.
- **No:** puntos solo al romper el `gray`.
- **Sí:** oscurecer el `gray` según daño. Hay un único sprite `gray`; el overlay negro da feedback sin assets nuevos.
- **Sí:** overlay "NIVEL N" con click entre niveles. Decisión del usuario: el jugador controla el ritmo.
- **No:** paso automático por tiempo.
- **Sí:** 3 vidas totales sin recarga; game over vuelve al nivel 1. Decisión del usuario.
- **No:** recargar vidas por nivel o reintentar el mismo nivel.
- **Sí:** `ball-bounce.mp3` en paredes, techo, paddle y `gray` no roto. Decisión del usuario.
- **Sí:** `cloneNode()` por reproducción, sin mute. Decisión del usuario.
- **No:** tecla M de mute. Queda para un spec futuro.
- **Sí:** nuevo valor `'levelClear'` en `state.status`. Necesario para distinguir el overlay de nivel del de victoria final.
- **Sí:** verificación de niveles altos con `loadLevel(n)` desde la consola. No se agrega selector de nivel ni atajo de debug.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Autoplay bloqueado por el navegador antes de interacción | El primer sonido ocurre tras el click o Espacio que lanza la bola. `play().catch(() => {})` evita errores no capturados. |
| Audio con `file://` falla en algún navegador | El error se ignora; el juego sigue en silencio. |
| A 8 px/frame la bola atraviesa un bloque de 24 px de alto o el paddle sin detectar colisión | 8 px < 16 px de bola y < 24 px de bloque: la superposición se detecta en al menos un frame. El chequeo del paddle ya tolera `ball.vy` de margen. |
| Clamp del paddle usa `PADDLE_W` fijo y el paddle chico queda mal limitado | El plan cambia `setPaddleX` y el mouse a `state.paddle.w`; hay criterio de aceptación para los 5 anchos. |
| Golpe a un `gray` en el mismo frame que otro bloque | Se mantiene "un bloque por frame" de SPEC 01. |

## Lo que **no** está en este spec

- Patrones de bloques por nivel.
- Mute, volumen, música.
- Selector de nivel, menú, pausa.
- Persistencia de puntaje.
- Power-ups.

Cada uno, si se hace, va en su propio spec.

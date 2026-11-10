# SPEC 01 — MVP jugable de Arkanoid

> **Status:** Approved
> **Depends on:** ninguno (usa los assets existentes en `assets/`)
> **Date:** 2026-11-09
> **Objective:** Un Arkanoid de un solo nivel, jugable en el navegador con mouse y teclado, con 3 vidas, puntaje de 10 por bloque y overlay de victoria / game over.

---

## Alcance

**Dentro:**

- Canvas de 800×600 en `index.html`, sin dependencias.
- Un único nivel: grilla de 10 columnas × 6 filas = 60 bloques, una fila por color (red, cyan, green, magenta, yellow, hotpink). Cada bloque se rompe con 1 golpe.
- Paddle controlado a la vez por mouse (sigue el cursor en X) y teclado (← → y A D).
- Bola pegada al paddle hasta lanzarla con click o Espacio. Tras perder una vida vuelve a quedar pegada.
- Rebote simple: paredes laterales y techo invierten la velocidad correspondiente; el paddle invierte `vy`; los bloques invierten `vx` o `vy` según el eje de colisión.
- 3 vidas. La bola que cae por abajo resta una vida.
- Puntaje: +10 por bloque roto. HUD con puntaje y vidas.
- Overlay de **victoria** (60 bloques rotos) y de **game over** (0 vidas). Click o Espacio en el overlay reinicia la partida.
- Carga con `loadSpritesheet`; el loop arranca dentro del callback.

**Fuera de alcance (specs futuros):**

- Sonidos (`ball-bounce.mp3`, `break-sound.mp3`).
- Animación de explosión (`EXPLOSION_FRAMES`).
- Bloques `gray` o resistentes (varios golpes).
- Varios niveles.
- Puntaje máximo persistente / localStorage.
- Power-ups, pausa, menú inicial.
- Control táctil.
- Rebote del paddle con ángulo según el punto de impacto.

## Modelo de datos

Archivos nuevos en la raíz: `index.html`, `style.css`, `game.js` (script clásico, globals). `index.html` carga `assets/spritesheet.js` antes que `game.js`.

```js
// Constantes
const W = 800, H = 600;
const COLS = 10, ROWS = 6;
const BLOCK_W = 72, BLOCK_H = 24, BLOCK_GAP = 8;   // 10*72 + 9*8 = 792, margen lateral 4 px
const GRID_TOP = 60;
const PADDLE_W = 120, PADDLE_H = 14, PADDLE_Y = 560, PADDLE_SPEED = 8; // px/frame teclado
const BALL_SIZE = 16, BALL_SPEED = 6;               // px/frame
const LIVES_START = 3, POINTS_PER_BLOCK = 10;
const ROW_COLORS = ['red', 'cyan', 'green', 'magenta', 'yellow', 'hotpink'];

// Estado
const state = {
  status: 'ready',            // 'ready' | 'playing' | 'won' | 'lost'
  score: 0,
  lives: 3,
  paddle: { x: 340, y: 560, w: 120, h: 14 },
  ball:   { x: 0, y: 0, vx: 0, vy: 0, size: 16, stuck: true },
  blocks: [/* { x, y, w, h, color, alive } x60 */],
  keys:   { left: false, right: false },
};
```

Convenciones: origen arriba-izquierda; velocidades en px/frame; `status: 'ready'` = bola pegada al paddle esperando lanzamiento.

## Plan de implementación

1. Crear `index.html` (canvas 800×600, carga `assets/spritesheet.js` y `game.js`) y `style.css` (canvas centrado, fondo oscuro). `game.js` con `loadSpritesheet` y un loop que solo limpia el canvas. Prueba: abrir `index.html`, canvas sin errores en consola.
2. Dibujar paddle, bola y los 60 bloques con `drawSprite`. Prueba: se ve la grilla de 6 colores y paddle abajo.
3. Control del paddle: `mousemove` (centrado en cursor) y `keydown/keyup` (← → A D), limitado a `[0, W - PADDLE_W]`. Prueba: ambos métodos mueven el paddle.
4. Bola pegada al paddle; click o Espacio la lanza (`status = 'playing'`, `vx` aleatorio ±, `vy` hacia arriba). Rebote con paredes y techo, y con el paddle (invierte `vy`).
5. Colisión bola-bloque: marca `alive = false`, invierte el eje de colisión, suma 10 al puntaje. Prueba: los bloques desaparecen y el puntaje sube.
6. Vidas y HUD: bola cae bajo `H` → `lives--`, bola vuelve al paddle. HUD con `Score` y `Lives`.
7. Overlays y reinicio: `won` si no quedan bloques vivos, `lost` si `lives === 0`. Click o Espacio en el overlay llama `resetGame()` (puntaje 0, 3 vidas, 60 bloques).

## Criterios de aceptación

- [ ] Abrir `index.html` directo en el navegador (file://) carga el juego sin errores en consola.
- [ ] El canvas mide exactamente 800×600.
- [ ] Se dibujan 60 bloques en 10 columnas × 6 filas, una fila por color.
- [ ] El paddle sigue el mouse y también se mueve con ← → y A D, sin salirse del canvas.
- [ ] La bola empieza pegada al paddle y no se mueve hasta click o Espacio.
- [ ] La bola rebota en paredes laterales, techo y paddle.
- [ ] Romper un bloque lo elimina y suma exactamente 10 puntos.
- [ ] Si la bola cae por abajo, las vidas bajan en 1 y la bola vuelve al paddle.
- [ ] El HUD muestra puntaje y vidas actualizados.
- [ ] Al romper los 60 bloques aparece el overlay de victoria con puntaje 600.
- [ ] Al llegar a 0 vidas aparece el overlay de game over.
- [ ] Click o Espacio en un overlay reinicia con 60 bloques, 3 vidas y puntaje 0.
- [ ] No se carga ni se reproduce ningún sonido.

## Decisiones tomadas y descartadas

- **Sí:** `index.html` + `style.css` + `game.js`. Separación mínima, sin build; `file://` funciona con scripts clásicos.
- **No:** ES modules. `spritesheet.js` usa globals y los módulos fallan con `file://`.
- **Sí:** mouse y teclado simultáneos; gana el último input recibido. Decisión del usuario.
- **Sí:** rebote simple (invertir `vy` en el paddle). Pedido explícito: física predecible, estilo Arkanoid clásico.
- **No:** ángulo según punto de impacto. Fuera del MVP; podría ir en otro spec.
- **Sí:** un nivel, sin sonidos, sin explosión, sin bloques gray. Decisión del usuario: el MVP se queda en lo mínimo jugable.
- **Sí:** overlay simple en el canvas para victoria / game over. Sin pantallas separadas.
- **Sí:** puntaje fijo de 10 por bloque, sin persistencia.
- **Sí:** bloques dibujados a 72×24 desde sprites de 32×16 (escala no uniforme) para que la grilla llene los 800 px. Ajustable en las constantes.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Rebote simple puede dejar la bola en bucles horizontales o casi verticales | `vx` inicial fijo en ±30° respecto a la vertical y nunca se pone en 0. |
| Bola atraviesa bloques o paddle a alta velocidad (tunneling) | `BALL_SPEED = 6` px/frame < alto de bloque y paddle; sin aceleración en el MVP. |
| Doble input mouse/teclado causa saltos del paddle | Mouse fija `x`; teclado suma delta sobre la `x` actual. Sin estado extra. |
| `loadSpritesheet` falla (ruta relativa) | `index.html` debe estar en la raíz; el error ya queda en consola. |

## Lo que **no** está en este spec

- Sonidos y animaciones de explosión.
- Varios niveles, bloques resistentes (gray).
- Puntaje máximo persistente.
- Power-ups, pausa, menú inicial.
- Control táctil.
- Ángulo de rebote según el punto de impacto en el paddle.

Cada uno, si se hace, va en su propio spec.

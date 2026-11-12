# SPEC 02 — Animación de explosión al destruir bloques

> **Status:** Draft
> **Depends on:** SPEC 01
> **Date:** 2026-11-12
> **Objective:** Al romperse, cada bloque muestra durante 150 ms la animación de explosión de 4 frames de su color antes de desaparecer.

---

## Alcance

**Dentro:**

- Al golpear un bloque, en su posición se reproduce la animación `EXPLOSION_FRAMES[color]` (4 frames) con `drawFrame`.
- Duración total de la animación: `EXPLOSION_DURATION` = 150 ms (37,5 ms por frame), medida con tiempo real.
- El tiempo sale del timestamp que `requestAnimationFrame` pasa a `loop`.
- El bloque deja de ser sólido en el mismo frame del golpe. La bola rebota y el puntaje suma 10 al instante, igual que en SPEC 01. La explosión es solo visual y la bola la atraviesa.
- La explosión se dibuja con el mismo rectángulo del bloque (`x`, `y`, 72×24).
- Victoria diferida: al romper el último bloque la bola se detiene y el overlay de victoria aparece recién cuando termina la última explosión.
- `resetGame()` elimina cualquier explosión en curso (los bloques se recrean).
- Único archivo modificado: `game.js`.

**Fuera de alcance (specs futuros):**

- Sonidos (`break-sound.mp3`, `ball-bounce.mp3`).
- Bloques `gray` o resistentes (varios golpes).
- Partículas, sacudida de pantalla u otros efectos además de los 4 frames del spritesheet.
- Cambios en la física de rebote o en el puntaje.
- Cambios en `assets/spritesheet.js`.

## Modelo de datos

No hay archivos nuevos. Cambios en `game.js`:

```js
// Estado: campo nuevo
const state = {
  // ...campos de SPEC 01 sin cambios
  time: 0,                    // ms, último timestamp de requestAnimationFrame
};

// Bloque: campo nuevo
// { x, y, w, h, color, alive, explodedAt }
//   explodedAt: null        -> nunca golpeado
//   explodedAt: <ms>        -> valor de state.time en el frame del golpe
```

Convenciones:

- Un bloque está **explotando** si `alive === false`, `explodedAt !== null` y `state.time - explodedAt < EXPLOSION_DURATION`.
- Índice de frame: `Math.min(3, Math.floor((state.time - explodedAt) / (EXPLOSION_DURATION / 4)))`.
- `EXPLOSION_FRAMES` y `EXPLOSION_DURATION` se usan desde `assets/spritesheet.js`. No se duplican en `game.js`.
- `state.status` no gana valores nuevos. Sigue siendo `'ready' | 'playing' | 'won' | 'lost'`.

## Plan de implementación

1. Tiempo en el loop: `loop(now)` guarda `state.time = now` antes de `update()` y `draw()`. Agregar `time: 0` al estado. Prueba: el juego funciona igual que antes, sin errores en consola.
2. Marca de golpe: `createBlocks()` agrega `explodedAt: null` a cada bloque. La colisión bola-bloque asigna `b.explodedAt = state.time` junto a `b.alive = false`. Prueba: el juego funciona igual; en consola, un bloque roto tiene `explodedAt` numérico.
3. Dibujo de la explosión: agregar un helper `isExploding(b)`. En `draw()`, los bloques vivos se dibujan con `drawSprite` como hoy; los que están explotando se dibujan con `drawFrame` y el frame calculado por tiempo. Prueba: al romper un bloque se ven los 4 frames de su color y luego nada.
4. Victoria diferida: en `update()`, si no quedan bloques vivos, la bola no se mueve. `status` pasa a `'won'` solo cuando además ningún bloque está explotando. Prueba: al romper el último bloque la bola se detiene, la explosión termina y luego aparece el overlay.

## Criterios de aceptación

- [ ] Al romper un bloque, en su lugar se ve la animación de explosión de su mismo color.
- [ ] La animación recorre los 4 frames en orden y dura 150 ms en total.
- [ ] Al terminar la animación no queda nada dibujado en la posición del bloque.
- [ ] La explosión ocupa el mismo rectángulo que el bloque (72×24).
- [ ] El puntaje suma exactamente 10 en el mismo frame del golpe, no al terminar la animación.
- [ ] La bola rebota en el golpe y atraviesa un bloque que está explotando sin rebotar ni sumar puntos.
- [ ] Varias explosiones pueden verse a la vez sin afectarse entre sí.
- [ ] Al romper el último bloque, la bola se detiene y el overlay de victoria aparece después de que termina la última explosión, con puntaje 600.
- [ ] Tras reiniciar desde un overlay se ven 60 bloques y ninguna explosión.
- [ ] La duración de la explosión es la misma en pantallas de 60 Hz y de 120 Hz.
- [ ] `assets/spritesheet.js`, `index.html` y `style.css` no cambian.
- [ ] No se carga ni se reproduce ningún sonido.
- [ ] El juego carga con `file://` sin errores en consola.

## Decisiones tomadas y descartadas

- **Sí:** 150 ms totales para los 4 frames. Decisión del usuario: rápido, no frena el juego.
- **No:** 150 ms por frame (600 ms total). Deja demasiados bloques explotando a la vez.
- **Sí:** tiempo real con el timestamp de `requestAnimationFrame`. La duración no depende del refresh de la pantalla.
- **No:** contar frames del loop. La animación iría al doble de velocidad en 120 Hz.
- **Sí:** el bloque deja de ser sólido en el golpe. Decisión del usuario: la física de SPEC 01 no cambia.
- **No:** bloque sólido hasta terminar la animación. Cambia la física y permite rebotes dobles.
- **Sí:** overlay de victoria tras la última explosión, con la bola detenida. Decisión del usuario: la última explosión se ve completa.
- **No:** un `status` nuevo (por ejemplo `'winning'`) para esa espera. Basta con la condición "sin bloques vivos" durante como máximo 150 ms.
- **Sí:** campo `explodedAt` en cada bloque. Decisión de diseño de este spec: el bloque ya tiene posición y color, no hace falta otra estructura.
- **No:** arreglo separado `state.explosions`. Duplica posición y color, y obliga a limpiarlo en `resetGame()`.
- **Sí:** la explosión se dibuja a 72×24 desde frames de 32×16. Misma escala no uniforme que los bloques en SPEC 01.
- **Sí:** sin manejo especial para game over con explosiones activas. La bola tarda más de 150 ms en caer desde la grilla hasta el fondo, así que el caso no ocurre.
- **No:** sonido de rotura en este spec. Decisión del usuario: los sonidos van juntos en su propio spec.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| La pestaña pasa a segundo plano y `requestAnimationFrame` se pausa | Al volver, el tiempo transcurrido supera 150 ms y la explosión simplemente termina. Sin estado colgado. |
| El índice de frame se sale del rango por redondeo | El índice se limita con `Math.min(3, ...)` y un bloque solo se dibuja mientras está explotando. |
| La victoria nunca se dispara si la condición de explosión queda mal | La condición depende solo de `state.time - explodedAt`, que siempre crece. La espera máxima es 150 ms. |

## Lo que **no** está en este spec

- Sonidos de rotura y de rebote.
- Bloques `gray` o resistentes.
- Partículas, sacudida de pantalla u otros efectos.
- Cambios en física, puntaje o `assets/spritesheet.js`.

Cada uno, si se hace, va en su propio spec.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Arkanoid en HTML + CSS + JavaScript vanilla, **cero dependencias** (ver `README.md`). Sin build, linter, tests ni `package.json`. Se juega abriendo `index.html` directo en el navegador (`file://`) o con un servidor estático simple. Validación rápida de sintaxis: `node --check game.js`.

Repo git con remoto en GitHub; rama principal `main`. Cada feature entra por PR.

## Arquitectura

- `index.html` — canvas `#game` 800×600; carga `assets/spritesheet.js` y luego `game.js` (scripts clásicos, sin módulos).
- `style.css` — solo centra el canvas.
- `game.js` — todo el juego, en un único archivo:
  - Constantes arriba (`W`, `H`, grilla, paddle, bola, `ROW_COLORS`) y tabla `LEVELS` (5 niveles: `ballSpeed`, `paddleW`, `grayRows`, `grayHits`). Para tocar un nivel se edita `LEVELS`.
  - `SOUNDS` + `playSound(name)`: clona el `Audio` para superponer; errores se ignoran.
  - Estado global único `state`: `status` (`'ready' | 'playing' | 'levelClear' | 'won' | 'lost'`), `level`, `score`, `lives`, `paddle`, `ball`, `blocks`, `keys`, `time`, `paused`, `menuIndex`.
  - `paused` es un flag aparte de `status`: congela `update()` sin perder el estado de la partida.
  - Flujo: `loadLevel(n)` / `resetGame()` → `loop(now)` (`requestAnimationFrame`) → `update()` + `draw()`.
  - Overlays dibujados en canvas: `drawOverlay()` (nivel superado / victoria / game over) y `drawPauseMenu()` (P/Esc; Continuar + Nivel 1..5, teclas ↑↓/WS, Enter/Espacio, 1-5, mouse). `drawHUD()` muestra score, `Nivel N/5` y vidas.
  - Explosiones: bloque con `alive = false` y `explodedAt`; `isExploding(b)` usa `state.time` (independiente del refresh rate). La victoria de nivel espera a que termine la última explosión.
  - Bloques `gray`: varios golpes (`hits`/`maxHits`), se oscurecen con `GRAY_MAX_DARKEN`.

## Assets (`assets/`) — no modificar

- `spritesheet-breakout.png` — spritesheet único (paddle, bola, bloques, frames de explosión).
- `spritesheet.js` — script clásico, globals sin `import/export`. Expone:
  - `SPRITES` (`paddle`, `ball`, `blocks[color]`) y `EXPLOSION_FRAMES[color]` (4 frames, `EXPLOSION_DURATION = 150` ms). Colores: red, cyan, green, magenta, yellow, hotpink, gray (gray reutiliza los frames de red).
  - `loadSpritesheet(cb)` — carga asíncrona. Ruta hardcodeada `assets/spritesheet-breakout.png`, relativa al HTML (el HTML debe estar en la raíz).
  - `drawSprite(ctx, name, x, y, w, h)` — `name` es `paddle`, `ball` o `block_<color>`.
  - `drawFrame(ctx, frame, x, y, w, h)` — frames de explosión.
  - Dibujos no-op hasta que `ssLoaded` sea true: el game loop arranca dentro del callback de `loadSpritesheet`.
- `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3` — rebote y rotura.

Los specs suelen exigir como criterio que `assets/spritesheet.js`, `index.html` y `style.css` no cambien.

## Flujo spec-driven

Skills `spec` y `spec-impl` (de `Klerith/fernando-skills`, fijadas en `skills-lock.json`), copiadas idénticas en `.agents/skills/` y `.claude/skills/`. Además `.claude/skills/gato` (no relacionada).

### Ciclo de una feature

1. `/spec <descripción en una frase>` — preguntas de clarificación y luego escribe `specs/NN-slug.md` en estado `Draft`. No escribe código.
2. El humano relee y cambia el estado a `Approved` a mano (el agente nunca lo aprueba).
3. `/spec-impl NN-slug` — valida `Approved`, crea/cambia a rama `spec-NN-slug` (según `AutoCreateBranch` en `specs/.spec-config.yml`, default `true`) e implementa el plan paso a paso, pausando tras cada paso para revisar el diff. Nunca commitea solo.
4. Verificar criterios de aceptación uno por uno y marcarlos `[x]`; los no verificados quedan `[ ]`. Estado → `Implemented`.
5. Commit, push de la rama y PR a `main` (el usuario abre/mergea el PR).

Fuera de alcance del spec activo → no se implementa en esa rama; se anota para un spec futuro.

### Formato de los specs (`specs/`)

- Nombre `NN-slug-kebab.md`, numeración secuencial de dos dígitos (último: `03-niveles-y-sonidos.md`).
- Cuerpo en español (mismo idioma que el prompt); **etiquetas del header en inglés**:
  ```
  # SPEC NN — <título>

  > **Status:** Draft | Approved | Implemented | Obsolete
  > **Depends on:** SPEC 01, SPEC 02   (o "ninguno")
  > **Date:** AAAA-MM-DD
  > **Objective:** <una sola frase>
  ```
- Secciones en este orden: `## Alcance` (**Dentro:** / **Fuera de alcance (specs futuros):**), `## Modelo de datos`, `## Plan de implementación` (pasos numerados, cada uno deja el juego funcional), `## Criterios de aceptación` (checklist booleana y verificable), `## Decisiones tomadas y descartadas`, `## Riesgos identificados`, `## Lo que **no** está en este spec`.
- Plantilla: `.claude/skills/spec/template.md`.

### Convenciones de git

- Rama por spec: `spec-NN-slug`. Cambios chicos sin spec: `feature/<nombre>`.
- Commits estilo Conventional Commits en inglés, secuencia típica por spec:
  - `docs: add spec NN for <tema>`
  - `feat: <cambio> (spec NN)`
  - `docs: mark verified acceptance criteria in spec NN`
- Nunca commitear ni pushear sin pedido explícito del usuario.

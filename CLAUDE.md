# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del proyecto

Juego de Arkanoid en HTML + CSS + JavaScript vanilla, **cero dependencias** (ver `README.md`). Todavía no está implementado: solo existen los assets. No hay `index.html`, build, linter ni tests; no es repo git ni tiene `package.json`. Cuando exista, se debería abrir `index.html` directo en el navegador (o con un servidor estático simple).

## Assets (`assets/`)

- `spritesheet-breakout.png` — spritesheet único (paddle, bola, bloques, frames de explosión).
- `spritesheet.js` — script clásico (no módulo), globals sin `import/export`. Debe cargarse con `<script>` **antes** del código del juego. Expone:
  - `SPRITES` (`paddle`, `ball`, `blocks[color]`) y `EXPLOSION_FRAMES[color]` (4 frames, `EXPLOSION_DURATION = 150` ms). Colores: red, cyan, green, magenta, yellow, hotpink, gray (gray reutiliza los frames de explosión de red).
  - `loadSpritesheet(cb)` — carga asíncrona; copia el PNG a un canvas offscreen. Ruta hardcodeada `assets/spritesheet-breakout.png`, relativa al HTML que lo carga (el HTML debe estar en la raíz).
  - `drawSprite(ctx, name, x, y, w, h)` — `name` es `paddle`, `ball` o `block_<color>`.
  - `drawFrame(ctx, frame, x, y, w, h)` — para frames de explosión.
  - Ambos dibujos son no-op hasta que `ssLoaded` sea true: arrancar el game loop dentro del callback de `loadSpritesheet`.
- `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3` — rebote de bola y rotura de bloque.

## Flujo spec-driven

Skills en `.agents/skills/` (`spec`, `spec-impl`, de `Klerith/fernando-skills`, fijadas en `skills-lock.json`) y `.claude/skills/gato`:
- `/spec` — diseña un spec por secciones y lo guarda en `specs/` (carpeta aún inexistente). No escribe código.
- `/spec-impl <NN-nombre>` — implementa un spec aprobado; crea rama git con el nombre del spec (requiere inicializar git primero).
- Los specs se escriben en el mismo idioma que el prompt (aquí, español).

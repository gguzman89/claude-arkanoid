# Arkanoid

Juego de Arkanoid hecho con HTML, CSS y JavaScript vanilla, **cero dependencias**. Se juega en el navegador, con mouse o teclado.

## Cómo jugar

Abrí `index.html` directo en el navegador (doble click, funciona con `file://`). También sirve cualquier servidor estático, por ejemplo:

```sh
python3 -m http.server
# y abrir http://localhost:8000
```

No hace falta instalar ni compilar nada.

### Controles

| Acción | Teclas / mouse |
| --- | --- |
| Mover el paddle | Mouse, `←` `→` o `A` `D` |
| Lanzar la bola | Click o `Espacio` |
| Pausa (abrir / cerrar) | `P` o `Esc` |
| Navegar el menú de pausa | `↑` `↓` o `W` `S`, o el mouse |
| Elegir opción del menú | `Enter`, `Espacio` o click |
| Saltar directo a un nivel (en pausa) | `1` a `5` |

### Reglas

- Empezás con **3 vidas**. Si la bola cae por abajo, perdés una y la bola vuelve al paddle.
- Cada golpe a un bloque suma **10 puntos**.
- Al romper todos los bloques de un nivel pasás al siguiente, conservando puntaje y vidas.
- Al completar el nivel 5 ganás. Con 0 vidas es game over. Desde cualquiera de las dos pantallas, click o `Espacio` reinicia desde el nivel 1.
- Elegir un nivel desde el menú de pausa arranca ese nivel de cero (puntaje 0 y 3 vidas).

### Niveles

Cada nivel sube la dificultad: la bola va más rápido, el paddle se achica y aparecen bloques grises que aguantan varios golpes (se oscurecen a medida que se dañan).

| Nivel | Velocidad bola (px/frame) | Ancho paddle (px) | Filas grises | Golpes por gris |
| --- | --- | --- | --- | --- |
| 1 | 6 | 120 | 0 | — |
| 2 | 6.5 | 110 | 0 | — |
| 3 | 7 | 100 | 1 | 2 |
| 4 | 7.5 | 90 | 2 | 2 |
| 5 | 8 | 80 | 3 | 3 |

Debajo de los grises siempre hay 6 filas de 10 bloques de color (red, cyan, green, magenta, yellow, hotpink). Al romperse, cada bloque muestra una animación de explosión de 150 ms. Hay sonido al rebotar y al romper un bloque.

## Estructura

```
index.html            canvas 800×600; carga spritesheet.js y game.js
style.css             centra el canvas
game.js               todo el juego: estado, loop, colisiones, niveles, HUD, overlays y pausa
assets/
  spritesheet-breakout.png
  spritesheet.js      sprites de paddle, bola, bloques y explosiones (globals)
  sounds/
    ball-bounce.mp3
    break-sound.mp3
specs/                specs de cada feature (flujo spec-driven)
```

Para ajustar la dificultad de un nivel se edita la tabla `LEVELS` al principio de `game.js`. Para probarlo, abrí la pausa con `P` y saltá a ese nivel.

## Desarrollo

El proyecto se desarrolla con un flujo **spec-driven** usando Claude Code:

1. `/spec <descripción>` escribe un spec en `specs/NN-slug.md` en estado `Draft`.
2. Se revisa y se pasa a `Approved` a mano.
3. `/spec-impl NN-slug` lo implementa en la rama `spec-NN-slug`, paso a paso.
4. Se verifican los criterios de aceptación, el spec pasa a `Implemented` y entra a `main` por PR.

Specs hasta ahora:

| Spec | Contenido | Estado |
| --- | --- | --- |
| [01](specs/01-arkanoid-mvp.md) | MVP jugable: paddle, bola, 60 bloques, vidas, puntaje, overlays | Implemented |
| [02](specs/02-explosion-bloques.md) | Animación de explosión al romper bloques | Implemented |
| [03](specs/03-niveles-y-sonidos.md) | 5 niveles, bloques grises y sonidos | Implemented |

El menú de pausa con selector de nivel se agregó sin spec (PR #3).

Más detalle técnico y convenciones en [`CLAUDE.md`](CLAUDE.md).

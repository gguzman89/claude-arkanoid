// Constantes
const W = 800, H = 600;
const COLS = 10, ROWS = 6;
const BLOCK_W = 72, BLOCK_H = 24, BLOCK_GAP = 8;   // 10*72 + 9*8 = 792, margen lateral 4 px
const GRID_TOP = 60;
const PADDLE_H = 14, PADDLE_Y = 560, PADDLE_SPEED = 8; // px/frame teclado
const BALL_SIZE = 16;
const LIVES_START = 3, POINTS_PER_BLOCK = 10;
const ROW_COLORS = ['red', 'cyan', 'green', 'magenta', 'yellow', 'hotpink'];

// Niveles: velocidad de bola (px/frame), ancho de paddle (px), filas gray y golpes por gray
const LEVELS = [
  { ballSpeed: 6,   paddleW: 120, grayRows: 0, grayHits: 0 },
  { ballSpeed: 6.5, paddleW: 110, grayRows: 0, grayHits: 0 },
  { ballSpeed: 7,   paddleW: 100, grayRows: 1, grayHits: 2 },
  { ballSpeed: 7.5, paddleW: 90,  grayRows: 2, grayHits: 2 },
  { ballSpeed: 8,   paddleW: 80,  grayRows: 3, grayHits: 3 },
];
const GRAY_MAX_DARKEN = 0.6;   // opacidad del overlay negro sobre un gray con daño máximo

// Sonidos base; cada reproducción usa un clon para poder superponerse
const SOUNDS = {
  bounce: new Audio('assets/sounds/ball-bounce.mp3'),
  break:  new Audio('assets/sounds/break-sound.mp3'),
};

// Reproduce un sonido; cualquier fallo (archivo ausente, autoplay) se ignora
function playSound(name) {
  try {
    const a = SOUNDS[name].cloneNode();
    a.play().catch(() => {});
  } catch (e) {
    // sin audio: el juego sigue en silencio
  }
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Estado
const state = {
  status: 'ready',            // 'ready' | 'playing' | 'levelClear' | 'won' | 'lost'
  level: 1,                   // 1..5, índice en LEVELS = level - 1
  score: 0,
  lives: LIVES_START,
  paddle: { x: (W - LEVELS[0].paddleW) / 2, y: PADDLE_Y, w: LEVELS[0].paddleW, h: PADDLE_H },
  ball:   { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE, stuck: true },
  blocks: [],
  keys:   { left: false, right: false },
  time: 0,                    // ms, último timestamp de requestAnimationFrame
};

// Grilla del nivel actual: filas gray arriba, luego las 6 filas de color
function createBlocks() {
  const { grayRows, grayHits } = LEVELS[state.level - 1];
  const marginX = (W - (COLS * BLOCK_W + (COLS - 1) * BLOCK_GAP)) / 2;
  const blocks = [];
  for (let r = 0; r < grayRows + ROWS; r++) {
    const isGray = r < grayRows;
    const maxHits = isGray ? grayHits : 1;
    for (let c = 0; c < COLS; c++) {
      blocks.push({
        x: marginX + c * (BLOCK_W + BLOCK_GAP),
        y: GRID_TOP + r * (BLOCK_H + BLOCK_GAP),
        w: BLOCK_W,
        h: BLOCK_H,
        color: isGray ? 'gray' : ROW_COLORS[r - grayRows],
        alive: true,
        explodedAt: null,
        hits: maxHits,     // golpes restantes
        maxHits,           // golpes totales
      });
    }
  }
  return blocks;
}

function placeBallOnPaddle() {
  const { paddle, ball } = state;
  ball.x = paddle.x + (paddle.w - ball.size) / 2;
  ball.y = paddle.y - ball.size;
}

function setPaddleX(x) {
  state.paddle.x = Math.max(0, Math.min(W - state.paddle.w, x));
}

// Mouse: fija x centrando el paddle en el cursor
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) * (W / rect.width);
  setPaddleX(mouseX - state.paddle.w / 2);
});

// Teclado: ← → y A D
function setKey(e, pressed) {
  switch (e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      state.keys.left = pressed;
      e.preventDefault();
      break;
    case 'ArrowRight':
    case 'KeyD':
      state.keys.right = pressed;
      e.preventDefault();
      break;
  }
}
document.addEventListener('keydown', (e) => {
  setKey(e, true);
  if (e.code === 'Space') {
    e.preventDefault();
    if (!e.repeat) launchBall();
  }
});
document.addEventListener('keyup', (e) => setKey(e, false));

// Click lanza la bola
canvas.addEventListener('click', () => launchBall());

// Lanza la bola pegada: ±30° respecto a la vertical, hacia arriba
function launchBall() {
  // En overlay (victoria / game over), click o Espacio reinicia
  if (state.status === 'won' || state.status === 'lost') {
    resetGame();
    return;
  }
  // En overlay de nivel superado, click o Espacio carga el siguiente nivel
  if (state.status === 'levelClear') {
    loadLevel(state.level + 1);
    return;
  }
  if (state.status !== 'ready') return;
  const angle = (Math.random() < 0.5 ? -1 : 1) * (30 * Math.PI / 180);
  const speed = LEVELS[state.level - 1].ballSpeed;
  state.ball.vx = speed * Math.sin(angle);
  state.ball.vy = -speed * Math.cos(angle);
  state.ball.stuck = false;
  state.status = 'playing';
}

// Carga el nivel n: bloques nuevos, paddle del ancho del nivel y centrado, bola pegada
function loadLevel(n) {
  state.level = n;
  state.paddle.w = LEVELS[n - 1].paddleW;
  state.paddle.x = (W - state.paddle.w) / 2;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.stuck = true;
  state.blocks = createBlocks();
  state.status = 'ready';
  placeBallOnPaddle();
}

function resetGame() {
  state.score = 0;
  state.lives = LIVES_START;
  loadLevel(1);
}

function update() {
  if (state.status === 'won' || state.status === 'lost' || state.status === 'levelClear') return;

  // Teclado suma delta sobre la x actual
  const dir = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
  if (dir !== 0) setPaddleX(state.paddle.x + dir * PADDLE_SPEED);

  const { ball, paddle } = state;

  // Bola pegada: sigue al paddle
  if (ball.stuck) {
    placeBallOnPaddle();
    return;
  }

  // Victoria diferida: sin bloques vivos la bola se detiene;
  // al terminar la última explosión: 'levelClear' (niveles 1-4) o 'won' (nivel 5)
  if (state.blocks.every((b) => !b.alive)) {
    if (!state.blocks.some(isExploding)) {
      state.status = state.level < LEVELS.length ? 'levelClear' : 'won';
    }
    return;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Paredes laterales
  if (ball.x <= 0) {
    ball.x = 0;
    ball.vx = Math.abs(ball.vx);
    playSound('bounce');
  } else if (ball.x + ball.size >= W) {
    ball.x = W - ball.size;
    ball.vx = -Math.abs(ball.vx);
    playSound('bounce');
  }

  // Techo
  if (ball.y <= 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
    playSound('bounce');
  }

  // Paddle: invierte vy (solo si la bola baja)
  if (
    ball.vy > 0 &&
    ball.x + ball.size > paddle.x &&
    ball.x < paddle.x + paddle.w &&
    ball.y + ball.size >= paddle.y &&
    ball.y + ball.size <= paddle.y + paddle.h + ball.vy
  ) {
    ball.y = paddle.y - ball.size;
    ball.vy = -Math.abs(ball.vy);
    playSound('bounce');
  }

  // Bola cae por abajo: pierde una vida y vuelve al paddle
  if (ball.y > H) {
    state.lives--;
    ball.stuck = true;
    ball.vx = 0;
    ball.vy = 0;
    state.status = state.lives === 0 ? 'lost' : 'ready';
    placeBallOnPaddle();
    return;
  }

  // Bloques: rompe uno por frame
  for (const b of state.blocks) {
    if (!b.alive) continue;
    const overlapX = Math.min(ball.x + ball.size, b.x + b.w) - Math.max(ball.x, b.x);
    const overlapY = Math.min(ball.y + ball.size, b.y + b.h) - Math.max(ball.y, b.y);
    if (overlapX <= 0 || overlapY <= 0) continue;

    // Cada golpe suma puntos; el bloque se rompe solo al agotar sus golpes
    b.hits--;
    state.score += POINTS_PER_BLOCK;
    if (b.hits === 0) {
      b.alive = false;
      b.explodedAt = state.time;
      playSound('break');
    } else {
      playSound('bounce');
    }

    // Eje de colisión: el de menor penetración
    if (overlapX < overlapY) {
      ball.vx = -ball.vx;
    } else {
      ball.vy = -ball.vy;
    }
    break;
  }
}

function isExploding(b) {
  return !b.alive && b.explodedAt !== null && state.time - b.explodedAt < EXPLOSION_DURATION;
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const b of state.blocks) {
    if (b.alive) {
      drawSprite(ctx, 'block_' + b.color, b.x, b.y, b.w, b.h);
      // Gray dañado: se oscurece según golpes recibidos
      if (b.hits < b.maxHits) {
        ctx.fillStyle = `rgba(0, 0, 0, ${GRAY_MAX_DARKEN * (b.maxHits - b.hits) / b.maxHits})`;
        ctx.fillRect(b.x, b.y, b.w, b.h);
      }
    } else if (isExploding(b)) {
      const i = Math.min(3, Math.floor((state.time - b.explodedAt) / (EXPLOSION_DURATION / 4)));
      drawFrame(ctx, EXPLOSION_FRAMES[b.color][i], b.x, b.y, b.w, b.h);
    }
  }

  const { paddle, ball } = state;
  drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h);
  drawSprite(ctx, 'ball', ball.x, ball.y, ball.size, ball.size);

  drawHUD();
  if (state.status === 'won' || state.status === 'lost' || state.status === 'levelClear') drawOverlay();
}

function drawOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 56px monospace';
  const levelClear = state.status === 'levelClear';
  const title = levelClear ? 'NIVEL ' + (state.level + 1)
    : state.status === 'won' ? '¡VICTORIA!' : 'GAME OVER';
  ctx.fillText(title, W / 2, H / 2 - 40);
  ctx.font = '28px monospace';
  ctx.fillText('Score: ' + state.score, W / 2, H / 2 + 20);
  ctx.font = '20px monospace';
  ctx.fillText(levelClear ? 'Click o Espacio para empezar' : 'Click o Espacio para reiniciar', W / 2, H / 2 + 70);
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + state.score, 16, 30);
  ctx.textAlign = 'center';
  ctx.fillText('Nivel ' + state.level + '/' + LEVELS.length, W / 2, 30);
  const size = BALL_SIZE, gap = 6;
  for (let i = 0; i < state.lives; i++) {
    const x = W - 16 - size - i * (size + gap);
    drawSprite(ctx, 'ball', x, 30 - size / 2, size, size);
  }
}

function loop(now) {
  state.time = now;
  update();
  draw();
  requestAnimationFrame(loop);
}

loadSpritesheet(() => {
  loadLevel(1);
  requestAnimationFrame(loop);
});

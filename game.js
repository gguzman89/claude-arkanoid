// Constantes
const W = 800, H = 600;
const COLS = 10, ROWS = 6;
const BLOCK_W = 72, BLOCK_H = 24, BLOCK_GAP = 8;   // 10*72 + 9*8 = 792, margen lateral 4 px
const GRID_TOP = 60;
const PADDLE_W = 120, PADDLE_H = 14, PADDLE_Y = 560, PADDLE_SPEED = 8; // px/frame teclado
const BALL_SIZE = 16, BALL_SPEED = 6;               // px/frame
const LIVES_START = 3, POINTS_PER_BLOCK = 10;
const ROW_COLORS = ['red', 'cyan', 'green', 'magenta', 'yellow', 'hotpink'];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Estado
const state = {
  status: 'ready',            // 'ready' | 'playing' | 'won' | 'lost'
  score: 0,
  lives: LIVES_START,
  paddle: { x: (W - PADDLE_W) / 2, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball:   { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE, stuck: true },
  blocks: [],
  keys:   { left: false, right: false },
};

function createBlocks() {
  const marginX = (W - (COLS * BLOCK_W + (COLS - 1) * BLOCK_GAP)) / 2;
  const blocks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      blocks.push({
        x: marginX + c * (BLOCK_W + BLOCK_GAP),
        y: GRID_TOP + r * (BLOCK_H + BLOCK_GAP),
        w: BLOCK_W,
        h: BLOCK_H,
        color: ROW_COLORS[r],
        alive: true,
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
  state.paddle.x = Math.max(0, Math.min(W - PADDLE_W, x));
}

// Mouse: fija x centrando el paddle en el cursor
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) * (W / rect.width);
  setPaddleX(mouseX - PADDLE_W / 2);
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
document.addEventListener('keydown', (e) => setKey(e, true));
document.addEventListener('keyup', (e) => setKey(e, false));

function update() {
  // Teclado suma delta sobre la x actual
  const dir = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
  if (dir !== 0) setPaddleX(state.paddle.x + dir * PADDLE_SPEED);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const b of state.blocks) {
    if (b.alive) drawSprite(ctx, 'block_' + b.color, b.x, b.y, b.w, b.h);
  }

  const { paddle, ball } = state;
  drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h);
  drawSprite(ctx, 'ball', ball.x, ball.y, ball.size, ball.size);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loadSpritesheet(() => {
  state.blocks = createBlocks();
  placeBallOnPaddle();
  requestAnimationFrame(loop);
});

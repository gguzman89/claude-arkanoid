// Constantes
const W = 800, H = 600;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function loop() {
  ctx.clearRect(0, 0, W, H);
  requestAnimationFrame(loop);
}

loadSpritesheet(() => {
  requestAnimationFrame(loop);
});

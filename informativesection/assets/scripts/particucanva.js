// Partículas sobre el botón
const canvas = document.querySelector('.btn-canvas');
const ctx = canvas.getContext('2d');

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

let particles = [];

function randomColor() {
  const colors = ['#00FF00', '#FFD700', '#FFFFFF']; // verde, dorado, blanco
  return colors[Math.floor(Math.random() * colors.length)];
}

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.radius = Math.random() * 3 + 1;
    this.color = randomColor();
    this.speedX = Math.random() * 1 - 0.5;
    this.speedY = Math.random() * -1.5 - 0.5;
    this.alpha = 1;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= 0.01;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (particles.length < 50) {
    particles.push(new Particle());
  }

  particles.forEach((p, i) => {
    p.update();
    p.draw();
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  });

  requestAnimationFrame(animateParticles);
}

animateParticles();

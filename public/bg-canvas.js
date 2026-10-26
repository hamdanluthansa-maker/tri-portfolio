// ===================================================================
// CYBERPUNK CODER BACKGROUND — ANIMATED HEXAGON GRID & PARTICLES
// Adapted from cyberpunk_coder_background.html with Tri Hamdani Neon Lime Palette
// ===================================================================

(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let hexagons = [];
  let particles = [];
  let animationFrameId = null;

  // Grid Config
  const hexRadius = 54; // Hexagon radius
  const hexWidth = hexRadius * Math.sqrt(3);
  const hexHeight = hexRadius * 2;

  class Hexagon {
    constructor(q, r, x, y) {
      this.q = q;
      this.r = r;
      this.x = x;
      this.y = y;
      this.glow = Math.random() * 0.4;
      this.glowSpeed = 0.004 + Math.random() * 0.012;
      this.maxGlow = 0.25 + Math.random() * 0.65;
      this.active = Math.random() > 0.62;
    }

    draw() {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = this.x + hexRadius * Math.cos(angle);
        const hy = this.y + hexRadius * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();

      if (this.active) {
        this.glow += this.glowSpeed;
        if (this.glow > this.maxGlow || this.glow < 0.1) {
          this.glowSpeed = -this.glowSpeed;
        }
        // Cyber Neon Lime + Emerald glow
        ctx.strokeStyle = `rgba(184, 255, 54, ${0.12 + this.glow * 0.4})`;
        ctx.lineWidth = 1.3;
        ctx.fillStyle = `rgba(184, 255, 54, ${this.glow * 0.055})`;
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(20, 48, 30, 0.38)';
        ctx.lineWidth = 0.8;
      }
      ctx.stroke();
    }
  }

  function initHexagons() {
    hexagons = [];
    const horizDist = hexWidth;
    const vertDist = hexRadius * 1.5;

    const cols = Math.ceil(width / horizDist) + 2;
    const rows = Math.ceil(height / vertDist) + 2;

    for (let r = -1; r < rows; r++) {
      for (let q = -1; q < cols; q++) {
        const x = q * horizDist + (r % 2 === 0 ? 0 : horizDist / 2);
        const y = r * vertDist;
        hexagons.push(new Hexagon(q, r, x, y));
      }
    }
  }

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2.2 + 0.8;
      this.speedY = -(Math.random() * 0.35 + 0.1);
      this.speedX = (Math.random() - 0.5) * 0.25;
      this.alpha = Math.random() * 0.45 + 0.15;
      this.isLime = Math.random() > 0.4;
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      if (this.y < 0) this.y = height + 10;
      if (this.x < 0 || this.x > width) this.reset();
    }
    draw() {
      ctx.fillStyle = this.isLime
        ? `rgba(184, 255, 54, ${this.alpha})`
        : `rgba(52, 211, 153, ${this.alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.min(45, Math.floor(width / 30));
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, height * 0.25,
      width / 2, height / 2, height * 0.85
    );
    gradient.addColorStop(0, 'rgba(8, 13, 10, 0)');
    gradient.addColorStop(0.65, 'rgba(8, 13, 10, 0.45)');
    gradient.addColorStop(1, 'rgba(5, 9, 7, 0.92)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initHexagons();
    initParticles();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Deep Obsidian + Ambient Cyber Emerald Base
    const bgGrad = ctx.createRadialGradient(
      width / 2, height * 0.4, 60,
      width / 2, height * 0.5, Math.max(width, height) * 0.75
    );
    bgGrad.addColorStop(0, '#091c13');
    bgGrad.addColorStop(0.5, '#07100b');
    bgGrad.addColorStop(1, '#050a07');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw Hexagons
    for (let i = 0; i < hexagons.length; i++) {
      hexagons[i].draw();
    }

    // Update & Draw Particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    // Vignette
    drawVignette();

    animationFrameId = requestAnimationFrame(animate);
  }

  let resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 100);
  });

  // Handle visibility to save resources
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    } else {
      animate();
    }
  });

  // Start
  resize();
  animate();
})();

/**
 * Tasteful, lightweight confetti burst for Nora result delivery.
 * Zero-dependency, GPU-accelerated HTML5 canvas particle burst.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'sparkle';
  opacity: number;
}

const BRAND_COLORS = [
  '#00635C', // Nest Teal
  '#10B981', // Emerald
  '#34D399', // Mint
  '#F59E0B', // Amber Gold
  '#FB7185', // Soft Coral
  '#06B6D4', // Sky Cyan
  '#FFFFFF'  // Crisp White
];

/**
 * Triggers a small, refined pop of confetti around a target coordinate or center screen.
 * @param originX Optional X coordinate (0-1 fraction or px). Default center (0.5).
 * @param originY Optional Y coordinate (0-1 fraction or px). Default upper third (0.35).
 * @param particleCount Number of confetti particles (default: 38).
 */
export function triggerConfettiBurst(originX?: number, originY?: number, particleCount = 38): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Respect user preference for reduced motion
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

  try {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      document.body.removeChild(canvas);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const startX = originX !== undefined
      ? (originX <= 1 ? originX * width : originX)
      : width * 0.5;

    const startY = originY !== undefined
      ? (originY <= 1 ? originY * height : originY)
      : height * 0.38;

    const particles: Particle[] = [];
    const shapes: ('rect' | 'circle' | 'sparkle')[] = ['rect', 'rect', 'circle', 'sparkle'];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 6.5;
      const vyOffset = -3.5 - Math.random() * 4; // Initial upward impulse

      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed * 0.85,
        vy: Math.sin(angle) * speed * 0.5 + vyOffset,
        size: 5 + Math.random() * 5,
        color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        opacity: 1
      });
    }

    let animationFrameId: number;
    let startTime = performance.now();
    const duration = 2200; // 2.2 seconds total animation

    const render = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > duration) {
        if (typeof window.cancelAnimationFrame === 'function') {
          window.cancelAnimationFrame(animationFrameId);
        }
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const progress = elapsed / duration;
      const fadeProgress = Math.max(0, (progress - 0.6) / 0.4); // Start fading out after 60%

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Apply physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // Gravity
        p.vx *= 0.985; // Air friction
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - fadeProgress);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'sparkle') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 1.8);
          ctx.lineTo(p.size / 3, 0);
          ctx.lineTo(0, p.size / 1.8);
          ctx.lineTo(-p.size / 3, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        animationFrameId = window.requestAnimationFrame(render);
      }
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      animationFrameId = window.requestAnimationFrame(render);
    }
  } catch (err) {
    console.warn('[Confetti Exception Suppressed]:', err);
  }
}

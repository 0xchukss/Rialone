import React, { useEffect, useRef } from 'react';
import { RIALO_LOGO_BASE64 } from '../data/gameData';

export const BackgroundAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const logoImg = new Image();
    logoImg.src = RIALO_LOGO_BASE64;

    let W: number, H: number, cols: number, drops: { x: number; y: number; speed: number }[];
    const LOGO_SIZE = 28;
    const GAP = 48;
    const SPEED = 0.6;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      cols = Math.ceil(W / GAP) + 1;
      drops = Array.from({ length: cols }, (_, i) => ({
        x: i * GAP,
        y: -(Math.random() * H),
        speed: SPEED + Math.random() * 0.4,
      }));
    };

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      drops.forEach(drop => {
        drop.y += drop.speed;
        if (drop.y > H + GAP) drop.y = -GAP * 2;

        const startY = (drop.y % GAP) - GAP;
        const numLogos = Math.ceil(H / GAP) + 2;

        for (let r = 0; r < numLogos; r++) {
          const y = startY + r * GAP;
          const normalizedY = y / H;

          let alpha;
          if (normalizedY < 0.15) {
            alpha = (normalizedY / 0.15) * 0.12;
          } else if (normalizedY > 0.75) {
            alpha = (1 - (normalizedY - 0.75) / 0.25) * 0.12;
          } else {
            alpha = 0.12;
          }

          if (alpha <= 0) continue;
          ctx.globalAlpha = alpha;
          ctx.drawImage(logoImg, drop.x - LOGO_SIZE / 2, y - LOGO_SIZE / 2, LOGO_SIZE, LOGO_SIZE);
        }
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(draw);
    };

    logoImg.onload = () => {
      resize();
      draw();
    };

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg-canvas"
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
};

'use client';

import { useEffect, useRef } from 'react';

type Props = {
  active: boolean;
  maxOnScreen?: number;
  burstSize?: number;
  fadeStart?: number; // 0..1 viewport height
  onDone?: () => void;
  autoStopAfterMs?: number;
};

export default function PixelRain({
  active,
  maxOnScreen = 120,
  burstSize = 10,
  fadeStart = 0.8,
  autoStopAfterMs = 9000,
  onDone,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pixelsRef = useRef<{ x: number; y: number; speed: number; opacity: number }[]>([]);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = (t: number) => {
      if (!startedAtRef.current) startedAtRef.current = t;
      if (active && t - startedAtRef.current > autoStopAfterMs) {
        // stop and flush pixels naturally
        if (pixelsRef.current.length === 0) {
          onDone?.();
          return;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (active && pixelsRef.current.length < maxOnScreen) {
        for (let i = 0; i < burstSize; i++) {
          pixelsRef.current.push({
            x: Math.random() * canvas.width,
            y: -5,
            speed: Math.random() * 5 + 3,
            opacity: 1,
          });
        }
      }

      const h = canvas.height;
      pixelsRef.current = pixelsRef.current.filter(p => p.y < h && p.opacity > 0);
      pixelsRef.current.forEach(p => {
        p.y += p.speed;
        if (p.y > h * fadeStart) p.opacity -= 0.02;
        ctx.fillStyle = `rgba(0,255,0,${p.opacity})`;
        ctx.fillRect(p.x, p.y, 5, 5);
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      pixelsRef.current = [];
      startedAtRef.current = 0;
    };
  }, [active, maxOnScreen, burstSize, fadeStart, autoStopAfterMs, onDone]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
      aria-hidden
    />
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  height?: number;    // canvas height in px
  pixelSize?: number; // sprite pixel size
  speed?: number;     // px per frame
};

const SPRITE_PATTERN = [
  [0, 1, 1, 1, 0],
  [1, 0, 1, 0, 1],
  [1, 1, 0, 1, 1],
  [0, 1, 1, 1, 0],
];

export default function SpriteTicker({
  height = 60,
  pixelSize = 10,
  speed = 2,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const xRef = useRef(0);
  const dirRef = useRef<1 | -1>(1);

  const [labelX, setLabelX] = useState(0);
  const spriteW = SPRITE_PATTERN[0].length * pixelSize;
  const spriteH = SPRITE_PATTERN.length * pixelSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = height;
      if (xRef.current + spriteW > canvas.width) {
        xRef.current = Math.max(0, canvas.width - spriteW);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const w = canvas.width;
      ctx.clearRect(0, 0, w, canvas.height);

      // update position + direction
      xRef.current += dirRef.current * speed;
      if (xRef.current + spriteW >= w) {
        xRef.current = w - spriteW;
        dirRef.current = -1;
      } else if (xRef.current <= 0) {
        xRef.current = 0;
        dirRef.current = 1;
      }

      // draw sprite
      for (let y = 0; y < SPRITE_PATTERN.length; y++) {
        for (let x = 0; x < SPRITE_PATTERN[y].length; x++) {
          if (SPRITE_PATTERN[y][x]) {
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(xRef.current + x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          }
        }
      }

      // update label position (center under sprite)
      setLabelX(xRef.current + spriteW / 2);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [height, pixelSize, speed, spriteW]);

  // Show "1337" when moving right, "Cru" when moving left — always visible, below the sprite
  const label = dirRef.current === 1 ? '1337' : 'Cru';

  return (
    <div
      className="fixed left-0 right-0 bottom-0"
      style={{ height, zIndex: 5 }}
      aria-hidden
    >
      {/* DOM text uses your Silkscreen pixel font */}
      <p
        className="absolute text-[#00FF00] font-silkscreen select-none"
        style={{
          // place just below the drawn sprite inside the ticker area
          top: spriteH + 2,
          transform: `translateX(${labelX}px) translateX(-50%)`,
        }}
      >
        {label}
      </p>

      <canvas
        ref={canvasRef}
        className="block"
        style={{ width: '100vw', height }}
      />
    </div>
  );
}

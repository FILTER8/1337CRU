// app/page.tsx
'use client';

import { useState, useEffect, useRef, Fragment } from "react";
import Head from "next/head";
import "@/app/globals.css";
import Link from "next/link";

const SPRITE_PATTERN = [
  [0, 1, 1, 1, 0],
  [1, 0, 1, 0, 1],
  [1, 1, 0, 1, 1],
  [0, 1, 1, 1, 0],
];

// === Story Arc ===
const actLabels = ["MINT", "WORLD", "REMIX", "TOGETHER", "ETHOS"];
const acts: string[][] = [
  ["","1337","CRU","PHASE ONE","MINT","NOW", "Supply 1337"],
  ["On Eth", "Fully On-Chain", "HTML as Art", "The Code is Canvas"],
  ["mint IT", "code It", "collect it", "Link it"],
  ["connect", "grow", "play", "build","together"],
  ["CC0", "OPEN", "FUN", "Join the 1337 Cru"],
];

// pacing controls
const MESSAGE_BOUNCES = 1;            
const END_LINGER_MULTIPLIER = 3;      

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionRef = useRef<number>(0);
  const directionRef = useRef<number>(1);

  const pixelSize = 14;
  const spriteWidth = 5 * pixelSize;
  const spriteHeight = 5 * pixelSize;
  const speedPxPerFrame = 4;

  const [currentMessage, setCurrentMessage] = useState<string>(acts[0][0]);
  const [actIndex, setActIndex] = useState<number>(0);

  const actIndexRef = useRef<number>(0);
  const messageIndexRef = useRef<number>(0);
  const remainingBouncesRef = useRef<number>(MESSAGE_BOUNCES);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const setCanvasSize = () => {
          canvas.width = window.innerWidth;
          canvas.height = spriteHeight + 40;
        };
        setCanvasSize();

        const advanceMessage = () => {
          const currentActLen = acts[actIndexRef.current].length;
          let nextAct = actIndexRef.current;
          let nextMsg = messageIndexRef.current + 1;

          if (nextMsg >= currentActLen) {
            nextMsg = 0;
            nextAct = (actIndexRef.current + 1) % acts.length;
          }

          const isNextLastOfLast =
            nextAct === acts.length - 1 &&
            nextMsg === acts[nextAct].length - 1;

          actIndexRef.current = nextAct;
          messageIndexRef.current = nextMsg;

          setActIndex(nextAct);
          setCurrentMessage(acts[nextAct][nextMsg]);

          remainingBouncesRef.current = isNextLastOfLast
            ? MESSAGE_BOUNCES * END_LINGER_MULTIPLIER
            : MESSAGE_BOUNCES;
        };

        const animateSprite = () => {
          const windowWidth = window.innerWidth;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          positionRef.current += directionRef.current * speedPxPerFrame;

          if (positionRef.current + spriteWidth >= windowWidth) {
            positionRef.current = windowWidth - spriteWidth;
            directionRef.current = -1;
            remainingBouncesRef.current -= 1;
            if (remainingBouncesRef.current <= 0) advanceMessage();
          } else if (positionRef.current <= 0) {
            positionRef.current = 0;
            directionRef.current = 1;
            remainingBouncesRef.current -= 1;
            if (remainingBouncesRef.current <= 0) advanceMessage();
          }

          for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 5; x++) {
              ctx.fillStyle = SPRITE_PATTERN[y][x] === 1 ? "#00FF00" : "#000000";
              ctx.fillRect(
                positionRef.current + x * pixelSize,
                y * pixelSize,
                pixelSize,
                pixelSize
              );
            }
          }

          requestAnimationFrame(animateSprite);
        };

        requestAnimationFrame(animateSprite);

        const handleResize = () => {
          setCanvasSize();
        };
        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
        };
      }
    }
  }, []);


  return (
    <div className="min-h-screen bg-black text-[#00FF00] flex flex-col justify-between font-silkscreen">
      <Head>
        <title>1337 CRU</title>
        <meta name="description" content="Welcome to 1337 Cru Game NFT on Ethereum Mainnet" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Top: logo + act indicator */}
      <div className="w-full text-center pt-2">
        <div className="text-lm tracking-widest opacity-80">1337 CRU / PHASE 1</div>
        <div className="mt-1 text-[10px] md:text-xs uppercase tracking-widest">
          {actLabels.map((label, i) => (
            <Fragment key={label}>
              <span className={i === actIndex ? "opacity-100 underline" : "opacity-40"}>
                {label}
              </span>
              {i < actLabels.length - 1 && <span className="opacity-30 mx-1">/</span>}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Main rotating message */}
      <header className="flex flex-1 items-center justify-center text-center px-4">
        <h1
          className="text-7xl md:text-9xl leading-tight w-full break-words"
          dangerouslySetInnerHTML={{ __html: currentMessage }}
        />
      </header>

      {/* Bottom: Linktree style menu + Mint + countdown + sprite */}
{/* Bottom: Linktree style menu + Mint + sprite */}
<footer className="w-full flex flex-col items-center px-4 pb-6">
  <div className="flex flex-col items-center w-full max-w-md mb-6 space-y-3">
    
        <Link href="/mint" className="w-full">
      <button
        className="px-6 py-3 w-full bg-[#00FF00] text-black border-2 border-[#00FF00] font-silkscreen text-xl hover:bg-[#00CC00] transition"

      >
        Mint Now
      </button>
    </Link>
    <Link href="/about" className="w-full">
      <button
        className="px-6 py-3 w-full bg-[#00FF00] text-black border-2 border-[#00FF00] font-silkscreen text-xl hover:bg-[#00CC00] transition"
      >
        About
      </button>
    </Link>

  </div>

  <canvas ref={canvasRef} className="w-full" />
</footer>


    </div>
  );
}

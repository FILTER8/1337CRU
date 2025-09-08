// app/how-to/page.tsx
'use client';

import { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function HowTo() {
  // Minimal 1x1 green PNG (Data URI)
  const greenPngDataUri =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAKAAQMAAAA2A1tgAAAABlBMVEUAAAAA/wA2Q0S9AAAAU0lEQVR4Xu3MIQEAAAgDMPqnejNogEAhtgCrzwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA3kUoFB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAt388Wn6vLBcAAAAASUVORK5CYII=';

  // Tiny HTML example (animated green pixel)
  const tinyHtml =
    '<!doctype html><meta charset=utf-8><style>html,body{margin:0;background:#000}.px{width:2px;height:2px;background:#0f0;position:fixed;top:40vh;left:0;animation:m 2s linear infinite}@keyframes m{0%{left:0}50%{left:calc(100vw - 2px)}100%{left:0}}</style><div class=px></div>';

  // Encode HTML to Data URI safely on the client
  const tinyHtmlDataUri = useMemo(() => {
    if (typeof window === 'undefined') return 'data:text/html;base64,[encoded-after-hydration]';
    const base64 = btoa(unescape(encodeURIComponent(tinyHtml)));
    return `data:text/html;base64,${base64}`;
  }, [tinyHtml]);

  // Example C: Your teleporting painter (already base64 data: URI)
  const teleportPainterDataUri =
    'data:text/html;base64,ZGF0YTp0ZXh0L2h0bWwsPCFkb2N0eXBlIGh0bWw+PG1ldGEgY2hhcnNldD11dGYtOD48c3R5bGU+aHRtbCxib2R5e21hcmdpbjowO2JhY2tncm91bmQ6IzAwMDtvdmVyZmxvdzpoaWRkZW59Y2FudmFze2Rpc3BsYXk6YmxvY2t9PC9zdHlsZT48Y2FudmFzIGlkPWM+PC9jYW52YXM+PHNjcmlwdD5jb25zdCBjPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJjIiksZz1jLmdldENvbnRleHQoIjJkIik7ZnVuY3Rpb24gZigpe2Mud2lkdGg9aW5uZXJXaWR0aDtjLmhlaWdodD1pbm5lckhlaWdodH1hZGRFdmVudExpc3RlbmVyKCJyZXNpemUiLGYpO2YoKTtnLmZpbGxTdHlsZT0iIzBmMCI7bGV0IHg9MCx5PWMuaGVpZ2h0LzIsdng9MSxTPTIscD0uMDE7ZnVuY3Rpb24gaihuKXt4PU1hdGgucmFuZG9tKCkqKGMud2lkdGgtUyl8MDt5PU1hdGgucmFuZG9tKCkqKGMuaGVpZ2h0LVMpfDA7aWYobil2eD1NYXRoLnJhbmRvbSgpPC41Py0xOjF9ZnVuY3Rpb24gcygpe2cuZmlsbFJlY3QoeCx5LFMsUyk7eCs9dng7aWYoeDwwfHx4PmMud2lkdGgtUylqKDEpO2lmKE1hdGgucmFuZG9tKCk8cCl7dngqPS0xO2ooKX1yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocyl9cygpPC9zY3JpcHQ+';

  return (
    <div className="min-h-screen bg-black text-[#00FF00] font-silkscreen px-4 py-6">
      <Head>
        <title>1337 CRU — How-To</title>
        <meta name="description" content="How to create and link entries for 1337 CRU Game" />
      </Head>

      <main className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl text-[#FF0000]">How-To: Create & Link an Entry</h1>

        <p className="opacity-90">
          This guide shows how to make a tiny HTML or PNG asset, convert it to a <strong>Data URI</strong>,
          store it in the contract as an entry, and then link it to your NFT.
        </p>

        <ol className="list-decimal pl-6 space-y-4">
          <li>
            <strong>Create your piece</strong>:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>HTML (pure HTML/CSS/JS, no external URLs).</li>
              <li>PNG (keep it small — icons/sprites work great).</li>
            </ul>
          </li>

          <li>
            <strong>Tiny-fy / compress</strong>:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Minify HTML (remove whitespace; keep classes short).</li>
              <li>Compress PNG using any PNG optimizer.</li>
            </ul>
          </li>

          <li>
            <strong>Convert to Data URI</strong>:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use your preferred encoder (e.g., base64 tools) and choose the <em>Data URI</em> option.</li>
              <li>For HTML use: <code>data:text/html;base64,&lt;yourBase64&gt;</code></li>
              <li>For PNG use: <code>data:image/png;base64,&lt;yourBase64&gt;</code></li>
            </ul>
          </li>

          <li>
            <strong>Save in the contract</strong>:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Store the Data URI in your contract’s entries.</li>
              <li>Go to mint. Connect your wallet. Click on your token. Open Create.</li>
              <li>Paste the code and enjoy the preview. Press create</li>
            </ul>
          </li>

          <li>
            <strong>Link it to your token to an existing entry</strong>:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Go to mint. Connect your wallet. Choose your token. Open Link. Choose from the entries</li>
            </ul>
          </li>
        </ol>

        <hr className="border-[#00FF00]/40" />

        {/* Example A: 1x1 PNG */}
        <section className="space-y-4">
          <h2 className="text-2xl">Example A: green line PNG (Data URI)</h2>
          <p className="opacity-90">Use this directly as a tiny preview entry:</p>
          <div className="flex items-center gap-4">
            <img
              src={greenPngDataUri}
              alt="1x1 green"
              className="border border-[#00FF00]"
              width={120}
              height={120}
            />
            <code className="text-xs break-all">{greenPngDataUri}</code>
          </div>
        </section>

        {/* Example B: Animated HTML */}
        <section className="space-y-4">
          <h2 className="text-2xl">Example B: Animated HTML “Green Pixel”</h2>
          <p className="opacity-90">A single green pixel gliding across the screen.</p>

          <details className="border border-[#00FF00] p-3">
            <summary className="cursor-pointer">View HTML source</summary>
            <pre className="whitespace-pre-wrap text-xs mt-3">
{`<!doctype html><meta charset=utf-8><style>
html,body{margin:0;background:#000}
.px{width:2px;height:2px;background:#0f0;position:fixed;top:40vh;left:0;animation:m 2s linear infinite}
@keyframes m{0%{left:0}50%{left:calc(100vw - 2px)}100%{left:0}}
</style><div class=px></div>`}
            </pre>
          </details>

          <div className="space-y-2">
            <p className="opacity-90">Data URI (base64) version of the HTML:</p>
            <code className="text-xs break-all block">{tinyHtmlDataUri}</code>
          </div>
        </section>

        <hr className="border-[#00FF00]/40" />

        {/* Example C: Teleporting Painter (your data URI) */}
        <section className="space-y-4">
          <h2 className="text-2xl">Example C: Teleporting Painter (Data URI)</h2>
          <p className="opacity-90">
            The tiny painter that crawls horizontally, teleports on edges, and flips direction with a jump.
          </p>

          <div className="grid gap-3">
            <div className="border border-[#00FF00] h-40">
              <iframe
                src={teleportPainterDataUri}
                title="Teleporting Painter"
                className="w-full h-full"
              />
            </div>
            <code className="text-xs break-all block">{teleportPainterDataUri}</code>
          </div>
        </section>

        <div className="pt-6">
          <Link href="/" className="underline hover:opacity-80">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}

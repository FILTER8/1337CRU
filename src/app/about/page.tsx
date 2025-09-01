// app/about/page.tsx
'use client';

import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import SpriteTicker from '@/components/SpriteTicker';

function Nav() {
  const pathname = usePathname();
  const item = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={[
          'px-2 md:px-3 uppercase tracking-widest',
          active ? 'underline opacity-100' : 'opacity-60 hover:opacity-100',
        ].join(' ')}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="w-full pt-4 pb-2">
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs md:text-sm tracking-widest opacity-80">
          1337 CRU / PHASE 1
        </div>
        <nav className="text-[10px] md:text-xs flex gap-2 md:gap-3">
          {item('/', 'Start')}
          <span className="opacity-30">/</span>
          {item('/about', 'About')}
        </nav>
      </div>
    </header>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-[#00FF00] flex flex-col items-center p-4 font-silkscreen relative">
      <Head>
        <title>About – 1337 CRU</title>
        <meta
          name="description"
          content="Learn about the 1337 CRU GAME: a fully on-chain, CC0, collaborative NFT experiment."
        />
      </Head>

      {/* Top menu */}
      <Nav />

      <main className="flex flex-col items-center gap-8 max-w-2xl w-full text-center">
        {/* Headline (red for contrast) */}
        <h1 className="text-4xl mt-2 text-[#FF0000]">About 1337 CRU</h1>

        {/* Section 1 */}
        <section className="space-y-14">
          <p>
            1337 CRU is more than an NFT — it’s a collective experiment.
            We build together. We explore together.
          </p>
          <ul className="list-disc list-inside text-left space-y-4">
            <li>
              <strong>Creative freedom:</strong> All artworks are <strong>CC0</strong>,
              free for anyone to use and remix.
            </li>
            <li>
              <strong>On-chain forever:</strong> All art is saved fully on-chain in an ERC-721.
            </li>
            <li>
              <strong>Linking & connecting:</strong> Every token can evolve by linking to shared HTML + previews.
            </li>
            <li>
              <strong>Growing the story:</strong> Each mint adds to the narrative — a game we co-create.
            </li>
          </ul>
          <p>This is Phase 1. The CRU is forming. Join us.</p>
        </section>

        {/* Section 2 */}
        <section className="space-y-14">
          <h2 className="text-2xl text-[#FF0000]">Linking & Connecting</h2>
          <p>
            The 1337 CRU GAME contract is designed for <strong>evolution</strong>.<br />
            Every token isn’t just static art. It can <strong>link</strong> to shared entries stored fully on-chain:
          </p>
          <ul className="list-disc list-inside text-left space-y-4">
            <li><strong>HTML entries:</strong> connect your token to playable or interactive code.</li>
            <li><strong>Preview entries:</strong> choose or create your own visual thumbnail.</li>
            <li><strong>Dynamic identity:</strong> tokens can reset, relink, or adopt new entries as the registry grows.</li>
          </ul>
          <p>
            This means each NFT is a <strong>living node in the CRU:</strong>
            connecting, remixing, and expanding the story together.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-6">
          <h2 className="text-2xl text-[#FF0000]">Creator</h2>
          <p>
            <strong>1337 CRU GAME</strong> is created by{' '}
            <Link
              href="https://x.com/0xfilter8"
              className="underline hover:opacity-80"
              target="_blank"
              rel="noreferrer"
            >
              filter8
            </Link>{' '}
            — indie dev, pixel artist and proud{' '}
            <Link
              href="https://1337skulls.xyz/"
              className="underline hover:opacity-80"
              target="_blank"
              rel="noreferrer"
            >
              1337 Skull
            </Link>{' '}
            holder.
          </p>
          <p>
            The project is inspired by the culture of the <strong>1337 Skulls</strong>:<br />
            a CC0 community crafted from passion; an honest attempt to make NFTs fun;<br />
            friendship between developers, artists, writers, and enjoyooooors.
          </p>
          <p>
            This spirit is why the project is called <strong>1337</strong> — 
            a nod to the shared culture of building, creating, and enjoying together on the blockchain.
          </p>

          {/* PFP image from /public (replace pfp.png with your filename) */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <Image
              src="/pfp.png"
              alt="filter8 avatar"
              width={200}
              height={200}
              priority
            />
            <span className="text-xs opacity-80">filter8</span>
          </div>
        </section>
      </main>

      {/* Footer sprite ticker */}
      <footer className="w-full mt-10">
        <SpriteTicker height={60} pixelSize={10} speed={2} />
      </footer>
    </div>
  );
}

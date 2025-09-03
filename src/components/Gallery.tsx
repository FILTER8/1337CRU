// components/Gallery.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAddress } from 'viem';
import { useReadContract } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains'; // not strictly required, kept if you need chainId later
import CRUGAME_ABI from '@/abi/CruGame1337.json';

// --- Contracts ---
const CRU_CONTRACT = '0x05D8a0Df083bB20FfB9360B3aF458A5de5c9F2A4' as const; // your CRU Game mainnet addr if you changed it
const SKULLS_CONTRACT = '0x9251dEC8DF720C2ADF3B6f46d968107cbBADf4d4' as const; // 1337 Skulls mainnet

// --- Alchemy ---
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!;
const ALCHEMY_OWNER_URL = (chain: 'mainnet' | 'sepolia') =>
  `https://${chain === 'mainnet' ? 'eth-mainnet' : 'eth-sepolia'}.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTsForOwner`;

// ---- Types ----
type Attribute = { trait_type?: string; type?: string; value?: string | number };

type OwnedNftLite = {
  tokenId: string;
  image?: { originalUrl?: string };
  animation?: { originalUrl?: string };
  raw?: { metadata?: { attributes?: Attribute[]; image?: string; animation_url?: string } };
  contract?: { address?: `0x${string}` };
};

type TokenMeta = {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  attributes?: Attribute[];
};

type MaybeFetchError = { message?: string };

function decodeTokenUri(tokenUri?: string): TokenMeta | null {
  if (!tokenUri || !tokenUri.startsWith('data:application/json;base64,')) return null;
  try {
    const b64 = tokenUri.replace('data:application/json;base64,', '');
    const jsonStr =
      typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(jsonStr) as TokenMeta;
  } catch {
    return null;
  }
}

// ===== CRU Card (live tokenURI) =====
function CruCard({
  nft,
  onSelect,
}: {
  nft: OwnedNftLite;
  onSelect: (nft: OwnedNftLite) => void;
}) {
  const tokenIdBig =
    typeof nft.tokenId === 'string' && nft.tokenId.startsWith('0x')
      ? BigInt(nft.tokenId)
      : BigInt(nft.tokenId ?? '0');

  // If you’re on mainnet now, set chainId to mainnet.id
  const { data: tokenUriRaw } = useReadContract({
    address: CRU_CONTRACT,
    abi: CRUGAME_ABI.abi,
    functionName: 'tokenURI',
    args: [tokenIdBig],
    // chainId: mainnet.id, // uncomment if you explicitly want to pin
    query: { refetchInterval: 15_000 },
  });

  const metadata = decodeTokenUri(tokenUriRaw as string | undefined);
  const imageSrc = metadata?.image;
  const label = tokenIdBig.toString();

  return (
    <button
      type="button"
      className="text-left bg-[#00FF00] text-black p-4 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00]"
      onClick={() => onSelect(nft)}
    >
      <p>Token ID: {label}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc || '/placeholder.png'}
        alt={`NFT ${label}`}
        className="w-full h-auto mt-2"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
        }}
      />
    </button>
  );
}

// ===== Skulls Card (homage only) =====
function SkullCard({ nft }: { nft: OwnedNftLite }) {
  const tokenId =
    typeof nft.tokenId === 'string' && nft.tokenId.startsWith('0x')
      ? BigInt(nft.tokenId).toString()
      : nft.tokenId;

  // Prefer image from Alchemy payload; fallback to raw metadata if present
  const img =
    nft.image?.originalUrl ||
    nft.raw?.metadata?.image ||
    '/placeholder.png';

  return (
    <div className="text-left bg-black text-[#00FF00] p-4 border-2 border-[#00FF00] rounded-none">
      <p>Skull #{tokenId}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt={`Skull ${tokenId}`}
        className="w-full h-auto mt-2 object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
        }}
      />
    </div>
  );
}

// ===== Reusable grid loader =====
function NftGrid({
  owner,
  contractAddress,
  fetchWithMetadata = false, // CRU uses tokenURI live, so can be false; Skulls can be true
  onSelect,
  chain = 'mainnet',
}: {
  owner?: `0x${string}`;
  contractAddress: `0x${string}`;
  fetchWithMetadata?: boolean;
  onSelect?: (nft: OwnedNftLite) => void;
  chain?: 'mainnet' | 'sepolia';
}) {
  const [nfts, setNfts] = useState<OwnedNftLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const withMetaParam = fetchWithMetadata ? 'true' : 'false';
  const ownerUrl = useMemo(() => ALCHEMY_OWNER_URL(chain), [chain]);

  useEffect(() => {
    const run = async () => {
      if (!owner || !isAddress(owner) || !ALCHEMY_API_KEY) {
        setNfts([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `${ownerUrl}?owner=${owner}&contractAddresses[]=${contractAddress}&withMetadata=${withMetaParam}`,
          { headers: { accept: 'application/json' } }
        );
        if (!res.ok) throw new Error('Failed to fetch NFTs');
        const json = (await res.json()) as { ownedNfts?: OwnedNftLite[] };
        setNfts(json.ownedNfts ?? []);
      } catch (e: unknown) {
        const er = e as MaybeFetchError;
        setErr(er?.message || 'Failed to load NFTs');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [owner, contractAddress, withMetaParam, ownerUrl]);

  if (!owner) return <p className="text-[#00FF00]">Connect wallet to view your NFTs</p>;
  if (loading) return <p className="text-[#00FF00]">Loading NFTs…</p>;
  if (err) return <p className="text-[#FF0000]">{err}</p>;
  if (nfts.length === 0) return <p className="text-[#00FF00]">No NFTs found</p>;

  return (
    <div className="grid grid-cols-2 gap-4">
      {nfts.map((nft) =>
        contractAddress.toLowerCase() === CRU_CONTRACT.toLowerCase() ? (
          <CruCard key={nft.tokenId} nft={nft} onSelect={onSelect!} />
        ) : (
          <SkullCard key={nft.tokenId} nft={nft} />
        )
      )}
    </div>
  );
}

export default function Gallery({
  owner,
  contractAddress,
  onSelect,
}: {
  owner?: `0x${string}`;
  contractAddress: `0x${string}`;
  onSelect: (nft: OwnedNftLite) => void;
}) {
  const [tab, setTab] = useState<'cru' | 'skulls'>('cru');

  return (
    <div className="w-full">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('cru')}
          className={[
            'border-2 px-3 py-1 rounded-none font-silkscreen',
            tab === 'cru'
              ? 'bg-[#00FF00] text-black border-[#00FF00]'
              : 'bg-black text-[#00FF00] border-[#00FF00] hover:bg-[#00CC00]',
          ].join(' ')}
        >
          1337 CRU Game
        </button>
        <button
          onClick={() => setTab('skulls')}
          className={[
            'border-2 px-3 py-1 rounded-none font-silkscreen',
            tab === 'skulls'
              ? 'bg-[#00FF00] text-black border-[#00FF00]'
              : 'bg_black text-[#00FF00] border-[#00FF00] hover:bg-[#00CC00]',
          ].join(' ')}
        >
          1337 Skulls
        </button>
      </div>

      {tab === 'cru' ? (
        <NftGrid
          owner={owner}
          contractAddress={CRU_CONTRACT}
          fetchWithMetadata={false}
          onSelect={onSelect}
          chain="mainnet"
        />
      ) : (
        <NftGrid
          owner={owner}
          contractAddress={SKULLS_CONTRACT}
          fetchWithMetadata={true}
          chain="mainnet"
        />
      )}
    </div>
  );
}

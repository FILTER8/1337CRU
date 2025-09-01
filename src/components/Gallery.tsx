// components/Gallery.tsx
'use client';

import { useEffect, useState } from 'react';
import { isAddress } from 'viem';
import { useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import CRUGAME_ABI from '@/abi/CruGame1337.json';

const CONTRACT_ADDRESS = '0x11dc1b59f6E396477CBe559D33c8103D0386B4ee' as const;

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!;
const ALCHEMY_API_URL = `https://eth-sepolia.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTsForOwner`;

// ---- Types ----
type Attribute = { trait_type?: string; type?: string; value?: string | number };

type OwnedNftLite = {
  tokenId: string;
  image?: { originalUrl?: string };
  animation?: { originalUrl?: string };
  media?: Array<{ raw?: string }>;
  raw?: { metadata?: { attributes?: Attribute[]; animation_url?: string; image?: string } };
  contract?: { address?: `0x${string}`; contractAddress?: `0x${string}` };
  contractAddress?: `0x${string}`;
};

type TokenMeta = {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  attributes?: Attribute[];
};

type MaybeFetchError = { message?: string };

// --- Helper: decode tokenURI ---
function decodeTokenUri(tokenUri?: string): TokenMeta | null {
  if (!tokenUri || !tokenUri.startsWith('data:application/json;base64,')) return null;
  try {
    const b64 = tokenUri.replace('data:application/json;base64,', '');
    const jsonStr = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(jsonStr) as TokenMeta;
  } catch {
    return null;
  }
}

function NftCard({
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

  // Read live tokenURI
  const { data: tokenUriRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CRUGAME_ABI.abi,
    functionName: 'tokenURI',
    args: [tokenIdBig],
    chainId: sepolia.id,
    query: { refetchInterval: 15_000 }, // auto-refetch
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
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={`NFT ${label}`}
          className="w-full h-auto mt-2"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/placeholder.png" alt="No preview" className="w-full h-auto mt-2" />
      )}
    </button>
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
  const [nfts, setNfts] = useState<OwnedNftLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!owner || !isAddress(owner) || !ALCHEMY_API_KEY) {
        setNfts([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `${ALCHEMY_API_URL}?owner=${owner}&contractAddresses[]=${contractAddress}&withMetadata=false`,
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
  }, [owner, contractAddress]);

  if (!owner) return <p className="text-[#00FF00]">Connect wallet to view your NFTs</p>;
  if (loading) return <p className="text-[#00FF00]">Loading NFTs…</p>;
  if (err) return <p className="text-[#FF0000]">{err}</p>;
  if (nfts.length === 0) return <p className="text-[#00FF00]">No 1337 Cru Game NFTs owned</p>;

  return (
    <div className="w-full">
      <h2 className="text-2xl mb-4">Your 1337 Cru Game NFTs</h2>
      <div className="grid grid-cols-2 gap-4">
        {nfts.map((nft) => (
          <NftCard key={nft.tokenId} nft={nft} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

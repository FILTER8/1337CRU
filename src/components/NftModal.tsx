// components/NftModal.tsx
'use client';

import { useRef, useState, useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import LinkHtmlModal from './LinkHtmlModal';
import CreateEntryModal from './CreateEntryModal';
import CRUGAME_ABI from '@/abi/CruGame1337.json';

const CONTRACT_ADDRESS = '0x05D8a0Df083bB20FfB9360B3aF458A5de5c9F2A4' as const;

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!;
const REFRESH_URL = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/refreshNftMetadata`;

// ---- Types (replace 'any') ----
type Attribute = { trait_type?: string; type?: string; value?: string | number };
type TokenMeta = {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  attributes?: Attribute[];
};
type OwnedNftLite = {
  tokenId: string;
  image?: { originalUrl?: string };
  animation?: { originalUrl?: string };
  raw?: { metadata?: { attributes?: Attribute[] } };
};
type MaybeFetchError = { message?: string };

// Helper: decode tokenURI into typed metadata
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

export default function NftModal({
  nft,
  onClose,
  onLinkConfirmHtml,
  onLinkConfirmPreview,
}: {
  nft: OwnedNftLite;
  onClose: () => void;
  onLinkConfirmHtml: (tokenId: bigint, entryId: number) => Promise<void>;
  onLinkConfirmPreview: (tokenId: bigint, entryId: number) => Promise<void>;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');

  // Normalize tokenId
  const tokenIdBig = useMemo(() => {
    const v = nft?.tokenId ?? '0';
    return typeof v === 'string' && v.startsWith('0x') ? BigInt(v) : BigInt(v);
  }, [nft?.tokenId]);

  // Read tokenURI directly from contract
  const { data: tokenUriRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CRUGAME_ABI.abi,
    functionName: 'tokenURI',
    args: [tokenIdBig],
    chainId: mainnet.id,
    query: { refetchInterval: 15_000 },
  });

  const metadata = useMemo(() => decodeTokenUri(tokenUriRaw as string | undefined), [tokenUriRaw]);
  const animationSrc = metadata?.animation_url;
  const imageSrc = metadata?.image;
  const attributes: Attribute[] = metadata?.attributes ?? [];

  const toggleFullscreen = () => {
    if (!iframeRef.current) return;
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  async function refreshThisTokenOnAlchemy() {
    try {
      setRefreshBusy(true);
      setRefreshMsg('Queuing refresh… it may take ~1 min for Alchemy to update.');
      await fetch(REFRESH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: CONTRACT_ADDRESS,
          tokenId: tokenIdBig.toString(),
        }),
      });
      setRefreshMsg('Refresh queued — check back shortly.');
    } catch (e: unknown) {
      const er = e as MaybeFetchError;
      setRefreshMsg(er?.message || 'Failed to refresh metadata');
    } finally {
      setRefreshBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-black text-[#00FF00] border-2 border-[#00FF00] p-6 max-w-3xl w-full max-h-[90vh] overflow-auto rounded-none">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-silkscreen">Token ID: {tokenIdBig.toString()}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setLinkOpen(true)}
              className="bg-[#00FF00] text-black font-silkscreen py-1 px-3 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00]"
            >
              Link
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="bg-[#00FF00] text-black font-silkscreen py-1 px-3 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00]"
            >
              Create
            </button>
            <button
              onClick={refreshThisTokenOnAlchemy}
              disabled={refreshBusy}
              className="bg-black text-[#00FF00] font-silkscreen py-1 px-3 border-2 border-[#00FF00] rounded-none hover:bg-[#001A00] disabled:bg-gray-600 disabled:text-[#00FF00] disabled:border-gray-600"
            >
              {refreshBusy ? 'Refreshing…' : 'Refresh'}
            </button>
            {animationSrc && (
              <button
                onClick={toggleFullscreen}
                className="bg-[#00FF00] text-black font-silkscreen py-1 px-3 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00]"
              >
                Fullscreen
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-[#00FF00] text-black font-silkscreen py-1 px-3 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00]"
            >
              Close
            </button>
          </div>
        </div>

        {refreshMsg && <p className="mb-3 text-sm opacity-80">{refreshMsg}</p>}

        {animationSrc ? (
          <iframe
            ref={iframeRef}
            src={animationSrc}
            className="w-full h-96 border-2 border-[#00FF00] rounded-none"
            title={`NFT ${tokenIdBig.toString()} Animation`}
            sandbox="allow-scripts"
          />
        ) : imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={`NFT ${tokenIdBig.toString()} Preview`}
            className="w-full h-96 border-2 border-[#00FF00] object-contain"
          />
        ) : (
          <p className="text-[#00FF00]">No animation or image available</p>
        )}

        <div className="mt-4">
          <h3 className="text-xl mb-2 font-silkscreen">Traits</h3>
          {attributes.length > 0 ? (
            <ul className="list-disc list-inside">
              {attributes.map((trait, i) => (
                <li key={i}>
                  {(trait?.trait_type ?? trait?.type ?? 'Trait')}: {String(trait?.value ?? '')}
                </li>
              ))}
            </ul>
          ) : (
            <p>No traits available</p>
          )}
        </div>
      </div>

      {linkOpen && (
        <LinkHtmlModal
          tokenId={tokenIdBig}
          onClose={() => setLinkOpen(false)}
          onConfirmHtml={async (entryId) => onLinkConfirmHtml(tokenIdBig, entryId)}
          onConfirmPreview={async (entryId) => onLinkConfirmPreview(tokenIdBig, entryId)}
        />
      )}

      {createOpen && (
        <CreateEntryModal tokenId={tokenIdBig} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}

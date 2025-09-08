// app/mint/page.tsx
'use client';

import { useMemo, useState } from 'react';
import Head from 'next/head';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useSwitchChain, useWriteContract } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { formatEther } from 'viem';

import Gallery from '@/components/Gallery';
import PixelRain from '@/components/PixelRain';
import CRUGAME_ABI from '@/abi/CruGame1337.json';
import SpriteTicker from '@/components/SpriteTicker';
import NftModal from '@/components/NftModal';

// ---- Minimal types for NFTs / attributes shown in UI ----
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

// ---- Error shape used to extract wagmi/viem messages safely ----
type MaybeWagmiError = {
  shortMessage?: string;
  message?: string;
  cause?: { shortMessage?: string; message?: string };
};

// ---- Minimal ERC721 ABI for balanceOf (whitelist check) ----
const ERC721_MIN_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const CONTRACT_ADDRESS = '0x05D8a0Df083bB20FfB9360B3aF458A5de5c9F2A4' as `0x${string}`;
const WHITELISTED_NFT_ADDRESS = '0x9251dEC8DF720C2ADF3B6f46d968107cbBADf4d4' as `0x${string}`;

export default function Page() {
  const [qty, setQty] = useState(1);
  const [txHash, setTxHash] = useState<`0x${string}` | ''>('');
  const [error, setError] = useState('');
  const [rain, setRain] = useState(false);
  const [mintSuccessCount, setMintSuccessCount] = useState<number | null>(null);
  const [selectedNft, setSelectedNft] = useState<OwnedNftLite | null>(null);

  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const onMainnet = chain?.id === mainnet.id;

  // reads
  const { data: totalSupplyRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CRUGAME_ABI.abi,
    functionName: 'totalSupply',
    query: { refetchInterval: 10_000 },
  });
  const { data: remainingSupplyRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CRUGAME_ABI.abi,
    functionName: 'remainingSupply',
    query: { refetchInterval: 10_000 },
  });
  const { data: pausedRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CRUGAME_ABI.abi,
    functionName: 'paused',
    query: { refetchInterval: 10_000 },
  });
  const { data: priceRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CRUGAME_ABI.abi,
    functionName: 'PUBLIC_MINT_PRICE',
    query: { refetchInterval: 30_000 },
  });
  const { data: hasFreeMintedRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CRUGAME_ABI.abi,
    functionName: 'hasFreeMinted',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  // skull holder eligibility (whitelist)
  const { data: skullBalanceRaw } = useReadContract({
    address: WHITELISTED_NFT_ADDRESS,
    abi: ERC721_MIN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: mainnet.id,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  // ---- BigInt-safe conversions (no 0n literals; ES2019-friendly) ----
  const skullBal = typeof skullBalanceRaw === 'bigint' ? skullBalanceRaw : BigInt(0);
  const isEligible = skullBal > BigInt(0);

  const totalSupply = Number((totalSupplyRaw as bigint | undefined) ?? BigInt(0));
  const remainingSupply = Number((remainingSupplyRaw as bigint | undefined) ?? BigInt(0));
  const isPaused = Boolean(pausedRaw);

  const priceWei = (typeof priceRaw === 'bigint' ? priceRaw : BigInt(0));
  const priceEth = formatEther(priceWei);
  const hasFreeMinted = Boolean(hasFreeMintedRaw);

  const { writeContractAsync, isPending } = useWriteContract();

  const handleMint = async () => {
    setError('');
    setTxHash('');
    setMintSuccessCount(null);
    try {
      if (!isConnected) throw new Error('Please connect your wallet.');
      if (!onMainnet) {
        switchChain({ chainId: mainnet.id });
        return;
      }
      if (qty < 1 || qty > 10) throw new Error('Quantity must be 1–10.');
      if (isPaused) throw new Error('Mint is paused.');
      if (remainingSupply <= 0) throw new Error('Sold out.');

      type MintFn = 'mint' | 'batchMint';
      const isFree = isEligible && !hasFreeMinted && qty === 1;
      const value = isFree ? BigInt(0) : priceWei * BigInt(qty);
      const fn: MintFn = qty === 1 ? 'mint' : 'batchMint';
      const args = fn === 'mint' ? ([] as []) : ([BigInt(qty)] as [bigint]);

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CRUGAME_ABI.abi,
        functionName: fn,
        args,
        value,
      });
      setTxHash(hash);
      setMintSuccessCount(qty);
      setRain(true);
    } catch (e: unknown) {
      const err = e as MaybeWagmiError;
      const msg =
        err?.shortMessage ??
        err?.cause?.shortMessage ??
        err?.message ??
        'Mint failed';
      setError(msg);
    }
  };

  const totalDisplay = useMemo(() => {
    const isFree = isEligible && !hasFreeMinted && qty === 1;
    return isFree ? '0 ETH (Free)' : `${(Number(priceEth) * qty).toFixed(6)} ETH`;
  }, [isEligible, hasFreeMinted, qty, priceEth]);

return (
  <div className="min-h-screen bg-black text-[#00FF00] flex flex-col items-center p-4 font-silkscreen relative">
    <Head>
      <title>1337 Cru Game Mint</title>
      <meta name="description" content="Mint your 1337 Cru Game NFT" />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    {/* Pixel rain overlay (auto stops after 9s) */}
    {rain && (
      <PixelRain
        active={rain}
        autoStopAfterMs={9000}
        onDone={() => setRain(false)}
      />
    )}

    <main className="flex flex-col items-center gap-6 max-w-md w-full">
      <h1 className="text-4xl text-[#FF0000] text-center">1337 Cru Game Mint</h1>
      <p className="text-center">
        Mint your fully on-chain HTML game NFT on ETH. 1337 SKULL HOLDER 1 FREE MINT. PUBLIC NO LIMIT
      </p>

      <ConnectButton />

      <div className="w-full bg-[#00FF00] text-black p-4 border-2 border-[#00FF00] rounded-none">
        <p>Total Supply: {totalSupply} / 1337</p>
        <p>Remaining: {remainingSupply}</p>
        <p>
          Price:{' '}
          {isEligible && !hasFreeMinted ? '0 ETH (Free Mint Eligible)' : `${priceEth} ETH`} per NFT
        </p>
        <p>Status: {isPaused ? 'Paused' : 'Active'}</p>
        {address && <p>Wallet: {address.slice(0, 6)}…{address.slice(-4)}</p>}
        {address && isEligible && !hasFreeMinted && (
          <p className="text-black font-bold mt-2">Eligible for 1 free mint!</p>
        )}
        {address && isEligible && hasFreeMinted && (
          <p className="text-black mt-2">Already claimed free mint.</p>
        )}
        {address && !isEligible && <p className="text-black mt-2">No 1337 SKULL detected.</p>}
      </div>

      {isConnected && (
        <div className="flex flex-col gap-4 w-full">
          {/* ROW 1: Quantity (+/−) and Total */}
          <div className="w-full flex flex-col gap-3 border-2 border-[#00FF00] p-3">
  {/* Row 1: label */}
  <div>
    <span className="text-[#00FF00]">Quantity (1–10):</span>
  </div>

  {/* Row 2: controls */}
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => setQty(Math.max(1, qty - 1))}
      className="px-3 py-2 border-2 border-[#00FF00] text-[#00FF00]"
      disabled={qty <= 1 || isPaused || remainingSupply === 0 || isPending}
    >
      −
    </button>

    <input
      type="number"
      min={1}
      max={10}
      value={qty}
      onChange={(e) => {
        const n = Number(e.target.value);
        setQty(Number.isFinite(n) ? n : 1);
      }}
      className="w-full text-center p-2 bg-black text-[#00FF00] border-2 border-[#00FF00]"
      disabled={isPaused || remainingSupply === 0 || isPending}
    />

    <button
      type="button"
      onClick={() => setQty(Math.min(10, qty + 1))}
      className="px-3 py-2 border-2 border-[#00FF00] text-[#00FF00]"
      disabled={qty >= 10 || isPaused || remainingSupply === 0 || isPending}
    >
      +
    </button>
  </div>

  {/* Row 3: total */}
  <div className="text-sm sm:text-base">
    Total: {totalDisplay}
  </div>
</div>



          <button
            onClick={handleMint}
            disabled={isPaused || remainingSupply === 0 || isPending}
            className="bg-[#00FF00] text-black py-2 px-4 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00] disabled:bg-gray-600 disabled:text-[#00FF00] disabled:border-gray-600"
          >
            {isEligible && !hasFreeMinted && qty === 1 ? 'Free Mint' : 'Mint'}
          </button>

          {error && <p className="text-[#FF0000]">{error}</p>}

          {mintSuccessCount && txHash && (
            <p>
              Successfully minted {mintSuccessCount}. Tx:{' '}
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                View on Etherscan
              </a>
            </p>
          )}
        </div>
      )}

                {/* ROW 2: Contract links */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-2">
            <span>Contract:</span>
            <div className="flex gap-4">
              <a
                href={`https://etherscan.io/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                Etherscan
              </a>
              <a
                href={`https://opensea.io/assets/ethereum/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                OpenSea
              </a>
            </div>
          </div>


      {/* Gallery now notifies us which NFT to open in the modal */}
      <Gallery
        owner={address}
        contractAddress={CONTRACT_ADDRESS}
        onSelect={(nft: OwnedNftLite) => setSelectedNft(nft)}
      />

      {/* NFT Modal with on-chain HTML preview + linking */}
      {selectedNft && (
        <NftModal
          nft={selectedNft}
          onClose={() => setSelectedNft(null)}
          onLinkConfirmHtml={async (tokenId: bigint, entryId: number) => {
            await writeContractAsync({
              address: CONTRACT_ADDRESS,
              abi: CRUGAME_ABI.abi,
              functionName: 'linkToHtmlEntry',
              args: [tokenId, BigInt(entryId)],
            });
          }}
          onLinkConfirmPreview={async (tokenId: bigint, entryId: number) => {
            await writeContractAsync({
              address: CONTRACT_ADDRESS,
              abi: CRUGAME_ABI.abi,
              functionName: 'linkToPreviewEntry',
              args: [tokenId, BigInt(entryId)],
            });
          }}
        />
      )}

      {/* Footer ticker (full viewport width) */}
      <footer className="w-full mt-10">
        <SpriteTicker height={60} pixelSize={10} speed={2} />
      </footer>
    </main>
  </div>
);


}

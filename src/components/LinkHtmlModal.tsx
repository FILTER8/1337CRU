// components/LinkHtmlModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import type { Abi } from 'abitype';
import CRUGAME_ABI from '@/abi/CruGame1337.json';

const CONTRACT_ADDRESS = '0x11dc1b59f6E396477CBe559D33c8103D0386B4ee' as const;
type AbiJson = { abi: Abi };
const ABI: Abi = (CRUGAME_ABI as AbiJson).abi ?? (CRUGAME_ABI as unknown as Abi);

type TabKind = 'html' | 'preview';

type MaybeWagmiError = {
  shortMessage?: string;
  message?: string;
  cause?: { shortMessage?: string; message?: string };
};

export default function LinkHtmlModal({
  tokenId,
  onClose,
  onConfirmHtml,
  onConfirmPreview,
}: {
  tokenId: bigint;
  onClose: () => void;
  onConfirmHtml: (entryId: number) => Promise<void>;
  onConfirmPreview: (entryId: number) => Promise<void>;
}) {
  const client = usePublicClient({ chainId: sepolia.id });

  const [tab, setTab] = useState<TabKind>('html');

  // HTML tab state
  const [htmlCountRaw, setHtmlCountRaw] = useState<bigint | number | null>(null);
  const [htmlSelected, setHtmlSelected] = useState<number | null>(null);
  const [htmlSrc, setHtmlSrc] = useState<string>('');
  const [htmlLoading, setHtmlLoading] = useState(false);

  // Preview tab state
  const [prevCountRaw, setPrevCountRaw] = useState<bigint | number | null>(null);
  const [prevSelected, setPrevSelected] = useState<number | null>(null);
  const [prevSrc, setPrevSrc] = useState<string>('');
  const [prevLoading, setPrevLoading] = useState(false);

  // Shared
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const htmlCount = useMemo(
    () => (htmlCountRaw == null ? null : Number(htmlCountRaw)),
    [htmlCountRaw]
  );
  const prevCount = useMemo(
    () => (prevCountRaw == null ? null : Number(prevCountRaw)),
    [prevCountRaw]
  );

  const htmlIds = useMemo(() => {
    if (!htmlCount || htmlCount <= 0) return [] as number[];
    return Array.from({ length: htmlCount }, (_, i) => i + 1);
  }, [htmlCount]);

  const prevIds = useMemo(() => {
    if (!prevCount || prevCount <= 0) return [] as number[];
    return Array.from({ length: prevCount }, (_, i) => i + 1);
  }, [prevCount]);

  // Initial fetch (both registries)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!client) {
          setErr('Public client not ready.');
          return;
        }
        const [hc, pc] = await Promise.all([
          client.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'getHtmlRegistryCount',
            args: [], // no-arg function must include empty args
          }) as Promise<bigint>,
          client.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'getPreviewRegistryCount',
            args: [], // no-arg function must include empty args
          }) as Promise<bigint>,
        ]);

        if (!mounted) return;
        setHtmlCountRaw(hc);
        setPrevCountRaw(pc);

        const nH = Number(hc);
        if (Number.isFinite(nH) && nH > 0) {
          setHtmlSelected(1);
          void loadHtml(1);
        }
        const nP = Number(pc);
        if (Number.isFinite(nP) && nP > 0) {
          setPrevSelected(1);
          void loadPreview(1);
        }
      } catch (e: unknown) {
        if (!mounted) return;
        const er = e as MaybeWagmiError;
        setErr(er?.shortMessage ?? er?.message ?? 'Failed to load registry counts');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [client]);

  // Loaders
  const loadHtml = async (id: number) => {
    setErr('');
    setHtmlLoading(true);
    setHtmlSrc('');
    try {
      if (!client) throw new Error('Public client not ready.');
      const dataUrl = (await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getHtmlRegistryEntry',
        args: [BigInt(id)],
      })) as string;

      if (!dataUrl?.startsWith?.('data:text/html')) throw new Error('Bad HTML data URL');
      setHtmlSrc(dataUrl);
    } catch (e: unknown) {
      const er = e as MaybeWagmiError;
      setErr(er?.shortMessage ?? er?.message ?? 'Failed to fetch HTML entry');
    } finally {
      setHtmlLoading(false);
    }
  };

  const loadPreview = async (id: number) => {
    setErr('');
    setPrevLoading(true);
    setPrevSrc('');
    try {
      if (!client) throw new Error('Public client not ready.');
      const dataUrl = (await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getPreviewRegistryEntry',
        args: [BigInt(id)],
      })) as string;

      if (!dataUrl?.startsWith?.('data:image')) throw new Error('Bad preview image data URL');
      setPrevSrc(dataUrl);
    } catch (e: unknown) {
      const er = e as MaybeWagmiError;
      setErr(er?.shortMessage ?? er?.message ?? 'Failed to fetch preview entry');
    } finally {
      setPrevLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="bg-black text-[#00FF00] border-2 border-[#00FF00] p-6 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-silkscreen">Link Token #{tokenId.toString()}</h2>
          <button
            onClick={onClose}
            className="bg-[#00FF00] text-black font-silkscreen py-1 px-3 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00]"
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['html', 'preview'] as TabKind[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'px-3 py-1 border-2 rounded-none font-silkscreen',
                tab === t
                  ? 'bg-[#00FF00] text-black border-[#00FF00]'
                  : 'bg-black text-[#00FF00] border-[#00FF00] hover:bg-[#00CC00]',
              ].join(' ')}
            >
              {t === 'html' ? 'HTML' : 'Preview'}
            </button>
          ))}
        </div>

        {err && <p className="text-[#FF0000] mb-3">{err}</p>}

        {/* HTML TAB */}
        {tab === 'html' && (
          <>
            {htmlCount === null && <p>Loading entries…</p>}
            {htmlCount !== null && htmlCount <= 0 && <p>No HTML entries on-chain.</p>}

            {htmlIds.length > 0 && (
              <>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-4">
                  {htmlIds.map((id) => (
                    <button
                      key={id}
                      onClick={() => {
                        setHtmlSelected(id);
                        void loadHtml(id);
                      }}
                      className={[
                        'border-2 rounded-none py-2 text-center font-silkscreen',
                        htmlSelected === id
                          ? 'bg-[#00FF00] text-black border-[#00FF00]'
                          : 'bg-black text-[#00FF00] border-[#00FF00] hover:bg-[#00CC00]',
                      ].join(' ')}
                    >
                      {id}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <h3 className="text-xl mb-2 font-silkscreen">HTML Preview</h3>
                  {htmlLoading && <p>Loading preview…</p>}
                  {!htmlLoading && htmlSrc && (
                    <iframe
                      key={htmlSelected ?? 0}
                      src={htmlSrc}
                      className="w-full h-[420px] border-2 border-[#00FF00] rounded-none"
                      sandbox="allow-scripts"
                      title={`HTML Entry ${htmlSelected ?? ''}`}
                    />
                  )}
                  {!htmlLoading && !htmlSrc && <p>Select an entry to preview.</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm opacity-90">
                    {htmlSelected ? (
                      <>
                        Selected: <span className="font-silkscreen">#{htmlSelected}</span>
                      </>
                    ) : (
                      'No entry selected'
                    )}
                  </div>
                  <button
                    disabled={!htmlSelected || busy}
                    onClick={async () => {
                      if (!htmlSelected) return;
                      try {
                        setBusy(true);
                        await onConfirmHtml(htmlSelected);
                        onClose();
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="bg-[#00FF00] text-black font-silkscreen py-2 px-4 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00] disabled:bg-gray-600 disabled:text-[#00FF00] disabled:border-gray-600"
                  >
                    {busy ? 'Linking…' : `Link HTML #${htmlSelected}`}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* PREVIEW TAB */}
        {tab === 'preview' && (
          <>
            {prevCount === null && <p>Loading entries…</p>}
            {prevCount !== null && prevCount <= 0 && <p>No Preview entries on-chain.</p>}

            {prevIds.length > 0 && (
              <>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-4">
                  {prevIds.map((id) => (
                    <button
                      key={id}
                      onClick={() => {
                        setPrevSelected(id);
                        void loadPreview(id);
                      }}
                      className={[
                        'border-2 rounded-none py-2 text-center font-silkscreen',
                        prevSelected === id
                          ? 'bg-[#00FF00] text-black border-[#00FF00]'
                          : 'bg-black text-[#00FF00] border-[#00FF00] hover:bg-[#00CC00]',
                      ].join(' ')}
                    >
                      {id}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <h3 className="text-xl mb-2 font-silkscreen">Image Preview</h3>
                  {prevLoading && <p>Loading preview…</p>}
                  {!prevLoading && prevSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={prevSelected ?? 0}
                      src={prevSrc}
                      alt={`Preview Entry ${prevSelected ?? ''}`}
                      className="w-full max-h-[420px] object-contain border-2 border-[#00FF00] rounded-none bg-black"
                    />
                  )}
                  {!prevLoading && !prevSrc && <p>Select an entry to preview.</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm opacity-90">
                    {prevSelected ? (
                      <>
                        Selected: <span className="font-silkscreen">#{prevSelected}</span>
                      </>
                    ) : (
                      'No entry selected'
                    )}
                  </div>
                  <button
                    disabled={!prevSelected || busy}
                    onClick={async () => {
                      if (!prevSelected) return;
                      try {
                        setBusy(true);
                        await onConfirmPreview(prevSelected);
                        onClose();
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="bg-[#00FF00] text-black font-silkscreen py-2 px-4 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00] disabled:bg-gray-600 disabled:text-[#00FF00] disabled:border-gray-600"
                  >
                    {busy ? 'Linking…' : `Link Preview #${prevSelected}`}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

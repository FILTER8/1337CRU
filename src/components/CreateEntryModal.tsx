// components/CreateEntryModal.tsx
'use client';

import { useMemo, useState } from 'react';
import { useWriteContract } from 'wagmi';
import type { Abi } from 'abitype';
import CRUGAME_ABI from '@/abi/CruGame1337.json';

const CONTRACT_ADDRESS = '0x05D8a0Df083bB20FfB9360B3aF458A5de5c9F2A4' as const;

// Narrow the JSON import to a proper Abi without using `any`
type AbiJson = { abi: Abi };
const ABI: Abi = (CRUGAME_ABI as AbiJson).abi ?? (CRUGAME_ABI as unknown as Abi);

// Small helper type to extract wagmi/viem error text safely (no `any`)
type MaybeWagmiError = {
  shortMessage?: string;
  message?: string;
  cause?: { shortMessage?: string; message?: string };
};

export default function CreateEntryModal({
  tokenId,
  onClose,
}: {
  tokenId: bigint;
  onClose: () => void;
}) {
  const { writeContractAsync, isPending } = useWriteContract();

  const [tab, setTab] = useState<'html' | 'preview'>('html');

  const [htmlUri, setHtmlUri] = useState<string>('');
  const [previewUri, setPreviewUri] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [tx, setTx] = useState<`0x${string}` | ''>('');

  const htmlValid = useMemo(() => {
    const v = htmlUri.trim().toLowerCase();
    return (
      v.startsWith('data:text/html;base64,') ||
      v.startsWith('data:text/html;utf8,') ||
      v.startsWith('data:text/html,')
    );
  }, [htmlUri]);

  const previewValid = useMemo(() => {
    const v = previewUri.trim().toLowerCase();
    // raster
    if (
      v.startsWith('data:image/png;base64,') ||
      v.startsWith('data:image/jpeg;base64,') ||
      v.startsWith('data:image/gif;base64,') ||
      v.startsWith('data:image/webp;base64,')
    )
      return true;
    // svg (utf8 or base64)
    if (
      v.startsWith('data:image/svg+xml;base64,') ||
      v.startsWith('data:image/svg+xml;utf8,') ||
      v.startsWith('data:image/svg+xml,')
    )
      return true;
    return false;
  }, [previewUri]);

  const createHtml = async () => {
    try {
      setErr('');
      setTx('');
      if (!htmlValid) throw new Error('Paste a valid HTML data URI.');
      setBusy(true);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'createHtmlEntry', // (tokenId, newHtml)
        args: [tokenId, htmlUri],
      });
      setTx(hash);
      onClose();
    } catch (e: unknown) {
      const er = e as MaybeWagmiError;
      setErr(er?.shortMessage ?? er?.message ?? 'Failed to create HTML entry');
    } finally {
      setBusy(false);
    }
  };

  const createPreview = async () => {
    try {
      setErr('');
      setTx('');
      if (!previewValid)
        throw new Error('Paste a valid image (PNG/JPEG/GIF/WEBP/SVG) data URI.');
      setBusy(true);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'createPreviewEntry', // (tokenId, newPreview)
        args: [tokenId, previewUri],
      });
      setTx(hash);
      onClose();
    } catch (e: unknown) {
      const er = e as MaybeWagmiError;
      setErr(er?.shortMessage ?? er?.message ?? 'Failed to create preview entry');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="bg-black text-[#00FF00] border-2 border-[#00FF00] p-6 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-silkscreen">
            Create Entry for Token #{tokenId.toString()}
          </h2>
          <button
            onClick={onClose}
            className="bg-[#00FF00] text-black font-silkscreen py-1 px-3 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00]"
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('html')}
            className={[
              'px-3 py-1 border-2 rounded-none font-silkscreen',
              tab === 'html'
                ? 'bg-[#00FF00] text-black border-[#00FF00]'
                : 'bg-black text-[#00FF00] border-[#00FF00] hover:bg-[#00CC00]',
            ].join(' ')}
          >
            HTML
          </button>
          <button
            onClick={() => setTab('preview')}
            className={[
              'px-3 py-1 border-2 rounded-none font-silkscreen',
              tab === 'preview'
                ? 'bg-[#00FF00] text-black border-[#00FF00]'
                : 'bg-black text-[#00FF00] border-[#00FF00] hover:bg-[#00CC00]',
            ].join(' ')}
          >
            Preview
          </button>
        </div>

        {err && <p className="text-[#FF0000] mb-3">{err}</p>}
        {tx && (
          <p className="mb-3">
            Tx:{' '}
            <a
              href={`https://etherscan.io/tx/${tx}`}
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              View on Etherscan
            </a>
          </p>
        )}

        {/* HTML tab */}
        {tab === 'html' && (
          <>
            <label className="block mb-2 font-silkscreen">
              HTML Data URI (data:text/html;base64|utf8,...)
            </label>
            <textarea
              value={htmlUri}
              onChange={(e) => setHtmlUri(e.target.value)}
              placeholder="e.g. data:text/html;base64,PHRpdGxlPk15IEhUTUw8L3RpdGxlPg=="
              className="w-full h-32 p-2 bg-black text-[#00FF00] border-2 border-[#00FF00] rounded-none font-mono"
            />
            <div className="my-4">
              <h3 className="text-xl mb-2 font-silkscreen">Preview</h3>
              {htmlValid ? (
                <iframe
                  src={htmlUri}
                  className="w-full h-[420px] border-2 border-[#00FF00] rounded-none"
                  sandbox="allow-scripts"
                  title="HTML preview"
                />
              ) : (
                <p>Paste a valid HTML data URI to see the preview.</p>
              )}
            </div>
            <button
              onClick={createHtml}
              disabled={!htmlValid || isPending || busy}
              className="bg-[#00FF00] text-black font-silkscreen py-2 px-4 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00] disabled:bg-gray-600 disabled:text-[#00FF00] disabled:border-gray-600"
            >
              {busy || isPending ? 'Creating…' : 'Create HTML Entry'}
            </button>
          </>
        )}

        {/* Preview tab */}
        {tab === 'preview' && (
          <>
            <label className="block mb-2 font-silkscreen">
              Preview Image Data URI (PNG/JPEG/GIF/WEBP/SVG)
            </label>
            <textarea
              value={previewUri}
              onChange={(e) => setPreviewUri(e.target.value)}
              placeholder="e.g. data:image/png;base64,iVBORw0...  or  data:image/svg+xml;utf8,<svg>...</svg>"
              className="w-full h-32 p-2 bg-black text-[#00FF00] border-2 border-[#00FF00] rounded-none font-mono"
            />
            <div className="my-4">
              <h3 className="text-xl mb-2 font-silkscreen">Preview</h3>
              {previewValid ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUri}
                  alt="Preview"
                  className="w-full max-h-[420px] object-contain border-2 border-[#00FF00] rounded-none bg-black"
                />
              ) : (
                <p>Paste a valid image data URI to see the preview.</p>
              )}
            </div>
            <button
              onClick={createPreview}
              disabled={!previewValid || isPending || busy}
              className="bg-[#00FF00] text-black font-silkscreen py-2 px-4 border-2 border-[#00FF00] rounded-none hover:bg-[#00CC00] disabled:bg-gray-600 disabled:text-[#00FF00] disabled:border-gray-600"
            >
              {busy || isPending ? 'Creating…' : 'Create Preview Entry'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useStore } from '../state/store.js';
import { exportPdf } from '../lib/exportPdf.js';
import { compressPdf, QUALITY_PRESETS } from '../lib/compressPdf.js';

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressModal({ onClose }) {
  const [quality, setQuality] = useState('balanced');
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState(null); // { bytes, originalSize }
  const addToast = useStore((s) => s.addToast);

  function selectQuality(id) {
    setQuality(id);
    setResult(null);
  }

  async function onCompress() {
    setWorking(true);
    try {
      const s = useStore.getState();
      const editedBytes = await exportPdf(s.arrayBuffer, {
        fieldValues: s.fieldValues,
        overlays: s.overlays,
        pageLayout: s.pageLayout,
        annotations: s.annotations,
        watermarkConfig: s.watermarkConfig,
        pageNumbersConfig: s.pageNumbersConfig,
      });
      const compressedBytes = await compressPdf(editedBytes, quality);
      setResult({ bytes: compressedBytes, originalSize: editedBytes.byteLength });
    } catch {
      addToast({ type: 'error', message: 'Compression failed — please try again' });
    } finally {
      setWorking(false);
    }
  }

  function download() {
    const s = useStore.getState();
    const blob = new Blob([result.bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (s.fileName ?? 'document').replace(/\.pdf$/i, '') + '-compressed.pdf';
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', message: 'Compressed PDF downloaded' });
    onClose();
  }

  const reduction = result ? Math.round((1 - result.bytes.byteLength / result.originalSize) * 100) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Compress PDF</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={19} strokeWidth={1.75} />
          </button>
        </div>
        <div className="modal-body">
          <div className="compress-warning">
            <AlertTriangle size={19} strokeWidth={1.75} />
            <span>This flattens your PDF into images to shrink it. Text will no longer be selectable or searchable, and fillable form fields become static. Best for documents you're finished editing.</span>
          </div>

          <div className="compress-tiers">
            {Object.entries(QUALITY_PRESETS).map(([id, t]) => (
              <button
                key={id}
                className={`compress-tier${quality === id ? ' compress-tier--active' : ''}`}
                onClick={() => selectQuality(id)}
              >
                <span className="compress-tier-label">{t.label}</span>
                <span className="compress-tier-hint">{t.hint}</span>
              </button>
            ))}
          </div>

          {result && (
            <div className="compress-result">
              {formatBytes(result.originalSize)} → {formatBytes(result.bytes.byteLength)}
              {reduction > 0 ? ` (${reduction}% smaller)` : ' — no size reduction, try a smaller quality tier'}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <div />
          <div className="modal-actions-right">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            {!result ? (
              <button className="btn-primary" onClick={onCompress} disabled={working}>
                {working ? 'Compressing…' : 'Compress'}
              </button>
            ) : (
              <button className="btn-primary" onClick={download}>Download compressed PDF</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

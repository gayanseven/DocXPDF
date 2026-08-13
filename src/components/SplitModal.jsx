import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../state/store.js';
import { renderPage } from '../lib/pdfRender.js';
import { splitPdf } from '../lib/mergeSplit.js';

const THUMB_WIDTH = 100;

function SplitThumb({ pageInfo, selected, onToggle }) {
  const canvasRef = useRef(null);
  const doc = useStore((s) => s.doc);

  useEffect(() => {
    if (!doc || !canvasRef.current) return;
    const scale = THUMB_WIDTH / pageInfo.width;
    renderPage(doc, pageInfo.index, canvasRef.current, scale).catch(() => {});
  }, [doc, pageInfo.index, pageInfo.width]);

  return (
    <label className={`split-thumb${selected ? ' split-thumb--selected' : ''}`}>
      <input type="checkbox" checked={selected} onChange={onToggle} />
      <canvas ref={canvasRef} />
      <span className="split-thumb-num">{pageInfo.index}</span>
    </label>
  );
}

export default function SplitModal({ onClose }) {
  const pages = useStore((s) => s.pages);
  const arrayBuffer = useStore((s) => s.arrayBuffer);
  const fileName = useStore((s) => s.fileName);
  const addToast = useStore((s) => s.addToast);
  const [selected, setSelected] = useState(() => new Set());
  const [working, setWorking] = useState(false);

  function toggle(index) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }

  async function onExtract() {
    if (selected.size === 0) return;
    setWorking(true);
    try {
      const indices = [...selected].sort((a, b) => a - b).map((n) => n - 1);
      const [bytes] = await splitPdf(arrayBuffer, [indices]);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (fileName ?? 'document').replace(/\.pdf$/i, '') + '-extract.pdf';
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'Extracted pages downloaded' });
      onClose();
    } catch {
      addToast({ type: 'error', message: 'Split failed — please try again' });
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Split / Extract Pages</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <div className="modal-body">
          <p className="sig-hint">Select pages to extract into a new PDF.</p>
          <div className="split-grid">
            {pages.map((p) => (
              <SplitThumb key={p.index} pageInfo={p} selected={selected.has(p.index)} onToggle={() => toggle(p.index)} />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={() => setSelected(new Set(pages.map((p) => p.index)))}>Select all</button>
          <div className="modal-actions-right">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={onExtract} disabled={selected.size === 0 || working}>
              {working ? 'Extracting…' : `Extract ${selected.size || ''} page${selected.size === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

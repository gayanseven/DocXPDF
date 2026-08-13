import { useRef, useState, useEffect } from 'react';
import { useStore } from '../state/store.js';
import { loadPdf, getPageSizes } from '../lib/pdfRender.js';
import { exportPdf } from '../lib/exportPdf.js';

export default function Toolbar() {
  const inputRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const { fileName, doc, zoom, pendingSignature, setDoc, setZoom, reset, addToast } = useStore();

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await loadPdf(arrayBuffer);
      const pages = await getPageSizes(pdf);
      setDoc({ fileName: file.name, arrayBuffer, doc: pdf, pages });
      addToast({ type: 'success', message: `"${file.name}" loaded` });
    } catch {
      addToast({ type: 'error', message: 'Failed to load PDF' });
    }
  }

  async function onExport() {
    const s = useStore.getState();
    setExporting(true);
    try {
      const bytes = await exportPdf(s.arrayBuffer, s.fieldValues, s.overlays);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (s.fileName ?? 'document').replace(/\.pdf$/i, '') + '-edited.pdf';
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'PDF exported successfully' });
    } catch {
      addToast({ type: 'error', message: 'Export failed — please try again' });
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    if (!doc || pendingSignature) return;
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { setActiveTool } = useStore.getState();
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 't' || e.key === 'T') setActiveTool('text');
      if (e.key === 's' || e.key === 'S') setActiveTool('signature');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, pendingSignature]);

  const baseName = fileName ? fileName.replace(/\.pdf$/i, '') : null;

  return (
    <header className="header">
      {/* Brand */}
      <button className="header-brand" onClick={() => inputRef.current?.click()} title="Open PDF">
        <span className="header-brand-docx">DOCX</span>
        <span className="header-brand-pdf">PDF</span>
      </button>
      <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={onFile} />

      <div className="header-divider" />

      {/* File name */}
      <div className="header-file">
        <span className="header-filename">{baseName ?? 'Untitled'}</span>
        <span className="header-badge">PDF</span>
      </div>

      <div className="header-spacer" />

      {doc && (
        <>
          {/* Zoom */}
          <div className="header-zoom">
            <button className="header-zoom-btn" onClick={() => setZoom(zoom - 0.15)} aria-label="Zoom out">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
            <span className="header-zoom-val">{Math.round(zoom * 100)}%</span>
            <button className="header-zoom-btn" onClick={() => setZoom(zoom + 0.15)} aria-label="Zoom in">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="header-divider" />

          {/* Export */}
          <button className="header-btn-export" onClick={onExport} disabled={exporting}>
            {exporting ? (
              <svg width="14" height="14" viewBox="0 0 14 14" className="spin" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="18 13"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M4 6l3 4 3-4M1 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {exporting ? 'Exporting…' : 'Export'}
          </button>

          <div className="header-divider" />

          {/* Close */}
          <button className="header-btn-close" onClick={reset} aria-label="Close document">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </header>
  );
}

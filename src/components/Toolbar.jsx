import { useRef, useState } from 'react';
import { FolderOpen, Minus, Plus, Download, X, Loader2, Sun, Moon, Undo2, Redo2 } from 'lucide-react';
import { useStore } from '../state/store.js';
import { exportPdf } from '../lib/exportPdf.js';
import { loadPdfFile } from '../lib/loadFile.js';
import { clearSession } from '../lib/persistence.js';

export default function Toolbar() {
  const inputRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const {
    fileName, doc, zoom, loading, theme,
    pastHistory, futureHistory, undo, redo,
    setZoom, reset, toggleTheme, addToast,
  } = useStore();

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await loadPdfFile(file);
  }

  async function onExport() {
    const s = useStore.getState();
    setExporting(true);
    try {
      const bytes = await exportPdf(s.arrayBuffer, s.fieldValues, s.overlays, s.pageLayout);
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

  function onClose() {
    clearSession();
    reset();
  }

  const baseName = fileName ? fileName.replace(/\.pdf$/i, '') : null;

  return (
    <header className="header">
      {/* Brand / open */}
      <button className="header-brand" onClick={() => inputRef.current?.click()} title="Open PDF" disabled={loading}>
        {loading ? <Loader2 size={18} className="spin" /> : <FolderOpen size={18} strokeWidth={1.75} />}
        <span className="header-brand-text">PDF Editor</span>
      </button>
      <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={onFile} />

      {doc && (
        <>
          <div className="header-divider" />
          <div className="header-file">
            <span className="header-filename">{baseName}</span>
            <span className="header-badge">PDF</span>
          </div>

          <div className="header-divider" />

          {/* Undo / redo */}
          <button className="header-btn-icon" onClick={undo} disabled={pastHistory.length === 0} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo2 size={16} strokeWidth={1.75} />
          </button>
          <button className="header-btn-icon" onClick={redo} disabled={futureHistory.length === 0} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <Redo2 size={16} strokeWidth={1.75} />
          </button>
        </>
      )}

      <div className="header-spacer" />

      {doc && (
        <>
          {/* Zoom */}
          <div className="header-zoom">
            <button className="header-zoom-btn" onClick={() => setZoom(zoom - 0.15)} aria-label="Zoom out">
              <Minus size={13} strokeWidth={2} />
            </button>
            <span className="header-zoom-val">{Math.round(zoom * 100)}%</span>
            <button className="header-zoom-btn" onClick={() => setZoom(zoom + 0.15)} aria-label="Zoom in">
              <Plus size={13} strokeWidth={2} />
            </button>
          </div>

          <div className="header-divider" />

          {/* Export */}
          <button className="header-btn-export" onClick={onExport} disabled={exporting}>
            {exporting ? <Loader2 size={14} className="spin" /> : <Download size={14} strokeWidth={2} />}
            {exporting ? 'Exporting…' : 'Export'}
          </button>

          <div className="header-divider" />
        </>
      )}

      {/* Theme toggle */}
      <button className="header-btn-icon" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
        {theme === 'dark' ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
      </button>

      {doc && (
        <button className="header-btn-close" onClick={onClose} aria-label="Close document" title="Close document">
          <X size={16} strokeWidth={2} />
        </button>
      )}
    </header>
  );
}

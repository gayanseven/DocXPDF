import { useRef, useState } from 'react';
import { X, GripVertical, FilePlus2 } from 'lucide-react';
import { useStore } from '../state/store.js';
import { mergePdfs } from '../lib/mergeSplit.js';

const MAX_TOTAL_BYTES = 150 * 1024 * 1024;

export default function MergeModal({ onClose }) {
  const currentFileName = useStore((s) => s.fileName);
  const currentArrayBuffer = useStore((s) => s.arrayBuffer);
  const addToast = useStore((s) => s.addToast);
  const inputRef = useRef(null);
  const [files, setFiles] = useState(() =>
    currentArrayBuffer ? [{ id: crypto.randomUUID(), name: currentFileName, arrayBuffer: currentArrayBuffer }] : []
  );
  const [merging, setMerging] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  async function onFilePick(e) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    const loaded = await Promise.all(picked.map(async (f) => ({
      id: crypto.randomUUID(), name: f.name, arrayBuffer: await f.arrayBuffer(),
    })));
    setFiles((prev) => [...prev, ...loaded]);
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function onDrop(toIndex) {
    if (dragIndex === null || dragIndex === toIndex) { setDragIndex(null); return; }
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
  }

  async function onMerge() {
    if (files.length < 2) return;
    const totalBytes = files.reduce((sum, f) => sum + f.arrayBuffer.byteLength, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      addToast({ type: 'info', message: 'That’s a lot of data — merging may be slow' });
    }
    setMerging(true);
    try {
      const bytes = await mergePdfs(files);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'Merged PDF downloaded' });
      onClose();
    } catch {
      addToast({ type: 'error', message: 'Merge failed — one of the files may be invalid' });
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Merge PDFs</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <div className="modal-body">
          <p className="sig-hint">Add PDFs and drag to reorder — they'll be combined in this order.</p>
          <div className="merge-queue">
            {files.length === 0 && <div className="sig-saved-empty">No files added yet</div>}
            {files.map((f, i) => (
              <div
                key={f.id}
                className={`merge-queue-item${dragIndex === i ? ' merge-queue-item--dragging' : ''}`}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(i)}
              >
                <GripVertical size={14} strokeWidth={1.75} />
                <span className="merge-queue-name">{f.name}</span>
                <button className="merge-queue-remove" onClick={() => removeFile(f.id)} aria-label="Remove">
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
          <button className="btn-ghost merge-add-btn" onClick={() => inputRef.current?.click()}>
            <FilePlus2 size={14} strokeWidth={1.75} />
            Add PDFs
          </button>
          <input ref={inputRef} type="file" accept="application/pdf" multiple hidden onChange={onFilePick} />
        </div>
        <div className="modal-actions">
          <div />
          <div className="modal-actions-right">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={onMerge} disabled={files.length < 2 || merging}>
              {merging ? 'Merging…' : 'Merge & Download'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

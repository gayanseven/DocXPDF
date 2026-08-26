import { useRef, useState } from 'react';
import { FileText, UploadCloud } from 'lucide-react';
import { loadPdfFile } from '../lib/loadFile.js';

export default function EmptyState() {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) loadPdfFile(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadPdfFile(file);
  }

  return (
    <div
      className={`empty${dragOver ? ' empty--drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="empty-icon">
        <FileText size={53} strokeWidth={1.4} />
      </div>
      <h1>Start editing a PDF</h1>
      <p>Drop a file here, or choose one below. Everything happens in your browser — nothing is uploaded anywhere.</p>
      <button className="empty-cta" onClick={() => inputRef.current?.click()}>
        <UploadCloud size={20} strokeWidth={2} />
        Choose a PDF
      </button>
      <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={onFile} />
    </div>
  );
}

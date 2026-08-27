import { useRef, useState } from 'react';
import { UploadCloud, FileSignature, PenTool, Pencil, Combine, Shrink, Sparkles } from 'lucide-react';
import { loadPdfFile } from '../lib/loadFile.js';
import emptyStateIllustration from '../assets/empty-state-illustration.png';

const FEATURES = [
  { Icon: FileSignature, label: 'Fill forms' },
  { Icon: PenTool, label: 'Sign' },
  { Icon: Pencil, label: 'Annotate' },
  { Icon: Combine, label: 'Merge' },
  { Icon: Shrink, label: 'Compress' },
];

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
      <img className="empty-illustration" src={emptyStateIllustration} alt="" />
      <span className="empty-free-badge">
        <Sparkles size={13} strokeWidth={2} />
        100% free, no sign-up
      </span>
      <h1>Start editing a PDF</h1>
      <p>Fill forms, sign, annotate, merge, and compress PDFs, completely free and entirely in your browser. Nothing is ever uploaded anywhere.</p>
      <ul className="empty-features">
        {FEATURES.map(({ Icon, label }) => (
          <li key={label} className="empty-feature">
            <Icon size={14} strokeWidth={2} />
            {label}
          </li>
        ))}
      </ul>
      <button className="empty-cta" onClick={() => inputRef.current?.click()}>
        <UploadCloud size={20} strokeWidth={2} />
        Upload a document
      </button>
      <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={onFile} />
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Stamp, Hash, Combine, Scissors } from 'lucide-react';
import { useStore } from '../state/store.js';

export default function ToolsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const setActiveModal = useStore((s) => s.setActiveModal);

  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  function openModal(name) {
    setOpen(false);
    setActiveModal(name);
  }

  return (
    <div className="tools-menu" ref={ref}>
      <button className="header-btn-icon" onClick={() => setOpen((o) => !o)} aria-label="More tools" title="More tools">
        <MoreHorizontal size={16} strokeWidth={1.75} />
      </button>
      {open && (
        <div className="tools-menu-dropdown">
          <button className="tools-menu-item" onClick={() => openModal('watermark')}>
            <Stamp size={15} strokeWidth={1.75} /> Watermark
          </button>
          <button className="tools-menu-item" onClick={() => openModal('pageNumbers')}>
            <Hash size={15} strokeWidth={1.75} /> Page numbers
          </button>
          <button className="tools-menu-item" onClick={() => openModal('merge')}>
            <Combine size={15} strokeWidth={1.75} /> Merge PDFs
          </button>
          <button className="tools-menu-item" onClick={() => openModal('split')}>
            <Scissors size={15} strokeWidth={1.75} /> Split / Extract
          </button>
        </div>
      )}
    </div>
  );
}

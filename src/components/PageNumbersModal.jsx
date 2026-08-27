import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../state/store.js';

const POSITIONS = [
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'top-left', label: 'Top Left' },
];
const FORMATS = [
  { id: 'n', label: '1' },
  { id: 'n_of_total', label: '1 / N' },
  { id: 'page_n', label: 'Page 1' },
  { id: 'page_n_of_total', label: 'Page 1 of N' },
];

export default function PageNumbersModal({ onClose }) {
  const config = useStore((s) => s.pageNumbersConfig);
  const setPageNumbersConfig = useStore((s) => s.setPageNumbersConfig);
  const addToast = useStore((s) => s.addToast);
  const [position, setPosition] = useState(config?.position ?? 'bottom-center');
  const [format, setFormat] = useState(config?.format ?? 'n');
  const [startAt, setStartAt] = useState(config?.startAt ?? 1);

  function apply() {
    setPageNumbersConfig({ position, format, startAt, fontSize: 10, color: '#71717a' });
    addToast({ type: 'success', message: 'Page numbers will be applied on export' });
    onClose();
  }

  function remove() {
    setPageNumbersConfig(null);
    addToast({ type: 'info', message: 'Page numbers removed' });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Page Numbers</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={19} strokeWidth={1.75} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field-row">
            <label>Position</label>
            <select className="sig-type-input field-row-control" value={position} onChange={(e) => setPosition(e.target.value)}>
              {POSITIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="field-row">
            <label>Format</label>
            <select className="sig-type-input field-row-control" value={format} onChange={(e) => setFormat(e.target.value)}>
              {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div className="field-row">
            <label>Start at</label>
            <input className="sig-type-input field-row-control" type="number" min="0" value={startAt} onChange={(e) => setStartAt(Number(e.target.value))} />
          </div>
          <p className="sig-hint">Applied when you export. This doesn't change the live preview.</p>
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={remove} disabled={!config}>Remove</button>
          <div className="modal-actions-right">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={apply}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}

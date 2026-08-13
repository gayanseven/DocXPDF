import { useRef, useEffect, useState } from 'react';
import { X, UploadCloud, Trash2 } from 'lucide-react';
import { useStore } from '../state/store.js';

const TABS = ['Draw', 'Type', 'Upload', 'Saved'];

export default function SignatureModal({ onPlace, onCancel }) {
  const savedSignatures = useStore((s) => s.savedSignatures);
  const [activeTab, setActiveTab] = useState(savedSignatures.length > 0 ? 'Saved' : 'Draw');

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Signature</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="modal-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`modal-tab${activeTab === tab ? ' modal-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {activeTab === 'Draw' && <DrawTab onPlace={onPlace} onCancel={onCancel} />}
          {activeTab === 'Type' && <TypeTab onPlace={onPlace} onCancel={onCancel} />}
          {activeTab === 'Upload' && <UploadTab onPlace={onPlace} onCancel={onCancel} />}
          {activeTab === 'Saved' && <SavedTab onPlace={onPlace} onCancel={onCancel} />}
        </div>
      </div>
    </div>
  );
}

/* ── Save-for-reuse checkbox, shared by Draw/Type/Upload ────────────────── */
function SaveToggle({ checked, onChange }) {
  return (
    <label className="sig-save-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      Save for reuse
    </label>
  );
}

/* ── Draw tab ─────────────────────────────────────────────────────────────── */
function DrawTab({ onPlace, onCancel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [save, setSave] = useState(false);
  const saveSignature = useStore((s) => s.saveSignature);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function onDown(e) {
    e.preventDefault();
    drawing.current = true;
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current.setPointerCapture?.(e.pointerId);
  }

  function onMove(e) {
    e.preventDefault();
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasStroke) setHasStroke(true);
  }

  function onUp() { drawing.current = false; }

  function pos(e) {
    const r = canvasRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  }

  function place() {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    if (save) saveSignature(dataUrl);
    onPlace(dataUrl);
  }

  return (
    <>
      <p className="sig-hint">Draw your signature in the box below</p>
      <div className="sig-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={500}
          height={180}
          className="sig-canvas"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
        <span className="sig-canvas-placeholder">Sign here</span>
      </div>
      <div className="modal-actions">
        <button className="btn-ghost" onClick={clear}>Clear</button>
        <div className="modal-actions-right" style={{ alignItems: 'center', gap: 16 }}>
          <SaveToggle checked={save} onChange={setSave} />
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={place} disabled={!hasStroke}>Place</button>
        </div>
      </div>
    </>
  );
}

/* ── Type tab ─────────────────────────────────────────────────────────────── */
function TypeTab({ onPlace, onCancel }) {
  const [text, setText] = useState('');
  const [save, setSave] = useState(false);
  const saveSignature = useStore((s) => s.saveSignature);

  function place() {
    if (!text.trim()) return;
    // Render typed text onto an offscreen canvas as a PNG.
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e293b';
    ctx.font = '64px "Dancing Script", "Brush Script MT", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.trim(), canvas.width / 2, canvas.height / 2);
    const dataUrl = canvas.toDataURL('image/png');
    if (save) saveSignature(dataUrl);
    onPlace(dataUrl);
  }

  return (
    <>
      <p className="sig-hint">Type your name and it will be rendered as a signature</p>
      <input
        className="sig-type-input"
        placeholder="Your full name"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && place()}
        autoFocus
      />
      {text.trim() && (
        <div className="sig-type-preview">
          <span style={{ fontFamily: '"Dancing Script", "Brush Script MT", cursive', fontSize: 40 }}>
            {text}
          </span>
        </div>
      )}
      <div className="modal-actions">
        <div />
        <div className="modal-actions-right" style={{ alignItems: 'center', gap: 16 }}>
          <SaveToggle checked={save} onChange={setSave} />
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={place} disabled={!text.trim()}>Place</button>
        </div>
      </div>
    </>
  );
}

function removeWhiteBackground(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 240) {
          data[i + 3] = 0;
        } else if (brightness > 200) {
          data[i + 3] = Math.round(data[i + 3] * (240 - brightness) / 40);
        }
      }
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      imageData.data.set(data);
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = src;
  });
}

/* ── Upload tab ───────────────────────────────────────────────────────────── */
function UploadTab({ onPlace, onCancel }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [save, setSave] = useState(false);
  const inputRef = useRef(null);
  const saveSignature = useStore((s) => s.saveSignature);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const cleaned = await removeWhiteBackground(ev.target.result);
      setDataUrl(cleaned);
    };
    reader.readAsDataURL(file);
  }

  function place() {
    if (save) saveSignature(dataUrl);
    onPlace(dataUrl);
  }

  return (
    <>
      <p className="sig-hint">Upload a PNG or JPG image of your signature</p>
      {!dataUrl ? (
        <div className="sig-upload-zone" onClick={() => inputRef.current?.click()}>
          <UploadCloud size={30} strokeWidth={1.5} />
          <span>Click to choose an image</span>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
        </div>
      ) : (
        <div className="sig-upload-preview">
          <img src={dataUrl} alt="Signature preview" />
          <button className="btn-ghost sig-upload-change" onClick={() => { setDataUrl(null); inputRef.current?.click(); }}>
            Change
          </button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
        </div>
      )}
      <div className="modal-actions">
        <div />
        <div className="modal-actions-right" style={{ alignItems: 'center', gap: 16 }}>
          <SaveToggle checked={save} onChange={setSave} />
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={place} disabled={!dataUrl}>Place</button>
        </div>
      </div>
    </>
  );
}

/* ── Saved tab ────────────────────────────────────────────────────────────── */
function SavedTab({ onPlace, onCancel }) {
  const savedSignatures = useStore((s) => s.savedSignatures);
  const deleteSignature = useStore((s) => s.deleteSignature);

  if (savedSignatures.length === 0) {
    return (
      <>
        <p className="sig-hint">No saved signatures yet — draw, type, or upload one and check "Save for reuse."</p>
        <div className="modal-actions">
          <div />
          <div className="modal-actions-right">
            <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="sig-hint">Click a saved signature to place it</p>
      <div className="sig-saved-grid">
        {savedSignatures.map((sig) => (
          <div key={sig.id} className="sig-saved-item" onClick={() => onPlace(sig.dataUrl)}>
            <img src={sig.dataUrl} alt="Saved signature" />
            <button
              className="sig-saved-remove"
              onClick={(e) => { e.stopPropagation(); deleteSignature(sig.id); }}
              title="Delete"
              aria-label="Delete saved signature"
            >
              <Trash2 size={10} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
      <div className="modal-actions">
        <div />
        <div className="modal-actions-right">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </>
  );
}

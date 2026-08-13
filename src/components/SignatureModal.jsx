import { useRef, useEffect, useState } from 'react';
import { X, UploadCloud } from 'lucide-react';

const TABS = ['Draw', 'Type', 'Upload'];

export default function SignatureModal({ onPlace, onCancel }) {
  const [activeTab, setActiveTab] = useState('Draw');

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
        </div>
      </div>
    </div>
  );
}

/* ── Draw tab ─────────────────────────────────────────────────────────────── */
function DrawTab({ onPlace, onCancel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

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
    onPlace(canvasRef.current.toDataURL('image/png'));
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
        <div className="modal-actions-right">
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
    onPlace(canvas.toDataURL('image/png'));
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
        <div className="modal-actions-right">
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
  const inputRef = useRef(null);

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
        <div className="modal-actions-right">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => onPlace(dataUrl)} disabled={!dataUrl}>Place</button>
        </div>
      </div>
    </>
  );
}

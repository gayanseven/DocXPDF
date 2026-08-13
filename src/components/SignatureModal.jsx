import { useRef, useEffect, useState } from 'react';

const TABS = ['Draw', 'Type', 'Upload'];

export default function SignatureModal({ onPlace, onCancel }) {
  const [activeTab, setActiveTab] = useState('Draw');

  return (
    <div className="sig-backdrop" onClick={onCancel}>
      <div className="sig-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sig-header">
          <h3 className="sig-title">Add Signature</h3>
          <button className="sig-close" onClick={onCancel} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="sig-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`sig-tab${activeTab === tab ? ' sig-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="sig-body">
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
      <div className="sig-actions">
        <button className="sig-btn-ghost" onClick={clear}>Clear</button>
        <div className="sig-actions-right">
          <button className="sig-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="sig-btn-primary" onClick={place} disabled={!hasStroke}>Place</button>
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
      <div className="sig-actions">
        <div />
        <div className="sig-actions-right">
          <button className="sig-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="sig-btn-primary" onClick={place} disabled={!text.trim()}>Place</button>
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
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          <span>Click to choose an image</span>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
        </div>
      ) : (
        <div className="sig-upload-preview">
          <img src={dataUrl} alt="Signature preview" />
          <button className="sig-btn-ghost sig-upload-change" onClick={() => { setDataUrl(null); inputRef.current?.click(); }}>
            Change
          </button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
        </div>
      )}
      <div className="sig-actions">
        <div />
        <div className="sig-actions-right">
          <button className="sig-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="sig-btn-primary" onClick={() => onPlace(dataUrl)} disabled={!dataUrl}>Place</button>
        </div>
      </div>
    </>
  );
}

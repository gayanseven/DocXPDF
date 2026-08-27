import { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { useStore } from '../state/store.js';

const COLORS = ['#71717a', '#dc2626', '#2563eb', '#16a34a'];

export default function WatermarkModal({ onClose }) {
  const watermarkConfig = useStore((s) => s.watermarkConfig);
  const setWatermarkConfig = useStore((s) => s.setWatermarkConfig);
  const addToast = useStore((s) => s.addToast);

  const [mode, setMode] = useState(watermarkConfig?.type ?? 'text');
  const [text, setText] = useState(watermarkConfig?.type === 'text' ? watermarkConfig.text : 'CONFIDENTIAL');
  const [color, setColor] = useState(watermarkConfig?.type === 'text' ? watermarkConfig.color : COLORS[0]);
  const [opacity, setOpacity] = useState(watermarkConfig?.opacity ?? 0.2);
  const [rotation, setRotation] = useState(watermarkConfig?.type === 'text' ? watermarkConfig.rotation : 45);
  const [fontSize, setFontSize] = useState(watermarkConfig?.type === 'text' ? watermarkConfig.fontSize : 48);
  const [dataUrl, setDataUrl] = useState(watermarkConfig?.type === 'image' ? watermarkConfig.dataUrl : null);

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  function apply() {
    if (mode === 'text') {
      if (!text.trim()) return;
      setWatermarkConfig({ type: 'text', text: text.trim(), color, opacity, rotation, fontSize });
    } else {
      if (!dataUrl) return;
      setWatermarkConfig({ type: 'image', dataUrl, opacity });
    }
    addToast({ type: 'success', message: 'Watermark will be applied on export' });
    onClose();
  }

  function remove() {
    setWatermarkConfig(null);
    addToast({ type: 'info', message: 'Watermark removed' });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Watermark</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={19} strokeWidth={1.75} />
          </button>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab${mode === 'text' ? ' modal-tab--active' : ''}`} onClick={() => setMode('text')}>Text</button>
          <button className={`modal-tab${mode === 'image' ? ' modal-tab--active' : ''}`} onClick={() => setMode('image')}>Image</button>
        </div>

        <div className="modal-body">
          {mode === 'text' ? (
            <>
              <input className="sig-type-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Watermark text" />
              <div className="field-row">
                <label>Color</label>
                <div className="field-row-control">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className={`field-swatch${color === c ? ' field-swatch--active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="field-row">
                <label>Opacity: {Math.round(opacity * 100)}%</label>
                <input className="field-row-control" type="range" min="0.05" max="0.6" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
              </div>
              <div className="field-row">
                <label>Rotation: {rotation}°</label>
                <input className="field-row-control" type="range" min="0" max="90" step="5" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
              </div>
              <div className="field-row">
                <label>Size: {fontSize}pt</label>
                <input className="field-row-control" type="range" min="20" max="96" step="4" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
              </div>
            </>
          ) : (
            <>
              {!dataUrl ? (
                <div className="sig-upload-zone" onClick={() => document.getElementById('wm-file-input').click()}>
                  <UploadCloud size={36} strokeWidth={1.5} />
                  <span>Click to choose a logo image</span>
                </div>
              ) : (
                <div className="sig-upload-preview">
                  <img src={dataUrl} alt="Watermark preview" />
                  <button className="btn-ghost sig-upload-change" onClick={() => setDataUrl(null)}>Change</button>
                </div>
              )}
              <input id="wm-file-input" type="file" accept="image/png,image/jpeg" hidden onChange={onFile} />
              <div className="field-row">
                <label>Opacity: {Math.round(opacity * 100)}%</label>
                <input className="field-row-control" type="range" min="0.05" max="0.8" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
              </div>
            </>
          )}
          <p className="sig-hint">Applied when you export. This doesn't change the live preview.</p>
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={remove} disabled={!watermarkConfig}>Remove watermark</button>
          <div className="modal-actions-right">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={apply}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}

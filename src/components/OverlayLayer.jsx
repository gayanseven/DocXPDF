import { useRef, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, X } from 'lucide-react';
import { useStore } from '../state/store.js';
import { pdfToScreen, screenToPdf, unrotatePoint } from '../lib/coords.js';

const FONT_SIZES = { xs: 10, sm: 12, md: 14, lg: 16, xl: 22 };
const DEFAULT_COLOR = '#18181b';
const COLORS = ['#18181b', '#dc2626', '#d97706', '#16a34a', '#2563eb', '#7c3aed', '#db2777'];
const FONT_FAMILIES = [
  { id: 'helvetica', label: 'Sans',  family: 'Helvetica, Arial, sans-serif' },
  { id: 'times',     label: 'Serif', family: '"Times New Roman", Times, serif' },
  { id: 'courier',   label: 'Mono',  family: '"Courier New", Courier, monospace' },
];

const ALIGNMENTS = [
  { id: 'left',   icon: <AlignLeft size={14} strokeWidth={1.75} /> },
  { id: 'center', icon: <AlignCenter size={14} strokeWidth={1.75} /> },
  { id: 'right',  icon: <AlignRight size={14} strokeWidth={1.75} /> },
];

export default function OverlayLayer({ pageNumber, rotation = 0 }) {
  const layerRef = useRef(null);
  const justAddedId = useRef(null);
  const textEditBefore = useRef(null);
  const colorEditBefore = useRef(null);
  const zoom = useStore((s) => s.zoom);
  const pages = useStore((s) => s.pages);
  const overlays = useStore((s) => s.overlays);
  const activeTool = useStore((s) => s.activeTool);
  const selectedOverlayId = useStore((s) => s.selectedOverlayId);
  const addOverlay = useStore((s) => s.addOverlay);
  const updateOverlay = useStore((s) => s.updateOverlay);
  const removeOverlay = useStore((s) => s.removeOverlay);
  const commitOverlayHistory = useStore((s) => s.commitOverlayHistory);
  const setSelectedOverlay = useStore((s) => s.setSelectedOverlay);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const setPendingSignature = useStore((s) => s.setPendingSignature);
  const addToast = useStore((s) => s.addToast);

  // Discrete (single-click) edits commit their own history entry immediately,
  // as opposed to continuous gestures (drag/resize/typing) which commit once
  // at gesture-end — see startDrag/startResize and the text input's blur.
  function updateOverlayCommitted(id, patch) {
    const before = useStore.getState().overlays;
    updateOverlay(id, patch);
    commitOverlayHistory(before);
  }

  const pageInfo = pages.find((p) => p.index === pageNumber);
  const isSelect = activeTool === 'select';
  const pageOverlays = pageInfo ? overlays.filter((o) => o.page === pageNumber) : [];

  // Auto-focus a newly added text input after it renders.
  useEffect(() => {
    if (!justAddedId.current) return;
    const id = justAddedId.current;
    justAddedId.current = null;
    // Let React paint first, then find and focus the input.
    requestAnimationFrame(() => {
      const input = layerRef.current?.querySelector(`[data-overlay-id="${id}"] input`);
      input?.focus();
      input?.select();
    });
  }, [overlays]);

  // Click outside any overlay → deselect (select mode only).
  useEffect(() => {
    if (!isSelect) return;
    function onPointerDown(e) {
      if (!e.target.closest('[data-overlay-id]')) {
        setSelectedOverlay(null);
      }
    }
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [isSelect]);

  // Keyboard Delete / Backspace removes the selected overlay (select mode only).
  useEffect(() => {
    if (!isSelect) return;
    function onKey(e) {
      if ((e.key === 'Delete' || e.key === 'Backspace') &&
          e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (selectedOverlayId) {
          removeOverlay(selectedOverlayId);
          addToast({ type: 'info', message: 'Overlay removed' });
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSelect, selectedOverlayId]);

  if (!pageInfo) return null;

  // The layer is laid out in the page's UNROTATED space then visually
  // rotated with a CSS transform (see the style below) when a Page-Manager
  // rotation is applied — so pointer positions read off the (now rotated)
  // bounding box must be mapped back with unrotatePoint before any
  // screenToPdf call, or clicks/drags land in the wrong place.
  const w0 = pageInfo.width * zoom;
  const h0 = pageInfo.height * zoom;

  // ── click background to add ────────────────────────────────────────────────
  function handleBackgroundClick(e) {
    if (activeTool !== 'text' && activeTool !== 'signature') return;
    if (e.target !== layerRef.current) return;

    const rect = layerRef.current.getBoundingClientRect();
    const { x: sx, y: sy } = unrotatePoint(e.clientX - rect.left, e.clientY - rect.top, w0, h0, rotation);

    if (activeTool === 'text') {
      const p = screenToPdf({ x: sx, y: sy, w: 160, h: 32 }, pageInfo.height, zoom);
      const id = crypto.randomUUID();
      justAddedId.current = id;
      addOverlay({ id, page: pageNumber, type: 'text', x: p.x, y: p.y, w: p.w, h: p.h, text: '', fontSize: 12, textAlign: 'left', bold: false, italic: false, color: DEFAULT_COLOR, fontFamily: 'helvetica' });
      setSelectedOverlay(id);
      setActiveTool('select');
      addToast({ type: 'success', message: 'Text box added' });
    } else {
      const p = screenToPdf({ x: sx, y: sy, w: 180, h: 70 }, pageInfo.height, zoom);
      setPendingSignature({ page: pageNumber, x: p.x, y: p.y, w: p.w, h: p.h });
    }
  }

  // ── drag ──────────────────────────────────────────────────────────────────
  function startDrag(e, overlay) {
    if (activeTool !== 'select') return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedOverlay(overlay.id);
    const rect = layerRef.current.getBoundingClientRect();
    const start = unrotatePoint(e.clientX - rect.left, e.clientY - rect.top, w0, h0, rotation);
    const ox = overlay.x, oy = overlay.y;
    const z = zoom;
    const before = useStore.getState().overlays;

    function onMove(ev) {
      const cur = unrotatePoint(ev.clientX - rect.left, ev.clientY - rect.top, w0, h0, rotation);
      updateOverlay(overlay.id, {
        x: ox + (cur.x - start.x) / z,
        y: oy - (cur.y - start.y) / z,
      });
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      commitOverlayHistory(before);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // ── resize ────────────────────────────────────────────────────────────────
  function startResize(e, overlay) {
    e.preventDefault();
    e.stopPropagation();
    const rect = layerRef.current.getBoundingClientRect();
    const start = unrotatePoint(e.clientX - rect.left, e.clientY - rect.top, w0, h0, rotation);
    const sw = overlay.w, sh = overlay.h, spy = overlay.y;
    const z = zoom;
    const ratio = sw / sh;
    const before = useStore.getState().overlays;

    function onMove(ev) {
      const cur = unrotatePoint(ev.clientX - rect.left, ev.clientY - rect.top, w0, h0, rotation);
      const dw = (cur.x - start.x) / z;
      const dh = (cur.y - start.y) / z;
      if (overlay.type === 'signature') {
        const newW = Math.max(30, sw + dw);
        const newH = newW / ratio;
        updateOverlay(overlay.id, { w: newW, h: newH, y: spy - (newH - sh) });
      } else {
        const h = Math.max(15, sh + dh);
        updateOverlay(overlay.id, { w: Math.max(30, sw + dw), h, y: spy - (h - sh) });
      }
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      commitOverlayHistory(before);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const cursor = activeTool === 'text' ? 'text' : activeTool === 'signature' ? 'crosshair' : 'default';
  const layerStyle = rotation
    ? {
        cursor, position: 'absolute', top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        width: w0, height: h0,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }
    : { cursor };

  return (
    <div
      ref={layerRef}
      className={`overlay-layer${isSelect ? '' : ' overlay-layer--active'}`}
      style={layerStyle}
      onClick={handleBackgroundClick}
    >
      {pageOverlays.map((overlay) => {
        const s = pdfToScreen({ x: overlay.x, y: overlay.y, w: overlay.w, h: overlay.h }, pageInfo.height, zoom);
        const isSelected = isSelect && selectedOverlayId === overlay.id;

        return (
          <div
            key={overlay.id}
            data-overlay-id={overlay.id}
            className={`overlay-item${isSelect ? ' overlay-item--select' : ''}${isSelected ? ' overlay-item--selected' : ''}`}
            style={{ left: s.x, top: s.y, width: s.w, height: s.h }}
            onMouseDown={(e) => startDrag(e, overlay)}
            onClick={(e) => { if (isSelect) { e.stopPropagation(); setSelectedOverlay(overlay.id); } }}
          >
            {overlay.type === 'text' ? (
              <>
                {isSelected && (
                  <div className="text-format-bar" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="text-format-group">
                      {ALIGNMENTS.map(({ id, icon }) => (
                        <button
                          key={id}
                          className={`text-format-btn${(overlay.textAlign ?? 'left') === id ? ' text-format-btn--active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); updateOverlayCommitted(overlay.id, { textAlign: id }); }}
                          title={`Align ${id}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <div className="text-format-sep" />
                    <div className="text-format-group">
                      <button
                        className={`text-format-btn text-format-btn--bold${overlay.bold ? ' text-format-btn--active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); updateOverlayCommitted(overlay.id, { bold: !overlay.bold }); }}
                        title="Bold"
                      >B</button>
                      <button
                        className={`text-format-btn text-format-btn--italic${overlay.italic ? ' text-format-btn--active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); updateOverlayCommitted(overlay.id, { italic: !overlay.italic }); }}
                        title="Italic"
                      >I</button>
                    </div>
                    <div className="text-format-sep" />
                    <div className="text-format-group">
                      {Object.entries(FONT_SIZES).map(([label, size]) => (
                        <button
                          key={label}
                          className={`text-format-btn${overlay.fontSize === size ? ' text-format-btn--active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); updateOverlayCommitted(overlay.id, { fontSize: size }); }}
                          title={`Font size ${label}`}
                        >
                          {label.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="text-format-sep" />
                    <div className="text-format-group">
                      {FONT_FAMILIES.map(({ id, label }) => (
                        <button
                          key={id}
                          className={`text-format-btn${(overlay.fontFamily ?? 'helvetica') === id ? ' text-format-btn--active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); updateOverlayCommitted(overlay.id, { fontFamily: id }); }}
                          title={label}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="text-format-sep" />
                    <div className="text-format-group">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          className={`text-format-swatch${(overlay.color ?? DEFAULT_COLOR) === color ? ' text-format-swatch--active' : ''}`}
                          style={{ background: color }}
                          onClick={(e) => { e.stopPropagation(); updateOverlayCommitted(overlay.id, { color }); }}
                          title={color}
                        />
                      ))}
                      <input
                        type="color"
                        className="text-format-color-input"
                        value={overlay.color ?? DEFAULT_COLOR}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => { colorEditBefore.current = useStore.getState().overlays; }}
                        onChange={(e) => updateOverlay(overlay.id, { color: e.target.value })}
                        onBlur={() => {
                          if (colorEditBefore.current) commitOverlayHistory(colorEditBefore.current);
                          colorEditBefore.current = null;
                        }}
                        title="Custom color"
                      />
                    </div>
                  </div>
                )}
                <input
                  className="overlay-text-input"
                  value={overlay.text}
                  style={{
                    fontSize: Math.round(overlay.fontSize * zoom),
                    textAlign: overlay.textAlign ?? 'left',
                    fontWeight: overlay.bold ? '700' : '400',
                    fontStyle: overlay.italic ? 'italic' : 'normal',
                    fontFamily: FONT_FAMILIES.find((f) => f.id === overlay.fontFamily)?.family ?? FONT_FAMILIES[0].family,
                    color: overlay.color ?? DEFAULT_COLOR,
                  }}
                  onChange={(e) => updateOverlay(overlay.id, { text: e.target.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={() => {
                    if (isSelect) setSelectedOverlay(overlay.id);
                    textEditBefore.current = useStore.getState().overlays;
                  }}
                  onBlur={() => {
                    if (textEditBefore.current) commitOverlayHistory(textEditBefore.current);
                    textEditBefore.current = null;
                  }}
                  placeholder="Type here…"
                />
              </>
            ) : (
              <img
                src={overlay.dataUrl}
                style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none', mixBlendMode: 'multiply' }}
                draggable={false}
                alt="signature"
              />
            )}
            {isSelect && (
              <>
                <div className="overlay-resize" onMouseDown={(e) => startResize(e, overlay)} />
                <button
                  className="overlay-delete"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); removeOverlay(overlay.id); addToast({ type: 'info', message: 'Removed' }); }}
                  title="Remove"
                >
                  <X size={10} strokeWidth={2} />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

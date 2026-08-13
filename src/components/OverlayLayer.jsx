import { useRef, useEffect } from 'react';
import { useStore } from '../state/store.js';

const FONT_SIZES = { xs: 10, sm: 12, md: 14, lg: 16, xl: 22 };

const AlignLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 3h12M1 7h8M1 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const AlignCenterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 3h12M3 7h8M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const AlignRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 3h12M5 7h8M3 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const ALIGNMENTS = [
  { id: 'left',   icon: <AlignLeftIcon /> },
  { id: 'center', icon: <AlignCenterIcon /> },
  { id: 'right',  icon: <AlignRightIcon /> },
];
import { pdfToScreen, screenToPdf } from '../lib/coords.js';

export default function OverlayLayer({ pageNumber }) {
  const layerRef = useRef(null);
  const justAddedId = useRef(null);
  const zoom = useStore((s) => s.zoom);
  const pages = useStore((s) => s.pages);
  const overlays = useStore((s) => s.overlays);
  const activeTool = useStore((s) => s.activeTool);
  const selectedOverlayId = useStore((s) => s.selectedOverlayId);
  const addOverlay = useStore((s) => s.addOverlay);
  const updateOverlay = useStore((s) => s.updateOverlay);
  const removeOverlay = useStore((s) => s.removeOverlay);
  const setSelectedOverlay = useStore((s) => s.setSelectedOverlay);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const setPendingSignature = useStore((s) => s.setPendingSignature);
  const addToast = useStore((s) => s.addToast);

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

  // ── click background to add ────────────────────────────────────────────────
  function handleBackgroundClick(e) {
    if (activeTool !== 'text' && activeTool !== 'signature') return;
    if (e.target !== layerRef.current) return;

    const rect = layerRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (activeTool === 'text') {
      const p = screenToPdf({ x: sx, y: sy, w: 160, h: 32 }, pageInfo.height, zoom);
      const id = crypto.randomUUID();
      justAddedId.current = id;
      addOverlay({ id, page: pageNumber, type: 'text', x: p.x, y: p.y, w: p.w, h: p.h, text: '', fontSize: 12, textAlign: 'left', bold: false, italic: false });
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
    const sx = e.clientX, sy = e.clientY;
    const ox = overlay.x, oy = overlay.y;
    const z = zoom;

    function onMove(ev) {
      updateOverlay(overlay.id, {
        x: ox + (ev.clientX - sx) / z,
        y: oy - (ev.clientY - sy) / z,
      });
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // ── resize ────────────────────────────────────────────────────────────────
  function startResize(e, overlay) {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY;
    const sw = overlay.w, sh = overlay.h, spy = overlay.y;
    const z = zoom;
    const ratio = sw / sh;

    function onMove(ev) {
      const dw = (ev.clientX - sx) / z;
      const dh = (ev.clientY - sy) / z;
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
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const cursor = activeTool === 'text' ? 'text' : activeTool === 'signature' ? 'crosshair' : 'default';

  return (
    <div
      ref={layerRef}
      className={`overlay-layer${isSelect ? '' : ' overlay-layer--active'}`}
      style={{ cursor }}
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
                          onClick={(e) => { e.stopPropagation(); updateOverlay(overlay.id, { textAlign: id }); }}
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
                        onClick={(e) => { e.stopPropagation(); updateOverlay(overlay.id, { bold: !overlay.bold }); }}
                        title="Bold"
                      >B</button>
                      <button
                        className={`text-format-btn text-format-btn--italic${overlay.italic ? ' text-format-btn--active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); updateOverlay(overlay.id, { italic: !overlay.italic }); }}
                        title="Italic"
                      >I</button>
                    </div>
                    <div className="text-format-sep" />
                    <div className="text-format-group">
                      {Object.entries(FONT_SIZES).map(([label, size]) => (
                        <button
                          key={label}
                          className={`text-format-btn${overlay.fontSize === size ? ' text-format-btn--active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); updateOverlay(overlay.id, { fontSize: size }); }}
                          title={`Font size ${label}`}
                        >
                          {label.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <input
                  className="overlay-text-input"
                  value={overlay.text}
                  style={{ fontSize: Math.round(overlay.fontSize * zoom), textAlign: overlay.textAlign ?? 'left', fontWeight: overlay.bold ? '700' : '400', fontStyle: overlay.italic ? 'italic' : 'normal' }}
                  onChange={(e) => updateOverlay(overlay.id, { text: e.target.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={() => isSelect && setSelectedOverlay(overlay.id)}
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
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

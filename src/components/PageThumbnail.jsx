import { useEffect, useRef } from 'react';
import { RotateCcw, RotateCw, Copy, Trash2, GripVertical } from 'lucide-react';
import { useStore } from '../state/store.js';
import { renderPage } from '../lib/pdfRender.js';

const THUMB_WIDTH = 140;

export default function PageThumbnail({ item, index, displayNumber, dragging, onDragStart, onDragOver, onDrop }) {
  const canvasRef = useRef(null);
  const doc = useStore((s) => s.doc);
  const rotatePageItem = useStore((s) => s.rotatePageItem);
  const duplicatePageItem = useStore((s) => s.duplicatePageItem);
  const deletePageItem = useStore((s) => s.deletePageItem);
  const pageCount = useStore((s) => s.pageLayout.length);

  useEffect(() => {
    let cancelled = false;
    if (!doc || item.isBlank || !canvasRef.current) return;
    const scale = THUMB_WIDTH / item.width;
    renderPage(doc, item.sourcePage, canvasRef.current, scale, item.rotation).catch((err) => {
      if (!cancelled) console.error('Thumbnail render failed', err);
    });
    return () => { cancelled = true; };
  }, [doc, item.sourcePage, item.rotation, item.isBlank, item.width]);

  return (
    <div
      className={`page-thumb${dragging ? ' page-thumb--dragging' : ''}`}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={(e) => { e.preventDefault(); onDrop(index); }}
    >
      <div className="page-thumb-canvas-wrap">
        {item.isBlank ? (
          <div
            className="page-thumb-blank"
            style={{ width: THUMB_WIDTH - 16, height: (THUMB_WIDTH - 16) * (item.height / item.width) }}
          >
            Blank
          </div>
        ) : (
          <canvas ref={canvasRef} />
        )}
        <div className="page-thumb-drag"><GripVertical size={12} /></div>
      </div>
      <div className="page-thumb-footer">
        <span className="page-thumb-num">{displayNumber}</span>
        <div className="page-thumb-actions">
          <button title="Rotate left" onClick={() => rotatePageItem(item.id, -90)}><RotateCcw size={13} strokeWidth={1.75} /></button>
          <button title="Rotate right" onClick={() => rotatePageItem(item.id, 90)}><RotateCw size={13} strokeWidth={1.75} /></button>
          {!item.isBlank && (
            <button title="Duplicate" onClick={() => duplicatePageItem(item.id)}><Copy size={13} strokeWidth={1.75} /></button>
          )}
          <button title="Delete" disabled={pageCount <= 1} onClick={() => deletePageItem(item.id)}>
            <Trash2 size={13} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useStore } from '../state/store.js';
import { renderPage } from '../lib/pdfRender.js';
import FormFieldLayer from './FormFieldLayer.jsx';
import OverlayLayer from './OverlayLayer.jsx';

export default function PdfPage({ item, displayNumber, showAnnotations }) {
  const canvasRef = useRef(null);
  const doc = useStore((s) => s.doc);
  const zoom = useStore((s) => s.zoom);

  useEffect(() => {
    let cancelled = false;
    async function draw() {
      if (!doc || !canvasRef.current || item.isBlank) return;
      try {
        await renderPage(doc, item.sourcePage, canvasRef.current, zoom, item.rotation);
      } catch (err) {
        if (!cancelled) console.error(`Page ${item.sourcePage} render failed`, err);
      }
    }
    draw();
    return () => { cancelled = true; };
  }, [doc, item.sourcePage, item.rotation, item.isBlank, zoom]);

  return (
    <div className="page">
      <div className="page-num">Page {displayNumber}</div>
      <div className="page-layers">
        {item.isBlank ? (
          <div className="page-blank" style={{ width: item.width * zoom, height: item.height * zoom }} />
        ) : (
          <>
            <canvas ref={canvasRef} className="canvas-layer" />
            {showAnnotations && <FormFieldLayer pageNumber={item.sourcePage} rotation={item.rotation} />}
            {showAnnotations && <OverlayLayer pageNumber={item.sourcePage} rotation={item.rotation} />}
          </>
        )}
      </div>
    </div>
  );
}

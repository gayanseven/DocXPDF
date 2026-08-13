import { useEffect, useRef } from 'react';
import { useStore } from '../state/store.js';
import { renderPage } from '../lib/pdfRender.js';
import FormFieldLayer from './FormFieldLayer.jsx';
import OverlayLayer from './OverlayLayer.jsx';

export default function PdfPage({ pageNumber }) {
  const canvasRef = useRef(null);
  const doc = useStore((s) => s.doc);
  const zoom = useStore((s) => s.zoom);

  useEffect(() => {
    let cancelled = false;
    async function draw() {
      if (!doc || !canvasRef.current) return;
      try {
        await renderPage(doc, pageNumber, canvasRef.current, zoom);
      } catch (err) {
        if (!cancelled) console.error(`Page ${pageNumber} render failed`, err);
      }
    }
    draw();
    return () => { cancelled = true; };
  }, [doc, pageNumber, zoom]);

  return (
    <div className="page">
      <div className="page-num">Page {pageNumber}</div>
      <div className="page-layers">
        <canvas ref={canvasRef} className="canvas-layer" />
        <FormFieldLayer pageNumber={pageNumber} />
        <OverlayLayer pageNumber={pageNumber} />
      </div>
    </div>
  );
}

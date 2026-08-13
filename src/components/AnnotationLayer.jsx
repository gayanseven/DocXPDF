import { useRef, useState, useEffect } from 'react';
import { useStore } from '../state/store.js';
import { pdfToScreen, screenToPdf, unrotatePoint } from '../lib/coords.js';

const MIN_POINT_DIST = 2; // px — decimates pen/highlighter points to keep stroke data compact
const SHAPE_TYPES = ['rect', 'ellipse', 'arrow'];

function bboxOf(a) {
  if (a.type === 'pen' || a.type === 'highlighter') {
    const xs = a.points.map((p) => p.x);
    const ys = a.points.map((p) => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  return { x: a.x, y: a.y, w: a.w, h: a.h };
}

function toPdfPoint(pt, pageHeight, zoom) {
  return screenToPdf({ x: pt.x, y: pt.y, w: 0, h: 0 }, pageHeight, zoom);
}

function toScreenPointsAttr(points, pageHeight, zoom) {
  return points.map((p) => {
    const s = pdfToScreen({ x: p.x, y: p.y, w: 0, h: 0 }, pageHeight, zoom);
    return `${s.x},${s.y}`;
  }).join(' ');
}

export default function AnnotationLayer({ pageNumber, rotation = 0 }) {
  const layerRef = useRef(null);
  const drawingRef = useRef(null);
  const [liveDraw, setLiveDraw] = useState(null);

  const zoom = useStore((s) => s.zoom);
  const pages = useStore((s) => s.pages);
  const annotations = useStore((s) => s.annotations);
  const activeTool = useStore((s) => s.activeTool);
  const subTool = useStore((s) => s.annotateSubTool);
  const color = useStore((s) => s.annotateColor);
  const strokeWidth = useStore((s) => s.annotateStrokeWidth);
  const addAnnotation = useStore((s) => s.addAnnotation);
  const removeAnnotation = useStore((s) => s.removeAnnotation);
  const selectedAnnotationId = useStore((s) => s.selectedAnnotationId);
  const setSelectedAnnotation = useStore((s) => s.setSelectedAnnotation);
  const addToast = useStore((s) => s.addToast);

  const pageInfo = pages.find((p) => p.index === pageNumber);
  const isActive = activeTool === 'annotate';
  const pageAnnotations = pageInfo ? annotations.filter((a) => a.page === pageNumber) : [];

  useEffect(() => {
    if (!isActive) return;
    function onKey(e) {
      if ((e.key === 'Delete' || e.key === 'Backspace') &&
          e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && selectedAnnotationId) {
        removeAnnotation(selectedAnnotationId);
        addToast({ type: 'info', message: 'Annotation removed' });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isActive, selectedAnnotationId]);

  // Deselect when clicking elsewhere.
  useEffect(() => {
    if (!isActive) return;
    function onPointerDown(e) {
      if (!e.target.closest('.annot-hit')) setSelectedAnnotation(null);
    }
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [isActive]);

  if (!pageInfo) return null;

  const w0 = pageInfo.width * zoom;
  const h0 = pageInfo.height * zoom;

  function localPoint(e) {
    const rect = layerRef.current.getBoundingClientRect();
    return unrotatePoint(e.clientX - rect.left, e.clientY - rect.top, w0, h0, rotation);
  }

  function onPointerDown(e) {
    if (!isActive || e.target !== layerRef.current) return;
    e.preventDefault();
    const p = localPoint(e);

    if (subTool === 'pen' || subTool === 'highlighter') {
      drawingRef.current = { type: subTool, points: [p] };
      setLiveDraw(drawingRef.current);
      window.addEventListener('pointermove', onMovePen);
      window.addEventListener('pointerup', onUpPen);
    } else {
      drawingRef.current = { type: subTool, start: p, end: p };
      setLiveDraw(drawingRef.current);
      window.addEventListener('pointermove', onMoveShape);
      window.addEventListener('pointerup', onUpShape);
    }
  }

  function onMovePen(e) {
    const p = localPoint(e);
    const pts = drawingRef.current.points;
    const last = pts[pts.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < MIN_POINT_DIST) return;
    pts.push(p);
    setLiveDraw({ ...drawingRef.current, points: [...pts] });
  }

  function onUpPen() {
    window.removeEventListener('pointermove', onMovePen);
    window.removeEventListener('pointerup', onUpPen);
    const { type, points } = drawingRef.current;
    drawingRef.current = null;
    setLiveDraw(null);
    if (points.length < 2) return;
    addAnnotation({
      id: crypto.randomUUID(),
      page: pageNumber,
      type,
      points: points.map((p) => toPdfPoint(p, pageInfo.height, zoom)),
      color,
      strokeWidth,
      opacity: type === 'highlighter' ? 0.35 : 1,
    });
  }

  function onMoveShape(e) {
    drawingRef.current.end = localPoint(e);
    setLiveDraw({ ...drawingRef.current });
  }

  function onUpShape() {
    window.removeEventListener('pointermove', onMoveShape);
    window.removeEventListener('pointerup', onUpShape);
    const { type, start, end } = drawingRef.current;
    drawingRef.current = null;
    setLiveDraw(null);
    const x1 = Math.min(start.x, end.x), y1 = Math.min(start.y, end.y);
    const wpx = Math.abs(end.x - start.x), hpx = Math.abs(end.y - start.y);
    if (wpx < 4 || hpx < 4) return;
    const rect = screenToPdf({ x: x1, y: y1, w: wpx, h: hpx }, pageInfo.height, zoom);
    addAnnotation({
      id: crypto.randomUUID(), page: pageNumber, type,
      x: rect.x, y: rect.y, w: rect.w, h: rect.h,
      color, strokeWidth, opacity: 1,
    });
  }

  const layerStyle = rotation
    ? {
        position: 'absolute', top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        width: w0, height: h0,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }
    : undefined;

  function renderShape(a) {
    const s = pdfToScreen({ x: a.x, y: a.y, w: a.w, h: a.h }, pageInfo.height, zoom);
    const hitProps = {
      className: 'annot-hit',
      style: { pointerEvents: isActive ? 'stroke' : 'none', cursor: isActive ? 'pointer' : 'default' },
      onClick: (e) => { e.stopPropagation(); if (isActive) setSelectedAnnotation(a.id); },
    };
    if (a.type === 'rect') {
      return <rect key={a.id} {...hitProps} x={s.x} y={s.y} width={s.w} height={s.h} fill="none" stroke={a.color} strokeWidth={a.strokeWidth} strokeOpacity={a.opacity} />;
    }
    if (a.type === 'ellipse') {
      return <ellipse key={a.id} {...hitProps} cx={s.x + s.w / 2} cy={s.y + s.h / 2} rx={Math.abs(s.w) / 2} ry={Math.abs(s.h) / 2} fill="none" stroke={a.color} strokeWidth={a.strokeWidth} strokeOpacity={a.opacity} />;
    }
    // arrow
    const x1 = s.x, y1 = s.y, x2 = s.x + s.w, y2 = s.y + s.h;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const ah = 10;
    const p1 = { x: x2 - ah * Math.cos(angle - Math.PI / 6), y: y2 - ah * Math.sin(angle - Math.PI / 6) };
    const p2 = { x: x2 - ah * Math.cos(angle + Math.PI / 6), y: y2 - ah * Math.sin(angle + Math.PI / 6) };
    return (
      <g key={a.id} {...hitProps}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={a.color} strokeWidth={a.strokeWidth} strokeOpacity={a.opacity} />
        <polyline points={`${p1.x},${p1.y} ${x2},${y2} ${p2.x},${p2.y}`} fill="none" stroke={a.color} strokeWidth={a.strokeWidth} strokeOpacity={a.opacity} strokeLinejoin="round" />
      </g>
    );
  }

  return (
    <div
      ref={layerRef}
      className={`annotation-layer${isActive ? ' annotation-layer--active' : ''}`}
      style={layerStyle}
      onPointerDown={onPointerDown}
    >
      <svg width={w0} height={h0} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {pageAnnotations.map((a) => {
          const isSelected = selectedAnnotationId === a.id;
          const selectionBox = isSelected && (() => {
            const b = pdfToScreen(bboxOf(a), pageInfo.height, zoom);
            const pad = 6;
            return (
              <rect
                key={`${a.id}-sel`}
                x={b.x - pad} y={b.y - pad} width={b.w + pad * 2} height={b.h + pad * 2}
                fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth={1.5} strokeDasharray="4 3" pointerEvents="none"
              />
            );
          })();

          if (a.type === 'pen' || a.type === 'highlighter') {
            return (
              <g key={a.id}>
                {selectionBox}
                <polyline
                  className="annot-hit"
                  points={toScreenPointsAttr(a.points, pageInfo.height, zoom)}
                  fill="none" stroke={a.color} strokeWidth={a.strokeWidth * zoom} strokeOpacity={a.opacity}
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ pointerEvents: isActive ? 'stroke' : 'none', cursor: isActive ? 'pointer' : 'default' }}
                  onClick={(e) => { e.stopPropagation(); if (isActive) setSelectedAnnotation(a.id); }}
                />
              </g>
            );
          }
          return <g key={a.id}>{selectionBox}{renderShape(a)}</g>;
        })}

        {liveDraw && (liveDraw.type === 'pen' || liveDraw.type === 'highlighter') && (
          <polyline
            points={liveDraw.points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke={color} strokeWidth={strokeWidth * zoom}
            strokeOpacity={liveDraw.type === 'highlighter' ? 0.35 : 1}
            strokeLinecap="round" strokeLinejoin="round"
          />
        )}
        {liveDraw && SHAPE_TYPES.includes(liveDraw.type) && (
          <rect
            x={Math.min(liveDraw.start.x, liveDraw.end.x)}
            y={Math.min(liveDraw.start.y, liveDraw.end.y)}
            width={Math.abs(liveDraw.end.x - liveDraw.start.x)}
            height={Math.abs(liveDraw.end.y - liveDraw.start.y)}
            fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray="4 3"
          />
        )}
      </svg>
    </div>
  );
}

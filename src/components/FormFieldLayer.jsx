import { useEffect, useState } from 'react';
import { useStore } from '../state/store.js';
import { getAnnotations } from '../lib/pdfRender.js';
import { pdfToScreen } from '../lib/coords.js';

export default function FormFieldLayer({ pageNumber, rotation = 0 }) {
  const doc = useStore((s) => s.doc);
  const zoom = useStore((s) => s.zoom);
  const pages = useStore((s) => s.pages);
  const fieldValues = useStore((s) => s.fieldValues);
  const setFieldValue = useStore((s) => s.setFieldValue);
  const [annotations, setAnnotations] = useState([]);

  const pageInfo = pages.find((p) => p.index === pageNumber);

  useEffect(() => {
    if (!doc || !pageInfo) return;
    let cancelled = false;
    getAnnotations(doc, pageNumber).then((anns) => {
      if (cancelled) return;
      setAnnotations(anns);
      // Seed store with existing PDF field values so export preserves them.
      anns.forEach((ann) => {
        if (ann.fieldName && ann.fieldValue != null) {
          useStore.getState().setFieldValue(ann.fieldName, ann.fieldValue);
        }
      });
    });
    return () => { cancelled = true; };
  }, [doc, pageNumber]);

  if (!pageInfo || annotations.length === 0) return null;

  // Fields are laid out in the page's UNROTATED coordinate space, then the
  // whole layer is rotated to match a Page-Manager rotation — see
  // lib/coords.js's unrotatePoint for why this is the paired approach.
  const layerStyle = rotation
    ? {
        position: 'absolute', top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        width: pageInfo.width * zoom, height: pageInfo.height * zoom,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }
    : undefined;

  return (
    <div className="field-layer" style={layerStyle}>
      {annotations.map((ann, i) => {
        const [x1, y1, x2, y2] = ann.rect;
        const s = pdfToScreen({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, pageInfo.height, zoom);
        const key = ann.id ?? ann.fieldName ?? i;
        const value = fieldValues[ann.fieldName] ?? ann.fieldValue ?? '';
        const style = {
          position: 'absolute',
          left: s.x,
          top: s.y,
          width: s.w,
          height: s.h,
        };
        // PDF spec field-flags bit 2 (value 2) marks a field required.
        const isRequired = (ann.fieldFlags & 0x2) !== 0;
        const showRequired = isRequired && !value;
        const inputClassName = `form-field-input${showRequired ? ' form-field-input--required' : ''}`;

        if (ann.fieldType === 'Tx') {
          const isMultiline = (ann.fieldFlags & 0x1000) !== 0;
          return isMultiline ? (
            <textarea
              key={key}
              className={inputClassName}
              style={{ ...style, resize: 'none' }}
              value={value}
              onChange={(e) => setFieldValue(ann.fieldName, e.target.value)}
            />
          ) : (
            <input
              key={key}
              className={inputClassName}
              style={style}
              value={value}
              onChange={(e) => setFieldValue(ann.fieldName, e.target.value)}
            />
          );
        }

        if (ann.fieldType === 'Btn') {
          const isRadio = (ann.fieldFlags & 0x8000) !== 0;
          return (
            <input
              key={key}
              type={isRadio ? 'radio' : 'checkbox'}
              className="form-field-check"
              style={{ ...style, cursor: 'pointer' }}
              checked={value === ann.buttonValue || value === true || value === 'true'}
              onChange={(e) => setFieldValue(ann.fieldName, e.target.checked ? ann.buttonValue ?? true : false)}
            />
          );
        }

        if (ann.fieldType === 'Ch') {
          return (
            <select
              key={key}
              className="form-field-input"
              style={style}
              value={value}
              onChange={(e) => setFieldValue(ann.fieldName, e.target.value)}
            >
              {(ann.options ?? []).map((opt) => (
                <option key={opt.exportValue} value={opt.exportValue}>
                  {opt.displayValue}
                </option>
              ))}
            </select>
          );
        }

        return null;
      })}
    </div>
  );
}

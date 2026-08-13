import { Pencil, Highlighter, Square, Circle, ArrowUpRight } from 'lucide-react';
import { useStore } from '../state/store.js';

const SUB_TOOLS = [
  { id: 'pen', label: 'Pen', Icon: Pencil },
  { id: 'highlighter', label: 'Highlighter', Icon: Highlighter },
  { id: 'rect', label: 'Rectangle', Icon: Square },
  { id: 'ellipse', label: 'Circle', Icon: Circle },
  { id: 'arrow', label: 'Arrow', Icon: ArrowUpRight },
];
const COLORS = ['#dc2626', '#d97706', '#16a34a', '#2563eb', '#7c3aed', '#18181b'];
const WIDTHS = [2, 4, 6];

export default function AnnotateToolbar() {
  const annotateSubTool = useStore((s) => s.annotateSubTool);
  const annotateColor = useStore((s) => s.annotateColor);
  const annotateStrokeWidth = useStore((s) => s.annotateStrokeWidth);
  const setAnnotateSubTool = useStore((s) => s.setAnnotateSubTool);
  const setAnnotateColor = useStore((s) => s.setAnnotateColor);
  const setAnnotateStrokeWidth = useStore((s) => s.setAnnotateStrokeWidth);

  return (
    <div className="annotate-toolbar">
      <div className="annotate-toolbar-group">
        {SUB_TOOLS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`annotate-toolbar-btn${annotateSubTool === id ? ' annotate-toolbar-btn--active' : ''}`}
            onClick={() => setAnnotateSubTool(id)}
            title={label}
          >
            <Icon size={15} strokeWidth={1.75} />
          </button>
        ))}
      </div>
      <div className="annotate-toolbar-sep" />
      <div className="annotate-toolbar-group">
        {COLORS.map((c) => (
          <button
            key={c}
            className={`annotate-toolbar-swatch${annotateColor === c ? ' annotate-toolbar-swatch--active' : ''}`}
            style={{ background: c }}
            onClick={() => setAnnotateColor(c)}
            title={c}
          />
        ))}
      </div>
      <div className="annotate-toolbar-sep" />
      <div className="annotate-toolbar-group">
        {WIDTHS.map((w) => (
          <button
            key={w}
            className={`annotate-toolbar-btn${annotateStrokeWidth === w ? ' annotate-toolbar-btn--active' : ''}`}
            onClick={() => setAnnotateStrokeWidth(w)}
            title={`${w}px`}
          >
            <span className="annotate-toolbar-width-dot" style={{ width: w + 3, height: w + 3 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

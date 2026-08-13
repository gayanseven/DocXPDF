import { Layers, MousePointer2, Type, Pencil, PenTool } from 'lucide-react';
import { useStore } from '../state/store.js';

const TOOLS = [
  { id: 'select', tooltip: 'Select', Icon: MousePointer2 },
  { id: 'text', tooltip: 'Add Text', Icon: Type },
  { id: 'annotate', tooltip: 'Annotate', Icon: Pencil },
  { id: 'signature', tooltip: 'Add Signature', Icon: PenTool },
];

export default function Sidebar() {
  const { doc, activeTool, setActiveTool, thumbnailPanelOpen, toggleThumbnailPanel } = useStore();

  return (
    <aside className="sidebar">
      <div className="sidebar-tools">
        <div className="has-tooltip" data-tooltip="Pages">
          <button
            className={`sidebar-btn${thumbnailPanelOpen ? ' sidebar-btn--active' : ''}`}
            onClick={() => doc && toggleThumbnailPanel()}
            aria-label="Pages"
            aria-pressed={thumbnailPanelOpen}
            disabled={!doc}
          >
            <Layers size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="sidebar-sep" />
        {TOOLS.map(({ id, tooltip, Icon }) => (
          <div key={id} className="has-tooltip" data-tooltip={tooltip}>
            <button
              className={`sidebar-btn${activeTool === id ? ' sidebar-btn--active' : ''}`}
              onClick={() => doc && setActiveTool(id)}
              aria-label={tooltip}
              aria-pressed={activeTool === id}
              disabled={!doc}
            >
              <Icon size={18} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

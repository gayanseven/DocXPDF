import { MousePointer2, Type, PenTool } from 'lucide-react';
import { useStore } from '../state/store.js';

const TOOLS = [
  { id: 'select', tooltip: 'Select', Icon: MousePointer2 },
  { id: 'text', tooltip: 'Add Text', Icon: Type },
  { id: 'signature', tooltip: 'Add Signature', Icon: PenTool },
];

export default function Sidebar() {
  const { doc, activeTool, setActiveTool } = useStore();

  return (
    <aside className="sidebar">
      <div className="sidebar-tools">
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

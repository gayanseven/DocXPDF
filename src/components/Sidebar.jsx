import { useStore } from '../state/store.js';

const TOOLS = [
  {
    id: 'select',
    tooltip: 'Select Text',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 2l10 5.5-5 1.5-2 5L3 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'text',
    tooltip: 'Add Text',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 4h10M8 4v9M6 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'signature',
    tooltip: 'Add Signature',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12c1-2 2-5 3-5s1 3 2 3 1.5-4 2.5-4 1 2 1.5 2 1-.5 1.5-.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 14h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'checkbox',
    tooltip: 'Add Checkbox',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="2.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { doc, activeTool, setActiveTool } = useStore();

  return (
    <aside className="sidebar">
      <div className="sidebar-tools">
        {TOOLS.map((t) => (
          <div key={t.id} className="sidebar-tooltip-wrap" data-tooltip={t.tooltip}>
            <button
              className={`sidebar-btn${activeTool === t.id ? ' sidebar-btn--active' : ''}`}
              onClick={() => doc && setActiveTool(t.id)}
              aria-label={t.tooltip}
              aria-pressed={activeTool === t.id}
              disabled={!doc}
            >
              {t.icon}
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

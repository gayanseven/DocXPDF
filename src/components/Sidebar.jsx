import { useStore } from '../state/store.js';
import iconCursor from '../assets/icons/cursor.png';
import iconForm from '../assets/icons/form.png';
import iconSignDocument from '../assets/icons/sign-document.png';
import iconPencil from '../assets/icons/pencil.png';
import iconLayers from '../assets/icons/layers.png';

const TOOLS = [
  { id: 'select', tooltip: 'Select', icon: iconCursor },
  { id: 'text', tooltip: 'Add Text', icon: iconForm },
  { id: 'signature', tooltip: 'Add Signature', icon: iconSignDocument },
  { id: 'annotate', tooltip: 'Annotate', icon: iconPencil },
];

export default function Sidebar() {
  const { doc, activeTool, setActiveTool, thumbnailPanelOpen, toggleThumbnailPanel } = useStore();

  return (
    <aside className="sidebar">
      <div className="sidebar-tools">
        {TOOLS.map(({ id, tooltip, icon }) => (
          <div key={id} className="has-tooltip" data-tooltip={tooltip}>
            <button
              className={`sidebar-btn${activeTool === id ? ' sidebar-btn--active' : ''}`}
              onClick={() => doc && setActiveTool(id)}
              aria-label={tooltip}
              aria-pressed={activeTool === id}
              disabled={!doc}
            >
              <img className="sidebar-icon-img" src={icon} alt="" />
            </button>
          </div>
        ))}
        <div className="has-tooltip" data-tooltip="Pages">
          <button
            className={`sidebar-btn${thumbnailPanelOpen ? ' sidebar-btn--active' : ''}`}
            onClick={() => doc && toggleThumbnailPanel()}
            aria-label="Pages"
            aria-pressed={thumbnailPanelOpen}
            disabled={!doc}
          >
            <img className="sidebar-icon-img" src={iconLayers} alt="" />
          </button>
        </div>
      </div>
    </aside>
  );
}

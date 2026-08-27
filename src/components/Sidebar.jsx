import { useStore } from '../state/store.js';
import iconCursor from '../assets/icons/cursor.png';
import iconCursorActive from '../assets/icons/cursor-active.png';
import iconForm from '../assets/icons/form.png';
import iconFormActive from '../assets/icons/form-active.png';
import iconSignDocument from '../assets/icons/sign-document.png';
import iconSignDocumentActive from '../assets/icons/sign-document-active.png';
import iconPencil from '../assets/icons/pencil.png';
import iconPencilActive from '../assets/icons/pencil-active.png';
import iconLayers from '../assets/icons/layers.png';
import iconLayersActive from '../assets/icons/layers-active.png';

const TOOLS = [
  { id: 'select', tooltip: 'Select', icon: iconCursor, iconActive: iconCursorActive },
  { id: 'text', tooltip: 'Add Text', icon: iconForm, iconActive: iconFormActive },
  { id: 'signature', tooltip: 'Add Signature', icon: iconSignDocument, iconActive: iconSignDocumentActive },
  { id: 'annotate', tooltip: 'Annotate', icon: iconPencil, iconActive: iconPencilActive },
];

export default function Sidebar() {
  const { doc, activeTool, setActiveTool, thumbnailPanelOpen, toggleThumbnailPanel } = useStore();

  return (
    <aside className="sidebar">
      <div className="sidebar-tools">
        {TOOLS.map(({ id, tooltip, icon, iconActive }) => (
          <div key={id} className="has-tooltip" data-tooltip={tooltip}>
            <button
              className={`sidebar-btn${activeTool === id ? ' sidebar-btn--active' : ''}`}
              onClick={() => doc && setActiveTool(id)}
              aria-label={tooltip}
              aria-pressed={activeTool === id}
              disabled={!doc}
            >
              <img
                className={`sidebar-icon-img${activeTool === id ? ' sidebar-icon-img--active' : ''}`}
                src={activeTool === id ? iconActive : icon}
                alt=""
              />
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
            <img
              className={`sidebar-icon-img${thumbnailPanelOpen ? ' sidebar-icon-img--active' : ''}`}
              src={thumbnailPanelOpen ? iconLayersActive : iconLayers}
              alt=""
            />
          </button>
        </div>
      </div>
    </aside>
  );
}

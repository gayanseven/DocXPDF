import { useState } from 'react';
import { X, FilePlus2 } from 'lucide-react';
import { useStore } from '../state/store.js';
import PageThumbnail from './PageThumbnail.jsx';

export default function PageManagerPanel() {
  const pageLayout = useStore((s) => s.pageLayout);
  const reorderPageLayout = useStore((s) => s.reorderPageLayout);
  const insertBlankPageItem = useStore((s) => s.insertBlankPageItem);
  const toggleThumbnailPanel = useStore((s) => s.toggleThumbnailPanel);
  const [dragIndex, setDragIndex] = useState(null);

  function handleDrop(toIndex) {
    if (dragIndex !== null && dragIndex !== toIndex) {
      reorderPageLayout(dragIndex, toIndex);
    }
    setDragIndex(null);
  }

  return (
    <aside className="page-panel">
      <div className="page-panel-header">
        <span className="page-panel-title">Pages</span>
        <div className="page-panel-header-actions">
          <button
            className="header-btn-icon"
            title="Insert blank page"
            aria-label="Insert blank page"
            onClick={() => insertBlankPageItem(pageLayout[pageLayout.length - 1]?.id)}
          >
            <FilePlus2 size={15} strokeWidth={1.75} />
          </button>
          <button className="header-btn-icon" title="Hide panel" aria-label="Hide pages panel" onClick={toggleThumbnailPanel}>
            <X size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <div className="page-panel-list">
        {pageLayout.map((item, index) => (
          <PageThumbnail
            key={item.id}
            item={item}
            index={index}
            displayNumber={index + 1}
            dragging={dragIndex === index}
            onDragStart={setDragIndex}
            onDragOver={() => {}}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </aside>
  );
}

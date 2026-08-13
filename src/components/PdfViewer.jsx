import { useStore } from '../state/store.js';
import PdfPage from './PdfPage.jsx';

export default function PdfViewer() {
  const pageLayout = useStore((s) => s.pageLayout);
  const seen = new Set();

  return (
    <div className="viewer">
      {pageLayout.map((item, displayIndex) => {
        // A duplicated page shares its sourcePage with an earlier item —
        // only the first occurrence renders its form fields/overlays, so
        // editing them doesn't silently edit "two pages" at once.
        const isPrimary = !item.isBlank && !seen.has(item.sourcePage);
        if (!item.isBlank) seen.add(item.sourcePage);

        return (
          <PdfPage
            key={item.id}
            item={item}
            displayNumber={displayIndex + 1}
            showAnnotations={isPrimary}
          />
        );
      })}
    </div>
  );
}

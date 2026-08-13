import { useStore } from '../state/store.js';
import PdfPage from './PdfPage.jsx';

export default function PdfViewer() {
  const pages = useStore((s) => s.pages);

  return (
    <div className="viewer">
      {pages.map((p) => (
        <PdfPage key={p.index} pageNumber={p.index} />
      ))}
    </div>
  );
}

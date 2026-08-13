import { useStore } from './state/store.js';
import Toolbar from './components/Toolbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import PdfViewer from './components/PdfViewer.jsx';
import SignatureModal from './components/SignatureModal.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const doc = useStore((s) => s.doc);
  const pendingSignature = useStore((s) => s.pendingSignature);
  const addOverlay = useStore((s) => s.addOverlay);
  const setPendingSignature = useStore((s) => s.setPendingSignature);
  const addToast = useStore((s) => s.addToast);

  function handleSignaturePlace(dataUrl) {
    const p = pendingSignature;
    addOverlay({
      id: crypto.randomUUID(),
      page: p.page,
      type: 'signature',
      x: p.x, y: p.y, w: p.w, h: p.h,
      dataUrl,
    });
    setPendingSignature(null);
    addToast({ type: 'success', message: 'Signature placed' });
  }

  return (
    <div className="app">
      <Toolbar />
      <div className="body">
        <Sidebar />
        <main className="stage">
          {doc ? (
            <PdfViewer />
          ) : (
            <div className="empty">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="4" width="28" height="36" rx="3" stroke="#d1d5db" strokeWidth="2"/>
                  <path d="M8 14h28M14 20h16M14 26h10" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="36" cy="36" r="10" fill="#2563eb"/>
                  <path d="M36 31v10M31 36h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h1>PDF Editor</h1>
              <p>Open a PDF to start editing. Add text, signatures, and fill forms. Everything stays in your browser.</p>
              <button className="empty-cta" onClick={() => document.querySelector('input[type=file]')?.click()}>
                Open PDF
              </button>
            </div>
          )}
        </main>
      </div>
      {pendingSignature && (
        <SignatureModal
          onPlace={handleSignaturePlace}
          onCancel={() => setPendingSignature(null)}
        />
      )}
      <Toast />
    </div>
  );
}

import { useEffect } from 'react';
import { useStore } from './state/store.js';
import { useSessionRecovery } from './hooks/useSessionRecovery.js';
import { useAutosave } from './hooks/useAutosave.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import Toolbar from './components/Toolbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import PageManagerPanel from './components/PageManagerPanel.jsx';
import AnnotateToolbar from './components/AnnotateToolbar.jsx';
import PdfViewer from './components/PdfViewer.jsx';
import EmptyState from './components/EmptyState.jsx';
import SignatureModal from './components/SignatureModal.jsx';
import WatermarkModal from './components/WatermarkModal.jsx';
import PageNumbersModal from './components/PageNumbersModal.jsx';
import RecoveryBanner from './components/RecoveryBanner.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const doc = useStore((s) => s.doc);
  const theme = useStore((s) => s.theme);
  const thumbnailPanelOpen = useStore((s) => s.thumbnailPanelOpen);
  const activeTool = useStore((s) => s.activeTool);
  const activeModal = useStore((s) => s.activeModal);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const pendingSignature = useStore((s) => s.pendingSignature);
  const addOverlay = useStore((s) => s.addOverlay);
  const setPendingSignature = useStore((s) => s.setPendingSignature);
  const addToast = useStore((s) => s.addToast);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useSessionRecovery();
  useAutosave();
  useKeyboardShortcuts();

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
      <RecoveryBanner />
      <div className="body">
        <Sidebar />
        {doc && thumbnailPanelOpen && <PageManagerPanel />}
        <main className="stage">
          {doc && activeTool === 'annotate' && <AnnotateToolbar />}
          {doc ? <PdfViewer /> : <EmptyState />}
        </main>
      </div>
      {pendingSignature && (
        <SignatureModal
          onPlace={handleSignaturePlace}
          onCancel={() => setPendingSignature(null)}
        />
      )}
      {activeModal === 'watermark' && <WatermarkModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'pageNumbers' && <PageNumbersModal onClose={() => setActiveModal(null)} />}
      <Toast />
    </div>
  );
}

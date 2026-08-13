import { useState } from 'react';
import { useStore } from '../state/store.js';
import { clearSession } from '../lib/persistence.js';

export default function RecoveryBanner() {
  const recoverableSession = useStore((s) => s.recoverableSession);
  const restoreFromSession = useStore((s) => s.restoreFromSession);
  const setRecoverableSession = useStore((s) => s.setRecoverableSession);
  const addToast = useStore((s) => s.addToast);
  const [restoring, setRestoring] = useState(false);

  if (!recoverableSession) return null;

  async function onRestore() {
    setRestoring(true);
    try {
      await restoreFromSession(recoverableSession);
      addToast({ type: 'success', message: 'Session restored' });
    } catch {
      addToast({ type: 'error', message: 'Could not restore session' });
      setRecoverableSession(null);
    } finally {
      setRestoring(false);
    }
  }

  function onDiscard() {
    clearSession();
    setRecoverableSession(null);
  }

  return (
    <div className="recovery-banner">
      <span className="recovery-banner-text">
        Restore your unsaved <strong>{recoverableSession.fileName}</strong> session?
      </span>
      <div className="recovery-banner-actions">
        <button className="btn-ghost" onClick={onDiscard} disabled={restoring}>Discard</button>
        <button className="btn-primary" onClick={onRestore} disabled={restoring}>
          {restoring ? 'Restoring…' : 'Restore'}
        </button>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useStore } from '../state/store.js';
import { loadSession } from '../lib/persistence.js';

/** On mount, check IndexedDB for a recent unsaved session and surface it via
 * store.recoverableSession (RecoveryBanner renders the restore/discard UI). */
export function useSessionRecovery() {
  useEffect(() => {
    loadSession().then((session) => {
      if (session && !useStore.getState().doc) {
        useStore.getState().setRecoverableSession(session);
      }
    });
  }, []);
}

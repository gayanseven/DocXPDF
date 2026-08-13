import { useEffect, useRef } from 'react';
import { useStore } from '../state/store.js';
import { saveSession } from '../lib/persistence.js';

const DEBOUNCE_MS = 2000;

/** Debounced write of the open document's edit state to IndexedDB, so a
 * reload can offer to restore it (see useSessionRecovery). */
export function useAutosave() {
  const timer = useRef(null);

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state, prev) => {
      if (!state.arrayBuffer) return;
      if (
        state.arrayBuffer === prev.arrayBuffer &&
        state.overlays === prev.overlays &&
        state.fieldValues === prev.fieldValues &&
        state.pageLayout === prev.pageLayout
      ) return;

      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const s = useStore.getState();
        if (!s.arrayBuffer) return;
        saveSession({
          fileName: s.fileName,
          arrayBuffer: s.arrayBuffer,
          overlays: s.overlays,
          fieldValues: s.fieldValues,
          pageLayout: s.pageLayout,
        });
      }, DEBOUNCE_MS);
    });
    return () => { unsubscribe(); clearTimeout(timer.current); };
  }, []);
}

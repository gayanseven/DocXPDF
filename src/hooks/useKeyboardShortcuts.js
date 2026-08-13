import { useEffect } from 'react';
import { useStore } from '../state/store.js';

/** App-wide keyboard shortcuts, centralized so new tools/actions register in
 * one place instead of each component wiring its own window listener. */
export function useKeyboardShortcuts() {
  useEffect(() => {
    function onKey(e) {
      const s = useStore.getState();
      if (!s.doc || s.pendingSignature) return;
      const isEditable = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

      if (e.key === '?' && !isEditable) { e.preventDefault(); s.setActiveModal('shortcuts'); return; }

      if ((e.metaKey || e.ctrlKey) && !isEditable) {
        const key = e.key.toLowerCase();
        if (key === 'z' && !e.shiftKey) { e.preventDefault(); s.undo(); return; }
        if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); s.redo(); return; }
      }

      if (isEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'v' || e.key === 'V') s.setActiveTool('select');
      if (e.key === 't' || e.key === 'T') s.setActiveTool('text');
      if (e.key === 'a' || e.key === 'A') s.setActiveTool('annotate');
      if (e.key === 's' || e.key === 'S') s.setActiveTool('signature');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

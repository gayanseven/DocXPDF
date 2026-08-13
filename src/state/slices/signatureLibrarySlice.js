const STORAGE_KEY = 'pdfeditor.savedSignatures';
const MAX_SAVED = 5;

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSaved(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage full/unavailable — saved signatures just won't persist across reloads.
  }
}

export const createSignatureLibrarySlice = (set, get) => ({
  savedSignatures: loadSaved(),

  saveSignature: (dataUrl) => {
    const entry = { id: crypto.randomUUID(), dataUrl, createdAt: Date.now() };
    const list = [entry, ...get().savedSignatures].slice(0, MAX_SAVED);
    persistSaved(list);
    set({ savedSignatures: list });
  },

  deleteSignature: (id) => {
    const list = get().savedSignatures.filter((sig) => sig.id !== id);
    persistSaved(list);
    set({ savedSignatures: list });
  },
});

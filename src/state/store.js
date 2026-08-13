import { create } from 'zustand';

function getInitialTheme() {
  const saved = localStorage.getItem('pdfeditor.theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useStore = create((set, get) => ({
  fileName: null,
  arrayBuffer: null,
  doc: null,
  pages: [],
  zoom: 1.2,
  fieldValues: {},
  overlays: [],
  activeTool: 'select',
  pendingSignature: null,
  toasts: [],
  selectedOverlayId: null,
  theme: getInitialTheme(),
  loading: false,

  setDoc: ({ fileName, arrayBuffer, doc, pages }) =>
    set({ fileName, arrayBuffer, doc, pages, fieldValues: {}, overlays: [], selectedOverlayId: null }),

  setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.5, zoom)) }),

  setActiveTool: (activeTool) => set({ activeTool, selectedOverlayId: null }),

  setFieldValue: (name, value) =>
    set((s) => ({ fieldValues: { ...s.fieldValues, [name]: value } })),

  addOverlay: (overlay) =>
    set((s) => ({ overlays: [...s.overlays, overlay] })),

  updateOverlay: (id, patch) =>
    set((s) => ({
      overlays: s.overlays.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),

  removeOverlay: (id) =>
    set((s) => ({
      overlays: s.overlays.filter((o) => o.id !== id),
      selectedOverlayId: s.selectedOverlayId === id ? null : s.selectedOverlayId,
    })),

  setSelectedOverlay: (id) => set({ selectedOverlayId: id }),

  setPendingSignature: (val) => set({ pendingSignature: val }),

  setLoading: (loading) => set({ loading }),

  setTheme: (theme) => {
    localStorage.setItem('pdfeditor.theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('pdfeditor.theme', next);
    set({ theme: next });
  },

  addToast: ({ type = 'info', message, duration = 3000 }) =>
    set((s) => {
      const id = crypto.randomUUID();
      // Auto-remove after duration via a timeout (set outside Zustand).
      setTimeout(() => {
        useStore.getState().removeToast(id);
      }, duration);
      return { toasts: [...s.toasts, { id, type, message }] };
    }),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  reset: () =>
    set({
      fileName: null,
      arrayBuffer: null,
      doc: null,
      pages: [],
      fieldValues: {},
      overlays: [],
      activeTool: 'select',
      pendingSignature: null,
      toasts: [],
      selectedOverlayId: null,
    }),
}));

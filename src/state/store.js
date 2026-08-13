import { create } from 'zustand';

export const useStore = create((set) => ({
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

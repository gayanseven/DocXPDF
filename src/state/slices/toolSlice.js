export const createToolSlice = (set) => ({
  activeTool: 'select',
  selectedOverlayId: null,
  pendingSignature: null,

  setActiveTool: (activeTool) => set({ activeTool, selectedOverlayId: null }),
  setSelectedOverlay: (id) => set({ selectedOverlayId: id }),
  setPendingSignature: (val) => set({ pendingSignature: val }),
});

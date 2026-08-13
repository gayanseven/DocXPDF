export const createToolSlice = (set) => ({
  activeTool: 'select',
  selectedOverlayId: null,
  pendingSignature: null,

  // Freehand-annotate sub-tool config, shared across all pages.
  annotateSubTool: 'pen', // 'pen' | 'highlighter' | 'rect' | 'ellipse' | 'arrow'
  annotateColor: '#dc2626',
  annotateStrokeWidth: 3,

  setActiveTool: (activeTool) => set({ activeTool, selectedOverlayId: null }),
  setSelectedOverlay: (id) => set({ selectedOverlayId: id }),
  setPendingSignature: (val) => set({ pendingSignature: val }),
  setAnnotateSubTool: (annotateSubTool) => set({ annotateSubTool }),
  setAnnotateColor: (annotateColor) => set({ annotateColor }),
  setAnnotateStrokeWidth: (annotateStrokeWidth) => set({ annotateStrokeWidth }),
});

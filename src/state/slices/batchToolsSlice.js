// One-shot batch operations (watermark, page numbers): configured once,
// applied uniformly across all pages at export time — not per-page state,
// not part of undo/redo, and intentionally not autosaved (re-configuring
// on next export is cheap and avoids surprising a user with a watermark
// they forgot they'd set on a previous session).
export const createBatchToolsSlice = (set) => ({
  activeModal: null, // null | 'watermark' | 'pageNumbers' | 'merge' | 'compress' | 'shortcuts'
  watermarkConfig: null, // { type:'text', text,color,opacity,rotation,fontSize } | { type:'image', dataUrl, opacity }
  pageNumbersConfig: null, // { position, format, startAt, fontSize, color }

  setActiveModal: (activeModal) => set({ activeModal }),
  setWatermarkConfig: (watermarkConfig) => set({ watermarkConfig }),
  setPageNumbersConfig: (pageNumbersConfig) => set({ pageNumbersConfig }),
});

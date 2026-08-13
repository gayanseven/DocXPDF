export const createOverlaySlice = (set, get) => ({
  overlays: [],

  addOverlay: (overlay) => {
    const before = get().overlays;
    const after = [...before, overlay];
    set({ overlays: after });
    get().pushHistory({ sliceKey: 'overlays', before, after });
  },

  // Plain, un-historied update — used for continuous gestures (drag, resize,
  // typing) that commit their own single history entry at gesture-end via
  // commitOverlayHistory below. Discrete callers (format-bar buttons) should
  // capture `before` themselves and call commitOverlayHistory right after.
  updateOverlay: (id, patch) =>
    set((s) => ({
      overlays: s.overlays.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),

  removeOverlay: (id) => {
    const before = get().overlays;
    const after = before.filter((o) => o.id !== id);
    set((s) => ({
      overlays: after,
      selectedOverlayId: s.selectedOverlayId === id ? null : s.selectedOverlayId,
    }));
    get().pushHistory({ sliceKey: 'overlays', before, after });
  },

  commitOverlayHistory: (before) => {
    const after = get().overlays;
    if (before === after) return;
    get().pushHistory({ sliceKey: 'overlays', before, after });
  },
});

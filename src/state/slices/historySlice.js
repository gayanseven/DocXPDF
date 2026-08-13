// Patch-based undo/redo. A patch is { sliceKey, before, after } — the whole
// value of one store field before/after a discrete edit. Continuous
// gestures (drag, resize, typing) push exactly one patch at gesture-end,
// not per-frame — see OverlayLayer.jsx's drag/resize/blur handlers.
const MAX_DEPTH = 50;

export const createHistorySlice = (set, get) => ({
  pastHistory: [],
  futureHistory: [],

  pushHistory: (patch) =>
    set((s) => ({
      pastHistory: [...s.pastHistory.slice(-(MAX_DEPTH - 1)), patch],
      futureHistory: [],
    })),

  undo: () => {
    const { pastHistory, futureHistory } = get();
    if (pastHistory.length === 0) return;
    const patch = pastHistory[pastHistory.length - 1];
    set({
      [patch.sliceKey]: patch.before,
      pastHistory: pastHistory.slice(0, -1),
      futureHistory: [...futureHistory, patch],
    });
  },

  redo: () => {
    const { pastHistory, futureHistory } = get();
    if (futureHistory.length === 0) return;
    const patch = futureHistory[futureHistory.length - 1];
    set({
      [patch.sliceKey]: patch.after,
      futureHistory: futureHistory.slice(0, -1),
      pastHistory: [...pastHistory, patch],
    });
  },
});

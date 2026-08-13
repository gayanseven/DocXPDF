export const createPageOpsSlice = (set, get) => ({
  pageLayout: [], // see state/pageLayout.js for item shape

  reorderPageLayout: (fromIndex, toIndex) => {
    const before = get().pageLayout;
    if (fromIndex === toIndex) return;
    const layout = [...before];
    const [moved] = layout.splice(fromIndex, 1);
    layout.splice(toIndex, 0, moved);
    set({ pageLayout: layout });
    get().pushHistory({ sliceKey: 'pageLayout', before, after: layout });
  },

  rotatePageItem: (id, delta) => {
    const before = get().pageLayout;
    const after = before.map((item) =>
      item.id === id ? { ...item, rotation: ((item.rotation + delta) % 360 + 360) % 360 } : item
    );
    set({ pageLayout: after });
    get().pushHistory({ sliceKey: 'pageLayout', before, after });
  },

  deletePageItem: (id) => {
    const before = get().pageLayout;
    const after = before.filter((item) => item.id !== id);
    set({ pageLayout: after });
    get().pushHistory({ sliceKey: 'pageLayout', before, after });
  },

  duplicatePageItem: (id) => {
    const before = get().pageLayout;
    const idx = before.findIndex((item) => item.id === id);
    if (idx === -1) return;
    const copy = { ...before[idx], id: crypto.randomUUID() };
    const after = [...before.slice(0, idx + 1), copy, ...before.slice(idx + 1)];
    set({ pageLayout: after });
    get().pushHistory({ sliceKey: 'pageLayout', before, after });
  },

  insertBlankPageItem: (afterId) => {
    const before = get().pageLayout;
    const idx = afterId ? before.findIndex((item) => item.id === afterId) : before.length - 1;
    const ref = before[Math.max(idx, 0)] ?? { width: 612, height: 792 };
    const blank = {
      id: crypto.randomUUID(), sourcePage: null, rotation: 0, isBlank: true,
      width: ref.width, height: ref.height,
    };
    const after = [...before.slice(0, idx + 1), blank, ...before.slice(idx + 1)];
    set({ pageLayout: after });
    get().pushHistory({ sliceKey: 'pageLayout', before, after });
  },
});

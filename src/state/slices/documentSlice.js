import { defaultPageLayout } from '../pageLayout.js';

export const createDocumentSlice = (set) => ({
  fileName: null,
  arrayBuffer: null,
  doc: null,
  pages: [],
  zoom: 1.2,

  setDoc: ({ fileName, arrayBuffer, doc, pages }) =>
    set({
      fileName, arrayBuffer, doc, pages,
      fieldValues: {}, overlays: [], selectedOverlayId: null,
      pastHistory: [], futureHistory: [],
      pageLayout: defaultPageLayout(pages),
    }),

  setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.5, zoom)) }),
});

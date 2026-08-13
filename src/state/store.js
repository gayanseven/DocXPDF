import { create } from 'zustand';
import { loadPdf, getPageSizes } from '../lib/pdfRender.js';
import { defaultPageLayout } from './pageLayout.js';
import { createDocumentSlice } from './slices/documentSlice.js';
import { createToolSlice } from './slices/toolSlice.js';
import { createOverlaySlice } from './slices/overlaySlice.js';
import { createFormSlice } from './slices/formSlice.js';
import { createUiSlice } from './slices/uiSlice.js';
import { createHistorySlice } from './slices/historySlice.js';
import { createPageOpsSlice } from './slices/pageOpsSlice.js';
import { createSignatureLibrarySlice } from './slices/signatureLibrarySlice.js';
import { createAnnotationSlice } from './slices/annotationSlice.js';
import { createBatchToolsSlice } from './slices/batchToolsSlice.js';

export const useStore = create((set, get) => ({
  ...createDocumentSlice(set, get),
  ...createToolSlice(set, get),
  ...createOverlaySlice(set, get),
  ...createFormSlice(set, get),
  ...createUiSlice(set, get),
  ...createHistorySlice(set, get),
  ...createPageOpsSlice(set, get),
  ...createSignatureLibrarySlice(set, get),
  ...createAnnotationSlice(set, get),
  ...createBatchToolsSlice(set, get),

  reset: () =>
    set({
      fileName: null,
      arrayBuffer: null,
      doc: null,
      pages: [],
      fieldValues: {},
      overlays: [],
      annotations: [],
      selectedAnnotationId: null,
      activeTool: 'select',
      pendingSignature: null,
      selectedOverlayId: null,
      pastHistory: [],
      futureHistory: [],
      pageLayout: [],
    }),

  // Rehydrate a document from a saved autosave record. Unlike setDoc (which
  // always starts a document fresh), this restores the prior overlays/field
  // values/page layout/annotations too — the pdfjs `doc` proxy itself can't
  // be persisted, so it's re-derived from the saved raw bytes.
  restoreFromSession: async (session) => {
    const pdf = await loadPdf(session.arrayBuffer);
    const pages = await getPageSizes(pdf);
    set({
      fileName: session.fileName,
      arrayBuffer: session.arrayBuffer,
      doc: pdf,
      pages,
      overlays: session.overlays ?? [],
      annotations: session.annotations ?? [],
      fieldValues: session.fieldValues ?? {},
      pageLayout: session.pageLayout ?? defaultPageLayout(pages),
      recoverableSession: null,
      pastHistory: [],
      futureHistory: [],
    });
  },
}));

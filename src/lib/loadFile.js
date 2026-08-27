import { loadPdf, getPageSizes } from './pdfRender.js';
import { useStore } from '../state/store.js';

const LARGE_FILE_BYTES = 100 * 1024 * 1024;

/**
 * Load a File (from an <input> or a drop event) into the store. Shared by
 * the header's "Open" input and the empty-state dropzone so both paths get
 * the same validation, loading state, and toasts.
 */
export async function loadPdfFile(file) {
  const { setDoc, addToast, setLoading } = useStore.getState();

  const looksLikePdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!looksLikePdf) {
    addToast({ type: 'error', message: 'Please choose a PDF file' });
    return;
  }
  if (file.size > LARGE_FILE_BYTES) {
    addToast({ type: 'info', message: 'Large file. This may take a moment' });
  }

  setLoading(true);
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await loadPdf(arrayBuffer);
    const pages = await getPageSizes(pdf);
    setDoc({ fileName: file.name, arrayBuffer, doc: pdf, pages });
    addToast({ type: 'success', message: `"${file.name}" loaded` });
  } catch {
    addToast({ type: 'error', message: 'Failed to load PDF' });
  } finally {
    setLoading(false);
  }
}

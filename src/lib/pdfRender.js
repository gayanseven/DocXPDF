// PDF.js setup + page rendering helpers.
//
// The single most common cause of a blank viewer is a missing/misconfigured
// worker. We import the worker as a URL so Vite bundles it, then point
// GlobalWorkerOptions at it. Do this once, at module load.
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Load a PDF from raw bytes.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<import('pdfjs-dist').PDFDocumentProxy>}
 */
export async function loadPdf(arrayBuffer) {
  // Clone the buffer: pdf.js transfers/detaches it, and we want to keep the
  // original bytes in app state for the export step (pdf-lib) later.
  const data = arrayBuffer.slice(0);
  const task = pdfjsLib.getDocument({ data });
  return task.promise;
}

// Tracks the in-flight pdfjs render task per canvas so a second render call
// (React StrictMode's double effect-invoke, or a rapid zoom change) cancels
// the stale one instead of racing it — pdfjs throws if two renders share a
// canvas concurrently.
const inFlightRenders = new WeakMap();

/**
 * Render one page onto a canvas at the given scale.
 * @param {import('pdfjs-dist').PDFDocumentProxy} doc
 * @param {number} pageNumber 1-based
 * @param {HTMLCanvasElement} canvas
 * @param {number} scale
 * @param {number} [rotation] additional rotation in degrees (0/90/180/270), on top of the page's own rotation
 * @returns {Promise<{width:number,height:number}|null>} CSS pixel size of the canvas, or null if superseded
 */
export async function renderPage(doc, pageNumber, canvas, scale, rotation = 0) {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation: (page.rotate + rotation) % 360 });
  const ctx = canvas.getContext('2d');

  // Handle high-DPI screens crisply.
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  inFlightRenders.get(canvas)?.cancel();
  const task = page.render({ canvasContext: ctx, viewport });
  inFlightRenders.set(canvas, task);

  try {
    await task.promise;
  } catch (err) {
    if (err?.name === 'RenderingCancelledException') return null;
    throw err;
  } finally {
    if (inFlightRenders.get(canvas) === task) inFlightRenders.delete(canvas);
  }
  return { width: viewport.width, height: viewport.height };
}

/**
 * Return all Widget annotations (AcroForm fields) for one page.
 * Normalises the rect so x1<x2 and y1<y2 (PDF pts, bottom-left origin).
 */
export async function getAnnotations(doc, pageNumber) {
  const page = await doc.getPage(pageNumber);
  const all = await page.getAnnotations();
  return all
    .filter((a) => a.subtype === 'Widget')
    .map((a) => ({
      ...a,
      rect: [
        Math.min(a.rect[0], a.rect[2]),
        Math.min(a.rect[1], a.rect[3]),
        Math.max(a.rect[0], a.rect[2]),
        Math.max(a.rect[1], a.rect[3]),
      ],
    }));
}

/**
 * Read each page's intrinsic size in PDF points (scale = 1).
 * Useful for the coordinate math and layout planning.
 */
export async function getPageSizes(doc) {
  const sizes = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    sizes.push({ index: i, width: vp.width, height: vp.height });
  }
  return sizes;
}

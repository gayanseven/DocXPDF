// "Compress" via rasterize-and-reassemble: pdf-lib has no public API to
// enumerate or replace an existing PDF's embedded images (only to embed
// new ones), so true in-place image recompression isn't possible with the
// libraries this app already uses. Instead, each page is rendered to a
// canvas at a reduced DPI and re-encoded as JPEG, then reassembled into a
// new, smaller, image-based PDF. This is a real, working reduction in file
// size, but it's a fundamentally different (and lossy) output: text is no
// longer selectable/searchable and AcroForm fields become static — see
// CompressModal.jsx for how that tradeoff is surfaced to the user.
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist'; // shares the worker already configured by lib/pdfRender.js

export const QUALITY_PRESETS = {
  high:     { dpi: 150, jpegQuality: 0.85, label: 'High quality', hint: 'Largest file, best fidelity' },
  balanced: { dpi: 110, jpegQuality: 0.7,  label: 'Balanced',     hint: 'Good tradeoff for most documents' },
  small:    { dpi: 72,  jpegQuality: 0.5,  label: 'Small size',   hint: 'Smallest file, more visible loss' },
};

/**
 * @param {Uint8Array} pdfBytes an already fully-edited/exported PDF (so
 *   overlays/annotations/watermark are baked in before compressing)
 * @param {'high'|'balanced'|'small'} quality
 * @returns {Promise<Uint8Array>}
 */
export async function compressPdf(pdfBytes, quality = 'balanced') {
  const preset = QUALITY_PRESETS[quality] ?? QUALITY_PRESETS.balanced;
  const scale = preset.dpi / 72; // pdfjs viewport scale=1 corresponds to 72 DPI

  const srcPdf = await pdfjsLib.getDocument({ data: pdfBytes.slice(0) }).promise;
  const outDoc = await PDFDocument.create();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  for (let i = 1; i <= srcPdf.numPages; i++) {
    const page = await srcPdf.getPage(i);
    const rasterViewport = page.getViewport({ scale });
    canvas.width = Math.max(1, Math.floor(rasterViewport.width));
    canvas.height = Math.max(1, Math.floor(rasterViewport.height));
    await page.render({ canvasContext: ctx, viewport: rasterViewport }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', preset.jpegQuality);
    const base64 = dataUrl.split(',')[1];
    const jpegBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const img = await outDoc.embedJpg(jpegBytes);

    // Preserve the original page's point dimensions (not the raster's
    // pixel dimensions) so the output page size matches the input.
    const ptSize = page.getViewport({ scale: 1 });
    const outPage = outDoc.addPage([ptSize.width, ptSize.height]);
    outPage.drawImage(img, { x: 0, y: 0, width: ptSize.width, height: ptSize.height });
  }

  return outDoc.save();
}

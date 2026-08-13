// Screen (CSS, top-left origin, Y down) <-> PDF (bottom-left origin, Y up).
// Centralized + pure so it can be unit-tested. This is where overlay bugs hide.

/**
 * Convert a screen-space rect (from the DOM overlay layer) to PDF coordinates
 * suitable for pdf-lib drawing.
 * @param {{x:number,y:number,w:number,h:number}} rect  in CSS px (within page)
 * @param {number} pageHeightPts  page height in PDF points (scale=1)
 * @param {number} scale  render scale used on screen
 * @returns {{x:number,y:number,w:number,h:number}} in PDF points
 */
export function screenToPdf(rect, pageHeightPts, scale) {
  const w = rect.w / scale;
  const h = rect.h / scale;
  const x = rect.x / scale;
  // Flip Y: pdf-lib's origin is bottom-left, and drawText/drawImage anchor
  // at the bottom-left of the element.
  const y = pageHeightPts - rect.y / scale - h;
  return { x, y, w, h };
}

/**
 * Convert a PDF-space rect (e.g. an AcroForm field rectangle) to screen px
 * for positioning HTML inputs over the canvas.
 * @param {{x:number,y:number,w:number,h:number}} rect  in PDF points
 * @param {number} pageHeightPts
 * @param {number} scale
 * @returns {{x:number,y:number,w:number,h:number}} in CSS px
 */
export function pdfToScreen(rect, pageHeightPts, scale) {
  const w = rect.w * scale;
  const h = rect.h * scale;
  const x = rect.x * scale;
  const y = (pageHeightPts - rect.y - rect.h) * scale;
  return { x, y, w, h };
}

import { PDFDocument, StandardFonts, rgb, degrees, LineCapStyle } from 'pdf-lib';

function fillForm(pdfDoc, fieldValues) {
  try {
    const form = pdfDoc.getForm();
    for (const [name, value] of Object.entries(fieldValues)) {
      try {
        const field = form.getField(name);
        const ctor = field.constructor.name;
        if (ctor === 'PDFTextField') {
          field.setText(value == null ? '' : String(value));
        } else if (ctor === 'PDFCheckBox') {
          value ? field.check() : field.uncheck();
        } else if (ctor === 'PDFDropdown') {
          field.select(String(value));
        }
      } catch {
        // Field missing or wrong type — skip.
      }
    }
  } catch {
    // PDF has no AcroForm — skip.
  }
}

const FONT_FAMILIES = {
  helvetica: [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.HelveticaOblique, StandardFonts.HelveticaBoldOblique],
  times:     [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic, StandardFonts.TimesRomanBoldItalic],
  courier:   [StandardFonts.Courier, StandardFonts.CourierBold, StandardFonts.CourierOblique, StandardFonts.CourierBoldOblique],
};

async function embedFonts(pdfDoc) {
  const fonts = {};
  for (const [family, [normal, bold, italic, boldItalic]] of Object.entries(FONT_FAMILIES)) {
    fonts[family] = {
      normal: await pdfDoc.embedFont(normal),
      bold: await pdfDoc.embedFont(bold),
      italic: await pdfDoc.embedFont(italic),
      boldItalic: await pdfDoc.embedFont(boldItalic),
    };
  }
  return fonts;
}

function pickFont(fonts, overlay) {
  const family = fonts[overlay.fontFamily] ?? fonts.helvetica;
  if (overlay.bold && overlay.italic) return family.boldItalic;
  if (overlay.bold) return family.bold;
  if (overlay.italic) return family.italic;
  return family.normal;
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

async function drawOverlay(pdfDoc, page, overlay, fonts) {
  if (overlay.type === 'text' && overlay.text) {
    const font = pickFont(fonts, overlay);
    const size = overlay.fontSize ?? 12;
    const align = overlay.textAlign ?? 'left';
    const lineHeight = size * 1.3;
    const lines = overlay.text.split('\n');

    lines.forEach((line, i) => {
      if (!line) return;
      let x = overlay.x;
      if (align === 'center') {
        x = overlay.x + (overlay.w - font.widthOfTextAtSize(line, size)) / 2;
      } else if (align === 'right') {
        x = overlay.x + overlay.w - font.widthOfTextAtSize(line, size);
      }
      page.drawText(line, {
        x,
        y: overlay.y + (lines.length - 1 - i) * lineHeight,
        size,
        font,
        color: hexToRgb(overlay.color) ?? rgb(0, 0, 0),
      });
    });
  }

  if (overlay.type === 'signature' && overlay.dataUrl) {
    try {
      const base64 = overlay.dataUrl.split(',')[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const img = await pdfDoc.embedPng(bytes);
      page.drawImage(img, {
        x: overlay.x,
        y: overlay.y,
        width: overlay.w,
        height: overlay.h,
      });
    } catch {
      // Corrupt or unsupported image — skip.
    }
  }
}

// Pen/highlighter strokes export as a sequence of drawLine segments rather
// than a single drawSvgPath — pdf-lib's SvgPath fidelity for multi-segment
// freehand paths isn't guaranteed, while per-segment lines are a simple,
// unambiguous primitive that's certain to render correctly.
function drawAnnotation(page, a) {
  const color = hexToRgb(a.color) ?? rgb(0, 0, 0);
  const opacity = a.opacity ?? 1;

  if (a.type === 'pen' || a.type === 'highlighter') {
    for (let i = 0; i < a.points.length - 1; i++) {
      const p1 = a.points[i], p2 = a.points[i + 1];
      page.drawLine({
        start: { x: p1.x, y: p1.y }, end: { x: p2.x, y: p2.y },
        thickness: a.strokeWidth, color, opacity, lineCap: LineCapStyle.Round,
      });
    }
    return;
  }

  if (a.type === 'rect') {
    page.drawRectangle({ x: a.x, y: a.y, width: a.w, height: a.h, borderColor: color, borderWidth: a.strokeWidth, borderOpacity: opacity });
    return;
  }

  if (a.type === 'ellipse') {
    page.drawEllipse({ x: a.x + a.w / 2, y: a.y + a.h / 2, xScale: Math.abs(a.w) / 2, yScale: Math.abs(a.h) / 2, borderColor: color, borderWidth: a.strokeWidth, borderOpacity: opacity });
    return;
  }

  if (a.type === 'arrow') {
    const x1 = a.x, y1 = a.y, x2 = a.x + a.w, y2 = a.y + a.h;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const ah = 10;
    const p1 = { x: x2 - ah * Math.cos(angle - Math.PI / 6), y: y2 - ah * Math.sin(angle - Math.PI / 6) };
    const p2 = { x: x2 - ah * Math.cos(angle + Math.PI / 6), y: y2 - ah * Math.sin(angle + Math.PI / 6) };
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: a.strokeWidth, color, opacity, lineCap: LineCapStyle.Round });
    page.drawLine({ start: { x: x2, y: y2 }, end: p1, thickness: a.strokeWidth, color, opacity, lineCap: LineCapStyle.Round });
    page.drawLine({ start: { x: x2, y: y2 }, end: p2, thickness: a.strokeWidth, color, opacity, lineCap: LineCapStyle.Round });
  }
}

function isIdentityLayout(pageLayout, pageCount) {
  if (!pageLayout || pageLayout.length !== pageCount) return false;
  return pageLayout.every((item, i) => !item.isBlank && item.rotation === 0 && item.sourcePage === i + 1);
}

async function applyWatermark(pdfDoc, config) {
  if (!config) return;
  const pages = pdfDoc.getPages();

  if (config.type === 'text' && config.text) {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const color = hexToRgb(config.color) ?? rgb(0.5, 0.5, 0.5);
    const size = config.fontSize ?? 48;
    const textWidth = font.widthOfTextAtSize(config.text, size);
    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText(config.text, {
        x: width / 2 - textWidth / 2,
        y: height / 2,
        size, font, color,
        opacity: config.opacity ?? 0.2,
        rotate: degrees(config.rotation ?? 45),
      });
    }
    return;
  }

  if (config.type === 'image' && config.dataUrl) {
    const base64 = config.dataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    let img;
    try { img = await pdfDoc.embedPng(bytes); } catch { img = await pdfDoc.embedJpg(bytes); }
    for (const page of pages) {
      const { width, height } = page.getSize();
      const w = Math.min(width * 0.5, img.width);
      const h = w * (img.height / img.width);
      page.drawImage(img, { x: width / 2 - w / 2, y: height / 2 - h / 2, width: w, height: h, opacity: config.opacity ?? 0.3 });
    }
  }
}

function formatPageNumber(format, n, total) {
  switch (format) {
    case 'n_of_total': return `${n} / ${total}`;
    case 'page_n': return `Page ${n}`;
    case 'page_n_of_total': return `Page ${n} of ${total}`;
    default: return `${n}`;
  }
}

async function applyPageNumbers(pdfDoc, config) {
  if (!config) return;
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color = hexToRgb(config.color) ?? rgb(0.4, 0.4, 0.44);
  const size = config.fontSize ?? 10;
  const margin = 28;
  const [vPos, hPos] = (config.position ?? 'bottom-center').split('-');

  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    const n = (config.startAt ?? 1) + idx;
    const text = formatPageNumber(config.format, n, pages.length);
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = hPos === 'left' ? margin : hPos === 'right' ? width - margin - textWidth : width / 2 - textWidth / 2;
    const y = vPos === 'top' ? height - margin : margin;
    page.drawText(text, { x, y, size, font, color });
  });
}

/**
 * Export the edited PDF. When the page layout hasn't been touched (no
 * reorder/rotate/insert/delete/duplicate), this fills the form and draws
 * overlays directly on the original document — the AcroForm stays intact
 * and fields remain fillable in the output. Once pages have been
 * restructured, pdf-lib has no way to carry the original AcroForm across a
 * copyPages-based rebuild, so that path bakes filled values into the page
 * content instead (fields become static) — an accepted tradeoff for
 * page-level restructuring, consistent with how most PDF tools behave once
 * you start recomposing pages.
 */
export async function exportPdf(arrayBuffer, opts = {}) {
  const { fieldValues = {}, overlays = [], pageLayout, annotations = [], watermarkConfig = null, pageNumbersConfig = null } = opts;
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = srcDoc.getPageCount();

  if (isIdentityLayout(pageLayout, pageCount)) {
    fillForm(srcDoc, fieldValues);
    const fonts = await embedFonts(srcDoc);
    const pages = srcDoc.getPages();
    for (const overlay of overlays) {
      const page = pages[overlay.page - 1];
      if (page) await drawOverlay(srcDoc, page, overlay, fonts);
    }
    for (const annotation of annotations) {
      const page = pages[annotation.page - 1];
      if (page) drawAnnotation(page, annotation);
    }
    await applyWatermark(srcDoc, watermarkConfig);
    await applyPageNumbers(srcDoc, pageNumbersConfig);
    return srcDoc.save();
  }

  // Page layout has been restructured — rebuild into a fresh document.
  fillForm(srcDoc, fieldValues);
  try { srcDoc.getForm().updateFieldAppearances(); } catch { /* no form */ }

  const outDoc = await PDFDocument.create();
  const fonts = await embedFonts(outDoc);
  const seenSource = new Set();

  for (const item of pageLayout) {
    if (item.isBlank) {
      outDoc.addPage([item.width ?? 612, item.height ?? 792]);
      continue;
    }

    const [page] = await outDoc.copyPages(srcDoc, [item.sourcePage - 1]);
    if (item.rotation) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + item.rotation) % 360));
    }
    outDoc.addPage(page);

    // Only the first occurrence of a duplicated page carries its
    // overlays/annotations/filled fields, matching the live-preview
    // behavior in PdfViewer.jsx — otherwise duplicates would double up edits.
    const isPrimary = !seenSource.has(item.sourcePage);
    seenSource.add(item.sourcePage);
    if (!isPrimary) continue;

    for (const overlay of overlays.filter((o) => o.page === item.sourcePage)) {
      await drawOverlay(outDoc, page, overlay, fonts);
    }
    for (const annotation of annotations.filter((a) => a.page === item.sourcePage)) {
      drawAnnotation(page, annotation);
    }
  }

  await applyWatermark(outDoc, watermarkConfig);
  await applyPageNumbers(outDoc, pageNumbersConfig);
  return outDoc.save();
}

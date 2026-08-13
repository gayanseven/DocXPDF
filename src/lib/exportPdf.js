import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

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

async function embedFonts(pdfDoc) {
  return {
    normal:     await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold:       await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic:     await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
  };
}

function pickFont(fonts, overlay) {
  if (overlay.bold && overlay.italic) return fonts.boldItalic;
  if (overlay.bold) return fonts.bold;
  if (overlay.italic) return fonts.italic;
  return fonts.normal;
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
        color: rgb(0, 0, 0),
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

function isIdentityLayout(pageLayout, pageCount) {
  if (!pageLayout || pageLayout.length !== pageCount) return false;
  return pageLayout.every((item, i) => !item.isBlank && item.rotation === 0 && item.sourcePage === i + 1);
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
export async function exportPdf(arrayBuffer, fieldValues, overlays, pageLayout) {
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
    // overlays/filled fields, matching the live-preview behavior in
    // PdfViewer.jsx — otherwise duplicates would double up edits.
    const isPrimary = !seenSource.has(item.sourcePage);
    seenSource.add(item.sourcePage);
    if (!isPrimary) continue;

    for (const overlay of overlays.filter((o) => o.page === item.sourcePage)) {
      await drawOverlay(outDoc, page, overlay, fonts);
    }
  }

  return outDoc.save();
}

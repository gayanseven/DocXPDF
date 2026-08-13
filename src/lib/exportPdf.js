import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function exportPdf(arrayBuffer, fieldValues, overlays) {
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  // Fill AcroForm fields.
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

  // Draw text and signature overlays.
  const fonts = {
    normal:     await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold:       await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic:     await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
  };

  function pickFont(overlay) {
    if (overlay.bold && overlay.italic) return fonts.boldItalic;
    if (overlay.bold) return fonts.bold;
    if (overlay.italic) return fonts.italic;
    return fonts.normal;
  }

  const pdfPages = pdfDoc.getPages();

  for (const overlay of overlays) {
    const page = pdfPages[overlay.page - 1];
    if (!page) continue;

    if (overlay.type === 'text' && overlay.text) {
      const font = pickFont(overlay);
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

  return pdfDoc.save();
}

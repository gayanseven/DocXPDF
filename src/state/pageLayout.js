// A "page layout" is the display-order list the Page Manager edits. Each
// item is either a real page (sourcePage = the ORIGINAL 1-based pdf.js page
// number — never renumbered, so overlays/annotations/form fields, which are
// keyed by original page number, stay valid no matter how the layout is
// reordered) or a synthetic blank page (sourcePage = null).
export function defaultPageLayout(pages) {
  return pages.map((p) => ({
    id: crypto.randomUUID(),
    sourcePage: p.index,
    rotation: 0,
    isBlank: false,
    width: p.width,
    height: p.height,
  }));
}

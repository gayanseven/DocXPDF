import { PDFDocument } from 'pdf-lib';

/**
 * Combine multiple PDFs (in the given order) into one.
 * @param {{name:string, arrayBuffer:ArrayBuffer}[]} files
 */
export async function mergePdfs(files) {
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(file.arrayBuffer, { ignoreEncryption: true });
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return out.save();
}

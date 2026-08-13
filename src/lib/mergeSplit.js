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

/**
 * Extract one or more page groups from a single PDF into separate output files.
 * @param {ArrayBuffer} arrayBuffer
 * @param {number[][]} pageGroups arrays of 0-based page indices, one per output file
 * @returns {Promise<Uint8Array[]>}
 */
export async function splitPdf(arrayBuffer, pageGroups) {
  const src = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const outputs = [];
  for (const indices of pageGroups) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, indices);
    pages.forEach((p) => out.addPage(p));
    outputs.push(await out.save());
  }
  return outputs;
}

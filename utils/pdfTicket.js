// Browser only: a PDF file → the text of its pages, read on the device.
//
// pdf.js is large, so it is imported on demand and never loads on a page that
// does not read a ticket. It is the legacy build: plenty of the phones reading
// Indian rail tickets run a browser or in-app webview a few versions behind,
// and the modern build needs very recent JavaScript. Its worker is copied into
// public/vendor by scripts/copy-vendor.mjs, locked to the installed version.
// Nothing here makes a network request beyond fetching those two files from
// railmonk.com, and the service worker serves both from its cache after the
// first visit.

import { itemsToLines } from './pdfLines';

let pdfjs = null;

const loadPdfjs = () => {
  if (!pdfjs) {
    pdfjs = import('pdfjs-dist/legacy/build/pdf.mjs').then((m) => {
      m.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.mjs';
      return m;
    });
  }
  return pdfjs;
};

export class TicketPdfError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // 'password' | 'damaged' | 'no-text'
  }
}

export const isPdfFile = async (file) => {
  if (!file) return false;
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '')) return true;
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...head) === '%PDF-';
};

/** Every page's text, rebuilt as lines (see utils/pdfLines.js). */
export const readPdfText = async (file) => {
  const lib = await loadPdfjs();
  const task = lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
  let doc;
  try {
    doc = await task.promise;
  } catch (e) {
    task.destroy().catch(() => {});
    throw new TicketPdfError(/password/i.test((e && e.name) || '') || /password/i.test((e && e.message) || '') ? 'password' : 'damaged');
  }
  try {
    const pages = [];
    // An ERS is one page of ticket and one or two of small print; three is plenty.
    for (let n = 1; n <= Math.min(doc.numPages, 3); n += 1) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      pages.push(itemsToLines(content.items).join('\n'));
    }
    const text = pages.join('\n');
    // A scanned or photographed ticket has no text layer to read.
    if (text.replace(/\s/g, '').length < 20) throw new TicketPdfError('no-text');
    return text;
  } finally {
    // pdf.js 6 tears a document down through its loading task.
    task.destroy().catch(() => {});
  }
};

/** Prefetch pdf.js while the page is idle, so the service worker caches it. */
export const warmPdfjs = () => {
  loadPdfjs().catch(() => {
    pdfjs = null;
  });
};

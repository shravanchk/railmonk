// The whole PDF path, as the browser runs it: a PDF file through pdf.js's text
// layer, rebuilt into lines, then parsed. The PDFs are generated from the
// fixture text so no binary file (and no real ticket) lives in the repo.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { makePdf } = require('./fixtures/makePdf');
const f = require('./fixtures/tickets');
const { itemsToLines } = require('../utils/pdfLines');
const { parseTicketText, effectiveStatus } = require('../utils/engines/ticketParser');

const STANDARD_FONTS = `${path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'standard_fonts')}${path.sep}`;

const readPdf = async (data) => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data, isEvalSupported: false, standardFontDataUrl: STANDARD_FONTS, verbosity: 0 });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    return itemsToLines(content.items).join('\n');
  } finally {
    await task.destroy();
  }
};

// Helvetica has no rupee sign; the parser does not need it.
const pdfOf = (text, opts) => makePdf(f.toPageCells(text.replace(/₹ ?/g, '')), opts);

test('current-layout ERS PDF reads the same as its text', async () => {
  const t = parseTicketText(await readPdf(pdfOf(f.ERS_CURRENT)));
  assert.equal(t.pnr, '2345678901');
  assert.deepEqual(t.train, { number: '12952', name: 'MMCT TEJAS RAJ' });
  assert.equal(t.classCode, '3A');
  assert.equal(t.quota.code, 'GN');
  assert.equal(t.to.code, 'MMCT');
  assert.deepEqual(t.departure, { date: '2026-11-15', time: '16:55' });
  assert.equal(t.fare.ticket, 3945);
  assert.deepEqual(t.passengers.map((p) => effectiveStatus(p).raw), ['CNF/B4/23/LOWER', 'CNF/B4/24/MIDDLE']);
  assert.deepEqual(t.missing, []);
});

test('runs written out of reading order are put back in place', async () => {
  const t = parseTicketText(await readPdf(pdfOf(f.ERS_CURRENT, { shuffle: true })));
  assert.equal(t.pnr, '2345678901');
  assert.equal(t.boarding.code, 'NDLS');
  assert.equal(t.passengers.length, 2);
});

test('older-layout ERS PDF, Tatkal with mixed statuses', async () => {
  const t = parseTicketText(await readPdf(pdfOf(f.ERS_OLDER)));
  assert.equal(t.quota.code, 'TQ');
  assert.equal(t.classCode, 'SL');
  assert.deepEqual(t.passengers.map((p) => effectiveStatus(p).kind), ['CNF', 'RAC', 'WL']);
  assert.deepEqual(t.arrival, { date: '2026-12-26', time: '09:00' });
});

test('mid-route ERS PDF keeps the earlier start date', async () => {
  const t = parseTicketText(await readPdf(pdfOf(f.ERS_MIDROUTE)));
  assert.equal(t.startDate, '2027-01-09');
  assert.equal(t.departure.date, '2027-01-10');
});

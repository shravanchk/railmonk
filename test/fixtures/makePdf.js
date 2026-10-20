// Builds a one-page PDF with text placed at given positions — just enough of
// the format to give pdf.js a real text layer to read, without a PDF library.
//
// Uses the standard Helvetica font, so only Latin-1 text: callers swap the
// rupee sign out, which the ticket parser ignores anyway.

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

/**
 * @param {Array<Array<{ text: string, col: number }>>} rows  cells per line, `col` in points from the left margin
 * @param {{ size?: number, leading?: number, shuffle?: boolean }} [opts]
 *   shuffle: write the runs in reverse order, as some PDF producers do, to
 *   check that the reader rebuilds lines from positions rather than order.
 *
 * The page is wider than A4 because the fixtures space columns generously,
 * and pdf.js drops text that falls outside the page.
 */
const makePdf = (rows, { size = 9, leading = 13, shuffle = false } = {}) => {
  const runs = [];
  rows.forEach((cells, i) => {
    const y = 800 - i * leading;
    cells.forEach((cell) => runs.push(`BT /F1 ${size} Tf ${40 + cell.col} ${y} Td (${esc(cell.text)}) Tj ET`));
  });
  if (shuffle) runs.reverse();
  const stream = runs.join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1000 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];

  let out = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, 'latin1'));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    out += `${String(o).padStart(10, '0')} 00000 n \n`;
  });
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(out, 'latin1'));
};

module.exports = { makePdf };

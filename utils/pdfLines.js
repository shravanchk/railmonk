// pdf.js text items → lines of text, laid out the way the page looks.
//
// pdf.js hands back text as positioned runs in whatever order the PDF wrote
// them, which for IRCTC's ERS is not reading order. Grouping runs by baseline
// and sorting by x rebuilds the rows. The gap between runs is kept as a hint:
// a word gap becomes one space and a column gap becomes two, which is the
// signal utils/engines/ticketParser.js uses to pair a header row with the row
// of values under it.
//
// Pure and CommonJS so the tests can feed it pdf.js output directly.

/**
 * @param {Array<{ str: string, transform: number[], width: number, height?: number }>} items
 * @returns {string[]} lines, top of the page first
 */
const itemsToLines = (items) => {
  const runs = (items || [])
    // pdf.js marks a wide gap with a whitespace-only item of its own. It is
    // dropped: the gap is measured from the runs either side, which is what
    // tells a column break from a word space.
    .filter((it) => it && typeof it.str === 'string' && it.str.trim() && Array.isArray(it.transform))
    .map((it) => {
      const [a, b, , d, x, y] = it.transform;
      // Font size from the text matrix; `height` is 0 for some fonts.
      const size = Math.abs(it.height) || Math.hypot(a, b) || Math.abs(d) || 10;
      return { str: it.str, x, y, width: Number(it.width) || 0, size };
    });

  // Rows: runs whose baselines sit within half a font size of each other.
  const rows = [];
  runs
    .slice()
    .sort((p, q) => q.y - p.y || p.x - q.x)
    .forEach((run) => {
      const row = rows.find((r) => Math.abs(r.y - run.y) <= Math.max(2, Math.min(r.size, run.size) * 0.5));
      if (row) {
        row.runs.push(run);
        row.size = Math.max(row.size, run.size);
      } else {
        rows.push({ y: run.y, size: run.size, runs: [run] });
      }
    });

  return rows
    .sort((p, q) => q.y - p.y)
    .map((row) => {
      const ordered = row.runs.sort((p, q) => p.x - q.x);
      let line = '';
      let end = null;
      ordered.forEach((run) => {
        if (end !== null) {
          const gap = run.x - end;
          if (gap > run.size * 1.2) line = `${line.replace(/\s+$/, '')}  `;
          else if (gap > run.size * 0.15 && !/\s$/.test(line) && !/^\s/.test(run.str)) line += ' ';
        }
        line += run.str;
        end = run.x + run.width;
      });
      return line.replace(/[ \t]+$/, '');
    })
    .filter((line) => line.trim());
};

module.exports = { itemsToLines };

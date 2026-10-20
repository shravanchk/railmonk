// Files the browser loads from a URL at run time, which a static export has
// no bundler to serve. Copied into public/vendor/ (gitignored) before dev and
// build, so each stays locked to the installed library's version.
//
// - pdf.js reads e-ticket PDFs in a Web Worker (utils/pdfTicket.js). The
//   legacy build, to match the legacy library build the page imports.
//
// The service worker serves /vendor/ cache-first, so anything whose contents
// can change between versions must change its path too.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const pkgDir = (name) => dirname(require.resolve(`${name}/package.json`));

mkdirSync('public/vendor', { recursive: true });
copyFileSync(join(pkgDir('pdfjs-dist'), 'legacy/build/pdf.worker.min.mjs'), 'public/vendor/pdf.worker.min.mjs');

// Writes the PNG app icons from the SVG logo, for the web manifest, iOS and
// the Play Store app (android/):
//   public/icon-192.png, public/icon-512.png        — the logo as it is
//   public/icon-maskable-192.png, -512.png          — full-bleed plate with the
//                                                     locomotive inside Android's
//                                                     80% safe zone
//   public/apple-touch-icon.png (180)               — full-bleed square; iOS
//                                                     rounds the corners itself
//
// Run after editing public/railmonk-logo.svg:  node scripts/build-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const logo = readFileSync('public/railmonk-logo.svg', 'utf8');
const NAVY = '#1a2332';

// The locomotive without its rounded plate, to be placed on a square one.
const art = logo
  .replace(/<\?xml[^>]*>/, '')
  .replace(/<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<rect x="2" y="2" width="60" height="60" rx="14"[^>]*\/>/, '');

// Scale the art about the centre of the 64-unit box.
const square = (scale) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${NAVY}"/>` +
  `<g transform="translate(32 33) scale(${scale}) translate(-32 -33)">${art}</g></svg>`;

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: Math.max(72, (size / 64) * 72 * 2) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();

writeFileSync('public/icon-192.png', await png(logo, 192));
writeFileSync('public/icon-512.png', await png(logo, 512));
// The art spans roughly 40 of 64 units; 0.8 keeps it inside the safe circle.
writeFileSync('public/icon-maskable-192.png', await png(square(0.8), 192));
writeFileSync('public/icon-maskable-512.png', await png(square(0.8), 512));
writeFileSync('public/apple-touch-icon.png', await png(square(1), 180));

console.log('icons written');

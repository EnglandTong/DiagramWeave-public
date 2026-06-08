import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = join(root, 'vendor');
mkdirSync(vendor, { recursive: true });

const files = [
  ['node_modules/jspdf/dist/jspdf.umd.min.js', 'jspdf.umd.min.js'],
  ['node_modules/svg2pdf.js/dist/svg2pdf.umd.min.js', 'svg2pdf.umd.min.js'],
  ['node_modules/dagre/dist/dagre.min.js', 'dagre.min.js'],
  ['node_modules/xlsx/dist/xlsx.full.min.js', 'xlsx.full.min.js'],
];

for (const [src, dest] of files) {
  copyFileSync(join(root, src), join(vendor, dest));
}

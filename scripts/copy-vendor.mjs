import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

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

await build({ stdin: { contents: "export { default } from 'mermaid';", resolveDir: root, sourcefile: 'mermaid-parser-entry.mjs' }, bundle: true, format: 'esm', platform: 'browser', minify: true, outfile: join(vendor, 'mermaid-parser.mjs') });
await build({ stdin: { contents: "export { BpmnModdle as default } from 'bpmn-moddle';", resolveDir: root, sourcefile: 'bpmn-moddle-entry.mjs' }, bundle: true, format: 'esm', platform: 'browser', minify: true, outfile: join(vendor, 'bpmn-moddle.mjs') });
await build({ stdin: { contents: "export * from 'fflate';", resolveDir: root, sourcefile: 'fflate-entry.mjs' }, bundle: true, format: 'esm', platform: 'browser', minify: true, outfile: join(vendor, 'fflate.mjs') });

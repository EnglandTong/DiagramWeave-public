/**
 * 语法检查：浏览器 JS + flowchart-editor 主逻辑
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const browserJsFiles = [
  'diagramweave-bootstrap.js',
  'flowchart-sanitize.js',
  'diagramweave-i18n.js',
  'diagramweave-content-pack.js',
  'flowchart-export-shapes.js',
  'flowchart-extensions.js',
  'flowchart-editor.js',
];

for (const rel of browserJsFiles) {
  const code = readFileSync(join(root, rel), 'utf8');
  new Function(code);
  console.log('OK', rel);
}

const mjsFiles = [
  join('scripts', 'serve.mjs'),
  join('scripts', 'copy-vendor.mjs'),
  join('scripts', 'download-font.mjs'),
  join('scripts', 'setup.mjs'),
];

for (const rel of mjsFiles) {
  const path = join(root, rel);
  execSync(`node --check "${path}"`, { stdio: 'pipe' });
  console.log('OK', rel);
}

const html = readFileSync(join(root, 'flowchart-editor.html'), 'utf8');
if (!html.includes('flowchart-editor.js')) throw new Error('HTML must link flowchart-editor.js');
if (!html.includes('flowchart-editor.css')) throw new Error('HTML must link flowchart-editor.css');
console.log('OK flowchart-editor.html (shell)');

console.log('syntax check passed');

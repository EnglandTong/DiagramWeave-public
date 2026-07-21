import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, statSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const htmlFile = join(root, 'flowchart-editor.html');

function parseScriptTags(html) {
  const scripts = [];
  const regex = /<script\s+src="([^"]+)"\s*><\/script>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  return scripts;
}

function isVendor(src) {
  return src.startsWith('vendor/');
}

function copyDirSync(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

async function main() {
  console.log('Building DiagramWeave...');

  mkdirSync(distDir, { recursive: true });

  const htmlContent = readFileSync(htmlFile, 'utf-8');
  const scriptSrcs = parseScriptTags(htmlContent);

  console.log(`Found ${scriptSrcs.length} script tags`);

  const appScripts = scriptSrcs.filter(src => !isVendor(src));
  console.log(`App scripts: ${appScripts.length}`);

  const concatenated = appScripts
    .map(src => `// === ${src} ===\n` + readFileSync(join(root, src), 'utf-8'))
    .join('\n\n');

  const tmpInput = join(root, '.build-concat.js');
  writeFileSync(tmpInput, concatenated, 'utf-8');

  try {
    await build({
      entryPoints: [tmpInput],
      bundle: false,
      minify: true,
      sourcemap: true,
      platform: 'browser',
      outfile: join(distDir, 'diagramweave-bundle.min.js'),
      allowOverwrite: true,
      logLevel: 'info',
    });
  } finally {
    try {
      unlinkSync(tmpInput);
    } catch {
      // ignore
    }
  }

  console.log('Bundle built successfully');

  const distI18nDir = join(distDir, 'i18n');
  const i18nDir = join(root, 'i18n');
  if (existsSync(i18nDir)) {
    copyDirSync(i18nDir, distI18nDir);
    console.log('Copied i18n files');
  }

  const vendorDir = join(root, 'vendor');
  const distVendorDir = join(distDir, 'vendor');
  if (existsSync(vendorDir)) {
    copyDirSync(vendorDir, distVendorDir);
    console.log('Copied vendor files');
  }

  const uiRedesignDir = join(root, 'diagramweave-ui-redesign');
  const distUiRedesignDir = join(distDir, 'diagramweave-ui-redesign');
  if (existsSync(uiRedesignDir)) {
    copyDirSync(uiRedesignDir, distUiRedesignDir);
    console.log('Copied diagramweave-ui-redesign files');
  }

  const editorDir = join(root, 'editor');
  const distEditorDir = join(distDir, 'editor');
  if (existsSync(editorDir)) {
    copyDirSync(editorDir, distEditorDir);
    console.log('Copied editor files');
  }

  const cssFiles = ['flowchart-editor.css'];
  for (const cssFile of cssFiles) {
    const srcCss = join(root, cssFile);
    if (existsSync(srcCss)) {
      copyFileSync(srcCss, join(distDir, cssFile));
      console.log(`Copied ${cssFile}`);
    }
  }

  let newHtmlContent = htmlContent;

  const appScriptRegex = /<script\s+src="(?!vendor\/)[^"]+"\s*><\/script>\s*\n?/g;
  const appScriptMatches = [...htmlContent.matchAll(appScriptRegex)];

  if (appScriptMatches.length > 0) {
    const firstMatch = appScriptMatches[0];
    const lastMatch = appScriptMatches[appScriptMatches.length - 1];
    const startIndex = firstMatch.index;
    const endIndex = lastMatch.index + lastMatch[0].length;

    const indentMatch = firstMatch[0].match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';

    const bundleScript = `${indent}<script src="diagramweave-bundle.min.js"></script>\n`;
    newHtmlContent = newHtmlContent.slice(0, startIndex) + bundleScript + newHtmlContent.slice(endIndex);
  }

  const distHtmlPath = join(distDir, 'flowchart-editor.html');
  writeFileSync(distHtmlPath, newHtmlContent, 'utf-8');
  console.log('Wrote flowchart-editor.html');

  const manifestFile = join(root, 'diagramweave.manifest.json');
  if (existsSync(manifestFile)) {
    copyFileSync(manifestFile, join(distDir, 'diagramweave.manifest.json'));
    console.log('Copied manifest');
  }

  const bundlePath = join(distDir, 'diagramweave-bundle.min.js');
  const bundleSize = statSync(bundlePath).size;
  const sourcemapPath = join(distDir, 'diagramweave-bundle.min.js.map');
  const sourcemapSize = existsSync(sourcemapPath) ? statSync(sourcemapPath).size : 0;

  console.log('\nBuild complete!');
  console.log('Output directory:', distDir);
  console.log('Bundle size:', Math.round(bundleSize / 1024), 'KB');
  if (sourcemapSize > 0) {
    console.log('Sourcemap size:', Math.round(sourcemapSize / 1024), 'KB');
  }
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

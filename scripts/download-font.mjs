import { mkdirSync, existsSync, createWriteStream, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fontDir = join(root, 'vendor', 'fonts');
const fontPath = join(fontDir, 'NotoSansSC-Regular.otf');

const FONT_URL =
  'https://github.com/notofonts/noto-cjk/raw/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf';

const LOCAL_FALLBACKS = [
  'C:/Windows/Fonts/msyh.ttc',
  'C:/Windows/Fonts/msyhbd.ttc',
  'C:/Windows/Fonts/simhei.ttf',
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  mkdirSync(dirname(dest), { recursive: true });
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

function copyLocalFallback() {
  for (const src of LOCAL_FALLBACKS) {
    if (existsSync(src)) {
      mkdirSync(fontDir, { recursive: true });
      copyFileSync(src, fontPath);
      console.log('Copied local font:', src, '->', fontPath);
      return true;
    }
  }
  return false;
}

if (!existsSync(fontPath)) {
  console.log('Downloading Noto Sans SC for offline PDF...');
  try {
    await download(FONT_URL, fontPath);
    console.log('Font saved to', fontPath);
  } catch (err) {
    console.warn('Font download failed:', err.message);
    if (!copyLocalFallback()) {
      console.warn('No local font copied. PDF will use canvas + system fonts.');
    }
  }
} else {
  console.log('Chinese font already present:', fontPath);
}

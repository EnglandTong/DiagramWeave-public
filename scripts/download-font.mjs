import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, createWriteStream, copyFileSync, rmSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const scriptPath = fileURLToPath(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fontDir = join(root, 'vendor', 'fonts');
const fontPath = join(fontDir, 'NotoSansSC-Regular.otf');
const tempFontPath = join(fontDir, 'NotoSansSC-Regular.otf.download');

const FONT_URL =
  'https://github.com/notofonts/noto-cjk/raw/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf';
const FOREGROUND_DOWNLOAD_TIMEOUT_MS = 10000;
const BACKGROUND_DOWNLOAD_TIMEOUT_MS = 20 * 60 * 1000;

const LOCAL_FALLBACKS = [
  'C:/Windows/Fonts/msyh.ttc',
  'C:/Windows/Fonts/msyhbd.ttc',
  'C:/Windows/Fonts/simhei.ttf',
];
const isBackgroundDownload = process.argv.includes('--background-download');

async function download(url, dest, timeoutMs = FOREGROUND_DOWNLOAD_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let completed = false;
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    mkdirSync(dirname(dest), { recursive: true });
    await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
    completed = true;
  } finally {
    clearTimeout(timeout);
    if (!completed && existsSync(dest)) rmSync(dest, { force: true });
  }
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

function startBackgroundDownload() {
  const child = spawn(process.execPath, [scriptPath, '--background-download'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  console.log('Noto Sans SC download started in background.');
}

async function downloadNotoToFontPath() {
  await download(
    FONT_URL,
    tempFontPath,
    isBackgroundDownload ? BACKGROUND_DOWNLOAD_TIMEOUT_MS : FOREGROUND_DOWNLOAD_TIMEOUT_MS,
  );
  renameSync(tempFontPath, fontPath);
  console.log('Font saved to', fontPath);
}

if (isBackgroundDownload) {
  try {
    await downloadNotoToFontPath();
  } catch (err) {
    console.warn('Background font download failed or timed out:', err.message);
    if (existsSync(tempFontPath)) rmSync(tempFontPath, { force: true });
  }
} else if (!existsSync(fontPath)) {
  if (!copyLocalFallback()) {
    console.log('Downloading Noto Sans SC for offline PDF...');
    try {
      await downloadNotoToFontPath();
    } catch (err) {
      console.warn('Font download failed or timed out:', err.message);
      console.warn('No local font copied. PDF will use canvas + system fonts.');
    }
  } else {
    startBackgroundDownload();
  }
} else {
  console.log('Chinese font already present:', fontPath);
}

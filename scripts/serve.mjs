/**
 * 本地静态服务 — 避免 file:// 下的 CORS / frame 安全限制
 * 用法: pnpm serve
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  if (!decoded.startsWith('/')) return null;
  const rel = decoded === '/' ? '/flowchart-editor.html' : decoded;
  if (/[\\]/.test(rel) || rel.includes('..')) return null;
  const resolved = path.resolve(ROOT, '.' + rel);
  const relative = path.relative(ROOT, resolved);
  if (relative.startsWith('..') || relative.includes(':')) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  const filePath = safePath(req.url || '/');
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(err.code === 'ENOENT' ? 'Not Found' : 'Error');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/flowchart-editor.html`;
  console.log(`DiagramWeave: ${url}`);
  console.log('Press Ctrl+C to stop');
});

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.log(`DiagramWeave already appears to be running at http://${HOST}:${PORT}/flowchart-editor.html`);
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});

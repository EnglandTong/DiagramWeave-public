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
const HOST = process.env.HOST || '0.0.0.0';

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
  // PWA + Capacitor: '/' 和 '/index.html' 优先返回 build 产物，否则用源码入口
  let rel = decoded;
  if (decoded === '/' || decoded === '/index.html') {
    const distIdx = path.resolve(ROOT, 'dist', 'index.html');
    const rootIdx = path.resolve(ROOT, 'index.html');
    if (fs.existsSync(distIdx)) {
      rel = '/dist/index.html';
    } else if (fs.existsSync(rootIdx)) {
      rel = '/index.html';
    } else {
      rel = '/flowchart-editor.html';
    }
  }
  if (/[\\]/.test(rel) || rel.includes('..')) return null;
  const resolved = path.resolve(ROOT, '.' + rel);
  const relative = path.relative(ROOT, resolved);
  if (relative.startsWith('..') || relative.includes(':')) return null;

  // Fallback: ROOT 下找不到文件时，去 dist/ 下找（PWA manifest/sw/icons 在 build 产物里）
  if (!fs.existsSync(resolved)) {
    const distFallback = path.resolve(ROOT, 'dist', '.' + rel);
    if (fs.existsSync(distFallback)) return distFallback;
  }
  return resolved;
}

const server = http.createServer((req, res) => {
  const requestPath = (req.url || '/').split('?')[0];
  if (requestPath === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ok',
      system: 'diagramweave-public',
      version: '1.0.0',
      time: new Date().toISOString(),
    }));
    return;
  }
  if (requestPath === '/api/system/info') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      id: 'diagramweave-public',
      title: 'DiagramWeave Public',
      version: '1.0.0',
      environment: 'local',
      dataProviders: ['flowchart-templates'],
      dataConsumers: [],
    }));
    return;
  }
  if (requestPath === '/api/system/capabilities') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      providers: ['flowchart-templates'],
      consumers: [],
      features: ['flowchart-editor', 'template-library', 'local-export'],
    }));
    return;
  }

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

function shutdown(signal) {
  console.log(`DiagramWeave serve shutting down (${signal || 'signal'})`);
  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 1000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.log(`DiagramWeave already appears to be running at http://${HOST}:${PORT}/flowchart-editor.html`);
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});

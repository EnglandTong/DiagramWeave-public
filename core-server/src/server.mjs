import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DIAGRAMWEAVE_HUB_MANIFEST,
  validateHubManifest,
  withRuntimeUrls,
} from '../../shared/manifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const CLIENT_ROOT = path.join(REPO_ROOT, 'client');

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

const ROOT_FILE_ALLOWLIST = new Set([
  'bw-app.json',
  'diagramweave-bootstrap.js',
  'diagramweave-content-pack.js',
  'diagramweave-i18n.js',
  'diagramweave.manifest.json',
  'flowchart-editor.css',
  'flowchart-editor.html',
  'flowchart-editor.js',
  'flowchart-export-shapes.js',
  'flowchart-extensions.js',
  'flowchart-sanitize.js',
]);

const ROOT_DIR_ALLOWLIST = new Set([
  'locales',
  'remote',
  'templates',
  'vendor',
]);

export function createHubServer(options = {}) {
  const host = options.host || process.env.HOST || process.env.DIAGRAMWEAVE_HUB_HOST || DEFAULT_HOST;
  const port = Number(options.port ?? process.env.PORT ?? process.env.DIAGRAMWEAVE_HUB_PORT ?? DEFAULT_PORT);
  const manifest = withRuntimeUrls(options.manifest || DIAGRAMWEAVE_HUB_MANIFEST, { host, port });
  const manifestIssues = validateHubManifest(manifest);

  return http.createServer((req, res) => {
    try {
      handleRequest(req, res, { host, port, manifest, manifestIssues });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown server error',
      });
    }
  });
}

export function startHubServer(options = {}) {
  const host = options.host || process.env.HOST || process.env.DIAGRAMWEAVE_HUB_HOST || DEFAULT_HOST;
  const port = Number(options.port ?? process.env.PORT ?? process.env.DIAGRAMWEAVE_HUB_PORT ?? DEFAULT_PORT);
  const server = createHubServer({ ...options, host, port });

  server.listen(port, host, () => {
    console.log(`DiagramWeave Hub: http://${host}:${port}/`);
    console.log(`DiagramWeave Editor: http://${host}:${port}/flowchart-editor.html`);
  });

  server.on('error', (error) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`DiagramWeave Hub port is already in use: http://${host}:${port}/`);
      process.exit(1);
    }
    console.error(error);
    process.exit(1);
  });

  return server;
}

function handleRequest(req, res, context) {
  const requestUrl = new URL(req.url || '/', `http://${context.host}:${context.port}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/api/health') {
    sendJson(res, 200, {
      status: context.manifestIssues.length === 0 ? 'ok' : 'degraded',
      system: context.manifest.id,
      architecture: context.manifest.architecture,
      version: context.manifest.version,
      uptime: process.uptime(),
      issues: context.manifestIssues,
      time: new Date().toISOString(),
    });
    return;
  }

  if (pathname === '/api/manifest') {
    sendJson(res, 200, { success: true, data: context.manifest });
    return;
  }

  if (pathname === '/api/subsystems') {
    sendJson(res, 200, { success: true, data: context.manifest.subsystems });
    return;
  }

  const subsystemMatch = pathname.match(/^\/api\/subsystems\/([^/]+)$/);
  if (subsystemMatch) {
    const subsystem = context.manifest.subsystems.find((item) => item.id === subsystemMatch[1]);
    if (!subsystem) {
      sendJson(res, 404, { success: false, error: `Subsystem ${subsystemMatch[1]} not found` });
      return;
    }
    sendJson(res, 200, { success: true, data: subsystem });
    return;
  }

  if (pathname === '/api/system/info') {
    sendJson(res, 200, {
      id: context.manifest.id,
      title: context.manifest.name,
      version: context.manifest.version,
      environment: 'local',
      architecture: context.manifest.architecture,
      subsystems: context.manifest.subsystems.map((item) => item.id),
    });
    return;
  }

  if (pathname === '/api/system/capabilities') {
    const features = Array.from(new Set(context.manifest.subsystems.flatMap((item) => item.capabilities)));
    sendJson(res, 200, {
      providers: ['diagramweave-editor'],
      consumers: [],
      features,
    });
    return;
  }

  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Not Found' : 'Error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function resolveStaticPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes('\\') || decoded.includes('..')) return null;

  if (decoded === '/' || decoded === '/index.html') {
    return path.join(CLIENT_ROOT, 'index.html');
  }

  if (decoded === '/app' || decoded === '/editor') {
    return path.join(REPO_ROOT, 'flowchart-editor.html');
  }

  if (decoded.startsWith('/client/')) {
    return resolveInside(CLIENT_ROOT, decoded.slice('/client/'.length));
  }

  const relative = decoded.replace(/^\//, '');
  const firstSegment = relative.split('/')[0];
  if (ROOT_DIR_ALLOWLIST.has(firstSegment)) {
    return resolveInside(REPO_ROOT, relative);
  }

  if (!relative.includes('/') && ROOT_FILE_ALLOWLIST.has(relative)) {
    return path.join(REPO_ROOT, relative);
  }

  return null;
}

function resolveInside(root, relativePath) {
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startHubServer();
}

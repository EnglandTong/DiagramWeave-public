import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || '4173');
const HEALTH_URL = `http://${HOST}:${PORT}/api/health`;
const PLAYWRIGHT_TIMEOUT_MS = Number(process.env.DIAGRAMWEAVE_E2E_TIMEOUT_MS || '180000');
const PLAYWRIGHT_ARGS = process.argv.slice(2);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode ?? 0));
    });
    req.on('error', reject);
    req.setTimeout(2000, () => {
      req.destroy(new Error(`timeout fetching ${url}`));
    });
  });
}

async function waitForHealth(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const status = await request(url);
      if (status >= 200 && status < 500) {
        return;
      }
      lastError = new Error(`unexpected status ${status}`);
    } catch (error) {
      lastError = error;
    }
    await wait(250);
  }
  throw lastError || new Error(`health check timed out for ${url}`);
}

function killProcess(child, signal = 'SIGTERM') {
  if (!child || child.exitCode !== null || child.killed) {
    return;
  }
  try {
    child.kill(signal);
  } catch {
    // Best-effort cleanup.
  }
}

async function stopServer(serverChild) {
  if (!serverChild || serverChild.exitCode !== null) {
    return;
  }

  killProcess(serverChild, 'SIGTERM');
  const graceful = await Promise.race([
    new Promise((resolve) => serverChild.once('exit', () => resolve(true))),
    wait(2000).then(() => false),
  ]);

  if (!graceful) {
    killProcess(serverChild, 'SIGKILL');
    await Promise.race([
      new Promise((resolve) => serverChild.once('exit', resolve)),
      wait(2000),
    ]);
  }
}

async function main() {
  const serverChild = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: ROOT,
    env: {
      ...process.env,
      HOST,
      PORT: String(PORT),
    },
    stdio: 'ignore',
    shell: false,
  });

  const cleanup = async () => {
    await stopServer(serverChild);
  };

  process.on('SIGINT', () => {
    cleanup().finally(() => process.exit(130));
  });
  process.on('SIGTERM', () => {
    cleanup().finally(() => process.exit(143));
  });

  try {
    await waitForHealth(HEALTH_URL);

    const child = spawn(
      process.execPath,
      ['node_modules/@playwright/test/cli.js', 'test', ...PLAYWRIGHT_ARGS],
      {
        cwd: ROOT,
        env: {
          ...process.env,
          PLAYWRIGHT_REUSE_SERVER: '1',
        },
        stdio: 'inherit',
        shell: false,
      },
    );

    const timeout = setTimeout(() => {
      console.error(`DiagramWeave e2e timed out after ${PLAYWRIGHT_TIMEOUT_MS}ms`);
      killProcess(child, 'SIGTERM');
      setTimeout(() => killProcess(child, 'SIGKILL'), 1000).unref();
    }, PLAYWRIGHT_TIMEOUT_MS);

    const code = await new Promise((resolve) => {
      child.on('exit', (exitCode) => resolve(exitCode ?? 1));
    });
    clearTimeout(timeout);

    await cleanup();
    process.exit(code);
  } catch (error) {
    console.error(error);
    await cleanup();
    process.exit(1);
  }
}

main();

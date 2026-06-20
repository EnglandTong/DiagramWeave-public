import { defineConfig } from '@playwright/test';

const e2eOutputDir = process.env.DIAGRAMWEAVE_E2E_OUTPUT_DIR
  || `playwright-results/run-${Date.now()}-${process.pid}`;
const browserChannel = process.env.PLAYWRIGHT_CHANNEL?.trim() || 'chrome';
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === '1';

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: e2eOutputDir,
  timeout: 120000,
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    channel: browserChannel,
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://127.0.0.1:4173/flowchart-editor.html',
    reuseExistingServer,
    timeout: 120000,
    gracefulShutdown: {
      signal: 'SIGTERM',
      timeout: 1000,
    },
    stdout: 'ignore',
    stderr: 'ignore',
  },
});

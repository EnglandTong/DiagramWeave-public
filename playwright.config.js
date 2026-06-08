import { defineConfig } from '@playwright/test';

const e2eOutputDir = process.env.DIAGRAMWEAVE_E2E_OUTPUT_DIR
  || `playwright-results/run-${Date.now()}-${process.pid}`;

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: e2eOutputDir,
  timeout: 60000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    ...(process.env.CI ? {} : { channel: 'msedge' }),
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://127.0.0.1:4173/flowchart-editor.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

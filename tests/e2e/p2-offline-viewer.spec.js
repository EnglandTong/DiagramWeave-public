import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('exported single-file viewer works offline and remains read-only', async ({ page, context }) => {
  await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
  await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveOfflineViewer);
  await page.evaluate(() => loadFlowDocumentPayload({ version: 2, projectName: 'Viewer QA', currentPageId: 'p1', pages: [
    { id: 'p1', name: 'Main', layers: [{ id: 0, name: 'Core', visible: true }, { id: 1, name: 'Optional', visible: true }], nodes: [
      { id: 'start', label: 'Start', x: 20, y: 30, w: 120, h: 60, role: 'Ops', tags: ['SLA'], layer: 0 },
      { id: 'jump', label: 'Go details', shape: 'offpage', x: 240, y: 30, w: 130, h: 60, targetPageId: 'p2', layer: 1 },
    ], connections: [{ id: 'c1', from: 'start', to: 'jump' }] },
    { id: 'p2', name: 'Details', layers: [{ id: 0, name: 'Core', visible: true }], nodes: [{ id: 'done', label: 'Done', x: 50, y: 50, w: 120, h: 60, tags: ['Final'] }], connections: [] },
  ] }));
  await page.evaluate(() => showExportDialog()); const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'HTML Viewer' }).click(); const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.viewer\.html$/); const html = await readFile(await download.path(), 'utf8');
  expect(html).not.toMatch(/<script[^>]+src=/); expect(html).not.toMatch(/<link[^>]+href=/);
  await context.setOffline(true); const viewer = await context.newPage(); await viewer.setContent(html, { waitUntil: 'domcontentloaded' });
  await expect(viewer.getByText('Read only')).toBeVisible(); await expect(viewer.locator('.node')).toHaveCount(2); await expect(viewer.getByText('SLA', { exact: true })).toBeVisible();
  await viewer.locator('#search').fill('SLA'); await expect(viewer.locator('#results')).toContainText('Start');
  await viewer.getByText('Go details', { exact: true }).click(); await expect(viewer.locator('#pageSelect')).toHaveValue('p2'); await expect(viewer.getByText('Done', { exact: true })).toBeVisible();
  await viewer.locator('#pageSelect').selectOption('p1'); await viewer.locator('#next').click(); await expect(viewer.locator('[data-node-id="start"]')).toHaveClass(/active/);
  await viewer.locator('#next').click(); await expect(viewer.locator('[data-node-id="jump"]')).toHaveClass(/active/);
  await expect(viewer.locator('[contenteditable], input[type="file"]')).toHaveCount(0);
  await expect(viewer.getByRole('button', { name: /^(save|import|edit|ai)\b/i })).toHaveCount(0);
});

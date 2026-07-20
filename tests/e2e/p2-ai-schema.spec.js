import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function prepare(page) { await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); }); await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveContracts?.createAIDataPreview); }

test('AI settings are disabled by default, expose exact local preview, and contain no execution or key controls', async ({ page }) => {
  await prepare(page); expect(await page.evaluate(() => DiagramWeaveContracts.isAIEnabled())).toBe(false);
  await page.keyboard.press('Control+k'); await page.locator('#commandPaletteInput').fill('AI provider'); await page.locator('.command-palette-item').filter({ hasText: 'AI provider settings' }).click();
  const dialog = page.locator('#aiSettingsOverlay [role="dialog"]'); await expect(dialog).toBeVisible(); await expect(page.locator('#aiGlobalEnabled')).not.toBeChecked(); await expect(dialog).toContainText('No AI providers registered'); await expect(page.locator('#aiDataPreview')).toContainText('schemaVersion');
  await expect(dialog.locator('input[type="password"], input[name*="key" i]')).toHaveCount(0); await expect(dialog.getByRole('button', { name: /run|execute|apply/i })).toHaveCount(0);
  await page.locator('#aiGlobalEnabled').check(); expect(await page.evaluate(() => DiagramWeaveContracts.isAIEnabled())).toBe(true); await page.locator('#aiGlobalEnabled').uncheck(); expect(await page.evaluate(() => DiagramWeaveContracts.isAIEnabled())).toBe(false);
});

test('legacy v1 and v2 documents migrate through editor load and VSO save paths', async ({ page }) => {
  await prepare(page); const v1 = { nodes: [{ id: 'old', label: 'Legacy', x: 10, y: 20, unknownFutureField: { keepLoading: true } }], connections: [], unknownRoot: 42 };
  expect(await page.evaluate(data => loadFlowDocumentPayload(data), v1)).toBe(true); const migratedV1 = await page.evaluate(() => getFlowDocumentPayload()); expect(migratedV1.schemaVersion).toBe(3); expect(migratedV1.pages[0].nodes[0]).toMatchObject({ id: 'old', textColor: 'auto' });
  const v2 = { version: 2, schemaVersion: 2, currentPageId: 'p1', pages: [{ id: 'p1', name: 'Old page', nodes: [{ id: 'n1', label: 'Review' }], connections: [] }], reviewThreads: [{ id: 'r1', targetId: 'n1', status: 'changes_requested', comments: [{ id: 'c1', body: 'Revise' }] }], anotherUnknown: 'allowed' };
  const original = JSON.stringify(v2); expect(await page.evaluate(data => loadFlowDocumentPayload(data), v2)).toBe(true); expect(JSON.stringify(v2)).toBe(original);
  const current = await page.evaluate(() => getFlowDocumentPayload()); expect(current.schemaVersion).toBe(3); expect(current.reviewThreads[0]).toMatchObject({ id: 'r1', status: 'changes_requested' });
  const downloadPromise = page.waitForEvent('download'); await page.evaluate(() => downloadProjectVso(false)); const download = await downloadPromise; const saved = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(saved.schemaVersion).toBe(3); expect(saved.reviewThreads[0].comments[0].body).toBe('Revise');
});

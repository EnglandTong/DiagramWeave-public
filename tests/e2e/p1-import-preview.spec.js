import { expect, test } from '@playwright/test';

const importDocument = {
  version: 1,
  nodes: [
    { id: 'a', label: 'A', x: 100, y: 100, w: 140, h: 60, textColor: 'auto' },
    { id: 'b', label: 'B', x: 320, y: 100, w: 140, h: 60, textColor: '#34d399' },
  ],
  connections: [
    { id: 'c1', from: 'a', to: 'b', fromPort: 'right', toPort: 'left' },
    { id: 'c2', from: 'b', to: 'a', fromPort: 'left', toPort: 'right' },
    { id: 'c3', from: 'a', to: 'missing', fromPort: 'bottom', toPort: 'top' },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__dwSkipRemoteBootstrap = true;
    sessionStorage.setItem('dw-initial-save-prompted', '1');
  });
  await page.goto('/flowchart-editor.html');
  await page.waitForFunction(() => window.__dwEditorReady === true);
});

test('JSON import previews without mutation, reports issues, and applies explicitly', async ({ page }) => {
  await page.evaluate(() => applyTemplate(0));
  const before = await page.evaluate(() => JSON.stringify(captureUndoSnapshot()));
  await page.locator('#fileInput').setInputFiles({
    name: 'cycle.diagramweave.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(importDocument)),
  });

  await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/);
  await expect(page.locator('#importPreviewSummary')).toContainText('2');
  await expect(page.locator('#importPreviewIssues')).toContainText('to');
  await expect(page.locator('#importPreviewIssues')).toContainText('第 4 行');
  expect(await page.evaluate(() => JSON.stringify(captureUndoSnapshot()))).toBe(before);

  await page.getByRole('button', { name: '取消', exact: true }).click();
  expect(await page.evaluate(() => JSON.stringify(captureUndoSnapshot()))).toBe(before);

  await page.locator('#fileInput').setInputFiles({
    name: 'cycle.diagramweave.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(importDocument)),
  });
  await page.locator('#applyImportPreviewBtn').click();
  await expect(page.locator('#importPreviewOverlay')).not.toHaveClass(/visible/);
  await expect(page.locator('.node')).toHaveCount(2);
  expect(await page.evaluate(() => state.connections.length)).toBe(2);
  expect(await page.evaluate(() => state.nodes.find(node => node.id === 'b').textColor)).toBe('#34d399');
});

test('import preview traps focus and Escape cancels without applying', async ({ page }) => {
  await page.evaluate(raw => showImportPreview(createImportPreview(raw), { sourceName: 'qa.json' }), importDocument);
  await expect(page.locator('#applyImportPreviewBtn')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '关闭导入预览' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#applyImportPreviewBtn')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#importPreviewOverlay')).not.toHaveClass(/visible/);
  await expect(page.locator('.node')).toHaveCount(0);
});

test('Excel data rows preview issues and preserve a valid loop before explicit apply', async ({ page }) => {
  const before = await page.evaluate(() => JSON.stringify(captureUndoSnapshot()));
  await page.evaluate(() => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
      { id: 1, label: 'A', x: 100, y: 100 },
      { id: 2, label: 'B', x: 320, y: 100 },
      { id: '', label: 'Skipped' },
    ]), 'Nodes');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
      { from: 1, to: 2 },
      { from: 2, to: 1 },
      { from: 2, to: 99 },
    ]), 'Connections');
    importExcelWorkbookData(workbook);
  });
  await expect(page.locator('#mappingWizardOverlay')).toHaveClass(/visible/);
  await page.locator('#continueMappingBtn').click();
  await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/);
  await expect(page.locator('#importPreviewIssues')).toContainText('第 4 行');
  await expect(page.locator('#importPreviewIssues')).toContainText('id');
  expect(await page.evaluate(() => JSON.stringify(captureUndoSnapshot()))).toBe(before);
  await page.locator('#applyImportPreviewBtn').click();
  await expect(page.locator('.node')).toHaveCount(2);
  expect(await page.evaluate(() => state.connections.length)).toBe(2);
});

test('editable Excel project previews without clearing the current canvas', async ({ page }) => {
  const buffer = await page.evaluate(() => {
    applyTemplate(0);
    const bytes = new Uint8Array(getProjectExcelArrayBuffer());
    return Array.from(bytes);
  });
  await page.evaluate(() => {
    resetToBlankProject();
    const node = createNode('rectangle', 40, 40, 'Current canvas');
    state.nodes.push(node);
    renderAll();
  });
  const before = await page.evaluate(() => JSON.stringify(captureUndoSnapshot()));
  await page.evaluate(bytes => loadProjectExcelArrayBuffer(Uint8Array.from(bytes).buffer), buffer);
  await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/);
  expect(await page.evaluate(() => JSON.stringify(captureUndoSnapshot()))).toBe(before);
  await page.locator('#applyImportPreviewBtn').click();
  await expect(page.locator('.node')).not.toHaveCount(1);
  await expect(page.locator('.node').first()).not.toHaveText('Current canvas');
});

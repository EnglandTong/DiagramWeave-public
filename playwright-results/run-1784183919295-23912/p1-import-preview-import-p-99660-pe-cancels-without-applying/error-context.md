# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-import-preview.spec.js >> import preview traps focus and Escape cancels without applying
- Location: tests\e2e\p1-import-preview.spec.js:51:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  locator('#applyImportPreviewBtn')
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" with timeout 5000ms
  - waiting for locator('#applyImportPreviewBtn')
    12 × locator resolved to <button type="button" class="primary" aria-label="应用导入" id="applyImportPreviewBtn" onclick="applyPendingImportPreview()">应用导入</button>
       - unexpected value "inactive"

```

```yaml
- button "应用导入"
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | 
  3   | const importDocument = {
  4   |   version: 1,
  5   |   nodes: [
  6   |     { id: 'a', label: 'A', x: 100, y: 100, w: 140, h: 60, textColor: 'auto' },
  7   |     { id: 'b', label: 'B', x: 320, y: 100, w: 140, h: 60, textColor: '#34d399' },
  8   |   ],
  9   |   connections: [
  10  |     { id: 'c1', from: 'a', to: 'b', fromPort: 'right', toPort: 'left' },
  11  |     { id: 'c2', from: 'b', to: 'a', fromPort: 'left', toPort: 'right' },
  12  |     { id: 'c3', from: 'a', to: 'missing', fromPort: 'bottom', toPort: 'top' },
  13  |   ],
  14  | };
  15  | 
  16  | test.beforeEach(async ({ page }) => {
  17  |   await page.addInitScript(() => {
  18  |     window.__dwSkipRemoteBootstrap = true;
  19  |     sessionStorage.setItem('dw-initial-save-prompted', '1');
  20  |   });
  21  |   await page.goto('/flowchart-editor.html');
  22  |   await page.waitForFunction(() => window.__dwEditorReady === true);
  23  | });
  24  | 
  25  | test('JSON import previews without mutation, reports issues, and applies explicitly', async ({ page }) => {
  26  |   await page.evaluate(() => applyTemplate(0));
  27  |   const before = await page.evaluate(() => JSON.stringify(captureUndoSnapshot()));
  28  |   await page.locator('#fileInput').setInputFiles({
  29  |     name: 'cycle.diagramweave.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(importDocument)),
  30  |   });
  31  | 
  32  |   await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/);
  33  |   await expect(page.locator('#importPreviewSummary')).toContainText('2');
  34  |   await expect(page.locator('#importPreviewIssues')).toContainText('to');
  35  |   await expect(page.locator('#importPreviewIssues')).toContainText('第 4 行');
  36  |   expect(await page.evaluate(() => JSON.stringify(captureUndoSnapshot()))).toBe(before);
  37  | 
  38  |   await page.getByRole('button', { name: '取消', exact: true }).click();
  39  |   expect(await page.evaluate(() => JSON.stringify(captureUndoSnapshot()))).toBe(before);
  40  | 
  41  |   await page.locator('#fileInput').setInputFiles({
  42  |     name: 'cycle.diagramweave.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(importDocument)),
  43  |   });
  44  |   await page.locator('#applyImportPreviewBtn').click();
  45  |   await expect(page.locator('#importPreviewOverlay')).not.toHaveClass(/visible/);
  46  |   await expect(page.locator('.node')).toHaveCount(2);
  47  |   expect(await page.evaluate(() => state.connections.length)).toBe(2);
  48  |   expect(await page.evaluate(() => state.nodes.find(node => node.id === 'b').textColor)).toBe('#34d399');
  49  | });
  50  | 
  51  | test('import preview traps focus and Escape cancels without applying', async ({ page }) => {
  52  |   await page.evaluate(raw => showImportPreview(createImportPreview(raw), { sourceName: 'qa.json' }), importDocument);
> 53  |   await expect(page.locator('#applyImportPreviewBtn')).toBeFocused();
      |                                                        ^ Error: expect(locator).toBeFocused() failed
  54  |   await page.keyboard.press('Tab');
  55  |   await expect(page.getByRole('button', { name: '关闭导入预览' })).toBeFocused();
  56  |   await page.keyboard.press('Shift+Tab');
  57  |   await expect(page.locator('#applyImportPreviewBtn')).toBeFocused();
  58  |   await page.keyboard.press('Escape');
  59  |   await expect(page.locator('#importPreviewOverlay')).not.toHaveClass(/visible/);
  60  |   await expect(page.locator('.node')).toHaveCount(0);
  61  | });
  62  | 
  63  | test('Excel data rows preview issues and preserve a valid loop before explicit apply', async ({ page }) => {
  64  |   const before = await page.evaluate(() => JSON.stringify(captureUndoSnapshot()));
  65  |   await page.evaluate(() => {
  66  |     const workbook = XLSX.utils.book_new();
  67  |     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
  68  |       { id: 1, label: 'A', x: 100, y: 100 },
  69  |       { id: 2, label: 'B', x: 320, y: 100 },
  70  |       { id: '', label: 'Skipped' },
  71  |     ]), 'Nodes');
  72  |     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
  73  |       { from: 1, to: 2 },
  74  |       { from: 2, to: 1 },
  75  |       { from: 2, to: 99 },
  76  |     ]), 'Connections');
  77  |     importExcelWorkbookData(workbook);
  78  |   });
  79  |   await expect(page.locator('#mappingWizardOverlay')).toHaveClass(/visible/);
  80  |   await page.locator('#continueMappingBtn').click();
  81  |   await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/);
  82  |   await expect(page.locator('#importPreviewIssues')).toContainText('第 4 行');
  83  |   await expect(page.locator('#importPreviewIssues')).toContainText('id');
  84  |   expect(await page.evaluate(() => JSON.stringify(captureUndoSnapshot()))).toBe(before);
  85  |   await page.locator('#applyImportPreviewBtn').click();
  86  |   await expect(page.locator('.node')).toHaveCount(2);
  87  |   expect(await page.evaluate(() => state.connections.length)).toBe(2);
  88  | });
  89  | 
  90  | test('editable Excel project previews without clearing the current canvas', async ({ page }) => {
  91  |   const buffer = await page.evaluate(() => {
  92  |     applyTemplate(0);
  93  |     const bytes = new Uint8Array(getProjectExcelArrayBuffer());
  94  |     return Array.from(bytes);
  95  |   });
  96  |   await page.evaluate(() => {
  97  |     resetToBlankProject();
  98  |     const node = createNode('rectangle', 40, 40, 'Current canvas');
  99  |     state.nodes.push(node);
  100 |     renderAll();
  101 |   });
  102 |   const before = await page.evaluate(() => JSON.stringify(captureUndoSnapshot()));
  103 |   await page.evaluate(bytes => loadProjectExcelArrayBuffer(Uint8Array.from(bytes).buffer), buffer);
  104 |   await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/);
  105 |   expect(await page.evaluate(() => JSON.stringify(captureUndoSnapshot()))).toBe(before);
  106 |   await page.locator('#applyImportPreviewBtn').click();
  107 |   await expect(page.locator('.node')).not.toHaveCount(1);
  108 |   await expect(page.locator('.node').first()).not.toHaveText('Current canvas');
  109 | });
  110 | 
```
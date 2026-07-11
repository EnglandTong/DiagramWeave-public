# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> DiagramWeave smoke >> excel import buttons prefer the file picker path
- Location: tests\e2e\smoke.spec.js:61:3

# Error details

```
Error: page.goto: net::ERR_EMPTY_RESPONSE at http://127.0.0.1:4173/flowchart-editor.html
Call log:
  - navigating to "http://127.0.0.1:4173/flowchart-editor.html", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "该网页无法正常运作" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: 127.0.0.1
      - text: 未发送任何数据。
    - generic [ref=e10]: ERR_EMPTY_RESPONSE
  - button "重新加载" [ref=e13] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('DiagramWeave smoke', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.addInitScript(() => {
  6  |       window.sessionStorage.setItem('dw-initial-save-prompted', '1');
  7  |       window.__dwSkipRemoteBootstrap = true;
  8  |     });
  9  |   });
  10 | 
  11 |   async function waitForEditorReady(page, url = '/flowchart-editor.html') {
  12 |     await page.goto(url);
  13 |     await page.waitForSelector('#canvasWrapper', { state: 'visible' });
  14 |     await page.waitForFunction(() => window.__dwEditorReady === true, null, { timeout: 90000 });
  15 |   }
  16 | 
  17 |   test('loads blank canvas', async ({ page }) => {
  18 |     await waitForEditorReady(page);
  19 |     await expect(page.locator('#canvasWrapper')).toBeVisible();
  20 |     await expect(page.locator('.node')).toHaveCount(0);
  21 |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  22 |   });
  23 | 
  24 |   test('can add and delete page', async ({ page }) => {
  25 |     await waitForEditorReady(page);
  26 |     await page.locator('.page-tab-add').first().click();
  27 |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(2);
  28 |     page.once('dialog', (d) => d.accept());
  29 |     await page.locator('.page-tab-wrap.active .page-tab-close').click();
  30 |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  31 |   });
  32 | 
  33 |   test('template library loads starter template', async ({ page }) => {
  34 |     await waitForEditorReady(page);
  35 |     await page.locator('.template-btn').click();
  36 |     await expect(page.locator('.template-dialog-item')).toHaveCount(7, { timeout: 30000 });
  37 |     await expect(page.locator('.template-dialog-item-name').first()).toBeVisible();
  38 |   });
  39 | 
  40 |   test('highlightNode deep link selects the target node', async ({ page }) => {
  41 |     await page.addInitScript(() => {
  42 |       window.sessionStorage.setItem(
  43 |         'dw-e2e-seed-nodes',
  44 |         JSON.stringify([
  45 |           {
  46 |             id: 'e2e-highlight-node',
  47 |             label: 'Deep Link Target',
  48 |             shape: 'rectangle',
  49 |             x: 120,
  50 |             y: 100,
  51 |           },
  52 |         ]),
  53 |       );
  54 |     });
  55 |     await waitForEditorReady(page, '/flowchart-editor.html?highlightNode=e2e-highlight-node');
  56 |     const selectedId = await page.evaluate(() => state.selectedNodeId);
  57 |     expect(selectedId).toBe('e2e-highlight-node');
  58 |     await expect(page.locator('#e2e-highlight-node.selected')).toBeVisible();
  59 |   });
  60 | 
  61 |   test('excel import buttons prefer the file picker path', async ({ page }) => {
  62 |     await page.addInitScript(() => {
  63 |       window.__dwPickerCalls = 0;
  64 |       Object.defineProperty(window, 'showOpenFilePicker', {
  65 |         configurable: true,
  66 |         writable: true,
  67 |         value: async () => {
  68 |           window.__dwPickerCalls += 1;
  69 |           throw { name: 'AbortError' };
  70 |         },
  71 |       });
  72 |       HTMLInputElement.prototype.showPicker = function () {
  73 |         throw new Error('showPicker fallback should not be used in this test');
  74 |       };
  75 |       HTMLInputElement.prototype.click = function () {
  76 |         throw new Error('click fallback should not be used in this test');
  77 |       };
  78 |     });
  79 | 
> 80 |     await page.goto('/flowchart-editor.html');
     |                ^ Error: page.goto: net::ERR_EMPTY_RESPONSE at http://127.0.0.1:4173/flowchart-editor.html
  81 |     await page.evaluate(() => triggerExcelUpload());
  82 |     await page.evaluate(() => triggerProjectExcelUpload());
  83 | 
  84 |     await expect.poll(async () => page.evaluate(() => window.__dwPickerCalls)).toBe(2);
  85 |   });
  86 | });
  87 | 
```
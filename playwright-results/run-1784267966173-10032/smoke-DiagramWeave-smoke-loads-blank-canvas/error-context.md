# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> DiagramWeave smoke >> loads blank canvas
- Location: tests\e2e\smoke.spec.js:17:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
Call log:
  - navigating to "http://127.0.0.1:4173/flowchart-editor.html", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "无法访问此网站" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: 127.0.0.1
      - text: 拒绝了我们的连接请求。
    - generic [ref=e10]:
      - paragraph [ref=e11]: 请试试以下办法：
      - list [ref=e12]:
        - listitem [ref=e13]: 检查网络连接
        - listitem [ref=e14]:
          - link "检查代理服务器和防火墙" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "重新加载" [ref=e19] [cursor=pointer]
    - button "详情" [ref=e20] [cursor=pointer]
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
> 12 |     await page.goto(url);
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
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
  36 |     await expect(page.locator('.template-dialog-item')).toHaveCount(
  37 |       await page.evaluate(() => allTemplates.length),
  38 |       { timeout: 30000 }
  39 |     );
  40 |     await expect(page.locator('.template-dialog-item-name').first()).toBeVisible();
  41 |   });
  42 | 
  43 |   test('highlightNode deep link selects the target node', async ({ page }) => {
  44 |     await page.addInitScript(() => {
  45 |       window.sessionStorage.setItem(
  46 |         'dw-e2e-seed-nodes',
  47 |         JSON.stringify([
  48 |           {
  49 |             id: 'e2e-highlight-node',
  50 |             label: 'Deep Link Target',
  51 |             shape: 'rectangle',
  52 |             x: 120,
  53 |             y: 100,
  54 |           },
  55 |         ]),
  56 |       );
  57 |     });
  58 |     await waitForEditorReady(page, '/flowchart-editor.html?highlightNode=e2e-highlight-node');
  59 |     const selectedId = await page.evaluate(() => state.selectedNodeId);
  60 |     expect(selectedId).toBe('e2e-highlight-node');
  61 |     await expect(page.locator('#e2e-highlight-node.selected')).toBeVisible();
  62 |   });
  63 | 
  64 |   test('excel import buttons prefer the file picker path', async ({ page }) => {
  65 |     await page.addInitScript(() => {
  66 |       window.__dwPickerCalls = 0;
  67 |       Object.defineProperty(window, 'showOpenFilePicker', {
  68 |         configurable: true,
  69 |         writable: true,
  70 |         value: async () => {
  71 |           window.__dwPickerCalls += 1;
  72 |           throw { name: 'AbortError' };
  73 |         },
  74 |       });
  75 |       HTMLInputElement.prototype.showPicker = function () {
  76 |         throw new Error('showPicker fallback should not be used in this test');
  77 |       };
  78 |       HTMLInputElement.prototype.click = function () {
  79 |         throw new Error('click fallback should not be used in this test');
  80 |       };
  81 |     });
  82 | 
  83 |     await page.goto('/flowchart-editor.html');
  84 |     await page.evaluate(() => triggerExcelUpload());
  85 |     await page.evaluate(() => triggerProjectExcelUpload());
  86 | 
  87 |     await expect.poll(async () => page.evaluate(() => window.__dwPickerCalls)).toBe(2);
  88 |   });
  89 | });
  90 | 
```
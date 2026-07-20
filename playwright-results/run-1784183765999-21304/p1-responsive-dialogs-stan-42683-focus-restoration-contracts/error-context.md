# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-responsive-dialogs.spec.js >> standard dialogs satisfy title, inert, Escape, and focus restoration contracts
- Location: tests\e2e\p1-responsive-dialogs.spec.js:79:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: locator('#layoutOverlay').locator('[role="dialog"]')
Expected pattern: /.+/
Received string:  ""
Timeout: 5000ms

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for locator('#layoutOverlay').locator('[role="dialog"]')
    14 × locator resolved to <div role="dialog" tabindex="-1" aria-modal="true" class="layout-dialog" aria-label="DiagramWeave dialog">…</div>
       - unexpected value "null"

```

```yaml
- dialog "DiagramWeave dialog":
  - button "关闭"
  - text: 自动布局 布局引擎
  - button "Sugiyama"
  - button "主路径"
  - button "角色轴"
  - button "内置"
  - text: 间距密度
  - button "紧凑"
  - button "标准"
  - button "宽松"
  - text: 布局方向
  - button "从上到下 ↓"
  - button "从左到右 →"
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | 
  3   | const seed = [{ id: 'responsive-node', shape: 'rectangle', x: 140, y: 120, w: 140, h: 60, label: 'View only' }];
  4   | 
  5   | test.beforeEach(async ({ page }) => {
  6   |   await page.addInitScript(nodes => {
  7   |     sessionStorage.setItem('dw-initial-save-prompted', '1');
  8   |     sessionStorage.setItem('dw-e2e-seed-nodes', JSON.stringify(nodes));
  9   |   }, seed);
  10  |   await page.goto('/flowchart-editor.html');
  11  |   await page.waitForFunction(() => window.__dwEditorReady && document.querySelectorAll('.node').length === 1);
  12  | });
  13  | 
  14  | test('phone mode is view-only while search, presentation, and review entries remain', async ({ page }) => {
  15  |   await page.setViewportSize({ width: 390, height: 844 });
  16  |   await expect(page.locator('.mobile-mode-bar')).toBeVisible();
  17  |   await expect(page.locator('.toolbar')).toBeHidden();
  18  |   await expect(page.locator('.sidebar')).toBeHidden();
  19  | 
  20  |   const before = await page.evaluate(() => JSON.stringify(state.nodes));
  21  |   await page.evaluate(() => selectNode('responsive-node'));
  22  |   await page.keyboard.press('Delete');
  23  |   expect(await page.evaluate(() => JSON.stringify(state.nodes))).toBe(before);
  24  |   expect(await page.evaluate(() => insertShapeFromLibrary(document.querySelector('.shape-item')))).toBeNull();
  25  | 
  26  |   await page.locator('.mobile-mode-bar button').filter({ hasText: /搜索/ }).click();
  27  |   const commandIds = await page.evaluate(() => collectPaletteItems('').filter(item => item.kind === 'command').map(item => item.id));
  28  |   expect(commandIds.some(id => /^(tool\.|edit\.|layout\.|template\.|project\.(blank|import))/.test(id))).toBe(false);
  29  |   await page.keyboard.press('Escape');
  30  | 
  31  |   let reviewOpened = false;
  32  |   await page.evaluate(() => window.addEventListener('DiagramWeave:open-review', () => { window.__reviewOpened = true; }, { once: true }));
  33  |   await page.locator('.mobile-mode-bar button').filter({ hasText: /审阅/ }).click();
  34  |   reviewOpened = await page.evaluate(() => window.__reviewOpened === true);
  35  |   expect(reviewOpened).toBe(true);
  36  |   await page.locator('.mobile-mode-bar button').filter({ hasText: /演示/ }).click();
  37  |   await expect(page.locator('body')).toHaveClass(/presentation-mode/);
  38  | });
  39  | 
  40  | test('tablet drawers and desktop columns remain bounded in both languages', async ({ page }) => {
  41  |   for (const locale of ['en', 'zh-CN']) {
  42  |     await page.evaluate(code => setAppLanguage(code), locale);
  43  |     await page.setViewportSize({ width: 768, height: 1024 });
  44  |     const toggles = page.locator('.tablet-drawer-toggle');
  45  |     await expect(toggles.first()).toBeVisible();
  46  |     expect((await toggles.first().boundingBox()).height).toBeGreaterThanOrEqual(44);
  47  |     await toggles.first().click();
  48  |     await expect(page.locator('.sidebar')).toBeVisible();
  49  |     expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  50  | 
  51  |     await page.setViewportSize({ width: 1440, height: 900 });
  52  |     const boxes = await page.evaluate(() => ['.sidebar', '.canvas-wrapper', '.properties-panel'].map(selector => {
  53  |       const rect = document.querySelector(selector).getBoundingClientRect();
  54  |       return { left: rect.left, right: rect.right, width: rect.width };
  55  |     }));
  56  |     expect(boxes[0].right).toBeLessThanOrEqual(boxes[1].left);
  57  |     expect(boxes[1].right).toBeLessThanOrEqual(boxes[2].left);
  58  |     expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  59  |   }
  60  | });
  61  | 
  62  | async function assertModalContract(page, trigger, overlayId) {
  63  |   await trigger.focus();
  64  |   await trigger.click();
  65  |   const overlay = page.locator(`#${overlayId}`);
  66  |   await expect(overlay).toHaveClass(/visible/);
  67  |   const dialog = overlay.locator('[role="dialog"]');
  68  |   await expect(dialog).toHaveAttribute('aria-modal', 'true');
> 69  |   await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);
      |                        ^ Error: expect(locator).toHaveAttribute(expected) failed
  70  |   await expect(page.locator('.main-layout')).toHaveJSProperty('inert', true);
  71  |   const focusedInside = await page.evaluate(id => document.getElementById(id).contains(document.activeElement), overlayId);
  72  |   expect(focusedInside).toBe(true);
  73  |   await page.keyboard.press('Escape');
  74  |   await expect(overlay).not.toHaveClass(/visible/);
  75  |   await expect(trigger).toBeFocused();
  76  |   await expect(page.locator('.main-layout')).toHaveJSProperty('inert', false);
  77  | }
  78  | 
  79  | test('standard dialogs satisfy title, inert, Escape, and focus restoration contracts', async ({ page }) => {
  80  |   await assertModalContract(page, page.locator('.template-btn'), 'templateOverlay');
  81  |   await assertModalContract(page, page.locator('button[onclick="showExportDialog()"]'), 'exportOverlay');
  82  |   await assertModalContract(page, page.locator('button[onclick="showSettingsDialog()"]'), 'settingsOverlay');
  83  |   await assertModalContract(page, page.locator('button[onclick="showLayoutDialog()"]'), 'layoutOverlay');
  84  |   await assertModalContract(page, page.locator('button[onclick="showExcelDataDialog()"]'), 'excelDataOverlay');
  85  | 
  86  |   const trigger = page.locator('#btn-select');
  87  |   await trigger.focus();
  88  |   await page.evaluate(() => showConfirm('Confirm title', 'Message', () => {}));
  89  |   await expect(page.locator('#confirmOverlay [role="dialog"]')).toHaveAttribute('aria-labelledby', /.+/);
  90  |   await page.keyboard.press('Escape');
  91  |   await expect(trigger).toBeFocused();
  92  | });
  93  | 
  94  | test('command, import, and mapping dialogs lock focus and restore their triggers', async ({ page }) => {
  95  |   const trigger = page.locator('#btn-select');
  96  |   await trigger.focus();
  97  |   await page.keyboard.press('Control+k');
  98  |   await expect(page.locator('#commandPaletteOverlay')).toHaveClass(/visible/);
  99  |   await expect(page.locator('.main-layout')).toHaveJSProperty('inert', true);
  100 |   await page.keyboard.press('Escape');
  101 |   await expect(trigger).toBeFocused();
  102 | 
  103 |   await trigger.focus();
  104 |   await page.evaluate(() => showImportPreview(createImportPreview({ version: 1, nodes: [], connections: [] }), { sourceName: 'QA' }));
  105 |   await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/);
  106 |   await page.keyboard.press('Shift+Tab');
  107 |   expect(await page.evaluate(() => document.getElementById('importPreviewOverlay').contains(document.activeElement))).toBe(true);
  108 |   await page.keyboard.press('Escape');
  109 |   await expect(trigger).toBeFocused();
  110 | 
  111 |   await trigger.focus();
  112 |   await page.evaluate(() => startMappingWizard({ sourceName: 'QA', nodeRows: [{ Key: 'a', Name: 'A' }], connectionRows: [] }));
  113 |   await expect(page.locator('#mappingWizardOverlay')).toHaveClass(/visible/);
  114 |   await page.keyboard.press('Tab');
  115 |   expect(await page.evaluate(() => document.getElementById('mappingWizardOverlay').contains(document.activeElement))).toBe(true);
  116 |   await page.keyboard.press('Escape');
  117 |   await expect(trigger).toBeFocused();
  118 | });
  119 | 
  120 | test('icon tooltips are available on keyboard focus', async ({ page }) => {
  121 |   const button = page.locator('button[onclick="showExportDialog()"]');
  122 |   await button.focus();
  123 |   await expect(page.locator('#fastTooltip')).toHaveClass(/visible/);
  124 |   await expect(page.locator('#fastTooltip')).not.toHaveText('');
  125 | });
  126 | 
```
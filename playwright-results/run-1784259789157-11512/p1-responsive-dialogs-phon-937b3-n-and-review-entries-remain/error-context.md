# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-responsive-dialogs.spec.js >> phone mode is view-only while search, presentation, and review entries remain
- Location: tests\e2e\p1-responsive-dialogs.spec.js:14:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation "移动查看工具" [ref=e2]:
    - button "适应全部" [ref=e3]: 适应
    - button "搜索流程" [ref=e4]: 搜索
    - button "开始演示" [ref=e5]: 演示
    - button "打开审阅" [ref=e6]: 审阅
  - generic [ref=e7]:
    - text: ▾ ▾ ▾
    - generic [ref=e8]:
      - generic "画布小地图" [ref=e9]
      - generic [ref=e10]:
        - generic:
          - img
          - generic [ref=e12]:
            - generic: View only
  - dialog "Comments and Review / 评论审阅" [ref=e18]:
    - button "Close review" [active] [ref=e19] [cursor=pointer]: ×
    - generic [ref=e20]: Comments and Review / 评论审阅
    - generic [ref=e21]: "Selected node: responsive-node"
    - paragraph [ref=e23]: No review threads. / 暂无审阅线程
  - generic:
    - generic [ref=e24]:
      - generic [ref=e25]: 表格编辑
      - paragraph: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e26] [cursor=pointer]: 说明
      - generic [ref=e27]:
        - button "从画布同步到表格" [ref=e28] [cursor=pointer]:
          - img [ref=e29]
        - button "将表格内容应用到画布" [ref=e32] [cursor=pointer]:
          - img [ref=e33]
        - button "关闭表格编辑" [ref=e35] [cursor=pointer]:
          - img [ref=e36]
    - generic:
      - generic [ref=e39]:
        - generic [ref=e40]:
          - button "编辑各步骤节点" [ref=e41] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e42] [cursor=pointer]: 连线表
        - generic [ref=e43]:
          - button "在表格末尾添加一行空节点" [ref=e44] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e45] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e46]:
          - rowgroup [ref=e47]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e48] [cursor=pointer]:
              - columnheader "编号" [ref=e49]
              - columnheader "简介" [ref=e50]
              - columnheader "去向" [ref=e51]
              - columnheader "角色" [ref=e52]
              - columnheader "图形" [ref=e53]
              - columnheader "详细说明" [ref=e54]
              - columnheader "耗时天" [ref=e55]
              - columnheader "泳道" [ref=e56]
              - columnheader "图层" [ref=e57]
              - columnheader "目标页" [ref=e58]
          - rowgroup
    - generic [ref=e59]:
      - strong [ref=e60]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e61]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e62]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e63]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e64]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e65]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
  - tooltip
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
> 35  |   expect(reviewOpened).toBe(true);
      |                        ^ Error: expect(received).toBe(expected) // Object.is equality
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
  69  |   await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);
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
  123 |   await expect(page.locator('#fcTooltip')).toHaveClass(/visible/);
  124 |   await expect(page.locator('#fcTooltip')).not.toHaveText('');
  125 | });
  126 | 
```
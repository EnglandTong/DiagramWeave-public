# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-responsive-dialogs.spec.js >> icon tooltips are available on keyboard focus
- Location: tests\e2e\p1-responsive-dialogs.spec.js:120:1

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('#fastTooltip')
Expected pattern: /visible/
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveClass" with timeout 5000ms
  - waiting for locator('#fastTooltip')

```

```yaml
- img
- text: DiagramWeave
- button "New Project":
  - img
- button "Select (V)":
  - img
- button "Connect (L)":
  - img
- button "Pan canvas (H)":
  - img
- button "Undo (Ctrl+Z)":
  - img
- button "Redo (Ctrl+Y)":
  - img
- button "Table editor (T)":
  - img
- button "Auto layout":
  - img
- combobox "Connection routing":
  - option "Curved"
  - option "Orthogonal"
  - option "Avoid obstacles"
  - option "Straight"
  - option "Visio-style" [selected]
- button "Delete selection (Delete)":
  - img
- button "Clear canvas":
  - img
- text: Untitled Project
- button "Presentation mode":
  - img
- button "Zoom out": −
- text: 100%
- button "Zoom in": +
- button "Reset zoom 100%":
  - img
- button "Download PNG / SVG / PDF":
  - img
- button "Save project (.diagramweave.json)":
  - img
- button "Load project":
  - img
- button "Excel template & import":
  - img
- combobox "Language":
  - option "中文"
  - option "EN" [selected]
- button "Settings & updates":
  - img
- button "Page 1"
- button "+"
- button "⧉"
- button "Templates":
  - img
  - text: Templates
- text: Shapes
- searchbox "搜索图形"
- button "Basic shapes ▾" [expanded]
- group "流程":
  - img
  - text: Process
  - button "Favorite 流程": ☆
- group "子流程":
  - img
  - text: Subprocess
  - button "Favorite 子流程": ☆
- group "判断":
  - img
  - text: Decision
  - button "Favorite 判断": ☆
- group "开始/结束":
  - img
  - text: Start/End
  - button "Favorite 开始/结束": ☆
- group "连接点":
  - img
  - text: Connector
  - button "Favorite 连接点": ☆
- group "数据":
  - img
  - text: Database
  - button "Favorite 数据": ☆
- group "输入/输出":
  - img
  - text: Input/Output
  - button "Favorite 输入/输出": ☆
- group "文档":
  - img
  - text: Document
  - button "Favorite 文档": ☆
- group "准备":
  - img
  - text: Preparation
  - button "Favorite 准备": ☆
- group "合并":
  - img
  - text: Merge
  - button "Favorite 合并": ☆
- group "延迟":
  - img
  - text: Delay
  - button "Favorite 延迟": ☆
- group "显示":
  - img
  - text: Display
  - button "Favorite 显示": ☆
- group "手动操作":
  - img
  - text: Manual
  - button "Favorite 手动操作": ☆
- group "排序":
  - img
  - text: Sort
  - button "Favorite 排序": ☆
- group "或":
  - img
  - text: Or
  - button "Favorite 或": ☆
- group "存储":
  - img
  - text: Storage
  - button "Favorite 存储": ☆
- group "多文档":
  - img
  - text: Multi-document
  - button "Favorite 多文档": ☆
- group "内部存储":
  - img
  - text: Internal storage
  - button "Favorite 内部存储": ☆
- group "离线存储":
  - img
  - text: Offline storage
  - button "Favorite 离线存储": ☆
- group "注释":
  - img
  - text: Annotation
  - button "Favorite 注释": ☆
- button "Extended shapes ▾" [expanded]
- group "云服务":
  - img
  - text: Cloud
  - button "Favorite 云服务": ☆
- group "角色":
  - img
  - text: Actor
  - button "Favorite 角色": ☆
- group "便签":
  - img
  - text: Note
  - button "Favorite 便签": ☆
- group "跨页":
  - img
  - text: Off-page
  - button "Favorite 跨页": ☆
- group "子流程框":
  - img
  - text: Subprocess frame
  - button "Favorite 子流程框": ☆
- group "交叉":
  - img
  - text: Cross
  - button "Favorite 交叉": ☆
- group "开始":
  - img
  - text: Start
  - button "Favorite 开始": ☆
- group "结束":
  - img
  - text: End
  - button "Favorite 结束": ☆
- group "卡片":
  - img
  - text: Card
  - button "Favorite 卡片": ☆
- group "求和":
  - img
  - text: Summing
  - button "Favorite 求和": ☆
- button "Remote icons ▾" [expanded]
- group "Webhook":
  - img
  - text: Webhook
  - button "Favorite Webhook": ☆
- group "消息队列":
  - img
  - text: 消息队列
  - button "Favorite 消息队列": ☆
- text: Layers
- button "👁"
- text: Layer 1
- button "🔓"
- button "+ New layer"
- text: T Text editor Double-click Edit label Delete Delete selection Ctrl+Z Undo
- button "适应全部": ⌗
- button "适应选区": ▣
- button "缩放至 100%": 100%
- button "打开节点大纲": ☷
- combobox "对齐所选节点":
  - option "对齐" [selected]
  - option "左对齐"
  - option "水平居中"
  - option "右对齐"
  - option "顶部对齐"
  - option "垂直居中"
  - option "底部对齐"
- combobox "等距分布所选节点":
  - option "分布" [selected]
  - option "水平等距"
  - option "垂直等距"
- img
- text: View only V Select L Connect Click connection to edit Wheel Zoom Hold Space to pan canvas Properties Page info Page name
- textbox "Page name": Page 1
- paragraph: JSON save / image export uses the current page name as the default filename.
- text: Scale 当前页 1 个图形 Total duration 0 天 Critical path 1 个节点 · 0 天 Step count 1 步 表格编辑
- paragraph: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
- button "展开说明": 说明
- button "从画布同步到表格":
  - img
- button "将表格内容应用到画布":
  - img
- button "关闭表格编辑":
  - img
- button "编辑各步骤节点": 节点表
- button "编辑节点之间的连线": 连线表
- button "在表格末尾添加一行空节点": + 节点
- button "先点击行选中（高亮），再删除": 删节点
- table:
  - rowgroup:
    - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页":
      - columnheader "编号"
      - columnheader "简介"
      - columnheader "去向"
      - columnheader "角色"
      - columnheader "图形"
      - columnheader "详细说明"
      - columnheader "耗时天"
      - columnheader "泳道"
      - columnheader "图层"
      - columnheader "目标页"
  - rowgroup
- strong: 怎么用：
- text: ① 顶部工具栏点「表格」图标打开本面板。 ②
- strong: 节点表
- text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
- strong: 连线表
- text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
- strong: ↺ 刷新
- text: ；在表格改内容 → 点
- strong: ✓ 应用
- text: （会重新布局）。 ⑤ 删除：先
- strong: 点击表格行
- text: 使其高亮，再点「删节点/删连线」。
- tooltip "Download PNG / SVG / PDF"
```

# Test source

```ts
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
> 123 |   await expect(page.locator('#fastTooltip')).toHaveClass(/visible/);
      |                                              ^ Error: expect(locator).toHaveClass(expected) failed
  124 |   await expect(page.locator('#fastTooltip')).not.toHaveText('');
  125 | });
  126 | 
```
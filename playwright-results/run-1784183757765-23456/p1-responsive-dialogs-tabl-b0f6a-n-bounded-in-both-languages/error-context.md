# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-responsive-dialogs.spec.js >> tablet drawers and desktop columns remain bounded in both languages
- Location: tests\e2e\p1-responsive-dialogs.spec.js:40:1

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 768
Received:    1071
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e4]
      - text: DiagramWeave
    - button "New Project" [ref=e7] [cursor=pointer]:
      - img [ref=e8]
    - button "Select (V)" [ref=e11] [cursor=pointer]:
      - img [ref=e12]
    - button "Connect (L)" [ref=e14] [cursor=pointer]:
      - img [ref=e15]
    - button "Pan canvas (H)" [ref=e19] [cursor=pointer]:
      - img [ref=e20]
    - button "Undo (Ctrl+Z)" [ref=e25] [cursor=pointer]:
      - img [ref=e26]
    - button "Redo (Ctrl+Y)" [ref=e29] [cursor=pointer]:
      - img [ref=e30]
    - button "Table editor (T)" [ref=e33] [cursor=pointer]:
      - img [ref=e34]
    - button "Auto layout" [ref=e38] [cursor=pointer]:
      - img [ref=e39]
    - combobox "Connection routing" [ref=e44] [cursor=pointer]:
      - option "Curved"
      - option "Orthogonal"
      - option "Avoid obstacles"
      - option "Straight"
      - option "Visio-style" [selected]
    - button "Delete selection (Delete)" [ref=e46] [cursor=pointer]:
      - img [ref=e47]
    - button "Clear canvas" [ref=e49] [cursor=pointer]:
      - img [ref=e50]
    - button "Presentation mode" [ref=e55] [cursor=pointer]:
      - img [ref=e56]
    - generic [ref=e59]:
      - button "Zoom out" [ref=e60] [cursor=pointer]: −
      - generic [ref=e61]: 100%
      - button "Zoom in" [ref=e62] [cursor=pointer]: +
      - button "Reset zoom 100%" [ref=e63] [cursor=pointer]:
        - img [ref=e64]
    - button "Download PNG / SVG / PDF" [ref=e68] [cursor=pointer]:
      - img [ref=e69]
    - button "Save project (.diagramweave.json)" [ref=e72] [cursor=pointer]:
      - img [ref=e73]
    - button "Load project" [ref=e77] [cursor=pointer]:
      - img [ref=e78]
    - button "Excel template & import" [ref=e81] [cursor=pointer]:
      - img [ref=e82]
    - combobox "Language" [ref=e86] [cursor=pointer]:
      - option "中文"
      - option "EN" [selected]
    - button "Settings & updates" [ref=e87] [cursor=pointer]:
      - img [ref=e88]
    - button "打开图形面板" [active] [ref=e91] [cursor=pointer]:
      - img [ref=e92]
    - button "打开属性面板" [ref=e97] [cursor=pointer]:
      - img [ref=e98]
  - generic [ref=e103]:
    - button "Page 1" [ref=e105] [cursor=pointer]
    - button "+" [ref=e106] [cursor=pointer]
    - button "⧉" [ref=e107] [cursor=pointer]
  - generic [ref=e108]:
    - generic [ref=e109]:
      - button "Templates" [ref=e110] [cursor=pointer]:
        - img [ref=e111]
        - generic [ref=e116]: Templates
      - generic [ref=e117]: Shapes
      - searchbox "搜索图形" [ref=e119]
      - generic [ref=e120]:
        - button "Basic shapes ▾" [expanded] [ref=e121] [cursor=pointer]
        - generic [ref=e122]:
          - group "流程" [ref=e123]:
            - img [ref=e124]
            - generic [ref=e126]: Process
            - button "Favorite 流程" [ref=e127] [cursor=pointer]: ☆
          - group "子流程" [ref=e128]:
            - img [ref=e129]
            - generic [ref=e131]: Subprocess
            - button "Favorite 子流程" [ref=e132] [cursor=pointer]: ☆
          - group "判断" [ref=e133]:
            - img [ref=e134]
            - generic [ref=e136]: Decision
            - button "Favorite 判断" [ref=e137] [cursor=pointer]: ☆
          - group "开始/结束" [ref=e138]:
            - img [ref=e139]
            - generic [ref=e141]: Start/End
            - button "Favorite 开始/结束" [ref=e142] [cursor=pointer]: ☆
          - group "连接点" [ref=e143]:
            - img [ref=e144]
            - generic [ref=e146]: Connector
            - button "Favorite 连接点" [ref=e147] [cursor=pointer]: ☆
          - group "数据" [ref=e148]:
            - img [ref=e149]
            - generic [ref=e152]: Database
            - button "Favorite 数据" [ref=e153] [cursor=pointer]: ☆
          - group "输入/输出" [ref=e154]:
            - img [ref=e155]
            - generic [ref=e157]: Input/Output
            - button "Favorite 输入/输出" [ref=e158] [cursor=pointer]: ☆
          - group "文档" [ref=e159]:
            - img [ref=e160]
            - generic [ref=e162]: Document
            - button "Favorite 文档" [ref=e163] [cursor=pointer]: ☆
          - group "准备" [ref=e164]:
            - img [ref=e165]
            - generic [ref=e167]: Preparation
            - button "Favorite 准备" [ref=e168] [cursor=pointer]: ☆
          - group "合并" [ref=e169]:
            - img [ref=e170]
            - generic [ref=e172]: Merge
            - button "Favorite 合并" [ref=e173] [cursor=pointer]: ☆
          - group "延迟" [ref=e174]:
            - img [ref=e175]
            - generic [ref=e177]: Delay
            - button "Favorite 延迟" [ref=e178] [cursor=pointer]: ☆
          - group "显示" [ref=e179]:
            - img [ref=e180]
            - generic [ref=e183]: Display
            - button "Favorite 显示" [ref=e184] [cursor=pointer]: ☆
          - group "手动操作" [ref=e185]:
            - img [ref=e186]
            - generic [ref=e188]: Manual
            - button "Favorite 手动操作" [ref=e189] [cursor=pointer]: ☆
          - group "排序" [ref=e190]:
            - img [ref=e191]
            - generic [ref=e193]: Sort
            - button "Favorite 排序" [ref=e194] [cursor=pointer]: ☆
          - group "或" [ref=e195]:
            - img [ref=e196]
            - generic [ref=e198]: Or
            - button "Favorite 或" [ref=e199] [cursor=pointer]: ☆
          - group "存储" [ref=e200]:
            - img [ref=e201]
            - generic [ref=e203]: Storage
            - button "Favorite 存储" [ref=e204] [cursor=pointer]: ☆
          - group "多文档" [ref=e205]:
            - img [ref=e206]
            - generic [ref=e209]: Multi-document
            - button "Favorite 多文档" [ref=e210] [cursor=pointer]: ☆
          - group "内部存储" [ref=e211]:
            - img [ref=e212]
            - generic [ref=e214]: Internal storage
            - button "Favorite 内部存储" [ref=e215] [cursor=pointer]: ☆
          - group "离线存储" [ref=e216]:
            - img [ref=e217]
            - generic [ref=e220]: Offline storage
            - button "Favorite 离线存储" [ref=e221] [cursor=pointer]: ☆
          - group "注释" [ref=e222]:
            - img [ref=e223]
            - generic [ref=e225]: Annotation
            - button "Favorite 注释" [ref=e226] [cursor=pointer]: ☆
      - generic [ref=e227]:
        - button "Extended shapes ▾" [expanded] [ref=e228] [cursor=pointer]
        - generic [ref=e229]:
          - group "云服务" [ref=e230]:
            - img [ref=e231]
            - generic [ref=e233]: Cloud
            - button "Favorite 云服务" [ref=e234] [cursor=pointer]: ☆
          - group "角色" [ref=e235]:
            - img [ref=e236]
            - generic [ref=e239]: Actor
            - button "Favorite 角色" [ref=e240] [cursor=pointer]: ☆
          - group "便签" [ref=e241]:
            - img [ref=e242]
            - generic [ref=e244]: Note
            - button "Favorite 便签" [ref=e245] [cursor=pointer]: ☆
          - group "跨页" [ref=e246]:
            - img [ref=e247]
            - generic [ref=e249]: Off-page
            - button "Favorite 跨页" [ref=e250] [cursor=pointer]: ☆
          - group "子流程框" [ref=e251]:
            - img [ref=e252]
            - generic [ref=e255]: Subprocess frame
            - button "Favorite 子流程框" [ref=e256] [cursor=pointer]: ☆
          - group "交叉" [ref=e257]:
            - img [ref=e258]
            - generic [ref=e259]: Cross
            - button "Favorite 交叉" [ref=e260] [cursor=pointer]: ☆
          - group "开始" [ref=e261]:
            - img [ref=e262]
            - generic [ref=e264]: Start
            - button "Favorite 开始" [ref=e265] [cursor=pointer]: ☆
          - group "结束" [ref=e266]:
            - img [ref=e267]
            - generic [ref=e269]: End
            - button "Favorite 结束" [ref=e270] [cursor=pointer]: ☆
          - group "卡片" [ref=e271]:
            - img [ref=e272]
            - generic [ref=e274]: Card
            - button "Favorite 卡片" [ref=e275] [cursor=pointer]: ☆
          - group "求和" [ref=e276]:
            - img [ref=e277]
            - generic [ref=e279]: Summing
            - button "Favorite 求和" [ref=e280] [cursor=pointer]: ☆
      - generic [ref=e281]:
        - button "Remote icons ▾" [expanded] [ref=e282] [cursor=pointer]
        - generic [ref=e283]:
          - group "Webhook" [ref=e284]:
            - img [ref=e285]
            - generic [ref=e288]: shape.webhook
            - button "Favorite Webhook" [ref=e289] [cursor=pointer]: ☆
          - group "消息队列" [ref=e290]:
            - img [ref=e291]
            - generic [ref=e294]: shape.queue
            - button "Favorite 消息队列" [ref=e295] [cursor=pointer]: ☆
      - generic [ref=e296]:
        - generic [ref=e297]: Layers
        - generic [ref=e298]:
          - generic [ref=e299] [cursor=pointer]:
            - button "👁" [ref=e300]
            - generic [ref=e301]: Layer 1
            - button "🔓" [ref=e302]
          - button "+ New layer" [ref=e303] [cursor=pointer]
      - generic [ref=e305]:
        - generic [ref=e306]: T Text editor
        - generic [ref=e307]: Double-click Edit label
        - generic [ref=e308]: Delete Delete selection
        - generic [ref=e309]: Ctrl+Z Undo
    - generic [ref=e310]:
      - generic "画布导航" [ref=e311]:
        - button "适应全部" [ref=e312] [cursor=pointer]: ⌗
        - button "适应选区" [ref=e313] [cursor=pointer]: ▣
        - button "缩放至 100%" [ref=e314] [cursor=pointer]: 100%
        - button "打开节点大纲" [ref=e315] [cursor=pointer]: ☷
        - combobox "对齐所选节点" [ref=e316] [cursor=pointer]:
          - option "对齐" [selected]
          - option "左对齐"
          - option "水平居中"
          - option "右对齐"
          - option "顶部对齐"
          - option "垂直居中"
          - option "底部对齐"
        - combobox "等距分布所选节点" [ref=e317] [cursor=pointer]:
          - option "分布" [selected]
          - option "水平等距"
          - option "垂直等距"
      - generic "画布小地图" [ref=e318]
      - generic [ref=e319]:
        - generic:
          - img
          - generic [ref=e321]:
            - generic: View only
      - generic [ref=e322]:
        - generic [ref=e323]: V Select
        - generic [ref=e324]: L Connect
        - generic [ref=e325]: Click connection to edit
        - generic [ref=e326]: Wheel Zoom
        - generic [ref=e327]: Hold Space to pan canvas
    - generic [ref=e328]:
      - generic [ref=e329]: Properties
      - generic [ref=e331]:
        - generic [ref=e332]: Page info
        - generic [ref=e333]:
          - generic [ref=e334]: Page name
          - textbox "Page name" [ref=e335]: Page 1
        - paragraph [ref=e336]: JSON save / image export uses the current page name as the default filename.
        - generic [ref=e337]:
          - generic [ref=e338]: Scale
          - generic [ref=e339]: 当前页 1 个图形
        - generic [ref=e340]:
          - generic [ref=e341]: Total duration
          - generic [ref=e342]: 0 天
        - generic [ref=e343]:
          - generic [ref=e344]: Critical path
          - generic [ref=e345]: 1 个节点 · 0 天
        - generic [ref=e346]:
          - generic [ref=e347]: Step count
          - generic [ref=e348]: 1 步
  - generic [ref=e350]: Language updated
  - generic [ref=e351]:
    - generic [ref=e352]:
      - generic [ref=e353]: 表格编辑
      - paragraph [ref=e354]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e355] [cursor=pointer]: 说明
      - generic [ref=e356]:
        - button "从画布同步到表格" [ref=e357] [cursor=pointer]:
          - img [ref=e358]
        - button "将表格内容应用到画布" [ref=e361] [cursor=pointer]:
          - img [ref=e362]
        - button "关闭表格编辑" [ref=e364] [cursor=pointer]:
          - img [ref=e365]
    - generic:
      - generic [ref=e368]:
        - generic [ref=e369]:
          - button "编辑各步骤节点" [ref=e370] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e371] [cursor=pointer]: 连线表
        - generic [ref=e372]:
          - button "在表格末尾添加一行空节点" [ref=e373] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e374] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e375]:
          - rowgroup [ref=e376]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e377] [cursor=pointer]:
              - columnheader "编号" [ref=e378]
              - columnheader "简介" [ref=e379]
              - columnheader "去向" [ref=e380]
              - columnheader "角色" [ref=e381]
              - columnheader "图形" [ref=e382]
              - columnheader "详细说明" [ref=e383]
              - columnheader "耗时天" [ref=e384]
              - columnheader "泳道" [ref=e385]
              - columnheader "图层" [ref=e386]
              - columnheader "目标页" [ref=e387]
          - rowgroup
    - generic [ref=e388]:
      - strong [ref=e389]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e390]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e391]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e392]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e393]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e394]: 点击表格行
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
> 49  |     expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
      |                                                                             ^ Error: expect(received).toBeLessThanOrEqual(expected)
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
  123 |   await expect(page.locator('#fastTooltip')).toHaveClass(/visible/);
  124 |   await expect(page.locator('#fastTooltip')).not.toHaveText('');
  125 | });
  126 | 
```
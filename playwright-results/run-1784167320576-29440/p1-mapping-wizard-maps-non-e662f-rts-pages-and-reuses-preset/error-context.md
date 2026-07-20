# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-mapping-wizard.spec.js >> maps nonstandard Excel fields, preserves geometry/ports/pages, and reuses preset
- Location: tests\e2e\p1-mapping-wizard.spec.js:17:1

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('#mappingWizardOverlay')
Expected pattern: /visible/
Received string:  "mapping-wizard-overlay"
Timeout: 5000ms

Call log:
  - Expect "toHaveClass" with timeout 5000ms
  - waiting for locator('#mappingWizardOverlay')
    11 × locator resolved to <div aria-hidden="true" id="mappingWizardOverlay" class="mapping-wizard-overlay" onclick="if(event.target===this)cancelMappingWizard()">…</div>
       - unexpected value "mapping-wizard-overlay"

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
- text: Basic shapes
- button "流程":
  - img
  - text: Process
- button "子流程":
  - img
  - text: Subprocess
- button "判断":
  - img
  - text: Decision
- button "开始/结束":
  - img
  - text: Start/End
- button "连接点":
  - img
  - text: Connector
- button "数据":
  - img
  - text: Database
- button "输入/输出":
  - img
  - text: Input/Output
- button "文档":
  - img
  - text: Document
- button "准备":
  - img
  - text: Preparation
- button "合并":
  - img
  - text: Merge
- button "延迟":
  - img
  - text: Delay
- button "显示":
  - img
  - text: Display
- button "手动操作":
  - img
  - text: Manual
- button "排序":
  - img
  - text: Sort
- button "或":
  - img
  - text: Or
- button "存储":
  - img
  - text: Storage
- button "多文档":
  - img
  - text: Multi-document
- button "内部存储":
  - img
  - text: Internal storage
- button "离线存储":
  - img
  - text: Offline storage
- button "注释":
  - img
  - text: Annotation
- text: Extended shapes
- button "云服务":
  - img
  - text: Cloud
- button "角色":
  - img
  - text: Actor
- button "便签":
  - img
  - text: Note
- button "跨页":
  - img
  - text: Off-page
- button "子流程框":
  - img
  - text: Subprocess frame
- button "交叉":
  - img
  - text: Cross
- button "开始":
  - img
  - text: Start
- button "结束":
  - img
  - text: End
- button "卡片":
  - img
  - text: Card
- button "求和":
  - img
  - text: Summing
- text: Remote icons
- button "Webhook":
  - img
  - text: Webhook
- button "消息队列":
  - img
  - text: 消息队列
- text: Layers
- button "👁"
- text: Layer 1
- button "🔓"
- button "+ New layer"
- text: T Text editor Double-click Edit label Delete Delete selection Ctrl+Z Undo
- heading "开始创建流程" [level=2]
- button "从模板开始"
- button "导入文件"
- button "空白画布"
- img
- text: V Select L Connect Click connection to edit Wheel Zoom Hold Space to pan canvas Properties Page info Page name
- textbox "Page name": Page 1
- paragraph: JSON save / image export uses the current page name as the default filename.
- text: Scale 当前页 0 个图形 Total duration 0 天 Critical path — Step count 0 步 表格编辑
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
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test.beforeEach(async ({ page }) => {
  4  |   await page.addInitScript(() => {
  5  |     window.__dwSkipRemoteBootstrap = true;
  6  |     sessionStorage.setItem('dw-initial-save-prompted', '1');
  7  |     localStorage.clear();
  8  |   });
  9  |   await page.goto('/flowchart-editor.html');
  10 |   await page.waitForFunction(() => window.__dwEditorReady === true);
  11 | });
  12 | 
  13 | async function selectMapping(page, kind, field, column) {
  14 |   await page.locator(`[data-mapping-kind="${kind}"][data-mapping-field="${field}"]`).selectOption(column);
  15 | }
  16 | 
  17 | test('maps nonstandard Excel fields, preserves geometry/ports/pages, and reuses preset', async ({ page }) => {
  18 |   await page.evaluate(() => {
  19 |     const workbook = XLSX.utils.book_new();
  20 |     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
  21 |       { StepCode: 10, StepTitle: 'Draft', PX: 120, PY: 180, PW: 170, PH: 72, Owner: 'Writer', Band: 2, Sheet: 'Editorial' },
  22 |       { StepCode: 20, StepTitle: 'Approve', PX: 420, PY: 180, PW: 190, PH: 76, Owner: 'QA', Band: 3, Sheet: 'Editorial' },
  23 |     ]), 'OddNodes');
  24 |     XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
  25 |       { SourceStep: 10, TargetStep: 20, OutPort: 'right', InPort: 'left', EdgeText: 'submit', Sheet: 'Editorial' },
  26 |     ]), 'OddEdges');
  27 |     importExcelWorkbookData(workbook);
  28 |   });
> 29 |   await expect(page.locator('#mappingWizardOverlay')).toHaveClass(/visible/);
     |                                                       ^ Error: expect(locator).toHaveClass(expected) failed
  30 |   await selectMapping(page, 'node', 'id', 'StepCode');
  31 |   await selectMapping(page, 'node', 'label', 'StepTitle');
  32 |   await selectMapping(page, 'node', 'x', 'PX');
  33 |   await selectMapping(page, 'node', 'y', 'PY');
  34 |   await selectMapping(page, 'node', 'w', 'PW');
  35 |   await selectMapping(page, 'node', 'h', 'PH');
  36 |   await selectMapping(page, 'node', 'role', 'Owner');
  37 |   await selectMapping(page, 'node', 'layer', 'Band');
  38 |   await selectMapping(page, 'node', 'page', 'Sheet');
  39 |   await selectMapping(page, 'connection', 'from', 'SourceStep');
  40 |   await selectMapping(page, 'connection', 'to', 'TargetStep');
  41 |   await selectMapping(page, 'connection', 'fromPort', 'OutPort');
  42 |   await selectMapping(page, 'connection', 'toPort', 'InPort');
  43 |   await selectMapping(page, 'connection', 'label', 'EdgeText');
  44 |   await selectMapping(page, 'connection', 'page', 'Sheet');
  45 |   await expect(page.locator('#mappingAutoLayout')).not.toBeChecked();
  46 | 
  47 |   await page.locator('#mappingPresetName').fill('Odd ERP');
  48 |   await page.getByRole('button', { name: '保存预设' }).click();
  49 |   await expect(page.locator('#mappingValidation')).toContainText('已保存');
  50 |   await page.locator('#continueMappingBtn').click();
  51 |   await expect(page.locator('#importPreviewSummary')).toContainText('2');
  52 |   await page.locator('#applyImportPreviewBtn').click();
  53 | 
  54 |   const imported = await page.evaluate(() => ({
  55 |     pages: DiagramWeave.doc.pages.map(item => item.name),
  56 |     nodes: state.nodes.map(node => ({ label: node.label, x: node.x, y: node.y, w: node.w, h: node.h, role: node.role, layer: node.layer })),
  57 |     connection: state.connections[0],
  58 |   }));
  59 |   expect(imported.pages).toContain('Editorial');
  60 |   expect(imported.nodes[0]).toMatchObject({ label: 'Draft', x: 120, y: 180, w: 170, h: 72, role: 'Writer', layer: 2 });
  61 |   expect(imported.connection).toMatchObject({ fromPort: 'right', toPort: 'left', label: 'submit' });
  62 | 
  63 |   await page.evaluate(() => startMappingWizard({
  64 |     sourceName: 'Reuse', nodeRows: [{ StepCode: 30, StepTitle: 'Publish', PX: 10, PY: 20 }],
  65 |     connectionRows: [{ SourceStep: 30, TargetStep: 30, OutPort: 'bottom', InPort: 'top' }],
  66 |   }));
  67 |   await page.locator('#mappingPresetSelect').selectOption('Odd ERP');
  68 |   await expect(page.locator('[data-mapping-kind="node"][data-mapping-field="id"]')).toHaveValue('StepCode');
  69 |   await expect(page.locator('[data-mapping-kind="connection"][data-mapping-field="fromPort"]')).toHaveValue('OutPort');
  70 | });
  71 | 
  72 | test('maps nonstandard JSON arrays before preview and explicit apply', async ({ page }) => {
  73 |   const raw = {
  74 |     nodes: [{ Key: 1, Title: 'JSON A', Left: 80, Top: 90 }, { Key: 2, Title: 'JSON B', Left: 280, Top: 90 }],
  75 |     connections: [{ SourceKey: 1, TargetKey: 2, SourceDock: 'right', TargetDock: 'left' }],
  76 |   };
  77 |   await page.locator('#fileInput').setInputFiles({
  78 |     name: 'nonstandard.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(raw)),
  79 |   });
  80 |   await expect(page.locator('#mappingWizardOverlay')).toHaveClass(/visible/);
  81 |   await selectMapping(page, 'node', 'id', 'Key');
  82 |   await selectMapping(page, 'node', 'label', 'Title');
  83 |   await selectMapping(page, 'node', 'x', 'Left');
  84 |   await selectMapping(page, 'node', 'y', 'Top');
  85 |   await selectMapping(page, 'connection', 'from', 'SourceKey');
  86 |   await selectMapping(page, 'connection', 'to', 'TargetKey');
  87 |   await selectMapping(page, 'connection', 'fromPort', 'SourceDock');
  88 |   await selectMapping(page, 'connection', 'toPort', 'TargetDock');
  89 |   await page.locator('#continueMappingBtn').click();
  90 |   await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/);
  91 |   await expect(page.locator('.node')).toHaveCount(0);
  92 |   await page.locator('#applyImportPreviewBtn').click();
  93 |   await expect(page.locator('.node')).toHaveCount(2);
  94 |   expect(await page.evaluate(() => state.nodes[0].x)).toBe(80);
  95 |   expect(await page.evaluate(() => state.connections[0].fromPort)).toBe('right');
  96 | });
  97 | 
```
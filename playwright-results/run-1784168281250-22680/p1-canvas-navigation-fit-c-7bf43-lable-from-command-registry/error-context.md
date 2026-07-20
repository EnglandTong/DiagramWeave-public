# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-canvas-navigation.spec.js >> fit commands update viewport and are available from command registry
- Location: tests\e2e\p1-canvas-navigation.spec.js:40:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

Expected: ArrayContaining ["view.fitAll", "view.fitSelection", "view.resetZoom", "view.outline"]
Received: ["tool.select", "tool.connect", "layout.auto", "template.open", "project.import", "project.export", "view.resetZoom", "view.fitAll", "view.outline", "project.blank"]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
    - generic "Untitled Project" [ref=e55]
    - button "Presentation mode" [ref=e56] [cursor=pointer]:
      - img [ref=e57]
    - generic [ref=e60]:
      - button "Zoom out" [ref=e61] [cursor=pointer]: −
      - generic [ref=e62]: 100%
      - button "Zoom in" [ref=e63] [cursor=pointer]: +
      - button "Reset zoom 100%" [ref=e64] [cursor=pointer]:
        - img [ref=e65]
    - button "Download PNG / SVG / PDF" [ref=e69] [cursor=pointer]:
      - img [ref=e70]
    - button "Save project (.diagramweave.json)" [ref=e73] [cursor=pointer]:
      - img [ref=e74]
    - button "Load project" [ref=e78] [cursor=pointer]:
      - img [ref=e79]
    - button "Excel template & import" [ref=e82] [cursor=pointer]:
      - img [ref=e83]
    - combobox "Language" [ref=e87] [cursor=pointer]:
      - option "中文"
      - option "EN" [selected]
    - button "Settings & updates" [ref=e88] [cursor=pointer]:
      - img [ref=e89]
  - generic [ref=e92]:
    - button "Page 1" [ref=e94] [cursor=pointer]
    - button "+" [ref=e95] [cursor=pointer]
    - button "⧉" [ref=e96] [cursor=pointer]
  - generic [ref=e97]:
    - generic [ref=e98]:
      - button "Templates" [ref=e99] [cursor=pointer]:
        - img [ref=e100]
        - generic [ref=e105]: Templates
      - generic [ref=e106]: Shapes
      - searchbox "搜索图形" [ref=e108]
      - generic [ref=e109]:
        - generic [ref=e110]: Basic shapes
        - generic [ref=e111]:
          - button "流程" [ref=e112]:
            - img [ref=e113]
            - generic [ref=e115]: Process
          - button "子流程" [ref=e116]:
            - img [ref=e117]
            - generic [ref=e119]: Subprocess
          - button "判断" [ref=e120]:
            - img [ref=e121]
            - generic [ref=e123]: Decision
          - button "开始/结束" [ref=e124]:
            - img [ref=e125]
            - generic [ref=e127]: Start/End
          - button "连接点" [ref=e128]:
            - img [ref=e129]
            - generic [ref=e131]: Connector
          - button "数据" [ref=e132]:
            - img [ref=e133]
            - generic [ref=e136]: Database
          - button "输入/输出" [ref=e137]:
            - img [ref=e138]
            - generic [ref=e140]: Input/Output
          - button "文档" [ref=e141]:
            - img [ref=e142]
            - generic [ref=e144]: Document
          - button "准备" [ref=e145]:
            - img [ref=e146]
            - generic [ref=e148]: Preparation
          - button "合并" [ref=e149]:
            - img [ref=e150]
            - generic [ref=e152]: Merge
          - button "延迟" [ref=e153]:
            - img [ref=e154]
            - generic [ref=e156]: Delay
          - button "显示" [ref=e157]:
            - img [ref=e158]
            - generic [ref=e161]: Display
          - button "手动操作" [ref=e162]:
            - img [ref=e163]
            - generic [ref=e165]: Manual
          - button "排序" [ref=e166]:
            - img [ref=e167]
            - generic [ref=e169]: Sort
          - button "或" [ref=e170]:
            - img [ref=e171]
            - generic [ref=e173]: Or
          - button "存储" [ref=e174]:
            - img [ref=e175]
            - generic [ref=e177]: Storage
          - button "多文档" [ref=e178]:
            - img [ref=e179]
            - generic [ref=e182]: Multi-document
          - button "内部存储" [ref=e183]:
            - img [ref=e184]
            - generic [ref=e186]: Internal storage
          - button "离线存储" [ref=e187]:
            - img [ref=e188]
            - generic [ref=e191]: Offline storage
          - button "注释" [ref=e192]:
            - img [ref=e193]
            - generic [ref=e195]: Annotation
      - generic [ref=e196]:
        - generic [ref=e197]: Extended shapes
        - generic [ref=e198]:
          - button "云服务" [ref=e199]:
            - img [ref=e200]
            - generic [ref=e202]: Cloud
          - button "角色" [ref=e203]:
            - img [ref=e204]
            - generic [ref=e207]: Actor
          - button "便签" [ref=e208]:
            - img [ref=e209]
            - generic [ref=e211]: Note
          - button "跨页" [ref=e212]:
            - img [ref=e213]
            - generic [ref=e215]: Off-page
          - button "子流程框" [ref=e216]:
            - img [ref=e217]
            - generic [ref=e220]: Subprocess frame
          - button "交叉" [ref=e221]:
            - img [ref=e222]
            - generic [ref=e223]: Cross
          - button "开始" [ref=e224]:
            - img [ref=e225]
            - generic [ref=e227]: Start
          - button "结束" [ref=e228]:
            - img [ref=e229]
            - generic [ref=e231]: End
          - button "卡片" [ref=e232]:
            - img [ref=e233]
            - generic [ref=e235]: Card
          - button "求和" [ref=e236]:
            - img [ref=e237]
            - generic [ref=e239]: Summing
      - generic [ref=e240]:
        - generic [ref=e241]: Remote icons
        - generic [ref=e242]:
          - button "Webhook" [ref=e243]:
            - img [ref=e244]
            - generic [ref=e247]: Webhook
          - button "消息队列" [ref=e248]:
            - img [ref=e249]
            - generic [ref=e252]: 消息队列
      - generic [ref=e253]:
        - generic [ref=e254]: Layers
        - generic [ref=e255]:
          - generic [ref=e256] [cursor=pointer]:
            - button "👁" [ref=e257]
            - generic [ref=e258]: Layer 1
            - button "🔓" [ref=e259]
          - button "+ New layer" [ref=e260] [cursor=pointer]
      - generic [ref=e262]:
        - generic [ref=e263]: T Text editor
        - generic [ref=e264]: Double-click Edit label
        - generic [ref=e265]: Delete Delete selection
        - generic [ref=e266]: Ctrl+Z Undo
    - generic [ref=e267]:
      - generic "画布导航" [ref=e268]:
        - button "适应全部" [ref=e269] [cursor=pointer]: ⌗
        - button "适应选区" [ref=e270] [cursor=pointer]: ▣
        - button "缩放至 100%" [ref=e271] [cursor=pointer]: 100%
        - button "打开节点大纲" [ref=e272] [cursor=pointer]: ☷
        - combobox "对齐所选节点" [ref=e273] [cursor=pointer]:
          - option "对齐" [selected]
          - option "左对齐"
          - option "水平居中"
          - option "右对齐"
          - option "顶部对齐"
          - option "垂直居中"
          - option "底部对齐"
        - combobox "等距分布所选节点" [ref=e274] [cursor=pointer]:
          - option "分布" [selected]
          - option "水平等距"
          - option "垂直等距"
      - generic "画布小地图" [ref=e275]
      - generic [ref=e276]:
        - generic:
          - img
          - generic [ref=e278]:
            - generic: Draft
          - generic [ref=e280]:
            - img
            - generic: Review
          - generic [ref=e282]:
            - generic: Publish
      - generic [ref=e283]:
        - generic [ref=e284]: V Select
        - generic [ref=e285]: L Connect
        - generic [ref=e286]: Click connection to edit
        - generic [ref=e287]: Wheel Zoom
        - generic [ref=e288]: Hold Space to pan canvas
    - generic [ref=e289]:
      - generic [ref=e290]: Properties
      - generic [ref=e292]:
        - generic [ref=e293]: Page info
        - generic [ref=e294]:
          - generic [ref=e295]: Page name
          - textbox "Page name" [ref=e296]: Page 1
        - paragraph [ref=e297]: JSON save / image export uses the current page name as the default filename.
        - generic [ref=e298]:
          - generic [ref=e299]: Scale
          - generic [ref=e300]: 当前页 3 个图形
        - generic [ref=e301]:
          - generic [ref=e302]: Total duration
          - generic [ref=e303]: 0 天
        - generic [ref=e304]:
          - generic [ref=e305]: Critical path
          - generic [ref=e306]: 1 个节点 · 0 天
        - generic [ref=e307]:
          - generic [ref=e308]: Step count
          - generic [ref=e309]: 3 步
  - generic [ref=e310]:
    - generic [ref=e311]:
      - generic [ref=e312]: 表格编辑
      - paragraph [ref=e313]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e314] [cursor=pointer]: 说明
      - generic [ref=e315]:
        - button "从画布同步到表格" [ref=e316] [cursor=pointer]:
          - img [ref=e317]
        - button "将表格内容应用到画布" [ref=e320] [cursor=pointer]:
          - img [ref=e321]
        - button "关闭表格编辑" [ref=e323] [cursor=pointer]:
          - img [ref=e324]
    - generic:
      - generic [ref=e327]:
        - generic [ref=e328]:
          - button "编辑各步骤节点" [ref=e329] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e330] [cursor=pointer]: 连线表
        - generic [ref=e331]:
          - button "在表格末尾添加一行空节点" [ref=e332] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e333] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e334]:
          - rowgroup [ref=e335]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e336] [cursor=pointer]:
              - columnheader "编号" [ref=e337]
              - columnheader "简介" [ref=e338]
              - columnheader "去向" [ref=e339]
              - columnheader "角色" [ref=e340]
              - columnheader "图形" [ref=e341]
              - columnheader "详细说明" [ref=e342]
              - columnheader "耗时天" [ref=e343]
              - columnheader "泳道" [ref=e344]
              - columnheader "图层" [ref=e345]
              - columnheader "目标页" [ref=e346]
          - rowgroup
    - generic [ref=e347]:
      - strong [ref=e348]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e349]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e350]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e351]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e352]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e353]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
  - tooltip
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | const seedNodes = [
  4  |   { id: 'nav-a', shape: 'rectangle', x: 40, y: 50, w: 120, h: 60, label: 'Draft', role: 'Writer' },
  5  |   { id: 'nav-b', shape: 'diamond', x: 360, y: 190, w: 120, h: 80, label: 'Review', role: 'QA' },
  6  |   { id: 'nav-c', shape: 'rectangle', x: 760, y: 390, w: 140, h: 60, label: 'Publish', role: 'Writer' },
  7  | ];
  8  | 
  9  | test.beforeEach(async ({ page }) => {
  10 |   await page.addInitScript(nodes => {
  11 |     sessionStorage.setItem('dw-initial-save-prompted', '1');
  12 |     sessionStorage.setItem('dw-e2e-seed-nodes', JSON.stringify(nodes));
  13 |   }, seedNodes);
  14 |   await page.goto('/flowchart-editor.html');
  15 |   await page.waitForFunction(() => window.__dwEditorReady && document.querySelectorAll('.node').length === 3);
  16 | });
  17 | 
  18 | test('minimap paints nodes and viewport, and Outline filters then centers a node', async ({ page }) => {
  19 |   const paintedPixels = await page.locator('#canvasMinimap').evaluate(canvas => {
  20 |     const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  21 |     const first = data.slice(0, 4).join(',');
  22 |     let changed = 0;
  23 |     for (let index = 4; index < data.length; index += 4) {
  24 |       if (data.slice(index, index + 4).join(',') !== first) changed += 1;
  25 |     }
  26 |     return changed;
  27 |   });
  28 |   expect(paintedPixels).toBeGreaterThan(50);
  29 | 
  30 |   await page.locator('[aria-label*="Outline"], [title="Outline"]').first().click();
  31 |   await expect(page.locator('#outlinePanel')).toHaveClass(/visible/);
  32 |   await page.locator('#outlineSearch').fill('Review');
  33 |   await expect(page.locator('.outline-node')).toHaveCount(1);
  34 |   const before = await page.evaluate(() => ({ x: state.nodes[1].x, y: state.nodes[1].y }));
  35 |   await page.locator('.outline-node').click();
  36 |   await expect(page.locator('#nav-b')).toHaveClass(/selected/);
  37 |   expect(await page.evaluate(() => ({ x: state.nodes[1].x, y: state.nodes[1].y }))).toEqual(before);
  38 | });
  39 | 
  40 | test('fit commands update viewport and are available from command registry', async ({ page }) => {
  41 |   const commandIds = await page.evaluate(() => DiagramWeave.commands.listCommands().map(item => item.id));
> 42 |   expect(commandIds).toEqual(expect.arrayContaining(['view.fitAll', 'view.fitSelection', 'view.resetZoom', 'view.outline']));
     |                      ^ Error: expect(received).toEqual(expected) // deep equality
  43 | 
  44 |   await page.evaluate(() => { state.zoom = 2; state.panX = 500; state.panY = 400; updateTransform(); });
  45 |   await page.getByRole('button', { name: /100%/ }).click();
  46 |   expect(await page.evaluate(() => state.zoom)).toBe(1);
  47 | 
  48 |   await page.evaluate(() => selectNode('nav-c'));
  49 |   await page.locator('.canvas-nav-toolbar button').nth(1).click();
  50 |   expect(await page.evaluate(() => state.zoom)).toBeGreaterThan(1);
  51 |   await page.locator('.canvas-nav-toolbar button').first().click();
  52 |   expect(await page.evaluate(() => state.zoom)).toBeLessThanOrEqual(1.5);
  53 | });
  54 | 
  55 | test('six alignment modes and two distribution modes operate on multi-selection', async ({ page }) => {
  56 |   await page.evaluate(() => {
  57 |     selectNode('nav-a'); selectNode('nav-b', true); selectNode('nav-c', true);
  58 |   });
  59 |   await expect(page.locator('.node.selected')).toHaveCount(3);
  60 | 
  61 |   for (const mode of ['left', 'center', 'right', 'top', 'middle', 'bottom']) {
  62 |     await page.locator('#alignNodesSelect').selectOption(mode);
  63 |     const values = await page.evaluate(selectedMode => state.nodes.map(node => {
  64 |       if (selectedMode === 'left') return node.x;
  65 |       if (selectedMode === 'center') return node.x + node.w / 2;
  66 |       if (selectedMode === 'right') return node.x + node.w;
  67 |       if (selectedMode === 'top') return node.y;
  68 |       if (selectedMode === 'middle') return node.y + node.h / 2;
  69 |       return node.y + node.h;
  70 |     }), mode);
  71 |     expect(new Set(values).size).toBe(1);
  72 |   }
  73 | 
  74 |   await page.evaluate(nodes => { state.nodes.forEach((node, index) => Object.assign(node, nodes[index])); renderAll(); }, seedNodes);
  75 |   await page.locator('#distributeNodesSelect').selectOption('horizontal');
  76 |   const horizontal = await page.evaluate(() => state.nodes.map(node => node.x + node.w / 2).sort((a, b) => a - b));
  77 |   expect(horizontal[1] - horizontal[0]).toBeCloseTo(horizontal[2] - horizontal[1]);
  78 |   await page.locator('#distributeNodesSelect').selectOption('vertical');
  79 |   const vertical = await page.evaluate(() => state.nodes.map(node => node.y + node.h / 2).sort((a, b) => a - b));
  80 |   expect(vertical[1] - vertical[0]).toBeCloseTo(vertical[2] - vertical[1]);
  81 | });
  82 | 
  83 | test('tablet canvas navigation controls meet 44px touch target', async ({ page }) => {
  84 |   await page.setViewportSize({ width: 768, height: 1024 });
  85 |   const controls = page.locator('.canvas-nav-toolbar button, .canvas-nav-toolbar select');
  86 |   await expect(controls.first()).toBeVisible();
  87 |   const boxes = await controls.evaluateAll(items => items.map(item => item.getBoundingClientRect().height));
  88 |   expect(boxes.every(height => height >= 44)).toBe(true);
  89 | });
  90 | 
```
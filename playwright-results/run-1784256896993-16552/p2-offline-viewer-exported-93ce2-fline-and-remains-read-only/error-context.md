# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-offline-viewer.spec.js >> exported single-file viewer works offline and remains read-only
- Location: tests\e2e\p2-offline-viewer.spec.js:4:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('button', { name: /save|import|edit|ai/i })
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for getByRole('button', { name: /save|import|edit|ai/i })
    14 × locator resolved to 1 element
       - unexpected value "1"

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
    - generic "Viewer QA" [ref=e55]
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
    - generic [ref=e93]:
      - button "Main" [ref=e94] [cursor=pointer]
      - button "Delete page" [ref=e95] [cursor=pointer]: ×
    - generic [ref=e96]:
      - button "Details" [ref=e97] [cursor=pointer]
      - button "Delete page" [ref=e98] [cursor=pointer]: ×
    - button "+" [ref=e99] [cursor=pointer]
    - button "⧉" [ref=e100] [cursor=pointer]
  - generic [ref=e101]:
    - generic [ref=e102]:
      - button "Templates" [ref=e103] [cursor=pointer]:
        - img [ref=e104]
        - generic [ref=e109]: Templates
      - generic [ref=e110]: Shapes
      - searchbox "搜索图形" [ref=e112]
      - generic [ref=e113]:
        - button "Basic shapes ▾" [expanded] [ref=e114] [cursor=pointer]
        - generic [ref=e115]:
          - group "流程" [ref=e116]:
            - img [ref=e117]
            - generic [ref=e119]: Process
            - button "Favorite 流程" [ref=e120] [cursor=pointer]: ☆
          - group "子流程" [ref=e121]:
            - img [ref=e122]
            - generic [ref=e124]: Subprocess
            - button "Favorite 子流程" [ref=e125] [cursor=pointer]: ☆
          - group "判断" [ref=e126]:
            - img [ref=e127]
            - generic [ref=e129]: Decision
            - button "Favorite 判断" [ref=e130] [cursor=pointer]: ☆
          - group "开始/结束" [ref=e131]:
            - img [ref=e132]
            - generic [ref=e134]: Start/End
            - button "Favorite 开始/结束" [ref=e135] [cursor=pointer]: ☆
          - group "连接点" [ref=e136]:
            - img [ref=e137]
            - generic [ref=e139]: Connector
            - button "Favorite 连接点" [ref=e140] [cursor=pointer]: ☆
          - group "数据" [ref=e141]:
            - img [ref=e142]
            - generic [ref=e145]: Database
            - button "Favorite 数据" [ref=e146] [cursor=pointer]: ☆
          - group "输入/输出" [ref=e147]:
            - img [ref=e148]
            - generic [ref=e150]: Input/Output
            - button "Favorite 输入/输出" [ref=e151] [cursor=pointer]: ☆
          - group "文档" [ref=e152]:
            - img [ref=e153]
            - generic [ref=e155]: Document
            - button "Favorite 文档" [ref=e156] [cursor=pointer]: ☆
          - group "准备" [ref=e157]:
            - img [ref=e158]
            - generic [ref=e160]: Preparation
            - button "Favorite 准备" [ref=e161] [cursor=pointer]: ☆
          - group "合并" [ref=e162]:
            - img [ref=e163]
            - generic [ref=e165]: Merge
            - button "Favorite 合并" [ref=e166] [cursor=pointer]: ☆
          - group "延迟" [ref=e167]:
            - img [ref=e168]
            - generic [ref=e170]: Delay
            - button "Favorite 延迟" [ref=e171] [cursor=pointer]: ☆
          - group "显示" [ref=e172]:
            - img [ref=e173]
            - generic [ref=e176]: Display
            - button "Favorite 显示" [ref=e177] [cursor=pointer]: ☆
          - group "手动操作" [ref=e178]:
            - img [ref=e179]
            - generic [ref=e181]: Manual
            - button "Favorite 手动操作" [ref=e182] [cursor=pointer]: ☆
          - group "排序" [ref=e183]:
            - img [ref=e184]
            - generic [ref=e186]: Sort
            - button "Favorite 排序" [ref=e187] [cursor=pointer]: ☆
          - group "或" [ref=e188]:
            - img [ref=e189]
            - generic [ref=e191]: Or
            - button "Favorite 或" [ref=e192] [cursor=pointer]: ☆
          - group "存储" [ref=e193]:
            - img [ref=e194]
            - generic [ref=e196]: Storage
            - button "Favorite 存储" [ref=e197] [cursor=pointer]: ☆
          - group "多文档" [ref=e198]:
            - img [ref=e199]
            - generic [ref=e202]: Multi-document
            - button "Favorite 多文档" [ref=e203] [cursor=pointer]: ☆
          - group "内部存储" [ref=e204]:
            - img [ref=e205]
            - generic [ref=e207]: Internal storage
            - button "Favorite 内部存储" [ref=e208] [cursor=pointer]: ☆
          - group "离线存储" [ref=e209]:
            - img [ref=e210]
            - generic [ref=e213]: Offline storage
            - button "Favorite 离线存储" [ref=e214] [cursor=pointer]: ☆
          - group "注释" [ref=e215]:
            - img [ref=e216]
            - generic [ref=e218]: Annotation
            - button "Favorite 注释" [ref=e219] [cursor=pointer]: ☆
      - generic [ref=e220]:
        - button "Extended shapes ▾" [expanded] [ref=e221] [cursor=pointer]
        - generic [ref=e222]:
          - group "云服务" [ref=e223]:
            - img [ref=e224]
            - generic [ref=e226]: Cloud
            - button "Favorite 云服务" [ref=e227] [cursor=pointer]: ☆
          - group "角色" [ref=e228]:
            - img [ref=e229]
            - generic [ref=e232]: Actor
            - button "Favorite 角色" [ref=e233] [cursor=pointer]: ☆
          - group "便签" [ref=e234]:
            - img [ref=e235]
            - generic [ref=e237]: Note
            - button "Favorite 便签" [ref=e238] [cursor=pointer]: ☆
          - group "跨页" [ref=e239]:
            - img [ref=e240]
            - generic [ref=e242]: Off-page
            - button "Favorite 跨页" [ref=e243] [cursor=pointer]: ☆
          - group "子流程框" [ref=e244]:
            - img [ref=e245]
            - generic [ref=e248]: Subprocess frame
            - button "Favorite 子流程框" [ref=e249] [cursor=pointer]: ☆
          - group "交叉" [ref=e250]:
            - img [ref=e251]
            - generic [ref=e252]: Cross
            - button "Favorite 交叉" [ref=e253] [cursor=pointer]: ☆
          - group "开始" [ref=e254]:
            - img [ref=e255]
            - generic [ref=e257]: Start
            - button "Favorite 开始" [ref=e258] [cursor=pointer]: ☆
          - group "结束" [ref=e259]:
            - img [ref=e260]
            - generic [ref=e262]: End
            - button "Favorite 结束" [ref=e263] [cursor=pointer]: ☆
          - group "卡片" [ref=e264]:
            - img [ref=e265]
            - generic [ref=e267]: Card
            - button "Favorite 卡片" [ref=e268] [cursor=pointer]: ☆
          - group "求和" [ref=e269]:
            - img [ref=e270]
            - generic [ref=e272]: Summing
            - button "Favorite 求和" [ref=e273] [cursor=pointer]: ☆
      - generic [ref=e274]:
        - button "Remote icons ▾" [expanded] [ref=e275] [cursor=pointer]
        - generic [ref=e276]:
          - group "Webhook" [ref=e277]:
            - img [ref=e278]
            - generic [ref=e281]: Webhook
            - button "Favorite Webhook" [ref=e282] [cursor=pointer]: ☆
          - group "消息队列" [ref=e283]:
            - img [ref=e284]
            - generic [ref=e287]: 消息队列
            - button "Favorite 消息队列" [ref=e288] [cursor=pointer]: ☆
      - generic [ref=e289]:
        - generic [ref=e290]: Layers
        - generic [ref=e291]:
          - generic [ref=e292] [cursor=pointer]:
            - button "👁" [ref=e293]
            - generic [ref=e294]: Core
            - button "🔓" [ref=e295]
            - button "Delete layer" [ref=e296]: ×
          - generic [ref=e297] [cursor=pointer]:
            - button "👁" [ref=e298]
            - generic [ref=e299]: Optional
            - button "🔓" [ref=e300]
            - button "Delete layer" [ref=e301]: ×
          - button "+ New layer" [ref=e302] [cursor=pointer]
      - generic [ref=e304]:
        - generic [ref=e305]: T Text editor
        - generic [ref=e306]: Double-click Edit label
        - generic [ref=e307]: Delete Delete selection
        - generic [ref=e308]: Ctrl+Z Undo
    - generic [ref=e309]:
      - generic "画布导航" [ref=e310]:
        - button "适应全部" [ref=e311] [cursor=pointer]: ⌗
        - button "适应选区" [ref=e312] [cursor=pointer]: ▣
        - button "缩放至 100%" [ref=e313] [cursor=pointer]: 100%
        - button "打开节点大纲" [ref=e314] [cursor=pointer]: ☷
        - combobox "对齐所选节点" [ref=e315] [cursor=pointer]:
          - option "对齐" [selected]
          - option "左对齐"
          - option "水平居中"
          - option "右对齐"
          - option "顶部对齐"
          - option "垂直居中"
          - option "底部对齐"
        - combobox "等距分布所选节点" [ref=e316] [cursor=pointer]:
          - option "分布" [selected]
          - option "水平等距"
          - option "垂直等距"
      - generic "画布小地图" [ref=e317]
      - generic [ref=e318]:
        - generic:
          - img
          - generic [ref=e320]:
            - generic [ref=e321]:
              - generic: Start
            - generic: → 2.Go details
          - generic [ref=e322]:
            - generic [ref=e323]:
              - img
              - generic: Go details
            - generic: → Details
      - generic [ref=e324]:
        - generic [ref=e325]: V Select
        - generic [ref=e326]: L Connect
        - generic [ref=e327]: Click connection to edit
        - generic [ref=e328]: Wheel Zoom
        - generic [ref=e329]: Hold Space to pan canvas
    - generic [ref=e330]:
      - generic [ref=e331]: Properties
      - generic [ref=e333]:
        - generic [ref=e334]: Page info
        - generic [ref=e335]:
          - generic [ref=e336]: Page name
          - textbox "Page name" [ref=e337]: Main
        - paragraph [ref=e338]: JSON save / image export uses the current page name as the default filename.
        - generic [ref=e339]:
          - generic [ref=e340]: Scale
          - generic [ref=e341]: 共 2 页 · 当前页 2 个图形
        - generic [ref=e342]:
          - generic [ref=e343]: Total duration
          - generic [ref=e344]: 0 天
        - generic [ref=e345]:
          - generic [ref=e346]: Critical path
          - generic [ref=e347]: 2 个节点 · 0 天
        - generic [ref=e348]:
          - generic [ref=e349]: Step count
          - generic [ref=e350]: 2 步
        - button "Delete current page" [ref=e352] [cursor=pointer]
  - generic [ref=e353]:
    - generic [ref=e354]:
      - generic [ref=e355]: 表格编辑
      - paragraph [ref=e356]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e357] [cursor=pointer]: 说明
      - generic [ref=e358]:
        - button "从画布同步到表格" [ref=e359] [cursor=pointer]:
          - img [ref=e360]
        - button "将表格内容应用到画布" [ref=e363] [cursor=pointer]:
          - img [ref=e364]
        - button "关闭表格编辑" [ref=e366] [cursor=pointer]:
          - img [ref=e367]
    - generic:
      - generic [ref=e370]:
        - generic [ref=e371]:
          - button "编辑各步骤节点" [ref=e372] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e373] [cursor=pointer]: 连线表
        - generic [ref=e374]:
          - button "在表格末尾添加一行空节点" [ref=e375] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e376] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e377]:
          - rowgroup [ref=e378]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e379] [cursor=pointer]:
              - columnheader "编号" [ref=e380]
              - columnheader "简介" [ref=e381]
              - columnheader "去向" [ref=e382]
              - columnheader "角色" [ref=e383]
              - columnheader "图形" [ref=e384]
              - columnheader "详细说明" [ref=e385]
              - columnheader "耗时天" [ref=e386]
              - columnheader "泳道" [ref=e387]
              - columnheader "图层" [ref=e388]
              - columnheader "目标页" [ref=e389]
          - rowgroup
    - generic [ref=e390]:
      - strong [ref=e391]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e392]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e393]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e394]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e395]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e396]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
  - tooltip
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { readFile } from 'node:fs/promises';
  3  | 
  4  | test('exported single-file viewer works offline and remains read-only', async ({ page, context }) => {
  5  |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
  6  |   await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveOfflineViewer);
  7  |   await page.evaluate(() => loadFlowDocumentPayload({ version: 2, projectName: 'Viewer QA', currentPageId: 'p1', pages: [
  8  |     { id: 'p1', name: 'Main', layers: [{ id: 0, name: 'Core', visible: true }, { id: 1, name: 'Optional', visible: true }], nodes: [
  9  |       { id: 'start', label: 'Start', x: 20, y: 30, w: 120, h: 60, role: 'Ops', tags: ['SLA'], layer: 0 },
  10 |       { id: 'jump', label: 'Go details', shape: 'offpage', x: 240, y: 30, w: 130, h: 60, targetPageId: 'p2', layer: 1 },
  11 |     ], connections: [{ id: 'c1', from: 'start', to: 'jump' }] },
  12 |     { id: 'p2', name: 'Details', layers: [{ id: 0, name: 'Core', visible: true }], nodes: [{ id: 'done', label: 'Done', x: 50, y: 50, w: 120, h: 60, tags: ['Final'] }], connections: [] },
  13 |   ] }));
  14 |   await page.evaluate(() => showExportDialog()); const downloadPromise = page.waitForEvent('download');
  15 |   await page.getByRole('button', { name: 'HTML Viewer' }).click(); const download = await downloadPromise;
  16 |   expect(download.suggestedFilename()).toMatch(/\.viewer\.html$/); const html = await readFile(await download.path(), 'utf8');
  17 |   expect(html).not.toMatch(/<script[^>]+src=/); expect(html).not.toMatch(/<link[^>]+href=/);
  18 |   await context.setOffline(true); const viewer = await context.newPage(); await viewer.setContent(html, { waitUntil: 'domcontentloaded' });
  19 |   await expect(viewer.getByText('Read only')).toBeVisible(); await expect(viewer.locator('.node')).toHaveCount(2); await expect(viewer.getByText('SLA', { exact: true })).toBeVisible();
  20 |   await viewer.locator('#search').fill('SLA'); await expect(viewer.locator('#results')).toContainText('Start');
  21 |   await viewer.getByText('Go details', { exact: true }).click(); await expect(viewer.locator('#pageSelect')).toHaveValue('p2'); await expect(viewer.getByText('Done', { exact: true })).toBeVisible();
  22 |   await viewer.locator('#pageSelect').selectOption('p1'); await viewer.locator('#next').click(); await expect(viewer.locator('[data-node-id="start"]')).toHaveClass(/active/);
  23 |   await viewer.locator('#next').click(); await expect(viewer.locator('[data-node-id="jump"]')).toHaveClass(/active/);
  24 |   await expect(viewer.locator('[contenteditable], input[type="file"]')).toHaveCount(0);
> 25 |   await expect(viewer.getByRole('button', { name: /save|import|edit|ai/i })).toHaveCount(0);
     |                                                                              ^ Error: expect(locator).toHaveCount(expected) failed
  26 | });
  27 | 
```
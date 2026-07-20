# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-quality-checker.spec.js >> reports deterministic bilingual issues and applies only a non-destructive label fix
- Location: tests\e2e\p2-quality-checker.spec.js:23:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.quality-issue-row').filter({ hasText: 'node:blank' })
Expected substring: "Node has no label"
Error: strict mode violation: locator('.quality-issue-row').filter({ hasText: 'node:blank' }) resolved to 2 elements:
    1) <div data-issue-index="5" class="quality-issue-row">…</div> aka getByText('warningNode is')
    2) <div data-issue-index="6" class="quality-issue-row">…</div> aka getByText('warningNode has no')

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('.quality-issue-row').filter({ hasText: 'node:blank' })

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
    - button "Connection rules" [ref=e45] [cursor=pointer]: Rules
    - button "Local version history" [ref=e46] [cursor=pointer]: History
    - button "Process quality checker" [ref=e47] [cursor=pointer]: Check
    - button "Delete selection (Delete)" [ref=e49] [cursor=pointer]:
      - img [ref=e50]
    - button "Clear canvas" [ref=e52] [cursor=pointer]:
      - img [ref=e53]
    - generic "Untitled Project" [ref=e58]
    - button "Presentation mode" [ref=e59] [cursor=pointer]:
      - img [ref=e60]
    - generic [ref=e63]:
      - button "Zoom out" [ref=e64] [cursor=pointer]: −
      - generic [ref=e65]: 100%
      - button "Zoom in" [ref=e66] [cursor=pointer]: +
      - button "Reset zoom 100%" [ref=e67] [cursor=pointer]:
        - img [ref=e68]
    - button "Download PNG / SVG / PDF" [ref=e72] [cursor=pointer]:
      - img [ref=e73]
    - button "Save project (.diagramweave.json)" [ref=e76] [cursor=pointer]:
      - img [ref=e77]
    - button "Load project" [ref=e81] [cursor=pointer]:
      - img [ref=e82]
    - button "Excel template & import" [ref=e85] [cursor=pointer]:
      - img [ref=e86]
    - combobox "Language" [ref=e90] [cursor=pointer]:
      - option "中文"
      - option "EN" [selected]
    - button "Settings & updates" [ref=e91] [cursor=pointer]:
      - img [ref=e92]
  - generic [ref=e95]:
    - button "Page 1" [ref=e97] [cursor=pointer]
    - button "+" [ref=e98] [cursor=pointer]
    - button "⧉" [ref=e99] [cursor=pointer]
  - generic [ref=e100]:
    - generic [ref=e101]:
      - button "Templates" [ref=e102] [cursor=pointer]:
        - img [ref=e103]
        - generic [ref=e108]: Templates
      - generic [ref=e109]: Shapes
      - searchbox "搜索图形" [ref=e111]
      - generic [ref=e112]:
        - button "Basic shapes ▾" [expanded] [ref=e113] [cursor=pointer]
        - generic [ref=e114]:
          - group "流程" [ref=e115]:
            - img [ref=e116]
            - generic [ref=e118]: Process
            - button "Favorite 流程" [ref=e119] [cursor=pointer]: ☆
          - group "子流程" [ref=e120]:
            - img [ref=e121]
            - generic [ref=e123]: Subprocess
            - button "Favorite 子流程" [ref=e124] [cursor=pointer]: ☆
          - group "判断" [ref=e125]:
            - img [ref=e126]
            - generic [ref=e128]: Decision
            - button "Favorite 判断" [ref=e129] [cursor=pointer]: ☆
          - group "开始/结束" [ref=e130]:
            - img [ref=e131]
            - generic [ref=e133]: Start/End
            - button "Favorite 开始/结束" [ref=e134] [cursor=pointer]: ☆
          - group "连接点" [ref=e135]:
            - img [ref=e136]
            - generic [ref=e138]: Connector
            - button "Favorite 连接点" [ref=e139] [cursor=pointer]: ☆
          - group "数据" [ref=e140]:
            - img [ref=e141]
            - generic [ref=e144]: Database
            - button "Favorite 数据" [ref=e145] [cursor=pointer]: ☆
          - group "输入/输出" [ref=e146]:
            - img [ref=e147]
            - generic [ref=e149]: Input/Output
            - button "Favorite 输入/输出" [ref=e150] [cursor=pointer]: ☆
          - group "文档" [ref=e151]:
            - img [ref=e152]
            - generic [ref=e154]: Document
            - button "Favorite 文档" [ref=e155] [cursor=pointer]: ☆
          - group "准备" [ref=e156]:
            - img [ref=e157]
            - generic [ref=e159]: Preparation
            - button "Favorite 准备" [ref=e160] [cursor=pointer]: ☆
          - group "合并" [ref=e161]:
            - img [ref=e162]
            - generic [ref=e164]: Merge
            - button "Favorite 合并" [ref=e165] [cursor=pointer]: ☆
          - group "延迟" [ref=e166]:
            - img [ref=e167]
            - generic [ref=e169]: Delay
            - button "Favorite 延迟" [ref=e170] [cursor=pointer]: ☆
          - group "显示" [ref=e171]:
            - img [ref=e172]
            - generic [ref=e175]: Display
            - button "Favorite 显示" [ref=e176] [cursor=pointer]: ☆
          - group "手动操作" [ref=e177]:
            - img [ref=e178]
            - generic [ref=e180]: Manual
            - button "Favorite 手动操作" [ref=e181] [cursor=pointer]: ☆
          - group "排序" [ref=e182]:
            - img [ref=e183]
            - generic [ref=e185]: Sort
            - button "Favorite 排序" [ref=e186] [cursor=pointer]: ☆
          - group "或" [ref=e187]:
            - img [ref=e188]
            - generic [ref=e190]: Or
            - button "Favorite 或" [ref=e191] [cursor=pointer]: ☆
          - group "存储" [ref=e192]:
            - img [ref=e193]
            - generic [ref=e195]: Storage
            - button "Favorite 存储" [ref=e196] [cursor=pointer]: ☆
          - group "多文档" [ref=e197]:
            - img [ref=e198]
            - generic [ref=e201]: Multi-document
            - button "Favorite 多文档" [ref=e202] [cursor=pointer]: ☆
          - group "内部存储" [ref=e203]:
            - img [ref=e204]
            - generic [ref=e206]: Internal storage
            - button "Favorite 内部存储" [ref=e207] [cursor=pointer]: ☆
          - group "离线存储" [ref=e208]:
            - img [ref=e209]
            - generic [ref=e212]: Offline storage
            - button "Favorite 离线存储" [ref=e213] [cursor=pointer]: ☆
          - group "注释" [ref=e214]:
            - img [ref=e215]
            - generic [ref=e217]: Annotation
            - button "Favorite 注释" [ref=e218] [cursor=pointer]: ☆
      - generic [ref=e219]:
        - button "Extended shapes ▾" [expanded] [ref=e220] [cursor=pointer]
        - generic [ref=e221]:
          - group "云服务" [ref=e222]:
            - img [ref=e223]
            - generic [ref=e225]: Cloud
            - button "Favorite 云服务" [ref=e226] [cursor=pointer]: ☆
          - group "角色" [ref=e227]:
            - img [ref=e228]
            - generic [ref=e231]: Actor
            - button "Favorite 角色" [ref=e232] [cursor=pointer]: ☆
          - group "便签" [ref=e233]:
            - img [ref=e234]
            - generic [ref=e236]: Note
            - button "Favorite 便签" [ref=e237] [cursor=pointer]: ☆
          - group "跨页" [ref=e238]:
            - img [ref=e239]
            - generic [ref=e241]: Off-page
            - button "Favorite 跨页" [ref=e242] [cursor=pointer]: ☆
          - group "子流程框" [ref=e243]:
            - img [ref=e244]
            - generic [ref=e247]: Subprocess frame
            - button "Favorite 子流程框" [ref=e248] [cursor=pointer]: ☆
          - group "交叉" [ref=e249]:
            - img [ref=e250]
            - generic [ref=e251]: Cross
            - button "Favorite 交叉" [ref=e252] [cursor=pointer]: ☆
          - group "开始" [ref=e253]:
            - img [ref=e254]
            - generic [ref=e256]: Start
            - button "Favorite 开始" [ref=e257] [cursor=pointer]: ☆
          - group "结束" [ref=e258]:
            - img [ref=e259]
            - generic [ref=e261]: End
            - button "Favorite 结束" [ref=e262] [cursor=pointer]: ☆
          - group "卡片" [ref=e263]:
            - img [ref=e264]
            - generic [ref=e266]: Card
            - button "Favorite 卡片" [ref=e267] [cursor=pointer]: ☆
          - group "求和" [ref=e268]:
            - img [ref=e269]
            - generic [ref=e271]: Summing
            - button "Favorite 求和" [ref=e272] [cursor=pointer]: ☆
      - generic [ref=e273]:
        - button "Remote icons ▾" [expanded] [ref=e274] [cursor=pointer]
        - generic [ref=e275]:
          - group "Webhook" [ref=e276]:
            - img [ref=e277]
            - generic [ref=e280]: Webhook
            - button "Favorite Webhook" [ref=e281] [cursor=pointer]: ☆
          - group "消息队列" [ref=e282]:
            - img [ref=e283]
            - generic [ref=e286]: 消息队列
            - button "Favorite 消息队列" [ref=e287] [cursor=pointer]: ☆
      - generic [ref=e288]:
        - generic [ref=e289]: Layers
        - generic [ref=e290]:
          - generic [ref=e291] [cursor=pointer]:
            - button "👁" [ref=e292]
            - generic [ref=e293]: Layer 1
            - button "🔓" [ref=e294]
          - button "+ New layer" [ref=e295] [cursor=pointer]
      - generic [ref=e297]:
        - generic [ref=e298]: T Text editor
        - generic [ref=e299]: Double-click Edit label
        - generic [ref=e300]: Delete Delete selection
        - generic [ref=e301]: Ctrl+Z Undo
    - generic [ref=e302]:
      - generic "画布导航" [ref=e303]:
        - button "适应全部" [ref=e304] [cursor=pointer]: ⌗
        - button "适应选区" [ref=e305] [cursor=pointer]: ▣
        - button "缩放至 100%" [ref=e306] [cursor=pointer]: 100%
        - button "打开节点大纲" [ref=e307] [cursor=pointer]: ☷
        - combobox "对齐所选节点" [ref=e308] [cursor=pointer]:
          - option "对齐" [selected]
          - option "左对齐"
          - option "水平居中"
          - option "右对齐"
          - option "顶部对齐"
          - option "垂直居中"
          - option "底部对齐"
        - combobox "等距分布所选节点" [ref=e309] [cursor=pointer]:
          - option "分布" [selected]
          - option "水平等距"
          - option "垂直等距"
      - generic "画布小地图" [ref=e310]
      - generic [ref=e311]:
        - generic:
          - img
          - generic [ref=e312]:
            - generic [ref=e313]:
              - generic: Start
            - generic: → 2.Task；2.Task
          - generic [ref=e315]:
            - generic: Task
      - generic [ref=e318]:
        - generic [ref=e319]: V Select
        - generic [ref=e320]: L Connect
        - generic [ref=e321]: Click connection to edit
        - generic [ref=e322]: Wheel Zoom
        - generic [ref=e323]: Hold Space to pan canvas
    - generic [ref=e324]:
      - generic [ref=e325]: Properties
      - generic [ref=e327]:
        - generic [ref=e328]: Page info
        - generic [ref=e329]:
          - generic [ref=e330]: Page name
          - textbox "Page name" [ref=e331]: Main
        - paragraph [ref=e332]: JSON save / image export uses the current page name as the default filename.
        - generic [ref=e333]:
          - generic [ref=e334]: Scale
          - generic [ref=e335]: 共 2 页 · 当前页 3 个图形
        - generic [ref=e336]:
          - generic [ref=e337]: Total duration
          - generic [ref=e338]: 0 天
        - generic [ref=e339]:
          - generic [ref=e340]: Critical path
          - generic [ref=e341]: 2 个节点 · 0 天
        - generic [ref=e342]:
          - generic [ref=e343]: Step count
          - generic [ref=e344]: 2 步
        - button "Delete current page" [ref=e346] [cursor=pointer]
  - dialog "Process Quality / 流程质量" [ref=e348]:
    - button "Close quality checker" [ref=e349] [cursor=pointer]: ×
    - generic [ref=e350]: Process Quality / 流程质量
    - generic [ref=e351]: 7 issues · 3 errors · 3 warnings · 1 info
    - generic [ref=e352]:
      - generic [ref=e353]:
        - generic [ref=e354]: error
        - generic [ref=e355]:
          - strong [ref=e356]: Connection references a missing node
          - generic [ref=e357]: broken-reference · connection:broken
        - button "Locate" [ref=e358]
      - generic [ref=e359]:
        - generic [ref=e360]: error
        - generic [ref=e361]:
          - strong [ref=e362]: Page has no process start that can reach this node
          - generic [ref=e363]: unreachable-node · node:cycleA
        - button "Locate" [ref=e364]
      - generic [ref=e365]:
        - generic [ref=e366]: error
        - generic [ref=e367]:
          - strong [ref=e368]: Page has no process start that can reach this node
          - generic [ref=e369]: unreachable-node · node:cycleB
        - button "Locate" [ref=e370]
      - generic [ref=e371]:
        - generic [ref=e372]: info
        - generic [ref=e373]:
          - strong [ref=e374]: Flow stops at a non-end node
          - generic [ref=e375]: dead-end · node:task
        - button "Locate" [ref=e376]
      - generic [ref=e377]:
        - generic [ref=e378]: warning
        - generic [ref=e379]:
          - strong [ref=e380]: Duplicate connection detected
          - generic [ref=e381]: duplicate-connection · connection:c2
        - button "Locate" [ref=e382]
      - generic [ref=e383]:
        - generic [ref=e384]: warning
        - generic [ref=e385]:
          - strong [ref=e386]: Node is isolated
          - generic [ref=e387]: isolated-node · node:blank
        - button "Locate" [ref=e388]
      - generic [ref=e389]:
        - generic [ref=e390]: warning
        - generic [ref=e391]:
          - strong [ref=e392]: Node has no label
          - generic [ref=e393]: missing-label · node:blank
        - button "Locate" [ref=e394]
        - button "Fix" [ref=e395]
  - generic [ref=e396]:
    - generic [ref=e397]:
      - generic [ref=e398]: 表格编辑
      - paragraph [ref=e399]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e400] [cursor=pointer]: 说明
      - generic [ref=e401]:
        - button "从画布同步到表格" [ref=e402] [cursor=pointer]:
          - img [ref=e403]
        - button "将表格内容应用到画布" [ref=e406] [cursor=pointer]:
          - img [ref=e407]
        - button "关闭表格编辑" [ref=e409] [cursor=pointer]:
          - img [ref=e410]
    - generic:
      - generic [ref=e413]:
        - generic [ref=e414]:
          - button "编辑各步骤节点" [ref=e415] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e416] [cursor=pointer]: 连线表
        - generic [ref=e417]:
          - button "在表格末尾添加一行空节点" [ref=e418] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e419] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e420]:
          - rowgroup [ref=e421]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e422] [cursor=pointer]:
              - columnheader "编号" [ref=e423]
              - columnheader "简介" [ref=e424]
              - columnheader "去向" [ref=e425]
              - columnheader "角色" [ref=e426]
              - columnheader "图形" [ref=e427]
              - columnheader "详细说明" [ref=e428]
              - columnheader "耗时天" [ref=e429]
              - columnheader "泳道" [ref=e430]
              - columnheader "图层" [ref=e431]
              - columnheader "目标页" [ref=e432]
          - rowgroup
    - generic [ref=e433]:
      - strong [ref=e434]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e435]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e436]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e437]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e438]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e439]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
  - tooltip
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | async function prepare(page) {
  4  |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
  5  |   await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveContracts?.inspectQuality);
  6  |   await page.evaluate(() => {
  7  |     const n = (id, label, shape = 'rectangle') => ({ id, refId: id, shape, x: 80, y: 80, w: 120, h: 60, label, fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 });
  8  |     DiagramWeave.doc.pages = [
  9  |       { id: 'p1', name: 'Main', nodes: [n('start', 'Start', 'start'), n('task', 'Task'), n('blank', '')], connections: [
  10 |         { id: 'c1', from: 'start', to: 'task', fromPort: 'right', toPort: 'left', label: '' },
  11 |         { id: 'c2', from: 'start', to: 'task', fromPort: 'right', toPort: 'left', label: '' },
  12 |         { id: 'broken', from: 'task', to: 'missing', fromPort: 'right', toPort: 'left', label: '' },
  13 |       ], layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }], nextLayerId: 1 },
  14 |       { id: 'p2', name: 'Cycle', nodes: [n('cycleA', 'Cycle A'), n('cycleB', 'Cycle B')], connections: [
  15 |         { id: 'c3', from: 'cycleA', to: 'cycleB', fromPort: 'right', toPort: 'left', label: '' },
  16 |         { id: 'c4', from: 'cycleB', to: 'cycleA', fromPort: 'left', toPort: 'right', label: '' },
  17 |       ], layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }], nextLayerId: 1 },
  18 |     ];
  19 |     DiagramWeave.doc.currentPageId = 'p1'; DiagramWeave.syncStateFromPage(); clearCanvasNodes(); renderAll();
  20 |   });
  21 | }
  22 | 
  23 | test('reports deterministic bilingual issues and applies only a non-destructive label fix', async ({ page }) => {
  24 |   await prepare(page); const before = await page.evaluate(() => ({ nodes: DiagramWeave.doc.pages.reduce((n, p) => n + p.nodes.length, 0), connections: DiagramWeave.doc.pages.reduce((n, p) => n + p.connections.length, 0) }));
  25 |   await page.evaluate(() => showQualityChecker());
  26 |   for (const rule of ['broken-reference', 'missing-label', 'isolated-node', 'dead-end', 'duplicate-connection', 'unreachable-node']) await expect(page.locator('#qualityCheckerList')).toContainText(rule);
  27 |   const blankRow = page.locator('.quality-issue-row').filter({ hasText: 'node:blank' });
> 28 |   await expect(blankRow).toContainText('Node has no label'); await blankRow.getByRole('button', { name: 'Fix' }).click();
     |                          ^ Error: expect(locator).toContainText(expected) failed
  29 |   expect(await page.evaluate(() => DiagramWeave.doc.pages[0].nodes.find(node => node.id === 'blank').label)).toBe('rectangle');
  30 |   const after = await page.evaluate(() => ({ nodes: DiagramWeave.doc.pages.reduce((n, p) => n + p.nodes.length, 0), connections: DiagramWeave.doc.pages.reduce((n, p) => n + p.connections.length, 0) })); expect(after).toEqual(before);
  31 | });
  32 | 
  33 | test('locates an issue on another page without changing the report target', async ({ page }) => {
  34 |   await prepare(page); await page.evaluate(() => showQualityChecker());
  35 |   const row = page.locator('.quality-issue-row').filter({ hasText: 'node:cycleA' }).first(); await row.getByRole('button', { name: 'Locate' }).click();
  36 |   expect(await page.evaluate(() => DiagramWeave.doc.currentPageId)).toBe('p2'); expect(await page.evaluate(() => state.selectedNodeId)).toBe('cycleA');
  37 | });
  38 | 
```
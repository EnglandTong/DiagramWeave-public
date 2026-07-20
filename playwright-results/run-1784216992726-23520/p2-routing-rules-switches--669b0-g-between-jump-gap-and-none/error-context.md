# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-routing-rules.spec.js >> switches crossing bridge rendering between jump, gap, and none
- Location: tests\e2e\p2-routing-rules.spec.js:50:1

# Error details

```
Error: expect(locator).not.toHaveCount(expected) failed

Locator:  locator('.connection-bridge')
Expected: not 0
Received: 0
Timeout:  5000ms

Call log:
  - Expect "not toHaveCount" with timeout 5000ms
  - waiting for locator('.connection-bridge')
    10 × locator resolved to 0 elements
       - unexpected value "0"

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
    - button "Delete selection (Delete)" [ref=e47] [cursor=pointer]:
      - img [ref=e48]
    - button "Clear canvas" [ref=e50] [cursor=pointer]:
      - img [ref=e51]
    - generic "Untitled Project" [ref=e56]
    - button "Presentation mode" [ref=e57] [cursor=pointer]:
      - img [ref=e58]
    - generic [ref=e61]:
      - button "Zoom out" [ref=e62] [cursor=pointer]: −
      - generic [ref=e63]: 100%
      - button "Zoom in" [ref=e64] [cursor=pointer]: +
      - button "Reset zoom 100%" [ref=e65] [cursor=pointer]:
        - img [ref=e66]
    - button "Download PNG / SVG / PDF" [ref=e70] [cursor=pointer]:
      - img [ref=e71]
    - button "Save project (.diagramweave.json)" [ref=e74] [cursor=pointer]:
      - img [ref=e75]
    - button "Load project" [ref=e79] [cursor=pointer]:
      - img [ref=e80]
    - button "Excel template & import" [ref=e83] [cursor=pointer]:
      - img [ref=e84]
    - combobox "Language" [ref=e88] [cursor=pointer]:
      - option "中文"
      - option "EN" [selected]
    - button "Settings & updates" [ref=e89] [cursor=pointer]:
      - img [ref=e90]
  - generic [ref=e93]:
    - button "Page 1" [ref=e95] [cursor=pointer]
    - button "+" [ref=e96] [cursor=pointer]
    - button "⧉" [ref=e97] [cursor=pointer]
  - generic [ref=e98]:
    - generic [ref=e99]:
      - button "Templates" [ref=e100] [cursor=pointer]:
        - img [ref=e101]
        - generic [ref=e106]: Templates
      - generic [ref=e107]: Shapes
      - searchbox "搜索图形" [ref=e109]
      - generic [ref=e110]:
        - button "Basic shapes ▾" [expanded] [ref=e111] [cursor=pointer]
        - generic [ref=e112]:
          - group "流程" [ref=e113]:
            - img [ref=e114]
            - generic [ref=e116]: Process
            - button "Favorite 流程" [ref=e117] [cursor=pointer]: ☆
          - group "子流程" [ref=e118]:
            - img [ref=e119]
            - generic [ref=e121]: Subprocess
            - button "Favorite 子流程" [ref=e122] [cursor=pointer]: ☆
          - group "判断" [ref=e123]:
            - img [ref=e124]
            - generic [ref=e126]: Decision
            - button "Favorite 判断" [ref=e127] [cursor=pointer]: ☆
          - group "开始/结束" [ref=e128]:
            - img [ref=e129]
            - generic [ref=e131]: Start/End
            - button "Favorite 开始/结束" [ref=e132] [cursor=pointer]: ☆
          - group "连接点" [ref=e133]:
            - img [ref=e134]
            - generic [ref=e136]: Connector
            - button "Favorite 连接点" [ref=e137] [cursor=pointer]: ☆
          - group "数据" [ref=e138]:
            - img [ref=e139]
            - generic [ref=e142]: Database
            - button "Favorite 数据" [ref=e143] [cursor=pointer]: ☆
          - group "输入/输出" [ref=e144]:
            - img [ref=e145]
            - generic [ref=e147]: Input/Output
            - button "Favorite 输入/输出" [ref=e148] [cursor=pointer]: ☆
          - group "文档" [ref=e149]:
            - img [ref=e150]
            - generic [ref=e152]: Document
            - button "Favorite 文档" [ref=e153] [cursor=pointer]: ☆
          - group "准备" [ref=e154]:
            - img [ref=e155]
            - generic [ref=e157]: Preparation
            - button "Favorite 准备" [ref=e158] [cursor=pointer]: ☆
          - group "合并" [ref=e159]:
            - img [ref=e160]
            - generic [ref=e162]: Merge
            - button "Favorite 合并" [ref=e163] [cursor=pointer]: ☆
          - group "延迟" [ref=e164]:
            - img [ref=e165]
            - generic [ref=e167]: Delay
            - button "Favorite 延迟" [ref=e168] [cursor=pointer]: ☆
          - group "显示" [ref=e169]:
            - img [ref=e170]
            - generic [ref=e173]: Display
            - button "Favorite 显示" [ref=e174] [cursor=pointer]: ☆
          - group "手动操作" [ref=e175]:
            - img [ref=e176]
            - generic [ref=e178]: Manual
            - button "Favorite 手动操作" [ref=e179] [cursor=pointer]: ☆
          - group "排序" [ref=e180]:
            - img [ref=e181]
            - generic [ref=e183]: Sort
            - button "Favorite 排序" [ref=e184] [cursor=pointer]: ☆
          - group "或" [ref=e185]:
            - img [ref=e186]
            - generic [ref=e188]: Or
            - button "Favorite 或" [ref=e189] [cursor=pointer]: ☆
          - group "存储" [ref=e190]:
            - img [ref=e191]
            - generic [ref=e193]: Storage
            - button "Favorite 存储" [ref=e194] [cursor=pointer]: ☆
          - group "多文档" [ref=e195]:
            - img [ref=e196]
            - generic [ref=e199]: Multi-document
            - button "Favorite 多文档" [ref=e200] [cursor=pointer]: ☆
          - group "内部存储" [ref=e201]:
            - img [ref=e202]
            - generic [ref=e204]: Internal storage
            - button "Favorite 内部存储" [ref=e205] [cursor=pointer]: ☆
          - group "离线存储" [ref=e206]:
            - img [ref=e207]
            - generic [ref=e210]: Offline storage
            - button "Favorite 离线存储" [ref=e211] [cursor=pointer]: ☆
          - group "注释" [ref=e212]:
            - img [ref=e213]
            - generic [ref=e215]: Annotation
            - button "Favorite 注释" [ref=e216] [cursor=pointer]: ☆
      - generic [ref=e217]:
        - button "Extended shapes ▾" [expanded] [ref=e218] [cursor=pointer]
        - generic [ref=e219]:
          - group "云服务" [ref=e220]:
            - img [ref=e221]
            - generic [ref=e223]: Cloud
            - button "Favorite 云服务" [ref=e224] [cursor=pointer]: ☆
          - group "角色" [ref=e225]:
            - img [ref=e226]
            - generic [ref=e229]: Actor
            - button "Favorite 角色" [ref=e230] [cursor=pointer]: ☆
          - group "便签" [ref=e231]:
            - img [ref=e232]
            - generic [ref=e234]: Note
            - button "Favorite 便签" [ref=e235] [cursor=pointer]: ☆
          - group "跨页" [ref=e236]:
            - img [ref=e237]
            - generic [ref=e239]: Off-page
            - button "Favorite 跨页" [ref=e240] [cursor=pointer]: ☆
          - group "子流程框" [ref=e241]:
            - img [ref=e242]
            - generic [ref=e245]: Subprocess frame
            - button "Favorite 子流程框" [ref=e246] [cursor=pointer]: ☆
          - group "交叉" [ref=e247]:
            - img [ref=e248]
            - generic [ref=e249]: Cross
            - button "Favorite 交叉" [ref=e250] [cursor=pointer]: ☆
          - group "开始" [ref=e251]:
            - img [ref=e252]
            - generic [ref=e254]: Start
            - button "Favorite 开始" [ref=e255] [cursor=pointer]: ☆
          - group "结束" [ref=e256]:
            - img [ref=e257]
            - generic [ref=e259]: End
            - button "Favorite 结束" [ref=e260] [cursor=pointer]: ☆
          - group "卡片" [ref=e261]:
            - img [ref=e262]
            - generic [ref=e264]: Card
            - button "Favorite 卡片" [ref=e265] [cursor=pointer]: ☆
          - group "求和" [ref=e266]:
            - img [ref=e267]
            - generic [ref=e269]: Summing
            - button "Favorite 求和" [ref=e270] [cursor=pointer]: ☆
      - generic [ref=e271]:
        - button "Remote icons ▾" [expanded] [ref=e272] [cursor=pointer]
        - generic [ref=e273]:
          - group "Webhook" [ref=e274]:
            - img [ref=e275]
            - generic [ref=e278]: Webhook
            - button "Favorite Webhook" [ref=e279] [cursor=pointer]: ☆
          - group "消息队列" [ref=e280]:
            - img [ref=e281]
            - generic [ref=e284]: 消息队列
            - button "Favorite 消息队列" [ref=e285] [cursor=pointer]: ☆
      - generic [ref=e286]:
        - generic [ref=e287]: Layers
        - generic [ref=e288]:
          - generic [ref=e289] [cursor=pointer]:
            - button "👁" [ref=e290]
            - generic [ref=e291]: Layer 1
            - button "🔓" [ref=e292]
          - button "+ New layer" [ref=e293] [cursor=pointer]
      - generic [ref=e295]:
        - generic [ref=e296]: T Text editor
        - generic [ref=e297]: Double-click Edit label
        - generic [ref=e298]: Delete Delete selection
        - generic [ref=e299]: Ctrl+Z Undo
    - generic [ref=e300]:
      - generic "画布导航" [ref=e301]:
        - button "适应全部" [ref=e302] [cursor=pointer]: ⌗
        - button "适应选区" [ref=e303] [cursor=pointer]: ▣
        - button "缩放至 100%" [ref=e304] [cursor=pointer]: 100%
        - button "打开节点大纲" [ref=e305] [cursor=pointer]: ☷
        - combobox "对齐所选节点" [ref=e306] [cursor=pointer]:
          - option "对齐" [selected]
          - option "左对齐"
          - option "水平居中"
          - option "右对齐"
          - option "顶部对齐"
          - option "垂直居中"
          - option "底部对齐"
        - combobox "等距分布所选节点" [ref=e307] [cursor=pointer]:
          - option "分布" [selected]
          - option "水平等距"
          - option "垂直等距"
      - generic "画布小地图" [ref=e308]
      - generic [ref=e309]:
        - generic:
          - img:
            - generic [ref=e311]: First
            - generic [ref=e313]: Second
          - generic [ref=e314]:
            - generic [ref=e315]:
              - generic: A
            - generic: → 2.B（First）
          - generic [ref=e317]:
            - generic: B
          - generic [ref=e318]:
            - generic [ref=e319]:
              - generic: C
            - generic: → 4.D（Second）
          - generic [ref=e321]:
            - generic: D
          - generic "拖动改起点" [ref=e322]
          - generic "拖动改终点" [ref=e323]
      - generic [ref=e324]:
        - generic [ref=e325]: V Select
        - generic [ref=e326]: L Connect
        - generic [ref=e327]: Click connection to edit
        - generic [ref=e328]: Wheel Zoom
        - generic [ref=e329]: Hold Space to pan canvas
    - generic [ref=e330]:
      - generic [ref=e331]: Properties
      - generic [ref=e333]:
        - generic [ref=e334]: Connection
        - generic [ref=e335]:
          - generic [ref=e336]: From
          - combobox [ref=e337]:
            - option "1. A" [selected]
            - option "2. B"
            - option "3. C"
            - option "4. D"
        - generic [ref=e338]:
          - generic [ref=e339]: To
          - combobox [ref=e340]:
            - option "1. A"
            - option "2. B" [selected]
            - option "3. C"
            - option "4. D"
        - generic [ref=e341]:
          - generic [ref=e342]: Condition label
          - textbox "e.g. Yes / No" [ref=e343]: First
        - generic [ref=e344]:
          - generic [ref=e345]: Text position
          - combobox [ref=e346]:
            - option "Auto (right of vertical, above horizontal)" [selected]
            - option "Above line"
            - option "Right of line"
        - paragraph [ref=e347]: "Tip: double-click a connection or its label to edit; drag endpoint dots to reconnect."
  - dialog "Connection Rules / 连线规则" [ref=e349]:
    - button "Close connection rules" [ref=e350] [cursor=pointer]: ×
    - generic [ref=e351]: Connection Rules / 连线规则
    - generic [ref=e352]:
      - generic [ref=e353]:
        - generic [ref=e354]: Lock endpoint ports
        - checkbox "Lock endpoint ports" [checked] [ref=e355]
      - generic [ref=e356]:
        - generic [ref=e357]: Obstacle padding
        - spinbutton "Obstacle padding" [ref=e358]: "18"
      - generic [ref=e359]:
        - generic [ref=e360]: Bridge behavior
        - combobox "Bridge behavior" [ref=e361]:
          - option "Jump" [selected]
          - option "Gap"
          - option "None"
      - generic [ref=e362]:
        - generic [ref=e363]: Bridge size
        - spinbutton "Bridge size" [ref=e364]: "8"
      - generic [ref=e365]:
        - generic [ref=e366]: Default label
        - combobox "Default label" [ref=e367]:
          - option "Auto" [selected]
          - option "Above"
          - option "Right"
          - option "Custom"
    - generic [ref=e368]:
      - heading "Selected connection" [level=3] [ref=e369]
      - generic [ref=e370]:
        - generic [ref=e371]:
          - text: Label placement
          - combobox "Label placement" [ref=e372]:
            - option "Auto" [selected]
            - option "Above"
            - option "Right"
            - option "Custom"
        - generic [ref=e373]:
          - generic [ref=e374]:
            - text: X
            - spinbutton "X" [ref=e375]: "0"
          - generic [ref=e376]:
            - text: "Y"
            - spinbutton "Y" [ref=e377]: "-12"
        - button "Add waypoint" [ref=e378]
  - generic [ref=e379]:
    - generic [ref=e380]:
      - generic [ref=e381]: 表格编辑
      - paragraph [ref=e382]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e383] [cursor=pointer]: 说明
      - generic [ref=e384]:
        - button "从画布同步到表格" [ref=e385] [cursor=pointer]:
          - img [ref=e386]
        - button "将表格内容应用到画布" [ref=e389] [cursor=pointer]:
          - img [ref=e390]
        - button "关闭表格编辑" [ref=e392] [cursor=pointer]:
          - img [ref=e393]
    - generic:
      - generic [ref=e396]:
        - generic [ref=e397]:
          - button "编辑各步骤节点" [ref=e398] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e399] [cursor=pointer]: 连线表
        - generic [ref=e400]:
          - button "在表格末尾添加一行空节点" [ref=e401] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e402] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e403]:
          - rowgroup [ref=e404]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e405] [cursor=pointer]:
              - columnheader "编号" [ref=e406]
              - columnheader "简介" [ref=e407]
              - columnheader "去向" [ref=e408]
              - columnheader "角色" [ref=e409]
              - columnheader "图形" [ref=e410]
              - columnheader "详细说明" [ref=e411]
              - columnheader "耗时天" [ref=e412]
              - columnheader "泳道" [ref=e413]
              - columnheader "图层" [ref=e414]
              - columnheader "目标页" [ref=e415]
          - rowgroup
    - generic [ref=e416]:
      - strong [ref=e417]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e418]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e419]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e420]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e421]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e422]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
  - tooltip
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | async function prepare(page, crossing = false) {
  4  |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
  5  |   await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && window.DiagramWeaveRoutingRules);
  6  |   await page.evaluate(makeCrossing => {
  7  |     state.nodes = makeCrossing ? [
  8  |       { id: 'a', refId: 1, shape: 'rectangle', x: 80, y: 80, w: 100, h: 60, label: 'A', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  9  |       { id: 'b', refId: 2, shape: 'rectangle', x: 480, y: 320, w: 100, h: 60, label: 'B', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  10 |       { id: 'c', refId: 3, shape: 'rectangle', x: 480, y: 80, w: 100, h: 60, label: 'C', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  11 |       { id: 'd', refId: 4, shape: 'rectangle', x: 80, y: 320, w: 100, h: 60, label: 'D', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  12 |     ] : [
  13 |       { id: 'a', refId: 1, shape: 'rectangle', x: 80, y: 80, w: 100, h: 60, label: 'A', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  14 |       { id: 'b', refId: 2, shape: 'rectangle', x: 480, y: 280, w: 100, h: 60, label: 'B', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  15 |     ];
  16 |     state.connections = makeCrossing ? [
  17 |       { id: 'c1', from: 'a', fromPort: 'right', to: 'b', toPort: 'left', label: 'First' },
  18 |       { id: 'c2', from: 'c', fromPort: 'left', to: 'd', toPort: 'right', label: 'Second' },
  19 |     ] : [{ id: 'c1', from: 'a', fromPort: 'top', to: 'b', toPort: 'bottom', label: 'Route' }];
  20 |     state.nextId = 10; state.connRouteMode = 'straight'; state.selectedConnectionId = 'c1';
  21 |     const current = DiagramWeave.getCurrentPage(); current.nodes = state.nodes; current.connections = state.connections;
  22 |     clearCanvasNodes(); renderAll();
  23 |   }, crossing);
  24 | }
  25 | 
  26 | test('edits, locks, removes, and persists connection routing rules', async ({ page }) => {
  27 |   await prepare(page);
  28 |   await page.evaluate(() => showRoutingRulesPanel());
  29 |   await expect(page.locator('#routingEndpointLock')).toBeChecked();
  30 |   await page.locator('#routingObstaclePadding').fill('36'); await page.locator('#routingObstaclePadding').press('Enter');
  31 |   await page.locator('#routingConnLabel').selectOption('custom');
  32 |   await page.locator('#routingLabelOffsetX').fill('18'); await page.locator('#routingLabelOffsetX').press('Enter');
  33 |   await page.getByRole('button', { name: 'Add waypoint' }).click();
  34 |   await expect(page.locator('.routing-waypoint-row')).toHaveCount(1);
  35 |   await page.locator('.routing-waypoint-row input[type="number"]').first().fill('320');
  36 |   await page.locator('.routing-waypoint-row input[type="number"]').first().press('Enter');
  37 |   await page.locator('.routing-waypoint-row input[type="checkbox"]').check();
  38 |   await expect(page.locator('.routing-waypoint-row input[type="number"]').first()).toBeDisabled();
  39 |   expect(await page.evaluate(() => ({ ports: [state.connections[0].fromPort, state.connections[0].toPort], rules: state.routingRules, conn: state.connections[0] }))).toMatchObject({
  40 |     ports: ['top', 'bottom'], rules: { endpointLock: true, obstaclePadding: 36 }, conn: { labelPlacement: 'custom', waypoints: [{ x: 320, locked: true }] },
  41 |   });
  42 |   const payload = await page.evaluate(() => getFlowDocumentPayload());
  43 |   await page.evaluate(data => { resetToBlankProject(); loadFlowDocumentPayload(data); }, payload);
  44 |   expect(await page.evaluate(() => ({ rules: state.routingRules, conn: state.connections[0] }))).toMatchObject({ rules: { obstaclePadding: 36 }, conn: { waypoints: [{ x: 320, locked: true }], labelPlacement: 'custom' } });
  45 |   await page.evaluate(() => { state.selectedConnectionId = 'c1'; showRoutingRulesPanel(); });
  46 |   await page.getByRole('button', { name: 'Remove' }).click();
  47 |   expect(await page.evaluate(() => state.connections[0].waypoints.length)).toBe(0);
  48 | });
  49 | 
  50 | test('switches crossing bridge rendering between jump, gap, and none', async ({ page }) => {
  51 |   await prepare(page, true); await page.evaluate(() => showRoutingRulesPanel());
> 52 |   await expect(page.locator('.connection-bridge')).not.toHaveCount(0);
     |                                                        ^ Error: expect(locator).not.toHaveCount(expected) failed
  53 |   await page.locator('#routingBridgeBehavior').selectOption('gap');
  54 |   await expect(page.locator('.connection-bridge')).toHaveCount(0); await expect(page.locator('.connection-bridge-gap')).not.toHaveCount(0);
  55 |   await page.locator('#routingBridgeBehavior').selectOption('none');
  56 |   await expect(page.locator('.connection-bridge-gap')).toHaveCount(0);
  57 | });
  58 | 
```
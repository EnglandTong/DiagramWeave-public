# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-stencil-manager.spec.js >> imports, uses, disables, renames, and exports a local stencil pack
- Location: tests\e2e\p2-stencil-manager.spec.js:16:1

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.dblclick: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('.shape-item[data-shape="qa_queue"]')
    - locator resolved to <div role="group" tabindex="0" draggable="true" class="shape-item" data-shape="qa_queue" data-label="QA Queue" data-pack-id="qa_ops" aria-label="QA Queue" data-shape-bound="true" aria-keyshortcuts="Enter Space F">…</div>
  - attempting dblclick action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div aria-hidden="true" id="stencilManagerOverlay" class="confirm-overlay visible" onclick="if(event.target===this)hideStencilManager()">…</div> intercepts pointer events
    - retrying dblclick action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div aria-hidden="true" id="stencilManagerOverlay" class="confirm-overlay visible" onclick="if(event.target===this)hideStencilManager()">…</div> intercepts pointer events
    - retrying dblclick action
      - waiting 100ms
    218 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <div aria-hidden="true" id="stencilManagerOverlay" class="confirm-overlay visible" onclick="if(event.target===this)hideStencilManager()">…</div> intercepts pointer events
      - retrying dblclick action
        - waiting 500ms
    - waiting for element to be visible, enabled and stable

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
        - button "Basic shapes ▾" [expanded] [ref=e110] [cursor=pointer]
        - generic [ref=e111]:
          - group "流程" [ref=e112]:
            - img [ref=e113]
            - generic [ref=e115]: Process
            - button "Favorite 流程" [ref=e116] [cursor=pointer]: ☆
          - group "子流程" [ref=e117]:
            - img [ref=e118]
            - generic [ref=e120]: Subprocess
            - button "Favorite 子流程" [ref=e121] [cursor=pointer]: ☆
          - group "判断" [ref=e122]:
            - img [ref=e123]
            - generic [ref=e125]: Decision
            - button "Favorite 判断" [ref=e126] [cursor=pointer]: ☆
          - group "开始/结束" [ref=e127]:
            - img [ref=e128]
            - generic [ref=e130]: Start/End
            - button "Favorite 开始/结束" [ref=e131] [cursor=pointer]: ☆
          - group "连接点" [ref=e132]:
            - img [ref=e133]
            - generic [ref=e135]: Connector
            - button "Favorite 连接点" [ref=e136] [cursor=pointer]: ☆
          - group "数据" [ref=e137]:
            - img [ref=e138]
            - generic [ref=e141]: Database
            - button "Favorite 数据" [ref=e142] [cursor=pointer]: ☆
          - group "输入/输出" [ref=e143]:
            - img [ref=e144]
            - generic [ref=e146]: Input/Output
            - button "Favorite 输入/输出" [ref=e147] [cursor=pointer]: ☆
          - group "文档" [ref=e148]:
            - img [ref=e149]
            - generic [ref=e151]: Document
            - button "Favorite 文档" [ref=e152] [cursor=pointer]: ☆
          - group "准备" [ref=e153]:
            - img [ref=e154]
            - generic [ref=e156]: Preparation
            - button "Favorite 准备" [ref=e157] [cursor=pointer]: ☆
          - group "合并" [ref=e158]:
            - img [ref=e159]
            - generic [ref=e161]: Merge
            - button "Favorite 合并" [ref=e162] [cursor=pointer]: ☆
          - group "延迟" [ref=e163]:
            - img [ref=e164]
            - generic [ref=e166]: Delay
            - button "Favorite 延迟" [ref=e167] [cursor=pointer]: ☆
          - group "显示" [ref=e168]:
            - img [ref=e169]
            - generic [ref=e172]: Display
            - button "Favorite 显示" [ref=e173] [cursor=pointer]: ☆
          - group "手动操作" [ref=e174]:
            - img [ref=e175]
            - generic [ref=e177]: Manual
            - button "Favorite 手动操作" [ref=e178] [cursor=pointer]: ☆
          - group "排序" [ref=e179]:
            - img [ref=e180]
            - generic [ref=e182]: Sort
            - button "Favorite 排序" [ref=e183] [cursor=pointer]: ☆
          - group "或" [ref=e184]:
            - img [ref=e185]
            - generic [ref=e187]: Or
            - button "Favorite 或" [ref=e188] [cursor=pointer]: ☆
          - group "存储" [ref=e189]:
            - img [ref=e190]
            - generic [ref=e192]: Storage
            - button "Favorite 存储" [ref=e193] [cursor=pointer]: ☆
          - group "多文档" [ref=e194]:
            - img [ref=e195]
            - generic [ref=e198]: Multi-document
            - button "Favorite 多文档" [ref=e199] [cursor=pointer]: ☆
          - group "内部存储" [ref=e200]:
            - img [ref=e201]
            - generic [ref=e203]: Internal storage
            - button "Favorite 内部存储" [ref=e204] [cursor=pointer]: ☆
          - group "离线存储" [ref=e205]:
            - img [ref=e206]
            - generic [ref=e209]: Offline storage
            - button "Favorite 离线存储" [ref=e210] [cursor=pointer]: ☆
          - group "注释" [ref=e211]:
            - img [ref=e212]
            - generic [ref=e214]: Annotation
            - button "Favorite 注释" [ref=e215] [cursor=pointer]: ☆
      - generic [ref=e216]:
        - button "Extended shapes ▾" [expanded] [ref=e217] [cursor=pointer]
        - generic [ref=e218]:
          - group "云服务" [ref=e219]:
            - img [ref=e220]
            - generic [ref=e222]: Cloud
            - button "Favorite 云服务" [ref=e223] [cursor=pointer]: ☆
          - group "角色" [ref=e224]:
            - img [ref=e225]
            - generic [ref=e228]: Actor
            - button "Favorite 角色" [ref=e229] [cursor=pointer]: ☆
          - group "便签" [ref=e230]:
            - img [ref=e231]
            - generic [ref=e233]: Note
            - button "Favorite 便签" [ref=e234] [cursor=pointer]: ☆
          - group "跨页" [ref=e235]:
            - img [ref=e236]
            - generic [ref=e238]: Off-page
            - button "Favorite 跨页" [ref=e239] [cursor=pointer]: ☆
          - group "子流程框" [ref=e240]:
            - img [ref=e241]
            - generic [ref=e244]: Subprocess frame
            - button "Favorite 子流程框" [ref=e245] [cursor=pointer]: ☆
          - group "交叉" [ref=e246]:
            - img [ref=e247]
            - generic [ref=e248]: Cross
            - button "Favorite 交叉" [ref=e249] [cursor=pointer]: ☆
          - group "开始" [ref=e250]:
            - img [ref=e251]
            - generic [ref=e253]: Start
            - button "Favorite 开始" [ref=e254] [cursor=pointer]: ☆
          - group "结束" [ref=e255]:
            - img [ref=e256]
            - generic [ref=e258]: End
            - button "Favorite 结束" [ref=e259] [cursor=pointer]: ☆
          - group "卡片" [ref=e260]:
            - img [ref=e261]
            - generic [ref=e263]: Card
            - button "Favorite 卡片" [ref=e264] [cursor=pointer]: ☆
          - group "求和" [ref=e265]:
            - img [ref=e266]
            - generic [ref=e268]: Summing
            - button "Favorite 求和" [ref=e269] [cursor=pointer]: ☆
      - generic [ref=e270]:
        - button "Remote icons ▾" [expanded] [ref=e271] [cursor=pointer]
        - generic [ref=e272]:
          - group "Webhook" [ref=e273]:
            - img [ref=e274]
            - generic [ref=e277]: Webhook
            - button "Favorite Webhook" [ref=e278] [cursor=pointer]: ☆
          - group "消息队列" [ref=e279]:
            - img [ref=e280]
            - generic [ref=e283]: 消息队列
            - button "Favorite 消息队列" [ref=e284] [cursor=pointer]: ☆
          - group "QA Queue" [ref=e285]:
            - img [ref=e286]
            - generic [ref=e288]: QA Queue
            - button "Favorite QA Queue" [ref=e289] [cursor=pointer]: ☆
      - generic [ref=e290]:
        - generic [ref=e291]: Layers
        - generic [ref=e292]:
          - generic [ref=e293] [cursor=pointer]:
            - button "👁" [ref=e294]
            - generic [ref=e295]: Layer 1
            - button "🔓" [ref=e296]
          - button "+ New layer" [ref=e297] [cursor=pointer]
      - generic [ref=e299]:
        - generic [ref=e300]: T Text editor
        - generic [ref=e301]: Double-click Edit label
        - generic [ref=e302]: Delete Delete selection
        - generic [ref=e303]: Ctrl+Z Undo
    - generic [ref=e304]:
      - generic [ref=e305]:
        - heading "开始创建流程" [level=2] [ref=e306]
        - generic [ref=e307]:
          - button "从模板开始" [ref=e308] [cursor=pointer]
          - button "导入文件" [ref=e309] [cursor=pointer]
          - button "空白画布" [ref=e310] [cursor=pointer]
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
      - generic [ref=e320]:
        - generic [ref=e321]: V Select
        - generic [ref=e322]: L Connect
        - generic [ref=e323]: Click connection to edit
        - generic [ref=e324]: Wheel Zoom
        - generic [ref=e325]: Hold Space to pan canvas
    - generic [ref=e326]:
      - generic [ref=e327]: Properties
      - generic [ref=e329]:
        - generic [ref=e330]: Page info
        - generic [ref=e331]:
          - generic [ref=e332]: Page name
          - textbox "Page name" [ref=e333]: Page 1
        - paragraph [ref=e334]: JSON save / image export uses the current page name as the default filename.
        - generic [ref=e335]:
          - generic [ref=e336]: Scale
          - generic [ref=e337]: 当前页 0 个图形
        - generic [ref=e338]:
          - generic [ref=e339]: Total duration
          - generic [ref=e340]: 0 天
        - generic [ref=e341]:
          - generic [ref=e342]: Critical path
          - generic [ref=e343]: —
        - generic [ref=e344]:
          - generic [ref=e345]: Step count
          - generic [ref=e346]: 0 步
  - dialog [ref=e348]:
    - button [ref=e349] [cursor=pointer]: ×
    - generic [ref=e350]: Stencil Manager / 图形包管理
    - paragraph [ref=e351]: Import local JSON packs containing safe SVG shapes.
    - alert [ref=e352]
    - generic [ref=e354]:
      - checkbox [checked] [ref=e355]
      - generic [ref=e356]:
        - textbox [ref=e357]: QA Operations
        - generic [ref=e358]: qa_ops · 1 shapes · v1.0
      - button [ref=e359]: Export
      - button [ref=e360]: Remove
    - button [ref=e362] [cursor=pointer]: Import pack / 导入
  - generic [ref=e363]:
    - generic [ref=e364]:
      - generic [ref=e365]: 表格编辑
      - paragraph [ref=e366]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e367] [cursor=pointer]: 说明
      - generic [ref=e368]:
        - button "从画布同步到表格" [ref=e369] [cursor=pointer]:
          - img [ref=e370]
        - button "将表格内容应用到画布" [ref=e373] [cursor=pointer]:
          - img [ref=e374]
        - button "关闭表格编辑" [ref=e376] [cursor=pointer]:
          - img [ref=e377]
    - generic:
      - generic [ref=e380]:
        - generic [ref=e381]:
          - button "编辑各步骤节点" [ref=e382] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e383] [cursor=pointer]: 连线表
        - generic [ref=e384]:
          - button "在表格末尾添加一行空节点" [ref=e385] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e386] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e387]:
          - rowgroup [ref=e388]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e389] [cursor=pointer]:
              - columnheader "编号" [ref=e390]
              - columnheader "简介" [ref=e391]
              - columnheader "去向" [ref=e392]
              - columnheader "角色" [ref=e393]
              - columnheader "图形" [ref=e394]
              - columnheader "详细说明" [ref=e395]
              - columnheader "耗时天" [ref=e396]
              - columnheader "泳道" [ref=e397]
              - columnheader "图层" [ref=e398]
              - columnheader "目标页" [ref=e399]
          - rowgroup
    - generic [ref=e400]:
      - strong [ref=e401]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e402]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e403]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e404]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e405]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e406]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
  - tooltip
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const validPack = {
  4  |   id: 'qa_ops', name: 'QA Operations', version: '1.0', shapes: [{
  5  |     id: 'qa_queue', label: 'QA Queue', section: 'Operations', renderAs: 'rectangle',
  6  |     sidebarSvg: '<svg viewBox="0 0 40 40"><rect x="4" y="8" width="32" height="24" fill="none" stroke="#2563eb"/></svg>',
  7  |   }],
  8  | };
  9  | 
  10 | async function prepare(page) {
  11 |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; localStorage.clear(); });
  12 |   await page.goto('/flowchart-editor.html');
  13 |   await page.waitForFunction(() => window.__dwEditorReady && DiagramWeave?.stencilPacks);
  14 | }
  15 | 
  16 | test('imports, uses, disables, renames, and exports a local stencil pack', async ({ page }) => {
  17 |   await prepare(page);
  18 |   await page.evaluate(() => showStencilManager());
  19 |   await page.locator('#stencilPackInput').setInputFiles({ name: 'qa.stencil.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(validPack)) });
  20 |   await expect(page.locator('.stencil-pack-row')).toHaveCount(1);
  21 |   await expect(page.locator('.shape-item[data-shape="qa_queue"]')).toBeVisible();
> 22 |   await page.locator('.shape-item[data-shape="qa_queue"]').dblclick();
     |                                                            ^ Error: locator.dblclick: Test timeout of 120000ms exceeded.
  23 |   await expect(page.locator('.node[data-shape="qa_queue"]')).toHaveCount(1);
  24 | 
  25 |   await page.evaluate(() => showStencilManager());
  26 |   await page.locator('.stencil-pack-row input[type="text"]').fill('Renamed Operations');
  27 |   await page.locator('.stencil-pack-row input[type="text"]').press('Tab');
  28 |   await expect.poll(() => page.evaluate(() => DiagramWeave.stencilPacks.list()[0].name)).toBe('Renamed Operations');
  29 |   const download = page.waitForEvent('download');
  30 |   await page.getByRole('button', { name: 'Export' }).click();
  31 |   expect((await download).suggestedFilename()).toBe('qa_ops.stencil.json');
  32 |   await page.locator('.stencil-pack-row input[type="checkbox"]').uncheck();
  33 |   await expect(page.locator('.shape-item[data-shape="qa_queue"]')).toHaveCount(0);
  34 |   expect(await page.evaluate(() => DiagramWeave.shapePacks.get('qa_queue'))).toBeNull();
  35 | });
  36 | 
  37 | test('rejects an unsafe pack without mutating the shape library', async ({ page }) => {
  38 |   await prepare(page);
  39 |   await page.evaluate(() => showStencilManager());
  40 |   const unsafe = { ...validPack, id: 'unsafe_pack', shapes: [{ id: 'unsafe_shape', label: 'Unsafe', sidebarSvg: '<svg onload="alert(1)"><rect/></svg>' }] };
  41 |   await page.locator('#stencilPackInput').setInputFiles({ name: 'unsafe.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(unsafe)) });
  42 |   await expect(page.locator('#stencilPackIssues')).toContainText('safe SVG');
  43 |   await expect(page.locator('.stencil-pack-row')).toHaveCount(0);
  44 |   expect(await page.evaluate(() => DiagramWeave.shapePacks.get('unsafe_shape'))).toBeNull();
  45 | });
  46 | 
```
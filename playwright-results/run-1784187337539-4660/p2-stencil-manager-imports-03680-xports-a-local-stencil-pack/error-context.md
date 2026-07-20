# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-stencil-manager.spec.js >> imports, uses, disables, renames, and exports a local stencil pack
- Location: tests\e2e\p2-stencil-manager.spec.js:16:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "Renamed Operations"
Received: "QA Operations"

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
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
        - generic [ref=e110]: Recent
        - button "QA Queue" [ref=e112]
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
          - group "QA Queue" [ref=e289]:
            - img [ref=e290]
            - generic [ref=e292]: QA Queue
            - button "Favorite QA Queue" [ref=e293] [cursor=pointer]: ☆
      - generic [ref=e294]:
        - generic [ref=e295]: Layers
        - generic [ref=e296]:
          - generic [ref=e297] [cursor=pointer]:
            - button "👁" [ref=e298]
            - generic [ref=e299]: Layer 1
            - button "🔓" [ref=e300]
          - button "+ New layer" [ref=e301] [cursor=pointer]
      - generic [ref=e303]:
        - generic [ref=e304]: T Text editor
        - generic [ref=e305]: Double-click Edit label
        - generic [ref=e306]: Delete Delete selection
        - generic [ref=e307]: Ctrl+Z Undo
    - generic [ref=e308]:
      - generic "画布导航" [ref=e309]:
        - button "适应全部" [ref=e310] [cursor=pointer]: ⌗
        - button "适应选区" [ref=e311] [cursor=pointer]: ▣
        - button "缩放至 100%" [ref=e312] [cursor=pointer]: 100%
        - button "打开节点大纲" [ref=e313] [cursor=pointer]: ☷
        - combobox "对齐所选节点" [ref=e314] [cursor=pointer]:
          - option "对齐" [selected]
          - option "左对齐"
          - option "水平居中"
          - option "右对齐"
          - option "顶部对齐"
          - option "垂直居中"
          - option "底部对齐"
        - combobox "等距分布所选节点" [ref=e315] [cursor=pointer]:
          - option "分布" [selected]
          - option "水平等距"
          - option "垂直等距"
      - generic "画布小地图" [ref=e316]
      - toolbar "节点快捷操作" [ref=e317]:
        - button "浅蓝填充" [ref=e318] [cursor=pointer]: ■
        - button "浅黄填充" [ref=e319] [cursor=pointer]: ■
        - button "复制节点" [ref=e320] [cursor=pointer]: ⧉
        - button "删除节点" [ref=e321] [cursor=pointer]: ×
      - generic [ref=e322]:
        - generic:
          - img
          - generic [ref=e324]:
            - generic: QA Queue
      - generic [ref=e329]:
        - generic [ref=e330]: V Select
        - generic [ref=e331]: L Connect
        - generic [ref=e332]: Click connection to edit
        - generic [ref=e333]: Wheel Zoom
        - generic [ref=e334]: Hold Space to pan canvas
    - generic [ref=e335]:
      - generic [ref=e336]: Properties
      - generic [ref=e337]:
        - tablist "节点属性分类" [ref=e338]:
          - tab "内容" [selected] [ref=e339]
          - tab "流程" [ref=e340]
          - tab "外观" [ref=e341]
          - tab "数据" [ref=e342]
        - generic [ref=e343]:
          - generic [ref=e344]: Flow content
          - generic [ref=e345]:
            - generic [ref=e346]: ID
            - generic [ref=e347]: "1"
          - generic [ref=e348]:
            - generic [ref=e349]: Next connections
            - generic [ref=e350]: （无出线）
          - generic [ref=e351]:
            - generic [ref=e352]: Label
            - textbox "Title shown on shape" [ref=e353]: QA Queue
          - generic [ref=e354]:
            - generic [ref=e355]: Role
            - textbox "e.g. Applicant, Approver" [ref=e356]
          - generic [ref=e357]:
            - generic [ref=e358]: Shape
            - combobox [ref=e359]:
              - option "Actor"
              - option "Annotation"
              - option "Card"
              - option "Cloud"
              - option "Collate"
              - option "Connector"
              - option "Cross"
              - option "Data store"
              - option "Database"
              - option "Decision"
              - option "Delay"
              - option "Display"
              - option "Document"
              - option "End"
              - option "Input/Output"
              - option "Internal storage"
              - option "Loop limit"
              - option "Manual"
              - option "Merge"
              - option "Multi-document"
              - option "Note"
              - option "Off-page"
              - option "Offline storage"
              - option "Or"
              - option "Predefined process"
              - option "Preparation"
              - option "Process"
              - option "QA Queue" [selected]
              - option "Sort"
              - option "Start"
              - option "Start/End"
              - option "Storage"
              - option "Subprocess"
              - option "Subprocess frame"
              - option "Summing"
              - option "Tape"
              - option "Webhook"
              - option "消息队列"
          - generic [ref=e360]:
            - generic [ref=e361]: Description
            - textbox "Full text for presentation and exports" [ref=e362]
          - generic [ref=e363]:
            - generic [ref=e364]: Duration (days)
            - spinbutton [ref=e365]
          - generic [ref=e366]:
            - generic [ref=e367]: Layer
            - combobox [ref=e368]:
              - option "Layer 1" [selected]
        - generic [ref=e369]:
          - generic [ref=e370]: Flow duration stats
          - generic [ref=e371]:
            - generic [ref=e372]: Total duration
            - generic [ref=e373]: 0 天
          - generic [ref=e374]:
            - generic [ref=e375]: Node count
            - generic [ref=e376]: "1"
  - dialog "Stencil Manager / 图形包管理" [ref=e378]:
    - button "Close stencil manager" [ref=e379] [cursor=pointer]: ×
    - generic [ref=e380]: Stencil Manager / 图形包管理
    - paragraph [ref=e381]: Import local JSON packs containing safe SVG shapes.
    - alert [ref=e382]
    - generic [ref=e384]:
      - checkbox "Enable QA Operations" [checked] [ref=e385]
      - generic [ref=e386]:
        - textbox "Pack name" [ref=e387]: QA Operations
        - generic [ref=e388]: qa_ops · 1 shapes · v1.0
      - button "Export" [ref=e389]
      - button "Remove" [ref=e390]
    - button "Import pack / 导入" [ref=e392] [cursor=pointer]
  - dialog "开始项目" [ref=e394]:
    - button "关闭" [ref=e395] [cursor=pointer]:
      - img [ref=e396]
    - generic [ref=e399]: 开始项目
    - generic [ref=e400]: 请选择保存新档案、打开旧档案，或暂不处理。
    - generic [ref=e401]:
      - button "取消" [active] [ref=e402] [cursor=pointer]: 暂不处理
      - button "打开" [ref=e403] [cursor=pointer]: 打开旧档案
      - button "确认" [ref=e404] [cursor=pointer]: 保存新档案
  - generic [ref=e405]:
    - generic [ref=e406]:
      - generic [ref=e407]: 表格编辑
      - paragraph [ref=e408]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e409] [cursor=pointer]: 说明
      - generic [ref=e410]:
        - button "从画布同步到表格" [ref=e411] [cursor=pointer]:
          - img [ref=e412]
        - button "将表格内容应用到画布" [ref=e415] [cursor=pointer]:
          - img [ref=e416]
        - button "关闭表格编辑" [ref=e418] [cursor=pointer]:
          - img [ref=e419]
    - generic:
      - generic [ref=e422]:
        - generic [ref=e423]:
          - button "编辑各步骤节点" [ref=e424] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e425] [cursor=pointer]: 连线表
        - generic [ref=e426]:
          - button "在表格末尾添加一行空节点" [ref=e427] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e428] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e429]:
          - rowgroup [ref=e430]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e431] [cursor=pointer]:
              - columnheader "编号" [ref=e432]
              - columnheader "简介" [ref=e433]
              - columnheader "去向" [ref=e434]
              - columnheader "角色" [ref=e435]
              - columnheader "图形" [ref=e436]
              - columnheader "详细说明" [ref=e437]
              - columnheader "耗时天" [ref=e438]
              - columnheader "泳道" [ref=e439]
              - columnheader "图层" [ref=e440]
              - columnheader "目标页" [ref=e441]
          - rowgroup
    - generic [ref=e442]:
      - strong [ref=e443]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e444]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e445]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e446]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e447]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e448]: 点击表格行
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
  22 |   await page.evaluate(() => hideStencilManager());
  23 |   await page.locator('.shape-item[data-shape="qa_queue"]').dblclick();
  24 |   await expect.poll(() => page.evaluate(() => state.nodes.filter(node => node.shape === 'qa_queue').length)).toBe(1);
  25 | 
  26 |   await page.evaluate(() => showStencilManager());
  27 |   await page.locator('.stencil-pack-row input[type="text"]').fill('Renamed Operations');
  28 |   await page.locator('.stencil-pack-row input[type="text"]').press('Tab');
> 29 |   await expect.poll(() => page.evaluate(() => DiagramWeave.stencilPacks.list()[0].name)).toBe('Renamed Operations');
     |                                                                                          ^ Error: expect(received).toBe(expected) // Object.is equality
  30 |   const download = page.waitForEvent('download');
  31 |   await page.getByRole('button', { name: 'Export' }).click();
  32 |   expect((await download).suggestedFilename()).toBe('qa_ops.stencil.json');
  33 |   await page.locator('.stencil-pack-row input[type="checkbox"]').uncheck();
  34 |   await expect(page.locator('.shape-item[data-shape="qa_queue"]')).toHaveCount(0);
  35 |   expect(await page.evaluate(() => DiagramWeave.shapePacks.get('qa_queue'))).toBeNull();
  36 | });
  37 | 
  38 | test('rejects an unsafe pack without mutating the shape library', async ({ page }) => {
  39 |   await prepare(page);
  40 |   await page.evaluate(() => showStencilManager());
  41 |   const unsafe = { ...validPack, id: 'unsafe_pack', shapes: [{ id: 'unsafe_shape', label: 'Unsafe', sidebarSvg: '<svg onload="alert(1)"><rect/></svg>' }] };
  42 |   await page.locator('#stencilPackInput').setInputFiles({ name: 'unsafe.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(unsafe)) });
  43 |   await expect(page.locator('#stencilPackIssues')).toContainText('safe SVG');
  44 |   await expect(page.locator('.stencil-pack-row')).toHaveCount(0);
  45 |   expect(await page.evaluate(() => DiagramWeave.shapePacks.get('unsafe_shape'))).toBeNull();
  46 | });
  47 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-property-editing.spec.js >> batch appearance serializes and contextual toolbar duplicates and deletes
- Location: tests\e2e\p1-property-editing.spec.js:47:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 2
+ Received  + 2

  Array [
    Object {
-     "detail": "keep-a",
+     "detail": undefined,
      "textColor": "#ffffff",
    },
    Object {
-     "detail": "keep-b",
+     "detail": undefined,
      "textColor": "#ffffff",
    },
  ]
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
      - generic [ref=e285]:
        - generic [ref=e286]: Layers
        - generic [ref=e287]:
          - generic [ref=e288] [cursor=pointer]:
            - button "👁" [ref=e289]
            - generic [ref=e290]: Layer 1
            - button "🔓" [ref=e291]
          - button "+ New layer" [ref=e292] [cursor=pointer]
      - generic [ref=e294]:
        - generic [ref=e295]: T Text editor
        - generic [ref=e296]: Double-click Edit label
        - generic [ref=e297]: Delete Delete selection
        - generic [ref=e298]: Ctrl+Z Undo
    - generic [ref=e299]:
      - generic "画布导航" [ref=e300]:
        - button "适应全部" [ref=e301] [cursor=pointer]: ⌗
        - button "适应选区" [ref=e302] [cursor=pointer]: ▣
        - button "缩放至 100%" [ref=e303] [cursor=pointer]: 100%
        - button "打开节点大纲" [ref=e304] [cursor=pointer]: ☷
        - combobox "对齐所选节点" [ref=e305] [cursor=pointer]:
          - option "对齐" [selected]
          - option "左对齐"
          - option "水平居中"
          - option "右对齐"
          - option "顶部对齐"
          - option "垂直居中"
          - option "底部对齐"
        - combobox "等距分布所选节点" [ref=e306] [cursor=pointer]:
          - option "分布" [selected]
          - option "水平等距"
          - option "垂直等距"
      - generic "画布小地图" [ref=e307]
      - toolbar "节点快捷操作" [ref=e308]:
        - button "浅蓝填充" [ref=e309] [cursor=pointer]: ■
        - button "浅黄填充" [ref=e310] [cursor=pointer]: ■
        - button "复制节点" [ref=e311] [cursor=pointer]: ⧉
        - button "删除节点" [ref=e312] [cursor=pointer]: ×
      - generic [ref=e313]:
        - generic:
          - img
          - generic [ref=e315]:
            - generic: Draft
          - generic [ref=e321]:
            - img
            - generic: Review
      - generic [ref=e326]:
        - generic [ref=e327]: V Select
        - generic [ref=e328]: L Connect
        - generic [ref=e329]: Click connection to edit
        - generic [ref=e330]: Wheel Zoom
        - generic [ref=e331]: Hold Space to pan canvas
    - generic [ref=e332]:
      - generic [ref=e333]: Properties
      - generic [ref=e334]:
        - tablist "节点属性分类" [ref=e335]:
          - tab "内容" [selected] [ref=e336]
          - tab "流程" [ref=e337]
          - tab "外观" [ref=e338]
          - tab "数据" [ref=e339]
        - generic [ref=e340]: 2 nodes selected · batch editing
        - generic [ref=e341]:
          - generic [ref=e342]: Flow content
          - generic [ref=e343]:
            - generic [ref=e344]: ID
            - generic [ref=e345]: "2"
          - generic [ref=e346]:
            - generic [ref=e347]: Next connections
            - generic [ref=e348]: （无出线）
          - generic [ref=e349]:
            - generic [ref=e350]: Label
            - textbox "Title shown on shape" [ref=e351]: Review
          - generic [ref=e352]:
            - generic [ref=e353]: Role
            - textbox "e.g. Applicant, Approver" [ref=e354]
          - generic [ref=e355]:
            - generic [ref=e356]: Shape
            - combobox [ref=e357]:
              - option "Actor"
              - option "Annotation"
              - option "Card"
              - option "Cloud"
              - option "Collate"
              - option "Connector"
              - option "Cross"
              - option "Data store"
              - option "Database"
              - option "Decision" [selected]
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
          - generic [ref=e358]:
            - generic [ref=e359]: Description
            - textbox "Full text for presentation and exports" [ref=e360]
          - generic [ref=e361]:
            - generic [ref=e362]: Duration (days)
            - spinbutton [ref=e363]
          - generic [ref=e364]:
            - generic [ref=e365]: Layer
            - combobox [ref=e366]:
              - option "Layer 1" [selected]
        - generic [ref=e367]:
          - generic [ref=e368]: Flow duration stats
          - generic [ref=e369]:
            - generic [ref=e370]: Total duration
            - generic [ref=e371]: 0 天
          - generic [ref=e372]:
            - generic [ref=e373]: Node count
            - generic [ref=e374]: "2"
  - generic [ref=e375]:
    - generic [ref=e376]:
      - generic [ref=e377]: 表格编辑
      - paragraph [ref=e378]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e379] [cursor=pointer]: 说明
      - generic [ref=e380]:
        - button "从画布同步到表格" [ref=e381] [cursor=pointer]:
          - img [ref=e382]
        - button "将表格内容应用到画布" [ref=e385] [cursor=pointer]:
          - img [ref=e386]
        - button "关闭表格编辑" [ref=e388] [cursor=pointer]:
          - img [ref=e389]
    - generic:
      - generic [ref=e392]:
        - generic [ref=e393]:
          - button "编辑各步骤节点" [ref=e394] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e395] [cursor=pointer]: 连线表
        - generic [ref=e396]:
          - button "在表格末尾添加一行空节点" [ref=e397] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e398] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e399]:
          - rowgroup [ref=e400]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e401] [cursor=pointer]:
              - columnheader "编号" [ref=e402]
              - columnheader "简介" [ref=e403]
              - columnheader "去向" [ref=e404]
              - columnheader "角色" [ref=e405]
              - columnheader "图形" [ref=e406]
              - columnheader "详细说明" [ref=e407]
              - columnheader "耗时天" [ref=e408]
              - columnheader "泳道" [ref=e409]
              - columnheader "图层" [ref=e410]
              - columnheader "目标页" [ref=e411]
          - rowgroup
    - generic [ref=e412]:
      - strong [ref=e413]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e414]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e415]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e416]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e417]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e418]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
  - tooltip
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | const nodes = [
  4  |   { id: 'prop-a', shape: 'rectangle', x: 100, y: 100, w: 140, h: 60, label: 'Draft', role: 'Writer', fillColor: '#ffffff', strokeColor: '#000000', textColor: 'auto', detail: 'keep-a' },
  5  |   { id: 'prop-b', shape: 'diamond', x: 380, y: 220, w: 120, h: 80, label: 'Review', role: 'QA', fillColor: '#fff2cc', strokeColor: '#44546a', textColor: '#111320', detail: 'keep-b' },
  6  | ];
  7  | 
  8  | test.beforeEach(async ({ page }) => {
  9  |   await page.addInitScript(seed => {
  10 |     sessionStorage.setItem('dw-initial-save-prompted', '1');
  11 |     sessionStorage.setItem('dw-e2e-seed-nodes', JSON.stringify(seed));
  12 |   }, nodes);
  13 |   await page.goto('/flowchart-editor.html');
  14 |   await page.waitForFunction(() => window.__dwEditorReady && document.querySelectorAll('.node').length === 2);
  15 | });
  16 | 
  17 | test('four property tabs expose the expected sections', async ({ page }) => {
  18 |   await page.evaluate(() => selectNode('prop-a'));
  19 |   const tabs = page.locator('[data-property-tab]');
  20 |   await expect(tabs).toHaveCount(4);
  21 |   await expect(page.locator('#propLabel')).toBeVisible();
  22 |   await tabs.filter({ hasText: /流程|Flow/ }).click();
  23 |   await expect(page.locator('#propRole')).toBeVisible();
  24 |   await tabs.filter({ hasText: /外观|Appearance/ }).click();
  25 |   await expect(page.locator('#propFillSwatches')).toBeVisible();
  26 |   await tabs.filter({ hasText: /数据|Data/ }).click();
  27 |   await expect(page.locator('#propLayer')).toBeVisible();
  28 | });
  29 | 
  30 | test('mixed values are explicit and batch edits preserve unrelated fields and undo', async ({ page }) => {
  31 |   await page.evaluate(() => { selectNode('prop-a'); selectNode('prop-b', true); });
  32 |   await expect(page.locator('#propertyBatchStatus')).toContainText('2 nodes');
  33 |   await page.locator('[data-property-tab="flow"]').click();
  34 |   await expect(page.locator('#propRole')).toHaveAttribute('placeholder', 'Mixed');
  35 |   await page.locator('#propRole').fill('Owner');
  36 |   await page.locator('#propRole').blur();
  37 |   expect(await page.evaluate(() => state.nodes.map(node => node.role))).toEqual(['Owner', 'Owner']);
  38 |   expect(await page.evaluate(() => state.nodes.map(node => node.detail))).toEqual(['keep-a', 'keep-b']);
  39 | 
  40 |   await page.locator('[data-property-tab="appearance"]').click();
  41 |   await page.locator('#propFillCustom').evaluate(input => { input.value = '#123456'; input.dispatchEvent(new Event('change', { bubbles: true })); });
  42 |   expect(await page.evaluate(() => state.nodes.map(node => node.fillColor))).toEqual(['#123456', '#123456']);
  43 |   await page.evaluate(() => undo());
  44 |   expect(await page.evaluate(() => state.nodes.map(node => node.fillColor))).toEqual(['#ffffff', '#fff2cc']);
  45 | });
  46 | 
  47 | test('batch appearance serializes and contextual toolbar duplicates and deletes', async ({ page }) => {
  48 |   await page.evaluate(() => { selectNode('prop-a'); selectNode('prop-b', true); updatePropTextColor('#ffffff'); });
  49 |   const serialized = await page.evaluate(() => getFlowDocumentPayload().pages[0].nodes.map(node => ({ textColor: node.textColor, detail: node.detail })));
> 50 |   expect(serialized).toEqual([
     |                      ^ Error: expect(received).toEqual(expected) // deep equality
  51 |     { textColor: '#ffffff', detail: 'keep-a' },
  52 |     { textColor: '#ffffff', detail: 'keep-b' },
  53 |   ]);
  54 | 
  55 |   await expect(page.locator('#nodeContextToolbar')).toBeVisible();
  56 |   await page.locator('#nodeContextToolbar button[aria-label*="复制"]').click();
  57 |   await expect(page.locator('.node')).toHaveCount(3);
  58 |   await page.locator('#nodeContextToolbar button[aria-label*="删除"]').click();
  59 |   await expect(page.locator('.node')).toHaveCount(2);
  60 | });
  61 | 
  62 | test('tablet property tabs and context actions meet touch target size', async ({ page }) => {
  63 |   await page.setViewportSize({ width: 768, height: 1024 });
  64 |   await page.evaluate(() => selectNode('prop-a'));
  65 |   await page.locator('.tablet-drawer-toggle').nth(1).click();
  66 |   const heights = await page.locator('.property-tabs button, #nodeContextToolbar button').evaluateAll(items =>
  67 |     items.filter(item => !item.hidden).map(item => item.getBoundingClientRect().height));
  68 |   expect(heights.length).toBeGreaterThan(4);
  69 |   expect(heights.every(height => height >= 44)).toBe(true);
  70 | });
  71 | 
```
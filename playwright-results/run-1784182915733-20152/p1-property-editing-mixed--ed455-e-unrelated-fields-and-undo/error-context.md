# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-property-editing.spec.js >> mixed values are explicit and batch edits preserve unrelated fields and undo
- Location: tests\e2e\p1-property-editing.spec.js:35:1

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('#propLayer')
    - locator resolved to <select id="propLayer" class="prop-input" data-mixed="false" onchange="updatePropLayer(parseInt(this.value,10))">…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
      - waiting 100ms
    215 × waiting for element to be visible and enabled
        - did not find some options
      - retrying select option action
        - waiting 500ms

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
            - button "Delete layer" [ref=e292]: ×
          - generic [ref=e293] [cursor=pointer]:
            - button "👁" [ref=e294]
            - generic [ref=e295]: Layer 2
            - button "🔓" [ref=e296]
            - button "Delete layer" [ref=e297]: ×
          - button "+ New layer" [ref=e298] [cursor=pointer]
      - generic [ref=e300]:
        - generic [ref=e301]: T Text editor
        - generic [ref=e302]: Double-click Edit label
        - generic [ref=e303]: Delete Delete selection
        - generic [ref=e304]: Ctrl+Z Undo
    - generic [ref=e305]:
      - generic "画布导航" [ref=e306]:
        - button "适应全部" [ref=e307] [cursor=pointer]: ⌗
        - button "适应选区" [ref=e308] [cursor=pointer]: ▣
        - button "缩放至 100%" [ref=e309] [cursor=pointer]: 100%
        - button "打开节点大纲" [ref=e310] [cursor=pointer]: ☷
        - combobox "对齐所选节点" [ref=e311] [cursor=pointer]:
          - option "对齐" [selected]
          - option "左对齐"
          - option "水平居中"
          - option "右对齐"
          - option "顶部对齐"
          - option "垂直居中"
          - option "底部对齐"
        - combobox "等距分布所选节点" [ref=e312] [cursor=pointer]:
          - option "分布" [selected]
          - option "水平等距"
          - option "垂直等距"
      - generic "画布小地图" [ref=e313]
      - toolbar "节点快捷操作" [ref=e314]:
        - button "浅蓝填充" [ref=e315] [cursor=pointer]: ■
        - button "浅黄填充" [ref=e316] [cursor=pointer]: ■
        - button "复制节点" [ref=e317] [cursor=pointer]: ⧉
        - button "删除节点" [ref=e318] [cursor=pointer]: ×
      - generic [ref=e319]:
        - generic:
          - img
          - generic [ref=e320]:
            - generic [ref=e321]:
              - generic: Draft
            - generic: keep-a
          - generic [ref=e326]:
            - generic [ref=e327]:
              - img
              - generic: Review
            - generic: keep-b
      - generic [ref=e332]:
        - generic [ref=e333]: V Select
        - generic [ref=e334]: L Connect
        - generic [ref=e335]: Click connection to edit
        - generic [ref=e336]: Wheel Zoom
        - generic [ref=e337]: Hold Space to pan canvas
    - generic [ref=e338]:
      - generic [ref=e339]: Properties
      - generic [ref=e340]:
        - tablist "节点属性分类" [ref=e341]:
          - tab "内容" [ref=e342]
          - tab "流程" [ref=e343]
          - tab "外观" [ref=e344]
          - tab "数据" [active] [selected] [ref=e345]
        - generic [ref=e346]: 2 nodes selected · batch editing
        - generic [ref=e347]:
          - generic [ref=e348]: Flow content
          - generic [ref=e349]:
            - generic [ref=e350]: ID
            - generic [ref=e351]: "2"
          - generic [ref=e352]:
            - generic [ref=e353]: Next connections
            - generic [ref=e354]: （无出线）
          - generic [ref=e355]:
            - generic [ref=e356]: Label
            - textbox "Title shown on shape" [ref=e357]: Review
          - generic [ref=e358]:
            - generic [ref=e359]: Role
            - textbox "Mixed" [ref=e360]: Owner
          - generic [ref=e361]:
            - generic [ref=e362]: Shape
            - combobox [ref=e363]:
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
          - generic [ref=e364]:
            - generic [ref=e365]: Description
            - textbox "Full text for presentation and exports" [ref=e366]: keep-b
          - generic [ref=e367]:
            - generic [ref=e368]: Duration (days)
            - spinbutton [ref=e369]
          - generic [ref=e370]:
            - generic [ref=e371]: Layer
            - combobox [ref=e372]:
              - option "Layer 1" [selected]
        - generic [ref=e373]:
          - generic [ref=e374]: Flow duration stats
          - generic [ref=e375]:
            - generic [ref=e376]: Total duration
            - generic [ref=e377]: 0 天
          - generic [ref=e378]:
            - generic [ref=e379]: Node count
            - generic [ref=e380]: "2"
  - generic [ref=e381]:
    - generic [ref=e382]:
      - generic [ref=e383]: 表格编辑
      - paragraph [ref=e384]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e385] [cursor=pointer]: 说明
      - generic [ref=e386]:
        - button "从画布同步到表格" [ref=e387] [cursor=pointer]:
          - img [ref=e388]
        - button "将表格内容应用到画布" [ref=e391] [cursor=pointer]:
          - img [ref=e392]
        - button "关闭表格编辑" [ref=e394] [cursor=pointer]:
          - img [ref=e395]
    - generic:
      - generic [ref=e398]:
        - generic [ref=e399]:
          - button "编辑各步骤节点" [ref=e400] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e401] [cursor=pointer]: 连线表
        - generic [ref=e402]:
          - button "在表格末尾添加一行空节点" [ref=e403] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e404] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e405]:
          - rowgroup [ref=e406]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e407] [cursor=pointer]:
              - columnheader "编号" [ref=e408]
              - columnheader "简介" [ref=e409]
              - columnheader "去向" [ref=e410]
              - columnheader "角色" [ref=e411]
              - columnheader "图形" [ref=e412]
              - columnheader "详细说明" [ref=e413]
              - columnheader "耗时天" [ref=e414]
              - columnheader "泳道" [ref=e415]
              - columnheader "图层" [ref=e416]
              - columnheader "目标页" [ref=e417]
          - rowgroup
    - generic [ref=e418]:
      - strong [ref=e419]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e420]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e421]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e422]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e423]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e424]: 点击表格行
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
  15 |   await page.evaluate(seed => {
  16 |     state.nodes.forEach((node, index) => Object.assign(node, seed[index]));
  17 |     renderAll();
  18 |   }, nodes);
  19 | });
  20 | 
  21 | test('four property tabs expose the expected sections', async ({ page }) => {
  22 |   await page.evaluate(() => selectNode('prop-a'));
  23 |   const tabs = page.locator('[data-property-tab]');
  24 |   await expect(tabs).toHaveCount(4);
  25 |   await expect(page.locator('#propLabel')).toBeVisible();
  26 |   await tabs.filter({ hasText: /流程|Flow/ }).click();
  27 |   await expect(page.locator('#propRole')).toBeVisible();
  28 |   await tabs.filter({ hasText: /外观|Appearance/ }).click();
  29 |   await expect(page.locator('#propFillSwatches')).toBeVisible();
  30 |   await expect(page.locator('#propFillSwatches .color-swatch').first()).toHaveAttribute('aria-label', /White.*白色.*#FFFFFF/);
  31 |   await tabs.filter({ hasText: /数据|Data/ }).click();
  32 |   await expect(page.locator('#propLayer')).toBeVisible();
  33 | });
  34 | 
  35 | test('mixed values are explicit and batch edits preserve unrelated fields and undo', async ({ page }) => {
  36 |   await page.evaluate(() => { selectNode('prop-a'); selectNode('prop-b', true); });
  37 |   await expect(page.locator('#propertyBatchStatus')).toContainText('2 nodes');
  38 |   await page.locator('[data-property-tab="flow"]').click();
  39 |   await expect(page.locator('#propRole')).toHaveAttribute('placeholder', 'Mixed');
  40 |   await page.locator('#propRole').fill('Owner');
  41 |   await page.locator('#propRole').blur();
  42 |   expect(await page.evaluate(() => state.nodes.map(node => node.role))).toEqual(['Owner', 'Owner']);
  43 |   expect(await page.evaluate(() => state.nodes.map(node => node.detail))).toEqual(['keep-a', 'keep-b']);
  44 | 
  45 |   await page.evaluate(() => DiagramWeave.addLayer());
  46 |   await page.locator('[data-property-tab="data"]').click();
> 47 |   await page.locator('#propLayer').selectOption('1');
     |                                    ^ Error: locator.selectOption: Test timeout of 120000ms exceeded.
  48 |   expect(await page.evaluate(() => state.nodes.map(node => node.layer))).toEqual([1, 1]);
  49 |   expect(await page.evaluate(() => state.nodes.map(node => node.detail))).toEqual(['keep-a', 'keep-b']);
  50 | 
  51 |   await page.locator('[data-property-tab="appearance"]').click();
  52 |   await page.locator('#propFillCustom').evaluate(input => { input.value = '#123456'; input.dispatchEvent(new Event('change', { bubbles: true })); });
  53 |   expect(await page.evaluate(() => state.nodes.map(node => node.fillColor))).toEqual(['#123456', '#123456']);
  54 |   await page.evaluate(() => undo());
  55 |   expect(await page.evaluate(() => state.nodes.map(node => node.fillColor))).toEqual(['#ffffff', '#fff2cc']);
  56 | });
  57 | 
  58 | test('batch appearance serializes and contextual toolbar duplicates and deletes', async ({ page }) => {
  59 |   await page.evaluate(() => { selectNode('prop-a'); selectNode('prop-b', true); updatePropTextColor('#ffffff'); });
  60 |   const serialized = await page.evaluate(() => getFlowDocumentPayload().pages[0].nodes.map(node => ({ textColor: node.textColor, detail: node.detail })));
  61 |   expect(serialized).toEqual([
  62 |     { textColor: '#ffffff', detail: 'keep-a' },
  63 |     { textColor: '#ffffff', detail: 'keep-b' },
  64 |   ]);
  65 | 
  66 |   await expect(page.locator('#nodeContextToolbar')).toBeVisible();
  67 |   await page.locator('#nodeContextToolbar button[aria-label*="复制"]').click();
  68 |   await expect(page.locator('.node')).toHaveCount(3);
  69 |   await page.locator('#nodeContextToolbar button[aria-label*="删除"]').click();
  70 |   await expect(page.locator('.node')).toHaveCount(2);
  71 | });
  72 | 
  73 | test('tablet property tabs and context actions meet touch target size', async ({ page }) => {
  74 |   await page.setViewportSize({ width: 768, height: 1024 });
  75 |   await page.evaluate(() => selectNode('prop-a'));
  76 |   await page.locator('.tablet-drawer-toggle').nth(1).click();
  77 |   const heights = await page.locator('.property-tabs button, #nodeContextToolbar button').evaluateAll(items =>
  78 |     items.filter(item => !item.hidden).map(item => item.getBoundingClientRect().height));
  79 |   expect(heights.length).toBeGreaterThan(4);
  80 |   expect(heights.every(height => height >= 44)).toBe(true);
  81 | });
  82 | 
```
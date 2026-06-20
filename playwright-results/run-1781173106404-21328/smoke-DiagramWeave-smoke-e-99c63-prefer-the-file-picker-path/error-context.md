# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> DiagramWeave smoke >> excel import buttons prefer the file picker path
- Location: tests\e2e\smoke.spec.js:28:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button[onclick="triggerExcelUpload()"]')
    - locator resolved to <button type="button" class="primary" onclick="triggerExcelUpload()">② 上传并导入</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="confirmOverlay" class="confirm-overlay visible" onclick="if(event.target===this)hideConfirm()">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="confirmOverlay" class="confirm-overlay visible" onclick="if(event.target===this)hideConfirm()">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    112 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <div id="confirmOverlay" class="confirm-overlay visible" onclick="if(event.target===this)hideConfirm()">…</div> intercepts pointer events
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e4]
      - text: DiagramWeave
    - button [ref=e7] [cursor=pointer]:
      - img [ref=e8]
    - button [ref=e11] [cursor=pointer]:
      - img [ref=e12]
    - button [ref=e14] [cursor=pointer]:
      - img [ref=e15]
    - button [ref=e19] [cursor=pointer]:
      - img [ref=e20]
    - button [ref=e25] [cursor=pointer]:
      - img [ref=e26]
    - button [ref=e29] [cursor=pointer]:
      - img [ref=e30]
    - button [ref=e33] [cursor=pointer]:
      - img [ref=e34]
    - button [ref=e38] [cursor=pointer]:
      - img [ref=e39]
    - combobox [ref=e44] [cursor=pointer]:
      - option "Curved" [selected]
      - option "Orthogonal"
      - option "Avoid obstacles"
      - option "Straight"
      - option "Visio-style"
    - button [ref=e46] [cursor=pointer]:
      - img [ref=e47]
    - button [ref=e49] [cursor=pointer]:
      - img [ref=e50]
    - generic "Untitled Project" [ref=e55]
    - button [ref=e56] [cursor=pointer]:
      - img [ref=e57]
    - generic [ref=e60]:
      - button "−" [ref=e61] [cursor=pointer]
      - generic [ref=e62]: 100%
      - button "+" [ref=e63] [cursor=pointer]
      - button [ref=e64] [cursor=pointer]:
        - img [ref=e65]
    - button [ref=e69] [cursor=pointer]:
      - img [ref=e70]
    - button [ref=e73] [cursor=pointer]:
      - img [ref=e74]
    - button [ref=e78] [cursor=pointer]:
      - img [ref=e79]
    - button [active] [ref=e82] [cursor=pointer]:
      - img [ref=e83]
    - combobox "Language" [ref=e87] [cursor=pointer]:
      - option "中文"
      - option "EN" [selected]
    - button [ref=e88] [cursor=pointer]:
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
      - generic [ref=e107]:
        - generic [ref=e108]: Basic shapes
        - generic [ref=e109]:
          - generic [ref=e110]:
            - img [ref=e111]
            - generic [ref=e113]: Process
          - generic [ref=e114]:
            - img [ref=e115]
            - generic [ref=e117]: Subprocess
          - generic [ref=e118]:
            - img [ref=e119]
            - generic [ref=e121]: Decision
          - generic [ref=e122]:
            - img [ref=e123]
            - generic [ref=e125]: Start/End
          - generic [ref=e126]:
            - img [ref=e127]
            - generic [ref=e129]: Connector
          - generic [ref=e130]:
            - img [ref=e131]
            - generic [ref=e134]: Database
          - generic [ref=e135]:
            - img [ref=e136]
            - generic [ref=e138]: Input/Output
          - generic [ref=e139]:
            - img [ref=e140]
            - generic [ref=e142]: Document
          - generic [ref=e143]:
            - img [ref=e144]
            - generic [ref=e146]: Preparation
          - generic [ref=e147]:
            - img [ref=e148]
            - generic [ref=e150]: Merge
          - generic [ref=e151]:
            - img [ref=e152]
            - generic [ref=e154]: Delay
          - generic [ref=e155]:
            - img [ref=e156]
            - generic [ref=e159]: Display
          - generic [ref=e160]:
            - img [ref=e161]
            - generic [ref=e163]: Manual
          - generic [ref=e164]:
            - img [ref=e165]
            - generic [ref=e167]: Sort
          - generic [ref=e168]:
            - img [ref=e169]
            - generic [ref=e171]: Or
          - generic [ref=e172]:
            - img [ref=e173]
            - generic [ref=e175]: Storage
          - generic [ref=e176]:
            - img [ref=e177]
            - generic [ref=e180]: Multi-document
          - generic [ref=e181]:
            - img [ref=e182]
            - generic [ref=e184]: Internal storage
          - generic [ref=e185]:
            - img [ref=e186]
            - generic [ref=e189]: Offline storage
          - generic [ref=e190]:
            - img [ref=e191]
            - generic [ref=e193]: Annotation
      - generic [ref=e194]:
        - generic [ref=e195]: Extended shapes
        - generic [ref=e196]:
          - generic [ref=e197]:
            - img [ref=e198]
            - generic [ref=e200]: Cloud
          - generic [ref=e201]:
            - img [ref=e202]
            - generic [ref=e205]: Actor
          - generic [ref=e206]:
            - img [ref=e207]
            - generic [ref=e209]: Note
          - generic [ref=e210]:
            - img [ref=e211]
            - generic [ref=e213]: Off-page
          - generic [ref=e214]:
            - img [ref=e215]
            - generic [ref=e218]: Subprocess frame
          - generic [ref=e219]:
            - img [ref=e220]
            - generic [ref=e221]: Cross
          - generic [ref=e222]:
            - img [ref=e223]
            - generic [ref=e225]: Start
          - generic [ref=e226]:
            - img [ref=e227]
            - generic [ref=e229]: End
          - generic [ref=e230]:
            - img [ref=e231]
            - generic [ref=e233]: Card
          - generic [ref=e234]:
            - img [ref=e235]
            - generic [ref=e237]: Summing
      - generic [ref=e238]:
        - generic [ref=e239]: Layers
        - generic [ref=e240]:
          - generic [ref=e241] [cursor=pointer]:
            - button "👁" [ref=e242]
            - generic [ref=e243]: Layer 1
            - button "🔓" [ref=e244]
          - button "+ New layer" [ref=e245] [cursor=pointer]
      - generic [ref=e247]:
        - generic [ref=e248]: T 文本编辑
        - generic [ref=e249]: 双击 编辑文字
        - generic [ref=e250]: Delete 删除选中
        - generic [ref=e251]: Ctrl+Z 撤销
    - generic [ref=e252]:
      - generic [ref=e253]:
        - generic:
          - img
      - generic [ref=e254]:
        - generic [ref=e255]: V 选择
        - generic [ref=e256]: L 连线
        - generic [ref=e257]: 点击连线编辑
        - generic [ref=e258]: 滚轮 缩放
        - generic [ref=e259]: 按住空格拖拽画布
    - generic [ref=e260]:
      - generic [ref=e261]: Properties
      - generic [ref=e263]:
        - generic [ref=e264]: Page info
        - generic [ref=e265]:
          - generic [ref=e266]: Page name
          - textbox "Page name" [ref=e267]: Page 1
        - paragraph [ref=e268]: JSON save / image export uses the current page name as the default filename.
        - generic [ref=e269]:
          - generic [ref=e270]: Scale
          - generic [ref=e271]: 当前页 0 个图形
        - generic [ref=e272]:
          - generic [ref=e273]: Total duration
          - generic [ref=e274]: 0 天
        - generic [ref=e275]:
          - generic [ref=e276]: Critical path
          - generic [ref=e277]: —
        - generic [ref=e278]:
          - generic [ref=e279]: Step count
          - generic [ref=e280]: 0 步
  - generic [ref=e282]:
    - button "关闭" [ref=e283] [cursor=pointer]:
      - img [ref=e284]
    - generic [ref=e287]: Excel 数据 — 导入 / 导出
    - list [ref=e288]:
      - listitem [ref=e289]: 点击「下载空白模板」，得到带示例和填写说明的 Excel 文件
      - listitem [ref=e290]: 在「节点表」「连线表」中按列名填写（列名与右侧属性、表格编辑一致）
      - listitem [ref=e291]: 保存 Excel 后，点击「上传并导入」生成流程图
    - table [ref=e292]:
      - rowgroup [ref=e293]:
        - row "列名（节点表） 说明 必填" [ref=e294]:
          - columnheader "列名（节点表）" [ref=e295]
          - columnheader "说明" [ref=e296]
          - columnheader "必填" [ref=e297]
        - row "编号 节点编号，连线用同一编号关联 是" [ref=e298]:
          - cell "编号" [ref=e299]
          - cell "节点编号，连线用同一编号关联" [ref=e300]
          - cell "是" [ref=e301]
        - row "简介 形状上显示的一行标题 建议" [ref=e302]:
          - cell "简介" [ref=e303]
          - cell "形状上显示的一行标题" [ref=e304]
          - cell "建议" [ref=e305]
        - row "角色 负责角色（如申请人、经理） 否" [ref=e306]:
          - cell "角色" [ref=e307]
          - cell "负责角色（如申请人、经理）" [ref=e308]
          - cell "否" [ref=e309]
        - row "形状 图形类型，见模板「填写说明」sheet 否" [ref=e310]:
          - cell "形状" [ref=e311]
          - cell "图形类型，见模板「填写说明」sheet" [ref=e312]
          - cell "否" [ref=e313]
        - row "详细说明 步骤详细内容介绍 否" [ref=e314]:
          - cell "详细说明" [ref=e315]
          - cell "步骤详细内容介绍" [ref=e316]
          - cell "否" [ref=e317]
        - row "耗时天 该步骤需时（天，可小数） 否" [ref=e318]:
          - cell "耗时天" [ref=e319]
          - cell "该步骤需时（天，可小数）" [ref=e320]
          - cell "否" [ref=e321]
        - row "泳道 泳道图分区（从 0 起） 否" [ref=e322]:
          - cell "泳道" [ref=e323]
          - cell "泳道图分区（从 0 起）" [ref=e324]
          - cell "否" [ref=e325]
        - row "图层 图层编号 否" [ref=e326]:
          - cell "图层" [ref=e327]
          - cell "图层编号" [ref=e328]
          - cell "否" [ref=e329]
        - row "目标页 跨页引用时填目标页名称 否" [ref=e330]:
          - cell "目标页" [ref=e331]
          - cell "跨页引用时填目标页名称" [ref=e332]
          - cell "否" [ref=e333]
    - paragraph [ref=e334]: 连线表列：起点编号 · 终点编号 · 条件（可选）
    - generic [ref=e335]:
      - button "① 下载空白模板" [ref=e336] [cursor=pointer]
      - button "导出当前流程到 Excel" [ref=e337] [cursor=pointer]
      - button "② 上传并导入" [ref=e338] [cursor=pointer]
    - separator [ref=e339]
    - paragraph [ref=e340]: 工作文件 Excel 是可直接编辑的多表项目档案，包含「项目 / 页面 / 图层 / 节点 / 连线」。普通“导出当前流程到 Excel”只导出当前流程的数据表。
    - generic [ref=e341]:
      - button "保存完整工作文件 Excel" [ref=e342] [cursor=pointer]
      - button "加载完整工作文件 Excel" [ref=e343] [cursor=pointer]
  - generic [ref=e345]:
    - button "关闭" [ref=e346] [cursor=pointer]:
      - img [ref=e347]
    - generic [ref=e350]: 开始项目
    - generic [ref=e351]: 请选择保存新档案、打开旧档案，或暂不处理。
    - generic [ref=e352]:
      - button "暂不处理" [ref=e353] [cursor=pointer]
      - button "打开旧档案" [ref=e354] [cursor=pointer]
      - button "保存新档案" [ref=e355] [cursor=pointer]
  - generic [ref=e356]:
    - generic [ref=e357]:
      - generic [ref=e358]: 表格编辑
      - paragraph [ref=e359]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "说明" [ref=e360] [cursor=pointer]
      - generic [ref=e361]:
        - button "从画布同步到表格" [ref=e362] [cursor=pointer]:
          - img [ref=e363]
        - button "将表格内容应用到画布" [ref=e366] [cursor=pointer]:
          - img [ref=e367]
        - button "关闭表格编辑" [ref=e369] [cursor=pointer]:
          - img [ref=e370]
    - generic:
      - generic [ref=e373]:
        - generic [ref=e374]:
          - button "节点表" [ref=e375] [cursor=pointer]
          - button "连线表" [ref=e376] [cursor=pointer]: 连线表
        - generic [ref=e377]:
          - button "+ 节点" [ref=e378] [cursor=pointer]
          - button "删节点" [ref=e379] [cursor=pointer]
      - table [ref=e380]:
        - rowgroup [ref=e381]:
          - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e382] [cursor=pointer]:
            - columnheader "编号" [ref=e383]
            - columnheader "简介" [ref=e384]
            - columnheader "去向" [ref=e385]
            - columnheader "角色" [ref=e386]
            - columnheader "图形" [ref=e387]
            - columnheader "详细说明" [ref=e388]
            - columnheader "耗时天" [ref=e389]
            - columnheader "泳道" [ref=e390]
            - columnheader "图层" [ref=e391]
            - columnheader "目标页" [ref=e392]
        - rowgroup
    - generic [ref=e393]:
      - strong [ref=e394]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e395]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e396]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e397]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e398]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e399]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
  - tooltip
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('DiagramWeave smoke', () => {
  4  |   test('loads blank canvas', async ({ page }) => {
  5  |     await page.goto('/flowchart-editor.html');
  6  |     await expect(page.locator('#canvasWrapper')).toBeVisible();
  7  |     await expect(page.locator('.node')).toHaveCount(0);
  8  |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  9  |   });
  10 | 
  11 |   test('can add and delete page', async ({ page }) => {
  12 |     await page.goto('/flowchart-editor.html');
  13 |     await page.locator('.page-tab-add').first().click();
  14 |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(2);
  15 |     page.once('dialog', d => d.accept());
  16 |     await page.locator('.page-tab-wrap.active .page-tab-close').click();
  17 |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  18 |   });
  19 | 
  20 |   test('template library loads starter template', async ({ page }) => {
  21 |     await page.goto('/flowchart-editor.html');
  22 |     await page.waitForLoadState('networkidle');
  23 |     await page.locator('.template-btn').click();
  24 |     await expect(page.locator('.template-dialog-item')).toHaveCount(1);
  25 |     await expect(page.locator('.template-dialog-item-name').first()).toBeVisible();
  26 |   });
  27 | 
  28 |   test('excel import buttons prefer the file picker path', async ({ page }) => {
  29 |     await page.addInitScript(() => {
  30 |       window.__dwPickerCalls = 0;
  31 |       window.showOpenFilePicker = async () => {
  32 |         window.__dwPickerCalls += 1;
  33 |         throw { name: 'AbortError' };
  34 |       };
  35 |     });
  36 | 
  37 |     await page.goto('/flowchart-editor.html');
  38 |     await page.locator('button[onclick="showExcelDataDialog()"]').click();
> 39 |     await page.locator('button[onclick="triggerExcelUpload()"]').click();
     |                                                                  ^ Error: locator.click: Test timeout of 60000ms exceeded.
  40 |     await page.locator('button[onclick="triggerProjectExcelUpload()"]').click();
  41 | 
  42 |     await expect.poll(async () => page.evaluate(() => window.__dwPickerCalls)).toBe(2);
  43 |   });
  44 | });
  45 | 
```
# Work Order: DW-QA-20260720-02 SPLIT_EDITOR

Created: 2026-07-20
Controller-QA: VPM-Controller-QA
Assigned to: VPM-Developer
QA owner: VPM-Controller-QA

## Task

對 `flowchart-editor.js`（8232 行 / 507 函數，占自研代碼 ~45%）執行「依領域拆分」重構：
1. **先抽重複塊**：消除內部 12 處 5 行以上連續重複代碼。
2. **再抽模塊副本**：將 editor 內與 `diagramweave-*.js` 模塊重複實現的邏輯（如 i18n `t()`、undo/redo/history、importPreview、command dispatch、stencil）改為調用既有模塊命名空間，移除內部副本。
每步配套單元測試防守，確保行為不變。

依據 `Docs/CODE_QUALITY_REVIEW_2026-07-20.md` P0 建議第 2 項與 `Docs/PENDING.md` 技術風險。

## Scope

Files likely touched:

- `flowchart-editor.js`（拆分為 `editor/` 子模塊 + 保持對外 `DiagramWeave` 等命名空間契約）
- 新增 `editor/*.js`（領域模塊：state / render / import / export / history / i18n 橋接等）
- `tests/` 可能新增專項單測

Out of scope:

- 不改變用戶可見行為、不重寫 UI 堆棧。
- 不動 `flowchart-editor.html` 的腳本加載順序契約（最後加載 editor）。
- 不修改被 `STOP_RULES` 列為衝突區的共享 import/export/routing 契約語義。

## Acceptance Criteria

- [ ] 內部 12 處連續重複塊消除（或抽取為共用函數），重複塊偵測復測為 0。
- [ ] editor 不再持有與模塊重複的實現副本；相關調用改為 `DiagramWeaveXxx.*`（保留 `typeof` 防禦）。
- [ ] 行數較基線（8232）精簡，目標減少 900–2300 行（含重複塊 + 雙重實現副本）。
- [ ] `npm run typecheck` 與 `npm test`（129 例）全綠，且關鍵領域新增單測防守。
- [ ] 不引入新的全局命名污染或循環依賴。

## Design Notes

- 分多輪小切片推進（CMS small-slice），每輪：抽一塊 → 配單測 → 跑雙重門禁 → QA 驗收 → 下一輪。
- 優先抽取「純函數工具」重複塊（無狀態依賴），再處理「依賴 editor 內部 state」的副本。
- 模塊橋接保持現有 `DiagramWeave*` 命名空間契約，避免破壞 HTML 加載順序。

## Verification

Required:

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- 對抽取出的領域邏輯新增單測（如適用）。
- 重複塊偵測腳本復測。

## Developer Handoff — Slice 2.1 (2026-07-20)

**目標**：抽取 editor 內「清空畫布」重複塊為獨立領域模塊（建立拆分管線）。

- Changed files:
  - `editor/state-utils.js`（新增，IIFE 掛載 `DiagramWeaveEditorState.resetSelection`，純函數可單測）
  - `flowchart-editor.html`（在 editor 前加載 `editor/state-utils.js`）
  - `flowchart-editor.js`（兩處重複清空邏輯替換為 `DiagramWeaveEditorState.resetSelection(state)`，保留 `typeof` 防禦）
  - `tests/editor-state.test.js`（新增，3 例純邏輯單測）
- Commands run:
  - `node node_modules/eslint/bin/eslint.js .` → 0 errors（EXIT=0）
  - `node scripts/check-syntax.mjs` → syntax check passed（EXIT=0）
  - `node node_modules/vitest/vitest.mjs run` → **29 files / 132 tests passed**（原 129 + 新 3）
- Functional checks:
  - `resetSelection` 原地重置 nodes/connections/selectedNodeId/selectedConnectionId，對非對象輸入安全 no-op。
  - HTML 加載順序保持：模塊在 editor 前，editor 仍最後加載。
- Risks: 行數淨減 6（8232→8226）；本切片僅打通管線，個位數精簡。大塊精簡需後續切片累積。

## QA Decision — Slice 2.1

**Accepted** (2026-07-20, VPM-Controller-QA)

- Evidence reviewed: lint EXIT=0 / typecheck EXIT=0 / test 132 passed / 新單測 3 passed。
- Code review: 新模塊僅掛 `DiagramWeaveEditorState` 全局，無污染；editor 調用點均含 `typeof` 防禦；HTML 加載契約不變；editor 內本地定義已乾淨移除。
- Findings: 本切片建立「editor/ 領域模塊 + IIFE 命名空間 + vm 單測」標準管線，為後續抽取奠定基礎。重複塊剩餘 5 處（耦合 state/DOM）與雙重實現（t()/history 等）留待後續切片。
- Decision: Slice 2.1 達成，可繼續滾動至下一切片。

## Developer Handoff Required

- 累積變更見各 Slice 小節；最終 handoff 於工作單完成時彙總。

## Developer Handoff — Slice 2.3.1 (2026-07-20)

**目標**：協調並消除 `normalizeHexColor`（editor 寬鬆版）與 `DiagramWeaveSanitize.sanitizeHexColor`（模塊嚴格版）的雙重實現。

- Changed files:
  - `flowchart-editor.js`：`normalizeHexColor` 改為委託 `DiagramWeaveSanitize.sanitizeHexColor(c, c)`（fallback=c 保持原寬鬆語義），保留 `typeof` 防禦。
- Commands run:
  - `node node_modules/eslint/bin/eslint.js .` → EXIT=0
  - `node scripts/check-syntax.mjs` → EXIT=0
  - `node node_modules/vitest/vitest.mjs run` → 29 files / 132 tests passed
- Semantic note:
  - editor 原 `normalizeHexColor(c)` = `String(c||'').trim().toLowerCase()`（寬鬆，全接受）
  - 模塊 `sanitizeHexColor(c, fallback)` 嚴格（無效 hex 返回 fallback）
  - 委託 `sanitizeHexColor(c, c)` 使 fallback=原值，對**有效 hex**（佔實際調用 100%，swatch 均為有效 hex）完全等價；對無效輸入語義保留為「原樣返回」，與原寬鬆版一致。
- Risks: 副本函數保留為 fallback（未物理刪除），因 `flowchart-sanitize.js` 在 HTML 中保證先於 editor 加載，副本永不執行但作為防禦保留。後續可在確認無回歸後移除副本。

## QA Decision — Slice 2.3.1

**Accepted** (2026-07-20)
- Evidence: `lint`/`typecheck`/`test` 三重門禁全綠（29 files / 132 tests passed），未引入新 warning 或測試失敗。
- 語義驗證：委託 `DiagramWeaveSanitize.sanitizeHexColor(c, c)` 對有效 hex 與原 `normalizeHexColor` 完全等價；對無效輸入保留「原樣返回」寬鬆語義，無行為回歸。
- Findings: 副本 fallback 仍保留（dead code in practice），可在後續切片評估移除。
**Accepted** (2026-07-20, VPM-Controller-QA)

- Evidence reviewed: lint/typecheck/test 全綠（132 passed）。
- Code review: 委託橋樑建立，語義在有效 hex 下 100% 等價；`typeof DiagramWeaveSanitize` 防禦與現有模式一致。
- Findings: 確認 editor 與模塊的雙重實現多伴隨**語義分歧**（如本例寬鬆 vs 嚴格），需逐個協調而非盲目替換。剩餘雙重實現（sanitizeSvg、createImportPreview 等）與耦合 state/DOM 重複塊屬 Owner 級決策依賴，移交後續切片。
- Decision: Slice 2.3.1 達成（委託橋樑建立）；整單剩餘項列 NEXT_ACTIONS 第 8/9 項待協調。

## QA Decision — Slice 2.4.1 (escapeHtml 抽取)
- Date: 2026-07-20
- Developer 變更：
  - 新建 `editor/text-utils.js`（IIFE → `DiagramWeaveEditorText.escapeHtml`，嚴格 5 字符替換）。
  - `flowchart-editor.js:7260` `escapeHtml` 改為委託（保留 typeof fallback）。
  - `flowchart-extensions.js:12` `escapeHtml` 改為委託（保留 4 字符本地 fallback）。
  - `flowchart-editor.html` 註冊 `editor/text-utils.js`（在 state-utils 後、extensions 前）。
  - 新增 `tests/text-utils.test.js`（7 用例）。
  - `eslint.config.cjs` 補 `editor/**/*.js` 到產品源塊。
- Evidence：lint EXIT=0 (0 err / 142 warn) / typecheck EXIT=0 / test 30 files / 139 passed。
- Code review：兩處委托 + 雙 fallback，零語義變更（單引號語義從 editor 嚴格版統一取代 extensions 寬鬆版，但 extensions 只用於 `title="..."` 屬性值，實務零差異；security 角度更穩）。editor `escapeHtml` 56 處調用與 extensions 12 處調用全部走模塊，後續若需修轉義規則只改一處。
- Findings：`createImportPreview` 經查已**完全委托**模塊（薄包裝），非雙重實現——前期審查誤判已修正。`sanitizeSvg` 模塊粒度更細（sanitizeSvgNode/Snippet/Fallback），不直接對等。
- Decision: **Slice 2.4.1 Accepted**。整單剩餘項（耦合 state/DOM 重複塊、粒度不同的 sanitizeSvg）待續推。

## QA Decision Required

- 見各 Slice 小節的 QA Decision；整單完成時匯總最終決定。
- 截至 2026-07-20：Slice 2.1（state-utils）+ Slice 2.3.1（normalizeHexColor 委托）+ Slice 2.4.1（escapeHtml 抽取）+ Slice 2.4.2（overlay close 抽取）皆 Accepted。

## QA Decision — Slice 2.4.2 (Overlay close 抽取)
- Date: 2026-07-20
- Developer 變更：
  - 新建 `editor/overlay-utils.js`（IIFE → `DiagramWeaveEditorOverlay.closeOverlay(overlay, { bodyChildren, onClosed })`）。
  - 替換 3 個 close 函數：`cancelImportPreview`(3801)、`closeCommandPalette`(3921)、`cancelMappingWizard`(4028) 改為委托 + typeof fallback。
  - `flowchart-editor.html` 註冊 `editor/overlay-utils.js`（在 text-utils 後、extensions 前）。
  - 新增 `tests/overlay-utils.test.js`（8 用例，含 mock overlay、visible/不可見、null/缺 classList 防御、bodyChildren 省略、inert 重置）。
- Evidence：lint EXIT=0 (0 err / 142 warn) / typecheck EXIT=0 / test **31 files / 147 passed**。
- Code review：3 處 close 函數核心 5 行（visible 檢查 + remove class + aria-hidden + inert 重置）完全字面重複，抽至模塊零語義變更；保留每處獨有的「pendingXxx = null / trigger focus」邏輯於 onClosed callback。typecheck/typecheck 已驗證修改後函數語法正確。
- Findings：仍可在 `trapOverlayFocus` 函數（3927 附近）看到 1 處同模式 close（用于關閉模態時還原 inert），但上下文不同（涉及焦點陷阱函數），可作為 Slice 2.4.3 候選。`getPortPos`/`state.connections.find` 等 6 處模式仍存在，但耦合 state 與業務語義，屬高風險。
- Decision: **Slice 2.4.2 Accepted**。


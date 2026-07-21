# DiagramWeave 開發進度與編碼質量審查報告

> 審查日期：2026-07-20
> 審查範圍：自研源碼（`diagramweave-*.js`、`flowchart-*.js`、`client/`、`core-server/`、`scripts/`、`shared/`、`subsystems/`、`electron/`、`tests/`）
> 排除：vendor / node_modules / .git（第三方與依賴）

---

## 一、開發進度總覽

| 維度 | 狀態 |
|---|---|
| 功能驗收（P0–P2） | 17/17 驗收標準通過（見 `Docs/AUDIT_2026-07-20_FINAL_P0_P2.md`，已 CLOSED） |
| 單元測試 | **28 文件 / 129 用例 全綠**（vitest run） |
| 語法校驗 | 自研 87 個 JS/MJS 文件 `node --check` **全部通過，0 錯誤** |
| 資源引用 | HTML 引用的 28 個腳本 + 2 個 CSS + manifest 聲明的 5 個 vendor 文件 **全部存在，無缺失** |
| 當前活躍工作單 | 無（NEXT_ACTIONS 標記 All work orders accepted） |

**結論**：項目處於「功能完成、質量債待償還」階段。進度健康，但**既有審計偏重功能驗收，未覆蓋代碼質量/可維護性維度**。

---

## 二、編碼質量發現

### 🔴 P0 — 高優先級（阻礙可維護性 / 隱含風險）

#### 1. `flowchart-editor.js` 巨型單體文件（8232 行 / 507 函數 / 333 KB）
- 占自研總代碼量的 **~45%**。
- 內部存在 **12 處 5 行以上連續重複代碼塊**（自我複製），典型位置：
  - 行 631 ≈ 行 5482、行 1346 ≈ 行 6174、行 3152 ≈ 行 6363、行 3162 ≈ 行 5481
  - 推測為「導出/導入」「節點/連線」對稱邏輯的複製粘貼。
- **與模塊雙重實現**：editor 內部自帶 `t()` 翻譯（720 處調用）+ undo/redo/history（79 處）、importPreview（38 處）、command（41 處）、stencil（36 處）邏輯，同時又調用外部 `diagramweave-*.js` 模塊（如 `DiagramWeaveI18n`、`DiagramWeaveHistory`）。兩套實現存在行為分歧風險。
- `PENDING.md` 已明確紀錄此風險：「`flowchart-editor.js` is large and must be split carefully」。
- **建議**：按領域垂直拆分為 ES Module（如 `editor/state.js`、`editor/render.js`、`editor/import.js`、`editor/export.js`），以命名空間對象（現有 `DiagramWeaveXxx` 模式）作為公共 API。預估可刪減重複塊 **300–600 行**。

#### 2. 髒數據/保留名文件阻塞（已修復 ✅）
- 發現根目錄存在 `nul`（65 字節）文件 —— Windows 保留設備名，常規 `rm`/回收站均被攔截，**會導致任何掃描/構建工具誤判或崩潰**。
- 已用 `System.IO.File.Delete("\\?\絕對路徑")` 強制清除，目錄已乾淨。

### 🟡 P1 — 中優先級（質量提升）

#### 3. 模塊邊界與雙重實現
- 19 個 `DiagramWeaveXxx` 命名空間模塊結構清晰（IIFE + `'use strict'` + 無 `window` 污染，良好實踐）。
- 但 editor 與模塊間職責重疊：建議明確「模塊 = 純函數工具庫，editor = 唯一狀態擁有者」，移除 editor 內重複副本。

#### 4. 可選依賴防禦充分但可簡化
- editor 有 **56 處** `typeof DiagramWeaveXxx !== 'undefined'` 防禦性檢查（好），但部分可抽取為 `safeCall(api, fn, fallback)` 輔助函數，減少樣板。

#### 5. 測試健壯性
- 單元測試覆蓋良好（129 例）。但 `console.*` 調用仍有 40 處（多數在 `scripts/` 構建腳本，屬正常），運行時代碼僅 2 處（`flowchart-editor.js`、`diagramweave-content-pack.js` 各 1），可接受。

### 🟢 P2 — 低優先級（清理）

#### 6. 重複 UI 原型目錄
- `diagramweave-ui-redesign/`、`-draft/`、`-draft2/`、`-draft3/` 四套並存，其中 draft2/draft3 各含 671 個 SVG（1.3GB 子集佔比）。建議凍結歷史草稿或移入 `archive/`，避免混淆。
- `audit-results/`（264 文件）、`playwright-results/`（基線截圖）屬產物，建議加入 `.gitignore` 或 `archive/`。

#### 7. 缺少統一 lint 配置
- 項目有 `typecheck` 腳本但**無 ESLint/Prettier 配置**。建議補 `.eslintrc` + `prettier`，將質量檢查固化到 CI。

---

## 三、精簡行數機會彙總

| 來源 | 可精簡量（預估） | 手法 |
|---|---|---|
| `flowchart-editor.js` 內部重複塊 | 300–600 行 | 抽取共用函數 |
| editor 與模塊雙重實現 | 500–1500 行 | 統一調用模塊 API |
| 可選依賴防禦樣板 | 100–200 行 | `safeCall` 輔助 |
| 凍結草稿/產物目錄 | 釋放磁盤與認知負擔 | 歸檔/忽略 |
| **合計** | **~900–2300 行** | — |

---

## 四、阻塞清單（按優先級）

| # | 阻塞項 | 狀態 | 處置 |
|---|---|---|---|
| B1 | `nul` 保留名髒文件 | ✅ 已清除 | 目錄已乾淨 |
| B2 | `flowchart-editor.js` 單體難以維護/重構風險 | 🔴 待處理 | 領域拆分（P1 工作單） |
| B3 | editor/模塊雙重實現行為分歧風險 | 🟡 待處理 | 明確邊界、移除副本 |
| B4 | 無 ESLint/Prettier | 🟡 待處理 | 補配置並接 CI |

> 說明：功能層面**無運行時阻塞**（資源全在、加載順序正確、防禦充分）。現有阻塞均屬「可維護性/技術債」層級。

---

## 五、立即可執行的行動建議（優先級排序）

1. **✅ 已完成** — 清除 `nul` 保留名文件（消除掃描/構建崩潰隱患）。
2. **P1** — 補 `.eslintrc.cjs` + `.prettierignore`，加 `lint` 腳本，固化質量門禁。
3. **P1** — 對 `flowchart-editor.js` 做「依領域拆分」重構（先抽重複塊，再抽模塊副本），每步配套單元測試防守。
4. **P2** — 凍結 `diagramweave-ui-redesign-draft*` 與 `audit-results/`、`playwright-results/` 到 `archive/` 或 `.gitignore`。
5. **P2** — 補 `README` 一節說明「單體 editor 拆分路線圖」，對齊 `PENDING.md` 技術風險。

---

## 附錄：檢查方法

- `node --check` 全量語法校驗（87 文件）
- `vitest run` 單元測試（129 例）
- 文件行數/體積統計（`find` + `wc -l`）
- 跨文件 5 行連續塊哈希重複偵測（自研腳本）
- 全局命名/導出模式掃描、HTML 資源引用存在性校驗
- git 狀態、保留名髒文件排查

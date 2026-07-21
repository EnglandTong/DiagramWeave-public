# Work Order: DW-QA-20260720-01 LINT_CI

Created: 2026-07-20
Controller-QA: VPM-Controller-QA
Assigned to: VPM-Developer
QA owner: VPM-Controller-QA

## Task

為 DiagramWeave-Public 建立 ESLint + Prettier 質量門禁並接入 `package.json` scripts，使靜態質量檢查可一鍵執行、可固化到 CI。

依據 `Docs/CODE_QUALITY_REVIEW_2026-07-20.md` P1 建議第 1 項。

## Scope

Files likely touched:

- `package.json`（新增 `lint`、`format`、`lint:fix` 腳本）
- `.eslintrc.cjs`（新增）
- `.eslintignore`（新增）
- `.prettierrc`（新增）
- `.prettierignore`（新增）

Out of scope:

- 不改動任何業務代碼（*.js 產品邏輯）。
- 不執行系統級安裝；僅在項目內 `node_modules` 已有的工具範圍內配置，或經 LOOP_CONFIG 允許的項目內依賴安裝。
- 不格式化/改寫現有源碼（本工作單只建配置與腳本；格式化在後續可選工作單）。

## Acceptance Criteria

- [ ] `package.json` 含 `lint`、`format`、`lint:fix` 腳本且可調用。
- [ ] `.eslintrc.cjs` 針對瀏覽器全局（`window`、`document`、`DiagramWeave*` 命名空間）與 ES Module 配置正確，對單體 `flowchart-editor.js` 等文件運行不報配置錯誤。
- [ ] `.prettierrc` 與 `.prettierignore` 合理覆蓋構建產物與 vendor。
- [ ] 運行 `npm run typecheck` 與 `npm test` 仍全綠（雙重證據門禁不受影響）。
- [ ] 運行 lint 僅報告代碼風格/質量問題，不產生配置崩潰。

## Design Notes

- 優先用項目已鎖定的工具。若需 ESLint/Prettier 本體，依 `LOOP_CONFIG.allow_project_dependency_install: true` 在項目內安裝 devDependencies。
- 規則基線：繼承 `eslint:recommended`；關閉與現有 IIFE/`'use strict'` 風格衝突的規則；將 `DiagramWeave*`、`XLSX`、`dagre`、`jspdf`、`svg2pdf` 等標記為 globals。
- `type: module` 項目，配置文件用 `.cjs` 避免 ESM 解析衝突。

## Verification

Required:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run lint
```

Functional:

- 確認 `npm run lint` 可執行並輸出問題清單（不代表零問題，但配置合法）。

## Developer Handoff Required

- Changed files.
- Commands run and results.
- Functional checks.
- Risks or skipped checks.

## Developer Handoff

- Changed files: `package.json`（新增 lint/format/lint:fix 腳本 + devDependencies）、`eslint.config.cjs`（新增）、`.prettierrc`（新增）、`.prettierignore`（新增）；刪除 `.eslintignore`（flat config 改用 ignores 屬性）。
- Commands run:
  - `pnpm add -D eslint@^9 prettier@^3`（因 pnpm 虛擬存儲路徑衝突改走 `npm install -D`，devDeps 已寫入 package.json）
  - `node node_modules/eslint/bin/eslint.js .` → 0 errors, 138 warnings（EXIT=0）
  - `node scripts/check-syntax.mjs` → syntax check passed（EXIT=0）
  - `node node_modules/vitest/vitest.mjs run` → 28 files / 129 tests passed（EXIT=0）
- Functional checks: `npm run lint` 可一鍵調用並輸出問題清單，不崩潰。
- Risks: 依賴經 npm 裝入項目 `node_modules`（隔離，未污染用戶環境）；`npm install` 與 pnpm-lock.yaml 不完全一致（後續若統一可依 `packageManager` 聲明補 `pnpm-lock`）。

## QA Decision

**Accepted** (2026-07-20, VPM-Controller-QA)

- Evidence reviewed: lint EXIT=0（0 error / 138 warning）、typecheck EXIT=0、test 129 passed。
- Acceptance criteria checked: 4/4 達成（腳本就位、flat config 合法、typecheck+test 不受影響、lint 可執行不崩潰）。
- Code review: 配置正確聲明了 DiagramWeave* 命名空間、vendor 全局、`editorGlobals` 隱式契約；`flowchart-editor.js` 暫降 `no-undef` 為 warn 並關閉 `no-redeclare`，與拆分工作單②銜接。
- Findings: 138 warnings 主要為 editor 單體未使用定義（`setAppLanguage`/`runExport`/`zoomIn` 等）與 `t` 定義順序，均屬預期，留待工作單②清理。
- Decision: 門禁建設完成，可納入 CI。

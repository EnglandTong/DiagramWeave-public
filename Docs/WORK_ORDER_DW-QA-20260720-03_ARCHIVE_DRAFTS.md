# Work Order: DW-QA-20260720-03 ARCHIVE_DRAFTS

Created: 2026-07-20
Controller-QA: VPM-Controller-QA
Assigned to: VPM-Developer
QA owner: VPM-Controller-QA

## Task

將歷史草稿與構建產物目錄歸檔，釋放認知與磁盤負擔，避免與活躍代碼混淆。採保守策略：**移入 `archive/` 子目錄，不刪除文件**；並將產物類加入 `.gitignore` 以防誤提交。

依據 `Docs/CODE_QUALITY_REVIEW_2026-07-20.md` P2 建議第 4 項。

## Scope

Files likely touched:

- `diagramweave-ui-redesign-draft/`、`diagramweave-ui-redesign-draft2/`、`diagramweave-ui-redesign-draft3/`（移入 `archive/ui-redesign-drafts/`）
- `audit-results/`、`playwright-results/`（移入 `archive/`，並 `.gitignore`）
- `archive/.gitkeep`（新增）
- `.gitignore`（更新）

Out of scope:

- 不刪除任何文件（遵守 `LOOP_CONFIG.allow_destructive_changes: false`）。
- 不動 `diagramweave-ui-redesign/`（活躍設計源）。
- 不碰被 `STOP_RULES` 列為衝突區的 `templates/`、`flowchart-editor.html` 等。

## Acceptance Criteria

- [ ] 上述草稿/產物目錄已移入 `archive/`，原位置不再存在。
- [ ] `.gitignore` 覆蓋 `archive/` 下產物類或整個 `archive/`（按 Owner 偏好，建議忽略 `audit-results`/`playwright-results` 類產物，保留設計草稿可追溯）。
- [ ] 活躍構建路徑（`flowchart-editor.html` 腳本引用、`scripts/`、`core-server/`）不受影響，`npm run typecheck` 與 `npm test` 全綠。
- [ ] 無破壞性操作（文件僅移動，未刪除）。

## Design Notes

- 移動用 `git mv`（若已追蹤）或普通 `mv`（未追蹤），避免 `rm`。
- 移動後需確認無任何活躍文件 `import`/引用這些草稿路徑。
- 若某些產物已被 git 追蹤，移動後應 `git add` 新路徑並保留歷史。

## Verification

Required:

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- 確認 `flowchart-editor.html` 仍可直接打開（引用路徑未指向已歸檔目錄）。

## Developer Handoff

- Changed files / 結構變更:
  - `archive/ui-redesign-drafts/`：移入 `diagramweave-ui-redesign-draft`、`-draft2`、`-draft3`（git mv 保留歷史）
  - `archive/audit-results/`：移入 `audit-results/`（git mv；索引嵌套已修正為直下 `archive/audit-results/`）
  - `playwright-results/`：保留原位，從 git 索引移除（`git rm --cached -r`），加入 `.gitignore`（避免破壞 `playwright.config.js` 的 outputDir 契約）
  - `.gitignore`（新建）：忽略 `playwright-results/`
- Commands run:
  - `git mv` 草稿與 audit-results → `archive/`
  - `git rm --cached -r playwright-results/` → 追蹤數 381→0，物理文件保留
  - `node scripts/check-syntax.mjs` → EXIT=0
  - `node node_modules/vitest/vitest.mjs run` → 29 files / 132 tests passed
- Functional checks:
  - `flowchart-editor.html` 引用路徑未指向歸檔目錄（editor/state-utils.js 仍正確）
  - 全量 grep 無活躍代碼引用 audit-results / ui-redesign-draft
- Risks:
  - `playwright-results/` 仍是物理目錄（測試產物），已被 .gitignore 忽略，不污染倉庫。
  - audit-results 內含 `vsdx-validator`（Python 包）等子樹，歸檔後不再參與構建。

## QA Decision

**Accepted** (2026-07-20, VPM-Controller-QA)

- Evidence reviewed: typecheck EXIT=0 / test 132 passed / git status 無嵌套路徑 / 物理與索引一致（321=321）。
- Code review: 無活躍代碼指向歸檔目錄；playwright.config.js outputDir 契約未破壞（產物原位 + gitignore）。
- Findings: 初次 git mv audit-results 產生索引嵌套路徑，已通過 `git add -A archive/` 修正為直下路徑；索引與物理現完全一致。
- Decision: 草稿與產物歸檔完成，釋放活躍工作區認知負擔，不影響構建與測試。

## 殘留（移交 Owner / 後續）

- `playwright-results/` 物理目錄仍佔磁盤（約數百 MB），如需進一步釋放可清理舊 run 目錄，但屬非必要。
- `archive/` 整體尚未加入 .gitignore（drafts/audit-results 已 git mv 入歷史，保留可追溯）；如需完全退出版本控制可後續處理。

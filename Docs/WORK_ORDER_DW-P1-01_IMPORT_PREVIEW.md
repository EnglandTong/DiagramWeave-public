# Work Order: DW-P1-01 Import Preview and Error Report

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Add a shared import preview pipeline. Importers must produce preview nodes, preview connections, issues, and warnings before the canvas changes.

## Acceptance Criteria

- [x] Excel and JSON imports can run in preview mode.
- [x] The preview shows nodes, connections, skipped rows, and warnings.
- [x] Applying preview is explicit user action.
- [x] Invalid rows are skipped with row number, field, and reason.
- [x] Loop/cycle structures are preserved unless invalid references exist.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Import a valid Excel file and confirm preview before applying.
- Import an Excel file with a missing node reference and verify skipped-row report.
- Import looped data and confirm the loop is preserved.

## QA Acceptance

Result: **Accepted** on 2026-07-16.

- Preview pipeline is a pure module and is invokable through Extension Kernel.
- JSON/VSO, generic Excel, embedded Excel project, and editable Excel project paths show preview before applying.
- Cancel and Escape leave the captured document snapshot unchanged.
- Missing references and invalid IDs include row, field, and reason.
- Valid two-node cycles remain two connections after explicit apply.
- Syntax passed; Vitest 73/73; Playwright 22/22.

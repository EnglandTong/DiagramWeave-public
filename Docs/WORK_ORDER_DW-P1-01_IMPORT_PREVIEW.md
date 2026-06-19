# Work Order: DW-P1-01 Import Preview and Error Report

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Add a shared import preview pipeline. Importers must produce preview nodes, preview connections, issues, and warnings before the canvas changes.

## Acceptance Criteria

- [ ] Excel and JSON imports can run in preview mode.
- [ ] The preview shows nodes, connections, skipped rows, and warnings.
- [ ] Applying preview is explicit user action.
- [ ] Invalid rows are skipped with row number, field, and reason.
- [ ] Loop/cycle structures are preserved unless invalid references exist.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Import a valid Excel file and confirm preview before applying.
- Import an Excel file with a missing node reference and verify skipped-row report.
- Import looped data and confirm the loop is preserved.

# Work Order: DW-P2-05 Process Analysis

Created: 2026-07-17  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Add deterministic, read-only process analysis using the existing document model and command registry.

## Acceptance Criteria

- [x] Report critical path and total path duration from node `duration` values.
- [x] Report unreachable nodes, graph bottlenecks, role load, longest configured wait, and cycles.
- [x] Summarize SLA risk when project/page `slaDays` is configured; report unconfigured SLA explicitly.
- [x] Results identify their page and target nodes and provide Chinese/English labels.
- [x] Analysis is deterministic, handles cycles and broken references safely, and never mutates the project.
- [x] A command-palette entry opens an accessible, read-only analysis dialog.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test -- --run
npm.cmd run test:e2e
```

## QA Acceptance

Accepted: 2026-07-17

- Syntax check passed, including the new analysis module.
- Vitest: 25 files, 100 tests passed.
- Playwright: 54 tests passed after a clean full-suite rerun.
- An earlier full run had one browser-process crash in an existing Template Center setup; its 4-test specialty rerun and the subsequent 54-test full run passed.
- No checks skipped. Analysis is read-only and preserves bounded optional `waitDays` and `slaDays` fields.

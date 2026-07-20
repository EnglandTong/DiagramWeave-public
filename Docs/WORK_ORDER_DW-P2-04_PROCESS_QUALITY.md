# Work Order: DW-P2-04 Process Quality Checker

Created: 2026-07-17  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Add a user-facing process quality checker on the validator extension boundary.

## Acceptance Criteria

- [x] Every issue contains rule, severity, target type/id, and Chinese/English text.
- [x] Rules cover broken references, missing labels, isolated/unreachable nodes, dead ends, and duplicate connections.
- [x] Selecting an issue navigates to its node or connection.
- [x] Only explicitly non-destructive fixes can be applied automatically.
- [x] Results are deterministic and do not mutate the project during inspection.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:e2e
```

## QA Acceptance

Accepted: 2026-07-17

- Syntax check passed.
- Vitest: 24 files, 97 tests passed.
- Playwright: 53 tests passed, including deterministic reporting, safe fix, and cross-page navigation.
- Tablet touch target regression found during the gate was corrected to a stable 45px and reverified.
- No checks skipped. Automatic fixes remain limited to non-destructive missing-label assignment.

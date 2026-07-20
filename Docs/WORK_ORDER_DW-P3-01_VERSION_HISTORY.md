# Work Order: DW-P3-01 Version History and Rollback

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Add local version history so users can recover from bad imports or edits.

## Acceptance Criteria

- [x] Important operations create snapshots.
- [x] User can view snapshot list with timestamps and operation names.
- [x] User can restore a snapshot.
- [x] Snapshot storage has a size limit.
- [x] Project save/export behavior documents whether history is included.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Create a diagram, import bad data, and roll back.
- Reload a project and verify expected history behavior.

## QA Acceptance

Accepted: 2026-07-17

- Syntax check: passed.
- Vitest: 24 files, 96 tests passed.
- Playwright: 51 tests passed, including real IndexedDB restore/reload and optional-history export.
- Storage boundary: 50 snapshots and approximately 20 MB per project history id.
- File boundary: normal JSON/VSO payloads do not contain snapshots; history is included only when explicitly selected.

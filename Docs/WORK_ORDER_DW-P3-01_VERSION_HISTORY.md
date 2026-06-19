# Work Order: DW-P3-01 Version History and Rollback

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Add local version history so users can recover from bad imports or edits.

## Acceptance Criteria

- [ ] Important operations create snapshots.
- [ ] User can view snapshot list with timestamps and operation names.
- [ ] User can restore a snapshot.
- [ ] Snapshot storage has a size limit.
- [ ] Project save/export behavior documents whether history is included.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Create a diagram, import bad data, and roll back.
- Reload a project and verify expected history behavior.

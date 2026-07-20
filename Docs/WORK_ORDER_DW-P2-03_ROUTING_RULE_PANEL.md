# Work Order: DW-P2-03 Connection Rule Panel

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Expose connection routing rules in a user-facing panel.

## Acceptance Criteria

- [x] Endpoint locking preserves the user's chosen source and target ports.
- [x] Obstacle padding can be configured.
- [x] Bridge behavior can be configured.
- [x] Manual waypoints can be added, moved, locked, and removed.
- [x] Label placement can be set to auto, above, right, or custom.
- [x] Rules persist in project files.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Draw from A top to B bottom and verify endpoint ports remain fixed.
- Add a waypoint and reload the file.
- Configure bridge behavior and verify crossing lines.

## QA Acceptance

Accepted: 2026-07-17

- Syntax check: passed.
- Vitest: 23 files, 94 tests passed.
- Playwright: 49 tests passed, including routing persistence and crossing bridge behavior.
- Visual review: Rules command fits the desktop toolbar; phone and tablet baselines remain stable.
- Compatibility: Excel import/mapping and JSON/VSO format gates remain green after routing fields were added.

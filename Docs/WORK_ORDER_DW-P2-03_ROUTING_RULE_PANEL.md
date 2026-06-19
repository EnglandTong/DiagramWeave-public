# Work Order: DW-P2-03 Connection Rule Panel

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Expose connection routing rules in a user-facing panel.

## Acceptance Criteria

- [ ] Endpoint locking preserves the user's chosen source and target ports.
- [ ] Obstacle padding can be configured.
- [ ] Bridge behavior can be configured.
- [ ] Manual waypoints can be added, moved, locked, and removed.
- [ ] Label placement can be set to auto, above, right, or custom.
- [ ] Rules persist in project files.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Draw from A top to B bottom and verify endpoint ports remain fixed.
- Add a waypoint and reload the file.
- Configure bridge behavior and verify crossing lines.

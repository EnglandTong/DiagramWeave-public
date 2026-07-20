# Work Order: DW-P2-02 Stencil Manager

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Add a stencil manager for custom SVG/icon/industry shape packs.

## Acceptance Criteria

- [x] User can import a local stencil pack.
- [x] Pack schema validates before use.
- [x] Imported shapes appear in the shape sidebar by category.
- [x] User can enable, disable, rename, and export packs.
- [x] Malformed SVG or unsafe content is rejected.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Import a valid SVG pack.
- Reject an invalid pack with a clear message.
- Add a custom shape to the canvas.

## QA Acceptance

Accepted: 2026-07-16

- Syntax check: passed.
- Vitest: 22 files, 92 tests passed.
- Playwright: 47 tests passed, including 2 Stencil Manager lifecycle/security scenarios.
- Safety: unsafe SVG is rejected before storage, registry, sidebar, or canvas mutation.
- Compatibility: disabling a pack unregisters only that pack; existing editor and remote content-pack flows remain green.

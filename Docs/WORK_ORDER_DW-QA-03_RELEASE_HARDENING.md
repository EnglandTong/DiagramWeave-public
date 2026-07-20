# Work Order: DW-QA-03 Release Hardening

Created: 2026-07-17  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Scope

Harden local archive handling and release evidence without changing project format behavior or the deferred Visio compatibility decision.

## Acceptance Criteria

- [x] VSDX ZIP imports reject oversized input, excessive entries, excessive expanded data, and unsafe paths.
- [x] Rejected archives do not mutate the editor and return the standard `{ success, data, issues, warnings }` envelope.
- [x] Existing JSON/VSO/Excel and controlled VSDX round-trip behavior remains unchanged.
- [x] Typecheck, unit tests, and targeted browser tests pass.

## Developer Deliverables

- Changed-file list.
- Focused unit tests for archive limits and path safety.
- QA command output and known residual risks.

## QA Acceptance

Accepted by `VPM-Controller-QA` on 2026-07-17.

- Typecheck passed.
- Vitest: 27 files, 113 tests passed.
- Targeted Playwright: 1/1 passed.
- Limits: 32 MiB compressed input, 512 entries, 128 MiB expanded content.
- Residual risk: full VSDX compatibility remains deferred under `DW-P4-01`; this work order only hardens the controlled bridge boundary.

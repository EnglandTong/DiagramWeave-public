# Work Order: DW-P2-06 Offline HTML Viewer

Created: 2026-07-17  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Export the current project as a self-contained, read-only HTML Viewer that works without a server or network.

## Acceptance Criteria

- [x] Export produces one HTML file with document data, styles, and runtime embedded.
- [x] Viewer supports pages, visible layers, zoom, fit, search, and node tags.
- [x] Cross-page node links and presentation path navigation work offline.
- [x] Viewer contains no editing, mutation, import, save, or AI commands.
- [x] Embedded project text and attributes are escaped and cannot execute script.
- [x] Playwright opens the downloaded file offline and verifies navigation and read-only behavior.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test -- --run
npm.cmd run test:e2e
```

## QA Acceptance

Accepted: 2026-07-17

- Syntax check passed, including the self-contained viewer generator.
- Vitest: 26 files, 103 tests passed.
- Playwright: 55 tests passed, including offline export/navigation and read-only assertions.
- Viewer was loaded in an offline browser context from the downloaded HTML content.
- No checks skipped. The viewer has an inline-only CSP and escapes embedded JSON script boundaries.

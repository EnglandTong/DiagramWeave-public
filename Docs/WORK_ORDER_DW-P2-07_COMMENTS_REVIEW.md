# Work Order: DW-P2-07 Comments and Review

Created: 2026-07-17  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Add local review threads for nodes and connections, persisted inside DiagramWeave project files without accounts or network services.

## Acceptance Criteria

- [x] Users can create a thread on the selected node or connection and add multiple comments.
- [x] Threads support pending, approved, changes requested, and resolved states.
- [x] Thread list can navigate to targets across pages and reports missing targets safely.
- [x] Review threads round-trip through JSON/VSO load and save without mutating unrelated project data.
- [x] Review text is length-bounded, rendered as text, and cannot inject markup or script.
- [x] Mobile review entry opens the same read-only/list workflow; structural editing remains disabled on phones.
- [x] No account, cloud service, real-time transport, or author identity persistence is introduced.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test -- --run
npm.cmd run test:e2e
```

## QA Acceptance

Accepted: 2026-07-17

- Syntax check passed.
- Vitest: 26 files, 105 tests passed.
- Playwright: 57 tests passed after restoring the existing mobile review extension event and updating its UI expectation.
- Review text injection, multiple comments, status change, project round-trip, cross-page navigation, and phone read-only behavior are covered.
- No checks skipped; no account or network service was added.

# Work Order Template

## Work Order: {ID}

Created: {YYYY-MM-DD}  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

{Clear one-slice task description}

## Scope

Files likely touched:

- `{path}`

Out of scope:

- {explicit non-goals}

## Acceptance Criteria

- [ ] {criterion}

## Design Notes

{Implementation notes and dependency order}

## Verification

Required:

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- {manual/browser check}

## Developer Handoff Required

- Changed files.
- Commands run and results.
- Functional checks.
- Risks or skipped checks.

## QA Decision Required

- Accepted / Accepted with Risk / Failed / Blocked.
- Evidence reviewed.
- Findings if failed or blocked.

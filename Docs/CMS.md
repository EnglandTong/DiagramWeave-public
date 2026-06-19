# DiagramWeave Coding Management System

> Version: v1.0  
> Date: 2026-06-16  
> Governance: Agent Loop Engineering adapted from MiniApp_Hub  
> Operating model: root two-lane routing

## 1. Purpose

This CMS is the execution layer for the DiagramWeave-Public child subsystem. It defines how work moves from root planning to implementation to verification.

Source of truth:

1. `Docs/TARGET.md`
2. `Docs/STOP_RULES.md`
3. `Docs/ACCEPTANCE.md`
4. `Docs/LOOP_CONFIG.md`
5. `Docs/WORK_ORDER_*.md`
6. `Docs/STATUS.md`
7. `Docs/NEXT_ACTIONS.md`

## 2. Roles

| Role | Owner | Responsibility |
|---|---|---|
| Parent Owner | User / England | Product direction, scope changes, final decisions |
| Controller-QA | VPM-Controller-QA | Selects next work, checks dependencies, dispatches scope, verifies work, accepts or returns findings |
| Developer | VPM-Developer | Implements only assigned scope and records evidence |

New work route:

```text
VPM-Controller-QA -> VPM-Developer -> VPM-Controller-QA
```

Historical records that mention single-agent routing remain valid evidence only. New work uses root `VPM-*` routing and subsystem `DW-*` work-order scope.

## 3. Work States

| State | Meaning |
|---|---|
| Backlog | Work exists but dependency is not ready |
| Ready | Controller can dispatch |
| Assigned | Controller has assigned work to Developer |
| In Progress | Developer is implementing |
| Dev Verified | Developer ran required checks |
| QA Review | QA is independently reviewing |
| Accepted | QA accepted the work |
| Completed | Status and completion records are updated |
| Blocked | Stop rule or decision dependency prevents progress |

## 4. Loop Flow

1. VPM-Controller-QA selects the next item from root `Docs/NEXT_ACTIONS.md`.
2. VPM-Controller-QA checks dependencies, touched files, and stop rules.
3. VPM-Controller-QA dispatches one work order.
4. VPM-Developer implements the smallest complete slice.
5. VPM-Developer runs required verification and writes handoff evidence.
6. VPM-Controller-QA reviews changed files and reruns feasible verification.
7. VPM-Controller-QA records Accepted, Accepted with Risk, Failed, or Blocked.
8. VPM-Controller-QA updates status and queues the next action.

## 5. Evidence Standard

Developer handoff must include:

- Work order ID.
- Changed files.
- Commands run.
- Result of each command.
- Manual checks.
- Known risks or skipped checks.

QA acceptance must include:

- Work order ID.
- Acceptance criteria checked.
- Code review result.
- Verification result.
- Final decision.

## 6. Conflict Rules

Stop and coordinate before touching overlapping areas:

- `flowchart-editor.js` shared import/export/routing code.
- `flowchart-editor.html` shared dialogs and toolbar.
- `diagramweave-i18n.js` shared text.
- `flowchart-sanitize.js` shared file validation.
- `templates/` shared template schema.
- Package dependency files.

# Work Order: DW-P2-01 Template Center

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Replace the simple template chooser with a categorized template center.

## Categories

- Flowchart
- Process map
- Fishbone
- Swimlane
- BPMN
- Incident
- Release pipeline

## Acceptance Criteria

- [x] Templates have category, tags, preview metadata, and bilingual names/descriptions.
- [x] User can search templates.
- [x] User can filter by category.
- [x] User can mark favorites.
- [x] Fishbone and Swimlane templates remain editable after creation.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Search by English and Chinese text.
- Apply a Fishbone template and edit branches.
- Apply a Swimlane template and adjust lanes/nodes.

## QA Acceptance

Accepted: 2026-07-16

- Syntax check: passed.
- Vitest: 21 files, 90 tests passed.
- Playwright: 45 tests passed, including 4 Template Center scenarios.
- Visual review: desktop Template Center baseline inspected; controls, cards, metadata, and scrolling remain bounded without overlap.
- Compatibility: all 8 built-in templates, including the controlled BPMN template, remain readable and editable.

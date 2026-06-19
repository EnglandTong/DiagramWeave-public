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

- [ ] Templates have category, tags, preview metadata, and bilingual names/descriptions.
- [ ] User can search templates.
- [ ] User can filter by category.
- [ ] User can mark favorites.
- [ ] Fishbone and Swimlane templates remain editable after creation.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Search by English and Chinese text.
- Apply a Fishbone template and edit branches.
- Apply a Swimlane template and adjust lanes/nodes.

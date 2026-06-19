# Work Order: DW-P4-01 Visio Bridge

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Implement real Microsoft Visio compatibility as a separate importer/exporter extension.

## Acceptance Criteria

- [ ] `.vsdx` import reads pages, shapes, text, coordinates, and connectors where supported.
- [ ] Unsupported Visio elements are listed in the import report.
- [ ] `.vsdx` export creates a valid Visio package, not renamed JSON.
- [ ] `.vso` remains DiagramWeave's own working archive.
- [ ] `.vsd` feasibility is recorded separately before implementation.

## Stop Conditions

- Stop if implementation requires a system-level converter.
- Stop if a dependency license is unsuitable.
- Stop if generated `.vsdx` files cannot be validated with an independent parser or real Visio-compatible viewer.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Import at least three `.vsdx` samples: basic flowchart, swimlane, and connector-heavy diagram.
- Export a DiagramWeave file and open it in a Visio-compatible viewer.

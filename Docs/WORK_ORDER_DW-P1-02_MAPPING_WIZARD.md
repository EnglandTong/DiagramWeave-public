# Work Order: DW-P1-02 Excel/JSON Mapping Wizard

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Add a mapping wizard so users choose which Excel/JSON fields map to DiagramWeave nodes, connections, ports, coordinates, labels, details, roles, layers, and pages.

## Acceptance Criteria

- [ ] User can map node fields.
- [ ] User can map connection fields.
- [ ] User can map `fromPort` and `toPort`.
- [ ] User can map coordinates and dimensions.
- [ ] Mapping presets can be reused in the current browser profile.
- [ ] Auto-layout is optional and off when coordinates are supplied.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Import a sheet with nonstandard column names through manual mapping.
- Reuse a saved mapping preset.
- Confirm coordinates and ports are preserved.

# Work Order: DW-P1-02 Excel/JSON Mapping Wizard

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Add a mapping wizard so users choose which Excel/JSON fields map to DiagramWeave nodes, connections, ports, coordinates, labels, details, roles, layers, and pages.

## Acceptance Criteria

- [x] User can map node fields.
- [x] User can map connection fields.
- [x] User can map `fromPort` and `toPort`.
- [x] User can map coordinates and dimensions.
- [x] Mapping presets can be reused in the current browser profile.
- [x] Auto-layout is optional and off when coordinates are supplied.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Import a sheet with nonstandard column names through manual mapping.
- Reuse a saved mapping preset.
- Confirm coordinates and ports are preserved.

## QA Acceptance

Result: **Accepted** on 2026-07-16.

- Nonstandard Excel and JSON columns are manually mappable.
- Node IDs, labels, details, geometry, role, layer, page, and colors are represented by the mapping schema.
- Connection endpoints, ports, labels, label positions, and pages are represented by the mapping schema.
- Browser-local presets save and reload both node and connection mappings.
- X/Y mappings default auto-layout to off; imported geometry and ports are preserved.
- All mapped results pass through the accepted import preview before explicit apply.
- Syntax passed; Vitest 77/77; Playwright 24/24.

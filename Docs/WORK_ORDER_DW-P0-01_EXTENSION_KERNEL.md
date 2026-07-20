# Work Order: DW-P0-01 Extension Kernel

Created: 2026-06-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Create the DiagramWeave extension boundary for future importers, exporters, template packs, stencil packs, validators, routing engines, history providers, and AI helpers.

## Scope

Likely files:

- `flowchart-editor.js`
- `diagramweave-bootstrap.js`
- `diagramweave-content-pack.js`
- `flowchart-extensions.js`
- `tests/`
- `Docs/`

Out of scope:

- Native Visio parsing.
- UI redesign.
- New template pack content.

## Acceptance Criteria

- [x] Extension metadata supports `id`, `name`, `version`, `kind`, `enabled`, `capabilities`, and `config`.
- [x] Existing import/export/template/routing registrations can be represented as built-in extensions.
- [x] Extension calls return `{ success, data, issues, warnings }`.
- [x] Invalid extension registration reports clear errors.
- [x] Existing user-visible behavior remains unchanged.

## QA Result

Accepted on 2026-07-16 under `WORK_ORDER_DW-QA-20260716-01_GATE_REMEDIATION.md`.
The registry enumerates enabled built-ins for importer, exporter, template,
stencil, validator, routing, history, and AI provider boundaries.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Existing Excel/JSON/VSO load paths still work.
- Existing PNG/SVG/PDF/VSO export buttons still work.
- Template dialog still lists built-in templates.

## Developer Handoff Required

- Changed files.
- New extension contracts.
- Commands run and results.
- Any behavior intentionally deferred.

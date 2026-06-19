# Acceptance

## Global Acceptance Standards

Every work order must include:

- VPM-Controller-QA dispatch scope.
- Developer changed-file list.
- Verification commands and results.
- VPM-Controller-QA review result.
- Known risks and skipped checks.

Required automatic checks unless explicitly waived:

- `npm.cmd run typecheck`
- `npm.cmd test`

Required functional checks depend on the work order. Browser checks should be run when UI behavior changes. If Playwright or browser tooling is unavailable, QA must record the blocker and use an alternate manual/static check.

## Upgrade Acceptance Criteria

- [ ] AC-DW-001: Importers generate preview data first and do not mutate the canvas before user confirmation.
- [ ] AC-DW-002: Invalid import rows are skipped with row number, reason, and affected field.
- [ ] AC-DW-003: Excel/JSON mapping lets users choose node IDs, labels, details, coordinates, dimensions, ports, and connections.
- [ ] AC-DW-004: User-provided coordinates, ports, and waypoints are preserved unless the user explicitly runs auto-layout.
- [ ] AC-DW-005: Template center supports category filtering, search, favorites, and editable generated diagrams.
- [ ] AC-DW-006: Stencil manager imports, lists, enables/disables, and exports custom shape packs.
- [ ] AC-DW-007: Connection rules support endpoint lock, obstacle padding, bridge behavior, manual waypoints, and label placement.
- [ ] AC-DW-008: Version history can restore a previous diagram state without corrupting current files.
- [ ] AC-DW-009: `.vso` remains a DiagramWeave working archive and is not represented as native Visio.
- [ ] AC-DW-010: `.vsdx` import/export is implemented through a real compatibility layer with unsupported element reporting.

## Current Evidence

Previous completed routing repair evidence is retained in `Docs/COMPLETED.md`.

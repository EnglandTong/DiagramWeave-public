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

- [x] AC-DW-001: Importers generate preview data first and do not mutate the canvas before user confirmation.
- [x] AC-DW-002: Invalid import rows are skipped with row number, reason, and affected field.
- [x] AC-DW-003: Excel/JSON mapping lets users choose node IDs, labels, details, coordinates, dimensions, ports, and connections.
- [x] AC-DW-004: User-provided coordinates, ports, and waypoints are preserved unless the user explicitly runs auto-layout.
- [x] AC-DW-005: Template center supports category filtering, search, favorites, and editable generated diagrams.
- [x] AC-DW-006: Stencil manager imports, lists, enables/disables, and exports custom shape packs.
- [x] AC-DW-007: Connection rules support endpoint lock, obstacle padding, bridge behavior, manual waypoints, and label placement.
- [x] AC-DW-008: Version history can restore a previous diagram state without corrupting current files.
- [x] AC-DW-009: `.vso` remains a DiagramWeave working archive and is not represented as native Visio.
- [x] AC-DW-010: `.vsdx` import/export is implemented through a real compatibility layer with unsupported element reporting. **Accepted 2026-07-20** via `DW-P4-01-R2`: OPC package with Geometry, Connection points, Connect elements, master shapes, StyleSheets, and unsupported-element warnings. Full Microsoft/LibreOffice runtime validation remains a residual risk.
- [x] AC-DW-011: Process quality inspection is deterministic, bilingual, navigable, and limited to non-destructive automatic fixes.
- [x] AC-DW-012: Process analysis reports critical path, reachability, bottlenecks, role load, waits, cycles, and configured SLA risk without mutation.
- [x] AC-DW-013: A self-contained offline HTML Viewer preserves navigation/search/presentation behavior without editing commands or executable project content.
- [x] AC-DW-014: Local review threads preserve comments and four review states with safe rendering, project round-trip, target navigation, and phone read-only behavior.
- [x] AC-DW-015: Mermaid and BPMN controlled-subset imports use official/mature parsers, report unsupported content, and require preview plus explicit apply.
- [x] AC-DW-016: AI is disabled by default with exact local preview and explicit consent boundaries; v1/v2 project documents migrate through editor load/save to current `schemaVersion` without mutation.
- [x] AC-DW-017: Controlled VSDX archive handling rejects unsafe paths, oversized input, excessive entries, and excessive expanded content without mutating the editor.

## Current Evidence

Previous completed routing repair evidence is retained in `Docs/COMPLETED.md`.

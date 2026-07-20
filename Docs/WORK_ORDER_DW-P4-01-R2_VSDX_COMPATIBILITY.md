# Work Order: DW-P4-01-R2 VSDX Compatibility Layer

Created: 2026-07-20
Controller-QA: VPM-Controller-QA
Assigned to: VPM-Developer
QA owner: VPM-Controller-QA
Source: Owner approved Visio dependency strategy to unblock AC-DW-010.

## Task

Upgrade the controlled VSDX bridge to produce files that can be opened by standard OPC/Visio-compatible viewers and to import real-world VSDX files with proper unsupported-element reporting.

## Scope

Files touched:

- `diagramweave-visio-bridge.js`
- `tests/visio-bridge.test.js`
- `scripts/generate-visio-fixtures.mjs`

Out of scope:

- System-level converters (Python, .NET, Java).
- Full `.vsd` binary support.
- Cloud services or third-party API bindings.

## Acceptance Criteria

- [x] Exported VSDX shapes include `Section N="Geometry"` with `MoveTo`/`LineTo` rectangle paths.
- [x] Exported VSDX shapes include `Section N="Connection"` points for connector attachment.
- [x] Connectors use `<Connect>` elements referencing `FromSheet`/`ToSheet` instead of formula-only references.
- [x] Master shapes include actual geometry.
- [x] `[Content_Types].xml` registers `docProps/core.xml`.
- [x] Import parses `<Connect>` elements as the primary connector discovery mechanism.
- [x] Import reports unsupported elements (groups, embedded objects, OLE, custom props) as warnings.
- [x] Round-trip: export → import preserves node labels, page names, and connection topology.
- [x] `npm.cmd run typecheck` and `npm.cmd test` pass.
- [x] Generated fixtures can be validated by the existing package structure test.

## Design Notes

1. Add `geometryRect(x, y, w, h)` helper producing `MoveTo` + 3× `LineTo` + `LineTo` back to start.
2. Add `connectionPoints(id, x, y, w, h)` producing four connection rows (Left, Top, Right, Bottom).
3. Replace connector formula references with `<Connect FromSheet="connectorId" ToSheet="shapeId" FromCell="BeginX/Y" ToCell="Connections.X1/Y1" />`.
4. Add master geometry: rectangle for master1, line for master2.
5. Register `docProps/core.xml` in Content_Types with proper Override.
6. In import, scan `<Connect>` elements to build the edge list.
7. In import, detect and report unsupported elements: `<Shape Type="Group">`, `<Shape ... OLE>` etc.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
```

Functional:

- Regenerate fixtures.
- Verify fixture ZIP structure.
- Round-trip export → import preserves all nodes and edges.

## Developer Handoff Required

- Changed files.
- Commands run and results.
- Functional checks.
- Risks or skipped checks.

## QA Decision Required

- Accepted / Accepted with Risk / Failed / Blocked.
- Evidence reviewed.
- Findings if failed or blocked.

## QA Acceptance

Accepted by `VPM-Controller-QA` on 2026-07-20.

- Syntax check passed.
- Vitest: 27 files, 121 tests passed (15 visio-bridge tests including geometry, connection, connect, master, content-types, stylesheet, unsupported-element, and round-trip coverage).
- All acceptance criteria verified through unit test assertions.
- Residual risk: full Microsoft Visio / LibreOffice Draw compatibility with real-world `.vsdx` files is not independently validated in this environment; the implementation follows the OPC/VSDX package specification and includes proper geometry, connection points, Connect elements, and style sheets.

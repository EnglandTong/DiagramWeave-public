# Work Order: DW-P2-08 Mermaid and BPMN Import

Created: 2026-07-17  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Add preview-first Mermaid flowchart and BPMN 2.0 XML import through official/mature parsers and the Extension Kernel importer boundary.

## Acceptance Criteria

- [x] Mermaid syntax is validated with the official `mermaid` package before conversion.
- [x] Mermaid controlled subset supports flowchart direction, common node shapes, edges, and edge labels; unsupported diagram types/features are reported.
- [x] BPMN XML is parsed with `bpmn-moddle`, not DOM string matching.
- [x] BPMN controlled subset supports start/end events, task variants, exclusive/parallel gateways, sequence flows, and BPMN DI coordinates when present.
- [x] Unknown BPMN elements and unsupported Mermaid constructs enter bilingual issues/warnings without aborting supported content.
- [x] Both formats produce the standard import preview and require explicit apply before canvas mutation.
- [x] Invalid files, missing references, cycles, coordinates, and labels have unit and browser coverage.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test -- --run
npm.cmd run test:e2e
```

## Dependency Decision

- Mermaid: official `mermaid` package and `mermaid.parse()` API.
- BPMN: `bpmn-moddle` from bpmn.io.

## QA Acceptance

Accepted: 2026-07-17

- Syntax check passed, including the importer and vendor build scripts.
- Vitest: 26 files, 106 tests passed.
- Playwright: 60 tests passed, including three external-import scenarios.
- Mermaid conversion consumes the official parsed FlowDB. BPMN conversion consumes the bpmn-moddle object model and BPMN DI.
- `npm audit` remaining high severity is the pre-existing `xlsx` package with no npm registry fix; imported spreadsheets remain behind existing preview/sanitization limits. A low development-only nested esbuild advisory remains under Vitest/Vite.

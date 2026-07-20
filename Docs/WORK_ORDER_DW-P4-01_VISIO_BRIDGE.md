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

## Controller Stop Decision

Stopped: 2026-07-17

- The repository has no browser-compatible OPC ZIP/XML writer or independent VSDX validator.
- The existing implementation is a byte-scan preview stub and cannot import shapes/connectors or export a valid package.
- Available mature implementations require Python, .NET, Java/commercial runtimes, or a system converter. Introducing one requires an Owner dependency/license decision; using a system converter violates this work order's stop conditions.
- No basic-flowchart, swimlane, and connector-heavy `.vsdx` fixtures are available for independent compatibility validation.
- `.vso` remains DiagramWeave JSON and is not represented as `.vsdx`.

## Controller Re-review 2026-07-17

External feasibility review confirms that `.vsdx` is an OPC ZIP/XML package with required parts and relationships, not a renamed JSON file. Microsoft documents the package/relationship structure, and the open-source GitHub `dave-howard/vsdx` project provides read/write processing with a BSD-3-Clause license. The library is Python-based, so adopting it would introduce a cross-runtime bridge and still requires three real `.vsdx` fixtures plus an independent parser or compatible viewer for validation.

Decision: keep this work order stopped. The research identifies a candidate dependency but does not constitute Owner approval, fixture availability, or compatibility evidence. Do not mark AC-DW-010 complete and do not expose the existing byte-scan preview as native Visio support.

## R1 Developer Progress 2026-07-17

Owner authorized autonomous work inside this repository. Developer implemented a browser-compatible controlled subset in `diagramweave-visio-bridge.js` using direct `fflate` dependency:

- Generates an OPC ZIP/XML package with content types, relationships, document, pages, text, coordinates, basic shapes, swimlane metadata, and connectors.
- Imports the same controlled subset through an explicit preview before applying it to the editor.
- Adds a VSDX export option and keeps `.vso` as DiagramWeave's own archive.
- Adds three fixture classes: basic flowchart, swimlane, and connector-heavy diagrams.

QA evidence: typecheck passed; Vitest 27 files/113 tests passed; the dedicated browser round-trip passed 1/1. LibreOffice 26.2.4.2 was attempted with an isolated profile but returned `source file could not be loaded`. The independent BSD-3-Clause `vsdx` 0.6.1 parser successfully opened all three generated fixtures: basic flowchart (1 page, 3 shapes), swimlane (1 page, 2 shapes), and connector-heavy (1 page, 15 shapes), including text extraction. R1 is accepted with risk for the declared controlled subset; full Microsoft/LibreOffice compatibility and third-party fixture coverage remain outside this acceptance.

The work order is not accepted. Resume only after the Owner approves a dependency strategy and an independent validation fixture/viewer.

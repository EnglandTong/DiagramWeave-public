# Status

## Overall

DiagramWeave-Public upgrade planning is active under the root VisualProjectManagement CMS / Agent Loop Engineering model.

Parent routing:

- Controller-QA: `VPM-Controller-QA`
- Developer: `VPM-Developer`

## Current Queue

| Order | Work Order | State | Owner |
|---|---|---|---|
| 1 | DW-P0-01 Extension Kernel | Ready after root P1 dispatch | VPM-Controller-QA |
| 2 | DW-P1-01 Import Preview and Error Report | Backlog | VPM-Controller-QA |
| 3 | DW-P1-02 Excel/JSON Mapping Wizard | Backlog | VPM-Controller-QA |
| 4 | DW-P2-01 Template Center | Backlog | VPM-Controller-QA |
| 5 | DW-P2-02 Stencil Manager | Backlog | VPM-Controller-QA |
| 6 | DW-P2-03 Connection Rule Panel | Backlog | VPM-Controller-QA |
| 7 | DW-P3-01 Version History | Backlog | VPM-Controller-QA |
| 8 | DW-P4-01 Visio Bridge | Backlog | VPM-Controller-QA |

## Root Work Link

Root follow-up work:

- `VPM-P1-02 DiagramWeave MiniApp Hub Alignment` accepted with risk.
- `VPM-P1-03 DiagramWeave Extension Kernel Review` remains backlog.

The extension-kernel root work order should review and dispatch the child queue item `DW-P0-01 Extension Kernel`.

## Current Decision

Build the extension boundary first. Do not begin native Visio implementation until the import/export extension API and preview/error-report pipeline exist.

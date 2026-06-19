# Target

Status: Active

## Goal

Upgrade DiagramWeave into an extensible workflow-diagram platform.

The upgrade must support:

- Real Visio `.vsdx/.vsd` import/export through a separate compatibility layer.
- Import preview with row-level error reporting before changes touch the canvas.
- User-controlled Excel/JSON mapping for nodes, ports, coordinates, connections, and labels.
- Template center with categories, search, favorites, and editable Fishbone/Swimlane templates.
- Stencil manager for custom icon and industry shape packs.
- Connection rule panel for endpoint locking, obstacle padding, bridges, manual waypoints, and label placement.
- Version history and rollback.

## Operating Model

The work follows the CMS / Agent Loop Engineering standard adapted from MiniApp_Hub:

- Owner: user
- Controller-QA: VPM-Controller-QA
- Developer: VPM-Developer

New work is routed through the root VisualProjectManagement two-lane model:

```text
VPM-Controller-QA -> VPM-Developer -> VPM-Controller-QA
```

Historical single-agent records remain evidence only.

## Current Scope

Large, phased upgrade.

## Non-Goals

- Do not fake Visio support by saving DiagramWeave JSON with a Visio extension.
- Do not let import logic silently restructure user-provided diagrams.
- Do not introduce system-level installs or secrets access without Owner approval.
- Do not rewrite the whole UI stack unless a work order explicitly requires it.

## Human Decisions Required

- Approve large third-party dependencies for native `.vsdx/.vsd` parsing or conversion.
- Decide whether old binary `.vsd` support is mandatory after `.vsdx` feasibility is proven.

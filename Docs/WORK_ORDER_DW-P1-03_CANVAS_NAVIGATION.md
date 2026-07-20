# Work Order: DW-P1-03 Canvas Navigation and Analysis Surface

Created: 2026-07-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer

## Task

Complete the P1 canvas navigation surface without changing the document format.

## Acceptance Criteria

- [x] A minimap renders all visible nodes and the current viewport.
- [x] Outline lists nodes by page and selects/centers a chosen node.
- [x] Fit all, fit selection, and 100% commands work from UI and command registry.
- [x] Node search and role/shape filters update the Outline without deleting or hiding document data.
- [x] Align left/center/right/top/middle/bottom supports multi-selection.
- [x] Distribute horizontally and vertically supports three or more selected nodes.
- [x] Navigation controls remain usable at desktop and tablet widths.

## Verification

- Unit tests for fit, alignment, distribution, and filtering calculations.
- Playwright tests for minimap rendering, Outline navigation, fit commands, and multi-node alignment.
- Full syntax, unit, visual, accessibility, and browser regression gates.

## Stop Conditions

- Do not implement P2 template, stencil, history, Visio, cloud, or AI features.
- Do not change node positions merely by searching or filtering.

## QA Acceptance

Accepted: 2026-07-16

- Syntax gate: passed.
- Vitest: 18 files, 81 tests passed.
- Playwright P1-03: 4 tests passed.
- Full Playwright regression: 28 tests passed, including existing visual and accessibility baselines.
- Search/filter coordinate preservation and 768px touch targets are covered by browser assertions.

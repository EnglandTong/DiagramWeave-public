# Work Order: DW-P1-04 Shape Library Workflow

Created: 2026-07-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer

## Task

Complete the P1 shape-library workflow using one shared shape-pack data source.

## Acceptance Criteria

- [x] Shape search covers labels, bilingual keywords, category, and pack metadata.
- [x] Categories can be collapsed and expanded without losing search state.
- [x] Recently used shapes persist locally and are ordered by latest insertion.
- [x] Users can add and remove favorites; favorites persist locally.
- [x] Double-click inserts a shape at the visible canvas center.
- [x] Keyboard users can traverse categories and shapes, insert with Enter/Space, and toggle favorites with an accessible command.
- [x] Built-in shapes and Stencil Manager consume the same shape-pack registry; no parallel shape definitions are introduced.
- [x] Desktop and tablet layouts remain usable and touch targets are at least 44px on tablet.

## Verification

- Unit tests for search, category grouping, recent ordering, favorite persistence, and registry merging.
- Playwright tests for collapse/search state, favorite/recent workflows, double-click insertion, keyboard insertion, and tablet controls.
- Full syntax, unit, visual, accessibility, and browser regression gates.

## Stop Conditions

- Do not implement the full Stencil Manager UI in this work order.
- Do not change project document schema for local UI preferences.
- Do not add a framework or build step.

## QA Acceptance

Accepted: 2026-07-16

- Syntax gate: passed.
- Vitest: 19 files, 84 tests passed.
- Playwright P1-04: 4 tests passed.
- Full Playwright regression: 32 tests passed, including visual and axe gates.
- A nested-interactive accessibility defect found during regression was remediated before acceptance.

# Work Order: DW-P1-06 Responsive and Dialog Completion

Created: 2026-07-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer

## Task

Complete the P1 responsive-mode and dialog accessibility contract.

## Acceptance Criteria

- [x] Below 768px the editor exposes view, presentation, search, and review entry points while structural editing commands are unavailable.
- [x] At 768-1023px full editing remains available through left/right drawers and all primary touch targets are at least 44px.
- [x] At 1024px and above the stable three-column editor remains available without overlapping controls.
- [x] Every modal dialog has an associated title, `aria-modal`, focus lock, Escape close, and trigger-focus restoration.
- [x] Background content is inert while a modal dialog is open.
- [x] Every icon-only button has an accessible name and a visible-on-hover/focus tooltip.
- [x] Responsive changes do not alter project data or exported files.
- [x] English and Chinese layouts avoid clipped or overlapping control text at phone, tablet, and desktop widths.

## Verification

- Playwright matrix at 390x844, 768x1024, 1024x768, and 1440x900 in English and Chinese.
- Dialog contract tests for template, export, confirm, layout, import preview, mapping wizard, settings, and command palette.
- axe, visual snapshots, syntax, unit, format compatibility, and full browser regression gates.

## Stop Conditions

- Do not add cloud accounts, real-time collaboration, or a framework migration.
- Do not expose structure mutation controls below 768px.
- Do not mark P1 complete while any modal lacks the full focus contract.

## QA Acceptance

Accepted: 2026-07-16

- Syntax gate: passed.
- Vitest: 20 files, 87 tests passed.
- Playwright P1-06: 5 tests passed.
- Full Playwright regression: 41 tests passed, including bilingual viewport, visual, axe, and format gates.
- QA-returned defects for tablet overflow, modal title linkage, tooltip focus, mobile height, and import-preview initial focus were remediated before acceptance.

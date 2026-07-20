# Work Order: DW-P1-05 Property Editing Workflow

Created: 2026-07-16  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer

## Task

Complete the P1 property editing workflow without changing unrelated document behavior.

## Acceptance Criteria

- [x] Node properties are organized into Content, Flow, Appearance, and Data sections.
- [x] Multi-selection shows a batch-edit state and applies supported changes to every selected node.
- [x] Batch editing supports fill, stroke, text color, role, and layer without overwriting unrelated fields.
- [x] Color controls expose readable names, predefined swatches, and custom color input.
- [x] A contextual node toolbar appears near the active selection and provides common appearance and duplicate/delete commands.
- [x] Mixed values are represented explicitly and never silently replaced merely by opening the panel.
- [x] Property changes remain undoable and serialize through JSON/VSO/Excel compatibility paths.
- [x] Keyboard and screen-reader users can reach and identify all new controls; tablet touch targets are at least 44px.

## Verification

- Unit tests for batch patch creation, mixed-value detection, and color normalization.
- Playwright tests for section navigation, multi-node editing, contextual toolbar, undo, serialization, accessibility, and tablet use.
- Full syntax, unit, visual, accessibility, and browser regression gates.

## Stop Conditions

- Do not add collaboration, history, template, Stencil Manager, routing-rule, or AI functionality.
- Do not auto-apply a mixed value when the property panel opens.
- Do not replace the current Vanilla JS architecture.

## QA Acceptance

Accepted: 2026-07-16

- Syntax gate: passed.
- Vitest: 20 files, 87 tests passed.
- Playwright P1-05: 4 tests passed.
- Full Playwright regression: 36 tests passed, including visual and axe gates.
- Browser evidence covers mixed values, batch role/layer/color edits, undo, serialization, contextual actions, and tablet targets.

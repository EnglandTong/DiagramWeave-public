# DiagramWeave P0-P2 QA Acceptance

Date: 2026-07-16  
Role: VPM-Controller-QA  
Result: **REJECTED**

## Remediation Update

QA-001 through QA-004 were revalidated and accepted under
`WORK_ORDER_DW-QA-20260716-01_GATE_REMEDIATION.md` on 2026-07-16. This closes the
specific gate-remediation findings but does not supersede the remaining P0
coverage gaps or accept the unfinished P1/P2 scope.

## Gate Summary

| Gate | Result | Reason |
|---|---|---|
| P0 visual baseline | Accepted | Seven-template, export, format round-trip, visual, responsive, contrast, and axe evidence passed. |
| DW-P0-01 Extension Kernel | Accepted | Metadata registry, eight built-in kinds, validation, and invocation evidence passed. |
| P1 editor experience | Fail | Keyboard shape insertion and modal focus trapping fail; several planned editor capabilities are absent. |
| P2 work orders | Not eligible | P1 gate has not passed and repository acceptance criteria remain unchecked. |

## Blocking Findings

### QA-001: Extension Kernel does not satisfy DW-P0-01

`diagramweave-extension-kernel.js` registers operation IDs and handlers only. It has no extension registration contract supporting `id`, `name`, `version`, `kind`, `enabled`, `capabilities`, and `config`. Existing importer, exporter, template, stencil, validator, routing, history, and AI boundaries are not represented as built-in extensions.

Required evidence:

- Invalid metadata registration tests.
- Built-in extension enumeration covering the required kinds.
- Existing UI smoke checks executed through the registered boundary.

### QA-002: Shape library is not keyboard operable

`initAccessibility()` adds `role="button"` and `tabindex="0"` to shape items but does not add Enter or Space handling. Browser probe result: focused first shape, pressed Enter, node count remained `0 -> 0`.

Required evidence:

- Enter and Space insert the focused shape.
- Arrow-key navigation or another documented complete keyboard interaction model.
- Playwright coverage for insertion and focus position after insertion.

### QA-003: Command palette does not trap focus

The palette moves focus to its input and restores trigger focus on Escape, but does not trap Tab navigation. Browser probe result: Shift+Tab from `#commandPaletteInput` moved focus to `#propPageName`, outside the dialog.

Required evidence:

- Tab and Shift+Tab cycle inside the open palette.
- Background controls are not focusable while the modal is open.
- Escape closes and restores trigger focus.

### QA-004: Tracked QA evidence was deleted

`git diff --name-only -- playwright-results` reports 96 tracked files deleted. These include prior `.last-run.json` and failure context records. This is unrelated artifact churn and removes audit evidence.

Required action:

- Restore the tracked Playwright records unless an approved retention policy explicitly authorizes deletion.
- Keep new run output in an ignored per-run directory.

## Coverage Gaps

- P0 visual tests apply and inspect only the first of seven templates.
- Export coverage opens the export dialog but does not validate generated PNG, SVG, or PDF output.
- No browser round-trip coverage for `textColor` through JSON/VSO/Excel.
- No integration test proves `schemaVersion` migration through the actual load/save UI path.
- Quality issues, review threads, and AI providers currently have contract-level unit tests only; no user-facing workflow is connected.
- P1 minimap, Outline, fit selection, node filters, alignment/distribution, favorites/recent shapes, property tabs, multi-select editing, and node quick toolbar are not delivered.
- P2 import preview, mapping wizard, template center requirements, stencil manager, routing rule panel, IndexedDB history, offline Viewer, review UI, Mermaid/BPMN import, and Visio Bridge are not delivered.

## Verification Evidence

- `npm.cmd run typecheck`: passed.
- `npm.cmd test`: 15 files, 65 tests passed.
- `npm.cmd run test:e2e`: 14 tests passed.
- Axe serious/critical gate: passed within current tested screen.
- Manual automated browser probes: shape keyboard insertion failed; command palette focus trap failed.

## Acceptance Decision

Do not advance the release or mark P0-P2 complete. Remediate QA-001 through QA-004, add the missing P0 integration evidence, then request P0/P1 revalidation. P2 remains blocked by the failed P1 gate and must be accepted work order by work order.

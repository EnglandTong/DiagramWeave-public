# Work Order: DW-QA-20260716-01 Gate Remediation

Created: 2026-07-16  
Controller: VPM-Controller-QA  
Assigned to: VPM-Developer  
Source: `QA_2026-07-16_P0_P2_ACCEPTANCE.md`

## Scope

Close QA-001 through QA-004 without starting any additional P2 feature.

1. Replace the operation-only extension boundary with an extension registry supporting `id`, `name`, `version`, `kind`, `enabled`, `capabilities`, and `config`.
2. Register built-in importer, exporter, template, stencil, validator, routing, history, and AI provider extension descriptors.
3. Preserve the existing `{ success, data, issues, warnings }` invocation envelope and reject invalid or duplicate registrations clearly.
4. Make every shape-library item operable with Enter and Space; inserted shapes must be selected and visible.
5. Trap Tab and Shift+Tab inside the command palette, close it with Escape, and restore focus to the trigger.
6. Restore tracked Playwright evidence removed during the previous run.

## Acceptance Criteria

- [x] Registry metadata validation and duplicate handling have unit tests.
- [x] All eight required extension kinds are enumerable as enabled built-ins.
- [x] Existing sanitizer and node-shape export handlers remain invokable.
- [x] Playwright proves Enter and Space insert a focused shape.
- [x] Playwright proves forward and reverse Tab cannot escape the command palette.
- [x] `git diff --name-only -- playwright-results` reports no deleted tracked evidence.
- [x] `npm.cmd run typecheck`, `npm.cmd test`, and `npm.cmd run test:e2e` pass.

## QA Revalidation

Result: **Accepted** on 2026-07-16.

- Syntax check passed.
- Vitest: 15 files, 68 tests passed.
- Targeted Playwright: 4 tests passed.
- Full Playwright: 15 tests passed.
- Tracked Playwright evidence deletion count: 0.

## Stop Conditions

- Do not implement import preview, mapping, history storage, Visio conversion, cloud services, or AI vendor bindings in this work order.
- Do not mark P1 or P2 accepted from this remediation alone.

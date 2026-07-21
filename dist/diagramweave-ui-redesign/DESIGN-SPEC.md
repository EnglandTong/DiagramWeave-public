# DiagramWeave UI Implementation Specification

Status: P0 source of truth  
Updated: 2026-07-15

This specification is executed in order. Each step must pass its verification before the next step starts. Do not use repository-wide blind replacement.

## 1. Establish the baseline

- Record `npm.cmd test`, `npm.cmd run typecheck`, and Playwright results.
- Capture the eight states listed in Step 10.
- Rollback: no source changes.

## 2. Load canonical tokens

- Load `colors_and_type.css` before `flowchart-editor.css`.
- Verify `--bg-base`, `--text-primary`, `--accent`, `--radius-sm`, and `--shadow-md` are non-empty in computed styles.
- Rollback: remove the canonical stylesheet link.

## 3. Keep compatibility aliases only

- `flowchart-editor.css` may define application aliases such as `--bg-primary: var(--bg-base)`.
- Canonical color, spacing, radius, shadow, transition, and font values must not be duplicated.
- Rollback: restore the previous local token block.

## 4. Restore the product font

- `DiagramWeaveZh` is declared in the canonical token stylesheet and loads Noto Sans SC from `vendor/fonts`.
- Verify Chinese and English UI text use the product font without missing glyphs.
- Rollback: use the system font fallback chain.

## 5. Normalize surfaces

- Canvas uses `--bg-canvas`; application shell uses `--bg-base`; panels use `--bg-surface`; controls and popovers use `--bg-elevated`.
- Remove backdrop blur and glass overlays. Keep borders and restrained shadows for hierarchy.
- Rollback: revert only the affected selector group.

## 6. Enforce node text contrast

- Nodes persist `textColor: "auto" | "#rrggbb"`.
- `auto` chooses the higher WCAG contrast between `#111320` and `#ffffff` for the node fill.
- Old files and invalid values migrate to `auto`.
- Rollback: keep the field but render `--text-primary`.

## 7. Preserve import and export compatibility

- JSON/VSO and Excel round-trip `textColor` without rejecting unknown fields.
- Existing documents without `textColor` load unchanged with automatic contrast.
- Rollback: omit the new field during export while retaining load compatibility.

## 8. Remove decorative effects that obscure work

- No glassmorphism or persistent blur.
- Shadows communicate elevation only; glow is reserved for active canvas state.
- Respect `prefers-reduced-motion`.
- Rollback: selector-level revert.

## 9. Establish accessibility basics

- Icon buttons have accessible names and tooltips.
- Dialogs have `role="dialog"`, `aria-modal`, and an accessible title.
- Keyboard focus has a visible outline; hidden content is removed from interaction.
- Rollback: retain semantic attributes even if styling is reverted.

## 10. Create browser visual baselines

- Desktop: initial entry, blank canvas, template center, applied template, selected node, export dialog.
- Responsive: 390x844 phone and 768x1024 tablet.
- Store Playwright snapshots beside the visual test and update only after reviewed UI changes.
- Rollback: restore the last accepted snapshots.

## 11. Run automated gates

- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run test:e2e`
- Axe checks: button names, dialog names, focus visibility, and serious/critical violations.
- Rollback: stop release; do not suppress a failing rule without a documented exception.

## 12. Perform acceptance review

- All seven built-in templates remain editable and readable.
- PNG/SVG/PDF exports do not inherit broken editor colors.
- JSON/VSO/Excel compatibility tests pass.
- Desktop, tablet, and phone screenshots are reviewed against the accepted baseline.
- P1 work starts only after these checks pass.


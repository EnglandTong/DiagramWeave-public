# Next Actions

1. Keep accepted P0 and P1 evidence stable.
2. Preserve accepted Template Center and Stencil Manager contracts.
3. Preserve `DW-P4-01` R1 as Accepted with Risk; only pursue full Visio compatibility when third-party fixtures and a compatible viewer are available.
4. Preserve the accepted AI provider boundary and schema migration contracts.
5. Keep `.vso` as a DiagramWeave archive and do not claim full `.vsdx` compatibility from the controlled subset alone.
6. Preserve the accepted `DW-QA-03 Release Hardening` archive safety boundary.
7. ~~VPM-Controller-QA performs the final P0-P2 requirement audit and records deferred Visio items.~~ **Completed 2026-07-20.** See `Docs/AUDIT_2026-07-20_FINAL_P0_P2.md`.

## Current State

All P0-P2 work orders and DW-P5-01 security hardening are accepted. No active Developer work is queued.

## Blocked Items

| Item | Blocker | Owner Action Required |
|---|---|---|
| None | All previously blocked items resolved. AC-DW-010 addressed via DW-P4-01-R2 (Accepted with Risk 2026-07-20). | — |

## Dependency Rules

- `DW-P1-01` depends on `DW-P0-01`.
- `DW-P1-02` depends on `DW-P1-01`.
- `DW-P2-01`, `DW-P2-02`, and `DW-P2-03` depend on `DW-P0-01`.
- `DW-P3-01` should start after import/export mutation paths are stable.
- `DW-P4-01` depends on `DW-P0-01`, `DW-P1-01`, and `DW-P1-02`.

## Active Work

None. All work orders accepted.

## Quality Follow-ups (2026-07-20)

8. Continue `DW-QA-20260720-02` domain split of `flowchart-editor.js`: remaining duplicate blocks (coupled to `state`/DOM) and module-duplication need semantic reconciliation before extraction. Use the `editor/` + IIFE namespace + `vm` unit test pipeline established in Slice 2.1. **Slice 2.4.3 completed**: `trapOverlayFocus` extracted to `editor/overlay-utils.js` with 11 vm sandbox tests. (Note: prior t()/history/importPreview/command framing was based on an early misread — actual t() in editor is a thin typeof-guarded external i18n call, not a duplicate; the real module-duplication candidates are sanitizeSvg, createImportPreview, etc. — to be audited slice by slice.)
9. Color-normalization semantic gap partially bridged (Slice 2.3.1, Accepted): `normalizeHexColor` now delegates to `DiagramWeaveSanitize.sanitizeHexColor(c, c)` with original tolerant fallback; the local copy is dead code in practice. Decide on next pass: physically remove the dead fallback and confirm zero behavior change, OR keep as defensive layer.
10. ~~Trim `playwright-results/` old run directories to reclaim disk~~ **DONE 2026-07-20**: 380 → 1 run, 3.7M → ~0M (kept latest `run-1784285948951-7260` + `current-hub-qa/`). `archive/` is currently tracked (git mv preserved history); may be excluded from version control in a later pass.

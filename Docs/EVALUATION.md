# Evaluation

## Quality Gates

Each accepted work order should improve one or more of:

- User control over imported structure.
- Recoverability after bad edits or imports.
- Extensibility for future formats and packs.
- Clarity of bilingual UI text.
- Safety of file parsing and export.
- Stability of routing and diagram rendering.

## Metrics

- Import preview reports invalid rows before applying changes.
- Existing project files continue to load.
- New extension APIs have tests.
- UI changes are checked in Chinese and English where visible.
- No new feature bypasses the extension boundary after `DW-P0-01`.

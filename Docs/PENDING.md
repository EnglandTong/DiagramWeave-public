# Pending

## Product Decisions

- Whether `.vsd` support must be native or may be convert-to-`.vsdx` only.
- Whether Visio compatibility may use third-party libraries.
- Whether template/stencil packs should be purely local files or support remote signed content packs.

## Technical Risks

- `flowchart-editor.js` is large and must be split carefully.
  - **Progress 2026-07-20**: domain-split pipeline established (`editor/state-utils.js` IIFE namespace + vm unit test). Slice 2.1 cleared the canvas-reset duplicate block; Slice 2.3.1 added a delegation bridge for `normalizeHexColor` -> `DiagramWeaveSanitize.sanitizeHexColor`. **Slice 2.4.3 completed**: `trapOverlayFocus` extracted to `editor/overlay-utils.js` with 11 vm sandbox tests. Remaining coupled duplicates and semantic-divergent module-duplication (sanitizeSvg, createImportPreview, etc.) are tracked in `Docs/NEXT_ACTIONS.md` items 8-9.
- Playwright browser availability may vary on this machine.
  - **Note 2026-07-20**: 380 historical run directories cleaned; only the most recent run + `current-hub-qa/` retained (no longer git-tracked, gitignored).
- Native Visio export requires strict package structure and compatibility testing against real Visio files.

# Pending

## Product Decisions

- Whether `.vsd` support must be native or may be convert-to-`.vsdx` only.
- Whether Visio compatibility may use third-party libraries.
- Whether template/stencil packs should be purely local files or support remote signed content packs.

## Technical Risks

- `flowchart-editor.js` is large and must be split carefully.
- Playwright browser availability may vary on this machine.
- Native Visio export requires strict package structure and compatibility testing against real Visio files.

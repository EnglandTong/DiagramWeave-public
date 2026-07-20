# Work Order DW-P5-01: Security Hardening and Governance Consistency

Date: 2026-07-20
Priority: P1 + P2
Dispatch: VPM-Controller-QA → VPM-Developer

## Scope

Address P1 security vulnerability and P2 issues identified in `PROJECT_REVIEW_2026-07-20.md`.

## Items

### P1-01: xlsx Dependency Replacement
- Replace `xlsx@0.18.5` (abandoned, High CVE) with SheetJS CE tarball
- Source: `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`
- Verify all Excel import/export functionality preserved
- Owner approved: 2026-07-20

### P2-01: Governance File Consistency
- Fix `NEXT_ACTIONS.md` duplicated content (lines 28-45 repeat lines 1-27)
- Update `AUDIT_2026-07-20_FINAL_P0_P2.md` to reflect AC-DW-010 resolved by DW-P4-01-R2
- Update `STATUS.md` Final Audit section to show 17/17 addressed

### P2-02: Stencil SVG XSS Prevention
- Add SVG sanitization before innerHTML injection at `flowchart-editor.js:1786`
- Strip `<script>`, event handlers (`on*`), and `<foreignObject>` from stencil SVG

### P2-03: JSON.parse Error Handling
- Add try/catch around `JSON.parse(await file.text())` at `flowchart-editor.js:5979`
- Show user-friendly error message on parse failure

### P2-04: VSDX Connector Detection
- Improve connector detection in `diagramweave-visio-bridge.js:192`
- Use Master attribute and Dynamic Connector text instead of ID≥1000 threshold

## Acceptance Criteria
- [x] All 129 tests pass (28 files)
- [x] xlsx replacement does not break Excel import/export (xlsx@0.20.3 CE confirmed)
- [x] Governance files are internally consistent (NEXT_ACTIONS, AUDIT, STATUS aligned)
- [x] SVG injection is sanitized (sanitizeSvg strips script, foreignObject, event handlers, javascript: URIs)
- [x] Corrupt JSON files show friendly error (try/catch at File System Access API path)
- [x] VSDX connector detection works without ID threshold (uses Master="2" attribute)

## QA Acceptance

Date: 2026-07-20
Result: **Accepted**

### Verification
- `npm.cmd run typecheck`: syntax check passed
- `npm.cmd test`: 28 files, 129 tests passed
- `npm audit`: 1 low severity vulnerability (down from multiple High)
- `xlsx` version confirmed: 0.20.3

### Changed Files
- `package.json` — xlsx dependency updated to SheetJS CE tarball
- `diagramweave.manifest.json` — CDN URL updated
- `flowchart-editor.js` — sanitizeSvg function added, JSON.parse try/catch added
- `diagramweave-visio-bridge.js` — connector detection uses Master attribute
- `tests/visio-bridge.test.js` — added connector detection test
- `tests/sanitize-svg.test.js` — new file, 7 tests for XSS prevention
- `Docs/NEXT_ACTIONS.md` — removed duplication, updated blocked items
- `Docs/AUDIT_2026-07-20_FINAL_P0_P2.md` — AC-DW-010 status updated
- `Docs/STATUS.md` — Final Audit section updated

## Stop Rules
- No system-level installs
- No breaking changes to existing file formats

# Next Actions

1. Track `VPM-P1-02 DiagramWeave MiniApp Hub Alignment` follow-up risk: Playwright e2e teardown timeout.
2. Wait for root `VPM-P1-03 DiagramWeave Extension Kernel Review` dispatch.
3. Under that root work order, review child work order `DW-P0-01 Extension Kernel`.
4. Create extension registry and extension capability contracts.
5. Move existing import/export/template/routing registration behind the new boundary without changing user behavior.
6. Verify with syntax, unit tests, and at least one functional UI smoke check.
7. VPM-Controller-QA accepts or returns findings.

## Dependency Rules

- `DW-P1-01` depends on `DW-P0-01`.
- `DW-P1-02` depends on `DW-P1-01`.
- `DW-P2-01`, `DW-P2-02`, and `DW-P2-03` depend on `DW-P0-01`.
- `DW-P3-01` should start after import/export mutation paths are stable.
- `DW-P4-01` depends on `DW-P0-01`, `DW-P1-01`, and `DW-P1-02`.

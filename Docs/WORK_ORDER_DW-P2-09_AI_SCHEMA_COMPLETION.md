# Work Order: DW-P2-09 AI Provider and Schema Completion

Created: 2026-07-17  
Controller-QA: VPM-Controller-QA  
Assigned to: VPM-Developer  
QA owner: VPM-Controller-QA

## Task

Complete the vendor-neutral AI provider boundary and prove schema migration through real project load/save paths.

## Acceptance Criteria

- [x] AI is globally disabled by default and can be completely disabled even when providers are registered.
- [x] Provider invocation always returns a data preview before permission and never runs without explicit per-invocation consent.
- [x] No provider, API key storage, automatic canvas overwrite, or network endpoint is bundled.
- [x] A settings surface lists providers, global state, and the exact preview payload without exposing a run action when disabled.
- [x] Old v1/v2 JSON/VSO documents migrate through the actual editor load path and save with current `schemaVersion`.
- [x] Unknown fields do not prevent old project loading; known fields and review/analysis additions round-trip.
- [x] Migration functions remain pure and old input objects remain unchanged.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test -- --run
npm.cmd run test:e2e
```

## QA Acceptance

Accepted by `VPM-Controller-QA` on 2026-07-17.

- `npm.cmd run typecheck`: passed.
- `npm.cmd test -- --run`: 26 files, 106 tests passed.
- `npm.cmd run test:e2e`: 62 tests passed.
- Browser evidence confirms AI is off by default, exposes only the exact local preview, has no key or execution controls, and legacy v1/v2 documents load and save as `schemaVersion` 3.
- No vendor binding, key persistence, network endpoint, or automatic canvas overwrite was added.

# DiagramWeave-Public MiniApp Hub Alignment

> Date: 2026-06-16
> Scope: DiagramWeave-Public child subsystem architecture

## Implemented Shape

DiagramWeave-Public now has a MiniApp Hub-compatible child-system shape:

```text
DiagramWeave-Public/
  core-server/      local hub server and APIs
  client/           lightweight hub shell / launcher
  shared/           manifest helpers and validation
  subsystems/       subsystem manifest records
  Docs/             CMS and acceptance records
```

The existing editor files remain in place and continue to be the user-facing editor:

- `flowchart-editor.html`
- `flowchart-editor.js`
- `flowchart-editor.css`
- `diagramweave-bootstrap.js`
- `flowchart-sanitize.js`
- `diagramweave-content-pack.js`
- `diagramweave-i18n.js`

## Runtime Contract

Default hub port:

- `4273`

Commands:

```powershell
npm.cmd run hub
npm.cmd run serve
```

Endpoints:

- `/` serves the hub shell.
- `/flowchart-editor.html` serves the legacy editor entry.
- `/api/health` reports hub health.
- `/api/manifest` returns the hub manifest.
- `/api/subsystems` lists registered child-facing subsystems.
- `/api/subsystems/diagramweave-editor` returns the editor subsystem record.
- `/api/system/info` and `/api/system/capabilities` preserve existing local system-info semantics.

## Compatibility Decision

This alignment is intentionally additive:

- Existing editor paths remain valid.
- Existing `npm.cmd run serve` behavior remains valid on port `4173`.
- New `npm.cmd run hub` exposes the MiniApp Hub-style shell on port `4273`.
- No new runtime dependency was added.

## Still Unconfirmed

- Parent VisualProjectManagement launcher is not implemented yet, so parent-to-child process orchestration is not verified.
- Auth, permission, and cross-subsystem message contracts are not implemented in DiagramWeave-Public.
- The final root manifest location under `VisualProjectManagement/subsystems/` is still future P2 work.
- Browser e2e command currently reaches all four smoke tests but does not exit within the tool timeout in this environment.

## Needs Follow-Up

- Add parent launcher integration once the root `core-server` exists.
- Decide whether DiagramWeave-Public should eventually move editor assets into `client/` or keep root-level legacy files permanently.
- Define a shared contract for subsystem process messages if VisualProjectManagement adopts MiniApp_Hub-style process supervision.
- Investigate the Playwright e2e runner teardown timeout separately from this architecture slice.

# Stop Rules

Stop and ask Owner before proceeding if any condition is met:

- A task requires system-level installation.
- A task requires secrets, API keys, private credentials, or production data.
- A task requires destructive Git or filesystem operations.
- A dependency license or security risk is unclear.
- A Visio `.vsd` or `.vsdx` conversion strategy requires an external binary service.
- Import behavior could mutate or discard user data without preview and confirmation.
- A migration would make existing `.diagramweave.json`, `.vso`, or `.diagramweave.xlsx` files unreadable.
- Required verification cannot be run and there is no reasonable alternate check.

Controller must record the blocker before returning work to Owner.

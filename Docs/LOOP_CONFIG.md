# DiagramWeave Agent Loop Config

```yaml
protocol_version: 1
runner: agent-loop-engineering
max_loops: 15
max_consecutive_failures: 2
max_runtime_minutes: 60
max_context_files_per_loop: 8
require_double_evidence_for_done: true
core_verification: test
allow_parallel_tasks: false
allow_project_dependency_install: true
allow_project_config_changes: true
allow_system_install: false
allow_secret_access: false
allow_production_data_access: false
allow_destructive_changes: false
```

## Notes

- Sequential work is required because Controller, Developer, and QA are currently one agent.
- Dependency installation is allowed only inside the project and only when the work order requires it.
- System-level installs, secrets, production data, and destructive changes require Owner approval.

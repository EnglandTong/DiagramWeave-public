async function loadHubState() {
  const [healthResponse, subsystemsResponse] = await Promise.all([
    fetch('/api/health'),
    fetch('/api/subsystems'),
  ]);

  const health = await healthResponse.json();
  const subsystems = await subsystemsResponse.json();

  document.getElementById('runtime-status').textContent = health.status || 'unknown';
  document.getElementById('architecture').textContent = health.architecture || 'unknown';
  document.getElementById('runtime-port').textContent = String(new URL(location.href).port || '80');

  renderSubsystems(subsystems.data || []);
}

function renderSubsystems(subsystems) {
  const container = document.getElementById('subsystems');

  if (!subsystems.length) {
    container.textContent = 'No registered subsystems.';
    return;
  }

  container.replaceChildren(...subsystems.map((subsystem) => {
    const card = document.createElement('article');
    card.className = 'subsystem-card';

    const title = document.createElement('h3');
    title.textContent = subsystem.name;

    const summary = document.createElement('p');
    summary.textContent = `${subsystem.kind} - ${subsystem.status}`;

    const capabilities = document.createElement('div');
    capabilities.className = 'capabilities';
    for (const capability of subsystem.capabilities || []) {
      const tag = document.createElement('span');
      tag.textContent = capability;
      capabilities.append(tag);
    }

    const link = document.createElement('a');
    link.className = 'secondary-action';
    link.href = subsystem.entry?.localPath || '/flowchart-editor.html';
    link.textContent = 'Launch';

    card.append(title, summary, capabilities, link);
    return card;
  }));
}

loadHubState().catch((error) => {
  document.getElementById('runtime-status').textContent = 'error';
  document.getElementById('subsystems').textContent = error instanceof Error ? error.message : 'Unable to load hub state.';
});

export const DEFAULT_HOST = '127.0.0.1';
export const DEFAULT_PORT = 4273;

export const DIAGRAMWEAVE_SUBSYSTEM = {
  id: 'diagramweave-editor',
  name: 'DiagramWeave Editor',
  kind: 'visual-diagramming-editor',
  version: '1.0.0',
  path: '.',
  status: 'active',
  entry: {
    type: 'web',
    localPath: '/flowchart-editor.html',
    localUrl: `http://${DEFAULT_HOST}:${DEFAULT_PORT}/flowchart-editor.html`,
    healthUrl: `http://${DEFAULT_HOST}:${DEFAULT_PORT}/api/health`,
  },
  capabilities: [
    'standalone',
    'diagram-editor',
    'templates',
    'import-export',
    'routing',
    'content-pack',
  ],
  data: {
    storage: 'browser-local',
    backupPaths: [],
  },
  verification: {
    commands: [
      'npm.cmd run typecheck',
      'npm.cmd test',
      'npm.cmd run test:e2e',
    ],
  },
};

export const DIAGRAMWEAVE_HUB_MANIFEST = {
  id: 'diagramweave-public',
  name: 'DiagramWeave-Public',
  version: '1.0.0',
  architecture: 'miniapp-hub-child',
  parentSystem: 'VisualProjectManagement',
  status: 'active',
  rootManagedPort: DEFAULT_PORT,
  legacyStandalonePort: 4173,
  folders: {
    coreServer: 'core-server',
    client: 'client',
    shared: 'shared',
    subsystems: 'subsystems',
    docs: 'Docs',
  },
  subsystems: [DIAGRAMWEAVE_SUBSYSTEM],
};

export function withRuntimeUrls(manifest, options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = Number(options.port || manifest.rootManagedPort || DEFAULT_PORT);
  const runtimeManifest = structuredCloneSafe(manifest);

  runtimeManifest.rootManagedPort = port;
  runtimeManifest.subsystems = runtimeManifest.subsystems.map((subsystem) => ({
    ...subsystem,
    entry: {
      ...subsystem.entry,
      localUrl: `http://${host}:${port}${subsystem.entry.localPath}`,
      healthUrl: `http://${host}:${port}/api/health`,
    },
  }));

  return runtimeManifest;
}

export function validateHubManifest(manifest) {
  const issues = [];

  if (!manifest || typeof manifest !== 'object') {
    return ['manifest must be an object'];
  }

  for (const field of ['id', 'name', 'version', 'architecture', 'subsystems']) {
    if (!(field in manifest)) issues.push(`missing field: ${field}`);
  }

  if (!Array.isArray(manifest.subsystems) || manifest.subsystems.length === 0) {
    issues.push('subsystems must contain at least one entry');
  } else {
    for (const subsystem of manifest.subsystems) {
      for (const field of ['id', 'name', 'kind', 'status', 'entry', 'capabilities']) {
        if (!(field in subsystem)) issues.push(`subsystem ${subsystem.id || '<unknown>'} missing field: ${field}`);
      }
      if (!subsystem.entry?.localPath) {
        issues.push(`subsystem ${subsystem.id || '<unknown>'} missing entry.localPath`);
      }
      if (!Array.isArray(subsystem.capabilities) || subsystem.capabilities.length === 0) {
        issues.push(`subsystem ${subsystem.id || '<unknown>'} needs capabilities`);
      }
    }
  }

  return issues;
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

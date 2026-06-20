import { describe, expect, it } from 'vitest';

import {
  DIAGRAMWEAVE_HUB_MANIFEST,
  validateHubManifest,
  withRuntimeUrls,
} from '../shared/manifest.mjs';

describe('DiagramWeave hub manifest', () => {
  it('matches the MiniApp Hub child-system shape', () => {
    const issues = validateHubManifest(DIAGRAMWEAVE_HUB_MANIFEST);
    expect(issues).toEqual([]);
    expect(DIAGRAMWEAVE_HUB_MANIFEST.folders).toMatchObject({
      coreServer: 'core-server',
      client: 'client',
      shared: 'shared',
      subsystems: 'subsystems',
    });
    expect(DIAGRAMWEAVE_HUB_MANIFEST.subsystems[0].id).toBe('diagramweave-editor');
  });

  it('rewrites runtime URLs for launcher-assigned ports', () => {
    const runtime = withRuntimeUrls(DIAGRAMWEAVE_HUB_MANIFEST, {
      host: '127.0.0.1',
      port: 4999,
    });

    expect(runtime.rootManagedPort).toBe(4999);
    expect(runtime.subsystems[0].entry.localUrl).toBe('http://127.0.0.1:4999/flowchart-editor.html');
    expect(runtime.subsystems[0].entry.healthUrl).toBe('http://127.0.0.1:4999/api/health');
  });
});

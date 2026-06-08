import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, beforeAll } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadBootstrap() {
  const storage = new Map();
  const localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  };
  const sandbox = {
    localStorage,
    location: { protocol: 'http:' },
    DiagramWeaveBootstrap: null,
    showToast: () => {},
    fetch: async () => ({
      ok: true,
      json: async () => ({ version: '1.2.0', assets: [], githubRepo: '' }),
    }),
  };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(root, 'diagramweave-bootstrap.js'), 'utf8'), sandbox);
  return { B: sandbox.DiagramWeaveBootstrap, localStorage: storage };
}

describe('DiagramWeaveBootstrap update', () => {
  /** @type {ReturnType<typeof loadBootstrap>['B']} */
  let B;

  beforeAll(async () => {
    const loaded = loadBootstrap();
    B = loaded.B;
    await B.ensureRuntime();
  });

  it('compareVersions orders semver-like strings', () => {
    expect(B.compareVersions('1.2.0', '1.1.9')).toBeGreaterThan(0);
    expect(B.compareVersions('1.2.0', '1.2.0')).toBe(0);
    expect(B.compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
  });

  it('derives update URL from githubRepo when unset', () => {
    B.saveUpdateSettings({ githubRepo: 'acme/DiagramWeave', updateCheckUrl: '', releasePageUrl: '' });
    expect(B.getUpdateCheckUrl()).toContain('raw.githubusercontent.com/acme/DiagramWeave/');
    expect(B.getReleasePageUrl()).toBe('https://github.com/acme/DiagramWeave/releases/latest');
    B.saveUpdateSettings({ githubRepo: '', updateCheckUrl: '', releasePageUrl: '' });
  });
});

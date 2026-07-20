import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, beforeAll } from 'vitest';

import { assertExtensionInvokeResult } from './extension-contract.test.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadScript(relativePath, sandbox) {
  const code = readFileSync(join(root, relativePath), 'utf8');
  vm.runInNewContext(code, sandbox);
}

function loadKernel() {
  const sandbox = { window: {}, DiagramWeaveSanitize: null, DiagramWeaveExport: null, DiagramWeaveExtensionKernel: null };
  sandbox.window = sandbox;
  loadScript('flowchart-sanitize.js', sandbox);
  loadScript('diagramweave-import-preview.js', sandbox);
  loadScript('flowchart-export-shapes.js', sandbox);
  loadScript('diagramweave-extension-kernel.js', sandbox);
  return sandbox.DiagramWeaveExtensionKernel;
}

describe('DiagramWeaveExtensionKernel invoke runtime', () => {
  /** @type {ReturnType<typeof loadKernel>} */
  let kernel;

  beforeAll(() => {
    kernel = loadKernel();
  });

  it('returns unknown_operation for unregistered id', () => {
    const result = kernel.invokeExtension('not.real', {});
    assertExtensionInvokeResult(result);
    expect(result.success).toBe(false);
    expect(result.issues[0]?.code).toBe('unknown_operation');
  });

  it('sanitize.document accepts valid v1 flow', () => {
    const result = kernel.invokeExtension('sanitize.document', {
      raw: {
        nodes: [{ id: 'n1', label: 'A', x: 0, y: 0, w: 100, h: 60 }],
        connections: [],
      },
    });
    assertExtensionInvokeResult(result);
    expect(result.success).toBe(true);
    expect(result.data?.nodes?.length).toBe(1);
  });

  it('sanitize.document rejects invalid input', () => {
    const result = kernel.invokeExtension('sanitize.document', { raw: null });
    assertExtensionInvokeResult(result);
    expect(result.success).toBe(false);
    expect(result.issues[0]?.code).toBe('sanitize_rejected');
  });

  it('import.preview.document reports issues without mutating input', () => {
    const raw = {
      nodes: [{ id: 'n1', label: 'A' }],
      connections: [{ id: 'c1', from: 'n1', to: 'missing' }],
    };
    const before = JSON.stringify(raw);
    const result = kernel.invokeExtension('import.preview.document', { raw, sourceType: 'json' });
    assertExtensionInvokeResult(result);
    expect(result.success).toBe(true);
    expect(result.data.summary.connections).toBe(0);
    expect(result.issues[0]).toMatchObject({ row: 2, field: 'to' });
    expect(JSON.stringify(raw)).toBe(before);
  });

  it('export.nodeShape returns svg fragment', () => {
    const result = kernel.invokeExtension('export.nodeShape', {
      node: { x: 10, y: 20, w: 80, h: 40, shape: 'rectangle', fillColor: '#1e2029', strokeColor: '#3a3e55' },
    });
    assertExtensionInvokeResult(result);
    expect(result.success).toBe(true);
    expect(result.data?.svg).toMatch(/<rect/);
  });

  it('export.nodeShape fails without node', () => {
    const result = kernel.invokeExtension('export.nodeShape', {});
    assertExtensionInvokeResult(result);
    expect(result.success).toBe(false);
    expect(result.issues[0]?.code).toBe('invalid_input');
  });

  it('normalizes asynchronous handler results', async () => {
    kernel.registerHandler('test.async', async () => ({ success: true, data: { parsed: true }, issues: [], warnings: ['controlled subset'] }));
    const result = await kernel.invokeExtensionAsync('test.async', {}); assertExtensionInvokeResult(result);
    expect(result).toMatchObject({ success: true, data: { parsed: true }, warnings: ['controlled subset'] });
  });
});

describe('DiagramWeaveExtensionKernel registry', () => {
  it('enumerates one enabled built-in for every required kind', () => {
    const kernel = loadKernel();
    const extensions = kernel.listExtensions({ enabled: true });
    expect(new Set(extensions.map(extension => extension.kind))).toEqual(new Set([
      'importer', 'exporter', 'template', 'stencil', 'validator', 'routing', 'history', 'ai-provider',
    ]));
    expect(extensions.every(extension => extension.builtIn)).toBe(true);
  });

  it('validates metadata and rejects duplicate identifiers', () => {
    const kernel = loadKernel();
    expect(() => kernel.registerExtension({ id: 'invalid', name: 'Invalid', version: '1', kind: 'unknown' }))
      .toThrow(/kind is invalid/);
    const descriptor = {
      id: 'test.importer', name: 'Test Importer', version: '1.0.0', kind: 'importer',
      enabled: false, capabilities: ['preview'], config: { strict: true },
    };
    expect(kernel.registerExtension(descriptor)).toMatchObject(descriptor);
    expect(() => kernel.registerExtension(descriptor)).toThrow(/already registered/);
  });

  it('can enable and disable a registered extension without mutating metadata', () => {
    const kernel = loadKernel();
    const before = kernel.getExtension('builtin.ai');
    const after = kernel.setExtensionEnabled('builtin.ai', false);
    expect(after.enabled).toBe(false);
    expect(after.capabilities).toEqual(before.capabilities);
    expect(kernel.listExtensions({ kind: 'ai-provider', enabled: false })).toHaveLength(1);
  });
});

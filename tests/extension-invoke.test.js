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
});

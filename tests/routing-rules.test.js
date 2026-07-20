import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = {}; vm.createContext(sandbox); vm.runInContext(readFileSync(join(root, 'diagramweave-routing-rules.js'), 'utf8'), sandbox);
const R = sandbox.DiagramWeaveRoutingRules;

describe('routing rules contract', () => {
  it('normalizes project routing defaults', () => {
    expect(R.normalizeRules({ obstaclePadding: 999, bridgeBehavior: 'none', endpointLock: false })).toEqual({
      endpointLock: false, obstaclePadding: 80, bridgeBehavior: 'none', bridgeSize: 8, defaultLabelPlacement: 'auto',
    });
  });
  it('sanitizes waypoints and custom label offsets', () => {
    expect(R.normalizeConnectionRouting({ waypoints: [{ x: 12, y: 20, locked: true }, { x: 'bad' }], labelPlacement: 'custom', labelOffset: { x: 4, y: -8 } })).toEqual({
      waypoints: [{ x: 12, y: 20, locked: true }], labelPlacement: 'custom', labelOffset: { x: 4, y: -8 },
    });
  });
});

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { zipSync, strToU8 } from 'fflate';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'audit-results', 'visio-fixtures');
mkdirSync(out, { recursive: true });
const sandbox = {}; sandbox.window = sandbox;
vm.runInNewContext(readFileSync(join(root, 'diagramweave-visio-bridge.js'), 'utf8'), sandbox);
const api = sandbox.DiagramWeaveVisioBridge;

const samples = {
  'basic-flowchart': { pages: [{ name: 'Basic Flowchart', nodes: [{ id: 'a', label: 'Start', x: 96, y: 96, w: 120, h: 64 }, { id: 'b', label: 'Finish', x: 320, y: 220, w: 120, h: 64 }], connections: [{ from: 'a', to: 'b', label: 'next' }] }] },
  swimlane: { pages: [{ name: 'Swimlane', nodes: [{ id: 'lane', label: 'Operations', shape: 'swimlane', x: 40, y: 40, w: 420, h: 140 }, { id: 'task', label: 'Approve', x: 180, y: 100, w: 120, h: 64 }], connections: [] }] },
  'connector-heavy': { pages: [{ name: 'Connector Heavy', nodes: Array.from({ length: 8 }, (_, i) => ({ id: `n${i}`, label: `Node ${i}`, x: 40 + (i % 4) * 180, y: 80 + Math.floor(i / 4) * 180, w: 120, h: 64 })), connections: Array.from({ length: 7 }, (_, i) => ({ from: `n${i}`, to: `n${i + 1}`, label: `edge ${i + 1}` })) }] },
};

for (const [name, document] of Object.entries(samples)) {
  const entries = api.packageEntries(document);
  const bytes = zipSync(Object.fromEntries(Object.entries(entries).map(([path, xml]) => [path, strToU8(xml)])));
  writeFileSync(join(out, `${name}.vsdx`), bytes);
}
console.log(`Generated ${Object.keys(samples).length} VSDX fixtures in ${out}`);

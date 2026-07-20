import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../diagramweave-process-analysis.js', import.meta.url), 'utf8');
let analyzeProcess;
beforeEach(() => { const context = { globalThis: {} }; context.globalThis = context; vm.runInNewContext(source, context); analyzeProcess = context.DiagramWeaveProcessAnalysis.analyzeProcess; });

describe('process analysis', () => {
  it('reports critical path, load, wait, bottlenecks and SLA risk', () => {
    const document = { slaDays: 5, pages: [{ id: 'p1', nodes: [
      { id: 'a', duration: 1, role: 'Ops' }, { id: 'b', duration: 4, role: 'QA', waitDays: 3 }, { id: 'c', duration: 2, role: 'Ops' },
    ], connections: [{ from: 'a', to: 'b' }, { from: 'a', to: 'c' }] }] };
    const page = analyzeProcess(document).pages[0];
    expect(page.criticalPath).toEqual(['a', 'b']); expect(page.criticalDuration).toBe(5);
    expect(page.bottlenecks[0]).toMatchObject({ nodeId: 'a', outgoing: 2 });
    expect(page.roleLoad.find(row => row.role === 'Ops')).toMatchObject({ nodeCount: 2, duration: 3 });
    expect(page.longestWait).toEqual({ nodeId: 'b', days: 3 }); expect(page.sla.risk).toBe(false);
  });

  it('handles cycles, unreachable nodes and broken references without mutation', () => {
    const document = { pages: [{ id: 'p', slaDays: 1, nodes: [{ id: 'a', duration: 2 }, { id: 'b', duration: 1 }], connections: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }, { from: 'x', to: 'a' }] }] };
    const before = JSON.stringify(document); const first = analyzeProcess(document); const second = analyzeProcess(document);
    expect(first.pages[0].cycles).toEqual([['a', 'b']]); expect(first.pages[0].unreachable).toEqual(['a', 'b']);
    expect(first.pages[0].sla.risk).toBe(true); expect(first).toEqual(second); expect(JSON.stringify(document)).toBe(before);
  });
});

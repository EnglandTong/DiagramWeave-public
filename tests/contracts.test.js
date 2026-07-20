import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../diagramweave-contracts.js', import.meta.url), 'utf8');
let api;
beforeEach(() => {
  const context = { globalThis: {}, structuredClone };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  api = context.DiagramWeaveContracts;
});

describe('document contracts', () => {
  it('migrates old documents without mutating the input', () => {
    const old = { version: 2, pages: [{ id: 'p1', nodes: [{ id: 'n1' }], connections: [] }] };
    const result = api.migrateDocument(old);
    expect(result.fromVersion).toBe(2);
    expect(result.document.schemaVersion).toBe(3);
    expect(result.document.pages[0].nodes[0].textColor).toBe('auto');
    expect(old.pages[0].nodes[0].textColor).toBeUndefined();
  });

  it('serializes review state through migration', () => {
    const thread = api.setReviewStatus(api.createReviewThread({ id: 'r1', targetId: 'n1' }), 'approved');
    const result = api.migrateDocument({ pages: [], reviewThreads: [thread] }).document;
    expect(result.reviewThreads[0]).toMatchObject({ id: 'r1', targetId: 'n1', status: 'approved' });
  });

  it('adds bounded immutable review comments', () => {
    const thread = api.createReviewThread({ id: 'r1', targetId: 'n1' }); const next = api.addReviewComment(thread, { id: 'c1', author: 'QA', body: '<b>check</b>', createdAt: '2026-07-17' });
    expect(next.comments[0]).toMatchObject({ id: 'c1', author: 'QA', body: '<b>check</b>' }); expect(thread.comments).toHaveLength(0);
    expect(() => api.addReviewComment(thread, { body: '  ' })).toThrow('comment body is required');
  });

  it('reports broken references, isolated nodes and missing labels', () => {
    const issues = api.inspectQuality({ pages: [{ nodes: [{ id: 'n1', label: '' }], connections: [{ id: 'c1', from: 'n1', to: 'missing' }] }] });
    expect(issues.map(issue => issue.rule)).toEqual(expect.arrayContaining(['broken-reference', 'missing-label']));
    expect(issues.every(issue => issue.message.zh && issue.message.en)).toBe(true);
  });

  it('reports deterministic unreachable, dead-end, and duplicate issues without mutation', () => {
    const document = { pages: [{ id: 'p1', nodes: [
      { id: 'start', label: 'Start', shape: 'start' }, { id: 'task', label: 'Task', shape: 'rectangle' },
      { id: 'cycleA', label: 'A', shape: 'rectangle' }, { id: 'cycleB', label: 'B', shape: 'rectangle' },
    ], connections: [
      { id: 'c1', from: 'start', to: 'task' }, { id: 'c2', from: 'start', to: 'task' },
      { id: 'c3', from: 'cycleA', to: 'cycleB' }, { id: 'c4', from: 'cycleB', to: 'cycleA' },
    ] }] };
    const before = structuredClone(document);
    const issues = api.inspectQuality(document);
    expect(issues.map(issue => issue.rule)).toEqual(expect.arrayContaining(['duplicate-connection', 'dead-end', 'unreachable-node']));
    expect(document).toEqual(before);
    expect(api.inspectQuality(document)).toEqual(issues);
  });

  it('requires explicit permission before invoking an AI provider', async () => {
    let previewCalls = 0; let runCalls = 0;
    api.registerAIProvider({ id: 'local-test', enabled: true, preview: () => { previewCalls++; return { fields: ['label'] }; }, run: () => { runCalls++; return { suggestion: 'x' }; } });
    expect((await api.invokeAIProvider('local-test', { nodes: [1] }, false)).issues[0].code).toBe('AI_GLOBALLY_DISABLED'); expect(previewCalls).toBe(0); expect(runCalls).toBe(0);
    api.setAIEnabled(true); const denied = await api.invokeAIProvider('local-test', { nodes: [1] }, false); expect(denied.issues[0].code).toBe('AI_PERMISSION_REQUIRED'); expect(denied.data.preview.fields).toEqual(['nodes']); expect(previewCalls).toBe(0);
    const allowed = await api.invokeAIProvider('local-test', { nodes: [1] }, true); expect(allowed.success).toBe(true); expect(allowed.data.result).toEqual({ suggestion: 'x' }); expect(previewCalls).toBe(1); expect(runCalls).toBe(1);
    api.setAIEnabled(false); expect(api.isAIEnabled()).toBe(false);
  });
});

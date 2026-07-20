import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

let center;
beforeAll(() => {
  const context = { globalThis: null }; context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(new URL('../diagramweave-template-center.js', import.meta.url), 'utf8'), context);
  center = context.DiagramWeaveTemplateCenter;
});

describe('template center model', () => {
  const raw = { name: '鱼骨分析', nameEn: 'Fishbone Analysis', description: '根因', descriptionEn: 'Root cause', nodes: [{}, {}], connections: [{}] };

  it('normalizes category, tags, bilingual metadata, and preview', () => {
    const template = center.normalizeTemplate(raw, 2);
    expect(template.category).toBe('Fishbone');
    expect(template.tags).toContain('Fishbone');
    expect(template.preview).toEqual(expect.objectContaining({ nodeCount: 2, connectionCount: 1 }));
    expect(template.sourceIndex).toBe(2);
  });

  it('searches Chinese, English, tags, and category', () => {
    const templates = [center.normalizeTemplate(raw), center.normalizeTemplate({ name: '事件响应', nameEn: 'Incident Response', tags: ['SLA'] }, 1)];
    expect(center.searchTemplates(templates, 'root').map(item => item.sourceIndex)).toEqual([0]);
    expect(center.searchTemplates(templates, 'SLA').map(item => item.sourceIndex)).toEqual([1]);
    expect(center.searchTemplates(templates, '', 'Fishbone')).toHaveLength(1);
  });

  it('persists favorite template ids', () => {
    const values = new Map();
    const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
    const favorites = center.createFavorites(storage, 'test');
    expect(favorites.toggle('a')).toEqual(['a']);
    expect(favorites.toggle('a')).toEqual([]);
  });
});

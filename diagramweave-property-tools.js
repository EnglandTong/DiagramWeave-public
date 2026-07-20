(function initPropertyTools(global) {
  'use strict';

  function mixedValue(nodes, field, fallback = '') {
    if (!nodes.length) return { mixed: false, value: fallback };
    const values = nodes.map(node => node[field] ?? fallback);
    const first = values[0];
    return values.every(value => value === first)
      ? { mixed: false, value: first }
      : { mixed: true, value: null };
  }

  function normalizeColor(value, allowAuto = false) {
    const raw = String(value || '').trim().toLowerCase();
    if (allowAuto && raw === 'auto') return 'auto';
    if (/^#[0-9a-f]{3}$/.test(raw)) return `#${raw.slice(1).split('').map(char => char + char).join('')}`;
    return /^#[0-9a-f]{6}$/.test(raw) ? raw : null;
  }

  function createBatchPatches(nodes, field, value) {
    return nodes.filter(node => node[field] !== value).map(node => ({ id: node.id, [field]: value }));
  }

  function applyPatches(nodes, patches) {
    const byId = new Map(patches.map(patch => [patch.id, patch]));
    return nodes.map(node => byId.has(node.id) ? { ...node, ...byId.get(node.id) } : node);
  }

  global.DiagramWeavePropertyTools = { mixedValue, normalizeColor, createBatchPatches, applyPatches };
})(typeof window !== 'undefined' ? window : globalThis);

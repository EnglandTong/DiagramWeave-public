(function initStencilManager(global) {
  'use strict';

  const STORAGE_KEY = 'dw-stencil-packs';
  const normalize = value => String(value || '').trim();

  function validatePack(raw, sanitizer) {
    const issues = [];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { success: false, data: null, issues: ['Pack must be a JSON object.'], warnings: [] };
    }
    const id = normalize(raw.id || raw.packId);
    const name = normalize(raw.name || raw.label);
    if (!/^[a-z][a-z0-9_-]{1,31}$/i.test(id)) issues.push('Pack id must be 2-32 letters, numbers, underscores, or hyphens.');
    if (!name) issues.push('Pack name is required.');
    if (!Array.isArray(raw.shapes) || !raw.shapes.length) issues.push('Pack must contain at least one shape.');
    const sanitized = sanitizer?.({ packVersion: raw.version || '1', shapes: raw.shapes || [] });
    if (!sanitized || sanitized.shapes.length !== (raw.shapes || []).length) issues.push('Every shape must have a unique valid id, label, and safe SVG.');
    const ids = (sanitized?.shapes || []).map(shape => shape.id);
    if (new Set(ids).size !== ids.length) issues.push('Shape ids must be unique within the pack.');
    if (issues.length) return { success: false, data: null, issues, warnings: [] };
    return { success: true, data: {
      id, name: name.slice(0, 60), version: normalize(raw.version || '1').slice(0, 20), enabled: raw.enabled !== false,
      shapes: sanitized.shapes.map(shape => ({ ...shape, packId: id, category: shape.section || name })),
    }, issues: [], warnings: [] };
  }

  function createStore(storage, sanitizer) {
    let packs = [];
    try { packs = JSON.parse(storage?.getItem(STORAGE_KEY) || '[]'); } catch { packs = []; }
    const persist = () => { try { storage?.setItem(STORAGE_KEY, JSON.stringify(packs)); } catch { /* unavailable */ } };
    return {
      list: () => packs.map(pack => ({ ...pack, shapes: pack.shapes.map(shape => ({ ...shape })) })),
      importPack(raw) {
        const result = validatePack(raw, sanitizer);
        if (!result.success) return result;
        if (packs.some(pack => pack.id === result.data.id)) return { success: false, data: null, issues: [`Pack id '${result.data.id}' already exists.`], warnings: [] };
        packs.push(result.data); persist(); return result;
      },
      setEnabled(id, enabled) { const pack = packs.find(item => item.id === id); if (!pack) return false; pack.enabled = Boolean(enabled); persist(); return true; },
      rename(id, name) { const pack = packs.find(item => item.id === id); const next = normalize(name); if (!pack || !next) return false; pack.name = next.slice(0, 60); persist(); return true; },
      remove(id) { const before = packs.length; packs = packs.filter(item => item.id !== id); persist(); return packs.length < before; },
      exportPack(id) { const pack = packs.find(item => item.id === id); return pack ? JSON.stringify(pack, null, 2) : ''; },
    };
  }

  global.DiagramWeaveStencilManager = { validatePack, createStore, STORAGE_KEY };
})(typeof window !== 'undefined' ? window : globalThis);

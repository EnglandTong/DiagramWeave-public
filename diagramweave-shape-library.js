(function initShapeLibrary(global) {
  'use strict';

  const normalize = value => String(value || '').trim();
  const lower = value => normalize(value).toLocaleLowerCase();

  function createRegistry(initial = []) {
    const entries = new Map();
    const register = raw => {
      const id = normalize(raw?.id);
      if (!id) throw new Error('shape id is required');
      const entry = {
        id,
        label: normalize(raw.label) || id,
        category: normalize(raw.category) || 'Other',
        packId: normalize(raw.packId) || 'builtin',
        keywords: Array.isArray(raw.keywords) ? raw.keywords.map(normalize).filter(Boolean) : [],
        defaults: raw.defaults || null,
        renderAs: raw.renderAs || id,
      };
      entries.set(id, entry);
      return entry;
    };
    initial.forEach(register);
    return {
      register,
      unregister: id => entries.delete(id),
      unregisterPack(packId) {
        let count = 0;
        for (const [id, entry] of entries) if (entry.packId === packId) { entries.delete(id); count += 1; }
        return count;
      },
      get: id => entries.get(id) || null,
      list: () => [...entries.values()],
      search(query) {
        const needle = lower(query);
        if (!needle) return [...entries.values()];
        return [...entries.values()].filter(entry => lower([
          entry.id, entry.label, entry.category, entry.packId, ...entry.keywords,
        ].join(' ')).includes(needle));
      },
      groupByCategory(items = [...entries.values()]) {
        return items.reduce((groups, entry) => {
          (groups[entry.category] ||= []).push(entry);
          return groups;
        }, {});
      },
    };
  }

  function createPreferences(storage, prefix = 'dw-shapes') {
    const read = key => {
      try { return JSON.parse(storage?.getItem(`${prefix}:${key}`) || '[]'); } catch { return []; }
    };
    const write = (key, value) => {
      try { storage?.setItem(`${prefix}:${key}`, JSON.stringify(value)); } catch { /* unavailable */ }
      return value;
    };
    return {
      favorites: () => [...new Set(read('favorites').map(String))],
      toggleFavorite(id) {
        const values = this.favorites();
        return write('favorites', values.includes(id) ? values.filter(item => item !== id) : [...values, id]);
      },
      recent: () => [...new Set(read('recent').map(String))],
      recordRecent(id, limit = 8) {
        return write('recent', [id, ...this.recent().filter(item => item !== id)].slice(0, limit));
      },
    };
  }

  global.DiagramWeaveShapeLibrary = { createRegistry, createPreferences };
})(typeof window !== 'undefined' ? window : globalThis);

(function initHistory(global) {
  'use strict';
  const DB_NAME = 'diagramweave-history';
  const STORE_NAME = 'snapshots';
  const DEFAULT_LIMIT = 50;
  const DEFAULT_BYTES = 20 * 1024 * 1024;
  const clone = value => JSON.parse(JSON.stringify(value));

  function createMemoryStore(options = {}) {
    const limit = options.limit || DEFAULT_LIMIT; const maxBytes = options.maxBytes || DEFAULT_BYTES; let rows = [];
    const prune = projectId => {
      const projectRows = rows.filter(row => row.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      let bytes = 0; const keep = new Set();
      for (const row of projectRows) { if (keep.size >= limit || bytes + row.bytes > maxBytes) continue; keep.add(row.id); bytes += row.bytes; }
      rows = rows.filter(row => row.projectId !== projectId || keep.has(row.id));
    };
    return {
      async addSnapshot(projectId, operation, document) {
        const serialized = JSON.stringify(document); const row = { id: `${projectId}:${Date.now()}:${Math.random().toString(36).slice(2)}`, projectId, operation: String(operation || 'Edit').slice(0, 80), createdAt: new Date().toISOString(), bytes: serialized.length, document: clone(document) };
        rows.push(row); prune(projectId); return clone(row);
      },
      async list(projectId) { return clone(rows.filter(row => row.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))); },
      async get(id) { const row = rows.find(item => item.id === id); return row ? clone(row) : null; },
      async delete(id) { const before = rows.length; rows = rows.filter(item => item.id !== id); return rows.length < before; },
      async clear(projectId) { rows = rows.filter(row => row.projectId !== projectId); },
      async importRows(projectId, imported) { for (const row of imported || []) await this.addSnapshot(projectId, row.operation || 'Imported history', row.document); },
    };
  }

  function createIndexedDbStore(indexedDB, options = {}) {
    if (!indexedDB) return createMemoryStore(options);
    const memory = createMemoryStore(options); let dbPromise;
    const open = () => dbPromise ||= new Promise((resolve, reject) => {
      const request = indexedDB.open(options.dbName || DB_NAME, 1);
      request.onupgradeneeded = () => { const store = request.result.createObjectStore(STORE_NAME, { keyPath: 'id' }); store.createIndex('projectId', 'projectId'); };
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const request = (mode, action) => open().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode); const store = tx.objectStore(STORE_NAME); let result;
      try { result = action(store); } catch (error) { reject(error); return; }
      tx.oncomplete = () => resolve(result?.result ?? result); tx.onerror = () => reject(tx.error);
    }));
    const api = {
      async addSnapshot(projectId, operation, document) {
        const row = await memory.addSnapshot(projectId, operation, document); await request('readwrite', store => store.put(row));
        const all = await api.list(projectId); let bytes = 0;
        for (let i = 0; i < all.length; i += 1) { bytes += all[i].bytes; if (i >= (options.limit || DEFAULT_LIMIT) || bytes > (options.maxBytes || DEFAULT_BYTES)) await api.delete(all[i].id); }
        return row;
      },
      async list(projectId) { const rows = await request('readonly', store => store.index('projectId').getAll(projectId)); return (rows || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
      async get(id) { return (await request('readonly', store => store.get(id))) || null; },
      async delete(id) { await request('readwrite', store => store.delete(id)); return true; },
      async clear(projectId) { const rows = await api.list(projectId); await Promise.all(rows.map(row => api.delete(row.id))); },
      async importRows(projectId, rows) { for (const row of rows || []) await api.addSnapshot(projectId, row.operation || 'Imported history', row.document); },
    };
    return api;
  }

  global.DiagramWeaveHistory = { createMemoryStore, createIndexedDbStore, DB_NAME, DEFAULT_LIMIT, DEFAULT_BYTES };
})(typeof window !== 'undefined' ? window : globalThis);

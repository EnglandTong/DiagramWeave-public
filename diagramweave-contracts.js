(function initDiagramWeaveContracts(global) {
  'use strict';

  const CURRENT_SCHEMA_VERSION = 3;
  const REVIEW_STATUSES = Object.freeze(['pending', 'approved', 'changes_requested', 'resolved']);

  function migrateDocument(input) {
    const source = input && typeof input === 'object' ? input : {};
    const migrated = JSON.parse(JSON.stringify(source));
    const fromVersion = Number(migrated.schemaVersion || migrated.version || 1);
    if (!Array.isArray(migrated.reviewThreads)) migrated.reviewThreads = [];
    migrated.reviewThreads = migrated.reviewThreads.filter(Boolean).slice(0, 1000).map((thread, index) => ({
      id: String(thread.id || `review_${index + 1}`).slice(0, 120),
      targetType: thread.targetType === 'connection' ? 'connection' : 'node',
      targetId: String(thread.targetId || '').slice(0, 120),
      status: REVIEW_STATUSES.includes(thread.status) ? thread.status : 'pending',
      comments: Array.isArray(thread.comments) ? thread.comments.filter(Boolean).slice(0, 500).map(comment => ({
        id: String(comment.id || '').slice(0, 120), author: String(comment.author || '').slice(0, 120),
        body: String(comment.body || '').slice(0, 5000), createdAt: String(comment.createdAt || '').slice(0, 80),
      })) : [],
    }));
    for (const page of migrated.pages || []) {
      for (const node of page.nodes || []) if (node.textColor == null) node.textColor = 'auto';
    }
    migrated.schemaVersion = CURRENT_SCHEMA_VERSION;
    return { document: migrated, fromVersion, toVersion: CURRENT_SCHEMA_VERSION };
  }

  function createReviewThread(input) {
    if (!input?.targetId) throw new Error('targetId is required');
    return {
      id: input.id || `review_${Date.now()}`,
      targetType: input.targetType === 'connection' ? 'connection' : 'node',
      targetId: String(input.targetId), status: 'pending', comments: [],
    };
  }

  function setReviewStatus(thread, status) {
    if (!REVIEW_STATUSES.includes(status)) throw new Error(`invalid review status: ${status}`);
    return { ...thread, status };
  }

  function addReviewComment(thread, input) {
    const body = String(input?.body || '').trim().slice(0, 5000);
    if (!body) throw new Error('comment body is required');
    const comment = { id: String(input?.id || `comment_${Date.now()}`).slice(0, 120), author: String(input?.author || '').trim().slice(0, 120), body, createdAt: String(input?.createdAt || new Date().toISOString()).slice(0, 80) };
    return { ...thread, comments: [...(thread.comments || []), comment].slice(-500) };
  }

  function inspectQuality(document) {
    const issues = [];
    for (const page of document?.pages || []) {
      const nodes = page.nodes || [];
      const connections = page.connections || [];
      const ids = new Set(nodes.map(node => node.id));
      const incoming = new Map(nodes.map(node => [node.id, 0]));
      const outgoing = new Map(nodes.map(node => [node.id, 0]));
      for (const connection of connections) {
        if (!ids.has(connection.from) || !ids.has(connection.to)) {
          issues.push({ rule: 'broken-reference', severity: 'error', targetType: 'connection', targetId: connection.id, message: { zh: '连线引用了不存在的节点', en: 'Connection references a missing node' } });
          continue;
        }
        outgoing.set(connection.from, outgoing.get(connection.from) + 1);
        incoming.set(connection.to, incoming.get(connection.to) + 1);
      }
      for (const node of nodes) {
        if (!String(node.label || '').trim()) issues.push({ rule: 'missing-label', severity: 'warning', targetType: 'node', targetId: node.id, message: { zh: '节点缺少名称', en: 'Node has no label' }, fix: { id: 'assign-default-label', destructive: false } });
        if (nodes.length > 1 && incoming.get(node.id) === 0 && outgoing.get(node.id) === 0) issues.push({ rule: 'isolated-node', severity: 'warning', targetType: 'node', targetId: node.id, message: { zh: '节点未连接到流程', en: 'Node is isolated' } });
      }
    }
    return issues;
  }

  function inspectQualityV2(document) {
    const issues = [];
    for (const page of document?.pages || []) {
      const nodes = page.nodes || []; const connections = page.connections || [];
      const ids = new Set(nodes.map(node => node.id));
      const incoming = new Map(nodes.map(node => [node.id, 0]));
      const outgoing = new Map(nodes.map(node => [node.id, 0]));
      const adjacency = new Map(nodes.map(node => [node.id, []])); const connectionKeys = new Set();
      for (const connection of connections) {
        if (!ids.has(connection.from) || !ids.has(connection.to)) {
          issues.push({ rule: 'broken-reference', severity: 'error', targetType: 'connection', targetId: connection.id, message: { zh: '连线引用了不存在的节点', en: 'Connection references a missing node' } }); continue;
        }
        const key = `${connection.from}:${connection.fromPort || ''}->${connection.to}:${connection.toPort || ''}`;
        if (connectionKeys.has(key)) issues.push({ rule: 'duplicate-connection', severity: 'warning', targetType: 'connection', targetId: connection.id, message: { zh: '存在重复连线', en: 'Duplicate connection detected' } });
        connectionKeys.add(key); outgoing.set(connection.from, outgoing.get(connection.from) + 1); incoming.set(connection.to, incoming.get(connection.to) + 1); adjacency.get(connection.from).push(connection.to);
      }
      for (const node of nodes) {
        if (!String(node.label || '').trim()) issues.push({ rule: 'missing-label', severity: 'warning', targetType: 'node', targetId: node.id, message: { zh: '节点缺少名称', en: 'Node has no label' }, fix: { id: 'assign-default-label', destructive: false } });
        if (nodes.length > 1 && incoming.get(node.id) === 0 && outgoing.get(node.id) === 0) issues.push({ rule: 'isolated-node', severity: 'warning', targetType: 'node', targetId: node.id, message: { zh: '节点未连接到流程', en: 'Node is isolated' } });
        else if (nodes.length > 1 && outgoing.get(node.id) === 0 && !['end', 'terminator'].includes(node.shape)) issues.push({ rule: 'dead-end', severity: 'info', targetType: 'node', targetId: node.id, message: { zh: '流程在非结束节点终止', en: 'Flow stops at a non-end node' } });
      }
      const starts = nodes.filter(node => incoming.get(node.id) === 0 && outgoing.get(node.id) > 0).map(node => node.id);
      if (starts.length) {
        const visited = new Set(starts); const queue = [...starts];
        while (queue.length) for (const next of adjacency.get(queue.shift()) || []) if (!visited.has(next)) { visited.add(next); queue.push(next); }
        for (const node of nodes) if (!visited.has(node.id) && !(incoming.get(node.id) === 0 && outgoing.get(node.id) === 0)) issues.push({ rule: 'unreachable-node', severity: 'error', targetType: 'node', targetId: node.id, message: { zh: '节点无法从流程起点到达', en: 'Node is unreachable from a process start' } });
      } else if (nodes.length > 1) {
        for (const node of nodes) if (outgoing.get(node.id) > 0 || incoming.get(node.id) > 0) issues.push({ rule: 'unreachable-node', severity: 'error', targetType: 'node', targetId: node.id, message: { zh: '页面没有可到达该节点的流程起点', en: 'Page has no process start that can reach this node' } });
      }
    }
    return issues.sort((a, b) => `${a.severity}:${a.rule}:${a.targetId}`.localeCompare(`${b.severity}:${b.rule}:${b.targetId}`));
  }

  const aiProviders = new Map();
  let aiGloballyEnabled = false;
  function setAIEnabled(enabled) { aiGloballyEnabled = enabled === true; return aiGloballyEnabled; }
  function isAIEnabled() { return aiGloballyEnabled; }
  function createAIDataPreview(input) {
    const value = input && typeof input === 'object' ? JSON.parse(JSON.stringify(input)) : input;
    return { payload: value, bytes: JSON.stringify(value ?? null).length, fields: value && typeof value === 'object' ? Object.keys(value).sort() : [] };
  }
  function registerAIProvider(provider) {
    if (!provider?.id || typeof provider.preview !== 'function' || typeof provider.run !== 'function') throw new Error('invalid AIProvider');
    aiProviders.set(provider.id, { ...provider, enabled: provider.enabled === true });
  }
  function listAIProviders() { return [...aiProviders.values()].map(provider => ({ id: provider.id, name: provider.name || provider.id, enabled: provider.enabled, capabilities: [...(provider.capabilities || [])] })); }
  async function invokeAIProvider(id, input, permission) {
    const dataPreview = createAIDataPreview(input);
    const provider = aiProviders.get(id);
    if (!aiGloballyEnabled) return { success: false, data: { preview: dataPreview }, issues: [{ code: 'AI_GLOBALLY_DISABLED' }], warnings: [] };
    if (!provider || !provider.enabled) return { success: false, data: { preview: dataPreview }, issues: [{ code: 'AI_PROVIDER_DISABLED' }], warnings: [] };
    if (permission !== true) return { success: false, data: { preview: dataPreview }, issues: [{ code: 'AI_PERMISSION_REQUIRED' }], warnings: [] };
    try { const providerPreview = await provider.preview(input); return { success: true, data: { preview: dataPreview, providerPreview, result: await provider.run(input) }, issues: [], warnings: [] }; }
    catch (error) { return { success: false, data: null, issues: [{ code: 'AI_PROVIDER_FAILED', message: error?.message || String(error) }], warnings: [] }; }
  }

  global.DiagramWeaveContracts = {
    CURRENT_SCHEMA_VERSION, REVIEW_STATUSES, migrateDocument, createReviewThread,
    setReviewStatus, addReviewComment, inspectQuality: inspectQualityV2, registerAIProvider, listAIProviders, invokeAIProvider,
    setAIEnabled, isAIEnabled, createAIDataPreview,
  };
})(typeof window !== 'undefined' ? window : globalThis);

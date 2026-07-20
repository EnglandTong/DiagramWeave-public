(function initDiagramWeaveFieldMapping(global) {
  'use strict';

  const NODE_FIELDS = Object.freeze([
    { id: 'id', label: '节点 ID', required: true, aliases: ['id', 'ID', '编号', 'refId', 'nodeId'] },
    { id: 'label', label: '名称', aliases: ['label', 'name', '名称', '简介', '节点名称'] },
    { id: 'detail', label: '详细说明', aliases: ['detail', 'description', '详细说明', '说明'] },
    { id: 'x', label: 'X 坐标', aliases: ['x', 'X', '横坐标'] },
    { id: 'y', label: 'Y 坐标', aliases: ['y', 'Y', '纵坐标'] },
    { id: 'w', label: '宽度', aliases: ['w', 'W', 'width', '宽'] },
    { id: 'h', label: '高度', aliases: ['h', 'H', 'height', '高'] },
    { id: 'shape', label: '形状', aliases: ['shape', 'type', '形状', '图形'] },
    { id: 'role', label: '角色', aliases: ['role', '角色'] },
    { id: 'layer', label: '图层', aliases: ['layer', '图层', 'layerId'] },
    { id: 'page', label: '页面', aliases: ['page', 'pageId', '页面', '页面ID'] },
    { id: 'fillColor', label: '填充色', aliases: ['fillColor', 'fill', '填充色', '背景色'] },
    { id: 'strokeColor', label: '线条色', aliases: ['strokeColor', 'stroke', '线条色', '边框色'] },
    { id: 'textColor', label: '文字色', aliases: ['textColor', '文字色', '文本色'] },
    { id: 'duration', label: '耗时', aliases: ['duration', 'time', '耗时', '耗时天'] },
  ]);

  const CONNECTION_FIELDS = Object.freeze([
    { id: 'from', label: '起点 ID', required: true, aliases: ['from', 'source', '起点编号', '起始'] },
    { id: 'to', label: '终点 ID', required: true, aliases: ['to', 'target', '终点编号', '目标'] },
    { id: 'fromPort', label: '起点端口', aliases: ['fromPort', 'sourcePort', '起点端口'] },
    { id: 'toPort', label: '终点端口', aliases: ['toPort', 'targetPort', '终点端口'] },
    { id: 'label', label: '连线标签', aliases: ['label', '条件', '标签'] },
    { id: 'labelPos', label: '标签位置', aliases: ['labelPos', '标签位置'] },
    { id: 'page', label: '页面', aliases: ['page', 'pageId', '页面', '页面ID'] },
  ]);

  function fieldsFor(kind) {
    return kind === 'connection' ? CONNECTION_FIELDS : NODE_FIELDS;
  }

  function detectColumns(rows) {
    const columns = new Set();
    (rows || []).slice(0, 100).forEach(row => {
      if (row && typeof row === 'object') Object.keys(row).forEach(key => columns.add(key));
    });
    return [...columns];
  }

  function suggestMapping(columns, kind) {
    const normalized = new Map(columns.map(column => [String(column).trim().toLocaleLowerCase(), column]));
    return Object.fromEntries(fieldsFor(kind).map(field => {
      const source = field.aliases.map(alias => normalized.get(alias.toLocaleLowerCase())).find(Boolean) || '';
      return [field.id, source];
    }));
  }

  function validateMapping(mapping, kind) {
    return fieldsFor(kind).filter(field => field.required && !mapping?.[field.id]).map(field => ({
      code: 'MAPPING_REQUIRED', field: field.id, reason: `${field.label} requires a source column`,
    }));
  }

  function mapRows(rows, mapping, kind) {
    const errors = validateMapping(mapping, kind);
    if (errors.length) return { success: false, rows: [], issues: errors };
    const mapped = (rows || []).map((source, index) => {
      const target = { sourceRow: index + 2 };
      fieldsFor(kind).forEach(field => {
        const column = mapping[field.id];
        if (column) target[field.id] = source?.[column];
      });
      if (kind === 'node') target.refId = target.id;
      return target;
    });
    return { success: true, rows: mapped, issues: [] };
  }

  function hasCoordinateMapping(mapping) {
    return Boolean(mapping?.x && mapping?.y);
  }

  function presetKey(name) {
    return `diagramweave.mapping.${encodeURIComponent(String(name || '').trim())}`;
  }

  function savePreset(name, preset, storage = global.localStorage) {
    if (!String(name || '').trim()) throw new Error('preset name is required');
    const value = { version: 1, name: String(name).trim(), node: { ...(preset.node || {}) }, connection: { ...(preset.connection || {}) } };
    storage.setItem(presetKey(value.name), JSON.stringify(value));
    return value;
  }

  function loadPreset(name, storage = global.localStorage) {
    const raw = storage.getItem(presetKey(name));
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function listPresets(storage = global.localStorage) {
    const values = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith('diagramweave.mapping.')) continue;
      try {
        const value = JSON.parse(storage.getItem(key));
        if (value?.name) values.push(value);
      } catch { /* ignore invalid local entries */ }
    }
    return values.sort((a, b) => a.name.localeCompare(b.name));
  }

  global.DiagramWeaveFieldMapping = {
    NODE_FIELDS, CONNECTION_FIELDS, detectColumns, suggestMapping, validateMapping,
    mapRows, hasCoordinateMapping, savePreset, loadPreset, listPresets,
  };
})(typeof window !== 'undefined' ? window : globalThis);

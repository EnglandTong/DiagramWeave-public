/**
 * DiagramWeave Property Panel Utilities
 *
 * 從 flowchart-editor.js 抽取的屬性面板純工具函數與常量數據。
 * 以 IIFE 掛載到全局命名空間 DiagramWeavePropertyPanel。
 * 保持原函數簽名不變，通過 typeof 委託或參數注入訪問外部依賴。
 */
(function initDiagramWeavePropertyPanel(global) {
  'use strict';

  const OFFICE_FILL_SWATCHES = [
    '#FFFFFF', '#F2F2F2', '#DAEAF6', '#E2EFDA', '#FFF2CC',
    '#FCE4D6', '#F8CECC', '#E4DFEC', '#D9E1F2', '#1E2029',
  ];

  const OFFICE_STROKE_SWATCHES = [
    '#000000', '#44546A', '#4472C4', '#70AD47', '#FFC000',
    '#ED7D31', '#FF0000', '#7030A0', '#5B9BD5', '#FFFFFF',
  ];

  const OFFICE_COLOR_NAMES = {
    '#FFFFFF': 'White / 白色', '#F2F2F2': 'Light gray / 浅灰', '#DAEAF6': 'Light blue / 浅蓝',
    '#E2EFDA': 'Light green / 浅绿', '#FFF2CC': 'Light yellow / 浅黄', '#FCE4D6': 'Peach / 桃色',
    '#F8CECC': 'Light red / 浅红', '#E4DFEC': 'Lavender / 淡紫', '#D9E1F2': 'Blue gray / 蓝灰',
    '#1E2029': 'Charcoal / 炭黑', '#000000': 'Black / 黑色', '#44546A': 'Slate / 石板灰',
    '#4472C4': 'Blue / 蓝色', '#70AD47': 'Green / 绿色', '#FFC000': 'Gold / 金色',
    '#ED7D31': 'Orange / 橙色', '#FF0000': 'Red / 红色', '#7030A0': 'Purple / 紫色',
    '#5B9BD5': 'Sky blue / 天蓝',
  };

  function colorAccessibleName(color) {
    const normalized = String(color || '').toUpperCase();
    return `${OFFICE_COLOR_NAMES[normalized] || 'Custom / 自定义'} ${normalized}`;
  }

  function getThemeVar(name, fallback) {
    if (typeof document === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function getDefaultNodeFill() {
    return getThemeVar('--node-fill-default', '#1e2029');
  }

  function getDefaultNodeStroke() {
    return getThemeVar('--node-stroke-default', '#3a3e55');
  }

  function normalizeHexColor(c) {
    if (typeof global.DiagramWeaveSanitize !== 'undefined' && typeof global.DiagramWeaveSanitize.sanitizeHexColor === 'function') {
      return global.DiagramWeaveSanitize.sanitizeHexColor(c, c);
    }
    return (c || '').trim().toLowerCase();
  }

  function shapeLabel(key) {
    if (typeof global.t === 'function') {
      const tr = global.t('shape.' + key);
      if (tr && tr !== 'shape.' + key) return tr;
    }
    const shapeNames = global.shapeNames || {};
    return shapeNames[key] || key;
  }

  function localeCompareTag() {
    return typeof global.DiagramWeaveI18n !== 'undefined' ? global.DiagramWeaveI18n.getLocaleCompareTag() : 'zh-CN';
  }

  function isFlowStepNode(node) {
    if (!node) return false;
    return !['terminator', 'start', 'end'].includes(node.shape);
  }

  function formatDurationDays(days) {
    const n = Number(days) || 0;
    if (Number.isInteger(n)) return `${n} 天`;
    return `${n.toFixed(1)} 天`;
  }

  function longestNodeCountLabel(count, duration) {
    if (!count) return '—';
    return `${count} 个节点 · ${formatDurationDays(duration)}`;
  }

  function resolveState() {
    if (global.state && typeof global.state === 'object') return global.state;
    return { nodes: [], connections: [] };
  }

  function computeFlowPageStats() {
    const state = resolveState();
    const nodes = state.nodes;
    const totalShapes = nodes.length;
    const totalDuration = nodes.reduce((sum, n) => sum + (Number(n.duration) || 0), 0);

    let longestIds = [];
    if (typeof global.DiagramWeave !== 'undefined' && typeof global.DiagramWeave.findLongestPathIds === 'function') {
      longestIds = global.DiagramWeave.findLongestPathIds();
    } else if (nodes.length) {
      longestIds = [nodes[0].id];
    }

    const longestNodeCount = longestIds.length;
    const longestDuration = longestIds.reduce((sum, id) => {
      const n = nodes.find(item => item.id === id);
      return sum + (Number(n?.duration) || 0);
    }, 0);

    const stepCount = nodes.filter(isFlowStepNode).length;

    let pageCount = 1;
    let pageName = '页面 1';
    if (typeof global.DiagramWeave !== 'undefined') {
      pageCount = global.DiagramWeave.doc.pages.length;
      pageName = global.DiagramWeave.getCurrentPage()?.name || pageName;
    }

    return {
      pageCount,
      pageName,
      totalShapes,
      totalDuration,
      longestNodeCount,
      longestDuration,
      stepCount,
    };
  }

  function getExportBaseName() {
    const stats = computeFlowPageStats();
    const raw = (stats.pageName || 'diagramweave').trim();
    const safe = raw.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80);
    return safe || 'diagramweave';
  }

  global.DiagramWeavePropertyPanel = {
    OFFICE_FILL_SWATCHES,
    OFFICE_STROKE_SWATCHES,
    OFFICE_COLOR_NAMES,
    colorAccessibleName,
    getThemeVar,
    getDefaultNodeFill,
    getDefaultNodeStroke,
    normalizeHexColor,
    shapeLabel,
    localeCompareTag,
    isFlowStepNode,
    formatDurationDays,
    longestNodeCountLabel,
    computeFlowPageStats,
    getExportBaseName,
  };
})(typeof window !== 'undefined' ? window : globalThis);

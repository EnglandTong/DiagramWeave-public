/**
 * DiagramWeave Command System Utilities
 *
 * 從 flowchart-editor.js 抽取的命令面板項收集與 overlay 焦點陷阱工具函數。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveCommandSystem。
 * 保持原函數簽名不變，通過 typeof 委託或 global 訪問外部依賴。
 */
(function initDiagramWeaveCommandSystem(global) {
  'use strict';

  function resolveState() {
    if (global.state && typeof global.state === 'object') return global.state;
    return { nodes: [], connections: [] };
  }

  function resolveAllTemplates() {
    return Array.isArray(global.allTemplates) ? global.allTemplates : [];
  }

  function isMobileViewMode() {
    return typeof global.isMobileViewMode === 'function' ? global.isMobileViewMode() : false;
  }

  function getCommandContext() {
    return typeof global.getCommandContext === 'function' ? global.getCommandContext() : {};
  }

  function collectPaletteItems(query) {
    const needle = String(query || '').trim().toLocaleLowerCase();
    const matches = value => !needle || String(value || '').toLocaleLowerCase().includes(needle);
    const structuralCommands = /^(tool\.|edit\.|layout\.|routing\.|history\.|project\.(blank|import)|template\.)/;
    const dw = (typeof global.DiagramWeave !== 'undefined') ? global.DiagramWeave : null;
    const commands = dw && dw.commands;
    const commandItems = commands ? commands.searchCommands(needle, getCommandContext())
      .filter(command => !isMobileViewMode() || !structuralCommands.test(command.id))
      .map(command => ({
        kind: 'command', id: command.id, label: command.label, meta: command.shortcut || '命令',
      })) : [];
    const pages = ((dw && dw.doc && dw.doc.pages) || []).filter(page => matches(page.name)).map(page => ({
      kind: 'page', id: page.id, label: page.name, meta: '页面',
    }));
    const nodes = resolveState().nodes.filter(node => matches(node.label)).map(node => ({
      kind: 'node', id: node.id, label: node.label || node.id, meta: '节点',
    }));
    const templates = resolveAllTemplates().map((template, index) => ({ template, index }))
      .filter(item => matches(`${item.template.name} ${item.template.nameEn || ''}`))
      .map(item => ({ kind: 'template', id: String(item.index), label: item.template.name, meta: '模板' }));
    return [...commandItems, ...pages, ...nodes, ...templates].slice(0, 40);
  }

  function trapOverlayFocus(e, overlayId) {
    if (typeof global.DiagramWeaveEditorOverlay !== 'undefined'
        && global.DiagramWeaveEditorOverlay
        && typeof global.DiagramWeaveEditorOverlay.trapFocus === 'function') {
      return global.DiagramWeaveEditorOverlay.trapFocus(e, overlayId);
    }
    if (!e || e.key !== 'Tab') return false;
    const doc = global.document;
    if (!doc || typeof doc.getElementById !== 'function') return false;
    const overlay = doc.getElementById(overlayId);
    if (!overlay || !overlay.classList || !overlay.classList.contains('visible')) return false;
    const focusable = [];
    const candidates = overlay.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    for (let i = 0; i < candidates.length; i++) {
      const element = candidates[i];
      if (!element.hidden && element.getClientRects().length > 0) {
        focusable.push(element);
      }
    }
    if (!focusable.length) return false;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && doc.activeElement === first) {
      e.preventDefault();
      last.focus();
      return true;
    }
    if (!e.shiftKey && doc.activeElement === last) {
      e.preventDefault();
      first.focus();
      return true;
    }
    return false;
  }

  function trapCommandPaletteFocus(e) {
    return trapOverlayFocus(e, 'commandPaletteOverlay');
  }

  function trapImportPreviewFocus(e) {
    return trapOverlayFocus(e, 'importPreviewOverlay');
  }

  function trapMappingWizardFocus(e) {
    return trapOverlayFocus(e, 'mappingWizardOverlay');
  }

  global.DiagramWeaveCommandSystem = {
    collectPaletteItems,
    trapOverlayFocus,
    trapCommandPaletteFocus,
    trapImportPreviewFocus,
    trapMappingWizardFocus,
  };
})(typeof window !== 'undefined' ? window : globalThis);

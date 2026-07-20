/**
 * DiagramWeave DW-P0-01 extension invoke runtime kernel.
 * Dispatches registered operations returning { success, data, issues, warnings }.
 */
(function (global) {
  'use strict';

  const HANDLERS = new Map();
  const EXTENSIONS = new Map();
  const EXTENSION_KINDS = new Set([
    'importer', 'exporter', 'template', 'stencil', 'validator', 'routing', 'history', 'ai-provider',
  ]);

  function validateExtension(extension) {
    if (!extension || typeof extension !== 'object') throw new TypeError('extension must be an object');
    for (const key of ['id', 'name', 'version', 'kind']) {
      if (typeof extension[key] !== 'string' || !extension[key].trim()) throw new Error(`extension.${key} is required`);
    }
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(extension.id)) throw new Error('extension.id is invalid');
    if (!EXTENSION_KINDS.has(extension.kind)) throw new Error(`extension.kind is invalid: ${extension.kind}`);
    if (extension.capabilities != null && !Array.isArray(extension.capabilities)) throw new Error('extension.capabilities must be an array');
    if (extension.config != null && (typeof extension.config !== 'object' || Array.isArray(extension.config))) throw new Error('extension.config must be an object');
  }

  function registerExtension(extension) {
    validateExtension(extension);
    if (EXTENSIONS.has(extension.id)) throw new Error(`extension already registered: ${extension.id}`);
    const registered = Object.freeze({
      id: extension.id,
      name: extension.name.trim(),
      version: extension.version.trim(),
      kind: extension.kind,
      enabled: extension.enabled !== false,
      capabilities: Object.freeze([...(extension.capabilities || [])].map(String)),
      config: Object.freeze({ ...(extension.config || {}) }),
      builtIn: extension.builtIn === true,
    });
    EXTENSIONS.set(registered.id, registered);
    return registered;
  }

  function listExtensions(options = {}) {
    return [...EXTENSIONS.values()].filter(extension =>
      (!options.kind || extension.kind === options.kind)
      && (options.enabled == null || extension.enabled === options.enabled));
  }

  function getExtension(id) {
    return EXTENSIONS.get(id) || null;
  }

  function setExtensionEnabled(id, enabled) {
    const current = EXTENSIONS.get(id);
    if (!current) throw new Error(`unknown extension: ${id}`);
    const updated = Object.freeze({ ...current, enabled: Boolean(enabled) });
    EXTENSIONS.set(id, updated);
    return updated;
  }

  function registerHandler(operationId, handler) {
    if (typeof operationId !== 'string' || !operationId) {
      throw new Error('operationId must be a non-empty string');
    }
    HANDLERS.set(operationId, handler);
  }

  function invokeExtension(operationId, input) {
    const warnings = [];
    if (!operationId || typeof operationId !== 'string') {
      return {
        success: false,
        data: null,
        issues: [{ code: 'invalid_operation', message: 'operationId required' }],
        warnings,
      };
    }

    const handler = HANDLERS.get(operationId);
    if (!handler) {
      return {
        success: false,
        data: null,
        issues: [{ code: 'unknown_operation', message: `Unknown operation: ${operationId}` }],
        warnings,
      };
    }

    try {
      const result = handler(input || {});
      if (result && typeof result.success === 'boolean') {
        return {
          success: result.success,
          data: result.data ?? null,
          issues: Array.isArray(result.issues) ? result.issues : [],
          warnings: Array.isArray(result.warnings) ? result.warnings : warnings,
        };
      }
      return { success: true, data: result, issues: [], warnings };
    } catch (err) {
      return {
        success: false,
        data: null,
        issues: [{ code: 'handler_error', message: err?.message || String(err) }],
        warnings,
      };
    }
  }

  async function invokeExtensionAsync(operationId, input) {
    const result = invokeExtension(operationId, input);
    if (result.success && result.data && typeof result.data.then === 'function') {
      try {
        const resolved = await result.data;
        return resolved && typeof resolved.success === 'boolean' ? {
          success: resolved.success, data: resolved.data ?? null, issues: Array.isArray(resolved.issues) ? resolved.issues : [], warnings: Array.isArray(resolved.warnings) ? resolved.warnings : [],
        } : { success: true, data: resolved, issues: result.issues, warnings: result.warnings };
      } catch (error) {
        return { success: false, data: null, issues: [{ code: 'handler_error', message: error?.message || String(error) }], warnings: [] };
      }
    }
    return result;
  }

  function initDefaultHandlers() {
    registerHandler('sanitize.document', (input) => {
      const S = global.DiagramWeaveSanitize;
      if (!S || typeof S.sanitizeFlowDocument !== 'function') {
        return {
          success: false,
          data: null,
          issues: [{ code: 'dependency_missing', message: 'DiagramWeaveSanitize unavailable' }],
          warnings: [],
        };
      }
      const data = S.sanitizeFlowDocument(input?.raw, input?.options);
      if (!data) {
        return {
          success: false,
          data: null,
          issues: [{ code: 'sanitize_rejected', message: 'Document rejected by sanitizer' }],
          warnings: [],
        };
      }
      return { success: true, data, issues: [], warnings: [] };
    });

    registerHandler('import.preview.document', (input) => {
      const preview = global.DiagramWeaveImportPreview;
      if (!preview?.createDocumentPreview) {
        return { success: false, data: null, issues: [{ code: 'dependency_missing', message: 'DiagramWeaveImportPreview unavailable' }], warnings: [] };
      }
      return preview.createDocumentPreview(input?.raw, {
        sourceType: input?.sourceType,
        sanitizeOptions: input?.options,
      });
    });

    registerHandler('import.preview.tabular', (input) => {
      const preview = global.DiagramWeaveImportPreview;
      if (!preview?.createTabularPreview) {
        return { success: false, data: null, issues: [{ code: 'dependency_missing', message: 'DiagramWeaveImportPreview unavailable' }], warnings: [] };
      }
      return preview.createTabularPreview(input?.nodes, input?.connections, { sourceType: input?.sourceType || 'excel' });
    });

    registerHandler('export.nodeShape', (input) => {
      const E = global.DiagramWeaveExport;
      if (!E || typeof E.buildExportNodeShapeSvg !== 'function') {
        return {
          success: false,
          data: null,
          issues: [{ code: 'dependency_missing', message: 'DiagramWeaveExport unavailable' }],
          warnings: [],
        };
      }
      const node = input?.node;
      if (!node || typeof node !== 'object') {
        return {
          success: false,
          data: null,
          issues: [{ code: 'invalid_input', message: 'node object required' }],
          warnings: [],
        };
      }
      const svg = E.buildExportNodeShapeSvg(node);
      return { success: true, data: { svg }, issues: [], warnings: [] };
    });
  }

  function initBuiltInExtensions() {
    const descriptors = [
      ['builtin.import', 'Built-in Importers', 'importer', ['json', 'vso', 'excel']],
      ['builtin.export', 'Built-in Exporters', 'exporter', ['json', 'vso', 'excel', 'png', 'svg', 'pdf']],
      ['builtin.templates', 'Built-in Templates', 'template', ['template-library']],
      ['builtin.stencils', 'Built-in Stencils', 'stencil', ['shape-registry']],
      ['builtin.validation', 'Built-in Validators', 'validator', ['sanitize-document']],
      ['builtin.routing', 'Built-in Routing', 'routing', ['bezier', 'orthogonal', 'avoidance', 'visio']],
      ['builtin.history', 'Built-in History', 'history', ['undo', 'redo']],
      ['builtin.ai', 'AI Provider Boundary', 'ai-provider', ['disabled-by-default']],
    ];
    descriptors.forEach(([id, name, kind, capabilities]) => registerExtension({
      id, name, kind, capabilities, version: '1.0.0', enabled: true, config: {}, builtIn: true,
    }));
  }

  initBuiltInExtensions();
  initDefaultHandlers();

  global.DiagramWeaveExtensionKernel = {
    invokeExtension,
    invokeExtensionAsync,
    registerHandler,
    registerExtension,
    listExtensions,
    getExtension,
    setExtensionEnabled,
    EXTENSION_KINDS: Object.freeze([...EXTENSION_KINDS]),
  };
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * DiagramWeave DW-P0-01 extension invoke runtime kernel.
 * Dispatches registered operations returning { success, data, issues, warnings }.
 */
(function (global) {
  'use strict';

  const HANDLERS = new Map();

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

  initDefaultHandlers();

  global.DiagramWeaveExtensionKernel = {
    invokeExtension,
    registerHandler,
  };
})(typeof window !== 'undefined' ? window : globalThis);

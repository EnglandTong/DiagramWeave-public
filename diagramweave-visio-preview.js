/**
 * DiagramWeave Visio preview spike (M4) — OPC/ZIP scan without full import.
 */
(function (global) {
  'use strict';

  function toUint8Array(buffer) {
    if (buffer instanceof Uint8Array) return buffer;
    if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
    if (ArrayBuffer.isView(buffer)) return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return null;
  }

  function scanVisioArchive(buffer) {
    const view = toUint8Array(buffer);
    if (!view || view.length < 4 || view[0] !== 0x50 || view[1] !== 0x4b) {
      return { ok: false, code: 'invalid_archive', message: 'Not a ZIP/OPC archive' };
    }
    let latin = '';
    const max = Math.min(view.length, 8_000_000);
    for (let i = 0; i < max; i += 1) latin += String.fromCharCode(view[i]);

    const pages = new Set();
    const pageRe = /visio\/pages\/(page\d+)\.xml/gi;
    let match = pageRe.exec(latin);
    while (match) {
      pages.add(match[1].toLowerCase());
      match = pageRe.exec(latin);
    }

    const shapes = [];
    const masterRe = /visio\/masters\/master\d+\.xml/gi;
    match = masterRe.exec(latin);
    while (match && shapes.length < 20) {
      shapes.push({ kind: 'master-stub', path: match[0] });
      match = masterRe.exec(latin);
    }

    return { ok: true, pages: [...pages], shapes };
  }

  function previewVisioArchive(input) {
    const buffer = input?.buffer;
    const fileName = input?.fileName || '';
    if (!buffer) {
      return {
        success: false,
        data: null,
        issues: [{ code: 'invalid_input', message: 'buffer required' }],
        warnings: [],
      };
    }
    const scan = scanVisioArchive(buffer);
    if (!scan.ok) {
      return {
        success: false,
        data: null,
        issues: [{ code: scan.code, message: scan.message }],
        warnings: [],
      };
    }
    return {
      success: true,
      data: {
        fileName,
        pageCount: scan.pages.length,
        pages: scan.pages.map((id) => ({ id, name: id })),
        shapes: scan.shapes,
        mappingStatus: 'stub',
      },
      issues: [],
      warnings: ['Full Visio shape mapping is not available in M4; preview only.'],
    };
  }

  function registerVisioPreviewHandler() {
    if (global.DiagramWeaveExtensionKernel && typeof global.DiagramWeaveExtensionKernel.registerHandler === 'function') {
      global.DiagramWeaveExtensionKernel.registerHandler('visio.preview', previewVisioArchive);
    }
  }

  global.DiagramWeaveVisioPreview = {
    scanVisioArchive,
    previewVisioArchive,
    registerVisioPreviewHandler,
  };

  registerVisioPreviewHandler();
})(typeof window !== 'undefined' ? window : globalThis);

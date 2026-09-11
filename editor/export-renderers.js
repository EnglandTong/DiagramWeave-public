/**
 * DiagramWeave Export Renderers
 *
 * 從 flowchart-editor.js 抽取的導出渲染管線（Phase 1 拆分第 10 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveExportRenderers。
 *
 * 包含：
 * - 導出對話框（showExportDialog / hideExportDialog / runExport）
 * - 離線查看器導出（downloadOfflineViewer）
 * - SVG 組裝（buildExportSVG / exportNodeShapeSvg / getExportBounds）
 * - PNG / SVG / PDF 下載（exportPNG / exportSVG / exportPDF）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state / projectSession（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：escapeHtml、getThemeVar
 * - data-io 模塊別名：downloadProjectVso（runExport 調用）
 * - 已提取模塊函數：buildBridgeSvgFragments、getConnLabelLayout、getConnectionPath、
 *   getExportBaseName、getFlowDocumentPayload、getPortPos、getProjectFileBaseName、
 *   sampleSvgPath
 * - DiagramWeave / DiagramWeaveExport / DiagramWeaveNodeColors / DiagramWeaveOfflineViewer /
 *   DiagramWeaveVisioBridge 命名空間（typeof 守衛）
 * - jspdf / svg2pdf（vendor）
 */
/* global DiagramWeaveEditorCore, DiagramWeaveOfflineViewer, buildBridgeSvgFragments, downloadProjectVso, escapeHtml, getConnLabelLayout, getConnectionPath, getExportBaseName, getFlowDocumentPayload, getPortPos, getProjectFileBaseName, getThemeVar, sampleSvgPath */
(function initDiagramWeaveExportRenderers(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const projectSession = DiagramWeaveEditorCore.projectSession;

function showExportDialog() {
  const include = document.getElementById('exportIncludeHistory'); if (include) include.checked = false;
  document.getElementById('exportOverlay').classList.add('visible');
}

function hideExportDialog() {
  document.getElementById('exportOverlay').classList.remove('visible');
}

async function runExport(format) {
  const includeHistory = document.getElementById('exportIncludeHistory')?.checked === true;
  hideExportDialog();
  if (format === 'png') exportPNG();
  else if (format === 'svg') exportSVG();
  else if (format === 'pdf') exportPDF();
  else if (format === 'vso') await downloadProjectVso(includeHistory);
  else if (format === 'vsdx') await downloadProjectVsdx();
  else if (format === 'viewer') downloadOfflineViewer();
}

async function downloadProjectVsdx() {
  if (typeof DiagramWeaveVisioBridge === 'undefined') return false;
  try {
    const blob = await DiagramWeaveVisioBridge.exportVsdx(getFlowDocumentPayload());
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = getProjectFileBaseName() + '.vsdx'; link.click(); URL.revokeObjectURL(link.href);
    showToast('Controlled VSDX exported'); return true;
  } catch (error) {
    showToast(`VSDX export failed: ${error.message}`); return false;
  }
}

function downloadOfflineViewer() {
  if (typeof DiagramWeaveOfflineViewer === 'undefined') return false;
  const html = DiagramWeaveOfflineViewer.buildViewerHtml(getFlowDocumentPayload(), { title: `${projectSession.name} - Viewer` });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = getProjectFileBaseName() + '.viewer.html'; link.click(); URL.revokeObjectURL(link.href);
  showToast('Offline HTML Viewer exported'); return true;
}

// ===== 导出 PNG / SVG / PDF =====
function getExportBounds() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  state.nodes.forEach(n => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.w);
    maxY = Math.max(maxY, n.y + n.h);
  });
  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
  }
  const padding = 48;
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

function exportNodeShapeSvg(node) {
  if (typeof DiagramWeaveExtensionKernel !== 'undefined') {
    const result = DiagramWeaveExtensionKernel.invokeExtension('export.nodeShape', { node });
    if (result.success && result.data?.svg) return result.data.svg;
  }
  if (typeof DiagramWeaveExport !== 'undefined') {
    return DiagramWeaveExport.buildExportNodeShapeSvg(node);
  }
  return `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="6" fill="#1e2029" stroke="#3a3e55" stroke-width="2"/>`;
}

function buildExportSVG() {
  const bounds = getExportBounds();
  const { minX, minY, width, height } = bounds;
  const canvasBg = getThemeVar('--canvas-bg', '#13151d');
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">`;
  svg += `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${canvasBg}"/>`;
  svg += `<style>${typeof DiagramWeave !== 'undefined' ? DiagramWeave.getSvgFontStyleBlock() : 'text { font-family: "Microsoft YaHei", sans-serif; }'}</style>`;

  const exportConnData = [];
  const exportLabels = [];
  state.connections.forEach(conn => {
    const fromNode = state.nodes.find(n => n.id === conn.from);
    const toNode = state.nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return;
    const from = getPortPos(fromNode, conn.fromPort);
    const to = getPortPos(toNode, conn.toPort);
    const markerId = 'exp_' + conn.id.replace(/[^a-zA-Z0-9]/g, '');
    svg += `<defs><marker id="${markerId}" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8 L2,4 Z" fill="#6b6f85"/></marker></defs>`;
    const pathD = getConnectionPath(from, to, conn.fromPort, conn.toPort, {
      fromNodeId: conn.from,
      toNodeId: conn.to,
    });
    exportConnData.push({
      conn,
      color: '#6b6f85',
      width: 1.8,
      pathD,
      points: sampleSvgPath(pathD, 12),
      layout: conn.label ? getConnLabelLayout(from, to, conn.labelPlacement || conn.labelPos, conn.labelOffset) : null,
    });
    svg += `<path d="${pathD}" fill="none" stroke="#6b6f85" stroke-width="1.8" marker-end="url(#${markerId})"/>`;
    if (conn.label) {
      const layout = getConnLabelLayout(from, to, conn.labelPlacement || conn.labelPos, conn.labelOffset);
      exportLabels.push({ conn, layout });
    }
  });
  svg += buildBridgeSvgFragments(exportConnData, canvasBg);
  exportLabels.forEach(({ conn, layout }) => {
    svg += `<text x="${layout.x}" y="${layout.y}" fill="#9498ad" font-size="11" text-anchor="${layout.anchor}" dominant-baseline="${layout.baseline}">${escapeHtml(conn.label)}</text>`;
  });

  state.nodes.forEach(node => {
    const cx = node.x + node.w / 2;
    const cy = node.y + node.h / 2;
    if (typeof DiagramWeaveExport !== 'undefined' || typeof DiagramWeaveExtensionKernel !== 'undefined') {
      svg += exportNodeShapeSvg(node);
    } else {
      svg += `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="6" fill="#1e2029" stroke="#3a3e55" stroke-width="2"/>`;
    }
    const textColor = typeof DiagramWeaveNodeColors !== 'undefined'
      ? DiagramWeaveNodeColors.resolveTextColor(node.fillColor, node.textColor)
      : (node.textColor && node.textColor !== 'auto' ? node.textColor : '#ffffff');
    svg += `<text x="${cx}" y="${cy}" fill="${escapeHtml(textColor)}" font-size="13" text-anchor="middle" dominant-baseline="central">${escapeHtml(node.label)}</text>`;
  });

  svg += '</svg>';
  return svg;
}

function exportPNG() {
  const svgData = buildExportSVG();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const bounds = getExportBounds();

  const canvas2 = document.createElement('canvas');
  const ctx = canvas2.getContext('2d');
  const img = new Image();
  img.onload = () => {
    canvas2.width = bounds.width * 2;
    canvas2.height = bounds.height * 2;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0, bounds.width, bounds.height);
    canvas2.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = getExportBaseName() + '.png';
      a.click();
      URL.revokeObjectURL(a.href);
      URL.revokeObjectURL(url);
      showToast('已导出 PNG');
    });
  };
  img.src = url;
}

function exportSVG() {
  const svgData = buildExportSVG();
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = getExportBaseName() + '.svg';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('已导出 SVG（可用 Illustrator / Inkscape 编辑）');
}

function exportPDF() {
  if (typeof jspdf === 'undefined') {
    showToast('PDF 库未加载，请确认 vendor 目录完整');
    return;
  }

  const run = async () => {
    if (typeof DiagramWeave !== 'undefined') await DiagramWeave.loadChineseFont();

    const bounds = getExportBounds();
    const svgData = buildExportSVG();
    const pageW = Math.max(bounds.width, 200);
    const pageH = Math.max(bounds.height, 200);

    const pdf = new jspdf.jsPDF({
      orientation: pageW > pageH ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [pageW, pageH],
    });

    if (typeof DiagramWeave !== 'undefined') DiagramWeave.registerPdfChineseFont(pdf);

    const finish = () => {
      pdf.save(getExportBaseName() + '.pdf');
      showToast('已导出 PDF');
    };

    const fallbackCanvas = () => {
      const url = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pageW * 2;
        canvas.height = pageH * 2;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = getThemeVar('--canvas-bg', '#13151d');
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, pageW, pageH);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);
        URL.revokeObjectURL(url);
        finish();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        showToast('PDF 导出失败');
      };
      img.src = url;
    };

    if (typeof svg2pdf !== 'undefined' && svg2pdf.svg2pdf) {
      try {
        const doc = new DOMParser().parseFromString(svgData, 'image/svg+xml');
        const svgEl = doc.documentElement;
        const result = svg2pdf.svg2pdf(svgEl, pdf, {
          x: 0,
          y: 0,
          width: pageW,
          height: pageH,
        });
        Promise.resolve(result).then(finish).catch(fallbackCanvas);
      } catch {
        fallbackCanvas();
      }
    } else {
      fallbackCanvas();
    }
  };

  run().catch(() => showToast('PDF 导出失败'));
}
  global.DiagramWeaveExportRenderers = {
    buildExportSVG,
    downloadOfflineViewer,
    downloadProjectVsdx,
    exportNodeShapeSvg,
    exportPDF,
    exportPNG,
    exportSVG,
    getExportBounds,
    hideExportDialog,
    runExport,
    showExportDialog,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

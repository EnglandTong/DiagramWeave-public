/**
 * DiagramWeave Align Guides
 *
 * Phase 3 新增的智能对齐线模块。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveAlignGuides。
 *
 * 包含：
 * - 吸附計算（SNAP_THRESHOLD / bboxOf / computeSnapForBounds / computeSnap）：
 *   6 方向——移動集合聯合包圍盒的左/中/右 × 靜態節點的左/中/右（垂直輔助線），
 *   以及上/中/下 × 上/中/下（水平輔助線）；閾值 6 屏幕像素，按 zoom 換算為世界坐標
 * - 輔助線渲染（showGuides / hideGuides）：canvasTransform 內惰性創建的兩個 div，
 *   紅色虛線（#ff4d4f，見 flowchart-editor.css .align-guide），跨越 ±50000px 世界坐標
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - canvasTransform（showGuides 時 getElementById 惰性查找）
 */
/* global DiagramWeaveEditorCore */
(function initDiagramWeaveAlignGuides(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;

  // 吸附阈值（屏幕像素）：使用时除以 state.zoom 换算为世界坐标，
  // 保证任意缩放下手感一致。
  const SNAP_THRESHOLD = 6;
  // 辅助线半长（世界坐标 px）：足以覆盖任意平移范围
  const GUIDE_SPAN = 50000;

  let guideV = null;
  let guideH = null;

  /** 节点数组的联合包围盒（minX/minY/maxX/maxY/cx/cy），空数组返回 null */
  function bboxOf(nodes) {
    if (!nodes || !nodes.length) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
    });
    return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  }

  /**
   * 纯函数：给定移动包围盒与静态包围盒列表，计算吸附结果。
   * dx/dy 为 tentative 增量；threshold 为世界坐标阈值。
   * 返回 { dx, dy, guides: { v, h } }：v/h 为吸附处的世界坐标，无吸附为 null。
   * 多候选时取距离最小者；恰好等于阈值视为可吸附。
   */
  function computeSnapForBounds(movingBox, staticBoxes, dx, dy, threshold) {
    let bestDx = null;
    let bestV = null;
    let bestDxDist = Infinity;
    const movXs = [movingBox.minX + dx, movingBox.cx + dx, movingBox.maxX + dx];
    staticBoxes.forEach(sb => {
      [sb.minX, sb.cx, sb.maxX].forEach(sx => {
        movXs.forEach(mx => {
          const dist = Math.abs(mx - sx);
          if (dist <= threshold && dist < bestDxDist) {
            bestDxDist = dist;
            bestDx = sx - (mx - dx); // 令移动边缘最终恰好落在 sx
            bestV = sx;
          }
        });
      });
    });

    let bestDy = null;
    let bestH = null;
    let bestDyDist = Infinity;
    const movYs = [movingBox.minY + dy, movingBox.cy + dy, movingBox.maxY + dy];
    staticBoxes.forEach(sb => {
      [sb.minY, sb.cy, sb.maxY].forEach(sy => {
        movYs.forEach(my => {
          const dist = Math.abs(my - sy);
          if (dist <= threshold && dist < bestDyDist) {
            bestDyDist = dist;
            bestDy = sy - (my - dy);
            bestH = sy;
          }
        });
      });
    });

    return {
      dx: bestDx === null ? dx : bestDx,
      dy: bestDy === null ? dy : bestDy,
      guides: { v: bestV, h: bestH },
    };
  }

  /**
   * 基于当前 state 的吸附计算：movingIds 为拖拽集合，
   * 其余所有节点作为吸附目标。
   */
  function computeSnap(movingIds, dx, dy) {
    const noSnap = { dx, dy, guides: { v: null, h: null } };
    const ids = new Set(movingIds || []);
    const moving = state.nodes.filter(n => ids.has(n.id));
    const movingBox = bboxOf(moving);
    if (!movingBox) return noSnap;
    const staticBoxes = state.nodes.filter(n => !ids.has(n.id)).map(n => bboxOf([n]));
    if (!staticBoxes.length) return noSnap;
    return computeSnapForBounds(movingBox, staticBoxes, dx, dy, SNAP_THRESHOLD / state.zoom);
  }

  /** 惰性创建/重建辅助线元素（宿主被清空时自动重建）；无 DOM 返回 false */
  function ensureGuides() {
    if (typeof document === 'undefined') return false;
    const host = document.getElementById('canvasTransform');
    if (!host) return false;
    if (!guideV || !guideV.isConnected) {
      guideV = document.createElement('div');
      guideV.id = 'alignGuideV';
      guideV.className = 'align-guide align-guide-v';
      host.appendChild(guideV);
    }
    if (!guideH || !guideH.isConnected) {
      guideH = document.createElement('div');
      guideH.id = 'alignGuideH';
      guideH.className = 'align-guide align-guide-h';
      host.appendChild(guideH);
    }
    return true;
  }

  /** 显示辅助线：v 为垂直线世界 x，h 为水平线世界 y；null 的一侧隐藏 */
  function showGuides(v, h) {
    if (!ensureGuides()) return;
    if (v === null || v === undefined) {
      guideV.style.display = 'none';
    } else {
      guideV.style.display = 'block';
      guideV.style.left = v + 'px';
      guideV.style.top = -GUIDE_SPAN + 'px';
      guideV.style.height = GUIDE_SPAN * 2 + 'px';
    }
    if (h === null || h === undefined) {
      guideH.style.display = 'none';
    } else {
      guideH.style.display = 'block';
      guideH.style.top = h + 'px';
      guideH.style.left = -GUIDE_SPAN + 'px';
      guideH.style.width = GUIDE_SPAN * 2 + 'px';
    }
  }

  function hideGuides() {
    if (guideV) guideV.style.display = 'none';
    if (guideH) guideH.style.display = 'none';
  }

  global.DiagramWeaveAlignGuides = {
    SNAP_THRESHOLD,
    bboxOf,
    computeSnap,
    computeSnapForBounds,
    hideGuides,
    showGuides,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

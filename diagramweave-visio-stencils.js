/**
 * DiagramWeave — Phase 3-3：预置 Visio Stencils
 *
 * 在现有 25 个基础形状上，额外注册 Visio 常用 stencil 分组：
 * - Visio-Flowchart-Extended：流程图扩展（合并、数据、预置、离线存储）
 * - Visio-Network-Basic：网络拓扑（服务器、工作站、路由器、交换机、防火墙、云）
 * - Visio-UML-UseCase：UML 用例图（系统边界、Actor、UseCase、Include/Extend）
 * - Visio-Swimlane：泳道容器 / Lane header
 *
 * 通过 DiagramWeaveShapeLibrary.registerRemoteShape 批量注册，与现有
 * stencil-pack 机制完全兼容。启动时自动注册，可在形状库侧边栏按 category 过滤。
 */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  // ===== Stencil 定义 =====
  const STENCILS = [
    // ── Visio-Flowchart-Extended ──
    { id: 'merge',          label: '合并',       category: 'Visio-Flowchart-Extended', packId: 'visio-flow-ext',
      keywords: ['merge','合并','join'], defaults: { w: 120, h: 80 }, renderAs: 'diamond' },
    { id: 'predefined',     label: '预置流程',   category: 'Visio-Flowchart-Extended', packId: 'visio-flow-ext',
      keywords: ['predefined','预置'], defaults: { w: 160, h: 70 }, renderAs: 'rectangle' },
    { id: 'data',           label: '数据',       category: 'Visio-Flowchart-Extended', packId: 'visio-flow-ext',
      keywords: ['data','数据'], defaults: { w: 140, h: 60 }, renderAs: 'parallelogram' },
    { id: 'offpage',        label: '页外引用',   category: 'Visio-Flowchart-Extended', packId: 'visio-flow-ext',
      keywords: ['offpage','页外'], defaults: { w: 100, h: 60 }, renderAs: 'terminator' },
    { id: 'sequentialdata', label: '顺序数据',   category: 'Visio-Flowchart-Extended', packId: 'visio-flow-ext',
      keywords: ['sequential','顺序数据'], defaults: { w: 140, h: 60 }, renderAs: 'parallelogram' },

    // ── Visio-Network-Basic ──
    { id: 'server',       label: '服务器',    category: 'Visio-Network-Basic', packId: 'visio-net-basic',
      keywords: ['server','服务器'], defaults: { w: 140, h: 70 }, renderAs: 'rectangle' },
    { id: 'workstation',  label: '工作站',    category: 'Visio-Network-Basic', packId: 'visio-net-basic',
      keywords: ['workstation','工作站','pc'], defaults: { w: 120, h: 70 }, renderAs: 'rectangle' },
    { id: 'router',       label: '路由器',    category: 'Visio-Network-Basic', packId: 'visio-net-basic',
      keywords: ['router','路由器'], defaults: { w: 100, h: 100 }, renderAs: 'circle' },
    { id: 'switch',       label: '交换机',    category: 'Visio-Network-Basic', packId: 'visio-net-basic',
      keywords: ['switch','交换机'], defaults: { w: 140, h: 60 }, renderAs: 'rectangle' },
    { id: 'firewall',     label: '防火墙',    category: 'Visio-Network-Basic', packId: 'visio-net-basic',
      keywords: ['firewall','防火墙'], defaults: { w: 120, h: 80 }, renderAs: 'hexagon' },
    { id: 'cloud-node',   label: '云节点',    category: 'Visio-Network-Basic', packId: 'visio-net-basic',
      keywords: ['cloud','云','cloud-node'], defaults: { w: 160, h: 100 }, renderAs: 'rounded' },
    { id: 'printer',      label: '打印机',    category: 'Visio-Network-Basic', packId: 'visio-net-basic',
      keywords: ['printer','打印机'], defaults: { w: 120, h: 70 }, renderAs: 'rectangle' },
    { id: 'modem',        label: '调制解调器', category: 'Visio-Network-Basic', packId: 'visio-net-basic',
      keywords: ['modem','调制解调器'], defaults: { w: 120, h: 60 }, renderAs: 'rectangle' },

    // ── Visio-UML-UseCase ──
    { id: 'actor',         label: 'Actor（参与者）', category: 'Visio-UML-UseCase', packId: 'visio-uml',
      keywords: ['actor','参与者'], defaults: { w: 80, h: 120 }, renderAs: 'circle' },
    { id: 'usecase',       label: '用例',       category: 'Visio-UML-UseCase', packId: 'visio-uml',
      keywords: ['usecase','用例'], defaults: { w: 140, h: 60 }, renderAs: 'ellipse' },
    { id: 'systemboundary', label: '系统边界',  category: 'Visio-UML-UseCase', packId: 'visio-uml',
      keywords: ['system boundary','系统边界'], defaults: { w: 280, h: 200 }, renderAs: 'rectangle' },
    { id: 'include',       label: '<<include>>', category: 'Visio-UML-UseCase', packId: 'visio-uml',
      keywords: ['include'], defaults: { w: 100, h: 40 }, renderAs: 'rectangle' },
    { id: 'extend',        label: '<<extend>>',  category: 'Visio-UML-UseCase', packId: 'visio-uml',
      keywords: ['extend'], defaults: { w: 100, h: 40 }, renderAs: 'rectangle' },

    // ── Visio-Swimlane ──
    { id: 'swimlane-set',  label: '泳道组容器', category: 'Visio-Swimlane', packId: 'visio-swimlane',
      keywords: ['swimlane','泳道','container'], defaults: { w: 600, h: 300 }, renderAs: 'rectangle' },
    { id: 'lane-header',   label: 'Lane 头部', category: 'Visio-Swimlane', packId: 'visio-swimlane',
      keywords: ['lane','泳道头'], defaults: { w: 100, h: 50 }, renderAs: 'rectangle' },
  ];

  // ===== 注册函数 =====
  function registerAll() {
    const lib = window.DiagramWeaveShapeLibrary;
    if (!lib || typeof lib.registerRemoteShape !== 'function') {
      console.warn('[Phase 3-3] DiagramWeaveShapeLibrary.registerRemoteShape 未就绪，stencils 跳过注册。');
      return { registered: 0 };
    }
    let n = 0;
    for (const entry of STENCILS) {
      // ellipse 需要特殊渲染；无对应 renderAs 时回退到 rounded
      const renderAs = entry.renderAs === 'ellipse' ? 'rounded' : entry.renderAs;
      lib.registerRemoteShape({ ...entry, renderAs });
      n++;
    }
    return { registered: n };
  }

  // ===== 挂载 + 自动注册 =====
  function boot() {
    const lib = window.DiagramWeaveShapeLibrary;
    if (lib && typeof lib.registerRemoteShape === 'function') {
      registerAll();
    } else {
      // 延迟 300ms 重试一次（等待 shape-library.js 加载完成）
      setTimeout(() => {
        if (window.DiagramWeaveShapeLibrary && typeof window.DiagramWeaveShapeLibrary.registerRemoteShape === 'function') {
          registerAll();
        }
      }, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.DiagramWeaveVisioStencils = { registerAll, boot, STENCILS };
})();

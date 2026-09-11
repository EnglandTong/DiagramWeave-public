/**
 * DiagramWeave 远程内容包：连线方式、字体、侧边栏图标
 * 从 GitHub raw JSON 拉取，无需重装整包即可扩展能力
 */
(function (global) {
  'use strict';
  /* global DiagramWeaveSvgSanitizer */

  const PACK_CACHE_KEY = 'fc-content-pack-cache';
  const BUILTIN_ALGORITHMS = new Set(['bezier', 'orthogonal', 'avoidance', 'straight', 'visio']);

  // P2-03 修复：引用共享 DiagramWeaveSvgSanitizer 模块，删除 70 行逐字副本。
  // 仅保留最小 fallback（模块未加载时拒绝含可疑标记的 SVG）。
  const svgSanitizer = typeof DiagramWeaveSvgSanitizer !== 'undefined' ? DiagramWeaveSvgSanitizer : {
    sanitizeSvgSnippet(svg) {
      if (typeof svg !== 'string') return '';
      const t = svg.trim();
      if (!t.startsWith('<svg')) return '';
      if (/<\s*script\b/i.test(t) || /\son\w+\s*=/i.test(t) || /<\s*foreignObject\b/i.test(t)) return '';
      if (/<\s*(animate|set|use|image|iframe)\b/i.test(t)) return '';
      return t.slice(0, 4000);
    },
  };

  const applied = {
    packVersion: '',
    connModes: [],
    fonts: [],
    shapes: [],
    scriptUrl: '',
  };

  function toast(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  function sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    const t = url.trim();
    if (!/^https:\/\/[^\s"'<>]+$/i.test(t)) return '';
    return t;
  }

  function validatePack(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const pack = {
      packVersion: String(raw.packVersion || raw.version || '0').slice(0, 32),
      connModes: [],
      fonts: [],
      shapes: [],
      script: '',
    };

    for (const item of raw.connModes || []) {
      if (!item || typeof item !== 'object') continue;
      const id = String(item.id || '').trim().slice(0, 32);
      const label = String(item.label || '').trim().slice(0, 40);
      const algorithm = String(item.algorithm || id).trim().slice(0, 32);
      if (!id || !label) continue;
      if (!/^[a-z][a-z0-9_-]*$/i.test(id)) continue;
      if (!BUILTIN_ALGORITHMS.has(algorithm)) continue;
      pack.connModes.push({ id, label, algorithm });
    }

    for (const item of raw.fonts || []) {
      if (!item || typeof item !== 'object') continue;
      const id = String(item.id || '').trim().slice(0, 32);
      const label = String(item.label || id).trim().slice(0, 40);
      const family = String(item.family || '').trim().slice(0, 64);
      const url = sanitizeUrl(item.url || '');
      if (!id || !family || !url) continue;
      pack.fonts.push({
        id,
        label,
        family,
        url,
        forUi: item.forUi !== false,
        forPdf: item.forPdf === true,
      });
    }

    for (const item of raw.shapes || []) {
      if (!item || typeof item !== 'object') continue;
      const id = String(item.id || item.shape || '').trim().slice(0, 32);
      const label = String(item.label || id).trim().slice(0, 40);
      const svg = svgSanitizer.sanitizeSvgSnippet(item.sidebarSvg || item.svg || '');
      if (!id || !label || !svg) continue;
      if (!/^[a-z][a-z0-9_-]*$/i.test(id)) continue;
      const defaults = item.defaults && typeof item.defaults === 'object'
        ? {
          w: Math.min(2000, Math.max(20, Number(item.defaults.w) || 140)),
          h: Math.min(2000, Math.max(20, Number(item.defaults.h) || 60)),
        }
        : { w: 140, h: 60 };
      const renderAs = String(item.renderAs || item.canvasClass || 'rectangle').trim().slice(0, 32);
      pack.shapes.push({
        id,
        label,
        svg,
        defaults,
        renderAs,
        section: String(item.section || '远程图标').trim().slice(0, 24),
      });
    }

    return pack;
  }

  function readPackCache() {
    try {
      const raw = localStorage.getItem(PACK_CACHE_KEY);
      if (!raw) return null;
      return validatePack(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  function writePackCache(pack) {
    try {
      localStorage.setItem(PACK_CACHE_KEY, JSON.stringify(pack));
    } catch { /* quota */ }
  }

  function getContentPackUrl() {
    if (typeof DiagramWeaveBootstrap === 'undefined') return '';
    const manifest = DiagramWeaveBootstrap.getManifest?.();
    const direct = (manifest?.contentPackUrl || '').trim();
    if (direct && !direct.includes('REPLACE_USER')) return direct;
    const checkUrl = DiagramWeaveBootstrap.getUpdateCheckUrl?.() || '';
    if (checkUrl.includes('raw.githubusercontent.com/')) {
      return checkUrl.replace(/diagramweave\.manifest\.json[^/]*$/i, 'remote/content-pack.json');
    }
    const repo = manifest?.githubRepo?.trim();
    if (repo) {
      const normalized = repo.replace(/^https:\/\/github\.com\//i, '').replace(/\/+$/, '');
      return `https://raw.githubusercontent.com/${normalized}/main/remote/content-pack.json`;
    }
    return 'remote/content-pack.json';
  }

  async function fetchRemotePack() {
    const url = getContentPackUrl();
    if (!url) return { pack: null, message: '未配置内容包地址（需 manifest.githubRepo 或 contentPackUrl）' };
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return { pack: null, message: `内容包下载失败（HTTP ${res.status}）` };
      const pack = validatePack(await res.json());
      if (!pack) return { pack: null, message: '内容包格式无效' };
      writePackCache(pack);
      return { pack, message: `已获取内容包 v${pack.packVersion || '?'}` };
    } catch {
      return { pack: null, message: '无法下载内容包（可能离线）' };
    }
  }

  function applyConnModes(modes) {
    if (typeof registerConnRouteMode !== 'function') return;
    modes.forEach(mode => {
      registerConnRouteMode(mode.id, mode.label, mode.algorithm);
    });
  }

  function applyFonts(fonts) {
    document.querySelectorAll('style[data-fc-pack-font]').forEach(el => el.remove());
    fonts.forEach(font => {
      const style = document.createElement('style');
      style.dataset.fcPackFont = font.id;
      style.textContent = `@font-face{font-family:"${font.family}";src:url("${font.url}") format("opentype");font-display:swap;}`;
      document.head.appendChild(style);
      if (font.forUi) {
        document.documentElement.style.setProperty('--fc-pack-ui-font', `"${font.family}"`);
        document.body.style.fontFamily = `"${font.family}", "Microsoft YaHei", sans-serif`;
      }
      if (font.forPdf && typeof DiagramWeave !== 'undefined' && typeof DiagramWeave.registerPackFont === 'function') {
        DiagramWeave.registerPackFont(font);
      }
    });
  }

  function applyShapes(shapes) {
    if (typeof registerRemoteShape !== 'function') return;
    shapes.forEach(shape => registerRemoteShape(shape));
  }

  async function loadOptionalScript(url) {
    if (!url) return;
    console.warn('Ignore content pack script by policy:', url);
  }

  function applyContentPack(pack) {
    if (!pack) return { conn: 0, fonts: 0, shapes: 0 };
    applyConnModes(pack.connModes);
    applyFonts(pack.fonts);
    applyShapes(pack.shapes);
    applied.packVersion = pack.packVersion || '';
    applied.connModes = pack.connModes.slice();
    applied.fonts = pack.fonts.slice();
    applied.shapes = pack.shapes.slice();
    applied.scriptUrl = pack.script || '';
    return {
      conn: pack.connModes.length,
      fonts: pack.fonts.length,
      shapes: pack.shapes.length,
    };
  }

  async function loadContentPack(options) {
    const forceRemote = options?.forceRemote === true;
    let pack = forceRemote ? null : readPackCache();
    let message = pack ? `使用缓存内容包 v${pack.packVersion || '?'}` : '';

    if (forceRemote || !pack) {
      const remote = await fetchRemotePack();
      message = remote.message;
      if (remote.pack) pack = remote.pack;
      else if (!pack) return { applied: null, message: remote.message };
    }

    const counts = applyContentPack(pack);
    if (pack?.script) {
      void loadOptionalScript(pack.script);
    }

    const summary = [];
    if (counts.conn) summary.push(`${counts.conn} 种连线`);
    if (counts.fonts) summary.push(`${counts.fonts} 款字体`);
    if (counts.shapes) summary.push(`${counts.shapes} 个图标`);
    const detail = summary.length ? `（${summary.join('、')}）` : '';

    return {
      applied: pack,
      message: message + detail,
      counts,
    };
  }

  function attachConnAlgorithms(registry) {
    if (!registry || typeof registry !== 'object') return;
    applied.connModes.forEach(mode => {
      const algo = mode.algorithm || mode.id;
      if (registry[algo] && !registry[mode.id]) {
        registry[mode.id] = registry[algo];
      }
    });
  }

  function getAppliedSummary() {
    return {
      packVersion: applied.packVersion,
      connModes: applied.connModes.length,
      fonts: applied.fonts.length,
      shapes: applied.shapes.length,
    };
  }

  function isBuiltinAlgorithm(id) {
    return BUILTIN_ALGORITHMS.has(id);
  }

  global.DiagramWeaveContent = {
    loadContentPack,
    applyContentPack,
    getContentPackUrl,
    getAppliedSummary,
    attachConnAlgorithms,
    isBuiltinAlgorithm,
    validatePack,
  };
})(typeof window !== 'undefined' ? window : globalThis);
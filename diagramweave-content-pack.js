/**
 * DiagramWeave 远程内容包：连线方式、字体、侧边栏图标
 * 从 GitHub raw JSON 拉取，无需重装整包即可扩展能力
 */
(function (global) {
  'use strict';

  const PACK_CACHE_KEY = 'fc-content-pack-cache';
  const BUILTIN_ALGORITHMS = new Set(['bezier', 'orthogonal', 'avoidance', 'straight', 'visio']);
  const MAX_SHAPE_SVG_LENGTH = 4000;
  const ALLOWED_SVG_TAGS = new Set([
    'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text',
    'title', 'desc', 'defs', 'style', 'lineargradient', 'radialgradient', 'stop',
  ]);
  const ALLOWED_SVG_ATTRS = new Set([
    'id', 'class', 'style', 'viewbox', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry',
    'd', 'x1', 'y1', 'x2', 'y2', 'points', 'fill', 'fill-opacity', 'stroke', 'stroke-width',
    'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'opacity',
    'preserveaspectratio', 'vector-effect', 'xmlns',
  ]);
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

  function isForbiddenScriptValue(value) {
    return /javascript:\s*|data:\s*text\/html|expression\s*\(/i.test(String(value));
  }

  function sanitizeSvgAttribute(name, value) {
    const key = String(name || '').trim().toLowerCase();
    if (!key || key.startsWith('on')) return null;
    if (!ALLOWED_SVG_ATTRS.has(key)) return null;
    const v = String(value ?? '');
    if (isForbiddenScriptValue(v)) return null;
    if (key === 'style' && /url\s*\(|expression\s*\(/i.test(v)) return null;
    return { key, value: v };
  }

  function sanitizeSvgNode(node) {
    if (!node || !node.tagName) return null;
    const tag = node.tagName.toLowerCase();
    if (!ALLOWED_SVG_TAGS.has(tag)) return null;
    const clean = node.ownerDocument.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const attr of Array.from(node.attributes || [])) {
      const sanitized = sanitizeSvgAttribute(attr.name, attr.value);
      if (!sanitized) continue;
      clean.setAttribute(sanitized.key, sanitized.value);
    }
    for (const child of Array.from(node.childNodes || [])) {
      if (child.nodeType === 1) {
        const c = sanitizeSvgNode(child);
        if (c) clean.appendChild(c);
        continue;
      }
      if (child.nodeType === 3) {
        const text = String(child.textContent || '').replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
        if (text) clean.appendChild(node.ownerDocument.createTextNode(text));
      }
    }
    return clean;
  }

  function sanitizeSvgFallback(svg) {
    const t = String(svg || '').trim();
    if (!t.startsWith('<svg')) return '';
    if (/<\s*script\b/i.test(t)) return '';
    if (/\son\w+\s*=|<\s*foreignobject\b/i.test(t)) return '';
    return t.slice(0, MAX_SHAPE_SVG_LENGTH);
  }

  function sanitizeSvgSnippet(svg) {
    if (typeof svg !== 'string') return '';
    const t = svg.trim();
    if (!t.startsWith('<svg')) return '';
    if (/<\s*script\b/i.test(t) || /\son\w+\s*=/i.test(t) || /<\s*foreignObject\b/i.test(t)) return '';
    if (typeof DOMParser === 'undefined') return sanitizeSvgFallback(t);
    try {
      const doc = new DOMParser().parseFromString(t, 'image/svg+xml');
      const err = doc.querySelector('parsererror');
      if (err) return '';
      const source = doc.documentElement;
      if (!source || source.tagName.toLowerCase() !== 'svg') return '';
      const clean = sanitizeSvgNode(source);
      return clean ? clean.outerHTML.slice(0, MAX_SHAPE_SVG_LENGTH) : '';
    } catch {
      return sanitizeSvgFallback(t);
    }
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
      const svg = sanitizeSvgSnippet(item.sidebarSvg || item.svg || '');
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

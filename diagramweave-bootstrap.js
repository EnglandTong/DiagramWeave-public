/**
 * DiagramWeave 启动引导：检测/注入运行时库、加载外部模板、检查远程更新
 * 单机场景：用户流程图数据存 JSON 文件；编辑器偏好（如连线路由）可写 localStorage
 */
(function (global) {
  'use strict';

  let manifest = null;
  let externalTemplates = [];

  const DEFAULT_MANIFEST = {
    version: '1.2.0',
    appName: 'DiagramWeave',
    allowRemoteFallback: false,
    githubRepo: '',
    releasePageUrl: '',
    updateCheckUrl: '',
    contentPackUrl: '',
    contentPackVersion: '',
    assets: [],
    localTemplatesIndex: 'templates/index.json',
    remoteTemplates: [],
  };

  const SETTINGS_KEYS = {
    updateCheckUrl: 'fc-update-check-url',
    githubRepo: 'fc-github-repo',
    releasePageUrl: 'fc-release-page-url',
  };

  function readSetting(key) {
    try {
      return localStorage.getItem(key) || '';
    } catch {
      return '';
    }
  }

  function writeSetting(key, value) {
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch { /* ignore */ }
  }

  function normalizeGithubRepo(repo) {
    if (!repo || typeof repo !== 'string') return '';
    return repo.trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\.git$/i, '')
      .replace(/\/+$/, '');
  }

  function getEffectiveGithubRepo() {
    const override = normalizeGithubRepo(readSetting(SETTINGS_KEYS.githubRepo));
    if (override) return override;
    return normalizeGithubRepo(manifest?.githubRepo || '');
  }

  function getUpdateCheckUrl() {
    const override = readSetting(SETTINGS_KEYS.updateCheckUrl).trim();
    if (override) return override;
    const fromManifest = (manifest?.updateCheckUrl || manifest?.updateUrl || '').trim();
    if (fromManifest && !fromManifest.includes('REPLACE_USER')) return fromManifest;
    const repo = getEffectiveGithubRepo();
    if (repo) return `https://raw.githubusercontent.com/${repo}/main/diagramweave.manifest.json`;
    return '';
  }

  function getReleasePageUrl() {
    const override = readSetting(SETTINGS_KEYS.releasePageUrl).trim();
    if (override) return override;
    const fromManifest = (manifest?.releasePageUrl || '').trim();
    if (fromManifest) return fromManifest;
    const repo = getEffectiveGithubRepo();
    if (repo) return `https://github.com/${repo}/releases/latest`;
    return '';
  }

  function parseVersionParts(v) {
    if (!v || typeof v !== 'string') return [0];
    return v.trim().replace(/^v/i, '').split(/[.-]/).map(part => {
      const n = parseInt(part, 10);
      return Number.isFinite(n) ? n : part;
    });
  }

  function compareVersions(a, b) {
    const pa = parseVersionParts(a);
    const pb = parseVersionParts(b);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const x = pa[i] ?? 0;
      const y = pb[i] ?? 0;
      if (typeof x === 'number' && typeof y === 'number') {
        if (x !== y) return x > y ? 1 : -1;
      } else {
        const xs = String(x);
        const ys = String(y);
        if (xs !== ys) return xs > ys ? 1 : -1;
      }
    }
    return 0;
  }

  function getUpdateSettings() {
    return {
      githubRepo: readSetting(SETTINGS_KEYS.githubRepo),
      updateCheckUrl: readSetting(SETTINGS_KEYS.updateCheckUrl),
      releasePageUrl: readSetting(SETTINGS_KEYS.releasePageUrl),
    };
  }

  function saveUpdateSettings(partial) {
    if (partial.githubRepo != null) writeSetting(SETTINGS_KEYS.githubRepo, partial.githubRepo.trim());
    if (partial.updateCheckUrl != null) writeSetting(SETTINGS_KEYS.updateCheckUrl, partial.updateCheckUrl.trim());
    if (partial.releasePageUrl != null) writeSetting(SETTINGS_KEYS.releasePageUrl, partial.releasePageUrl.trim());
  }

  async function checkForUpdate() {
    const current = manifest?.version || DEFAULT_MANIFEST.version;
    const releasePageUrl = getReleasePageUrl();
    const updateCheckUrl = getUpdateCheckUrl();
    const base = {
      current,
      remote: null,
      hasUpdate: false,
      releasePageUrl,
      updateCheckUrl,
      message: '',
    };

    if (isFileProtocol()) {
      return { ...base, message: 'file:// 模式下无法在线检查更新，请通过 bat 启动。' };
    }
    if (!updateCheckUrl) {
      return {
        ...base,
        message: '尚未配置 GitHub 仓库。可在「设置」中填写，或由发布者在 manifest 中预设。',
      };
    }

    try {
      const res = await fetch(updateCheckUrl, { cache: 'no-cache' });
      if (!res.ok) return { ...base, message: `检查失败（HTTP ${res.status}）` };
      const remote = await res.json();
      const remoteVersion = remote.version || '';
      const hasUpdate = remoteVersion && compareVersions(remoteVersion, current) > 0;
      if (hasUpdate && remote.remoteTemplates?.length) {
        manifest.remoteTemplates = remote.remoteTemplates;
      }
      if (remote.contentPackVersion && remote.contentPackVersion !== manifest.contentPackVersion) {
        manifest._contentPackStale = true;
      }
      return {
        ...base,
        remote,
        hasUpdate,
        releasePageUrl: getReleasePageUrl() || releasePageUrl,
        message: hasUpdate
          ? `发现新版本 ${remoteVersion}（当前 ${current}）`
          : remoteVersion
            ? `已是最新版本（${current}）`
            : '远程 manifest 未包含 version 字段',
      };
    } catch {
      return { ...base, message: '无法连接更新服务器（可能离线）' };
    }
  }

  async function checkRemoteUpdate() {
    const result = await checkForUpdate();
    if (result.hasUpdate) {
      toast(result.message + '。可在「设置 → 检查更新」打开下载页。');
    }
    if (manifest?._contentPackStale && typeof DiagramWeaveContent !== 'undefined') {
      toast('发现新内容包（连线/字体/图标），可在「设置 → 同步内容包」获取。');
    }
  }

  /** file:// 下 fetch 本地 JSON 会被 CORS 拦截；模板请放入 templates/ 并在 index.json 注册 */
  const FILE_PROTOCOL_TEMPLATES = [];

  function isFileProtocol() {
    return typeof location !== 'undefined' && location.protocol === 'file:';
  }

  function readInlineJson(elementId, fallback) {
    const el = document.getElementById(elementId);
    if (!el) return fallback;
    try {
      return JSON.parse(el.textContent);
    } catch {
      return fallback;
    }
  }

  function toast(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  async function loadLocalManifest() {
    if (isFileProtocol()) {
      manifest = readInlineJson('fc-inline-manifest', DEFAULT_MANIFEST);
      return manifest;
    }
    try {
      const res = await fetch('diagramweave.manifest.json', { cache: 'no-cache' });
      if (res.ok) manifest = await res.json();
      else manifest = { ...DEFAULT_MANIFEST };
    } catch {
      manifest = { ...DEFAULT_MANIFEST };
    }
    if (manifest.allowRemoteFallback == null) manifest.allowRemoteFallback = false;
    return manifest;
  }

  function globalReady(check) {
    if (!check) return true;
    if (check === 'jspdf') return typeof global.jspdf !== 'undefined';
    if (check === 'svg2pdf') return typeof global.svg2pdf !== 'undefined';
    if (check === 'XLSX') return typeof global.XLSX !== 'undefined';
    if (check === 'dagre') return typeof global.dagre !== 'undefined';
    return typeof global[check] !== 'undefined';
  }

  /** 通过 script.src 加载（禁止 textContent 注入执行） */
  function injectScriptFromUrl(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.async = false;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load: ' + url));
      document.head.appendChild(s);
    });
  }

  async function ensureAsset(asset) {
    if (asset.optional) return;
    if (globalReady(asset.globalCheck)) return;
    // file:// 与 HTML 预加载的 vendor <script src> 已足够
    if (isFileProtocol()) return;

    if (asset.path) {
      try {
        await injectScriptFromUrl(asset.path);
        if (globalReady(asset.globalCheck)) return;
      } catch { /* local vendor missing */ }
    }

    if (manifest.allowRemoteFallback === true && asset.remote) {
      try {
        await injectScriptFromUrl(asset.remote);
        if (globalReady(asset.globalCheck)) return;
      } catch (err) {
        console.warn('Remote asset load failed:', asset.id, err);
      }
    }

    if (!globalReady(asset.globalCheck)) {
      console.warn(
        'Missing runtime asset (local only):',
        asset.id,
        '- run pnpm install && ensure vendor/ is complete'
      );
    }
  }

  async function ensureRuntime() {
    await loadLocalManifest();
    if (!manifest.assets) return manifest;

    for (const asset of manifest.assets) {
      if (asset.dependsOn) {
        for (const dep of asset.dependsOn) {
          const depAsset = manifest.assets.find(a => a.id === dep);
          if (depAsset) await ensureAsset(depAsset);
        }
      }
      await ensureAsset(asset);
    }
    return manifest;
  }

  async function loadTemplateFile(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(url);
    const data = await res.json();
    if (data.name && data.nodes) externalTemplates.push(data);
  }

  async function loadTemplateLibrary() {
    externalTemplates = [];
    if (isFileProtocol()) {
      externalTemplates = FILE_PROTOCOL_TEMPLATES.slice();
      return externalTemplates;
    }

    const indexPath = manifest?.localTemplatesIndex || 'templates/index.json';
    try {
      const idx = await fetch(indexPath, { cache: 'no-cache' }).then(r => r.json());
      for (const file of idx.templates || []) {
        try {
          await loadTemplateFile('templates/' + file);
        } catch (e) {
          console.warn('Template skip:', file, e);
        }
      }
    } catch { /* no local templates folder */ }

    for (const url of manifest?.remoteTemplates || []) {
      try {
        await loadTemplateFile(url);
      } catch (e) {
        console.warn('Remote template skip:', url, e);
      }
    }
    return externalTemplates;
  }

  function getExternalTemplates() {
    return externalTemplates.slice();
  }

  global.DiagramWeaveBootstrap = {
    ensureRuntime,
    checkRemoteUpdate,
    checkForUpdate,
    getUpdateSettings,
    saveUpdateSettings,
    getReleasePageUrl,
    getUpdateCheckUrl,
    compareVersions,
    loadTemplateLibrary,
    getExternalTemplates,
    getManifest: () => manifest,
    isFileProtocol,
  };
})(typeof window !== 'undefined' ? window : globalThis);

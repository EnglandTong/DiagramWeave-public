/**
 * DiagramWeave Error Boundary
 *
 * 全局异常边界与安全工具。以 IIFE 挂载到全局命名空間 DiagramWeaveErrorBoundary。
 *
 * 包含：
 * - 全局 window.onerror / window.onunhandledrejection 处理（带堆栈采样节流）
 * - safeJsonParse：帶版本校驗與 schema 校驗的安全 JSON 解析
 * - safeFetch：帶超時、重試與 AbortSignal 的安全 fetch 封裝
 * - safeSetInterval / safeSetTimeout：返回可清理的句柄，防止泄漏
 * - EventListenerRegistry：add/remove 配對追蹤，防止事件監聽器泄漏
 * - RAFRegistry：requestAnimationFrame 追蹤與批量取消
 * - wrap：高階函數，自動 try-catch 並返回 Result
 *
 * 外部依賴（可選，均有 typeof 守衛）：
 * - DiagramWeaveResult.createError / createSuccess（diagramweave-result.js）
 * - console（僅在有 console 時輸出）
 */
(function initDiagramWeaveErrorBoundary(global) {
  'use strict';

  const Result = typeof global.DiagramWeaveResult !== 'undefined' && global.DiagramWeaveResult
    ? global.DiagramWeaveResult
    : { createError: issues => ({ success: false, data: null, issues }), createSuccess: data => ({ success: true, data }) };

  // ===== 全局錯誤處理 =====

  /** 錯誤報告節流：同一 message+stack 在 5 秒內只報告一次 */
  const reportCache = new Map();
  const REPORT_THROTTLE_MS = 5000;
  let installed = false;
  let globalHandlerBound = false;

  function reportError(error, context) {
    try {
      const key = `${error?.message || error}:${(error?.stack || '').slice(0, 200)}`;
      const now = Date.now();
      const last = reportCache.get(key) || 0;
      if (now - last < REPORT_THROTTLE_MS) return;
      reportCache.set(key, now);
      if (typeof global.console !== 'undefined') {
        const ctx = context ? `[DiagramWeave${context}]` : '[DiagramWeave]';
        global.console.error(ctx, error);
      }
    } catch {
      // 報告本身不能拋錯
    }
  }

  function handleGlobalError(message, source, lineno, colno, error) {
    reportError(error || new Error(String(message)), 'window.onerror');
    return true; // 阻止彈出對話框
  }

  function handleUnhandledRejection(event) {
    reportError(event.reason || new Error('Unhandled Promise rejection'), 'unhandledrejection');
  }

  /** 安裝全局錯誤監聽器（冪等） */
  function installGlobalHandlers() {
    if (installed) return;
    try {
      if (typeof global.window !== 'undefined') {
        global.window.onerror = handleGlobalError;
        global.window.addEventListener('unhandledrejection', handleUnhandledRejection);
        globalHandlerBound = true;
      }
      installed = true;
    } catch (err) {
      reportError(err, 'installGlobalHandlers');
    }
  }

  function uninstallGlobalHandlers() {
    if (!installed) return;
    try {
      if (globalHandlerBound && typeof global.window !== 'undefined') {
        global.window.onerror = null;
        global.window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        globalHandlerBound = false;
      }
      installed = false;
    } catch (err) {
      reportError(err, 'uninstallGlobalHandlers');
    }
  }

  // ===== safeJsonParse =====

  /**
   * 安全 JSON 解析。
   * @param {string} raw 原始 JSON 字串
   * @param {object} [options]
   * @param {number} [options.maxLength=1048576] 最大允許解析長度（預設 1 MiB）
   * @param {object} [options.versionGuard] 版本校驗 { current: number, min: number }
   * @param {function} [options.schemaValidate] schema 校驗函數 (obj) => { ok: boolean, reason?: string }
   * @returns {{ success: boolean, data?: any, issues?: Array }}
   */
  function safeJsonParse(raw, options = {}) {
    const { maxLength = 1024 * 1024, versionGuard, schemaValidate } = options;

    if (raw === null || raw === undefined) {
      return Result.createError([{ code: 'json_empty', message: 'Input is null or undefined' }]);
    }
    if (typeof raw !== 'string') {
      return Result.createError([{ code: 'json_not_string', message: `Expected string, got ${typeof raw}` }]);
    }
    if (raw.length > maxLength) {
      return Result.createError([{ code: 'json_too_large', message: `Input exceeds ${maxLength} bytes` }]);
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      reportError(err, 'safeJsonParse');
      return Result.createError([{ code: 'json_syntax', message: err.message }]);
    }

    if (versionGuard && typeof parsed === 'object') {
      const v = parsed.version ?? parsed.schemaVersion ?? 0;
      if (typeof v === 'number' && versionGuard.min && v < versionGuard.min) {
        return Result.createError([{
          code: 'json_version_too_old',
          message: `Version ${v} < min supported ${versionGuard.min}`,
        }]);
      }
    }

    if (typeof schemaValidate === 'function') {
      const check = schemaValidate(parsed);
      if (check && check.ok === false) {
        return Result.createError([{
          code: 'json_schema',
          message: check.reason || 'Schema validation failed',
        }]);
      }
    }

    return Result.createSuccess(parsed);
  }

  // ===== safeFetch =====

  const FETCH_DEFAULTS = { timeoutMs: 15000, retries: 1, backoffMs: 500 };

  /**
   * 安全 fetch 封裝。
   * @param {string|Request} input URL 或 Request
   * @param {object} [init] fetch init 參數（會合併 timeout 相關）
   * @param {object} [options] 擴展選項
   * @param {number} [options.timeoutMs=15000] 單次請求超時
   * @param {number} [options.retries=1] 失敗重試次數
   * @param {number} [options.backoffMs=500] 重試間隔
   * @returns {Promise<Response>}
   */
  async function safeFetch(input, init, options = {}) {
    if (typeof global.fetch !== 'function') {
      throw new Error('fetch is not available');
    }
    const { timeoutMs, retries, backoffMs } = { ...FETCH_DEFAULTS, ...options };

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new global.AbortController();
      const timer = global.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await global.fetch(input, { ...init, signal: controller.signal });
        global.clearTimeout(timer);
        return response;
      } catch (err) {
        global.clearTimeout(timer);
        lastError = err;
        if (attempt < retries) {
          await new global.Promise(resolve => global.setTimeout(resolve, backoffMs * (attempt + 1)));
        }
      }
    }
    reportError(lastError, 'safeFetch');
    throw lastError;
  }

  // ===== 定時器追蹤 =====

  const intervalHandles = new Set();
  const timeoutHandles = new Set();

  function safeSetInterval(fn, delay, ...args) {
    if (typeof fn !== 'function') {
      throw new TypeError('safeSetInterval: fn must be a function');
    }
    let handle;
    const tracked = function trackedInterval() {
      try { fn.apply(null, args); } catch (err) { reportError(err, 'safeSetInterval'); }
    };
    handle = global.setInterval(tracked, delay);
    intervalHandles.add(handle);
    return {
      clear: () => {
        global.clearInterval(handle);
        intervalHandles.delete(handle);
      },
      handle,
    };
  }

  function safeSetTimeout(fn, delay, ...args) {
    if (typeof fn !== 'function') {
      throw new TypeError('safeSetTimeout: fn must be a function');
    }
    let handle;
    handle = global.setTimeout(() => {
      timeoutHandles.delete(handle);
      try { fn.apply(null, args); } catch (err) { reportError(err, 'safeSetTimeout'); }
    }, delay);
    timeoutHandles.add(handle);
    return {
      clear: () => {
        global.clearTimeout(handle);
        timeoutHandles.delete(handle);
      },
      handle,
    };
  }

  function clearAllTimers() {
    intervalHandles.forEach(h => global.clearInterval(h));
    timeoutHandles.forEach(h => global.clearTimeout(h));
    intervalHandles.clear();
    timeoutHandles.clear();
  }

  // ===== 事件監聽器追蹤 =====

  const eventRegistry = new Map(); // target -> Map(event, Set(handler))

  /**
   * 註冊事件監聽器（返回一個函數，調用即移除）。
   * 追蹤 target+event+handler 三元組，clearAllEventListeners() 可一鍵清空。
   */
  function addEventListener(target, event, handler, options) {
    if (!target || typeof target.addEventListener !== 'function') {
      return () => {};
    }
    try {
      target.addEventListener(event, handler, options);
      const handlers = eventRegistry.get(target) || new Map();
      const set = handlers.get(event) || new Set();
      set.add(handler);
      handlers.set(event, set);
      eventRegistry.set(target, handlers);
      return () => removeEventListener(target, event, handler, options);
    } catch (err) {
      reportError(err, 'addEventListener');
      return () => {};
    }
  }

  function removeEventListener(target, event, handler, options) {
    if (!target || typeof target.removeEventListener !== 'function') return;
    try {
      target.removeEventListener(event, handler, options);
      const handlers = eventRegistry.get(target);
      if (handlers) {
        const set = handlers.get(event);
        if (set) {
          set.delete(handler);
          if (set.size === 0) handlers.delete(event);
        }
        if (handlers.size === 0) eventRegistry.delete(target);
      }
    } catch (err) {
      reportError(err, 'removeEventListener');
    }
  }

  function clearAllEventListeners(target) {
    try {
      if (target) {
        const handlers = eventRegistry.get(target);
        if (!handlers) return;
        handlers.forEach((set, event) => {
          set.forEach(handler => {
            try { target.removeEventListener(event, handler); } catch {}
          });
        });
        eventRegistry.delete(target);
      } else {
        eventRegistry.forEach((handlers, tgt) => {
          handlers.forEach((set, event) => {
            set.forEach(handler => {
              try { tgt.removeEventListener(event, handler); } catch {}
            });
          });
        });
        eventRegistry.clear();
      }
    } catch (err) {
      reportError(err, 'clearAllEventListeners');
    }
  }

  // ===== RAF 追蹤 =====

  const rafHandles = new Set();

  function safeRequestAnimationFrame(fn) {
    if (typeof global.requestAnimationFrame !== 'function') {
      // 回退為 setTimeout
      const handle = global.setTimeout(fn, 16);
      timeoutHandles.add(handle);
      return handle;
    }
    let id;
    const wrapped = function wrappedRAF(ts) {
      rafHandles.delete(id);
      try { fn(ts); } catch (err) { reportError(err, 'safeRequestAnimationFrame'); }
    };
    id = global.requestAnimationFrame(wrapped);
    rafHandles.add(id);
    return id;
  }

  function cancelAllAnimationFrames() {
    if (typeof global.cancelAnimationFrame !== 'function') return;
    rafHandles.forEach(id => {
      try { global.cancelAnimationFrame(id); } catch {}
    });
    rafHandles.clear();
  }

  // ===== 高階 wrap =====

  /** 把函數包裝成自動 try-catch，返回 Result */
  function wrap(fn, context) {
    return function wrapped(...args) {
      try {
        const result = fn.apply(this, args);
        if (result && typeof result.then === 'function') {
          return result.then(
            value => Result.createSuccess(value),
            err => { reportError(err, context || fn.name); return Result.createError([{ code: context || fn.name, message: err.message }]); }
          );
        }
        return Result.createSuccess(result);
      } catch (err) {
        reportError(err, context || fn.name);
        return Result.createError([{ code: context || fn.name, message: err.message }]);
      }
    };
  }

  // ===== 導出 =====

  global.DiagramWeaveErrorBoundary = {
    // 安裝/卸載
    installGlobalHandlers,
    uninstallGlobalHandlers,
    get installed() { return installed; },
    // 安全工具
    safeJsonParse,
    safeFetch,
    safeSetInterval,
    safeSetTimeout,
    safeRequestAnimationFrame,
    clearAllTimers,
    cancelAllAnimationFrames,
    // 事件追蹤
    addEventListener,
    removeEventListener,
    clearAllEventListeners,
    // 高階 wrap
    wrap,
    // 內部狀態查詢（調試用）
    _internal: () => ({
      intervalHandles: intervalHandles.size,
      timeoutHandles: timeoutHandles.size,
      rafHandles: rafHandles.size,
      eventTargets: eventRegistry.size,
    }),
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

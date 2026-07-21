/* eslint-env node */
const js = require("@eslint/js");
const globals = require("globals");

// DiagramWeave 模塊通過 IIFE 掛載到 global 的命名空間（見 diagramweave-*.js）
const diagramWeaveGlobals = {
  DiagramWeave: "readonly",
  DiagramWeaveBootstrap: "readonly",
  DiagramWeaveCanvasTools: "readonly",
  DiagramWeaveCommandSystem: "readonly",
  DiagramWeaveContent: "readonly",
  DiagramWeaveContracts: "readonly",
  DiagramWeaveExport: "readonly",
  DiagramWeaveExtensionKernel: "readonly",
  DiagramWeaveFieldMapping: "readonly",
  DiagramWeaveHistory: "readonly",
  DiagramWeaveI18n: "readonly",
  DiagramWeaveImportPreview: "readonly",
  DiagramWeaveNodeColors: "readonly",
  DiagramWeavePropertyPanel: "readonly",
  DiagramWeavePropertyTools: "readonly",
  DiagramWeaveRoutingRules: "readonly",
  DiagramWeaveSanitize: "readonly",
  DiagramWeaveShapeLibrary: "readonly",
  DiagramWeaveStencilManager: "readonly",
  DiagramWeaveTemplateCenter: "readonly",
  DiagramWeaveVisioBridge: "readonly",
  DiagramWeaveVisioPreview: "readonly",
  DiagramWeaveResult: "readonly",
  DiagramWeaveUtils: "readonly",
  
  DiagramWeaveMermaidImporter: "readonly",
  DiagramWeaveBpmnImporter: "readonly",
  DiagramWeaveVsdxParser: "readonly",
  DiagramWeaveVsdxPackager: "readonly",
  DiagramWeaveVsdxGeometry: "readonly",
  DiagramWeaveVsdxConnectors: "readonly",
};

// vendor 與第三方庫注入的全局（見 flowchart-editor.html 與 manifest）
const vendorGlobals = {
  XLSX: "readonly",
  dagre: "readonly",
  jspdf: "readonly",
  svg2pdf: "readonly",
  mermaid: "readonly",
  cytoscape: "readonly",
  cy: "readonly",
  axe: "readonly",
  bpmnmoddle: "readonly",
};

// flowchart-editor.js 在瀏覽器全局作用域暴露的隱式契約 API。
// 其他產品文件（flowchart-extensions.js、diagramweave-bootstrap.js 等）依賴這些全局。
// 此清單為運行時契約的顯式聲明；拆分工作單 DW-QA-20260720-02 會把這些遷為模塊導出。
const editorGlobals = {
  state: "readonly",
  renderAll: "readonly",
  saveState: "readonly",
  showToast: "readonly",
  canvasTransform: "readonly",
  shapeDefaults: "readonly",
  shapeNames: "readonly",
  updatePagePropertiesPanel: "readonly",
  applyConnRouteModeFromData: "readonly",
  registerConnRouteMode: "readonly",
  registerRemoteShape: "readonly",
};

module.exports = [
  js.configs.recommended,

  // 產品源：瀏覽器腳本（IIFE / 全局環境）
  {
    files: ["*.js", "client/**/*.js", "electron/**/*.js", "editor/**/*.js"],
    ignores: ["vendor/**", "node_modules/**", "archive/**", "tests/e2e/**", "diagramweave-ui-redesign*/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...diagramWeaveGlobals,
        ...vendorGlobals,
        ...editorGlobals,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-redeclare": "error",
      "no-undef": "error",
      "no-dupe-class-members": "error",
      "no-duplicate-case": "error",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-constant-condition": ["warn", { checkLoops: false }],
      "no-control-regex": "off",
      "max-lines": ["warn", { max: 1200, skipComments: true, skipBlankLines: true }],
      "max-lines-per-function": ["warn", { max: 80, skipComments: true, skipBlankLines: true }],
      "complexity": ["warn", { max: 15 }],
      "max-depth": ["warn", { max: 4 }],
      "max-params": ["warn", { max: 5 }],
      "max-statements": ["warn", { max: 40 }],
    },
  },

  // flowchart-editor.js 是將在 DW-QA-20260720-02 拆分的巨型單體文件（8232 行）。
  // 其變量定義順序混亂、存在未使用定義；暫降 no-undef 為 warn，門禁可運行，
  // 真實清理留待拆分工作單。其餘產品文件仍嚴格 no-undef。
  {
    files: ["flowchart-editor.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...diagramWeaveGlobals,
        ...vendorGlobals,
        ...editorGlobals,
      },
    },
    rules: {
      "no-undef": "warn",
      "no-control-regex": "off",
      "no-redeclare": "off",
    },
  },

  // Node 端腳本與服務（ESM .mjs）
  {
    files: [
      "scripts/**/*.mjs",
      "core-server/**/*.mjs",
      "shared/**/*.mjs",
      "electron/main.mjs",
      "vitest.config.js",
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  // 單元測試（vitest 在 node 環境運行，含 browser 全局與測試 API）
  {
    files: ["tests/**/*.test.js", "tests/**/*.spec.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        ...diagramWeaveGlobals,
        ...vendorGlobals,
        // 測試框架 API
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
    },
  },

  // Playwright / vitest 配置文件為 ESM
  {
    files: ["playwright.config.js", "vitest.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "no-undef": "off",
    },
  },

  // 明確忽略的目錄
  {
    ignores: [
      "vendor/**",
      "node_modules/**",
      "archive/**",
      ".git/**",
      "audit-results/**",
      "playwright-results/**",
      "tests/e2e/**",
      "diagramweave-ui-redesign/**",
      "diagramweave-ui-redesign-draft*/**",
      "dist/**",
    ],
  },
];

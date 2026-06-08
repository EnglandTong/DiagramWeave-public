# DiagramWeave

单机 Web 流程图编辑器，支持 **中文 / English** 界面切换。拖拽绘图、多页多图层、Excel/JSON 导入导出、PNG/SVG/PDF 导出。

DiagramWeave is a local web-based flowchart editor with **Chinese / English** UI support, drag-and-drop diagramming, multi-page and multi-layer editing, Excel/JSON import/export, and PNG/SVG/PDF export.

## 语言 / Language

- [中文说明](#中文说明)
- [English README](#english-readme)

---

## 中文说明

### 仓库信息

GitHub 仓库：<https://github.com/EnglandTong/DiagramWeave-public>

当前状态：public。GitHub Releases、远程 manifest 和远程内容包 raw 地址可用于公开发布。

### 快速开始

**需要 Node.js 18+**

如果是第一次在 Windows 上运行，建议先安装官方 Node.js LTS：<https://nodejs.org/>。官方安装包会同时安装 npm。

```bash
pnpm install
pnpm serve
```

浏览器打开：<http://127.0.0.1:4173/flowchart-editor.html>

**语言切换**：工具栏 **中文 / EN** 下拉，或 **设置 → 界面语言**。

Windows 也可双击 `start-diagramweave.bat`（或 `启动DiagramWeave.bat`）。

**首次双击 bat** 会自动：检测 Node.js → 安装 npm 依赖 → 复制 vendor 库 → 下载/同步中文字体 → 启动本地服务并打开浏览器。

如果 Windows 提示“智能应用控制已阻止可能不安全的文件”，请先看 [`WINDOWS_START.md`](WINDOWS_START.md)。

如果 BAT 提示“未找到 pnpm / npm”，请安装官方 Node.js LTS 后重新打开 BAT。

> 不建议直接用 `file://` 打开 HTML；请通过本地 HTTP 服务访问，否则连线等功能可能异常。

### 使用指南

面向使用者的绘图、连线、导入导出、模板、页面和图层说明：

- 中文：[`USER_GUIDE.md`](USER_GUIDE.md)
- English: [`USER_GUIDE.en.md`](USER_GUIDE.en.md)

### 更新

| 方式 | 更新内容 |
|------|----------|
| **设置 → 同步内容包** | 连线方式、字体、侧边栏图标（`remote/content-pack.json`） |
| **设置 → 检查更新** | 主程序版本，跳转 GitHub Releases |
| `update-diagramweave.bat` | Git 用户拉代码 + 同步依赖 |

内容包适合频繁更新；主程序大改仍发 Release。详见 `remote/README.md`。

内容包只更新图标、字体和连线模式配置，不执行远程 JavaScript。新增连线算法、导入导出逻辑、BAT 脚本或主程序结构变更必须通过 GitHub Releases 或 Git 更新。更新边界详见 `UPDATE_TRUST_CHAIN.md`。

### 开发

```bash
pnpm typecheck   # JS 语法检查
pnpm test        # 单元测试（sanitize、导出图形等）
pnpm test:e2e    # 浏览器冒烟测试（首次需 pnpm exec playwright install chromium）
```

### 添加流程模板（可选）

1. 在 `templates/` 下新建 JSON（格式见下方）。
2. 在 `templates/index.json` 的 `templates` 数组中登记文件名。
3. 重启或刷新后，工具栏「模板」对话框中可见。

仓库已含可选模板 `starter-vertical.json`（竖向基础流程），**不会**自动加载到画布。

```json
{
  "name": "我的流程",
  "description": "说明文字",
  "layout": "vertical",
  "nodes": [{ "shape": "rectangle", "label": "步骤1" }],
  "connections": []
}
```

### 目录说明

| 路径 | 说明 |
|------|------|
| `flowchart-editor.html` | 页面壳（HTML） |
| `flowchart-editor.css` | 样式 |
| `flowchart-editor.js` | 编辑器主逻辑 |
| `flowchart-export-shapes.js` | SVG/PNG/PDF 导出图形 |
| `flowchart-extensions.js` | 多页、图层、布局扩展 |
| `diagramweave-bootstrap.js` | 运行时库与模板加载 |
| `flowchart-sanitize.js` | JSON 导入校验 |
| `vendor/` | 第三方 JS（postinstall 复制） |
| `scripts/` | 本地服务、字体下载、vendor 复制 |

### 许可证

MIT（见 `LICENSE` 和 `package.json`）

---

## English README

### Repository

GitHub repository: <https://github.com/EnglandTong/DiagramWeave-public>

Current status: public. GitHub Releases, the remote manifest, and raw content pack URLs are available for public distribution.

### Quick Start

**Requires Node.js 18+**

For first-time Windows use, install the official Node.js LTS first: <https://nodejs.org/>. The official installer includes npm.

```bash
pnpm install
pnpm serve
```

Open in your browser:

<http://127.0.0.1:4173/flowchart-editor.html>

**Language switch**: use the **中文 / EN** dropdown in the toolbar, or open **Settings → UI language**.

On Windows, you can also double-click `start-diagramweave.bat` or `启动DiagramWeave.bat`.

On first launch, the BAT file will check Node.js, install dependencies, copy vendor files, sync the Chinese font, start the local service, and open the browser.

If Windows shows "Smart App Control blocked a potentially unsafe file", see [`WINDOWS_START.md`](WINDOWS_START.md).

If the BAT file says "pnpm / npm was not found", install the official Node.js LTS and run the BAT again.

> Do not open the HTML file directly with `file://`. Use the local HTTP service, otherwise connections and related features may not work correctly.

### User Guide

For drawing, connections, import/export, templates, pages, and layers:

- Chinese: [`USER_GUIDE.md`](USER_GUIDE.md)
- English: [`USER_GUIDE.en.md`](USER_GUIDE.en.md)

### Updates

| Method | What It Updates |
|---|---|
| **Settings → Sync content pack** | Connection modes, fonts, sidebar icons (`remote/content-pack.json`) |
| **Settings → Check update** | Main application version, linked to GitHub Releases |
| `update-diagramweave.bat` | Git pull + dependency sync for Git users |

The content pack is suitable for frequent data updates. Major application changes should still be released through GitHub Releases. See `remote/README.md`.

The content pack only updates icons, fonts, and connection mode configuration. It does not execute remote JavaScript. New routing algorithms, import/export logic, BAT scripts, or application structure changes must be delivered through GitHub Releases or Git updates. See `UPDATE_TRUST_CHAIN.md` for the update boundary.

### Development

```bash
pnpm typecheck   # JavaScript syntax check
pnpm test        # Unit tests for sanitizer, export shapes, etc.
pnpm test:e2e    # Browser smoke tests; first run may require pnpm exec playwright install chromium
```

### Add Flow Templates (Optional)

1. Create a JSON file under `templates/`.
2. Register the file name in the `templates` array of `templates/index.json`.
3. Restart or refresh the page, then open the template dialog from the toolbar.

The repository includes the optional template `starter-vertical.json`, a simple vertical starter flow. It is **not** loaded onto the canvas automatically.

```json
{
  "name": "My flow",
  "description": "Description text",
  "layout": "vertical",
  "nodes": [{ "shape": "rectangle", "label": "Step 1" }],
  "connections": []
}
```

### Project Structure

| Path | Description |
|---|---|
| `flowchart-editor.html` | HTML shell |
| `flowchart-editor.css` | Styles |
| `flowchart-editor.js` | Main editor logic |
| `flowchart-export-shapes.js` | SVG/PNG/PDF export shapes |
| `flowchart-extensions.js` | Multi-page, layer, and layout extensions |
| `diagramweave-bootstrap.js` | Runtime asset and template loading |
| `flowchart-sanitize.js` | JSON import validation |
| `vendor/` | Third-party JS copied by postinstall |
| `scripts/` | Local server, font download, and vendor copy scripts |

### License

MIT. See `LICENSE` and `package.json`.

# DiagramWeave

单机 Web 流程图编辑器，支持 **中文 / English** 界面切换。拖拽绘图、多页多图层、Excel/JSON 导入导出、PNG/SVG/PDF 导出。

## 仓库信息

GitHub 仓库：<https://github.com/EnglandTong/DiagramWeave-public>

当前状态：public。GitHub Releases、远程 manifest 和远程内容包 raw 地址可用于公开发布。

## 快速开始

**需要 Node.js 18+**

```bash
pnpm install
pnpm serve
```

浏览器打开：<http://127.0.0.1:4173/flowchart-editor.html>

**语言切换**：工具栏 **中文 / EN** 下拉，或 **设置 → 界面语言**。

Windows 也可双击 `start-diagramweave.bat`（或 `启动DiagramWeave.bat`）。

**首次双击 bat** 会自动：检测 Node.js → 安装 npm 依赖 → 复制 vendor 库 → 下载/同步中文字体 → 启动本地服务并打开浏览器。

> 不建议直接用 `file://` 打开 HTML；请通过本地 HTTP 服务访问，否则连线等功能可能异常。

## 使用指南

面向使用者的绘图、连线、导入导出、模板、页面和图层说明见 [`USER_GUIDE.md`](USER_GUIDE.md)。

## 更新

| 方式 | 更新内容 |
|------|----------|
| **设置 → 同步内容包** | 连线方式、字体、侧边栏图标（`remote/content-pack.json`） |
| **设置 → 检查更新** | 主程序版本，跳转 GitHub Releases |
| `update-diagramweave.bat` | Git 用户拉代码 + 同步依赖 |

内容包适合频繁更新；主程序大改仍发 Release。详见 `remote/README.md`。

内容包只更新图标、字体和连线模式配置，不执行远程 JavaScript。新增连线算法、导入导出逻辑、BAT 脚本或主程序结构变更必须通过 GitHub Releases 或 Git 更新。更新边界详见 `UPDATE_TRUST_CHAIN.md`。

## 开发

```bash
pnpm typecheck   # JS 语法检查
pnpm test        # 单元测试（sanitize、导出图形等）
pnpm test:e2e    # 浏览器冒烟测试（首次需 pnpm exec playwright install chromium）
```

## 添加流程模板（可选）

1. 在 `templates/` 下新建 JSON（格式见下方）
2. 在 `templates/index.json` 的 `templates` 数组中登记文件名
3. 重启或刷新后，工具栏「模板」对话框中可见

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

## 目录说明

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

## 许可证

MIT（见 `LICENSE` 和 `package.json`）

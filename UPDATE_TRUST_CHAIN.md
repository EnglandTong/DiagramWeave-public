# DiagramWeave 发布与更新信任链

本文档约定 GitHub 分发、BAT 启动、内容包同步和主程序更新的边界，避免把远程数据更新变成远程代码执行。

## 1. 更新通道

| 通道 | 入口 | 更新内容 | 信任级别 |
|---|---|---|---|
| 本地启动 | `start-diagramweave.bat` | 启动本机 HTTP 服务并打开浏览器 | 本机脚本 |
| 内容包同步 | 设置 → 同步内容包 | 图标、字体、连线模式配置 | 远程数据 |
| 更新检查 | 设置 → 检查更新 | 读取远程 manifest，提示 Release 下载页 | 远程元数据 |
| 主程序更新 | GitHub Releases / `update-diagramweave.bat` | HTML、JS、CSS、BAT、依赖、内置算法 | 主程序代码 |

## 2. 内容包边界

内容包是数据，不是插件系统。

允许：

- 新增或调整侧边栏图标。
- 新增连线模式显示项，但只能绑定内置算法：`bezier`、`orthogonal`、`avoidance`、`straight`。
- 新增字体定义，字体 URL 必须是 HTTPS。
- 调整默认尺寸、分类和显示名称。

不允许：

- 执行远程 JavaScript。
- 在 SVG 中使用 `<script>`、事件属性、`foreignObject` 或脚本协议。
- 用内容包下发新的连线算法代码。
- 用内容包修改主程序结构、BAT 脚本或依赖。

## 3. 主程序更新边界

以下变更必须走 GitHub Release 或 Git 更新：

- 新增连线算法。
- 修改连线寻路逻辑。
- 修改图形渲染逻辑。
- 修改文件导入导出逻辑。
- 修改 BAT 启动、安装、更新流程。
- 修改安全清洗策略。
- 修改依赖版本。

原因：这些变更属于可执行代码或核心行为，必须进入版本化发布流程，方便用户确认来源、回滚和排查问题。

## 4. BAT 启动与更新

`start-diagramweave.bat` 只负责：

- 检查 Node.js。
- 执行本地环境准备。
- 启动 `scripts/serve.mjs`。
- 打开 `http://127.0.0.1:4173/flowchart-editor.html`。

`update-diagramweave.bat` 只适合 Git 用户：

- 检查当前目录是否为 Git 仓库。
- 执行 `git pull --ff-only`。
- 重新执行本地环境准备。

ZIP 用户不应依赖 `update-diagramweave.bat` 更新主程序，应该从 GitHub Releases 下载新的发布包。

## 5. 发布检查清单

发布主程序前：

- 递增 `diagramweave.manifest.json` 的 `version`。
- 确认 `allowRemoteFallback` 不是意外开启。
- 运行 `pnpm test`。
- 运行 `pnpm typecheck`。
- 运行 `pnpm test:e2e`。
- 确认 `remote/content-pack.json` 中没有 `script` 字段。
- 确认 README 和远程内容包文档描述一致。

发布内容包前：

- 递增 `packVersion`。
- 只修改 `connModes`、`fonts`、`shapes` 等数据字段。
- 确认新增 SVG 可被 allowlist 接受。
- 不加入任何 JavaScript 代码。

# 远程内容包

推送到 GitHub 后，用户在 DiagramWeave **设置 → 同步内容包** 即可拉取，无需重装整包。

当前 GitHub 仓库：<https://github.com/EnglandTong/DiagramWeave-public>

当前状态：public。下面的 raw 内容包地址可被公开访问。

## 文件

| 文件 | 说明 |
|------|------|
| `content-pack.json` | 连线方式、字体、侧边栏图标定义 |

默认地址：`https://raw.githubusercontent.com/EnglandTong/DiagramWeave-public/main/remote/content-pack.json`  
也可在 `diagramweave.manifest.json` 用 `contentPackUrl` 指定。

## content-pack.json 字段

### connModes — 连线方式

```json
{ "id": "straight", "label": "直线", "algorithm": "straight" }
```

| algorithm | 说明 |
|-----------|------|
| `bezier` | 平滑曲线（内置） |
| `orthogonal` | 正交折线 |
| `avoidance` | 加强避障 |
| `straight` | 直线 |

新算法必须随主程序发版。内容包只允许把连线模式绑定到上表中的内置算法，不允许通过 `script` 字段加载或执行远程 JS。

### fonts — 字体

```json
{
  "id": "noto-sc",
  "label": "思源黑体",
  "family": "DiagramWeaveNoto",
  "url": "https://raw.githubusercontent.com/.../NotoSansSC-Regular.otf",
  "forUi": true,
  "forPdf": true
}
```

`url` 须为 **https** 直链（建议放仓库 `remote/fonts/`）。

### shapes — 侧边栏图标

```json
{
  "id": "webhook",
  "label": "Webhook",
  "renderAs": "parallelogram",
  "defaults": { "w": 140, "h": 56 },
  "sidebarSvg": "<svg viewBox=\"0 0 40 40\">...</svg>"
}
```

- `id`：形状标识，写入节点 `shape`
- `renderAs`：画布渲染复用已有形状（如 `rectangle`、`diamond`、`storage`）

## 发布流程

1. 修改 `content-pack.json`，递增 `packVersion`
2. `git push` 到 GitHub
3. 用户打开 DiagramWeave → **设置 → 同步内容包**

主程序大版本仍走 Releases；内容包适合频繁更新图标、字体、连线选项。

## 安全边界

| 更新内容 | 允许方式 | 不允许方式 |
|---|---|---|
| 侧边栏图标 | `shapes[].sidebarSvg`，经过 SVG allowlist 清洗 | `<script>`、事件属性、`foreignObject`、外链脚本 |
| 连线模式 | `connModes[].algorithm` 绑定内置算法 | 自定义远程 JS 算法 |
| 字体 | `fonts[].url` 使用 HTTPS 直链 | HTTP、内联脚本、HTML 页面 |
| 主程序代码 | GitHub Releases 或 Git 拉取 | 内容包远程执行脚本 |

如果需要新增真正的连线算法、渲染逻辑或主程序结构，请发布新的主程序版本，并让用户通过 GitHub Release 或 `update-diagramweave.bat` 更新。

# 外部流程模板目录

将 `.json` 模板放在此目录，并在 `index.json` 中登记文件名。

模板会在工具栏「流程模板」中显示；用户点击后生成可继续拖动、改字、改端口、改连线的普通图形。

建议字段：

- `name` / `description`：中文名称与说明。
- `nameEn` / `descriptionEn`：英文界面显示的名称与说明。
- `preserveLayout: true`：按模板中的 `x`、`y`、`w`、`h` 原样落图。
- `connections[].fromPort` / `connections[].toPort`：只使用 `top`、`bottom`、`left`、`right` 四个连接点。
- `type: "swimlane"` 或 `"swimlane-v"`：启用泳道背景。

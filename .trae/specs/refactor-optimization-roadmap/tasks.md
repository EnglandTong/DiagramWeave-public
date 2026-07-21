# DiagramWeave-Public 重构与优化路线图 - 实现计划

## 短期行动（立即执行）

### [x] Task 1: 创建 diagramweave-result.js 统一结果工厂模块
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 创建 `diagramweave-result.js`，提供 `createResult()`、`createSuccess()`、`createError()`、`createWarning()` 等标准函数
  - 使用 IIFE 模式，挂载到 `global.DiagramWeaveResult`
  - 在 `flowchart-editor.html` 中添加 script 标签
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: lint 检查通过，无错误
  - `programmatic` TR-1.2: typecheck 检查通过
  - `programmatic` TR-1.3: 运行现有测试，确认无回归
- **Notes**: 需要在 7 个模块中替换 21+ 处重复的错误返回模式

### [x] Task 2: 创建 diagramweave-utils.js 公共工具模块
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 创建 `diagramweave-utils.js`，提取并统一 `normalize`、`clone`、`compareVersions` 等工具函数
  - 使用 IIFE 模式，挂载到 `global.DiagramWeaveUtils`
  - 在 `flowchart-editor.html` 中添加 script 标签
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: lint 检查通过，无错误
  - `programmatic` TR-2.2: typecheck 检查通过
  - `programmatic` TR-2.3: 运行现有测试，确认无回归
- **Notes**: 需要检查各模块中的工具函数实现，确保语义一致

### [x] Task 3: 替换 7 个模块中的错误返回模式为结果工厂
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 在 `diagramweave-stencil-manager.js`、`diagramweave-commands.js`、`diagramweave-import-preview.js`、`diagramweave-visio-bridge.js`、`diagramweave-contracts.js`、`diagramweave-external-importers.js`、`diagramweave-extension-kernel.js` 中替换 21+ 处重复的错误返回模式
  - 使用 `DiagramWeaveResult.createError()` 和 `DiagramWeaveResult.createSuccess()` 替代
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-3.1: lint 检查通过，无错误
  - `programmatic` TR-3.2: typecheck 检查通过
  - `programmatic` TR-3.3: 运行所有测试，确认无回归
- **Notes**: 需要保持返回结构一致，避免破坏现有调用方

### [x] Task 4: 替换各模块中的重复工具函数为公共工具模块
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 在 `diagramweave-shape-library.js`、`diagramweave-stencil-manager.js`、`diagramweave-bootstrap.js`、`diagramweave-history.js`、`diagramweave-contracts.js` 等模块中替换重复实现的工具函数
  - 使用 `DiagramWeaveUtils.normalize()`、`DiagramWeaveUtils.clone()`、`DiagramWeaveUtils.compareVersions()` 替代
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-4.1: lint 检查通过，无错误
  - `programmatic` TR-4.2: typecheck 检查通过
  - `programmatic` TR-4.3: 运行所有测试，确认无回归
- **Notes**: 需要确保工具函数的语义与原有实现一致

### [x] Task 5: 完善 Visio 桥接器 stub 实现（已确认完整实现）
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 实现基本的 VSDX 形状和连接器导入功能
  - 支持从 VSDX 文件中解析形状数据（位置、尺寸、样式）
  - 支持从 VSDX 文件中解析连接器数据（起点、终点、路由）
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-5.1: lint 检查通过，无错误
  - `programmatic` TR-5.2: typecheck 检查通过
  - `programmatic` TR-5.3: 运行 Visio 相关测试，确认功能正常
- **Notes**: 参考现有 stub 实现，扩展解析逻辑

## 中期规划（1-2周）

### [x] Task 6: 拆分 diagramweave-external-importers.js 为独立导入器
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 创建 `importer-mermaid.js`，提取 Mermaid 导入逻辑
  - 创建 `importer-bpmn.js`，提取 BPMN 导入逻辑
  - 主模块作为聚合入口，通过扩展内核统一注册
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-6.1: lint 检查通过，无错误
  - `programmatic` TR-6.2: typecheck 检查通过
  - `programmatic` TR-6.3: 运行导入相关测试，确认无回归
- **Notes**: 需要保持现有 API 兼容性

### [x] Task 7: 统一 SVG 清理策略
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 分析 `diagramweave-content-pack.js` 和 `flowchart-sanitize.js` 中的 SVG 清理逻辑
  - 创建统一的 SVG 清理接口
  - 消除重复实现
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-7.1: lint 检查通过，无错误
  - `programmatic` TR-7.2: typecheck 检查通过
  - `programmatic` TR-7.3: 运行 SVG 相关测试，确认无回归
- **Notes**: 需要确保清理逻辑的语义一致性

### [x] Task 8: 拆分 diagramweave-content-pack.js（已通过 Task 7 完成）
- **Priority**: medium
- **Depends On**: Task 7
- **Description**: 
  - 创建 `svg-sanitizer.js`，提取 SVG 清理逻辑（基于 Task 7 的统一策略）
  - 创建 `content-pack-manager.js`，提取内容包管理逻辑
  - 主模块作为聚合入口，保持向后兼容
- **Acceptance Criteria Addressed**: AC-4, AC-5
- **Test Requirements**:
  - `programmatic` TR-8.1: lint 检查通过，无错误
  - `programmatic` TR-8.2: typecheck 检查通过
  - `programmatic` TR-8.3: 运行内容包相关测试，确认无回归
- **Notes**: 需要在 `flowchart-editor.html` 中添加新模块的 script 标签

### [x] Task 9: 拆分 diagramweave-visio-bridge.js
- **Priority**: medium
- **Depends On**: Task 5
- **Description**: 
  - 创建 `vsdx-parser.js`，提取 VSDX 解析逻辑
  - 创建 `vsdx-packager.js`，提取 VSDX 打包逻辑
  - 创建 `vsdx-geometry.js`，提取几何计算逻辑
  - 创建 `vsdx-connectors.js`，提取连接器处理逻辑
  - 主模块作为聚合入口，保持向后兼容
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-9.1: lint 检查通过，无错误
  - `programmatic` TR-9.2: typecheck 检查通过
  - `programmatic` TR-9.3: 运行 Visio 相关测试，确认无回归
- **Notes**: 需要在 `flowchart-editor.html` 中添加新模块的 script 标签

## 长期建议（1-2月）

### [x] Task 10: i18n 架构升级 - 分离翻译数据
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 创建 `i18n/zh-CN.json` 和 `i18n/en.json`，提取翻译数据
  - 修改 `diagramweave-i18n.js`，从 JSON 文件加载翻译数据
  - 支持翻译文件的异步加载
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-10.1: lint 检查通过，无错误
  - `programmatic` TR-10.2: typecheck 检查通过
  - `human-judgment` TR-10.3: 检查翻译功能正常，无回归
- **Notes**: 需要确保翻译加载的性能和可靠性

### [x] Task 11: i18n 架构升级 - 支持热更新
- **Priority**: low
- **Depends On**: Task 10
- **Description**: 
  - 实现翻译文件的热更新机制
  - 支持在运行时重新加载翻译文件
  - 更新页面上的翻译内容
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-11.1: lint 检查通过，无错误
  - `human-judgment` TR-11.2: 检查热更新功能正常
- **Notes**: 需要处理热更新时的状态管理

### [x] Task 12: flowchart-editor.js 拆分 - 画布渲染模块
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 创建 `editor/canvas-renderer.js`，提取画布渲染逻辑
  - 使用 IIFE 模式，挂载到 `global.DiagramWeaveEditorCanvas`
  - 在 `flowchart-editor.js` 中添加 typeof 委托
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-12.1: lint 检查通过，无错误
  - `programmatic` TR-12.2: typecheck 检查通过
  - `programmatic` TR-12.3: 运行画布相关测试，确认无回归
- **Notes**: 需要在 `flowchart-editor.html` 中添加新模块的 script 标签

### [x] Task 13: flowchart-editor.js 拆分 - 属性面板模块
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 创建 `editor/property-panel.js`，提取属性面板逻辑
  - 使用 IIFE 模式，挂载到 `global.DiagramWeaveEditorProperty`
  - 在 `flowchart-editor.js` 中添加 typeof 委托
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-13.1: lint 检查通过，无错误
  - `programmatic` TR-13.2: typecheck 检查通过
  - `programmatic` TR-13.3: 运行属性相关测试，确认无回归
- **Notes**: 需要在 `flowchart-editor.html` 中添加新模块的 script 标签

### [x] Task 14: flowchart-editor.js 拆分 - 命令系统模块
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 创建 `editor/command-system.js`，提取命令系统逻辑
  - 使用 IIFE 模式，挂载到 `global.DiagramWeaveEditorCommand`
  - 在 `flowchart-editor.js` 中添加 typeof 委托
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-14.1: lint 检查通过，无错误
  - `programmatic` TR-14.2: typecheck 检查通过
  - `programmatic` TR-14.3: 运行命令相关测试，确认无回归
- **Notes**: 需要在 `flowchart-editor.html` 中添加新模块的 script 标签

### [x] Task 15: 构建优化 - 引入 esbuild
- **Priority**: low
- **Depends On**: None
- **Description**: 
  - 安装 Rollup/Vite 构建工具
  - 配置构建脚本，实现树摇优化和代码分割
  - 更新 `package.json` 中的 build 脚本
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `programmatic` TR-15.1: 构建成功，无错误
  - `programmatic` TR-15.2: 生产包体积减少至少 20%
- **Notes**: 需要选择合适的构建工具，考虑项目规模和复杂度

### [x] Task 16: ESLint 规则配置 - 代码异味检测
- **Priority**: low
- **Depends On**: None
- **Description**: 
  - 配置 ESLint 规则，自动检测重复代码和过长函数
  - 添加 `max-lines`、`max-lines-per-function`、`complexity` 等规则
  - 设置合理的阈值
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `programmatic` TR-16.1: lint 检查通过，规则生效
  - `human-judgment` TR-16.2: 检查规则配置合理，不影响正常开发
- **Notes**: 需要平衡规则严格性和开发效率
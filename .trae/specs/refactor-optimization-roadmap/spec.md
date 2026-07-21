# DiagramWeave-Public 重构与优化路线图 - Product Requirement Document

## Overview
- **Summary**: 对 DiagramWeave-Public 项目进行全面的代码质量重构与架构优化，包括消除代码异味、拆分过重模块、整合重复功能、升级架构设计，以提升系统的可维护性、扩展性和开发效率。
- **Purpose**: 解决当前系统存在的技术债务，包括巨型单体文件、重复代码、上帝模块、全局命名空间依赖等问题，为后续功能开发奠定坚实基础。
- **Target Users**: 开发团队、架构师、维护人员

## Goals
- 消除 P0 级阻塞问题，完善 Visio 桥接器的 stub 实现
- 创建统一的结果工厂模块，消除 21+ 处错误返回模式重复
- 提取公共工具函数，消除重复实现
- 拆分过重模块，降低模块间耦合度
- 统一 SVG 清理策略，提升代码复用率
- 升级 i18n 架构，支持翻译文件热更新
- 引入构建工具，实现代码优化和分割
- 配置 ESLint 规则，自动检测代码异味

## Non-Goals (Out of Scope)
- 不改变现有功能的业务逻辑和行为
- 不引入新的第三方库（除非是构建工具）
- 不修改 archive/ 目录下的归档文件
- 不进行大规模的 UI 重构
- 不改变数据库结构或存储机制

## Background & Context
- 当前系统存在多个过重模块：`flowchart-editor.js` (7499行)、`diagramweave-visio-bridge.js` (21KB)、`diagramweave-i18n.js` (29KB)
- 错误返回模式 `{success, data, issues, warnings}` 在 7 个模块中重复出现 21+ 次
- 多个模块重复实现相同的工具函数（normalize、clone、compareVersions）
- 全局命名空间依赖严重，缺乏统一的模块管理机制
- SVG 清理逻辑分散在多个文件中，存在重复实现

## Functional Requirements

### FR-1: 创建统一结果工厂模块
- 创建 `diagramweave-result.js`，提供标准的结果创建函数
- 支持 `createResult()`、`createSuccess()`、`createError()`、`createWarning()` 等函数
- 替换 7 个模块中 21+ 处重复的错误返回模式

### FR-2: 创建公共工具模块
- 创建 `diagramweave-utils.js`，提取并统一 `normalize`、`clone`、`compareVersions` 等工具函数
- 替换各模块中的重复实现

### FR-3: 完善 Visio 桥接器 stub 实现
- 实现基本的 VSDX 形状和连接器导入功能
- 支持 VSDX 文件的解析和转换

### FR-4: 拆分 diagramweave-visio-bridge.js
- 拆分为 `vsdx-parser.js`、`vsdx-packager.js`、`vsdx-geometry.js`、`vsdx-connectors.js` 四个专注模块
- 主模块作为聚合入口，保持向后兼容

### FR-5: 拆分 diagramweave-external-importers.js
- 拆分为 `importer-mermaid.js` 和 `importer-bpmn.js`
- 通过扩展内核统一注册和管理

### FR-6: 拆分 diagramweave-content-pack.js
- 拆分为 `svg-sanitizer.js` 和 `content-pack-manager.js`
- 统一 SVG 清理策略

### FR-7: 统一 SVG 清理策略
- 合并 `diagramweave-content-pack.js` 和 `flowchart-sanitize.js` 中的清理逻辑
- 创建统一的 SVG 清理接口

### FR-8: i18n 架构升级
- 将翻译数据从 `diagramweave-i18n.js` 分离到 `i18n/zh-CN.json` 和 `i18n/en.json`
- 支持翻译文件的热更新

### FR-9: flowchart-editor.js 拆分
- 按功能域逐步拆分巨型单体
- 优先拆分画布渲染、属性面板、命令系统等独立功能域
- 采用 IIFE 命名空间模式，保持向后兼容性

### FR-10: 构建优化
- 引入 Rollup/Vite 构建工具
- 实现树摇优化和代码分割
- 配置 ESLint 规则

## Non-Functional Requirements

### NFR-1: 向后兼容性
- 所有重构必须保持现有 API 兼容性
- 不破坏现有功能和测试

### NFR-2: 性能优化
- 构建优化后，生产包体积减少至少 20%
- 首屏加载时间减少至少 15%

### NFR-3: 可维护性
- 单个模块代码行数不超过 500 行（特殊模块除外）
- 函数圈复杂度不超过 10
- 代码重复率降低 30%

### NFR-4: 测试覆盖率
- 新增模块测试覆盖率达到 80% 以上
- 整体测试覆盖率不低于当前水平

## Constraints

### Technical
- 使用原生 JavaScript (ES6+)，不引入框架
- 保持 IIFE 命名空间模式以兼容现有架构
- 必须通过所有现有测试（lint、typecheck、test）

### Business
- 分阶段实施，优先解决阻塞问题和明显代码异味
- 每次重构后必须通过完整的 gate 验证

### Dependencies
- 现有测试框架（Vitest）
- 现有构建工具（npm/pnpm）

## Assumptions
- 现有代码结构和命名约定保持不变
- 所有模块通过全局命名空间 `global.DiagramWeaveXxx` 暴露接口
- 测试框架和工具链保持稳定

## Acceptance Criteria

### AC-1: 统一结果工厂模块
- **Given**: 系统中有 7 个模块使用重复的错误返回模式
- **When**: 创建 `diagramweave-result.js` 并替换所有重复实现
- **Then**: 所有模块使用统一的结果工厂函数，代码重复率降低
- **Verification**: `programmatic` - 运行 lint 和 test，确认无错误

### AC-2: 公共工具模块
- **Given**: 多个模块重复实现 `normalize`、`clone`、`compareVersions`
- **When**: 创建 `diagramweave-utils.js` 并提取公共函数
- **Then**: 所有模块使用统一的工具函数，消除重复代码
- **Verification**: `programmatic` - 运行 lint 和 test，确认无错误

### AC-3: Visio 桥接器 stub 完善
- **Given**: Visio 桥接器当前为 stub 实现
- **When**: 实现基本的 VSDX 形状和连接器导入功能
- **Then**: 能够解析和导入 VSDX 文件中的形状和连接器
- **Verification**: `programmatic` - 运行相关测试，确认功能正常

### AC-4: 过重模块拆分
- **Given**: `diagramweave-visio-bridge.js`、`diagramweave-external-importers.js`、`diagramweave-content-pack.js` 为过重模块
- **When**: 按计划拆分为专注模块
- **Then**: 每个模块职责单一，代码行数减少，耦合度降低
- **Verification**: `programmatic` - 运行 lint 和 test，确认无错误

### AC-5: SVG 清理策略统一
- **Given**: SVG 清理逻辑分散在多个文件中
- **When**: 合并清理逻辑到统一模块
- **Then**: SVG 清理逻辑统一，消除重复实现
- **Verification**: `programmatic` - 运行 lint 和 test，确认无错误

### AC-6: i18n 架构升级
- **Given**: 翻译数据与 i18n 逻辑混合在同一文件
- **When**: 将翻译数据分离到独立 JSON 文件
- **Then**: 翻译数据可独立维护，支持热更新
- **Verification**: `human-judgment` - 检查代码结构和功能

### AC-7: flowchart-editor.js 拆分
- **Given**: `flowchart-editor.js` 为 7499 行巨型单体
- **When**: 按功能域逐步拆分
- **Then**: 拆分后的模块职责清晰，易于维护
- **Verification**: `human-judgment` - 检查代码结构和模块划分

### AC-8: 构建优化
- **Given**: 当前无构建工具优化
- **When**: 引入 Rollup/Vite 构建工具
- **Then**: 生产包体积减少，首屏加载时间降低
- **Verification**: `programmatic` - 构建产物分析，确认优化效果

## Open Questions
- [ ] 是否需要引入 TypeScript 支持？
- [ ] 构建工具选择 Rollup 还是 Vite？
- [ ] i18n 热更新的具体实现方式？
- [ ] flowchart-editor.js 拆分的具体功能域划分？
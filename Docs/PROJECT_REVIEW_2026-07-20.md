# Project Progress, Risk, and Action Plan Review

Date: 2026-07-20
Reviewer: Senior Architect + Security Auditor + Controller/QA (AI Agent)
Scope Reviewed: All governance docs (TARGET, CMS, ACCEPTANCE, STATUS, NEXT_ACTIONS, STOP_RULES, LOOP_CONFIG, PENDING, COMPLETED, EVALUATION, LOOP_STATE, LOOP_LOG, AUDIT_2026-07-20, QA_2026-07-16, MINIAPP_HUB_ALIGNMENT, UI_AUDIT_AND_ROADMAP), all 20 work orders, core-server/src/server.mjs, flowchart-editor.js (8209 lines), diagramweave-visio-bridge.js (274 lines), flowchart-sanitize.js (271 lines), diagramweave-contracts.js (136 lines), diagramweave-external-importers.js (46 lines), diagramweave-history.js (61 lines), package.json, test suite (121 tests, 27 files).

---

## 1. Executive Summary

DiagramWeave-Public 是一个单机 Web 流程图编辑器，正在通过 CMS / Agent Loop Engineering 模型进行大规模升级。当前升级队列包含 **16 个工单**，覆盖 P0 扩展内核 → P1 导入预览/映射/编辑器体验 → P2 模板/模板库/连接规则/版本历史/离线查看器/评审/Mermaid+BPMN/AI/Schema → P3 版本历史 → P4 Visio 桥接 → QA 加固。

**结论：P0-P2 升级范围内的所有工单已被 QA 接受。17 项验收标准中 16 项通过，1 项（AC-DW-010）以残余风险形式被接受。循环状态为 Idle。**

但存在以下需要关注的问题：
- `xlsx` 依赖已停止维护，存在已知安全漏洞（原型污染 + ReDoS）
- `NEXT_ACTIONS.md` 文件内容重复（第 1-27 行与第 28-45 行重复）
- `flowchart-editor.js` 8209 行单文件，架构风险持续存在
- 部分 innerHTML 使用依赖外部 SVG 内容（stencil pack），存在潜在 XSS 面
- 无真实浏览器 e2e 验证（Playwright 超时问题未解决）
- AC-DW-010 的 VSDX 兼容性未在实际 Visio/LibreOffice 中验证

---

## 2. Original Target and Boundary

### Core Target（来源：TARGET.md）
将 DiagramWeave 升级为可扩展的工作流图平台，支持：
- 真实 Visio `.vsdx/.vsd` 导入/导出（通过独立兼容层）
- 导入预览 + 行级错误报告
- 用户控制的 Excel/JSON 映射
- 模板中心（分类、搜索、收藏、可编辑 Fishbone/Swimlane）
- 模板管理器（自定义图标和行业形状包）
- 连接规则面板（端点锁定、障碍填充、桥接、手动路径点、标签放置）
- 版本历史和回滚

### Non-Goals
- 不通过将 DiagramWeave JSON 保存为 Visio 扩展来伪造 Visio 支持
- 不让导入逻辑在用户确认前静默重构图表
- 不引入系统级安装或未经 Owner 批准的秘密访问
- 不重写整个 UI 栈（除非工单明确要求）

### 关键架构方向
- 扩展内核作为所有功能边界的注册中心
- `.vso` 保持为 DiagramWeave 工作档案
- 单机运行，不依赖远程服务
- MiniApp Hub 兼容的子系统形状（additive）

---

## 3. Current Project Status

| 维度 | 状态 |
|------|------|
| 工单总数 | 16 + 3 QA 加固 = 19（含 QA-001~004 修复） |
| 已接受 | 16 个主工单 + 3 个 QA 加固工单 |
| 验收标准 | 17/17 已处理（16 pass + 1 accepted with risk） |
| 自动化测试 | 121 tests passed, 27 files |
| Typecheck | Passed |
| 循环状态 | Idle |
| 阻塞项 | AC-DW-010 完整 Visio 兼容性（需 Owner 决策） |

---

## 4. Milestone Inventory

| Milestone | 原计划目标 | 实际交付 | QA 状态 | 风险 | 剩余缺口 |
|-----------|----------|---------|---------|------|---------|
| DW-P0-01 扩展内核 | 元数据注册、8 种内置扩展、验证 | 已实现，测试通过 | Accepted | 低 | 无 |
| DW-P1-01 导入预览 | 预览先行，行级错误 | `createImportPreview` + UI | Accepted | 低 | 无 |
| DW-P1-02 映射向导 | Excel/JSON 字段映射 | `mappingWizardOverlay` + e2e | Accepted | 低 | 无 |
| DW-P1-03~06 编辑器体验 | 画布工具/形状库/属性/响应式 | 已实现 | Accepted | 中 | 键盘操作、焦点陷阱在初始 QA 中失败，后续修复证据不完整 |
| DW-P2-01 模板中心 | 分类/搜索/收藏/可编辑 | 已实现 + e2e | Accepted | 低 | 无 |
| DW-P2-02 模板管理器 | 导入/列出/启用禁用/导出 | 已实现 + e2e | Accepted | 低 | 无 |
| DW-P2-03 连接规则面板 | 端点锁定/障碍/桥接/路径点/标签 | 已实现 + e2e | Accepted | 低 | 无 |
| DW-P3-01 版本历史 | IndexedDB 存储，回滚无损坏 | 已实现 + e2e | Accepted | 低 | 无 |
| DW-P4-01 Visio 桥接 R1 | 受控子集 .vso 保持 DW 档案 | 已实现 | Accepted with Risk | 中 | 无独立 OPC 验证器 |
| DW-P4-01-R2 VSDX 兼容层 | 完整 Geometry/Connection/Connect | 已实现，15 测试 | Accepted with Risk | **高** | 无真实 Visio/LibreOffice 验证 |
| DW-P2-04~09 分析/查看器/评审/导入/AI | 各功能完整实现 | 已实现 + 测试 | Accepted | 低 | 无 |
| DW-QA-03 发布加固 | 档案安全限制 | 已实现 | Accepted | 低 | 无 |

---

## 5. Most Important Completed Work

### A. Core Completed（真正支撑项目目标的核心能力）

1. **扩展内核**（DW-P0-01）：所有功能边界的注册和验证中心
2. **导入预览 + 行级错误**（DW-P1-01）：用户确认前的安全导入
3. **Excel/JSON 映射向导**（DW-P1-02）：用户控制字段映射
4. **模板中心**（DW-P2-01）：分类/搜索/收藏/可编辑生成
5. **模板管理器**（DW-P2-02）：自定义形状包管理
6. **连接规则面板**（DW-P2-03）：完整的连线控制
7. **版本历史**（DW-P3-01）：IndexedDB 快照 + 回滚
8. **VSDX 兼容层**（DW-P4-01-R2）：OPC 包结构、Geometry、Connection、Connect、StyleSheet

### B. Supporting Completed（支撑性功能）

1. **流程质量检查**（DW-P2-04）：确定性、双语、可导航
2. **流程分析**（DW-P2-05）：关键路径、可达性、瓶颈
3. **离线查看器**（DW-P2-06）：独立 HTML，无编辑能力
4. **评审系统**（DW-P2-07）：评论线程、四状态、安全渲染
5. **Mermaid/BPMN 导入**（DW-P2-08）：官方解析器 + 预览
6. **AI/Schema 完成**（DW-P2-09）：AI 默认禁用 + schema v3 迁移
7. **发布加固**（DW-QA-03）：档案安全限制
8. **MiniApp Hub 对齐**：Hub 服务器、manifest、API 端点

### C. Completed With Risk（已完成但存在风险）

1. **AC-DW-010 VSDX 完整兼容性**：
   - 证据：15 个单元测试验证 OPC 包结构
   - 风险：未在任何真实 Visio 或 LibreOffice 环境中验证
   - 残余风险：生成的 VSDX 可能无法被 Microsoft Visio 正确打开

2. **P1 编辑器体验（DW-P1-03~06）**：
   - 初始 QA（2026-07-16）明确记录了键盘操作和焦点陷阱失败
   - 后续工单标记为 Accepted，但缺少针对 QA-002/QA-003 的独立重新验证证据
   - 风险：可访问性问题可能仍然存在

3. **Playwright e2e 覆盖**：
   - 14 个 e2e 测试通过（QA 文件记录）
   - 但 `MINIAPP_HUB_ALIGNMENT.md` 注明 "browser e2e command currently reaches all four smoke tests but does not exit within the tool timeout"
   - 当前测试运行使用 `vm.runInNewContext` 沙盒模式，非真实浏览器

---

## 6. Completed With Risk（详细说明）

| 项目 | 风险描述 | 影响 | 缓解建议 |
|------|---------|------|---------|
| AC-DW-010 | 无真实 Visio 验证 | 导出的 .vsdx 可能无法打开 | 需要 Owner 提供 Visio 环境或批准依赖 |
| P1 键盘/焦点 | QA-002/003 初始失败后无独立重验 | 可访问性不达标 | 补充 Playwright 键盘测试 |
| xlsx 依赖 | 已停止维护，存在 CVE | 原型污染 + ReDoS | 迁移到 SheetJS CE 或 ExcelJS |
| 单文件架构 | flowchart-editor.js 8209 行 | 维护性差，变更风险高 | 长期拆分计划 |
| Playwright 超时 | e2e 无法在工具超时内完成 | 浏览器验证不完整 | 修复 teardown 或分离测试环境 |

---

## 7. Not Completed / Still Open

| 项目 | 状态 | 阻塞原因 |
|------|------|---------|
| AC-DW-010 完整 Visio 运行时验证 | Deferred → Accepted with Risk | 无浏览器兼容 OPC 验证器，无真实 fixtures |
| `.vsd` 二进制支持决策 | Pending | 需 Owner 决定是否必须原生支持 |
| 模板/模板包远程分发 | Pending | 需 Owner 决定纯本地还是支持远程签名包 |
| 父级 VisualProjectManagement launcher 集成 | Not started | 依赖根 `core-server` 存在 |
| `flowchart-editor.js` 拆分 | 已知风险 | 需小心处理，PENDING.md 已记录 |

---

## 8. Code, Security, Logic, Performance, and Architecture Findings

### 8.1 Security

#### [P1] SEC-01: `xlsx` 依赖存在已知安全漏洞
- **文件**：`package.json` line 32
- **证据**：`xlsx@0.18.5` 存在 GHSA-4r6h-8v6p-xvw6（原型污染，High）和 GHSA-5pgg-2g8v-p4x9（ReDoS，High）。npm 官方已标记 "No fix available"。库已停止维护。
- **影响**：用户导入恶意 Excel 文件可能导致原型污染或 CPU 耗尽
- **根因**：依赖选择了已废弃的库
- **修复方向**：迁移到 `xlsx@https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`（官方 CE 版本）或 `exceljs`
- **需要人工确认**：是，涉及依赖替换

#### [P2] SEC-02: Stencil pack SVG 直接注入 innerHTML
- **文件**：`flowchart-editor.js` line 1786
- **代码**：`el.innerHTML = \`${entry.svg}<span ...>${escapeHtml(entry.label)}</span>\``
- **证据**：`entry.svg` 来自 stencil pack，未经 HTML 转义直接注入。如果用户导入包含恶意 SVG 的 stencil pack，可能执行脚本。
- **缓解因素**：stencil pack 通过 `DiagramWeaveContent.validatePack` 验证，但验证是否覆盖 SVG 内容中的 `<script>` 标签或事件处理器未确认。
- **修复方向**：对 `entry.svg` 进行 DOMPurify 清理或限制为安全的 SVG 子集

#### [P2] SEC-03: JSON.parse 未包裹 try/catch（File System Access API 路径）
- **文件**：`flowchart-editor.js` line 5979
- **代码**：`const raw = isExcel ? null : JSON.parse(await file.text());`
- **证据**：如果用户打开一个损坏的 JSON 文件，此处会抛出未捕获的异常，可能导致 UI 状态不一致。
- **对比**：line 6245 的 FileReader 路径有 try/catch 保护
- **修复方向**：添加 try/catch 并显示用户友好的错误提示

#### [P3] SEC-04: 服务器错误消息泄露内部信息
- **文件**：`core-server/src/server.mjs` line 70
- **代码**：`error: error instanceof Error ? error.message : 'Unknown server error'`
- **证据**：内部错误消息直接返回给客户端，可能泄露文件系统路径或内部状态
- **影响**：低风险（单机本地服务），但不符合安全编码最佳实践

#### [P3] SEC-05: 服务器无请求速率限制
- **文件**：`core-server/src/server.mjs`
- **证据**：HTTP 服务器无任何速率限制。虽然是单机本地服务，但如果端口暴露，可能被滥用
- **影响**：低（单机场景）

### 8.2 Clutter & Dead Code

#### [P2] CLUTTER-01: `NEXT_ACTIONS.md` 内容重复
- **文件**：`Docs/NEXT_ACTIONS.md`
- **证据**：Lines 1-27 与 lines 28-45 内容几乎完全重复。第 28 行开始重复了 "## Next Actions" 标题和第 1-6 条内容，且缺少第 7 条的 "Completed" 标记和 "## Current State" / "## Blocked Items" 段落。
- **影响**：治理文件混乱，可能导致后续 Agent 读取错误状态

#### [P3] CLUTTER-02: `AUDIT_2026-07-20_FINAL_P0_P2.md` 中 AC-DW-010 状态与后续更新不一致
- **文件**：`Docs/AUDIT_2026-07-20_FINAL_P0_P2.md` line 27
- **证据**：审计报告标记 AC-DW-010 为 "⏸ Deferred"，但后续 DW-P4-01-R2 已将其升级为 "Accepted with Risk"。审计报告本身未被更新。
- **影响**：读者可能误认为 AC-DW-010 仍然 Deferred

### 8.3 Logic & Robustness

#### [P2] LOGIC-01: VSDX 导入的 connector 检测逻辑依赖 ID 阈值
- **文件**：`diagramweave-visio-bridge.js` line 192
- **代码**：`const isConnector = numId >= 1000 || ...`
- **证据**：导出时连接器 ID 从 1000 开始分配（line 73: `1000 + index`），导入时用 `>= 1000` 判断。如果真实 Visio 文件的连接器 ID < 1000，将被错误识别为普通形状。
- **修复方向**：使用 `Master="2"` 或 `Dynamic Connector` 文本检测作为主要判断依据

#### [P2] LOGIC-02: `sanitizeTextField` 对 `<>` 的过滤不完整
- **文件**：`flowchart-sanitize.js` line 31
- **代码**：`.replace(/[<>]/g, '')`
- **证据**：仅移除 `<` 和 `>`，但不过滤 `&`、`"`、`'`。如果这些值后续被用于 XML/HTML 上下文（如 VSDX 导出），可能导致注入。
- **缓解因素**：VSDX 导出使用了独立的 `esc()` 函数进行 XML 转义（line 10），`escapeHtml()` 用于 HTML 上下文。两层防御。
- **修复方向**：考虑在 sanitize 层统一处理所有 XML/HTML 特殊字符

#### [P3] LOGIC-03: `migrateDocument` 使用 JSON.parse(JSON.stringify()) 深拷贝
- **文件**：`diagramweave-contracts.js` line 9
- **证据**：对于大型文档（5000 节点 + 10000 连接），JSON 序列化/反序列化可能较慢。但这在当前场景中不太可能成为瓶颈。

### 8.4 Performance

#### [P3] PERF-01: `flowchart-editor.js` 单文件 8209 行
- **证据**：所有编辑器逻辑集中在一个文件中。虽然浏览器端无打包需求，但维护性和代码导航困难。
- **影响**：不影响运行时性能，但增加变更引入 bug 的风险

#### [P3] PERF-02: 模板中心每次渲染重建整个 DOM
- **文件**：`flowchart-editor.js` line 543
- **代码**：`grid.innerHTML = ''` 然后重建所有模板卡片
- **证据**：对于大量模板，可能导致不必要的重排。当前模板数量有限，影响可忽略。

### 8.5 Architecture

#### [P2] ARCH-01: 治理文件间状态不一致
- **证据**：
  - `AUDIT_2026-07-20_FINAL_P0_P2.md` 标记 AC-DW-010 为 Deferred
  - `ACCEPTANCE.md` 标记 AC-DW-010 为 Accepted（2026-07-20）
  - `STATUS.md` Final Audit 段落仍说 "16/17 pass, 1 deferred"
  - `NEXT_ACTIONS.md` Blocked Items 表仍列 AC-DW-010 为 blocked
- **影响**：治理文件矛盾会导致后续审计者困惑

#### [P3] ARCH-02: MiniApp Hub 对齐未完成
- **证据**：`MINIAPP_HUB_ALIGNMENT.md` 明确记录了多个未确认项：父级 launcher 未实现、auth/permission 未实现、最终 manifest 位置未定
- **影响**：Hub 兼容层是 additive 的，不影响当前功能，但长期集成路径不清晰

---

## 9. P0 / P1 Execution Plan

### P1-01: `xlsx` 依赖安全漏洞修复

| 维度 | 内容 |
|------|------|
| 风险等级 | P1（High - 已知 CVE，原型污染 + ReDoS） |
| 文件 | `package.json` line 32, 所有使用 `XLSX` 的代码 |
| 证据 | GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9, npm "No fix available" |
| 影响范围 | Excel 导入/导出功能 |
| 修复步骤 | 1. 评估 `xlsx@0.20.3` CE tarball 或 `exceljs` 替代方案<br>2. 更新 package.json<br>3. 调整 API 调用（如有不兼容）<br>4. 运行全量测试<br>5. 手动验证 Excel 导入/导出 |
| 验证方法 | `npm.cmd test` + 手动 Excel 导入/导出 |
| 需要人工确认 | 是（依赖替换决策） |

---

## 10. P2 / P3 Improvement Backlog

| ID | 优先级 | 类别 | 描述 | 文件/模块 |
|----|--------|------|------|----------|
| SEC-02 | P2 | Security | Stencil SVG 未清理直接注入 innerHTML | `flowchart-editor.js:1786` |
| SEC-03 | P2 | Security | JSON.parse 未包裹 try/catch（FS Access 路径） | `flowchart-editor.js:5979` |
| LOGIC-01 | P2 | Logic | VSDX connector 检测依赖 ID>=1000 阈值 | `diagramweave-visio-bridge.js:192` |
| LOGIC-02 | P2 | Logic | sanitizeTextField 不过滤 `&"'` | `flowchart-sanitize.js:31` |
| ARCH-01 | P2 | Arch | 治理文件间 AC-DW-010 状态矛盾 | `Docs/AUDIT_*.md`, `STATUS.md`, `NEXT_ACTIONS.md` |
| CLUTTER-01 | P2 | Clutter | NEXT_ACTIONS.md 内容重复 | `Docs/NEXT_ACTIONS.md` |
| CLUTTER-02 | P3 | Clutter | 审计报告未反映 AC-DW-010 后续解决 | `Docs/AUDIT_2026-07-20_FINAL_P0_P2.md` |
| SEC-04 | P3 | Security | 服务器错误消息泄露内部信息 | `core-server/src/server.mjs:70` |
| SEC-05 | P3 | Security | 无请求速率限制 | `core-server/src/server.mjs` |
| PERF-01 | P3 | Perf | 8209 行单文件 | `flowchart-editor.js` |
| PERF-02 | P3 | Perf | 模板中心全量 DOM 重建 | `flowchart-editor.js:543` |
| — | P3 | Arch | MiniApp Hub 集成未完成 | `MINIAPP_HUB_ALIGNMENT.md` |
| — | P3 | Robustness | P1 键盘/焦点 QA 重验证据不足 | `QA_2026-07-16` QA-002/003 |

---

## 11. Current Stage Finish Line

## Current Stage Finish Line
当前阶段（P0-P2 升级）只有在以下条件满足时才算完成：
1. `NEXT_ACTIONS.md` 的重复内容被清理，Blocked Items 表反映 AC-DW-010 已解决
2. `STATUS.md` Final Audit 段落与 `ACCEPTANCE.md` 一致（17/17 已处理）
3. `AUDIT_2026-07-20_FINAL_P0_P2.md` 添加更新注释说明 AC-DW-010 后续由 DW-P4-01-R2 解决
4. Owner 确认是否接受当前残余风险状态并正式关闭升级队列
5. `xlsx` 依赖替换决策由 Owner 做出（P1 安全问题）

## Not Required For Current Stage
以下内容不属于当前阶段，不应继续扩展：
1. MiniApp Hub 父级 launcher 集成
2. 远程模板/模板包分发
3. `.vsd` 二进制原生支持
4. `flowchart-editor.js` 架构拆分（除非明确为新工单）
5. 生产化部署、权限体系、多用户支持

## Must Stop / Owner Decision Required
以下内容不能由 Developer 自动继续，需要 Owner 或 Controller/QA 确认：
1. **`xlsx` 依赖替换**：涉及 API 兼容性风险，需 Owner 批准替换方案
2. **AC-DW-010 残余风险接受**：需 Owner 确认是否满足或永久放弃完整 Visio 兼容性
3. **`.vsd` 二进制支持决策**：TARGET.md 和 PENDING.md 均标记为需 Owner 决定
4. **升级队列是否正式关闭**：所有工单已接受，需 Owner 确认是否定义新阶段或关闭

---

## 12. Not Required For Current Stage

1. Electron 桌面应用完善（`electron/main.mjs` 存在但未纳入当前验收）
2. 远程内容包同步更新机制
3. 多用户协作或服务器端持久化
4. 第三方 Visio 运行时验证环境搭建（除非 Owner 批准）
5. Playwright e2e 测试环境修复（属于基础设施改进）

---

## 13. Recommended Next Actions

### Quick Wins（本周内可完成、低风险、高收益）

| Order | Priority | Action | Owner | Why It Matters | Expected Output | Acceptance Evidence |
|-------|----------|--------|-------|---------------|-----------------|-------------------|
| 1 | P2 | 修复 NEXT_ACTIONS.md 重复内容 | Developer | 治理文件一致性 | 去除重复段落 | 文件内容无重复 |
| 2 | P2 | 统一 AUDIT/STATUS/ACCEPTANCE 中 AC-DW-010 状态 | Developer | 审计可追溯性 | 添加更新注释 | 三份文件一致 |
| 3 | P2 | 为 flowchart-editor.js:5979 添加 try/catch | Developer | 防止损坏文件导致 UI 异常 | 错误提示 | 测试覆盖 |

### Refactoring / Stabilization（需要数天投入）

| Order | Priority | Action | Owner | Why It Matters | Expected Output | Acceptance Evidence |
|-------|----------|--------|-------|---------------|-----------------|-------------------|
| 4 | P1 | 替换 xlsx 依赖 | Developer + Owner 批准 | 安全漏洞修复 | 更新的 package.json + 通过的测试 | npm test pass + Excel 导入导出验证 |
| 5 | P2 | 对 stencil SVG 输入添加安全清理 | Developer | XSS 防护 | 清理函数 + 测试 | 恶意 SVG 被过滤 |
| 6 | P2 | 修正 VSDX connector 检测逻辑 | Developer | 导入兼容性 | 不依赖 ID 阈值的检测 | 测试覆盖 |
| 7 | P3 | 补充 P1 键盘操作 Playwright 测试 | Developer | 可访问性验证 | 新增测试文件 | e2e 通过 |

### Evolution / Future Version（长期事项）

| Order | Priority | Action | Owner | Why It Matters | Expected Output | Acceptance Evidence |
|-------|----------|--------|-------|---------------|-----------------|-------------------|
| 8 | P3 | flowchart-editor.js 模块化拆分 | Developer | 维护性 | 多个独立模块文件 | 全量测试通过 |
| 9 | P3 | MiniApp Hub 父级集成 | Developer + Owner | 系统整合 | launcher 对接 | 端到端启动验证 |
| 10 | P3 | 真实 Visio 环境验证 | Owner | AC-DW-010 完全验证 | Visio 打开 VSDX 验证 | 截图/录屏证据 |

---

## 14. Owner / Human Confirmation Checklist

| Item | Uncertainty | Why It Matters | Human / Owner Decision Needed |
|------|------------|----------------|------------------------------|
| xlsx 依赖替换 | 替代库 API 兼容性 | 当前库有已知 High CVE，但替换可能影响 Excel 功能 | 批准替换方案（SheetJS CE / ExcelJS / 其他） |
| AC-DW-010 残余风险 | 无真实 Visio 验证 | 导出的 VSDX 可能无法在 Microsoft Visio 中正确打开 | 接受风险 or 提供 Visio 环境 |
| .vsd 二进制支持 | 未决定 | TARGET.md 列为 Human Decision | 决定是否必须原生支持 .vsd |
| 远程模板/包分发 | 未决定 | PENDING.md 列为 Product Decision | 决定纯本地 or 支持远程签名包 |
| 升级队列关闭 | 所有工单已接受 | 需正式确认阶段结束 | 确认关闭 or 定义新阶段 |
| P1 键盘/焦点修复证据 | QA-002/003 初始失败后无独立重验 | 可访问性合规风险 | 是否需要补充验证 |

---

## 15. Developer Brief

**当前状态**：P0-P2 升级范围内所有工单已接受。循环 Idle。

**需要立即处理**：
1. 治理文件一致性修复（NEXT_ACTIONS.md 重复、AC-DW-010 状态同步）— 低风险，纯文档修改
2. `xlsx` 安全漏洞 — 需 Owner 批准后执行

**不建议继续**：
- 不要在没有 Owner 批准的情况下开始新的功能工单
- 不要尝试替换 Visio 依赖（已批准的方案已实施）
- 不要进行 `flowchart-editor.js` 大规模重构（风险高，无当前工单要求）

**代码质量总体评估**：
- 输入验证：良好（sanitize 层完善，有范围限制）
- XSS 防护：大部分良好（escapeHtml 一致使用），stencil SVG 是唯一缺口
- 错误处理：基本完善（catch 覆盖大多数路径，5979 是例外）
- 测试覆盖：良好（121 单元测试 + 14 e2e，但 e2e 环境有限制）
- 架构：模块化拆分良好（20+ 独立 JS 文件），但主编辑器文件过大

---

## 16. Appendix: Evidence and Missing Files

### 已读取并审查的文件

| 文件 | 行数 | 状态 |
|------|------|------|
| Docs/TARGET.md | 50 | ✅ 存在 |
| Docs/CMS.md | 92 | ✅ 存在 |
| Docs/ACCEPTANCE.md | 43 | ✅ 存在 |
| Docs/STATUS.md | 55 | ✅ 存在 |
| Docs/NEXT_ACTIONS.md | 45 | ✅ 存在（内容重复） |
| Docs/STOP_RULES.md | 15 | ✅ 存在 |
| Docs/LOOP_CONFIG.md | 26 | ✅ 存在 |
| Docs/PENDING.md | 14 | ✅ 存在 |
| Docs/COMPLETED.md | 20 | ✅ 存在 |
| Docs/EVALUATION.md | 21 | ✅ 存在 |
| Docs/LOOP_STATE.md | 40 | ✅ 存在 |
| Docs/LOOP_LOG.jsonl | 6 | ✅ 存在 |
| Docs/AUDIT_2026-07-20_FINAL_P0_P2.md | 52 | ✅ 存在 |
| Docs/QA_2026-07-16_P0_P2_ACCEPTANCE.md | 85 | ✅ 存在 |
| Docs/MINIAPP_HUB_ALIGNMENT.md | 74 | ✅ 存在 |
| Docs/UI_AUDIT_AND_ROADMAP_2026-07-15.md | — | 存在（未详细审查） |
| 20 个 WORK_ORDER_*.md | — | ✅ 存在 |
| core-server/src/server.mjs | 226 | ✅ 已审查 |
| flowchart-editor.js | 8209 | ✅ 关键路径已审查 |
| diagramweave-visio-bridge.js | 274 | ✅ 全文审查 |
| flowchart-sanitize.js | 271 | ✅ 全文审查 |
| diagramweave-contracts.js | 136 | ✅ 部分审查 |
| diagramweave-external-importers.js | 46 | ✅ 全文审查 |
| diagramweave-history.js | 61 | ✅ 部分审查 |
| package.json | 42 | ✅ 全文审查 |

### 缺失文件

| 文件 | 影响 |
|------|------|
| Docs/ROLE_ASSIGNMENT.md | 不存在。角色分配在 CMS.md 中定义，影响低。 |
| Docs/CURRENT_ROLE_INSTRUCTIONS.md | 不存在。当前为单 Agent 模式，影响低。 |
| Docs/LOOP_RUNS.jsonl | 不存在。LOOP_LOG.jsonl 作为替代，影响低。 |
| Docs/MILESTONE_M*.md | 不存在。Milestone 信息分散在 WORK_ORDER 和 STATUS 中。 |
| Docs/M*_PROGRAM_*.md | 不存在。无正式 Program 定义文件。 |
| Docs/DISPATCH_*_DEVELOPER.md | 不存在。Dispatch 通过 NEXT_ACTIONS + 工单完成。 |
| Docs/HANDOFF_*_DEVELOPER.md | 不存在。Handoff 证据在工单内。 |
| Docs/PROJECT_ROADMAP_REVIEW*.md | 不存在。 |
| Docs/DEVELOPMENT_REVIEW*.md | 不存在。 |

### 验证命令结果

| 命令 | 结果 |
|------|------|
| `npm.cmd run typecheck` | ✅ syntax check passed |
| `npm.cmd test` | ✅ 27 files, 121 tests passed |
| `npm.cmd run test:e2e` | ⚠️ 14 tests passed（据 QA 文件记录），但当前环境有超时问题 |

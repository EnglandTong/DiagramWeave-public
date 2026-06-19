Status: Confirmed

# Project Target — DiagramWeave 流程图编辑器

## User Goal

单机 Web/Electron 流程图编辑器：dagre 布局、导出 PDF/XLSX、离线 vendor 资源。

## Success Criteria

- 项目在 `D:\Development\VisualProjectManagement\DiagramWeave-Public` 可构建、可启动、核心业务流程可验证
- Agent Loop 状态文件齐全且可通过 agent-loop-check.ps1（Done 前使用 -Strict）
- 灾难恢复后 SQLite/uploads 完整或迁移路径已文档化

## Non-Goals

- 不改为云端协作多用户版本
- 不合并 company-gantt 代码库

## Current Scope

Small

## Stack & Paths

- **Canonical path:** `D:\Development\VisualProjectManagement\DiagramWeave-Public`
- **Recover reference:** `D:\Recover\Visual`
- **Stack:** Vite + Electron + dagre + jspdf + xlsx

## Human Decisions Required

- D 盘删除事件后是否轮换已泄露密钥（Recover 中曾出现 API key 片段）
- MyWork / ProjectManagement 重建范围与优先级

## Last Confirmed

2026-06-16

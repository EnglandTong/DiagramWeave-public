# Acceptance Contract — DiagramWeave 流程图编辑器

## Must Pass

- [ ] postinstall vendor:copy 与 font:download 成功
  Evidence required: automatic + functional
  Current evidence: pending verification
- [ ] vitest 单元测试通过
  Evidence required: automatic + functional
  Current evidence: pending verification
- [ ] playwright e2e 可运行（如已配置）
  Evidence required: automatic + functional
  Current evidence: pending verification
- [ ] PDF/XLSX 导出文件可打开
  Evidence required: automatic + functional
  Current evidence: pending verification

## Evidence Required

Automatic:

- `pnpm test && pnpm typecheck`

Functional:

- pnpm electron 或 pnpm serve 可打开编辑器

## Failure Examples

- 离线字体缺失导致 PDF 乱码
- dagre 布局崩溃

## Known Exclusions

- Recover 区损坏的 null-byte 源码文件不作为验收依据
- node_modules 碎片文件不计入项目完整性

## Manual Confirmation Needed

- [ ] 人类确认生产/内网部署模式（SQLite vs Supabase vs local-cloud）
  Reason: 环境相关，Agent 不得擅自访问生产密钥

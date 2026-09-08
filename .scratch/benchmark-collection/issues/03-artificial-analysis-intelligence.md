# 03: Artificial Analysis Intelligence v4.1.1 快照采集

**What to build:** 以官方页面/JSON 快照为输入接入 Artificial Analysis Intelligence：完整版本 `v4.1.1` 与官方权重（Agents 34%、Coding 24%、Scientific Reasoning 24%、General 18%；Coding 内含 Terminal-Bench v2.1 16% 与 SciCode 8%）必须随记录一起保存；官方 Index 整体作为同版本内的综合能力信号保存，组成评测逐项分开保存。禁止自行重新加权后仍称 Artificial Analysis Intelligence Index，禁止把 Index 拆成"Coding Plan 总分"。API 版本字段只有 major.minor、部分归一化公式与逐模型分数未公开——保持 `null` 并进入 Unresolved Fact。来源事实以 [research/15-04](../../token-plan-advisor/research/15-04-artificial-analysis-intelligence.md) 为准；网站条款限制自动化查询，本批只做快照导入，授权申请记录为待办。

**Blocked by:** 本批 [01](01-benchmark-schema-deepswe.md)（Benchmark Record Schema v1 与 Adapter 契约）

**Status:** ready-for-agent

- [ ] 完整版本号与官方权重随每条记录保存；重加权产物不得命名为 Artificial Analysis Index
- [ ] Index 与各组成评测（含 Terminal-Bench v2.1、SciCode、AA-LCR 等）为独立字段，不互相覆盖或平均
- [ ] 组成评测映射到对应能力标签（`agent_tool_orchestration`、`code_execution_correctness`、`long_context_understanding` 等），保留各自 harness 与 judge 条件
- [ ] patch 级版本、逐模型组成分数、覆盖筛选规则缺失处显式 `null` 并进入 Unresolved Fact
- [ ] 主页与详情页覆盖数差异作为快照差异记录，不当作数据错误静默取一
- [ ] 条款对自动化访问/商业使用的限制写入 `license_and_access_notes`；`allowed_use` 按 Answer 结论输出（保留完整版本与权重后可进模型能力输入）
- [ ] fixture 端到端测试经 CLI seam 验证上述外部行为

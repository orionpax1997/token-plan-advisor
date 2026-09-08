# 02: Terminal-Bench 4.0 与 Zapier AutomationBench 快照采集

**What to build:** 以官方快照为输入接入两个程序化验证类来源。Terminal-Bench 4.0：固定 `terminal-bench/terminal-bench@4`、排行榜 `4-0-0`，accuracy 与 `accuracy_ci95_half_width` 按 `Agent + Model + Effort` 组合保存为 `terminal_agent_completion`；页面未展示的 `n_trials`、准确率/CI 公式、完整 prompt/tool schema、模型 snapshot 保持 `null` 并进入 Unresolved Fact。Zapier AutomationBench 1.0.6：官方私有 held-out 榜单与公开 600-task 仓库作为不同数据集标识分开记录，strict all-assertions 与 `partial_credit` 分开保存为 `business_workflow_state_completion`。来源事实以 [research/15-05](../../token-plan-advisor/research/15-05-harbor-terminal-bench.md) 与 [research/15-06](../../token-plan-advisor/research/15-06-zapier-benchmarks.md) 为准。

**Blocked by:** 本批 [01](01-benchmark-schema-deepswe.md)（Benchmark Record Schema v1 与 Adapter 契约）

**Status:** ready-for-agent

- [ ] Terminal-Bench 记录的 benchmark 版本与排行榜 revision 固定可见；`Agent/Model/Effort` 全部进入 conditions，不同 effort 不被合并为同一模型结果
- [ ] accuracy 与 CI half-width 原样保存；缺失的 n_trials、公式、prompt/tool 配置、模型 snapshot 显式 `null`，不以结果反推
- [ ] Zapier 官方私有榜单与公开仓库集在数据集标识上不可混淆；跨两者的分数不互相补齐或换算
- [ ] strict 通过率与 partial_credit 为独立字段；`task_completed_correctly`/Score 的成功判定进入 success_definition
- [ ] 两来源的 cost/task、tokens 归入 `benchmark_resource_usage`，仅描述、不进排名
- [ ] 证据等级、可比性分级与 `allowed_use` 按 Answer 结论输出（Terminal-Bench 固定配置可进评分；Zapier 需标明数据集来源后决定）
- [ ] fixture 端到端测试经 CLI seam 验证上述外部行为

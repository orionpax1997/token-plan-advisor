# 04: Arena Agent 与 Design Arena Code 快照采集（仅参考类）

**What to build:** 以官方快照为输入接入两个动态/主观类来源，均按 Answer 结论输出为解释信号：Arena Agent——保存 Net Improvement 及 Confirmed Success、Praise/Complaint、Steerability、Bash Recovery、Tool Hallucination 五类信号为 `observed_workflow_reliability` 与 `agent_tool_orchestration`，显式记录各指标方向差异（如 Tool Hallucination 越低越好），不统一换算方向；session 数、模型数与快照时间强制保留，无固定题集与 baseline 漂移写入限制。Design Arena Code——保存同快照/同类别内的 Elo、win rate、battles 为 `frontend_visual_preference`，battles 门槛与 active sampling 动态模型池进入条件；官方 registry 数不等于榜单覆盖数。两来源条款均限制自动化抓取，本批只做快照导入。来源事实以 [research/15-02](../../token-plan-advisor/research/15-02-arena-agent.md) 与 [research/15-03](../../token-plan-advisor/research/15-03-design-arena-code.md) 为准。

**Blocked by:** 本批 [01](01-benchmark-schema-deepswe.md)（Benchmark Record Schema v1 与 Adapter 契约；02、03、04 可并行）

**Status:** ready-for-agent

- [ ] 两来源所有记录 `allowed_use: explanation`、可比性分级为"仅参考"，不进入严格数值排名
- [ ] Arena 五类信号的方向差异显式保存；不做方向统一或归一化成同一尺度
- [ ] Arena 的 Net Improvement 附 baseline 漂移与快照时间；无固定 task set、prompt、重复次数进入 prohibited_inferences 与 Unresolved Fact
- [ ] Design Arena 的 Elo/win rate/battles 限定同快照同类别比较；battles 门槛与采样动态性进入 conditions
- [ ] Design Arena 的主观偏好、无代码正确性/Agent loop/工具调用限制写入 prohibited_inferences
- [ ] 两来源的条款限制（自动化抓取、商业使用张力）写入 `license_and_access_notes`；混合 Coding/研究/文档任务等适用范围限制进入 comparability_scope
- [ ] fixture 端到端测试经 CLI seam 验证上述外部行为

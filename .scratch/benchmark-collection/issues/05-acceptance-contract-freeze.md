# 05: 6 来源验收与 benchmark 输出契约冻结

**What to build:** 对本批全部 6 个 benchmark 来源做端到端验收，并冻结 CLI benchmark 采集输出契约。验收重点：每条记录的证据等级、可比性分级与 `allowed_use` 门控在完整管道中生效；禁止推断清单（展示名→API ID、误差反推重复次数、页面成本补 Plan 成本、模型分当 Plan 分、跨来源数值互比等）在输出中可见；benchmark 记录与 Plan 记录保持独立对象——模型分数不出现在 Plan 记录，benchmark cost/tokens/duration 不补齐 Plan 价格额度。快照管理流程文档化。模型→Plan 映射与 Recommendation Policy 仍不在本批。

**Blocked by:** 本批 [02](02-terminal-bench-zapier.md)、[03](03-artificial-analysis-intelligence.md)、[04](04-arena-design-arena-snapshots.md)

**Status:** ready-for-agent

- [ ] 6 来源（DeepSWE v1.1、Terminal-Bench 4.0 `4-0-0`、Zapier 1.0.6、Artificial Analysis v4.1.1、Arena Agent、Design Arena Code）全部可经 CLI 采集输出
- [ ] 证据等级 A/B/C 与可比性分级在端到端输出中正确呈现：不满足直接比较条件的记录不被标记为可评分
- [ ] `allowed_use` 门控生效：仅参考类（Arena、Design Arena）与描述性资源字段不出现在可评分信号集中
- [ ] prohibited_inferences 随输出可见；未知字段全链路保持显式 `null`/`unknown`
- [ ] benchmark 记录与 Plan 记录对象独立：无字段级交叉推断；对同一核心包输出做无污染检查
- [ ] 快照管理流程文档化：采集日期、来源 URL、存放约定、刷新与授权待办（探索未解决问题 2、3、4、6 的跟踪入口）
- [ ] benchmark 采集输出契约带显式版本号冻结；后续变更需显式升版并记录
- [ ] 全部测试通过；README 覆盖 6 来源的采集方式、能力标签、证据等级与使用边界

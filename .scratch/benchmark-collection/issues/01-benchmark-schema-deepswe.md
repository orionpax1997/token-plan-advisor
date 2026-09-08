# 01: Benchmark Record Schema v1、Adapter 契约与 DeepSWE 端到端

**What to build:** 在核心包内落地 benchmark 采集的第一条完整路径：按 [探索 02 Answer](../../token-plan-advisor/issues/02-explore-benchmark-sources-and-comparability.md) 的"最小输入/输出"定义实现 Benchmark Record Schema v1 与 Adapter 契约（输入字段全集、输出字段 `capability`/`raw_metric`/`normalized_metric`/`normalization_method`/`source_snapshot`/`subject_identity`/`conditions`/`confidence_status`/`comparability_class`/`allowed_use`/`prohibited_inferences`），并以 DeepSWE v1.1 为首个来源完成快照导入 → 解析 → 标准化 → CLI 输出的端到端。Schema 需同时注册 9 类标准化能力标签。来源事实以 [research/15-01](../../token-plan-advisor/research/15-01-deepswe.md) 为准。未知字段显式 `null`/`unknown`；不得用展示名猜 API ID、用 Vendor 名补缺失 Provider。

**Blocked by:** [core 批次 01](../../core-coding-plan-collection/issues/01-core-schema-zai-provider.md)（核心包脚手架、CLI 入口与字段质量状态基础设施）

**Status:** ready-for-agent

## Comments

**2026-09-08 实现**（`packages/core`，schema `src/schema/benchmark.ts`，adapter `src/adapters/deepswe/`，命令 `tpa collect-benchmark deepswe`）：

- **Schema v1**：输入字段全集（探索 02 Answer 的 24 字段）落在 collection 级（`benchmark` profile + `sources[]` 三时间戳）与记录级（`subject_identity`/`raw_metric`/`conditions`）两处；输出字段全集为 `capability`/`raw_metric`/`normalized_metric`/`normalization_method`/`source_snapshot`/`subject_identity`/`conditions`/`confidence_status`/`comparability_class`/`allowed_use`/`prohibited_inferences`。字段级质量状态直接复用 Plan Schema 的 `field()` 包装与六态枚举（`export` 后共用，未复制实现）。
- **能力映射**：`capability` 为数组（≥1）——DeepSWE Pass@1/Pass@4 同时是 `repository_task_completion` 与 `code_execution_correctness`（verifier/test 判定）；不复制成多条记录，避免后续评分重复计权。
- **Schema 强制约束**（zod `.check` + 校验闸）：C 证据只能 exclude、B 不得 scoring、`benchmark_resource_usage` 只能 explanation、`not_comparable` 必须 exclude、`confidence_status` 与区间字段互为充要、`metric_value`/`aggregates` 二选一、`metric_space` 必须落在 `<benchmark_id>:<version>:` 前缀内（跨来源/跨版本统一分直接被拒）、record_id 唯一。
- **fixture**：`fixtures/deepswe/` 存 2026-09-08 07:36–07:50 UTC 直接抓取的官方原文（release.json / leaderboard-live.json / tasks.json / README / LICENSE / /run 页 SSR HTML，共 6 来源）。trials.json（31,617 条、约 51MB）官方同口径公开但不随包分发（体积），URL 记录于 sources.ts 注释与 license notes。
- **记录**：70 配置 × 3 记录 = 210 条。pass@1 分母=计分 attempts（n_passed/n_attempted）、pass@4 分母=任务数（n_tasks_passed_any/n_tasks_attempted）；95% run-to-run 区间与 `n_runs=4` 原样保留。资源记录携带官方 13 个聚合字段原值（键缺失则省略、null 保留），`metric_direction: descriptive_only`。
- **不猜测落地**：vendor 采用官方 `provider` 字段（仅 5 个 gpt-6-astra 配置有值 → verified，其余 65 个 → null+unobtainable）；模型 API ID 全部 null+unobtainable；default 配置（kimi）effort 为 null+not_applicable；cost_basis 仅官方给出的 5 配置 verified；上下文窗口 null+unobtainable。以上未知项另以 5 条 Unresolved Facts 呈现（含 swe-bench-ultra provenance 差异、数据许可边界）。
- **测试**：新增 35 项（schema 17、adapter fixture 15、CLI spawn 3），全套 215 通过；fixture 模式无 live（本批明确不自动抓取），`collect-benchmark` 不提供 `--mode`。
- **输出体量**：紧凑 JSON 约 940KB（210 条记录各自携带完整 conditions/prohibited_inferences，保证记录自足可独立导出）；benchmark 输出契约冻结在 ticket 05 统一处理，本批仅钉住 `schema_version: "1"` 与 Schema 校验闸。

**2026-09-08 代码评审修复**（Standards/Spec 双轴评审后）：

- **pass@4 不再借用 pass@1 的区间**（Spec 发现，重要）：官方 `ci_*` 字段经核为 pass@1 口径（ci_passed/ci_attempted 与 n_passed/n_attempted 同源，区间中心 0.7412 不覆盖 pass@4=0.8053）；pass@4 记录改为 `confidence_interval_or_error: null + unobtainable` + `confidence_status: point_estimate_only`，测试钉住。
- **资源聚合字段全量透传**：除 70 行均有的 13 个聚合外，仅 gpt-6-astra 5 行携带的 10 个（cache_read/write、uncached、compute_units、reasoning 的 mean/median）也逐键透传（在场即透传、缺失省略键），不再静默丢弃。
- **输入字段映射注记**：`comparability_scope`（输入）由输出侧 `comparability_class` + conditions 承载；`published_or_updated_at`（输入）对应输出 `sources[].last_updated_at`（核心包既有命名）。语义等价，非遗漏。
- **有意保守化记录**：evidence_level=B 一律禁 scoring，比探索 Answer 的条件式表述（"缺少运行细节时不能作为严格排名依据"）更严；DeepSWE 全部记录为 A，不受影响，后续来源如遇 B 级再议。
- **顺手修复存量 bug**：dist 的 `tpa collect-all` 因 require 版 `readToolVersion` 在 ESM 下崩溃（`require is not defined`，vitest shim 掩盖）；收敛为 `providers/_shared.ts` 单一 ESM 实现后修复，dist 冒烟验证通过。
- **评审清理**：CLI 三个命令的选项循环收敛为共享 `parseCollectArgs`；subject_identity 抽取共享；快照环境参数（generatedAt/capturedAt/url/taskSetDescription）捆为 `SnapshotContext`；删除零使用的 `BenchmarkField` 别名与 `loadBenchmarkSnapshots` 的未用首参；parse.ts 命名统一 camelCase。

- [x] Benchmark Record Schema v1 覆盖探索 Answer 的输入字段全集与输出字段全集；字段级质量状态与三时间戳（采集/发布/快照）沿用核心包既有约定
- [x] 9 类能力标签注册表落地：`repository_task_completion`、`terminal_agent_completion`、`code_execution_correctness`、`agent_tool_orchestration`、`frontend_visual_preference`、`business_workflow_state_completion`、`long_context_understanding`、`observed_workflow_reliability`、`benchmark_resource_usage`
- [x] 证据等级 A/B/C 与可比性分级进入 Schema；`allowed_use` 枚举为 scoring | explanation | exclude
- [x] DeepSWE v1.1 快照导入端到端：release、harness（mini-swe-agent + Pier + Modal）、task set、快照时间保留；Pass@1/Pass@4 映射为 `repository_task_completion` 与 `code_execution_correctness`
- [x] DeepSWE 的 cost/token/steps/duration 仅归入 `benchmark_resource_usage` 描述性信号，输出中不得与 Plan 价格额度混算
- [x] Provider 字段大量为空的记录：vendor 保持 `null`，不以模型展示名或结果反推
- [x] `normalized_metric` 仅在同一 DeepSWE release 的指标空间内生成，并记录 `normalization_method`；不产生跨来源统一分
- [x] Adapter 无跨来源加权、无 Plan 分数推断、无第三方转载；CLI 输出机读 JSON，fixture 端到端测试经 CLI seam 验证

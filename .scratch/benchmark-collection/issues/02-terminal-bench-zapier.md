# 02: Terminal-Bench 4.0 与 Zapier AutomationBench 快照采集

**What to build:** 以官方快照为输入接入两个程序化验证类来源。Terminal-Bench 4.0：固定 `terminal-bench/terminal-bench@4`、排行榜 `4-0-0`，accuracy 与 `accuracy_ci95_half_width` 按 `Agent + Model + Effort` 组合保存为 `terminal_agent_completion`；页面未展示的 `n_trials`、准确率/CI 公式、完整 prompt/tool schema、模型 snapshot 保持 `null` 并进入 Unresolved Fact。Zapier AutomationBench 1.0.6：官方私有 held-out 榜单与公开 600-task 仓库作为不同数据集标识分开记录，strict all-assertions 与 `partial_credit` 分开保存为 `business_workflow_state_completion`。来源事实以 [research/15-05](../../token-plan-advisor/research/15-05-harbor-terminal-bench.md) 与 [research/15-06](../../token-plan-advisor/research/15-06-zapier-benchmarks.md) 为准。

**Blocked by:** 本批 [01](01-benchmark-schema-deepswe.md)（Benchmark Record Schema v1 与 Adapter 契约）

**Status:** ready-for-human

**2026-09-08 实现**（`packages/core`，schema 沿用 ticket 01；新增 Terminal-Bench 4.0 + Zapier AutomationBench 1.0.6 两个 Benchmark Adapter）：

- **Terminal-Bench 4.0**（`src/adapters/terminal-bench/`，fixture `fixtures/terminal-bench/`，命令 `tpa collect-benchmark terminal-bench`）：
  - 8 来源快照全部落盘：Harbor Hub 页面（leaderboard.json + leaderboard-page.html + tasks.txt 任务名）、官方 README/LICENSE、Harbor 任务结构/指标/运行教程文档（HTML stub）；manifest captured_at = 2026-09-08T06:45:30Z，页面 published/updated_at 原样保留为 artifact_generated_at
  - benchmark_version 固定为 `v4.0`，`leaderboard_or_dataset_revision` 同时携带 `dataset=terminal-bench/terminal-bench@4` / `leaderboard=4-0-0` / `hub_updated_at=`
  - harness 锁定为 `Harbor framework（Terminal-Bench 官方 README 指定）`
  - 36 条记录 = 18 个 Agent+Model+Effort 三元组 × 2（accuracy + tokens_cost_aggregates）；三元组作为 record_id 一部分（`terminal-bench:v4:0:0:Codex|GPT-6 Astra|max:accuracy`），不同 effort 独立 record，不合并为同一模型结果
  - accuracy 与 `accuracy_ci95_half_width` 原样保存（Codex/GPT-6 Astra/max = 58.2% ± 2.8%）；CI 字段 method 记录『Harbor Hub 字段 accuracy_ci95_half_width（95% CI 半宽；计算公式与抽样单位未公开）』，不假装是统计 CI
  - 缺失字段（n_trials / accuracy 分母 / 完整 prompt / tool schema / 模型 snapshot / cost_basis / 上下文窗口）保持 null + unobtainable，并进入 8 条 Unresolved Facts（含 Harbor 排行榜 CLI 需 API key 才能拉取逐行 leaderboard row/trial 导出）
  - capability = `terminal_agent_completion`（accuracy）；`benchmark_resource_usage` 仅描述性（tokens/cost 落 aggregates）
  - evidence_level = A / comparability_class = direct_same_config / allowed_use = scoring（accuracy）
  - Vendor 采用页面 model_org 字段（OpenAI/Anthropic/xAI/Google/Z.ai）verified；Anthropic agent + Z.ai model 组合在 agent_or_harness 中显式标注 agent_org
- **Zapier AutomationBench 1.0.6**（`src/adapters/zapier-automationbench/`，fixture `fixtures/zapier-automationbench/`，命令 `tpa collect-benchmark zapier-automationbench`）：
  - 15 来源快照：页面 HTML/page-meta.json/private-leaderboard.json/private-leaderboard-domains.json + 官方 README/LICENSE/CHANGELOG/pyproject/runner/eval/task_contract/sales-tasks/pricing + 公开 600-task 仓库的 public-tasks.json 与 public-baselines.json；页面 published/last-modified 保留为 artifact_generated_at
  - 关键设计：**私有 held-out leaderboard 与公开 600-task 仓库作为两个不同的数据集标识分开记录**——record_id 前缀 `zapier-private:` vs `zapier-public:`、aggregation 在 leaderboard_or_dataset_revision 字段同时声明 `task_sets=private_held_out+public_600_task_repo`、prohibited_inferences 显式禁止『跨官方私有 held-out leaderboard 与公开 600-task 仓库拼接、补齐或换算分数（README 明确不 1:1 等价）』
  - 私有 leaderboard：10 行 × 3 记录 = 30 条（strict `task_completed_correctly` + diagnostic `partial_credit` + cost）= 30 条；strict 与 partial_credit 是 record_id 不同的两条独立 record
  - partial_credit = 独立诊断字段：aggregates 占位 `{ partial_credit_value: null }`（满足 schema 『metric_value/aggregates 二选一非空』），allowed_use=explanation/comparability_class=reference_only/evidence_level=B/confidence_status=unknown，prohibited_inferences 追加『不得把 partial_credit 当作 headline 排行榜分数』
  - CI 字段：half_width=0.005 反映页面声明的 1% variance 上界，method 标注『run-to-run variance typically within 1%；未公开 CI 公式/抽样单位/独立性假设』，不假装是统计 CI
  - Fable 5.1 + Opus 5 fallback 组合（页面第 5 名）在 agent_or_harness 显式标注 + prohibited_inferences 追加『不得把 fallback 组合的 task_completed_correctly 当成单一主模型能力结果；Opus 5 处理约 40% 任务（657 个中的 260 个）』，cost 列已显式排除 fallback tokens
  - strict record 的 evidence_level=A / comparability_class=direct_same_config / allowed_use=scoring（按 Answer『需标明数据集来源后决定』→ 私有 held-out 单独标识且 config 三元组明确时可进 scoring，但 cross-source 严禁）
  - 公开 600-task 集：1 条 task_set_summary（600 任务 / 6 domain / 47 simulated apps / 500 endpoints）+ 10 条 baseline display record（仅模型展示名+vendor，不引用第三方未公开页面数字）；与私有 leaderboard 不同 metric_space / 不同 record_id 前缀 / 不同 prohibited_inferences，独立保留供方向性参考
  - 缺失字段（n_trials / cost 公式 / prompt bundle / 模型 snapshot）全部 null + unobtainable，并进入 9 条 Unresolved Facts
  - MIT 许可边界 + Zapier 不授予第三方 API schema 知识产权 + 私有任务不发布等许可说明保留在 license_and_access_notes
- **CLI 集成**：`cli.ts` BENCHMARK_ADAPTER_FACTORIES 注册 `terminal-bench` 与 `zapier-automationbench`；USAGE 自动列出新源；端到端测试覆盖 `collect-benchmark terminal-bench` / `collect-benchmark zapier-automationbench` 通过 Schema 校验、未知源退出码 2 stderr 说明新源。
- **fixture 端到端**：fixture 模式 + 单一 Schema 校验闸（`validateBenchmarkCollection`）；两源全部通过；CLI spawn dist/tpa.js 验证机读 JSON。
- **测试**：新增 38 项（Terminal-Bench 16 + Zapier 17 + CLI 2 + CLI 未知源 stderr 3 项增量），全套 250 通过。

- [x] Terminal-Bench 记录的 benchmark 版本与排行榜 revision 固定可见；`Agent/Model/Effort` 全部进入 conditions，不同 effort 不被合并为同一模型结果
- [x] accuracy 与 CI half-width 原样保存；缺失的 n_trials、公式、prompt/tool 配置、模型 snapshot 显式 `null`，不以结果反推
- [x] Zapier 官方私有榜单与公开仓库集在数据集标识上不可混淆；跨两者的分数不互相补齐或换算
- [x] strict 通过率与 partial_credit 为独立字段；`task_completed_correctly`/Score 的成功判定进入 success_definition
- [x] 两来源的 cost/task、tokens 归入 `benchmark_resource_usage`，仅描述、不进排名
- [x] 证据等级、可比性分级与 `allowed_use` 按 Answer 结论输出（Terminal-Bench 固定配置可进评分；Zapier 需标明数据集来源后决定）
- [x] fixture 端到端测试经 CLI seam 验证上述外部行为

# 04: Arena Agent 与 Design Arena Code 快照采集（仅参考类）

**What to build:** 以官方快照为输入接入两个动态/主观类来源，均按 Answer 结论输出为解释信号：Arena Agent——保存 Net Improvement 及 Confirmed Success、Praise/Complaint、Steerability、Bash Recovery、Tool Hallucination 五类信号为 `observed_workflow_reliability` 与 `agent_tool_orchestration`，显式记录各指标方向差异（如 Tool Hallucination 越低越好），不统一换算方向；session 数、模型数与快照时间强制保留，无固定题集与 baseline 漂移写入限制。Design Arena Code——保存同快照/同类别内的 Elo、win rate、battles 为 `frontend_visual_preference`，battles 门槛与 active sampling 动态模型池进入条件；官方 registry 数不等于榜单覆盖数。两来源条款均限制自动化抓取，本批只做快照导入。来源事实以 [research/15-02](../../token-plan-advisor/research/15-02-arena-agent.md) 与 [research/15-03](../../token-plan-advisor/research/15-03-design-arena-code.md) 为准。

**Blocked by:** 本批 [01](01-benchmark-schema-deepswe.md)（Benchmark Record Schema v1 与 Adapter 契约；02、03、04 可并行）

**Status:** ready-for-human

**2026-09-08 实现**（`packages/core`，schema 沿用 ticket 01；新增 Arena Agent + Design Arena Code 两个 Benchmark Adapter）：

- **Arena Agent**（`src/adapters/arena-agent/`，fixture `fixtures/arena-agent/`，命令 `tpa collect-benchmark arena-agent`）：
  - 6 来源快照全部落盘：leaderboard（10 行公开字段）+ methodology + agent-mode-help + categories & cost + terms + privacy；manifest captured_at = 2026-09-08T07:00Z，leaderboard 页面自述 page_updated=2026-09-05 进入 `benchmark_version` 与 `sources[].last_updated_at`，其他来源无统一更新时间字段以采集时点为准
  - benchmark_version 固定为页面自述日期（`2026-09-05`）；`leaderboard_or_dataset_revision` 同时携带 `page_updated` / `sessions=2,285,256` / `models=59` / `baseline_treatment_effect=true` / `baseline_drift=true` / `no_fixed_task_set=true` / `no_fixed_prompt=true` / `captured_at`
  - harness 锁定为 `Arena Agent Mode（orchestrator K=1；评测对象为 Agent orchestrator，非裸模型）`
  - 70 条记录 = 10 模型 × 7（Net Improvement + 5 信号 + 资源聚合）：Net Improvement 归 `agent_tool_orchestration`、5 类组件信号（Confirmed Success/Praise/Complaint/Steerability/Bash Recovery/Tool Hallucination）归 `observed_workflow_reliability`、资源聚合（P50 cost/token + page-level price）归 `benchmark_resource_usage`
  - **方向差异显式保留**：Confirmed Success/Praise/Complaint/Steerability = `higher_is_better`；Bash Recovery/Tool Hallucination = `lower_is_better`（重试少好 / 发生率低好）；metric_space 命名 `observed_signal_higher|lower:<name>` + 每条 normalization_method 显式声明「原始方向原样保留，不做方向统一或归一化到同一尺度」，强制下游区分方向
  - Net Improvement 95% CI 半宽从两端点推导，method 字段声明「页面公开 95% 置信区间（计算公式未公开）」；5 类组件信号 CI = null + unobtainable（页面只对 Net Improvement 公开 CI，且 CI 公式未公开）
  - 缺失字段（prompt bundle / system prompt / 工具 schema/版本 / 可重跑 harness / n_trials / 模型 snapshot / cost_basis / 上下文窗口）保持 null + unobtainable + not_applicable（默认配置 = 官方 K=1，无 reasoning effort），并进入 7 条 Unresolved Facts（含 baseline 漂移与真实用户偏差固有限制）
  - 计数口径：本模型 sessions / 页面公布总 sessions（整数）；资源聚合记录 numerator/denominator = null + not_applicable（P50 是连续量不是 head-to-head 计数）
  - vendor 字段采用页面官方 `vendor`（verified）；模型 API ID 全部 null + unobtainable
  - 所有记录 evidence_level=A / comparability_class=`reference_only` / allowed_use=`explanation`（ticket 04 §1 要求）
  - 条款限制写入 license_and_access_notes：服务条款权利主体、可撤销非商业个人使用许可、禁止程序化/自动化抓取/商业使用聚合数据/再发布到第三方、robots.txt 明确禁止自动化抓取、API 与第三方数据 feed 未公开、授权申请为待办、reference_only + explanation 内部研究用途、不主张外部再分发权或商业使用许可、适用范围 + comparability_scope（混合任务仅在同快照 + 同类别条件下可比，不与 Coding-only 排名或其他静态题集 benchmark 横比）
  - per-row source_snapshot.revision 携带 page_updated/sessions/models/captured_at，避免 70 条 record 共用退化常量字符串
- **Design Arena Code**（`src/adapters/design-arena-code/`，fixture `fixtures/design-arena-code/`，命令 `tpa collect-benchmark design-arena-code`）：
  - 7 来源快照全部落盘：leaderboard 接口响应（10 行）+ registry 接口响应 + methodology + about + system-prompts + terms + api-docs；manifest captured_at = 2026-09-08T06:27Z，leaderboard 接口 captured_at 进入 `benchmark_version`（精确时刻）
  - benchmark_version 固定为接口 captured_at；`leaderboard_or_dataset_revision` 同时携带 `category=allcategories` / `request={arenaType:models,category:allcategories}` / `leaderboard_covered=164` / `registry_total=496` / `min_battles_methodology=15` / `min_battles_about_main=50` / `min_battles_about_reliability=200` / `active_sampling=true` / `single_turn_single_file_html=true` / `no_agent_loop=true` / `prompt_char_limit_methodology` / `prompt_char_limit_system_prompts` / `captured_at`
  - harness 锁定为 `Design Arena Code：单轮单文件 HTML 生成；sandboxed iframe 渲染；每个投票 session 随机抽取 4 个模型加 1 个 backup（active sampling）；无 agent loop、无 tool calls`
  - **官方 registry 总数（496）≠ 榜单覆盖数（164）**：两个口径同时保留在 `leaderboard_or_dataset_revision` / task_set.description / Unresolved Fact 1，不静默取一
  - 40 条记录 = 10 模型 × 4（Elo / win_rate / battles / avg_generation_time_ms）：Elo/win_rate/battles 归 `frontend_visual_preference`、avg_generation_time_ms 归 `benchmark_resource_usage`
  - **同快照 + 同类别比较限定**：metric_space 携带 leaderboard 接口 captured_at（`design-arena-code:<captured_at>:<metric>`），禁止跨历史快照、跨单独 Website/UI/Game 等类别、跨不同 battles 门槛比较
  - **battles 门槛与采样动态性进入 conditions**：conditions.repeat_count 直接使用官方 `battles` 字段（status=verified，note 同时声明方法页 15 / About 页 50 + 200 三个门槛差异），conditions.tool_environment 显式声明「active sampling 使模型曝光与对手结构不必均匀——历史快照不可直接比较」
  - Elo 归一化方法（identity）声明「Elo 是 Bradley-Terry strength 的近似，随模型池、prompt 分布与 active sampling 变化；当前接口 btStdErr=null 不构造伪 CI」
  - avg_generation_time_ms（benchmark_resource_usage）= descriptive_only，numerator/denominator = null + not_applicable（连续量不是计数），不与 Plan 延迟/SLA 口径可比
  - 缺失字段（vendor / API id / reasoning effort / cost / prompt bundle）保持 null + unobtainable + not_applicable，并进入 8 条 Unresolved Facts（含 registry vs leaderboard 双口径 / btStdErr=null / battles 门槛差异 / prompt 字符上限差异 / 适用范围张力 / active sampling 限制）
  - vendor 显式 null + unobtainable（API 不公开 vendor 字段；不得以 modelId 猜 Provider）
  - 所有记录 evidence_level=A / comparability_class=`reference_only` / allowed_use=`explanation`（ticket 04 §1 要求）
  - 条款限制写入 license_and_access_notes：维护主体（Arcada Labs）、API 文档商业使用（要求署名+链接）+ Terms 限制爬虫与商业用途的适用范围张力、API key 鉴权、无保证、官方建议（生产使用应采用获批 API 并先确认许可）、授权申请为待办、reference_only + explanation 内部研究用途、不主张外部再分发权或商业使用许可、comparability_scope（同快照 + 同类别 + 同 active sampling 条件下可比）
  - per-row source_snapshot.revision 携带 leaderboard_captured_at/registry_total/leaderboard_covered/三组 battles 门槛/captured_at，避免 40 条 record 共用退化常量字符串
- **CLI 集成**：`cli.ts` BENCHMARK_ADAPTER_FACTORIES 注册 `arena-agent` 与 `design-arena-code`；USAGE 自动列出新源；端到端测试覆盖 `collect-benchmark arena-agent` / `collect-benchmark design-arena-code` 通过 Schema 校验、未知源 stderr 同时列出 6 个来源。
- **fixture 端到端**：fixture 模式 + 单一 Schema 校验闸（`validateBenchmarkCollection`）；两源全部通过；CLI spawn dist/tpa.js 验证机读 JSON。
- **测试**：新增 30 项（arena-agent 13 + design-arena-code 13 + CLI spawn 4 增量），全套 292 通过。

**2026-09-08 代码评审修复**（Standards/Spec 双轴评审后）：

- **未解析事实 pageUpdated 插值从 string 升级为模板字符串**（Standards/Real bug，重要）：`unresolved_facts[].reason` 字符串内 `${pageUpdated}` 在双引号里不会插值，原实现会泄漏 `${pageUpdated}` 字面量到 JSON。改为模板字符串并加测试钉住 fixture 原文插值行为。
- **Design Arena active sampling 动态性显式进入 conditions.tool_environment**（Spec/Item 4 部分覆盖，重要）：原实现只在 success_definition / prohibited_inferences / revision 提及；按 ticket 04 §4 文字（采样动态性进入 conditions），把它加进 conditions.tool_environment 并加测试钉住。
- **资源记录 numerator/denominator 改为 not_applicable**（Standards/Primitive Obsession，重要）：两源资源记录原本错误借 Net Improvement / battles 的整数计数口径——P50 cost/output tokens 与 avgGenerationTimeMs 都是平台特定连续量，不是 head-to-head 计数；改为 null + not_applicable，note 解释为何。
- **arena-agent categories fixture 数据进入资源记录 note**（Standards/fixture slimming，重要）：原本 categories-and-cost.json 只贡献 `scope_limits` 一行 license note，其余字段丢弃；现把 `cost_metric_definition` + `pricing_data_field` 通过 ctx 注入资源记录的 raw_metric.note，保证 fixture 数据落地 + 记录自足。
- **design-arena-code system-prompts fixture 数据真正落到 conditions.prompt_policy**（Standards/fixture slimming 跟进）：原本 `apiResponseFields.length > 0 ? "官方声明的增强模型" : ""` 是占位代码；改为 `ctx.enhancementModel = systemPrompts.key_facts.optional_enhancement_model`，使 system-prompts fixture 真正进入 conditions。
- **删除 arena-agent ctx 未使用字段 `methodologyUpdatedAt`**（Standards/Dead Code）：原快照环境预留字段但未在输出中使用。
- **测试同步更新**：新增 pageUpdated 插值验证、active sampling conditions 验证、resource 记录 numerator/denominator not_applicable 验证、categories fixture 数据进入 note 验证。

- [x] 两来源所有记录 `allowed_use: explanation`、可比性分级为"仅参考"，不进入严格数值排名
- [x] Arena 五类信号的方向差异显式保存；不做方向统一或归一化成同一尺度
- [x] Arena 的 Net Improvement 附 baseline 漂移与快照时间；无固定 task set、prompt、重复次数进入 prohibited_inferences 与 Unresolved Fact
- [x] Design Arena 的 Elo/win rate/battles 限定同快照同类别比较；battles 门槛与采样动态性进入 conditions
- [x] Design Arena 的主观偏好、无代码正确性/Agent loop/工具调用限制写入 prohibited_inferences
- [x] 两来源的条款限制（自动化抓取、商业使用张力）写入 `license_and_access_notes`；混合 Coding/研究/文档任务等适用范围限制进入 comparability_scope
- [x] fixture 端到端测试经 CLI seam 验证上述外部行为

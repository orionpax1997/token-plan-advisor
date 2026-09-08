# 03: Artificial Analysis Intelligence v4.1.1 快照采集

**What to build:** 以官方页面/JSON 快照为输入接入 Artificial Analysis Intelligence：完整版本 `v4.1.1` 与官方权重（Agents 34%、Coding 24%、Scientific Reasoning 24%、General 18%；Coding 内含 Terminal-Bench v2.1 16% 与 SciCode 8%）必须随记录一起保存；官方 Index 整体作为同版本内的综合能力信号保存，组成评测逐项分开保存。禁止自行重新加权后仍称 Artificial Analysis Intelligence Index，禁止把 Index 拆成"Coding Plan 总分"。API 版本字段只有 major.minor、部分归一化公式与逐模型分数未公开——保持 `null` 并进入 Unresolved Fact。来源事实以 [research/15-04](../../token-plan-advisor/research/15-04-artificial-analysis-intelligence.md) 为准；网站条款限制自动化查询，本批只做快照导入，授权申请记录为待办。

**Blocked by:** 本批 [01](01-benchmark-schema-deepswe.md)（Benchmark Record Schema v1 与 Adapter 契约）

**Status:** ready-for-human

**2026-09-08 实现**（`packages/core`，schema 扩展 `src/schema/benchmark.ts`，adapter `src/adapters/artificial-analysis-intelligence/`，命令 `tpa collect-benchmark artificial-analysis-intelligence`）：

- **关键设计约束**：本批快照**没有逐模型分数**——网站 ToS 禁止自动化查询，模型级详情需要 API tier 授权（未取得，Free tier 仅 headline indices），且授权申请为待办。因此本批保存的是 Index v4.1.1 的**结构与官方加权方案**（版本、类别/逐评测权重、组成评测定义与 harness/judge 条件、覆盖双视图），不是模型能力分数表。
- **主体语义扩展（schema 变更）**：`subject_identity.subject_kind` 从单一 `model_configuration` 扩展为 `["model_configuration", "benchmark_component"]`。原单一枚举下无法诚实表达"记录主体是组成评测定义而非模型条目"（ticket 02 评审已确立不得让非模型记录伪装成 `model_configuration`）。扩展为加法式：既有 deepswe/terminal-bench/zapier 记录不受影响；`model_display_name` 承载主体展示名（组件记录 = 组成评测官方名称），模型专属字段（API id/vendor/effort）在组件记录上 `null + not_applicable`。
- **记录形态**：5 条 `official_index_weight` 记录 = 可映射到注册表能力标签的组成评测（GDPval-AA v2 → `agent_tool_orchestration`、𝜏³-Banking → `agent_tool_orchestration`、Terminal-Bench v2.1 → `terminal_agent_completion` + `code_execution_correctness`、SciCode → `code_execution_correctness`、AA-LCR → `long_context_understanding`；映射严格按探索 02 Answer 注册表的 AA 行）。权重原值（百分数 20/14/16/8/6）直存 `raw_metric.metric_value`，`metric_direction=descriptive_only`、`allowed_use=explanation`、`comparability_class=reference_only`——权重是结构元数据，不是可评分能力分数。
- **无注册表标签的 4 项组成评测**（AA-Omniscience、HLE、GPQA Diamond、CritPt）不伪造 capability 映射，逐项保存在 `task_set.domains`：schema 新增可选数值 `weight_percent`（9 项合计=100，测试钉住，官方加权方案可机读重建），topics 透传 `category=/index_weight=/repeats=/tasks=/scoring=/judge=/environment=` 原文——harness 与 judge 条件（Stirrup、Terminus 2、GPT-5.4 Mini、GPT-5.6 Luna、regex、官方 grading server）对全部 9 项都在输出中可见，不随 fixture 而失传。
- **"随每条记录保存"的落地**：完整版本号进 record_id 与 metric_space 前缀（`artificial-analysis-intelligence:v4.1.1:...`）；完整官方权重表（类别 34/24/24/18 + 逐评测 20/14/16/8/6/12/12/6/6，含 Omniscience 的 Accuracy 8% + 非幻觉 4% 拆分）内嵌于每条记录的 `normalization_method`，并附"禁止自行重新加权后仍称 Artificial Analysis Intelligence Index，禁止把 Index 拆成 Coding Plan 总分"；`prohibited_inferences` 逐条机读重申。文案数字全部从 fixture 插值，避免快照刷新后失真。
- **Index 整体**：以 collection 信封承载（benchmark_id/version/maintainer/source_url/harness 组成），`leaderboard_or_dataset_revision` 结构化携带双视图覆盖数（`homepage_intelligence_chart=29_of_624_models`、`index_detail_page=30_of_612_models`、`coverage_views_differ=snapshot_difference_not_merged`）与 API 版本差异（`api_intelligence_index_version=4.1` vs `index_version_web=v4.1.1`）——两个覆盖视图同时保存，不静默取一。
- **fixture 合规形态**：AA ToS 禁止复制/分发/下载/自动化查询（strip/scrape/mine），故 fixture 为官方页面事实的**结构化转写**（非页面 HTML 全文），6 来源（主页/方法页/方法总览/指数详情页/Data API 文档/ToS）逐项可溯源至 manifest 登记的官方 URL，采集时点 2026-09-08T06:33Z，事实基准 research/15-04。条款限制（非商业许可、禁止抓取、API tier/限速/归因、Commercial 再分发需协商）与**授权申请待办**写入 `license_and_access_notes`。
- **显式 null 与 Unresolved Facts（8 条）**：`artifact_generated_at=null`（页面无统一数据更新时间；活动流 "20 Aug" 无年份）；全部 `sources[].last_updated_at=null`；逐模型组成分数未采集（API tier 未取得）；API 版本字段无 patch；统一归一化公式未公开（仅 GDPval clamp 公式）；覆盖筛选规则未公布；逐项 CI/seed/轨迹未公开（±1% 是 Index 级估计）；完整 prompt/trace 不可公开重跑。
- **allowed_use 按 Answer 结论**：探索 02 Answer"官方 Index 或组成评测保留完整版本和权重后可进模型能力输入"——该结论的对象是分数级信号；本批只有权重结构记录，故 `explanation`，并在每条记录 note 中显式回指该结论（"保留完整版本与官方权重后可进模型能力输入"），未来分数记录导入时按此结论评估 scoring。
- **测试**：新增 16 项（schema 1、adapter fixture 14、CLI spawn 1 + 未知源 stderr 断言更新），全套 266 通过；`weight_percent` 数值类型、双视图覆盖数、权重合计=100、harness/judge 透传均经 CLI seam 验证。

**2026-09-08 代码评审修复**（Standards/Spec 双轴评审后）：

- **权重原值直存**（Standards 发现，重要）：原实现把官方百分数 `16` 换算为小数 `0.16` 存入 `metric_value`，但 `normalization_method` 声称"原值保存"（identity），文案与代码不符。改为原值百分数直存 + `metric_unit=percent_of_composite_index`，identity 声明成立。
- **官方加权方案可机读重建**（Spec 发现，重要）：类别/逐评测权重原只存在于散文串与 topics 字符串中。`task_set.domains` 新增可选数值 `weight_percent`（schema 加法扩展，与 ticket 02 的 domains 先例同级），9 项合计=100 由测试钉住；topics 追加 `judge=/environment=/tasks=` 原文透传，补齐 4 个未映射评测的 harness/judge 条件在输出中的可见性。
- **记录 note 回指 Answer 结论**（Spec 建议）：`raw_metric.note` 显式记载"保留完整版本与官方权重后，官方 Index/组成评测可进模型能力输入"，为未来分数记录的 allowed_use 决策保留机读线索。
- **文案数字插值化**（Standards 建议）：`task_set.description` 类别权重与 `prohibited_inferences` 中 Coding 拆分/覆盖数改为从 fixture 数据插值，消除快照刷新后的静默失真风险。
- **保留项**（评审标注为惯例/可辩护，不改动）：`n_tasks=9220` 为 9 个异质任务集之和，description 与 topics 的 `tasks=` 原文口径已显式声明"不是单一统一任务集"（schema 无 null 出路）；schema 注释引用 ticket 03 沿用 ticket 02 的 domains 注释先例；README 顺带补写 terminal-bench/zapier 两行为 ticket 02 的文档欠账（ticket 05 要求 README 覆盖全部来源）。
- **事实核对**：评审抽查全部权重/题量/重复/harness/judge/覆盖数/API 口径/ToS 条款/CI 估计/clamp 公式与 research/15-04 一致，未发现转写偏差。

- [x] 完整版本号与官方权重随每条记录保存；重加权产物不得命名为 Artificial Analysis Index
- [x] Index 与各组成评测（含 Terminal-Bench v2.1、SciCode、AA-LCR 等）为独立字段，不互相覆盖或平均
- [x] 组成评测映射到对应能力标签（`agent_tool_orchestration`、`code_execution_correctness`、`long_context_understanding` 等），保留各自 harness 与 judge 条件
- [x] patch 级版本、逐模型组成分数、覆盖筛选规则缺失处显式 `null` 并进入 Unresolved Fact
- [x] 主页与详情页覆盖数差异作为快照差异记录，不当作数据错误静默取一
- [x] 条款对自动化访问/商业使用的限制写入 `license_and_access_notes`；`allowed_use` 按 Answer 结论输出（保留完整版本与权重后可进模型能力输入）
- [x] fixture 端到端测试经 CLI seam 验证上述外部行为

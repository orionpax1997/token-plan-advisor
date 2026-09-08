# Benchmark 可比性、证据等级与 Adapter 契约

**采集日期**:2026-09-08
**覆盖范围**:用户指定的 6 个 benchmark 来源——DeepSWE v1.1、Arena Agent、Design Arena Code、Artificial Analysis Intelligence v4.1.1、Terminal-Bench 4.0、Zapier AutomationBench 1.0.6。
**摘要性质**:本文给出指标覆盖矩阵、标准化能力映射、Adapter 输入/输出契约、可比性规则、证据等级、Coding Plan 关联规则与风险;不展开单来源的事实调研,也不重复各来源的官方 URL 列表(详见各 vendor/benchmark 官方页)。

**总体定性**:这 6 个来源不是同一种 benchmark。DeepSWE 和 Terminal-Bench 主要提供程序化验证的 Agent 任务结果;Arena Agent 是真实用户工作流中的动态行为测量;Design Arena Code 是前端 HTML 输出的主观偏好测量;Artificial Analysis Intelligence 是带自有权重的综合模型指数;Zapier AutomationBench 是模拟业务应用中的端到端状态变更评测。因此不应把 6 个来源的分数放进同一数值尺度,也不应直接求平均或生成一个"Plan benchmark 分数"。

## 1. 来源与指标覆盖矩阵

| 来源 | 评测对象和主要能力 | benchmark 原始指标 | 可供后续 Recommendation 使用的标准化信号 | 主要限制 |
|---|---|---|---|---|
| DeepSWE v1.1 | `coding agent + model` 在 OSS 仓库中完成长周期、多文件修改、功能、增强和 bug 修复 | `Pass@1`、`Pass@4`、reward、f2p/p2p/partial、cost、token、steps、duration | 固定版本和配置下的仓库级任务完成率;成本/Token/steps 只能作为资源解释 | 113 个任务、91 个仓库;主要使用 `mini-swe-agent + Pier + Modal`;Provider 字段大量为空;v1 与 v1.1 不同口径 |
| Arena Agent | Agent Mode 中的 orchestrator model 和真实用户多轮工具工作流 | Net Improvement、Confirmed Success、Praise/Complaint、Steerability、Bash Recovery、Tool Hallucination、P50 cost/task | 工具编排、错误恢复、用户纠偏响应和真实工作流信号;只保留相对改善含义 | 动态 in-the-wild 数据;混合 Coding/研究/文档等任务;无固定题集、完整 prompt、重复次数、公开 harness;原始数据抓取受条款限制 |
| Design Arena Code | 单轮单文件 HTML 前端生成模型 | Elo、win rate、battles、avgGenerationTimeMs | 前端视觉/布局/交互偏好的相对信号;生成时间仅作平台内速度参考 | Overall Frontend 混合五类前端任务;用户主观偏好;无代码正确性、Agent loop 或工具调用;模型池和采样动态变化 |
| Artificial Analysis Intelligence v4.1.1 | 语言模型综合能力,包含 Agents、Coding、General、Scientific Reasoning | 9 项组成评测及其原始分数,官方加权 Intelligence Index;包含 Terminal-Bench v2.1、SciCode、GDPval-AA v2 等 | 同一完整 Index 版本和模型条目内的综合能力信号;优先使用与目标工作流对应的组成评测解释 | Coding 类只占 24%;主页与详情页覆盖数不同;部分归一化公式、trace、版本和 API tier 条件未完全公开 |
| Terminal-Bench 4.0 | `Agent + Model + Effort` 在终端沙箱中完成复杂任务 | `accuracy`、`accuracy_ci95_half_width`、Tokens、Cost;schema 另有 `n_trials`、pass@k 等但页面未完整展示 | 固定版本、Agent、Model、Effort 下的终端任务完成率和资源信号 | 66 个任务、当前页面 18 条可见提交;任务持续演进;逐行 n_trials、准确率公式、CI 公式、完整 prompt/tool schema 和模型 snapshot 未公开 |
| Zapier AutomationBench 1.0.6 | Agent 在模拟 SaaS 应用和业务工作流中查找信息、调用工具和改变最终状态 | `task_completed_correctly`/Score、`partial_credit`、Cost/task | 跨应用工具调用、流程遵循、状态一致性和端到端完成信号 | 官方榜单使用 held-out private task set;公开仓库 600-task set 不等价;API mode、effort、fallback 和成本口径存在配置差异 |

## 2. 标准化能力映射

后续 Adapter 应同时保留 benchmark 原始字段和标准化能力标签,不能只保存一个无来源的数值。建议使用以下能力标签:

| 标准化能力 | 直接证据来源 | 允许保存的信号 | 不能替代的能力 |
|---|---|---|---|
| `repository_task_completion` | DeepSWE | 固定 release/harness/task set 的 Pass@1、Pass@4 | 通用生产成功率、计划成功率 |
| `terminal_agent_completion` | Terminal-Bench;Artificial Analysis 的 Terminal-Bench 组成项 | 版本化 accuracy/pass rate,附 Agent、Model、Effort | 裸模型能力、所有终端工作流 |
| `code_execution_correctness` | DeepSWE、Terminal-Bench、Artificial Analysis 的 SciCode/Terminal-Bench 组成项 | verifier/test-based 通过信号,保留任务集和 grader | 代码质量、可维护性、安全性 |
| `agent_tool_orchestration` | Arena Agent、Zapier、Artificial Analysis Agents 类组成项 | 工具调用、恢复、状态完成或 Agent task 信号 | Coding-only 能力和终端正确性 |
| `frontend_visual_preference` | Design Arena Code | 同快照/类别内 Elo、win rate、battles | 编译、测试、后端、仓库级开发 |
| `business_workflow_state_completion` | Zapier AutomationBench | strict all-assertions pass rate,另存 partial_credit | 代码生成、真实 SaaS 生产可靠性 |
| `long_context_understanding` | Artificial Analysis 的 AA-LCR 等组成项 | 官方自身 long-context 指标,附 context 条件 | 任意仓库上下文或 Coding Plan 实际窗口 |
| `observed_workflow_reliability` | Arena Agent | Net Improvement 及五类信号,保留原始方向 | 客观测试通过率 |
| `benchmark_resource_usage` | DeepSWE、Arena、Design Arena、Artificial Analysis、Terminal-Bench、Zapier | cost、tokens、steps、duration,仅作为对应 harness 的描述性信号 | Plan 价格、额度、用户真实成本、跨来源性价比 |

Artificial Analysis 的综合 Index 不应拆成自定义"Coding Plan 总分";其官方权重为 Agents 34%、Coding 24%、Scientific Reasoning 24%、General 18%,其中 Coding 包含 Terminal-Bench v2.1 16% 和 SciCode 8%。使用时应记录完整 `v4.1.1` 和官方权重,不能自行重新加权后仍称为 Artificial Analysis Intelligence Index。来源:[Artificial Analysis 方法说明](https://artificialanalysis.ai/methodology/intelligence-benchmarking)。

## 3. Benchmark Adapter 最小输入/输出

### 3.1 输入字段

```text
source_id
source_url
benchmark_id
benchmark_version
leaderboard_or_dataset_revision
collected_at
published_or_updated_at
model_display_name
model_api_id_or_snapshot (nullable; unknown must stay null)
vendor (nullable; must not be inferred as official when absent)
agent_or_harness
reasoning_effort_or_configuration
metric_name
metric_value
metric_unit
metric_direction
numerator_and_denominator (nullable)
confidence_interval_or_error (nullable)
task_set_description
prompt_policy
tool_environment
context_limit_or_context_description
success_definition
repeat_count
cost_and_token_metadata
license_and_access_notes
evidence_level
comparability_scope
```

未知字段必须显式为 `null` 或 `unknown`,不得用模型展示名猜 API ID、用误差值反推重复次数、用页面成本补齐套餐成本,或用 Vendor 名称补齐缺失 Provider。

### 3.2 输出字段

```text
capability
raw_metric
normalized_metric (nullable)
normalization_method
source_snapshot
subject_identity
conditions
confidence_status
comparability_class
allowed_use: scoring | explanation | exclude
prohibited_inferences
```

`normalized_metric` 只能在来源定义的同一指标空间内生成,例如同一 DeepSWE release 的 Pass@1 或同一 Terminal-Bench 版本的 accuracy。不能把 Elo、Net Improvement、Pass@1、accuracy、strict state pass rate 和综合 Intelligence Index 转成同一 0-100 后声称可直接比较;相同数值范围不代表相同语义。

## 4. 可比性规则

### 4.1 可以直接比较

仅限同时满足以下条件的结果:

- 同一来源、同一 benchmark、同一版本和 task set;
- 同一 leaderboard/revision、grader/verifier 和数据快照;
- 同一模型版本或明确的 immutable model snapshot;
- 同一 Agent/harness、工具环境、system prompt、reasoning effort 和资源条件;
- metric 名称、单位、方向、分母和成功判定相同;
- 重复次数、排除错误规则和 confidence 口径明确;
- 对动态榜单,还必须是同一页面快照或明确记录的同一数据窗口。

典型例子:同一 DeepSWE v1.1 leaderboard 中相同 harness 和 effort 的模型配置;同一 Terminal-Bench 4.0 `4-0-0` 中固定 Agent/Model/Effort 的 accuracy;同一 Design Arena 类别和快照中 battle 数达到相同过滤门槛的 Elo。即使满足这些条件,也应保留误差范围和样本量。

### 4.2 只能归一化后在来源内比较

- 同一来源内不同原始字段只有在维护方公开了转换公式时才能归一化;例如 Artificial Analysis 官方 Index 的组成权重,或 DeepSWE 官方已定义的 Pass@1/Pass@4。
- 方向相反的指标必须明确转换方向,例如 Tool Hallucination 原始发生率越低越好、Bash Recovery 的重试代价和其他 Net Improvement 信号方向不同。
- cost、tokens、steps、duration 只能在相同 harness、价格口径和任务单位下做描述性归一化;不能跨来源建立统一成本分数。
- 同一模型的不同 reasoning effort 是不同配置,不得无权重平均成模型分数。

### 4.3 只能作为参考

以下情况不应进入严格数值排名,但可以进入解释或候选模型筛选:

- Arena Agent 的 live Net Improvement:没有固定 task set,且 baseline 会随时间变化;
- Design Arena 的 Elo/win rate:主观偏好、动态模型池和 active sampling;
- Zapier 官方私有榜单与公开仓库结果之间:private task set 不公开,公开集不能复现官方分数;
- 只有模型展示名、没有 immutable API ID 或 snapshot 的结果;
- 缺失 prompt、工具、上下文、重复次数、分母、错误排除规则或完整 CI 公式的结果;
- 只拥有官方营销性能力声明、第三方转载或没有原始结果的材料。

### 4.4 完全不可比较或必须排除

- 不同来源的原始数值直接互比,例如 Design Arena Elo 与 DeepSWE Pass@1、Arena Net Improvement 与 Terminal-Bench accuracy;
- 不同 benchmark 版本或不同任务集直接拼接成时间序列;
- 将同一模型不同 effort、fallback 组合或不同 Agent 运行器当成同一模型结果;
- 通过结果反推未公开的 API model ID、权重版本、prompt、context window、重复次数、成本公式或 Vendor;
- 把 cost/task、token、duration 或 price/million tokens 直接当作 Coding Plan 月费、额度、SLA 或用户边际成本;
- 把任一模型 benchmark 分数直接当成包含多个模型、动态路由或另有工具限制的 Coding Plan 分数。

## 5. 证据等级与使用范围

| 等级 | 证据条件 | 后续用途 |
|---|---|---|
| A | 官方页面快照、官方 JSON/API 字段、官方仓库代码、grader 或任务定义可直接核验 | 可保存为模型/配置级原始事实;仅在可比条件满足时进入对应能力信号 |
| B | 官方方法说明、README、法律条款和维护方的实验/设计声明 | 可用于指标解释、条件和风险说明;缺少运行细节时不能作为严格排名依据 |
| C | 无法从指定来源核验的模型版本、完整运行条件、第三方转载、营销性外推 | 只能记录为未知或排除,不进入评分 |

当前最适合进入后续"模型能力输入"的是:

- DeepSWE v1.1 的固定配置 Pass@1/Pass@4;
- Terminal-Bench 4.0 的固定 `Agent + Model + Effort` accuracy;
- Artificial Analysis v4.1.1 的官方 Index 或组成评测,但必须保留完整版本和权重;
- Zapier 的严格状态完成率,前提是明确它来自官方私有榜单还是公开集本地运行。

Arena Agent、Design Arena Code 和资源成本字段更适合作为解释信号或偏好匹配信号;只有在 Recommendation Policy 明确声明其适用场景、快照和权重后,才可作为有限的辅助评分输入。任何输入都不能越过模型到 Plan 的事实映射检查。

## 6. Coding Plan 关联规则

1. Benchmark 记录的主体是模型、Agent、harness 或组合配置;Plan 是包含模型、工具、额度、地区和产品政策的独立产品对象。两者必须分开建模。
2. 只有当官方 Plan 数据确认包含同一模型版本或明确可映射的模型条目时,benchmark 结果才能作为该 Plan 的候选能力证据;展示名相似不能完成映射。
3. Plan 包含多个模型时,不得把其中最高分、平均分或某一 Vendor 分数自动当作 Plan 分数。除非后续有公开、稳定的路由比例、模型可用性、工具条件和用户任务分布,否则只能呈现"该 Plan 包含模型的外部能力参考"。
4. Plan 动态替换模型、模型版本、effort 或 fallback 时,旧 benchmark 记录必须保留快照时间并降级时效性,不能继续作为当前能力保证。
5. Plan 的价格、额度、并发、延迟、地区注册/支付/网络限制和服务政策必须来自官方 Plan/Data Provider;benchmark 的 cost、tokens、duration 和价格字段不能补齐这些事实。
6. Recommendation 可以使用 benchmark 解释用户偏好的能力方向,例如仓库修改、终端执行、前端生成或工具编排;不能用 benchmark 单项结果绕过用户的硬约束。

## 7. 风险、缺失条件与未解决问题

- 6 个来源的任务分布和成功判定差异很大:程序化测试、数据库状态、人工偏好、LLM judge、Bradley-Terry/Elo 和用户行为信号不能视为同一成功率。
- 结果具有明显的版本和时间敏感性。DeepSWE、Terminal-Bench、Artificial Analysis 和 Zapier 会更新任务、grader、榜单或模型配置;Arena 和 Design Arena 还会动态改变模型池、样本和 baseline。
- 模型标签不总是 immutable API ID。Arena、Design Arena、Terminal-Bench、Zapier 和部分 Artificial Analysis 数据可能需要额外 API tier 或官方确认才能完成精确版本归属。
- Agent/harness 是重要变量。Terminal-Bench、DeepSWE、Arena 和 Zapier 的结果不能当作裸模型结果;Design Arena Code 明确没有 Agent loop;Artificial Analysis 的组成评测使用不同 harness 和 judge。
- 公开结果不等于可复现结果。Arena 原始 trace 不公开,Zapier 官方私有任务不公开,Terminal-Bench 页面未展示完整逐行 trial 元数据,Artificial Analysis 未公开所有完整合成和运行细节。
- 成本字段口径不统一,且可能受 token 计数、缓存、fallback、环境费用和供应商价格影响;成本只能在来源和配置范围内描述。
- 样本量和不确定性必须保留。battle 数、session 数、task 数、重复次数、排除错误、置信区间和 CI 公式缺失时,不应宣称显著差异或稳定领先。
- 许可和访问限制不能忽略:Arena、Artificial Analysis 和 Design Arena 对自动化访问/商业使用有不同限制;DeepSWE、Terminal-Bench 和 Zapier 的代码许可证也不自动覆盖所有第三方任务、模型输出或私有数据。

**未解决的关键问题**:

1. 如何在不依赖展示名猜测的情况下,将每条 benchmark 模型记录映射到官方 Plan 当前实际可用的模型版本、路由和 fallback?
2. Arena Agent、Design Arena 和 Zapier 官方榜单能否获得适合自动化生产使用的授权、稳定 API 和历史快照?
3. Terminal-Bench 4.0 页面能否公开每条提交的 `n_trials`、accuracy 分母、CI 公式、prompt/tool 配置和完整模型 snapshot?
4. Artificial Analysis 的完整 patch 版本、各组成评测逐模型分数、统一归一化公式和覆盖筛选规则能否通过合适 API tier 获得?
5. DeepSWE manifest 中 `source_dataset = swe-bench-ultra` 与官网任务原创声明的 provenance 差异如何解释?
6. Zapier 官方 private held-out task set 的任务数、运行次数、模型 snapshot、成本公式和公开仓库版本之间的精确对应关系是什么?
7. 后续 Recommendation Policy 需要怎样的模型选择/路由事实,才能把模型级外部证据安全地用于多模型 Plan 的解释,而不是构造未经验证的 Plan 分数?

## 8. 后续实现约束

Benchmark Adapter 必须以来源文件中的快照为输入,保留原始指标和证据等级,不得在 Adapter 中实现跨来源加权、Plan 分数推断、缺失字段猜测或第三方榜单转载。Recommendation Policy 只能读取已通过版本、主体、条件和可比性检查的标准化能力信号;不满足检查的记录只能进入解释或被排除。
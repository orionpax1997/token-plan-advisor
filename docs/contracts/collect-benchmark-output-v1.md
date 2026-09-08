# collect-benchmark 输出契约 v1（冻结）

```yaml
contract_version: 1
status: frozen          # 冻结：变更须显式升版并在「变更记录」登记
frozen_at: 2026-09-08
applies_to: "@token-plan-advisor/core >= 0.1.0（tpa CLI collect-benchmark 的 stdout 机读 JSON）"
```

本契约冻结 ticket 01–04 建立的 `collect-benchmark` 机读 JSON 输出（6 来源：DeepSWE v1.1、Terminal-Bench 4.0、Zapier AutomationBench 1.0.6、Artificial Analysis Intelligence v4.1.1、Arena Agent、Design Arena Code）。`collect` / `collect-all` 的 Plan 契约见 [collect-output-v1.md](collect-output-v1.md)；recommendation / Policy 类契约不在本文件范围（ADR-0001：等后续 ticket 落地后再冻结）。

**版本号口径**：机读文档内的 `schema_version` 是消费方可读的契约锚点；本文件的 `contract_version` 是文档自身的版本。两者同步升版、同值演进（当前均为 1）：升版时先改 Schema 字面量与 `contract-freeze-benchmark.test.ts`，再在本文件「变更记录」登记。

**路径口径**：文中 `src/adapters/…`、`fixtures/…`、`test/…` 均相对 `packages/core/`。

## 契约原则

1. **stdout 只承载机读 JSON**：`collect-benchmark <source>` 输出单个 Benchmark Record Schema v1 文档。错误、用法与进度一律写 stderr。
2. **校验闸**：任何输出必须先通过 `validateBenchmarkCollection`——不仅校验字段形状，还核对：
   - `evidence_level=C` 只能 `exclude`、`B` 不得 `scoring`、`benchmark_resource_usage` 只能 `explanation`（探索 02「证据等级与使用范围」表，schema 内 zod `.check` 强制）；
   - `normalized_metric.metric_space` 必须落在 `<benchmark_id>:<version>:` 前缀内（跨来源/跨版本统一分直接被拒）；
   - `confidence_status` 与 `confidence_interval_or_error` 互为充要；
   - `record_id` 全文档唯一。
   校验不通过的采集内部报错，不以任何 JSON 形式发出。
3. **不猜测**：取不到的事实降级为 `value: null` + 质量状态 + Unresolved Fact，绝不编造数值。模型 API ID、Vendor、上下文窗口、cost_basis、prompt bundle、模型 snapshot 等官方未给出的字段保持 `null + unobtainable`（不是缺失数据，是诚实表达）。
4. **可追溯**：每个字段携带 `source_ids`；`sources` 带三时间戳（采集 / 发布 / 快照）；fixture 模式的 `fetched_at` 取快照 `manifest.json` 的 `captured_at`。
5. **benchmark 记录与 Plan 记录对象独立**：BenchmarkCollection 不引用 PlanCollection、不出现任何 Plan 字段键集（`plans` / `quota_system` / `vendor` / `regional_variant` 等），也不做字段级交叉推断。Plan 的价格、额度、并发、延迟、地区注册/支付/网络限制和服务政策只能由官方 Plan/Data Provider 提供；benchmark 的 cost / token / duration / price_per_million_tokens 字段不补齐 Plan 事实。
6. **禁止推断清单可见**：每条记录的 `prohibited_inferences`（≥1）逐条机读声明本记录不被允许的推断（Plan 成功率、跨 release 拼接、effort 平均、跨来源比较、API ID 反推、cost 混算等），下游消费方可逐字审查。

## `collect-benchmark <source>` 输出（BenchmarkCollection 顶层键集，冻结）

| 键 | 类型 | 语义 |
|---|---|---|
| `schema_version` | `"1"`（字面量） | 契约版本；变更须升版 |
| `collection` | `{adapter_id, mode, collected_at, tool_version}` | 采集元数据；`mode` 仅 `fixture`（本批无自动抓取）；`adapter_id` 与 CLI 注册表一一对应 |
| `benchmark` | `{benchmark_id, benchmark_version, leaderboard_or_dataset_revision, maintainer, source_url, artifact_generated_at, harness, license_and_access_notes}` | benchmark 元数据：版本与 leaderboard/dataset revision 固定可见，harness 锁定为官方指定，许可与访问限制原样保留 |
| `task_set` | `{description, n_tasks, n_repositories, languages[], domains?[]}` | 任务集事实；`domains`（按业务/能力域划分）与 `languages` 并列，可选字段，原值保留官方加权（`weight_percent`） |
| `records` | `BenchmarkRecord[]`（≥1） | 主体身份为 model_configuration 或 benchmark_component（AA Index 权重）；每条记录独立携带 `prohibited_inferences` ≥1 |
| `sources` | `BenchmarkSourceRef[]`（≥1） | 来源清单 + 三时间戳 |
| `unresolved_facts` | `UnresolvedFact[]` | 无法验证 / 缺失 / 冲突 / 需授权的事实 |

`records[].subject_identity` 支持两种 `subject_kind`：

- `model_configuration`：DeepSWE、Terminal-Bench、Zapier、Arena Agent、Design Arena Code 等模型/Agent/effort 组合的分数记录；
- `benchmark_component`：Artificial Analysis Intelligence v4.1.1 等无逐模型分数时，记录主体为 Index 组成评测定义与官方权重。`benchmark_component` 的模型专属字段（API id / vendor / reasoning effort）显式 `null + not_applicable`。

`records[].capability` 为数组（≥1）：一条 benchmark 结果可同时证据多个能力（如 DeepSWE verifier 判定的 Pass@1 同时是 `repository_task_completion` 与 `code_execution_correctness`）；不复制成多条记录，避免后续评分重复计权。

## 9 类标准化能力标签（注册表，冻结）

| 标签 | 直接证据来源 | 允许保存的信号 | 不能替代的能力 |
|---|---|---|---|
| `repository_task_completion` | DeepSWE | 固定 release/harness/task set 的 Pass@1、Pass@4 | 通用生产成功率、计划成功率 |
| `terminal_agent_completion` | Terminal-Bench；Artificial Analysis 的 Terminal-Bench 组成项 | 版本化 accuracy/pass rate，附 Agent、Model、Effort | 裸模型能力、所有终端工作流 |
| `code_execution_correctness` | DeepSWE、Terminal-Bench、Artificial Analysis 的 SciCode / Terminal-Bench 组成项 | verifier/test-based 通过信号，保留任务集和 grader | 代码质量、可维护性、安全性 |
| `agent_tool_orchestration` | Arena Agent、Zapier、Artificial Analysis Agents 类组成项 | 工具调用、恢复、状态完成或 Agent task 信号 | Coding-only 能力和终端正确性 |
| `frontend_visual_preference` | Design Arena Code | 同快照 / 类别内 Elo、win rate、battles | 编译、测试、后端、仓库级开发 |
| `business_workflow_state_completion` | Zapier AutomationBench | strict all-assertions pass rate，另存 partial_credit | 代码生成、真实 SaaS 生产可靠性 |
| `long_context_understanding` | Artificial Analysis 的 AA-LCR 等组成项 | 官方自身 long-context 指标，附 context 条件 | 任意仓库上下文或 Coding Plan 实际窗口 |
| `observed_workflow_reliability` | Arena Agent | Net Improvement 及五类信号，保留原始方向 | 客观测试通过率 |
| `benchmark_resource_usage` | DeepSWE、Arena、Design Arena、Artificial Analysis、Terminal-Bench、Zapier | cost、tokens、steps、duration，仅作为对应 harness 的描述性信号 | Plan 价格、额度、用户真实成本、跨来源性价比 |

## 证据等级 / 可比性分级 / allowed_use 三元门控（冻结）

Schema 在 `BenchmarkRecord` 层强制以下约束（不通过即拒绝发出）：

| 证据等级 evidence_level | 后续用途 allowed_use | 说明 |
|---|---|---|
| **A** | `scoring` / `explanation` / `exclude` | 官方页面、官方 JSON/API 字段、官方仓库代码、grader 或任务定义可直接核验；可比条件满足时可进评分 |
| **B** | `explanation` / `exclude` | 官方方法说明、README、法律条款、维护方的实验 / 设计声明；缺少运行细节时不能作为严格排名依据 |
| **C** | `exclude` | 无法核验的模型版本、完整运行条件、第三方转载、营销性外推；只能记录为未知或排除，不进入任何使用 |

可比性分级 `comparability_class`：

| 分级 | 后续用途 | 说明 |
|---|---|---|
| `direct_same_config` | `scoring` / `explanation` | 同一来源、同一 benchmark、同一版本和 task set；同 leaderboard/revision、grader/verifier；同模型 snapshot；同 harness、prompt、effort |
| `source_internal_normalized` | `scoring` / `explanation` | 同一来源内归一化（如 AA 官方加权方案）；方向相反的指标必须显式声明方向 |
| `reference_only` | `explanation` | 仅作参考（解释/筛选，不进严格数值排名）：Arena Agent、Design Arena Code 等动态/主观类来源 |
| `not_comparable` | `exclude` | 完全不可比较，必须排除：跨来源原始数值、跨 release、不同 effort 平均等 |

资源类信号 `capability` 含 `benchmark_resource_usage` 时，`allowed_use` 强制 `explanation`（仅描述性，不进评分，也不与 Plan 价格额度混算）。

## `normalized_metric` 跨来源/跨版本统一分（禁止，冻结）

- `normalized_metric.metric_space` 必须以 `<benchmark_id>:<benchmark_version>:` 起头；
- 跨来源（DeepSWE Pass@1、Terminal-Bench accuracy、Arena Net Improvement、Design Arena Elo、AA Intelligence Index、Zapier strict 通过率）不得换算到同一 0-100 后声称可直接比较；相同数值范围不代表相同语义；
- 同一来源不同版本（DeepSWE v1 vs v1.1）不得拼接为同口径时间序列；
- 同一模型不同 reasoning effort 是不同配置，不得无权重平均成模型分数；
- 校验闸 `validateBenchmarkCollection` 在 `metric_space` 不满足前缀要求时直接拒绝输出。

## 时间戳语义（双向核对，冻结）

- `collection.collected_at`：本次采集完成时刻（fixture 与 live 均为采集运行时刻）。
- `sources[].fetched_at`：**采集方**抓取时间。fixture 模式 = 快照落盘时刻（`manifest.json` 的 `captured_at`）。
- `sources[].last_updated_at`：**页面 / artifact 自述**的更新 / 发布时间；页面未显示时为 `null`，且 `last_updated_note` 必须注明「以采集时间为准」。
- 双向核对规则：
  - `last_updated_at === null` ⟺ note 含「以采集时间为准」；
  - `last_updated_at !== null` ⟹ note 标注页面显示的时间标签（"Last updated"/"最近更新时间"/"Publication date" 等）；
  - 同一采集内所有来源的 `fetched_at` 同源一致（fixture = 同一 captured_at）。
- 三时间戳在本批 6 来源的覆盖：
  - 有页面自述时间：Terminal-Bench（`hub_updated_at`）、Zapier（`page_published` / `last-modified`）、Arena Agent（`page_updated`）、Artificial Analysis 部分来源（缺则 null + 以采集时间为准）；
  - 仅快照时间：DeepSWE（artifact `generated_at` + fixture `captured_at`）、Design Arena Code（API `captured_at`）。

## benchmark 快照管理流程

1. **采集日期**：每次快照采集在 `fixtures/<source>/manifest.json` 的 `captured_at`（ISO 8601，UTC）登记；`note` 字段记录抓取时间窗与特殊说明。fixture 模式输出的 `fetched_at` 即此值。
2. **存放约定**：`fixtures/<source>/` 平铺存放官方页原始快照；`manifest.json` 的 `sources[]` 逐条登记 `source_id` ↔ `file` ↔ `url` 三元组；`source_id` 与 `src/adapters/<source>/sources.ts` 的来源注册表一一对应，缺条目时装载报错。
3. **fixture 形态的合规边界**（ToS 受限来源的差异化处理）：
   - **DeepSWE / Terminal-Bench / Zapier**：官方 artifacts（leaderboard / tasks / trials / license / README）直接落盘；许可证在 `license_and_access_notes` 原样声明（Apache-2.0、MIT 等），第三方任务/模型输出/私有数据许可单独核查。
   - **Artificial Analysis Intelligence / Arena Agent / Design Arena Code**：网站条款限制自动化查询 / 抓取 / 商业使用聚合数据 / 再分发到第三方（`robots.txt` 与 Terms 显式禁止）。fixture 为官方页面事实的结构化转写（不是页面 HTML 全文），逐项可溯源至 manifest 登记的官方 URL；授权申请为待办（详见各来源 `license_and_access_notes` 与 unresolved_facts）。
4. **刷新步骤**：
   1. 逐条抓取 manifest 登记的官方 URL，覆盖写入对应快照文件（新增/下线来源同步改 `sources.ts` 与 manifest）；ToS 受限来源按上一步结构化转写而非原文落盘；
   2. 更新 `captured_at` 与 `note`；
   3. `pnpm --filter @token-plan-advisor/core test`——全部 Adapter 测试 + CLI 端到端测试 + 校验闸测试 + `contract-freeze-benchmark.test.ts` 必须通过；若线上事实变化导致门控结论变化，同步更新对应断言并在提交说明中注明；
   4. 提交信息注明「fixture 刷新 + 采集日期」。
5. 快照仅作离线回放与回归基线，不代表采集时刻的线上事实；本批无 `--mode live`（动态榜单实时抓取明确 out of scope；探索 02 实现约束）。
6. **授权申请待办跟踪入口**（探索 02 未解决问题 2、3、4、6）：
   - Arena Agent、Design Arena Code、Zapier 官方私有榜单的自动化生产使用授权、稳定 API 与历史快照；
   - Terminal-Bench 4.0 页面是否公开每条提交的 `n_trials`、accuracy 分母、CI 公式、prompt/tool 配置和完整模型 snapshot；
   - Artificial Analysis Intelligence 的完整 patch 版本、各组成评测逐模型分数、统一归一化公式和覆盖筛选规则能否通过合适 API tier 获得；
   - Zapier 官方 private held-out task set 的任务数、运行次数、模型 snapshot、成本公式和公开仓库版本之间的精确对应关系；
   - 各来源授权一旦获取，应在 `unresolved_facts` 中删除对应条目并更新 `license_and_access_notes`，必要时升版本契约。

## 6 来源：采集方式、能力标签、证据等级与使用边界（冻结摘要）

| 来源 | 采集方式 | 标准化能力标签 | 证据等级 | allowed_use | 评注 |
|---|---|---|---|---|---|
| **DeepSWE v1.1** | `tpa collect-benchmark deepswe`（fixture：官方 artifacts 落盘，70 个 leaderboard 配置 × 3 记录） | `repository_task_completion`、`code_execution_correctness`、`benchmark_resource_usage` | A | `scoring`（pass@1/pass@4）+ `explanation`（cost/token/steps/duration 资源聚合） | 固定 release + harness + effort 可直接比较；pass@4 区间未公开（ticket 01 评审：不再借用 pass@1 区间） |
| **Terminal-Bench 4.0 `4-0-0`** | `tpa collect-benchmark terminal-bench`（fixture：Harbor Hub 快照 + 官方 docs，18 个 Agent+Model+Effort 三元组 × 2 记录） | `terminal_agent_completion`、`benchmark_resource_usage` | A | `scoring`（accuracy）+ `explanation`（tokens/cost 资源聚合） | 固定 Agent+Model+Effort 可直接比较；不同 effort 独立 record，不合并为同一模型结果 |
| **Zapier AutomationBench 1.0.6** | `tpa collect-benchmark zapier-automationbench`（fixture：页面 + 官方榜单 + 公开 600-task 仓库，10 行 × 2 记录 + 公开仓库以 `task_set.domains` 表达） | `business_workflow_state_completion`、`benchmark_resource_usage` | A | `explanation`（strict `task_completed_correctly` + cost；ticket 02 评审：dataset source 决策权下游重评估）+ `explanation`（cost） | 私有 held-out 与公开 600-task 仓库为不同数据集标识，禁止跨两者拼接/补齐/换算分数 |
| **Artificial Analysis Intelligence v4.1.1** | `tpa collect-benchmark artificial-analysis-intelligence`（fixture：结构化转写主页 / 方法页 / 详情页 / Data API 文档 / ToS，5 条可映射组成评测的官方权重记录 + 9 项组成评测在 `task_set.domains`） | `agent_tool_orchestration`、`terminal_agent_completion`、`code_execution_correctness`、`long_context_understanding` 等（按官方组成评测映射）+ `benchmark_resource_usage`（无） | A | `explanation`（权重为结构元数据，非可评分分数；保留完整版本与官方权重后可进模型能力输入的 Answer 结论回指 note 字段） | 主页 29_of_624 / 详情页 30_of_612 双视图同时保留；API 版本字段 4.1（无 patch）不替代 `v4.1.1`；未取得 API tier 授权前无逐模型分数 |
| **Arena Agent** | `tpa collect-benchmark arena-agent`（fixture：leaderboard + methodology + agent-mode-help + categories-and-cost + terms + privacy，10 个 leaderboard 行 × 7 记录 = 70） | `agent_tool_orchestration`（Net Improvement）+ `observed_workflow_reliability`（5 类组件信号）+ `benchmark_resource_usage`（P50 cost/token + page-level price） | A | `explanation`（全部） | baseline 漂移、混合 Coding/研究/文档等任务、无固定 task set / prompt / 重复次数、CI 公式未公开均写入 revision / conditions / unresolved_facts；3 条 higher_is_better + 2 条 lower_is_better 不统一换算方向 |
| **Design Arena Code** | `tpa collect-benchmark design-arena-code`（fixture：leaderboard 接口 + registry 接口 + methodology + about + system-prompts + terms + api-docs，10 个 leaderboard 行 × 4 记录 = 40） | `frontend_visual_preference`（Elo / win_rate / battles）+ `benchmark_resource_usage`（avg_generation_time_ms） | A | `explanation`（全部） | 官方 registry 总数 496 ≠ 榜单覆盖数 164 双口径同时保留；active sampling 动态性进入 conditions；battles 门槛（方法页 15 / About 页 50 + 200）分层比较不可强行归一；vendor / API id 显式 null + unobtainable |

## 变更记录

对本契约的任何变更（顶层键集、字段语义、封闭枚举、能力标签注册表、门控规则、时间戳语义、6 来源摘要）必须：

1. 升版 `schema_version`（v1 → v2），Schema 字面量与 `contract-freeze-benchmark.test.ts` 同步更新；
2. 在本节登记：日期、新版本号、变更内容、迁移说明、变更动机；
3. 同步更新全部受影响的 Adapter 与 CLI 测试。

### v1（2026-09-08 冻结）

- 初始冻结：ticket 01–04 建立的 Benchmark Record Schema v1 + 6 个 Benchmark Adapter（DeepSWE v1.1、Terminal-Bench 4.0、Zapier AutomationBench 1.0.6、Artificial Analysis Intelligence v4.1.1、Arena Agent、Design Arena Code）+ `collect-benchmark` CLI 输出 + 三时间戳双向核对 + fixture 快照管理流程 + 授权申请待办跟踪入口。
- 已知局限（记录在案，v1 内不修）：
  - 全部 6 来源以 fixture 模式采集，无 `--mode live`；线上事实变化必须经 fixture 刷新 + 采集日期提交路径（探索 02 实现约束；ToS 受限来源授权申请为待办）；
  - `subject_identity.model_api_id_or_snapshot` 普遍为 `null + unobtainable`：官方榜单标签未声明为不可变 API ID / snapshot，模型→Plan 映射与路由事实为父规格探索未解决问题 1，本批不实现；
  - Artificial Analysis Intelligence 暂无逐模型分数（API tier 未取得）；fixture 仅保存 Index 权重结构与组成评测定义；分数级记录导入时按 Answer「保留完整版本与权重后可进模型能力输入」结论评估 `allowed_use`；
  - Zapier AutomationBench 私有 leaderboard 当前 `allowed_use=explanation`，需在固定 benchmark version + task_set_kind + 单 model/effort/domain 条件下重新评估（ticket 02 §6 决策权下游）；
  - Recommendation Policy、评分、动态权重、跨来源加权与统一 0-100 尺度均不在本契约范围（ADR-0001）；下游消费方不得在本契约未升版的情况下自行实现。
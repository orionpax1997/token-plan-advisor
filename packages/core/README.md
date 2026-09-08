# @token-plan-advisor/core

Coding Plan 信息采集的确定性核心包：**Plan Schema v1**、**Data Provider** 契约、**Benchmark Record Schema v1**、**Benchmark Adapter** 契约与 **tpa CLI**。
架构遵循 [ADR-0001](../../docs/adr/0001-monorepo-core-package-plus-thin-skill.md)——采集与归一化全部在本包的确定性管道内完成，不依赖 LLM；后续 Agent Skill 只经 CLI 调用本包。

领域词汇见仓库根 [CONTEXT.md](../../CONTEXT.md)（Vendor / Plan / Plan Type / Regional Variant / Data Provider / Benchmark Adapter / Evidence Level / Comparability Class / Availability / Official Source / Unresolved Fact）。

## 安装与构建

```bash
pnpm install            # 仓库根
pnpm --filter @token-plan-advisor/core build   # 产出 dist/（tpa CLI）
pnpm --filter @token-plan-advisor/core test    # 构建后跑全部测试
```

## CLI 用法

```bash
tpa collect zai                          # fixture 模式（默认）：使用随包官方快照
tpa collect zai --mode live              # live 模式：实时抓取官方来源
tpa collect zai --pretty                 # 缩进输出（默认单行紧凑 JSON）

tpa collect codebuddy-cn                 # 腾讯云 CodeBuddy 中国站（CNY、北京腾讯云主体）
tpa collect codebuddy-intl               # 腾讯云 CodeBuddy 国际站（USD、新加坡主体）

tpa collect deepseek-api                 # DeepSeek API（CNY、杭州主体、首批 api-usage Plan Type）

tpa collect-all                          # 一次性输出全部 9 个已接入候选 + 覆盖缺口声明
tpa collect-all --pretty
```

已接入 Provider（9 个，覆盖 8 项 coding-subscription + 1 项 api-usage）：`zai`、`codebuddy-cn`、`codebuddy-intl`、`cursor`、`cursor-start-in`、`trae-intl`、`trae-cn`、`gemini-codeassist`、`deepseek-api`。

`deepseek-api` 是本批首个 **api-usage** Plan Type（杭州主体，按 token 计费、峰谷双价、并发限速），与 coding-subscription 不放在同一排行榜直接比较（CONTEXT.md「Plan Type」）；`collect-all` 在 `coverage_scope.api_usage` 单独列出。

### Benchmark 采集（collect-benchmark）

```bash
tpa collect-benchmark deepswe            # DeepSWE v1.1 官方快照导入（无 --mode：本批只有官方快照一种输入）
tpa collect-benchmark deepswe --pretty

tpa collect-benchmark terminal-bench            # Terminal-Bench 4.0 `4-0-0`
tpa collect-benchmark zapier-automationbench    # Zapier AutomationBench 1.0.6
tpa collect-benchmark artificial-analysis-intelligence  # AA Intelligence v4.1.1
tpa collect-benchmark arena-agent               # Arena Agent
tpa collect-benchmark design-arena-code         # Design Arena Code
```

本批已接入 6 个 Benchmark Adapter（[探索 02 Answer](../../.scratch/token-plan-advisor/issues/02-explore-benchmark-sources-and-comparability.md) 限定为这 6 个来源，不引入其他 benchmark）：

| 来源 | 采集 | 能力标签 | 证据等级 | allowed_use | 评注 |
|---|---|---|---|---|---|
| `deepswe` v1.1（Datacurve） | 官方 artifacts 落盘（release / leaderboard-live / tasks / README / LICENSE / run 页），70 个 leaderboard 配置 × 3 记录 | `repository_task_completion`、`code_execution_correctness`、`benchmark_resource_usage` | A | `scoring`（pass@1/pass@4）+ `explanation`（cost/token/steps/duration 资源聚合） | 固定 release + harness + effort 可直接比较；pass@4 区间未公开（不再借用 pass@1 区间） |
| `terminal-bench` 4.0 `4-0-0`（Harbor / Laude Institute） | Harbor Hub 快照 + 官方 docs（README / LICENSE / Harbor 任务结构与运行教程），18 个 Agent+Model+Effort 三元组 × 2 记录 | `terminal_agent_completion`、`benchmark_resource_usage` | A | `scoring`（accuracy）+ `explanation`（tokens/cost 资源聚合） | 固定 Agent+Model+Effort 可直接比较；不同 effort 独立 record，不合并为同一模型结果 |
| `zapier-automationbench` 1.0.6（Zapier） | 页面 + 官方榜单 + 公开 600-task 仓库；10 行 × 2 记录（strict `task_completed_correctly` + cost）；公开 600-task 仓库以 `task_set.domains` 表达（6 domain × 100 tasks） | `business_workflow_state_completion`、`benchmark_resource_usage` | A | `explanation`（strict + cost；dataset source 决策权下游重评估） | 私有 held-out 与公开 600-task 仓库为不同数据集标识，禁止跨两者拼接/补齐/换算分数 |
| `artificial-analysis-intelligence` v4.1.1 | 结构化转写主页 / 方法页 / 详情页 / Data API 文档 / ToS；5 条可映射组成评测的官方权重记录 + 9 项组成评测在 `task_set.domains` 全枚举 | `agent_tool_orchestration`、`terminal_agent_completion`、`code_execution_correctness`、`long_context_understanding` 等（按官方组成评测映射） | A | `explanation`（权重为结构元数据，非可评分分数） | 主页 29_of_624 / 详情页 30_of_612 双视图同时保留；API 版本字段 4.1（无 patch）不替代 `v4.1.1`；未取得 API tier 授权前无逐模型分数 |
| `arena-agent` | leaderboard + methodology + agent-mode-help + categories-and-cost + terms + privacy；10 个 leaderboard 行 × 7 记录 = 70 | `agent_tool_orchestration`（Net Improvement）+ `observed_workflow_reliability`（5 类组件信号）+ `benchmark_resource_usage` | A | `explanation`（全部） | baseline 漂移、混合 Coding/研究/文档等任务、无固定 task set / prompt / 重复次数、CI 公式未公开均写入 revision / conditions / unresolved_facts；3 条 higher_is_better + 2 条 lower_is_better 不统一换算方向 |
| `design-arena-code` | leaderboard 接口 + registry 接口 + methodology + about + system-prompts + terms + api-docs；10 个 leaderboard 行 × 4 记录 = 40 | `frontend_visual_preference`（Elo / win_rate / battles）+ `benchmark_resource_usage`（avg_generation_time_ms） | A | `explanation`（全部） | 官方 registry 总数 496 ≠ 榜单覆盖数 164 双口径同时保留；active sampling 动态性进入 conditions；battles 门槛（方法页 15 / About 页 50 + 200）分层比较不可强行归一；vendor / API id 显式 null + unobtainable |

采集方式分两类（[fixture 管理流程](#benchmark-fixture-快照管理流程)）：

- **直接落盘**（DeepSWE / Terminal-Bench / Zapier）：官方 artifacts 与许可证原文落盘，`license_and_access_notes` 原样声明（Apache-2.0 / MIT 等），第三方任务/模型输出/私有数据许可单独核查；
- **结构化转写**（AA Intelligence / Arena Agent / Design Arena Code）：网站条款限制自动化查询 / 抓取 / 商业使用聚合数据 / 再分发到第三方（`robots.txt` 与 Terms 显式禁止）；fixture 为官方页面事实的结构化转写（不是页面 HTML 全文），逐项可溯源至 manifest 登记的官方 URL；授权申请为待办（详见各来源 `license_and_access_notes` 与 `unresolved_facts`）。

输出为**机读 JSON**（Benchmark Record Schema v1，`schema_version: "1"`）：

- **9 类标准化能力标签**注册表（`repository_task_completion` 等，见 `src/schema/benchmark.ts` 的 `CapabilityTags`）；
- **证据等级 A/B/C** 与 **可比性四级分级**（`direct_same_config / source_internal_normalized / reference_only / not_comparable`）进入 Schema 并与 `allowed_use`（`scoring | explanation | exclude`）强制约束：C 只能 exclude、B 不得 scoring、资源信号（`benchmark_resource_usage`）只能 explanation、完全不可比必须 exclude；
- **`normalized_metric` 只能落在同一 benchmark release 的指标空间内**（`metric_space = <benchmark_id>:<version>:<metric>`，校验闸拒绝跨来源/跨版本统一分）；
- **禁止推断清单**逐条机读（`prohibited_inferences`）：不把 Pass@1/Pass@4 当 Plan 用户成功率、不把 cost/token/steps/duration 与 Plan 价格额度混算、不把 harness 结果当裸模型结果、不把 Elo 当绝对百分比、不跨 battles 门槛直接比较、不重新加权后仍称 Artificial Analysis Index 等；
- **不确定即显式 null**：模型 API ID、Vendor、上下文窗口、cost_basis 等官方未给出的字段保持 `null + unobtainable`（沿用 Plan Schema 的字段级质量状态约定），不猜测、不以展示名或结果反推；
- **benchmark 记录与 Plan 记录对象独立**：BenchmarkCollection 不引用 PlanCollection、字段键集零交叉、resource 记录禁止与 Plan 价格/额度/用户真实成本混算；
- 三时间戳（采集 / 发布 / 快照）沿用核心包约定；fixture 模式下 `fetched_at = manifest captured_at`，`last_updated_at` 双向核对（无页面时间戳时显式标注「以采集时间为准」，有页面时间戳时标注来源标签）。
- **授权申请待办跟踪入口**（探索 02 未解决问题 2、3、4、6）：Arena Agent、Design Arena Code、Zapier 官方私有榜单的自动化生产使用授权；Terminal-Bench 4.0 页面的 n_trials / CI 公式 / prompt/tool 配置 / 模型 snapshot 公开；Artificial Analysis 完整 patch 版本与逐模型分数 API tier；Zapier private held-out task set 的精确对应关系。各来源授权一旦获取，应在 `unresolved_facts` 中删除对应条目并更新 `license_and_access_notes`，必要时升版本契约。

程序化调用：

```ts
import { createDeepSweAdapter, validateBenchmarkCollection } from "@token-plan-advisor/core";

const doc = await createDeepSweAdapter().collect({ now: () => new Date() });
const result = validateBenchmarkCollection(doc); // { ok: true, value } | { ok: false, issues }
```

输出为**机读 JSON**（Plan Schema v1，`schema_version: "1"`），stdout 只承载该文档；错误与用法写 stderr。
输出必须通过 Schema 校验闸才会发出，包含：字段级质量状态、Unresolved Facts、采集时间戳、所用来源与回退链尝试记录。

### 输出契约（v1，已冻结）

- `collect` / `collect-all` 的机读 JSON 契约自 v1 起冻结（ticket 05）：顶层键集、封闭枚举、门控与时间戳语义见 [docs/contracts/collect-output-v1.md](../../docs/contracts/collect-output-v1.md)。任何变更须显式升版并在该文档「变更记录」登记；`test/contract-freeze.test.ts` 钉住契约形状，静默改动会被测试拦截。
- `collect-benchmark` 的机读 JSON 契约自 v1 起冻结：6 来源的 adapter_id 与 fixture mode 锁定、能力标签注册表、证据等级/可比性/allowed_use 三元门控、normalized_metric 跨来源/跨版本统一分禁令、prohibited_inferences 必填、benchmark 记录与 Plan 记录对象独立、9 类能力标签注册表与三时间戳双向核对、6 来源摘要见 [docs/contracts/collect-benchmark-output-v1.md](../../docs/contracts/collect-benchmark-output-v1.md)。`test/contract-freeze-benchmark.test.ts` 钉住契约形状；`test/benchmark-acceptance.test.ts` 钉住 6 来源端到端采集与 benchmark↔Plan 记录独立性验收不变量。

程序化调用：

```ts
import { createZaiProvider, validatePlanCollection } from "@token-plan-advisor/core";

const doc = await createZaiProvider().collect({
  mode: "fixture",
  now: () => new Date(),          // 可注入时钟（确定性测试）
  fetcher: myFetcher,             // live 模式可注入抓取函数
});
const result = validatePlanCollection(doc); // { ok: true, value } | { ok: false, issues }
```

## Plan Schema v1 要点

- **`price_list` 数组**：`standard / starting_at / promotional / discounted` 四类价目，含币种、计费周期与生效区间；金额未知时 `value: null` + `status: "unobtainable"` + `failure_code`。
- **`quota_model` 原语枚举**：`messages_5h / credits_5h_weekly / usd_equivalence / usage_tier / concurrency / relative_multiplier`（探索 01 §7.5.2）。
- **credits × 模型乘数**：`quota_system` 保留官方公式原文（`raw`）与结构化归一化值（除数、各模型 input/cached_input/output 乘数、非高峰折扣、高峰时段定义），原始表达与归一化值均可追溯。
- **模型生命周期**：`model_code` + `release_date` / `deprecation_date` + 档位可用性（`supported / routed / unavailable`；路由目标可追溯）。
- **五维 `regional_availability`**：注册 / 支付 / 网络访问 / 服务政策 / 功能限制逐维建模，禁止合并为单一"支持/不支持"。
- **`data_policy`**：训练用途（按个人/团队区分）、处理地、保留期限、ZDR。
- **三时间戳与双向核对**：每个来源带 `url` + `fetched_at`（采集方抓取时间）+ `last_updated_at`（页面自述更新/发布时间）。页面未显示时间时为 `null` 并显式标注「以采集时间为准」；两类标注的双向一致性由 `test/acceptance.test.ts` 审计。
- **`ranking_gate` 排名门控**：探索 01 [§7.1](../../.scratch/token-plan-advisor/issues/01-explore-coding-plan-official-sources.md) 八项核心字段（价格、Plan 标识与 Plan Type、计费周期、额度原始表达、模型清单、地区支持、隐私/数据、购买入口）缺失时输出 `eligible: false` + 逐项缺失清单与原因——不可进入后续强排名，而非产生错误排名信号。门控由 `attachRankingGate` 从文档内容确定性派生，校验闸强制标记与内容一致。
- **`source_chains` 回退链**：每条链记录首选与备选入口的抓取结果与最终采纳；整链失败时 `chosen_source_id` 为 `null`。失败原因、实际使用的来源与回退路径可从本字段追溯（tpa CLI 输出契约）。
- **字段级质量状态**：`verified / partial / stale / source_conflict / unobtainable / not_applicable`。Schema 强制：
  - 未知（`null` + `unobtainable`）、零值（`0` + `verified`）、不适用（`null` + `not_applicable`）三种状态结构上可区分；
  - 已验证/部分获取/过期/来源冲突的字段必须给出至少一个 `source_id`。

## 新增 Data Provider

1. 在 `src/providers/<vendor>/` 建 `sources.ts`（来源注册表 + 回退链配置；来源种类遵循探索 01 [§7.3](../../.scratch/token-plan-advisor/issues/01-explore-coding-plan-official-sources.md) 的优先级：定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款；同种类内可提供多条候选入口，按 `chains` 数组中声明的优先级顺序逐条尝试）。
2. 实现 `extract.ts`（从官方正文确定性抽取，每个值保留命中原文）与 `normalize.ts`（组装 `PlanCollectionPayload`；抽取不到的降级为 Unresolved Fact，不得猜测；冲突价/限时条款/`LOGIN_REQUIRED` 等进入 `unresolved_facts` 并标记对应 `failure_code`）。
3. 在 `normalize.ts` 调用 `deriveSourceChains(snapshots, chains)` 派生 `source_chains` 字段；provider 出口用 `attachRankingGate(...)` 包装 normalize 结果（门控标记从文档内容自动派生，无需手填）。
4. 抓取官方快照存入 `fixtures/<vendor>/` 并写 `manifest.json`（`captured_at` + 来源清单，见下节）；fixture 与 live 共用同一条归一化路径。
5. 在 `src/cli.ts` 的 `PROVIDER_FACTORIES` 注册，并经 CLI seam 补端到端测试；若新 Provider 触发门控结论变化，同步更新 `test/ranking-gate.test.ts` 的 CLI 断言。

## 新增 Benchmark Adapter

1. 在 `src/adapters/<source>/` 建 `sources.ts`（官方 artifact 注册表，kind 为 `leaderboard_artifact / release_manifest / task_set_artifact / official_docs / official_license`）。
2. 实现 `parse.ts`（官方 artifact 的纯解析层，只做形状守卫与逐字段透传）与 `normalize.ts`（组装 `BenchmarkCollection`；能力标签只能从 9 类注册表中选；不确定的字段显式 null，不猜测；资源类信号只能 `allowed_use=explanation`；scoring 记录必须在 `prohibited_inferences` 显式声明不得当 Plan 成功率）。
3. 抓取官方快照存入 `fixtures/<source>/` 并写 `manifest.json`；本批 benchmark 采集只有 fixture 一种输入（动态榜单实时抓取明确 out of scope）。ToS 受限来源（AA / Arena / Design Arena）按结构化转写而非原文落盘，授权申请为待办（见 `license_and_access_notes` 与 `unresolved_facts`）。
4. 在 `src/cli.ts` 的 `BENCHMARK_ADAPTER_FACTORIES` 注册，并经 CLI seam 补端到端测试；同步更新 `test/contract-freeze-benchmark.test.ts` 的来源摘要（新增来源、allowed_use 门控、comparability_class、可映射能力标签）。

## fixture 快照管理流程

快照仅作离线回放与回归基线，不代表采集时刻的线上事实；需要当前事实请用 `--mode live`。

### Plan Provider fixture（`collect` / `collect-all`）

- **采集日期**：每次采集在 `fixtures/<provider>/manifest.json` 的 `captured_at`（ISO 8601，UTC）登记，`note` 记录抓取时间窗与特殊说明；fixture 模式输出的 `fetched_at` 即此值。
- **存放约定**：`fixtures/<provider>/` 平铺存放官方页原始快照；manifest 的 `sources[]` 逐条登记 `source_id` ↔ `file` ↔ `url`，与 `sources.ts` 注册表一一对应，缺条目时装载报错。
- **刷新步骤**：
  1. 逐条抓取 manifest 登记的官方 URL，覆盖写入对应快照文件（新增/下线来源同步改 `sources.ts` 与 manifest）；
  2. 更新 `captured_at` 与 `note`；
  3. `pnpm --filter @token-plan-advisor/core test`——全部测试（含 `ranking-gate.test.ts` 的门控结论断言）必须通过，线上事实变化导致结论变化时同步更新断言；
  4. 提交信息注明「fixture 刷新 + 采集日期」。
- **实时冒烟**：设 `TPA_LIVE_SMOKE=1` 运行 `test/live-smoke.test.ts`，对 z.ai 与 Gemini Code Assist 两项发起真实网络采集，验证 live 路径端到端可用（日常测试套件默认跳过，不依赖网络）。

### benchmark fixture（`collect-benchmark`）

- **采集日期**：每次采集在 `fixtures/<source>/manifest.json` 的 `captured_at`（ISO 8601，UTC）登记；fixture 模式输出的 `fetched_at` 即此值。`note` 字段记录抓取时间窗与特殊说明。
- **存放约定**：`fixtures/<source>/` 平铺存放官方 artifact / 结构化转写；`manifest.json` 的 `sources[]` 逐条登记 `source_id` ↔ `file` ↔ `url`，与 `src/adapters/<source>/sources.ts` 一一对应，缺条目时装载报错。
- **合规边界**（ToS 受限来源的差异化处理）：
  - **DeepSWE / Terminal-Bench / Zapier**：官方 artifacts（leaderboard / tasks / trials / license / README）直接落盘；许可证在 `license_and_access_notes` 原样声明（Apache-2.0、MIT 等），第三方任务/模型输出/私有数据许可单独核查。
  - **Artificial Analysis Intelligence / Arena Agent / Design Arena Code**：网站条款限制自动化查询 / 抓取 / 商业使用聚合数据 / 再分发到第三方（`robots.txt` 与 Terms 显式禁止）。fixture 为官方页面事实的结构化转写（不是页面 HTML 全文），逐项可溯源至 manifest 登记的官方 URL；授权申请为待办。
- **刷新步骤**：
  1. 逐条抓取 manifest 登记的官方 URL，覆盖写入对应快照文件（新增/下线来源同步改 `sources.ts` 与 manifest）；ToS 受限来源按上一步结构化转写而非原文落盘；
  2. 更新 `captured_at` 与 `note`；
  3. `pnpm --filter @token-plan-advisor/core test`——全部 Adapter 测试 + CLI 端到端测试 + `contract-freeze-benchmark.test.ts` + `benchmark-acceptance.test.ts` 必须通过；若线上事实变化导致门控结论变化，同步更新对应断言并在提交说明中注明；
  4. 提交信息注明「fixture 刷新 + 采集日期」。
- **授权申请待办**：Arena Agent、Design Arena Code、Zapier 官方私有榜单、Terminal-Bench n_trials / CI 公式、Artificial Analysis 完整 patch + 逐模型分数等授权一旦获取，在 `unresolved_facts` 删除对应条目并更新 `license_and_access_notes`，必要时升版本契约（[变更记录](../../docs/contracts/collect-benchmark-output-v1.md#变更记录)）。

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

tpa collect-all                          # 一次性输出全部 8 个已接入候选 + 覆盖缺口声明
tpa collect-all --pretty
```

已接入 Provider（8 个 Regional Variant，覆盖 7 项 coding-subscription 候选）：`zai`、`codebuddy-cn`、`codebuddy-intl`、`cursor`、`cursor-start-in`、`trae-intl`、`trae-cn`、`gemini-codeassist`。

### Benchmark 采集（collect-benchmark）

```bash
tpa collect-benchmark deepswe            # DeepSWE v1.1 官方快照导入（无 --mode：本批只有官方快照一种输入）
tpa collect-benchmark deepswe --pretty
```

已接入 Benchmark Adapter：

- `deepswe`（Datacurve DeepSWE v1.1，70 个 leaderboard 配置 × 3 条记录：pass@1 / pass@4 / 资源聚合）；
- `terminal-bench`（Terminal-Bench 4.0 `4-0-0`，18 个 Agent+Model+Effort 三元组 × 2 条记录）；
- `zapier-automationbench`（Zapier AutomationBench 1.0.6，私有 held-out 榜单 10 行 × 2 条记录，公开 600-task 仓库以 `task_set.domains` 表达）；
- `artificial-analysis-intelligence`（Artificial Analysis Intelligence v4.1.1：完整版本与官方权重随每条记录保存，5 条可映射组成评测的官方权重记录 + 9 个组成评测在 `task_set.domains` 全枚举；Index 与组成评测独立保存，禁止重新加权后仍称 Artificial Analysis Index 或拆成 Coding Plan 总分；主页/详情页覆盖数差异按快照差异双视图保存；ToS 限制自动化访问/商业使用，fixture 为结构化转写，授权申请为待办）。

输出为**机读 JSON**（Benchmark Record Schema v1，`schema_version: "1"`）：

- **9 类标准化能力标签**注册表（`repository_task_completion` 等，见 `src/schema/benchmark.ts` 的 `CapabilityTags`）；
- **证据等级 A/B/C** 与 **可比性四级分级**（`direct_same_config / source_internal_normalized / reference_only / not_comparable`）进入 Schema 并与 `allowed_use`（`scoring | explanation | exclude`）强制约束：C 只能 exclude、B 不得 scoring、资源信号（`benchmark_resource_usage`）只能 explanation、完全不可比必须 exclude；
- **`normalized_metric` 只能落在同一 benchmark release 的指标空间内**（`metric_space = <benchmark_id>:<version>:<metric>`，校验闸拒绝跨来源/跨版本统一分）；
- **禁止推断清单**逐条机读（`prohibited_inferences`）：不把 Pass@1/Pass@4 当 Plan 用户成功率、不把 cost/token/steps/duration 与 Plan 价格额度混算、不把 harness 结果当裸模型结果等；
- **不确定即显式 null**：模型 API ID、Vendor、上下文窗口、cost_basis 等官方未给出的字段保持 `null + unobtainable`（沿用 Plan Schema 的字段级质量状态约定），不猜测、不以展示名或结果反推；
- 三时间戳（采集 / 发布 / 快照）沿用核心包约定。

程序化调用：

```ts
import { createDeepSweAdapter, validateBenchmarkCollection } from "@token-plan-advisor/core";

const doc = await createDeepSweAdapter().collect({ now: () => new Date() });
const result = validateBenchmarkCollection(doc); // { ok: true, value } | { ok: false, issues }
```

输出为**机读 JSON**（Plan Schema v1，`schema_version: "1"`），stdout 只承载该文档；错误与用法写 stderr。
输出必须通过 Schema 校验闸才会发出，包含：字段级质量状态、Unresolved Facts、采集时间戳、所用来源与回退链尝试记录。

### 输出契约（v1，已冻结）

`collect` / `collect-all` 的机读 JSON 契约自 v1 起冻结（ticket 05）：顶层键集、封闭枚举、门控与时间戳语义见 [docs/contracts/collect-output-v1.md](../../docs/contracts/collect-output-v1.md)。任何变更须显式升版并在该文档「变更记录」登记；`test/contract-freeze.test.ts` 钉住契约形状，静默改动会被测试拦截。

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
2. 实现 `parse.ts`（官方 artifact 的纯解析层，只做形状守卫与逐字段透传）与 `normalize.ts`（组装 `BenchmarkCollection`；能力标签只能从 9 类注册表中选；不确定的字段显式 null，不猜测）。
3. 抓取官方快照存入 `fixtures/<source>/` 并写 `manifest.json`；本批 benchmark 采集只有 fixture 一种输入（动态榜单实时抓取明确 out of scope）。
4. 在 `src/cli.ts` 的 `BENCHMARK_ADAPTER_FACTORIES` 注册，并经 CLI seam 补端到端测试。

## fixture 快照管理流程

快照仅作离线回放与回归基线，不代表采集时刻的线上事实；需要当前事实请用 `--mode live`。

- **采集日期**：每次采集在 `fixtures/<provider>/manifest.json` 的 `captured_at`（ISO 8601，UTC）登记，`note` 记录抓取时间窗与特殊说明；fixture 模式输出的 `fetched_at` 即此值。
- **存放约定**：`fixtures/<provider>/` 平铺存放官方页原始快照；manifest 的 `sources[]` 逐条登记 `source_id` ↔ `file` ↔ `url`，与 `sources.ts` 注册表一一对应，缺条目时装载报错。
- **刷新步骤**：
  1. 逐条抓取 manifest 登记的官方 URL，覆盖写入对应快照文件（新增/下线来源同步改 `sources.ts` 与 manifest）；
  2. 更新 `captured_at` 与 `note`；
  3. `pnpm --filter @token-plan-advisor/core test`——全部测试（含 `ranking-gate.test.ts` 的门控结论断言）必须通过，线上事实变化导致结论变化时同步更新断言；
  4. 提交信息注明「fixture 刷新 + 采集日期」。
- **实时冒烟**：设 `TPA_LIVE_SMOKE=1` 运行 `test/live-smoke.test.ts`，对 z.ai 与 Gemini Code Assist 两项发起真实网络采集，验证 live 路径端到端可用（日常测试套件默认跳过，不依赖网络）。

# @token-plan-advisor/core

Coding Plan 信息采集的确定性核心包：**Plan Schema v1**、**Data Provider** 契约与 **tpa CLI**。
架构遵循 [ADR-0001](../../docs/adr/0001-monorepo-core-package-plus-thin-skill.md)——采集与归一化全部在本包的确定性管道内完成，不依赖 LLM；后续 Agent Skill 只经 CLI 调用本包。

领域词汇见仓库根 [CONTEXT.md](../../CONTEXT.md)（Vendor / Plan / Plan Type / Regional Variant / Data Provider / Availability / Official Source / Unresolved Fact）。

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
```

输出为**机读 JSON**（Plan Schema v1，`schema_version: "1"`），stdout 只承载该文档；错误与用法写 stderr。
输出必须通过 Schema 校验闸才会发出，包含：字段级质量状态、Unresolved Facts、采集时间戳与所用来源。

> 注意：`collect` 输出契约的正式冻结在 [ticket 05](../../.scratch/core-coding-plan-collection/issues/05-acceptance-contract-freeze.md)；冻结前字段仍可能随后续 Provider（ticket 02–04）需要而增补，增补会升版说明。

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
- **三时间戳**：每个来源带 `url` + `fetched_at`（采集方抓取时间）+ `last_updated_at`（页面自述更新/发布时间，页面未显示时为 `null` 并注明以采集时间为准）。
- **字段级质量状态**：`verified / partial / stale / source_conflict / unobtainable / not_applicable`。Schema 强制：
  - 未知（`null` + `unobtainable`）、零值（`0` + `verified`）、不适用（`null` + `not_applicable`）三种状态结构上可区分；
  - 已验证/部分获取/过期/来源冲突的字段必须给出至少一个 `source_id`。

## 新增 Data Provider

1. 在 `src/providers/<vendor>/` 建 `sources.ts`（来源注册表；来源种类遵循探索 01 [§7.3](../../.scratch/token-plan-advisor/issues/01-explore-coding-plan-official-sources.md) 的优先级：定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款；按种类选择替代入口的回退链在 ticket 02 落地）。
2. 实现 `extract.ts`（从官方正文确定性抽取，每个值保留命中原文）与 `normalize.ts`（组装 `PlanCollection`；抽取不到的降级为 Unresolved Fact，不得猜测）。
3. 抓取官方快照存入 `fixtures/<vendor>/` 并写 `manifest.json`（`captured_at` + 来源清单）；fixture 与 live 共用同一条归一化路径。
4. 在 `src/cli.ts` 的 `PROVIDER_FACTORIES` 注册，并经 CLI seam 补端到端测试。

## fixture 快照约定

`fixtures/zai/` 内为直接抓取自官方 URL 的原始快照；`manifest.json` 的 `captured_at` 是 fixture 模式输出的 `fetched_at`（当前快照于 2026-09-07 UTC 抓取）。快照仅作离线回放与回归基线，不代表采集时刻的线上事实；需要当前事实请用 `--mode live`。快照刷新流程与验收门控在 [ticket 05](../../.scratch/core-coding-plan-collection/issues/05-acceptance-contract-freeze.md) 落地。

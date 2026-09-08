# collect 输出契约 v1（冻结）

```yaml
contract_version: 1
status: frozen          # 冻结：变更须显式升版并在「变更记录」登记
frozen_at: 2026-09-08
applies_to: "@token-plan-advisor/core >= 0.1.0（tpa CLI collect / collect-all 的 stdout 机读 JSON）"
```

本契约冻结 ticket 01–05 建立的 `collect` 机读 JSON 输出。`recommend` / 分析类契约不在本文件范围（ADR-0001：等探索 02 落地后再冻结）。

**版本号口径**：机读文档内的 `schema_version` 是消费方可读的契约锚点；本文件的 `contract_version` 是文档自身的版本。两者同步升版、同值演进（当前均为 1）：升版时先改 Schema 字面量与 `contract-freeze.test.ts`，再在本文件「变更记录」登记。

**路径口径**：文中 `src/providers/…`、`fixtures/…`、`test/…` 均相对 `packages/core/`。

## 契约原则

1. **stdout 只承载机读 JSON**：`collect` 输出单个 Plan Schema v1 文档；`collect-all` 输出单个汇总文档。错误、用法与进度一律写 stderr。
2. **校验闸**：任何输出必须先通过 `validatePlanCollection`——不仅校验字段形状，还核对 `ranking_gate` 与文档内容一致（门控标记不可撒谎）。校验不通过的采集内部报错，不以任何 JSON 形式发出。
3. **不猜测**：取不到的事实降级为 `value: null` + 质量状态 + 失败分类 + Unresolved Fact，绝不编造数值。
4. **可追溯**：每个字段携带 `source_ids`；`sources` 带三时间戳；`source_chains` 记录回退路径；fixture 模式的 `fetched_at` 取快照 `manifest.json` 的 `captured_at`。

## `collect <provider>` 输出（PlanCollection 顶层键集，冻结）

| 键 | 类型 | 语义 |
|---|---|---|
| `schema_version` | `"1"`（字面量） | 契约版本；变更须升版 |
| `collection` | `{provider_id, mode, collected_at, tool_version}` | 采集元数据；`mode` = `fixture \| live`；`collected_at`/`tool_version` 为 ISO 时间与包版本 |
| `vendor` | `{vendor_id, display_name}` | 商业主体（同一公司的不同 Regional Variant 共享 vendor） |
| `regional_variant` | `{variant_id, operator_entity, jurisdiction} \| null` | 独立运营的地区变体 |
| `payment` | `{methods[], notes[]}` | 官方支付通道与重要限制原文 |
| `quota_system` | 采集级额度体系 | `quota_model` 原语 + 官方公式原文（raw）+ 模型/MCP 乘数 + 非高峰折扣 |
| `models` | `ModelEntry[]` | 模型清单与档位绑定（`supported/routed/unavailable`） |
| `plans` | `Plan[]`（≥1） | 档位：`price_list`、`quota`、`data_policy`、`purchase_url` 等 |
| `regional_availability` | `RegionalAvailability[]` | 五维独立建模（注册/支付/网络/服务政策/功能限制） |
| `promotions` | `Promotion[]` | 限时促销（quota/price，带生效区间） |
| `sources` | `SourceRef[]`（≥1） | 来源清单 + 三时间戳（见下） |
| `source_chains` | `SourceChainRef[]` | 回退链尝试记录与最终采纳 |
| `unresolved_facts` | `UnresolvedFact[]` | 无法验证/冲突/需登录等事实，带 `failure_code` |
| `ranking_gate` | `{eligible, missing_core_fields[]}` | §7.1 八项核心字段门控标记（语义见下） |

## `collect-all` 输出（顶层键集，冻结）

| 键 | 类型 | 语义 |
|---|---|---|
| `schema_version` | `"1"` | 契约版本 |
| `collected_at` / `tool_version` / `mode` | 汇总元数据 | 同上 |
| `coverage_scope` | `{plan_types[], coding_subscription: {count, providers[]}, api_usage: {count, providers[]}}` | 按 Plan Type 分桶的采集覆盖范围：本批 8 项 coding-subscription + 1 项 api-usage（deepseek-api）；同一 Plan Type 内的 Provider 才有可比性，不同 Plan Type 不默认放入同一排行榜直接比较（CONTEXT.md「Plan Type」） |
| `coverage_gaps` | `{name, reason}[]` | 尚未接入的候选与原因（不宣称市场完整） |
| `errors` | `{provider_id, error}[]` | 单 Provider 失败不阻塞他项；全部失败才退出码 1 |
| `collections` | `Record<provider_id, PlanCollection>` | 各 Provider 的完整采集文档 |

## ranking_gate 门控语义（探索 01 §7.1，冻结）

`eligible=false` 表示存在核心字段缺口，该采集**不可进入后续强排名**，只能作为参考候选；缺口逐项列出 `field_id` + 具体原因（点名缺失的 Plan / 模型 / 地区）。判定规则：

| field_id | 判定为「齐备」的条件 |
|---|---|
| `price` | 每个 Plan 至少一条金额+币种齐备的价格条目 |
| `plan_identity` | plans 非空，且每个 Plan 的 plan_id / plan_name 非空、plan_type 在受控词表内（coding-subscription / general-subscription / api-usage） |
| `billing_period` | 每个 Plan 的 price_list 非空（条目级周期由 Schema 强制） |
| `quota_expression` | 每个 Plan 至少一条「原始表达(raw)或有效数值」的额度条目；数值未获取但有官方原文不算缺失 |
| `model_catalog` | models 非空且每个模型至少一条与 Plan 的绑定关系 |
| `regional_support` | 至少一个地区有官方明确维度（非 unconfirmed）。门控只核对「存在官方地区结论」这一门槛：地区覆盖面与排除清单的完整性属下游分析职责，不在门控判定内 |
| `privacy_data` | 每个 Plan 的 data_policy 四项（训练用途/处理地/保留期/ZDR）至少一项可获取 |
| `purchase_entry` | 每个 Plan 的 purchase_url 非空 |

门控标记由 `attachRankingGate` 从文档内容确定性派生，`validatePlanCollection` 强制声明值与派生值逐项一致（eligible + 全部缺口条目的 field_id 与 reason）——门控标记不可能脱离文档内容单独填报，reason 文案变更同样视为契约内容变更（reason 是机读缺口清单的一部分，逐字符可重现）。

## 时间戳语义（双向核对，冻结）

- `collection.collected_at`：本次采集完成时刻（fixture 与 live 均为采集运行时刻）。
- `sources[].fetched_at`：**采集方**抓取时间。live 模式 = 本次抓取时刻；fixture 模式 = 快照落盘时刻（`manifest.json` 的 `captured_at`）。
- `sources[].last_updated_at`：**页面自述**的更新/发布时间；页面未显示时为 `null`，且 `last_updated_note` 必须注明「以采集时间为准」。
- 双向核对规则（验收审计 `test/acceptance.test.ts` 强制）：
  - `last_updated_at === null` ⟺ note 含「以采集时间为准」；
  - `last_updated_at !== null` ⟹ note 标注页面显示的时间标签（"Last updated"/"最近更新时间"/"Publication date" 等）；
  - 同一采集内所有来源的 `fetched_at` 同源一致（fixture=同一 captured_at；live=同一采集时钟）。

## fixture 快照管理流程

1. **采集日期**：每次快照采集在 `fixtures/<provider>/manifest.json` 的 `captured_at`（ISO 8601，UTC）登记；`note` 字段记录抓取时间窗与特殊说明。fixture 模式输出的 `fetched_at` 即此值。
2. **存放约定**：`fixtures/<provider>/` 平铺存放官方页原始快照；`manifest.json` 的 `sources[]` 逐条登记 `source_id` ↔ `file` ↔ `url` 三元组；`source_id` 与 `src/providers/<vendor>/sources.ts` 的来源注册表一一对应，缺条目时装载报错。
3. **刷新步骤**：
   1. 逐条抓取 manifest 登记的官方 URL，覆盖写入对应快照文件（新增/下线来源同步改 `sources.ts` 与 manifest）；
   2. 更新 `captured_at` 与 `note`；
   3. `pnpm --filter @token-plan-advisor/core test`——全部 Provider 测试与门控结论测试（`test/ranking-gate.test.ts` 的 CLI 断言）必须通过；若线上事实变化导致门控结论变化，同步更新对应断言并在提交说明中注明；
   4. 提交信息注明「fixture 刷新 + 采集日期」。
4. 快照仅作离线回放与回归基线，不代表采集时刻的线上事实；需要当前事实用 `--mode live`。实时抓取冒烟验证见 `test/live-smoke.test.ts`（设 `TPA_LIVE_SMOKE=1` 启用，覆盖 z.ai 与 Gemini Code Assist 两项）。

## 变更记录

对本契约的任何变更（顶层键集、字段语义、封闭枚举、门控规则、时间戳语义）必须：

1. 升版 `schema_version`（v1 → v2），Schema 字面量与 `contract-freeze.test.ts` 同步更新；
2. 在本节登记：日期、新版本号、变更内容、迁移说明、变更动机；
3. 同步更新全部受影响的 Provider 与 CLI 测试。

### v1（2026-09-08 冻结）

- 初始冻结：ticket 01–05 建立的 Plan Schema v1 + `collect`/`collect-all` 输出 + `ranking_gate` 门控 + 三时间戳双向核对 + fixture 管理流程。

### v1.1（2026-09-09 补丁：deepseek-api 接入与 coverage_scope 按 Plan Type 分桶）

- **变更动机**：本批接入首个 api-usage Provider（`deepseek-api`），与 coding-subscription 不同 Plan Type 不默认放入同一排行榜直接比较（CONTEXT.md「Plan Type」）。
- **collect-all 输出字段变更**：`coverage_scope` 由扁平 `{plan_type, count, providers[]}` 改为按 Plan Type 分桶的嵌套结构：
  - 旧：`{ plan_type: "coding-subscription", count: 8, providers: [...] }`
  - 新：`{ plan_types: ["coding-subscription", "api-usage"], coding_subscription: { count, providers[] }, api_usage: { count, providers[] } }`
  - `PlanCollection` 顶层键集、字段语义、封闭枚举、`ranking_gate` 门控、三时间戳双向核对、fixture 管理流程均未变化。
- **collect 输出（PlanCollection）字段无变化**：`deepseek-api` 仍走同一 Schema v1，仅 `plans[]` 元素的 `plan_type: "api-usage"`、`quota.quota_model: "concurrency"`、`price_list[].billing_period: "one_time"` 与既有 coding-subscription 形态不同；类型与枚举已存在于 v1，无需升版。
- **迁移说明**：
  - `test/contract-freeze.test.ts`：`coverage_scope` 断言改为检查嵌套结构（`coding_subscription.count === 8 && api_usage.providers.includes("deepseek-api")`）；
  - `test/collect-all.test.ts`：`coverage_scope` 形状断言同步；
  - `test/ranking-gate.test.ts`：ELIGIBLE 集合新增 `deepseek-api`，总 collection 数从 8 改为 9。
- 不属于 v1 → v2 升版：仅 `collect-all` 的 `coverage_scope` 字段形态调整，未触动 Plan Schema v1、Schema 枚举、门控语义；现有测试已同步覆盖新形态。

- 已知局限（记录在案，v1 内不修）：
  - `quota_model: credits_5h_weekly` 被 CodeBuddy 双区与 Trae CN 复用于**月度积分**体系（枚举缺月度积分原语的折中，ticket 04 引入）；真实窗口以各 `quota.windows[].window_type` 为准，`quota_system.unit` 携带官方单位名。如需拆分专用原语须升版 v2。
  - Gemini Code Assist 的 `usage_tier` 原语复用于「日请求分档」限额（`messages_5h` 因无 5h 窗口语义不可用）；窗口口径以 `windows[].window_type: daily` 为准。
  - DeepSeek API 的 `billing_period: "one_time"` 表示「per-token」计费（无订阅周期）；与 monthly/quarterly/annual 等订阅周期并列于封闭枚举内，语义自洽；若未来引入 burst/credits 等其他原语需扩 BillingPeriods。
- `recommend` / 分析类 CLI 契约：未冻结（按 ADR-0001 等探索 02 落地后另立契约文件）。

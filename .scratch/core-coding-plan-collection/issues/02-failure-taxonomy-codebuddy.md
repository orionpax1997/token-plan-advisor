# 02: 失败分类与来源回退链 + CodeBuddy 双区 Provider

**What to build:** 在 Data Provider 契约中实现 [探索 01](../../token-plan-advisor/issues/01-explore-coding-plan-official-sources.md) §7.4 的失败分类枚举与 §7.3 的来源优先级回退链（pricing → docs → changelog/legal → console），并以腾讯 CodeBuddy 国内/国际双区为载体验证冲突与时效场景：同产品新旧价页并存的 `STALE_CONFLICT`、限时促销的 `TIME_DEPENDENT` 生效日期、双主体双币、`LOGIN_REQUIRED`。来源事实以 [research/03](../../token-plan-advisor/research/03-tencent-codebuddy.md) 为准。冲突与缺口必须体现在 CLI 输出的质量状态与 Unresolved Fact 中，不得静默择一。

**Blocked by:** 01（核心包脚手架与 Plan Schema v1）

**Status:** ready-for-agent

- [x] 失败分类枚举进入 Provider 契约，失败原因、实际使用的来源与回退路径可从 CLI 输出追溯
- [x] 回退链按来源优先级工作；首选来源失败时自动尝试替代入口并记录每次尝试结果
- [x] CodeBuddy 国内/国际作为 `regional_variant` 独立建模（新加坡主体 vs 国内主体、CNY vs USD），不合并为单一 Vendor 结论
- [x] 1749/126592 旧价口径与 109769 新三档并存的 `STALE_CONFLICT` 被显式标记为待核实，不静默采用其一
- [x] 限时促销（如双倍 Credits 活动区间）带生效日期采集，输出中与标准价可区分
- [x] 需登录才能确认的字段（如年付实际单价）标记 `LOGIN_REQUIRED` 并进入 Unresolved Fact，等待用户补充而非猜测
- [x] fixture 端到端测试经 CLI seam 验证上述外部行为

## Comments

**2026-09-08 实现**（`packages/core`，CodeBuddy CN/Intl 双 Provider + 回退链机制）：

- Schema 新增 `SourceChainRef`/`SourceChainAttempt`：输出顶层 `source_chains[]` 记录每条链的逐次尝试（`source_id`/`kind`/`ok`/`failure_code`/`http_status`）与 `chosen_source_id`；链级状态与字段级 `source_ids` 均可从 CLI 输出追溯到具体来源。
- 回退链同时驱动两层：**extract 层**按链优先级选正文（`pickBodyByChain`，首个非空正文胜出）；**normalize 层**经 `deriveSourceChains` 得到 `ChainResolution`，字段 `source_ids` 取链上实际胜出的来源而非原始候选列表。整链失败时 `chosen_source_id` 为 null 且不阻断其他链（有测试）。
- 双区建模：共享 `vendor_id: tencent-cloud`，`variant_id` 区分 `codebuddy-cn`（腾讯云计算（北京）有限责任公司，CNY）与 `codebuddy-intl`（Tencent Cloud International Pte. Ltd.（新加坡），USD），各自独立 sources/chains/快照。
- `STALE_CONFLICT`：CN 计费概述（126592）旧价 58 元/月与版本说明（109769）新三档并存，完整事实描述同时引用两个文档号，不静默择一。
- `TIME_DEPENDENT`：双倍 Credits 促销以 `promotions[]` 带 `effective_from/until`（2026-07-01~09-30）采集，与标准价可区分；老用户保价（2026-12-31 前按旧价续费）作为过渡条款单列。
- `LOGIN_REQUIRED`：年付实际单价、各模型 Credits 消耗明细、企业版 Credits 扣减规则三项进入 Unresolved Facts，等待用户补充。
- 测试 63 项全绿（`pnpm --filter @token-plan-advisor/core test`），其中新增 CN Provider 10、Intl Provider 10、回退链行为 7；fixture 快照为 2026-09-07 抓取的官方页面原文（CN 6 来源、Intl 5 来源）。
- 已知技术债：`verified<T>`/`unobtainable<T>` 辅助函数在三个 normalize.ts 中重复，候选提取到 `providers/_field.ts`（不阻塞）。

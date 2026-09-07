# 02: 失败分类与来源回退链 + CodeBuddy 双区 Provider

**What to build:** 在 Data Provider 契约中实现 [探索 01](../../token-plan-advisor/issues/01-explore-coding-plan-official-sources.md) §7.4 的失败分类枚举与 §7.3 的来源优先级回退链（pricing → docs → changelog/legal → console），并以腾讯 CodeBuddy 国内/国际双区为载体验证冲突与时效场景：同产品新旧价页并存的 `STALE_CONFLICT`、限时促销的 `TIME_DEPENDENT` 生效日期、双主体双币、`LOGIN_REQUIRED`。来源事实以 [research/03](../../token-plan-advisor/research/03-tencent-codebuddy.md) 为准。冲突与缺口必须体现在 CLI 输出的质量状态与 Unresolved Fact 中，不得静默择一。

**Blocked by:** 01（核心包脚手架与 Plan Schema v1）

**Status:** ready-for-agent

- [ ] 失败分类枚举进入 Provider 契约，失败原因、实际使用的来源与回退路径可从 CLI 输出追溯
- [ ] 回退链按来源优先级工作；首选来源失败时自动尝试替代入口并记录每次尝试结果
- [ ] CodeBuddy 国内/国际作为 `regional_variant` 独立建模（新加坡主体 vs 国内主体、CNY vs USD），不合并为单一 Vendor 结论
- [ ] 1749/126592 旧价口径与 109769 新三档并存的 `STALE_CONFLICT` 被显式标记为待核实，不静默采用其一
- [ ] 限时促销（如双倍 Credits 活动区间）带生效日期采集，输出中与标准价可区分
- [ ] 需登录才能确认的字段（如年付实际单价）标记 `LOGIN_REQUIRED` 并进入 Unresolved Fact，等待用户补充而非猜测
- [ ] fixture 端到端测试经 CLI seam 验证上述外部行为

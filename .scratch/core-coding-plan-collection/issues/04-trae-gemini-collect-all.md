# 04: Trae 双区与 Gemini Code Assist Provider + collect-all 汇总

**What to build:** 接入剩余三项 `coding-subscription` 候选并提供汇总入口：Trae 国际（`RENDER_DEPENDENT`，经 docs 站回退；地区清单明确排除大陆/港/澳；on-demand 附加池）与 Trae CN（无地区清单；31 自然日计费周期）作为 `regional_variant` 独立建模；Gemini Code Assist 落地"小时费 vs 月费"双口径价格——`price_list` 两条目显式标注换算关系，个人层停服迁 Antigravity 的状态标记为不可用档位。随后提供 CLI `collect-all` 命令，一次性输出全部已接入 `coding-subscription` 候选与覆盖缺口声明。来源事实以 [research/04](../../token-plan-advisor/research/04-trae.md) 与 [research/01](../../token-plan-advisor/research/01-gemini-code-assist.md) 为准。

**Blocked by:** 02（失败分类与来源回退链；可与 03 并行）

**Status:** ready-for-agent

- [ ] Trae 国际/CN 作为 `regional_variant` 独立建模：国际版地区排除清单落入服务政策维度，CN 版"无地区清单"如实标为未确认而非默认可用
- [ ] Trae CN 的 31 自然日计费周期被 Schema 正确表达，不与自然月混淆
- [ ] 国际版"美国屏蔽 GPT/MiniMax、CN 账号订阅互通未确认"进入功能限制维度与 Unresolved Fact
- [ ] Gemini Code Assist 双口径价格以 `price_list` 显式标注换算关系，两口径可互相核验
- [ ] 个人层 2026-06-18 停服迁 Antigravity 状态可见，不作为可购买档位输出
- [ ] `collect-all` 输出全部已接入候选 + 尚未接入来源/候选的缺口声明，不宣称市场完整
- [ ] fixture 端到端测试经 CLI seam 验证上述外部行为

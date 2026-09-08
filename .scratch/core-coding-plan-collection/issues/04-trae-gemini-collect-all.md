# 04: Trae 双区与 Gemini Code Assist Provider + collect-all 汇总

**What to build:** 接入剩余三项 `coding-subscription` 候选并提供汇总入口：Trae 国际（`RENDER_DEPENDENT`，经 docs 站回退；地区清单明确排除大陆/港/澳；on-demand 附加池）与 Trae CN（无地区清单；31 自然日计费周期）作为 `regional_variant` 独立建模；Gemini Code Assist 落地"小时费 vs 月费"双口径价格——`price_list` 两条目显式标注换算关系，个人层停服迁 Antigravity 的状态标记为不可用档位。随后提供 CLI `collect-all` 命令，一次性输出全部已接入 `coding-subscription` 候选与覆盖缺口声明。来源事实以 [research/04](../../token-plan-advisor/research/04-trae.md) 与 [research/01](../../token-plan-advisor/research/01-gemini-code-assist.md) 为准。

**Blocked by:** 02（失败分类与来源回退链；可与 03 并行）

**Status:** ready-for-human

- [x] Trae 国际/CN 作为 `regional_variant` 独立建模：国际版地区排除清单落入服务政策维度，CN 版"无地区清单"如实标为未确认而非默认可用
- [x] Trae CN 的 31 自然日计费周期被 Schema 正确表达，不与自然月混淆
- [x] 国际版"美国屏蔽 GPT/MiniMax、CN 账号订阅互通未确认"进入功能限制维度与 Unresolved Fact
- [x] Gemini Code Assist 双口径价格以 `price_list` 显式标注换算关系，两口径可互相核验
- [x] 个人层 2026-06-18 停服迁 Antigravity 状态可见，不作为可购买档位输出
- [x] `collect-all` 输出全部已接入候选 + 尚未接入来源/候选的缺口声明，不宣称市场完整
- [x] fixture 端到端测试经 CLI seam 验证上述外部行为

## Comments

**2026-09-08 实现 + 评审修复**（`packages/core`：Provider `trae-intl` / `trae-cn` / `gemini-codeassist`，CLI `collect-all`）：

- **Trae 双区**：同 `vendor_id: bytedance-trae`（评审修正：非两个独立 Vendor），`regional_variant.variant_id` 分 `trae-intl`/`trae-cn`；国际版 CN/HK/MO 三维 registration/service_policy `officially_restricted`（Supported countries 清单不含大陆/港澳/台），港澳"付费清单含但产品清单不含"的双清单矛盾以 `officially_conditional` + 原文保留、不静默择一（STALE_CONFLICT 进 Unresolved Facts）；CN 版"无地区清单"如实 `unconfirmed`/`unobtainable` 不默认可用。国际版 CN 维度 feature_restrictions 为 unconfirmed——US 屏蔽 GPT/MiniMax 属 GLOBAL/US 维度，不冒用为 CN 限制。
- **计费周期**：CN "31 个自然日"随每档 price_list note 显式标注（"官方口径，非自然月，订阅生效日起算"）+ 窗口 raw，不与自然月混淆；`window_anchor: from_subscription`。`credits_5h_weekly` quota_model 是 Schema 枚举缺"月度 credits"原语的折中（与 CodeBuddy CN 同款），记入技术债待 ticket 05 冻结前复核。
- **额度/原语**：Trae Intl `usd_equivalence`（Dollar Usage Basic 池 verified + Bonus Usage unobtainable + Lite 及以上 On-Demand 附加池，$3 触发）；Trae CN 积分池（Lite 2000 Work 专属 / Pro 4000 / Pro+ 12000 / Ultra 40000 通用积分）+ Seed 2.5 折；首月优惠（¥29.9/¥69）以 `promotional` 入 price_list。
- **Gemini 双口径**：Hourly（定价页）与 Monthly（商业版页）各 2 条进 price_list，折算关系（24×365÷12≈730）逐条 note 标注，Standard 22.80/19、Enterprise 54/45 两口径互相核验一致；日限额分通道（agent+CLI 1500/2000、code 6000、chat 960、2 RPS、1M ctx）；个人层 2026-06-18 停服迁 Antigravity 以 `DEPRECATED` 入 Unresolved Facts，不作为可购 plan；Enterprise ≥10 许可证经 setup 链；域名迁移 `GONE`；stateless 不训练入 data_policy。
- **collect-all**：`schema_version=1` + `coverage_scope`（8 providers，coding-subscription）+ `coverage_gaps`（Claude Code/Codex/Google AI Pro/Ultra/通义灵码 + "不宣称市场完整"声明，按父规格 Out of Scope 归类）+ `errors` + `collections`（每项经 Schema 校验闸）；tool_version 直接读 package.json（无 N+1 全量抓取副作用）；单 provider 失败不阻塞他项。
- **测试**：143 项全绿（原 90 + Trae-Intl 14、Trae-CN 14、Gemini 14、CLI seam 3、collect-all 8）；评审后补回归断言（31 自然日 note、CN feature_restrictions unconfirmed、HK/MO conditional）。fixture 快照 2026-09-07 采集（Trae-Intl 10 来源、Trae-CN 8、Gemini 12），模型清单按 research/04 校准（MiniMax-M3/M2.7，不虚构 Claude）。

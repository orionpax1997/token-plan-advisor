# 03: Cursor Provider：动态渲染回退与美元等值双池

**What to build:** 接入 Cursor（Anysphere）作为最难的订阅型来源：营销页 JS 渲染走 `JS_RENDERED_DATA` 分类，用 JSON-LD 与文档站替代入口完成采集；落地"美元等值双池"（Other Models 美元等值 @ API 价 + on-demand）这一 `usd_equivalence` 额度原语；INR 的 Cursor Start 作为 `regional_variant`；iOS 内购排除大陆写入五维 Availability 的对应维度；Admin API 能力标记为 `API_AVAILABLE`（仅声明，不登录、不读取账户数据）。来源事实以 [research/02](../../token-plan-advisor/research/02-cursor.md) 为准，失败分类与回退链复用 ticket 02 的契约。

**Blocked by:** 02（失败分类与来源回退链）

**Status:** ready-for-human

- [x] JS 渲染定价页经 JSON-LD/文档站替代入口采集成功，实际使用的替代来源与失败码在输出中可见
- [x] `usd_equivalence` 双池额度原语被结构化：等值语义、适用模型池、on-demand 溢出计费显式标注，不与 messages/tokens 混算
- [x] Pro 2025-06 请求制→用量制改制的语义在新 Schema 下表达正确（用量制为准，改制历史仅作来源注释）
- [x] INR 区域档位作为 `regional_variant` 独立建模，不影响 USD 主体数据
- [x] "iOS 内购除大陆外全球可用"落在 Availability 的支付/功能维度，不产生"支持中国"单一布尔
- [x] Privacy Mode / ZDR 进入 `data_policy`；Admin API 仅作 `API_AVAILABLE` 声明标记
- [x] fixture 端到端测试经 CLI seam 验证上述外部行为

## Comments

**2026-09-08 实现**（`packages/core`，Provider `anysphere-cursor` / CLI key `cursor` + Provider `anysphere-cursor-start-in` / CLI key `cursor-start-in`；Schema 零改动）：

- **JS 渲染回退**：`cursor.com/pricing` 来源 ok_code=`JS_RENDERED_DATA`（探索 01 §7.4 的典型案例），来源层/链层均带失败码；extract 层新增 `attribute()` 归因抽取——价目链 [定价页 JSON-LD → 帮助中心表 → 文档站]，命中来源落到**字段级** `source_ids`（fixture 模式 Pro 月付价来自页内 JSON-LD `Offer`；定价页 410 时回退到帮助中心表并在字段与链两层可见）。测试覆盖 410 单源失败、价目整链失败（chosen=null 且其他链不受阻断）、Teams 年付博客 403→`CF_BLOCKED` 回退且不编造年付价。
- **usd_equivalence 双池**：每档两条 `QuotaWindow`（Cursor Models 池 / Other Models 池），`unit` 标注池归属与美元等值语义，`note` 显式携带"不与 messages/tokens 混算"与 on-demand 溢出计费（billed at API rates with no markup / in arrears）；Other Models 数值 $20/$70/$400 verified，第一方池 "Generous included usage" 官方故意无数值 → unobtainable + 原文；Teams 池耗尽顺序与 Cursor Token Rate $0.25/M（含 BYOK）附加费入注；Premium "5x" 保持相对倍数不按 5×$20 推算。
- **改制语义**：`quota_model` 全档唯一 `usd_equivalence`（无请求制窗口）；请求制→用量制改制（2025-06-16）与官方澄清退款（2025-07-04）以抽取的官方原文进入 Pro 池窗口 note，来源经 `cursor-pricing-history` 链归因（Pro 窗口 `source_ids` 含 `cursor-blog-new-tier`），历史口径不进入 Unresolved Facts。
- **区域变体**：Cursor Start 独立 Provider/collection（₹649/月税含、`usage_tier` 原语、仅第一方模型无 on-demand），`regional_variant.variant_id="cursor-start-in"`、法域 India verified、运营主体官方未声明独立印度主体 → unobtainable；全球主 collection `regional_variant: null`。
- **Availability**：CN 条目 payment=`officially_conditional`（iOS 渠道 "everywhere except mainland China" 原文 + Stripe 大陆卡未确认）、注册/网络=unconfirmed、服务政策=条件性（§17.5 未点名大陆）、功能限制=条件性（模型级 provider 限制）；GLOBAL 条目网络维度同样按"无声明≠官方确认"标 unconfirmed。
- **data_policy / API**：training_use=false（ToS §1.3 全大写原文）、ZDR=true（"Most models run under Cursor's ZDR agreements" + Fable 5 例外）、处理位置 partial（仅 Enterprise US-only 驻留 +10% 有官方声明）；Admin API 以 `API_AVAILABLE` Unresolved Fact 声明能力（端点/Basic 认证/20 req/min），明示未登录、未调用、不读取账户数据，且 API 不输出包含额度定义。
- **测试**：90 项全绿（新增 27：cursor 主 13、回退 5、Start 6、CLI seam 3）；`attribute()` 归因与 `deriveSourceChains` 链级分辨双层可追溯；fixture 快照 2026-09-07 采集（主 15 来源、Start 3 来源）。
- **技术债兑现**：审查发现 cursor 复制的 load.ts/shared.ts 属新债务（ticket 02 记录的仅是字段工厂），已提取 `providers/_shared.ts`（快照装载 + 回退链派生单一实现），zai/codebuddy/cursor 三家族改为类型别名 + 再导出薄封装，家族内 import 路径不变；`verified`/`unobtainable`/`notApplicable` 字段工厂仍按 ticket 02 记录为待提取债务（签名在家族间不一致，提取需独立 ticket）。

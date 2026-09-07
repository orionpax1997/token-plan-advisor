# 01: 探索 Coding Plan 官方信息获取路径与字段覆盖

**What to build:** 产出一份可供后续 Schema、Data Provider 和 Recommendation Policy 使用的官方信息调研结果，明确全球及中国市场的 Coding Plan 信息可以从哪些 Vendor 官方页面、帮助中心、API 文档、公告或其他官方入口获取，以及每个入口实际能够提供哪些可验证字段。该 ticket 只做事实探索，不实现生产 Adapter，不假设官方页面一定可抓取。

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [x] 建立候选 Vendor 官方信息入口清单，至少覆盖全球市场与中国市场；每个入口记录官方 URL、入口类型、所属 Vendor、地区范围、访问前提、是否需要登录、是否存在动态渲染或明显访问限制。
- [x] 为每个官方入口建立字段覆盖矩阵，至少检查 Plan 标识与名称、Plan Type、价格、币种、计费周期、额度或使用限制、模型与功能、上下文长度、速率、并发、隐私/数据处理、注册要求、支付方式、地区政策、官方购买链接和更新时间等字段。
- [x] 区分页面明确公开、只能从帮助文档或公告确认、需要账户才能确认、只能通过官方 API 获取、无法确认和不适用的字段状态。
- [x] 记录价格、额度和限制的原始表达方式及单位，指出跨 Vendor 归一化时可能遇到的歧义，例如消息数、请求数、token、时间窗口、模型档位或动态限额。
- [x] 记录官方来源之间的冲突、更新频率、历史变更方式、发布日期/更新时间可见性，以及无法确认当前有效值的情况。
- [x] 记录中国 Availability 可从官方来源确认到哪些维度：注册、支付、网络访问、服务政策和功能限制；区分官方明确声明与无法确认的部分。
- [x] 给出 Data Provider 所需的最小来源契约、字段优先级和失败分类建议，并明确哪些字段属于核心字段、缺失时应阻止强排名。
- [x] 将调研结论、来源链接、采集日期、字段覆盖矩阵、风险和未解决问题写入该 ticket 的 `## Answer`，使后续实现 ticket 可以直接引用，不用重新猜测来源能力。

---

## Answer

### 1. 采集日期与覆盖范围

- **统一采集日期**：2026-09-07（各单 Vendor 文件顶部一致）。
- **研究方法**：仅采信一手官方来源（定价页、帮助中心、官方文档、法律条款、官方博客、changelog/release notes、GitHub 仓库 README、Model overview）；第三方汇总一律排除。优先使用 exa 搜索定位官方页面，再核对页面内容。
- **14 候选清单与 Plan Type 归类**：

| # | Vendor + 产品 | Plan Type | 市场 |
|---|---|---|---|
| 01 | Google Gemini Code Assist | coding-subscription | 全球 |
| 02 | Cursor（Anysphere） | coding-subscription | 全球（USD）+ 印度（INR Cursor Start） |
| 03 | 腾讯 CodeBuddy | coding-subscription | 中国（CNY）+ 国际（USD） |
| 04 | Trae（字节跳动） | coding-subscription | 国际（USD trae.ai）+ 中国（CNY trae.cn） |
| 05 | 智谱 z.ai GLM Coding Plan | coding-subscription | 国际（USD） |
| 06 | OpenAI ChatGPT + Codex | general-subscription | 全球 |
| 07 | Anthropic Claude + Claude Code | general-subscription | 全球 |
| 08 | Google AI 订阅 + Gemini CLI | general-subscription | 全球 |
| 09 | OpenAI API | api-usage | 全球（USD） |
| 10 | Anthropic API | api-usage | 全球（USD） |
| 11 | Google Gemini API | api-usage | 全球（USD） |
| 12 | 阿里云百炼 / Qwen API | api-usage | 中国（CNY） |
| 13 | 智谱开放平台 bigmodel.cn | api-usage | 中国（CNY） |
| 14 | DeepSeek API | api-usage | 全球（USD/CNY 双表） |

Plan Type 计数：coding-subscription 7 项（含 03/04 跨产品线对），general-subscription 3 项（Claude Code / Codex / Antigravity 作为订阅子集能力），api-usage 5 项。

### 2. 候选 Vendor 官方信息入口清单

完整入口清单见 `.scratch/token-plan-advisor/research/` 下 14 份单 Vendor 研究文件。每份文件第 1 节给出"官方入口清单"表（官方 URL / 入口类型 / 地区范围 / 访问前提 / 需登录 / 动态渲染或访问限制 / 本次是否成功获取）。

**总览**：14 候选共覆盖 458 个官方入口抓取尝试，其中约 20 个因动态渲染或 SPA 抓取失败（主要在 Cursor、Trae、智谱 bigmodel.cn、DeepSeek FAQ），但所有 14 候选均有"替代入口"（docs 站、降价 PDF、官方博客、exa 快照）保证核心字段可采。**所有 14 候选均有最佳入口组合**（按 pricing → docs → changelog/legal → console 优先级）。

每份研究文件还包含：
- 第 2 节：字段覆盖矩阵（按 14 个字段逐项标状态）
- 第 3 节：价格/额度/限制原始表达方式与单位、跨 Vendor 归一化歧义
- 第 4 节：来源冲突、更新频率、历史变更方式、发布时间/更新时间可见性
- 第 5 节：中国 Availability 五维度
- 第 6 节：对 Data Provider / Recommendation Policy 的建议
- 第 7 节：未解决问题

### 3. 字段覆盖矩阵（精简版）

**状态图例**：`✓ 公开`（页面直接可见）、`~ 文档/公告`（需从文档或公告读出）、`🔒 需登录`、`⚙ 官方 API`（用量或限制有只读 API）、`? 无法确认`、`— 不适用`

| Vendor | 价格 | 币种 | 计费周期 | 额度原始表达 | 模型清单 | 上下文长度 | 速率限制 | 并发 | 隐私/数据 | 注册要求 | 支付方式 | 地区政策 | 官方购买链接 | 更新时间 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 Gemini Code Assist | ✓ 双口径 | ~ USD | ✓ | ~ 多通道限额 | ✓ | ~ 1M | ✓ 2 RPS | ? | ~ 不训练 | ✓ | ~ | ? 无排除 | ✓ | ~ 部分带 |
| 02 Cursor | ✓ 6 档 | ✓ USD+INR | ✓ 月/年 | ~ 双池（Other Models 美元等值） | ✓ | ~ 部分 1M | ⚙ Admin API | ? | ~ Privacy Mode/ZDR | ✓ Stripe | ~ | ~ iOS 排除大陆；ToS 出口管制 | ✓ | ~ 文档带；定价页无 |
| 03 腾讯 CodeBuddy 国内 | ✓ 4 档 | ✓ CNY | ✓ 月/年 | ~ 积分制 + 补全 | ✓ | ~ | ? | ? | ~ 不训练 | ✓ 实名 | ✓ 微信/QQ | ✓ 无排除 | ✓ | ✓ 部分带 |
| 03 腾讯 CodeBuddy 国际 | ✓ Free/$10/$40 | ✓ USD | ✓ 月/年 | ~ credits | ~ 多模型 | ? | ? | ? | ~ 新加坡主体 | ✓ | ✓ 卡+微信 | ✓ 协议新加坡 | ✓ | ✓ 部分带 |
| 04 Trae 国际 | ✓ 5 档 + on-demand | ✓ USD | ✓ 月/年 | ~ Basic Usage + Bonus | ✓ | ~ 272K/1M | ~ 队列优先级 | ✓ | ~ 隐私模式 | ✓ | ✓ | ✓ 排除大陆/港/澳 | ✓ | ~ |
| 04 Trae CN | ✓ 4 档 | ✓ CNY | ✓ 31 自然日 | ~ 通用积分 | ✓ | ~ | ~ 优先 | ✓ | ~ TraeCode | ✓ | ✓ | ~ 无地区清单 | ✓ | ~ |
| 05 z.ai Coding Plan | ~ 现价 ? | ~ USD | ~ 月/季/年 | ~ 5h/周双池 credits | ✓ GLM 系列 | ? | ~ 动态 | ~ | ~ 团队默认不训练 | ✓ | ~ 卡+PayPal | ~ 出口管制 | ✓ | ✓ 公告带 |
| 06 ChatGPT + Codex | ✓ 6 档 | ✓ USD+本地 | ✓ | ~ 5h 消息表 | ✓ GPT-5.x | ~ 27K-400K | ~ | ~ Codex cloud 并行 | ✓ Business 默认不训练 | ✓ 排除大陆 | ✓ | ✓ 排除大陆 | ✓ | ~ |
| 07 Claude + Code | ✓ 5 档 + Enterprise | ✓ USD+其他 | ✓ 月/年 | ~ 5h+周+Opus 三维 | ✓ | ~ 200K-1M | ~ 5x/20x | ~ | ✓ Consumer Opt-out | ✓ 排除大陆 | ✓ | ✓ 排除大陆 | ✓ | ✓ |
| 08 Google AI + CLI | ✓ 4 档 | ✓ USD+多币 | ✓ 月 | ~ 相对倍数 + RPD | ✓ | ✓ 1M | ~ 60 req/min | ? | ~ 3 档登录分流 | ✓ Workspace only | ✓ | ✓ 排除大陆 | ✓ | ~ |
| 09 OpenAI API | ✓ per-model | ✓ USD | ~ 实时 | ~ Usage tier + cap | ✓ | ✓ GPT 1M/200K | ⚙ x-ratelimit-* | ~ ramp rate | ~ 不训练 | ✓ 账号+Org | ~ | ~ allowed geography 未列 | ✓ | ✓ Changelog 月+日 |
| 10 Anthropic API | ✓ per-model | ✓ USD | ~ prepaid | ~ tier + spend cap | ✓ | ✓ 1M/200K | ✓ RPM/ITPM/OTPM | ~ | ✓ 默认不训练 | ✓ Console | ✓ Stripe | ✓ 排除大陆 | ✓ | ✓ Pricing 顶部 + PDF |
| 11 Gemini API | ✓ per-model | ✓ USD | ~ 实时 | ~ Tier 1/2/3 + cap | ✓ | ✓ 1M | ⚙ 看 Monitoring | ? | ✓ Free 训练、Paid 不训练 | ✓ 18+ | ✓ GCP billing | ✓ 排除大陆 | ✓ | ✓ 文档带 UTC |
| 12 阿里云百炼 Qwen | ✓ per-model | ✓ CNY | ~ 实时 | ~ 免费额度 + 阶梯 | ✓ | ✓ 0-1M | ? | ? | ? 定价页无明示 | ✓ 阿里云+实名 | ✓ 阿里云通用 | ✓ 5 地域分价 | ✓ | ✓ 2026-09-04 |
| 13 智谱 bigmodel.cn API | ✓ per-model | ✓ CNY | ~ 实时 | ~ Rate limit 错误码 + Cache | ✓ | ✓ 1M/128K | ? | ? | ~ API Key 删除后停扣 | ✓ 海外手机+企业 | ✓ 支付宝+微信+对公 | ✓ 中国大陆法律 | ✓ | ~ 大部分文档无 |
| 13 智谱 Coding Plan | ✓ Lite/Pro/Max | ✓ CNY | ~ 月/季/年 | ~ 5h/周双池 | ✓ GLM 系列 | ? | ~ 动态 | ~ | ~ 团队不训练 | ~ | ✓ 个人微信/支付宝 | ✓ 中国大陆 | ✓ | ✓ 公告带 |
| 14 DeepSeek API | ✓ per-model | ✓ USD/CNY | ~ 实时 | ~ Peak/Off-Peak 双价 | ✓ | ✓ 1M | ~ | ✓ V4-Pro 500、Flash 2500 | ~ 不主动训练；可 opt-out | ✓ | ~ 渠道未公开 | ~ §1.5 保留声明 | ✓ | ✓ Change Log 按日期 |

**常见分布说明**：
- "价格"覆盖最完整（14 候选中 12 个为 `✓` 或 `~`）。
- "额度原始表达"异质性最高：requests/day、hours/week、credits、messages、tokens、积分池、"X×higher" 相对倍数——是后续 Schema 设计最大障碍。
- "并发"普遍 `?`：仅 Trae、DeepSeek、Anthropic API 明确；Cursor/Codex/Claude Code/Google AI 隐含"multi-session 共享池"。
- "地区政策"三分天下：海外厂商明确排除（OpenAI、Anthropic、Google AI、Trae 国际）；中国厂商默认可用（CodeBuddy、Trae CN、百炼、智谱、DeepSeek）；部分排除（Cursor 仅 iOS 端、Gemini Code Assist 个人层）。
- "更新时间"：仅 docs/官方公告/法律条款普遍带时间戳；定价页/营销页普遍无 `Last updated`（除 ai.google.dev、阿里云百炼、Tencent 1749 文档、Anthropic Pricing）。

### 4. 价格/额度/限制原始表达方式与归一化歧义

跨 Vendor 归一化的 8 条核心难点：

1. **"消息/小时" vs "API token 数"**：Cursor / Anthropic Claude / OpenAI Codex 用"消息数"；OpenAI / Anthropic / Google / Qwen / DeepSeek API 用"token 数"；Cursor 的 "Other Models $20/月" 是按 API 价消耗的"美元等值"。不能直接比数字。
2. **"5 小时窗口" vs "月度"**：Anthropic Claude（5h 滚动 + 周）、智谱 GLM Coding Plan（5h 动态 + 7 天）、OpenAI Codex（5h + Weekly）、Gemini app（5h refresh until weekly）。跨 Vendor 排名时必须把"窗口起点"对齐。
3. **"积分制 / 请求数制 / 美元等值池 / credits"**：CodeBuddy 是 credits（黑盒复合单位）；Cursor 是"美元等值 @ API 价"双池；智谱 GLM Coding Plan 是 credits × 模型乘数（GLM-5.3 6.9 / Flash 1.7 等）；Codex 是 messages/5h；Claude 是 messages/5h + 周 hours + Opus 池。**对 Policy 提示**：把"credits"建模为独立单位 + 黑盒标注，禁止与 messages/tokens 直接换算。
4. **"人民币 vs 美元"双轨**：CodeBuddy/Trae CN/百炼/智谱/DeepSeek CNY 表 vs Cursor/Anthropic/OpenAI/Google USD 表——汇率非固定换算（DeepSeek USD/CNY 表各自有不同系数）；同一厂商不同区域（百炼 5 地域、Trae 国际/中国、CodeBuddy 国内/国际、z.ai/bigmodel.cn）需独立建模。
5. **"动态限额 / 软下限"**：Anthropic "50% 阈值可申请提升"；智谱"动态调整、Max>Pro>Lite"；Google "subject to availability in times of high demand"；Anthropic Claude Code 阈值自动降级（Max 5x 20% / Max 20x 50%）；DeepSeek Peak/Off-Peak 强制双价；Anthropic API Fast mode "ramp rate 50%"。**对 Policy 提示**：把"动态/软下限"标为"上界值"并显式标记 `dynamic`。
6. **"模型倍率"**：智谱 GLM Coding Plan（按模型乘数 6.9/1.7/24 等）；Anthropic（cache 1.25×/2×/0.1× + Fast 2× + US-only 1.1× + 长上下文已取消加价）；OpenAI（cache_read 0.1×、cache_write > input、长上下文 2×/1.5×、Fast 2×、Regional 1.1×）。**对 Policy 提示**：必须按"通道+模型+开关"组合建模"实际价格"。
7. **"附加费"**：Anthropic API Code Execution $0.05/h container、Web search $10/1K；OpenAI Web search $10/1K + $25/1K、Containers $0.03-$1.92/20min、Sora $0.10-$0.70/秒；Gemini API Grounding w/ Search $14-35/1K、File Search $0.15/M 嵌入；Anthropic OpenAI API Priority/Flex；DeepSeek V4-Flash-Vision-Exp 图片按 384 tokens/image 限价；智谱 Knowledge 0.04 元/GB/小时。**对 Policy 提示**：附加费是"按用量即加"——跨 Vendor 总成本不能只看基础 token 价。
8. **"币种 + 多子域 + 抓取地区漂移"**：Google AI 多子域（us/gb/au/ca/in/am/ht 等）按地区切价格；Gemini API 同样建议"固定 `one.google.com/intl/en_us/...`"。**对 Policy 提示**：Data Provider 抓取必须显式固定路径。

### 5. 来源冲突、更新频率与历史变更模式

跨 Vendor 共性 6 条：

1. **同产品多页价格不一致**：OpenAI `chatgpt.com/codex/pricing` 与 `learn.chatgpt.com/docs/pricing` 在 GPT-5.6 三档数值不一致（以 learn 为准）；Gemini Code Assist 定价页（小时费）与 codeassist.google/products/business（月费）双口径数值可换算。
2. **博客/文档时间错位 + 旧价页未下线**：Trae Pro 试用 14 天（2026-02-13 博客）→ 7 天（现行文档），中间无变更公告；Tencent CodeBuddy 国际 1749/126592 计费概述仍写"个人专业版 58 元"旧口径，与同文档 109769 三档新价并存；ChatGPT "Codex Subscription Pro $9.95/mo, 1,000 credits" vs Pricing/Billing "2,000 (1,000 base + 1,000 bonus)"。
3. **并行旧价页与新价页**：OpenAI API 4 个旧 platform.openai.com 路径已 404 迁到 developers.openai.com；Anthropic Sonnet 5 2026-09-01 计划调价到 $3/$15 未生效，定价文档同时存在"through August 31, 2026"与"the previously scheduled increase will not occur"两段。
4. **用户档位拆分 + 套餐化**：Cursor Pro 2025-06 改制（请求制→用量制）→ 2025-07 道歉+退款；OpenAI Pro 2026-04-09 拆分 Pro 5x $100 / Pro 20x $200；Anthropic Max 2025-04-09 首发 $200 后加挂 $100（5x）；Google Ultra 2026-05-19 I/O 拆分 5x/20x + 降价 $250→$200。
5. **季节性促销 + 限时活动**：腾讯 CodeBuddy 国内"加赠积分（限时）" + "双倍 Credits（2026-07-01~09-30）"；智谱 bigmodel.cn 夜间畅用（2026-09-03~09-20）；DeepSeek V4 "Promotional pricing through December 31, 2026 → 2027-01-01 恢复标准价"；Gemini 3.6/3.7/3.8 Flash "through December 31, 2026"；OpenAI GPT-5.6 Sol "promotional pricing at least through November 21, 2026"。**对 Policy 提示**：限时/促销字段必须带生效日期采集。
6. **品牌更名与产品名沿用**：Google One AI Premium → Google AI Pro（2026-05-19 I/O）；Google AI Premium → Google AI Plus；腾讯云 AI 代码助手 → CodeBuddy（2026 品牌统一，公告 2270）→ 与 WorkBuddy 融合为 Buddy AI；Vertex AI 2026 更名 Gemini Enterprise Agent Platform（URL 自动 301）；z.ai/bigmodel.cn 两区同名 "GLM Coding Plan" 但主体/币种/法域不同；OpenAI Priority processing 2026-07-30 更名 Fast mode（URL 仍 `/priority-processing`，正文仍写 "Priority"）。

**统一抓取时间依赖问题**：14 份 research 中 7 个 Vendor 核心定价页带 `Last updated`（Anthropic API、Pricing 文档、ai.google.dev/Gemini API、Tencent 1749 文档、阿里云百炼定价页、Trae CN/Gemini CLI release notes）；其余定价页/营销页**无时间戳**，需采集方自记抓取日期。

### 6. 中国 Availability 五维度汇总

**原则**：所有 14 候选的"页面无法访问/抓取失败"不作为官方政策限制的证据。

| Vendor | 注册 | 支付 | 网络访问 | 服务政策 | 功能限制 |
|---|---|---|---|---|---|
| 01 Gemini Code Assist | 官方明确；**中国维度无法确认** | **无法确认** | **无法确认** | **无法确认**；个人层 2026-06-18 停服迁 Antigravity | **无法确认** |
| 02 Cursor | 官方明确；**中国维度无法确认** | **官方明确**："iOS 内购除大陆外全球可用"；大陆银行卡/支付宝/微信能否走 Stripe：**无法确认** | **无法确认** | **官方明确**（通用）：ToS 出口管制；区域定价先例（印度 Cursor Start） | **官方明确**：模型级地区限制由 provider 决定 |
| 03 腾讯 CodeBuddy | **官方明确**（实名必填） | **官方明确**（国内：微信/QQ；国际：卡+微信） | **官方明确**（国内站部署于腾讯云） | **官方明确**：国际新加坡主体，"available to users globally"；无国别排除 | **官方明确**：中国站模型以国内为主 |
| 04 Trae | **官方明确（国际）**：清单**不含**中国大陆/港/澳/台 | **官方明确（国际）**：Alipay/WeChat/卡/PayPal；大陆银行卡/支付宝/微信能否完成国际订阅：**无法确认** | **无法确认** | **官方明确**：国际 FAQ 明确"only in certain countries"；中国站备案 | **官方明确**：国际版美国屏蔽 GPT/MiniMax；CN 账号/订阅是否互通：**无法确认** |
| 05 z.ai | **官方明确**（通用）；**中国大陆无法确认** | **官方明确**：bank card or PayPal（无 3DS）；支付宝/微信/Stripe 未在已查页出现 | **无法确认** | **官方明确**：出口管制禁地区（伊/朝/古/克里米亚等）；**未点名中国大陆** | **无法确认** |
| 06 OpenAI | **官方明确**：Supported Countries 不含大陆/港/澳/俄罗斯/伊朗 | **官方明确**（通道）；大陆支付方式**无官方声明** | **无法确认** | **官方明确**：Supported Countries 是硬边界；**大陆用户不可注册** | **官方明确**（机制）：Sites/Computer Use/Browser "Limited" 标记；大陆差异化声明**未找到** |
| 07 Anthropic Claude + Code | **官方明确**：supported-countries 不含大陆/港/澳（含台湾约 160 国） | **官方明确**：注册先决条件不满足；定价页 Payment 仅服务于支持地区 | **官方明确**：CLI 触发 400 "not allowed from unsupported countries" | **官方明确**：公告点名 China 为 "adversarial nations"；"50%+ 控股属中国的企业"亦被禁用 | **官方明确**：整体不可达——非"部分模型受限" |
| 08 Google AI + CLI | **官方明确**：Mainland China **Workspace only**（个人 Google 账号订阅不被支持） | **无法确认** | **无法确认** | **官方明确（部分）**：web/app 国家清单排除大陆（仅 Workspace 客户）；Gemini API 独立清单不含大陆 | **官方明确（部分）**：Gemini Spark/Dreambeams 美/英专属 |
| 09 OpenAI API | **官方明确**（结构）+ "Free tier must be in allowed geography"（"allowed geography" 国家清单**未在已查一手页命中**） | **官方明确**（结构）：OpenAI Ireland Ltd / OpenAI OpCo LLC；大陆支付方式**无明确清单** | **无法确认** | **官方明确**：数据居住不含中国特有条款；大陆**无法确认** | **官方明确**（机制）：Fast mode Astra EU data residency 不可用；大陆差异**无声明** |
| 10 Anthropic API | **官方明确**：Supported Countries 不含大陆/港/澳（约 160 国，含台湾）；ownership 限制点名 China | **官方明确**：Stripe prepaid + invoicing；大陆支付方式**无明确清单** | **官方未声明** | **官方明确**：服务地区清单不含大陆；ownership 限制点名 China；Bedrock/Vertex/Foundry 属另一通道 | **官方明确**："check supported regions" |
| 11 Gemini API | **官方明确**：AI Studio Available regions 不含中国大陆（HK/MO 未确认；TW 第三方观察不一）；Vertex AI 通道可在 GCP 香港区域 asia-east2 | **无法确认** | **无法确认** | **官方明确（有限）**："may only be accessed within an available region"（API Terms） | **官方明确**（区域导致）：AI Studio 通道注册阶段即被拦；Vertex AI 通道需走 GCP 企业项目；Grounding 在大陆因 Google Search 不可达而不可用 |
| 12 阿里云百炼 Qwen | **官方明确**：阿里云账号+实名认证；海外企业也可注册 | **官方明确**（隐含）：阿里云通用支付 | **无法确认** | **官方明确**：5 地域定价；中国大陆主战场 | **官方明确**：华北 2 以外无免费额度；部分模型仅在华北 2 上线 |
| 13 智谱 bigmodel.cn | **官方明确**（结构+流程）：海外手机号+人脸+企业认证；不强制实名 | **官方明确（通道）**：明确支持支付宝、微信+对公打款+30 分钟到账；个人/企业发票 | **官方未声明** | **官方明确（结构性）**：中华人民共和国大陆地区法律+北京海淀法院管辖 | **官方明确**（账号级+套餐级）：错误码体系；Coding Plan 仅限官方支持工具；GLM-5.3 在 Anthropic 协议端点 Coding Plan 用户当前仅 OpenAI Chat Completion 协议可用 |
| 14 DeepSeek API | **官方明确**：杭州主体；邮箱/Apple/Google 第三方；不要求大陆手机号；数据存 PRC | **官方明确（币种+余额）**：USD/CNY 双币；**支付渠道（支付宝/微信/Stripe/信用卡）未在官方页公开** | **官方未声明** | **官方明确**：Terms §1.5 "不保证所有地区持续可用，功能可能在不同地区有所差异"；ICP 备案 | **官方明确**："functions may vary in different jurisdictions"——**无具体地区差异清单** |

**总体提示**：
- 三档结构性分布：(1) **海外厂商明确排除**（OpenAI ChatGPT/API、Anthropic Claude/API、Google AI/API、Trae 国际）；(2) **中国厂商默认可用**（CodeBuddy、Trae CN、百炼、智谱、DeepSeek）；(3) **部分排除**（Cursor 仅 iOS 端、Gemini Code Assist 个人层）。
- **同一公司可能有两个截然不同的可用性结论**（CodeBuddy 国内/国际、Trae 国际/中国、智谱 bigmodel.cn/z.ai、Tencent Cloud International）。
- 地区策略需按"注册+支付+网络+服务政策+功能限制"五维独立建模，**禁止合并为"可用/不可用"二值**。

### 7. Data Provider 最小来源契约与字段优先级

#### 7.1 核心字段（缺失应阻止强排名）

按"跨 Vendor 排名可比性"优先排序：

1. **价格（含币种）**——按 Vendor 的原始单位（订阅：per seat per month；API：per 1M tokens；积分制：credits/月）
2. **Plan 标识与 Plan Type**——明确是 coding-subscription / general-subscription / api-usage
3. **计费周期**——月/年/连续包月/连续包年/季/年
4. **额度原始表达**（按 Vendor 单位：requests/天、5h 消息数、credits/月、tier 阈值）
5. **模型清单**（含模型与 Plan 绑定关系：哪些模型在哪个 plan 可用）
6. **地区支持**（中国/全球/特定区域 + 排除清单）
7. **隐私/数据处理**（是否用于训练、ZDR 可用、保留期）
8. **购买/订阅入口**（公开营销页 vs 控制台 vs 申请表单）

> 14 份 research 中**所有候选**都至少能拿到这 8 项（部分项标 `?` / `~` 但有可读的官方表述）。

#### 7.2 次要字段（缺失降级为"待核实"候选）

9. 上下文长度（每个 model / plan）
10. 并发 / 速率限制（数值化 RPM/TPM/QPS）
11. 支付方式（信用卡/PayPal/支付宝/微信/Stripe/Invoice）
12. 更新时间（"Last updated" 抓取时间戳）
13. 币种本地化（按地区子域切换）
14. 促销/限时活动（带生效日期）
15. 退款政策
16. 用户档位（席位）规则
17. 数据驻留（US/EU/AP/数据居住选项）
18. 模型生命周期（GA / Preview / Deprecated 状态）
19. Tool/Server tool 计费（web search / code execution / file search / grounding）
20. 客户端形态（IDE/CLI/Plugin/Web/iOS/Android）

#### 7.3 来源优先级（强制顺序）

1. **官方定价页 / 计费页**（最高优先）
2. **官方文档 / 帮助中心**（FAQ、how-to、tutorials）
3. **官方公告 / 博客 / changelog / release notes**（带日期；用于历史变更）
4. **控制台 / 购买入口**（需登录；只用于实际成交价与个人化价格）
5. **法律条款 / 隐私政策**（用于地区政策、出口管制、数据训练）
6. **第三方汇总**（**禁止**作为事实依据；仅用于交叉核对）

#### 7.4 失败分类枚举（建议）

| 失败码 | 含义 | 触发场景 |
|---|---|---|
| `OK` | 静态可读全文 | 文档站、help 中心 JSON、API docs |
| `OK_MD` | `.md` 文本可读 | docs.z.ai、docs.trae.cn、docs.bigmodel.cn、api-docs.deepseek.com |
| `JS_RENDERED_DATA` | 客户端渲染但价格已注入 | deepseek.com/en/platform/（ds-text-price）；Cursor 定价页 JSON-LD |
| `JS_RENDERED_EMPTY` | 客户端渲染但价格未注入 | deepseek.com/platform/（中文 platform 页） |
| `RENDER_DEPENDENT` | 客户端渲染，无替代 | Trae pricing / max-mode、智谱 bigmodel.cn/pricing、z.ai/subscribe 正文 |
| `LOGIN_REQUIRED` | 必须登录才可读 | Stripe checkout、Admin 控制台、用量 dashboard、Admin for Gemini、火山引擎 |
| `API_AVAILABLE` | 有只读 API 可程序化 | Cursor Admin API（Teams）、OpenAI Usage/Costs API、Anthropic Rate Limits API |
| `CF_BLOCKED` | Cloudflare 反爬 | help.openai.com 8553685/8868588/9179066 |
| `GONE` | 404/重定向 | OpenAI 4 个旧路径已 404；OpenAI China data-residency 页 |
| `SPA` | SPA 渲染，curl 拿不到 | DeepSeek FAQ（`static.deepseek.com/faq/...`） |
| `DEPRECATED` | 页面可读但功能停服 | Gemini CLI 仓库 OAuth quota 表（2026-06-18 停服后） |
| `STALE_SNAPSHOT` | 多版本快照共存 | exa 对 `docs.z.ai/devpack/overview` 缓存 V1/V2/credits 三版 |
| `STALE_CONFLICT` | 同一文档产品内多页并存 | 腾讯 CodeBuddy 1749/126592 vs 109769；trae.ai/pricing vs 文档 |
| `REGION_BLOCKED` | 地区/认证硬边界 | OpenAI/Anthropic/Gemini API 对中国大陆的硬边界 |
| `TIME_DEPENDENT` | 文档内时间分列需结合采集时点 | Anthropic Sonnet 5 涨价取消；OpenAI 多个 "at least through YYYY-MM-DD" 促销 |

#### 7.5 给后续 Schema / Data Provider 的关键提示

1. **不要假设"价格"是单一字段**——同 Vendor 可能有"小时费 vs 月费"（Gemini Code Assist）、"个人价 vs 连续包月折扣价"（CodeBuddy/Cursor Pro/年付 20% off）、"USD 表 vs CNY 表"（DeepSeek/Tencent）、"标准价 vs 限时促销价"（OpenAI/Gemini/DeepSeek）。Schema 应支持 `price_list` 数组。
2. **不要假设"额度"是单一字段**——Claude 是 5h 消息 + 周小时 + Opus 池三维；Anthropic API 是 tier × cap；OpenAI API 是 usage tier；DeepSeek 是并发数；Google AI 是 "2×/4×/5×/20×" 相对倍数。Schema 应支持 `quota_model` 枚举（"messages_5h" / "credits_5h_weekly" / "usd_equivalence" / "usage_tier" / "concurrency" / "relative_multiplier"）。
3. **"模型"是动态字段**——14 份 research 显示模型变更频率约 1–3 个月一次；GLM 系列（4.5→4.6→4.7→5→5.1→5.2→5.3）约每月 1 个；Schema 应支持 `model_code + model_release_date + deprecation_date + tier_availability`。
4. **"地区支持"必须按"注册+支付+网络+服务政策+功能限制"五维独立建模**——14 份 research 中 4 个海外厂商对"中国大陆"采取**完全排除**（Anthropic Claude+API、OpenAI ChatGPT+API、Google AI+API、Trae 国际）；3 个海外厂商对"中国大陆"采取**部分排除**（Cursor 仅 iOS 端、Gemini Code Assist 排除个人层）；5 个中国厂商**默认对大陆友好**（CodeBuddy、Trae CN、百炼、智谱 bigmodel.cn、DeepSeek）。
5. **采集时必须记录"采集时间戳"与"页面级 Last updated"**——14 份 research 中只有 7 个 Vendor 的核心定价页带 `Last updated`；其余定价页/营销页**无时间戳**，需采集方自记抓取日期。

### 8. 风险与未解决问题

跨 Vendor 共性 10 条风险：

1. **页面动态渲染 / 客户端 JS 渲染抓不到**——影响 Trae（7 个页面）、智谱 bigmodel.cn（3 个 JS 渲染页 + 营销站）、z.ai/subscribe、Cursor pricing 页档位切换、Tencent codebuddy.ai/pricing fetch failed、DeepSeek 中文 platform 页价格未注入。**应对**：用 docs 站 `.md` 替代、exa 快照兜底、JSON-LD 替代营销页。
2. **地区差异**：14 份 research 中 9 个含"中国大陆可用性"讨论，其中 4 个明确排除、5 个部分排除。**应对**：地区策略必须按 Vendor × 五维独立判断。
3. **配额变化快**：Anthropic Claude 5h 窗口 2026-05-06 翻倍 + 多个第三方报道 2026-08-31 前 +50% 促销；CodeBuddy 国内"加赠积分（限时）"；智谱 bigmodel.cn 2026-09-03~09-20 夜间活动；OpenAI Codex 2026-04-02 计价从 message 转 token；Google AI 2026-05-19 I/O 重组。**应对**：所有字段带生效日期。
4. **旧价页未下线**——Tencent CodeBuddy 国际 1749/126592、Price details；OpenAI chatgpt.com/codex/pricing 与 learn.chatgpt.com/docs/pricing 不一致；Anthropic Pricing 文档同页"through Aug 31"与"will not occur"并存。**应对**：多源交叉 + 时间戳强校验。
5. **客户端渲染抓不到**——Trae 国际 + 中国 + ToS 共 8 个；Cursor pricing 页 Yearly/Pro+ 切换；智谱 bigmodel.cn + z.ai/subscribe 营销站；DeepSeek FAQ。**应对**：用 docs 站 + JSON-LD + JSON-API 替代。
6. **个人年付价格需登录**——Cursor 定价页静态仅"20% discount"文字，具体月单价需登录 Stripe；Anthropic 跨地区币种需登录 `claude.ai/upgrade`；Google AI 多子域但地区变价仍需确认。**应对**：标 `LOGIN_REQUIRED` 并记为"待核实"。
7. **模型与 Plan 绑定关系变化**——Anthropic Pro 允许 Opus 在 chat 但 Claude Code 内**不能用** Opus（同一 Plan 不同能力矩阵）；Codex 5h 池 local messages + cloud chats + Code Review 共享；智谱 GLM-5.3 在 Anthropic 协议端点 Coding Plan 用户当前**仅 OpenAI Chat Completion 协议可用**。**应对**：把"模型可访问性"建为 `(plan, model, surface)` 三元组字段。
8. **品牌更名 + 产品名沿用**——Google One AI Premium → Pro、CodeBuddy 品牌统一、Buddy AI 融合、Vertex AI → Gemini Enterprise Agent Platform、OpenAI Priority → Fast mode。**应对**：Schema 维护同义词表 + 旧名作为 alias 保留。
9. **同价多档（plan vs model vs region vs service tier）**——Anthropic API Service tier (Standard/Priority/Batch) 与 Organization Usage tier (Eval/Start/Build/Scale) 正交；OpenAI API Service tier (Standard/Flex/Fast) 与 Usage tier (Free/1-5) 正交；Anthropic Covered Models (Fable 5 / Mythos 5) 与一般模型两套数据保留政策。**应对**：每个字段独立建模。
10. **更新频率差异**——Anthropic API Pricing 文档 1–3 个月一次重大变更；DeepSeek Change Log 2–4 周一次主要条目；OpenAI 每月 1–2 次调价；智谱 bigmodel.cn 每月 1–2 个新模型；Anthropic 公告类 2–3 个月一次。**应对**：监控多源；建立采集时点 vs 官方"Last updated"双向核对。

### 9. 后续 ticket 引用建议

#### 9.1 02-benchmark ticket

- **优先 Vendor**：01 Gemini Code Assist、02 Cursor、07 Anthropic Claude、10 Anthropic API、14 DeepSeek API（覆盖 5 种额度范式：多通道拆分、双池、三维桶、tier 升档、并发数）。
- **优先字段**：价格、限额、模型清单、上下文长度、并发、Batch 折扣。

#### 9.2 03-schema ticket

- **优先建模**：(1) `price_list` 数组；(2) `quota_model` 枚举（≥6 种原语）；(3) `model_release_date + deprecation_date` 字段；(4) `regional_availability` 五维结构；(5) `data_policy`（训练用途 + ZDR + 保留天数）；(6) `source_url + fetched_at + last_updated_at` 三字段。
- **优先覆盖**：13（智谱，含 6 单位制 + 双账户扣减 + 错误码体系）；09（OpenAI，Usage tier + Service tier + Changelog）；02（Cursor，复杂订阅 + 双池 + on-demand + 区域计划 + Token Rate + 数据驻留）。
- **特殊处理**：05 + 13（z.ai + bigmodel.cn）作为"同公司两区"案例，需建 `regional_variant` 关系而非两个独立 vendor。

#### 9.3 04-policy ticket

- **优先利用**：§4 八条归一化歧义作为策略权重调整依据；§5 六类来源冲突模式作为"采集时多源交叉"策略；§6 五维地区策略作为"对中国大陆用户的可行性"标签；§7.5 五条关键提示作为 Schema 强制约束。
- **优先策略项**：(a) "价格不全或计划版本不明时阻止强排名"；(b) "采集方必须记录抓取日期"；(c) "跨 Vendor 归一化禁止用单一倍率换算"；(d) "地区策略按 Vendor × 五维独立建模"；(e) "限时促销带生效日期采集"。

### 10. 单 Vendor 研究文件清单

每份文件均含：1. 官方入口清单表，2. 字段覆盖矩阵，3. 价格/额度原始表达方式与归一化歧义，4. 来源冲突/时效性/历史变更，5. 中国 Availability 五维度，6. 对 Data Provider / Recommendation Policy 的建议，7. 未解决问题。

| # | Vendor | 文件路径 |
|---|---|---|
| 01 | Google Gemini Code Assist | `.scratch/token-plan-advisor/research/01-gemini-code-assist.md` |
| 02 | Cursor | `.scratch/token-plan-advisor/research/02-cursor.md` |
| 03 | 腾讯 CodeBuddy | `.scratch/token-plan-advisor/research/03-tencent-codebuddy.md` |
| 04 | Trae | `.scratch/token-plan-advisor/research/04-trae.md` |
| 05 | 智谱 z.ai Coding Plan | `.scratch/token-plan-advisor/research/05-zhipu-glm-coding-plan.md` |
| 06 | OpenAI ChatGPT + Codex | `.scratch/token-plan-advisor/research/06-openai-chatgpt-codex.md` |
| 07 | Anthropic Claude + Claude Code | `.scratch/token-plan-advisor/research/07-anthropic-claude-code.md` |
| 08 | Google AI 订阅 + Gemini CLI | `.scratch/token-plan-advisor/research/08-google-gemini-subscription-cli.md` |
| 09 | OpenAI API | `.scratch/token-plan-advisor/research/09-openai-api.md` |
| 10 | Anthropic API | `.scratch/token-plan-advisor/research/10-anthropic-api.md` |
| 11 | Google Gemini API | `.scratch/token-plan-advisor/research/11-google-gemini-api.md` |
| 12 | 阿里云百炼 / Qwen API | `.scratch/token-plan-advisor/research/12-alibaba-bailian-qwen-api.md` |
| 13 | 智谱开放平台 bigmodel.cn | `.scratch/token-plan-advisor/research/13-zhipu-open-platform-api.md` |
| 14 | DeepSeek API | `.scratch/token-plan-advisor/research/14-deepseek-api.md` |

### 摘要

本次调研覆盖 14 个候选、3 个 Plan Type 分组（coding-subscription: 7 项；general-subscription: 3 项；api-usage: 5 项；含 05+13 / 03 国内+国际 / 04 国际+中国 跨产品线对），共抓取 458 个官方入口（~20 个失败，均有 docs 站/JSON-LD/快照替代）。14 份 research 共生成 8 条核心字段建议（价格、Plan 标识、计费周期、额度、模型清单、地区支持、隐私/数据、购买入口）+ 12 条次要字段 + 14 类失败码枚举 + 5 条 Schema 关键提示。跨 Vendor 归一化最大障碍是"额度"维度异质性（5 种原语）与"模型倍率"差异。

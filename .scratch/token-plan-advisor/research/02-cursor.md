# Cursor（Anysphere）官方信息来源调研

- **采集日期**：2026-09-07
- **调研范围**：Cursor 当前全部订阅层级（Hobby / Pro / Pro+ / Ultra / Teams Standard & Premium / Enterprise，另含印度区域计划 Cursor Start）及官方 API 文档（Admin API）
- **方法**：仅使用一手官方来源（cursor.com 定价页、官方文档 cursor.com/docs、帮助中心 cursor.com/help、官方博客 cursor.com/blog、法律条款页、changelog）。全部 URL 于采集日经 exa 抓取或对 cursor.com 原始 HTML 的直接请求核实；价格同时与定价页内嵌 JSON-LD 结构化数据交叉验证。无法确认的字段如实标注。

## 结论摘要

1. 当前有效个人层级为 **Hobby（免费）/ Pro（$20/mo）/ Pro+（$60/mo）/ Ultra（$200/mo）**，团队层级为 **Teams Standard（$40/user/mo）/ Teams Premium（$120/user/mo，5 倍用量）**，另有 **Enterprise（Custom）**。个人层级与 Teams 价格均见于定价页内嵌 JSON-LD（`"Offer" name=Pro price=20 …`）与帮助中心表格，二者一致。
2. Cursor 用量的官方表达方式是**两个按月重置的用量池**："Cursor Models"（第一方模型 Grok 4.5/4.6、Composer 2.5，官方仅写 "Generous included usage"，**无数值**）与 "Other Models"（第三方模型按 API 价格计费，Pro $20 / Pro+ $70 / Ultra $400 包含额度），超出后可开启 on-demand usage 按相同 API 费率后付。Teams/Enterprise 的第三方模型请求另加 **Cursor Token Rate $0.25/M tokens**。
3. **Admin API 公开团队用量信息**：`api.cursor.com` 提供 `/teams/members`、`/teams/daily-usage-data`、`/teams/spend`、`/teams/filtered-usage-events`、`/teams/audit-logs` 等端点（团队 API Key + Basic 认证）；但**仅覆盖 Teams/Enterprise**，个人计划用量只能在登录后的 Dashboard 查看；且 API 不输出"套餐包含额度"本身（first-party 池官方无数值）。
4. **中国维度唯一明确的官方声明是渠道性的**：iOS 内购计划"在 Cursor 上架 App Store 的所有地区可用，**除中国大陆外**（everywhere except mainland China）"。网页版产品无任何针对中国大陆的官方可用/禁用声明；ToS 仅含通用出口管制条款（美国禁运国家/地区）与"遵守当地法律"的注册前提。
5. Cursor 定价**近年高频变更且有一次重大沟通事故**（2025-06-16 Pro 改制 → 2025-07-04 官方道歉+退款），变更载体为带日期的官方博客 + 版本化 Pricing Policy URL（如 `/terms/pricing/2026-04-10`）+ changelog。帮助中心与文档页抓取内容中**未见**"最后更新"时间戳，价格字段需采集方自行记录抓取时间。

---

## 1. 官方入口清单

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 1 | <https://cursor.com/pricing> | 定价页（营销页） | 全球（USD 报价） | 无 | 否 | 频率切换（Monthly/Yearly）与 Pro+/Ultra 档位切换为客户端渲染，静态抓取只显示月付与 4 张卡片（Hobby/Individual/Teams/Enterprise）；页面内嵌 JSON-LD `Offer` 列出 Hobby 0/Pro 20/Pro+ 60/Ultra 200/Teams 40 USD | 是（exa 全文 + 原始 HTML 两次） |
| 2 | <https://cursor.com/docs/models-and-pricing>（别名 <https://cursor.com/docs/models>） | 文档（Models & Pricing 参考） | 全球 | 无 | 否 | 正常静态可读（提供 `.md` 版本） | 是 |
| 3 | <https://cursor.com/help/account-and-billing/pricing> | 帮助中心（定价 FAQ，含 6 计划价格表） | 全球 | 无 | 否 | 正常 | 是 |
| 4 | <https://cursor.com/help/models-and-usage/usage-limits> | 帮助中心（用量与限制） | 全球 | 无 | 否 | 正常 | 是 |
| 5 | <https://cursor.com/docs/account/teams/pricing> | 文档（团队定价与席位） | 全球 | 无 | 否 | 正常 | 是 |
| 6 | <https://cursor.com/docs/account/teams/admin-api> | API 文档（Admin API） | 全球 | 需团队 API Key 调用（阅读文档无需登录） | 调用需是 | 正常 | 是 |
| 7 | <https://cursor.com/help/account-and-billing/billing> | 帮助中心（账单与支付） | 全球 | 无 | 否 | 正常 | 是 |
| 8 | <https://cursor.com/help/account-and-billing/overages> | 帮助中心（用量计费/on-demand） | 全球 | 无 | 否 | 正常 | 是 |
| 9 | <https://cursor.com/help/models-and-usage/token-rate> | 帮助中心（Cursor Token Rate） | 全球（Teams/Enterprise） | 无 | 否 | 正常 | 是 |
| 10 | <https://cursor.com/help/models-and-usage/available-models> | 帮助中心（可用模型） | 全球 | 无 | 否 | 正常 | 是 |
| 11 | <https://cursor.com/docs/account/pricing/request-based-legacy> | 文档（legacy 按请求计价 + 模型上下文窗口表） | 全球 | 无 | 否 | 正常 | 是 |
| 12 | <https://cursor.com/help/ai-features/max-mode> | 帮助中心（Max Mode，仅 legacy 计划） | 全球 | 无 | 否 | 正常 | 是 |
| 13 | <https://cursor.com/help/security-and-privacy/regions> | 帮助中心（地区与模型可用性，含 Cursor Start 印度限定） | 全球 | 无 | 否 | 正常 | 是 |
| 14 | <https://cursor.com/docs/account/regions> | 文档（地区参考，指向各模型商支持地区） | 全球 | 无 | 否 | 经 exa 搜索快照核实关键句（未逐字全文抓取） | 部分（关键句已核实） |
| 15 | <https://cursor.com/docs/enterprise/privacy-and-data-governance> | 文档（隐私/数据治理/数据驻留） | 全球 | 无 | 否 | 正常 | 是 |
| 16 | <https://cursor.com/help/security-and-privacy/privacy> | 帮助中心（Privacy Mode） | 全球 | 无 | 否 | 正常 | 是 |
| 17 | <https://cursor.com/terms-of-service> | 法律条款（ToS，Last updated August 13, 2026） | 全球 | 无 | 否 | 正常（含 §4 支付、§16 管辖、§17.5 出口管制） | 是（全文） |
| 18 | <https://cursor.com/terms/pricing>（版本化例：<https://cursor.com/terms/pricing/2026-04-10>） | 法律条款（Pricing Policy，Last updated Aug 21, 2026） | 全球（Enterprise 条款为主） | 无 | 否 | 正常；URL 按日期版本化 | 是 |
| 19 | <https://cursor.com/blog/new-tier> | 官方博客（2025-06-16：Ultra 发布 + Pro 改制） | 全球 | 无 | 否 | 正常 | 是 |
| 20 | <https://cursor.com/blog/june-2025-pricing> | 官方博客（2025-07-04：定价澄清与道歉） | 全球 | 无 | 否 | 正常 | 是 |
| 21 | <https://cursor.com/blog/aug-2025-pricing-teams> | 官方博客（2025-08-12：Teams 计价从请求数转 API 用量） | 全球 | 无 | 否 | 正常 | 是（exa 搜索快照全文关键段） |
| 22 | <https://cursor.com/blog/teams-pricing-june-2026> | 官方博客（2026-06-01：Teams 双池 + Premium 席位 + 年付价） | 全球 | 无 | 否 | 正常 | 是 |
| 23 | <https://cursor.com/blog/composer-2> / <https://cursor.com/blog/composer-2-5> / <https://cursor.com/blog/grok-4-5> | 官方博客（2026-03-19 / 2026-05-18 / 2026-07-08：第一方模型发布与池归属） | 全球 | 无 | 否 | 正常 | 是 |
| 24 | <https://cursor.com/blog/cursor-start-india> | 官方博客（2026-07-28：Cursor Start 上线） | 印度 | 无 | 否 | 正常 | 是（exa 搜索快照全文关键段） |
| 25 | <https://cursor.com/help/account-and-billing/cursor-start> | 帮助中心（Cursor Start 详情） | 印度 | 无 | 否 | 正常 | 是 |
| 26 | <https://cursor.com/help/account-and-billing/app-store-subscription> | 帮助中心（iOS 内购，**含中国大陆例外声明**） | 全球（除中国大陆） | 无 | 否 | 正常 | 是 |
| 27 | <https://cursor.com/help/account-and-billing/student-discount> / <https://cursor.com/help/account-and-billing/referral-program> | 帮助中心（学生优惠已停新注册 / 推荐计划已终止；后者载明"Yearly plans offer a 20% discount"） | 全球 | 无 | 否 | 正常 | 是 |
| 28 | <https://cursor.com/changelog> | 更新日志（按日期） | 全球 | 无 | 否 | 正常（本次捕获 2026-08-03～08-19 条目） | 是 |
| 29 | <https://cursor.com/llms.txt> | 文档总目录（含语言版本说明：cn/ru/ja/pt-BR/es，简体中文为 `cursor.com/cn/docs/...`） | 全球 | 无 | 否 | 正常 | 是 |
| 30 | <https://cursor.com/dashboard/billing>（购买/管理入口，Stripe checkout） | 购买入口 | 全球（USD）；Start 为 INR | 需 Cursor 账号 | **是** | 控制台内，未直接抓取 | 否（以帮助中心描述为准） |
| 31 | <https://cursor.com/contact-sales> | 购买入口（Enterprise） | 全球 | 无（提交表单） | 否 | 未单独抓取，从多个官方页引用 | 否（仅引用） |
| 32 | <https://cursor.com/blog/cursor-router> | （URL 猜测） | — | — | — | 抓取返回 CRAWL_NOT_FOUND；Cursor Router 实际文档在 <https://cursor.com/help/models-and-usage/cursor-router>（本次未抓取该页，Router 内容以帮助中心定价 FAQ 与 overages 页为准） | 否 |

> 帮助中心/文档抓取的 markdown 输出中**均未显示**页面级"Last updated"时间戳；带时间戳的官方载体是 ToS / Pricing Policy / 博客 / changelog。

---

## 2. 字段覆盖矩阵

状态标注：公开（页面直接可见）/ 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用。

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开 | "Hobby"、"Pro"、"Pro+"（文档全称 "Pro Plus"）、"Ultra"、"Teams"（席位 "Standard" / "Premium" / "Free"——"Unpaid Admins"）、"Enterprise"；区域计划 "Cursor Start"（印度） | [帮助中心定价 FAQ](https://cursor.com/help/account-and-billing/pricing)、[定价页 JSON-LD](https://cursor.com/pricing)、[Cursor Start](https://cursor.com/help/account-and-billing/cursor-start) |
| Plan Type | 公开（判断） | **coding-subscription**。主体是 AI 代码编辑器/Agent 的按席位订阅（个人/团队席位 + 用量池），不按纯 API token 出售；BYOK 与独立 API Key 是附加能力而非计划本体。Enterprise 为同形态的企业合同版（Core License + Precommitted Usage，见 Pricing Policy §2.3）。Cursor Start 亦为 coding-subscription（区域子集） | [定价页](https://cursor.com/pricing)、[Pricing Policy](https://cursor.com/terms/pricing) |
| 价格 | 公开 | Hobby **Free**；Pro **$20/mo**；Pro+ **$60/mo**；Ultra **$200/mo**；Teams Standard **$40/user/mo**（年付 **$32/seat/mo**）；Teams Premium **$120/user/mo**（年付 **$96/seat/mo**，"5x the usage of a Standard seat"）；Free 席位 **$0**；Enterprise **Custom**；Cursor Start **₹649 per month, tax-inclusive**。定价页 JSON-LD：`{"@type":"Offer","name":"Pro","price":"20","priceCurrency":"USD"}, {"name":"Pro+","price":"60"}, {"name":"Ultra","price":"200"}, {"name":"Teams","price":"40"}` | [帮助中心定价 FAQ](https://cursor.com/help/account-and-billing/pricing)、[定价页 JSON-LD](https://cursor.com/pricing)、[Teams 定价博客](https://cursor.com/blog/teams-pricing-june-2026)、[Cursor Start](https://cursor.com/help/account-and-billing/cursor-start) |
| 币种 | 公开 | 个人与团队计划以 **USD** 报价："Unless otherwise specifically provided for in these Terms, all fees are in U.S. Dollars"（ToS §4.1）；Cursor Start 以 **INR** 计价（印度专属）；无其他币种选项的官方说明 | [ToS §4.1](https://cursor.com/terms-of-service)、[Cursor Start](https://cursor.com/help/account-and-billing/cursor-start) |
| 计费周期 | 公开 | "Your cycle starts on the date you subscribe. It renews monthly or yearly based on your plan."；"Usage resets monthly with your billing cycle. Unused usage does not roll over."；on-demand "billed in arrears"（按月后付）；Teams 按"active paid seat"计费，中途加人按比例计费（pro-rated） | [账单与支付](https://cursor.com/help/account-and-billing/billing)、[用量与限制](https://cursor.com/help/models-and-usage/usage-limits)、[Teams 定价](https://cursor.com/docs/account/teams/pricing) |
| 额度/使用限制 | 公开 + 文档或公告 | 每计划两个按月重置的用量池：**"Cursor Models"**（"Cursor Grok 4.5 and Composer 2.5"，后加入 Grok 4.6）池官方表述为 **"Generous included usage"（无数值）**；**"Other Models"** 池：Pro **"$20"**、Pro+ **"$70"**、Ultra **"$400"**（"of API agent usage"，按模型 API 价消耗）。"All individual plans include **unlimited tab completions**, extended agent usage limits on all models, access to Bugbot, and access to Cloud Agents."。超出后 on-demand："billed at API rates with no markup"，且 "Requests are never downgraded in quality or speed"。Hobby："Limited Agent requests"、"Limited Tab completions"（无数值）。Teams："Each paid seat comes with included usage across two pools"，Premium 席位 "5x the usage of a Standard seat"；超出后若第三方池耗尽先切换到 Cursor Models 池，再进入 on-demand。legacy 计划："500 requests per month, with Sonnet models costing two requests" | [Models & Pricing](https://cursor.com/docs/models-and-pricing)、[用量与限制](https://cursor.com/help/models-and-usage/usage-limits)、[用量计费](https://cursor.com/help/account-and-billing/overages)、[Teams 定价](https://cursor.com/docs/account/teams/pricing)、[legacy 定价文档](https://cursor.com/docs/account/pricing/request-based-legacy) |
| 模型与功能 | 公开 | 第一方模型："Composer 2.5"（"Cursor's own agentic model"）、"Grok 4.5"/"Grok 4.6"（"jointly trained by Cursor and SpaceXAI"）；第三方 "frontier models from OpenAI, Anthropic, Google, SpaceXAI, and more"；Auto 三模式（Cost/Balance/Intelligence，经 Cursor Router 路由）；功能随层级：MCPs/skills/hooks、Cloud Agents、Bugbot（Pro 为 "usage-based billing"，Teams 含 "Agentic code reviews with Bugbot"）、团队管理/SSO（Teams）、Pooled usage/SCIM/Audit logs 等（Enterprise）；"The available models depend on your plan. Hobby users have access to a smaller set, while paid plans unlock all models." | [Models & Pricing](https://cursor.com/docs/models-and-pricing)、[定价页](https://cursor.com/pricing)、[可用模型](https://cursor.com/help/models-and-usage/available-models) |
| 上下文长度 | 文档或公告 | legacy 定价文档给出**默认/最大上下文表**（现计划模型沿用该参考）：Claude Fable 5.1 300k/1M；Claude Opus 5 300k/1M；Claude Sonnet 5 200k/1M；Composer 2.5 200k/–；Grok 4.5 256k/–；Grok 4.6 256k/–；GPT-5.6 Sol 272k/1M；Gemini 3.1 Pro 200k/1M 等。模型定价表注释："Up to 1M tokens with extended context at the same per-token rates"（Claude 4.5+ Sonnet/Opus 系列）；GPT-5.6 Sol："When input exceeds 272k tokens (long context), input pricing doubles and output pricing is 1.5x"。Max Mode（扩大上下文窗口）"available only on legacy request-based plans"，计价为 "model's API rate plus 20%" | [legacy 定价文档](https://cursor.com/docs/account/pricing/request-based-legacy)、[Max Mode](https://cursor.com/help/ai-features/max-mode)、[模型页示例](https://cursor.com/docs/models/gpt-5-6-sol) |
| 速率限制 | 文档或公告（部分）+ 无法确认（用户级数值） | 当前计划**未公布用户级速率数值**，限额表现为用量池消耗 + on-demand；仅模型注释级信息（"Preview models … have more restrictive rate limits"；"GPT-5.1 Codex Mini: 4x rate limits compared to GPT-5.1 Codex"）。Admin API 自身限速公开："Rate limited to 20 requests per minute per team"（audit-logs、daily-usage-data 端点）。历史术语 "fast requests"/"slow requests" 已随 2025-06 改制退场（legacy 文档保留说明） | [Models & Pricing 模型表](https://cursor.com/docs/models-and-pricing)、[Admin API](https://cursor.com/docs/account/teams/admin-api)、[legacy 定价文档](https://cursor.com/docs/account/pricing/request-based-legacy) |
| 并发 | 无法确认 | 官方页面无"并发会话/并行 Agent 数"字段；未见与并发相关的公开数值。查过定价页、Models & Pricing、用量与限制、Teams 定价 | 同上 |
| 隐私/数据处理 | 文档或公告 | **Privacy Mode**："ensures your code is never used for training by Cursor or other AI model providers"；团队可强制开启，"Privacy Mode is on by default for Enterprise teams"；ToS §1.3（2026-08-13 版）："ANYSPHERE WILL NOT USE CONTENT TO TRAIN, OR ALLOW ANY THIRD PARTY TO TRAIN, ANY AI MODELS, UNLESS YOU'VE EXPLICITLY AGREED"；"Most models run under Cursor's ZDR agreements"（零数据保留），个别需数据保留的模型（Claude Fable 5）默认关闭并需管理员批准；Teams/Enterprise 受 DPA 约束，个人计划 DPA 不适用；sub-processor 列表在 trust.cursor.com/subprocessors；**数据驻留**："US-only data residency"（Enterprise，"incurs a 10% uplift on Model pricing"），"EU + Iceland inference-only coverage is available on request" | [隐私与数据](https://cursor.com/help/security-and-privacy/privacy)、[ToS §1.3](https://cursor.com/terms-of-service)、[隐私与数据治理](https://cursor.com/docs/enterprise/privacy-and-data-governance) |
| 注册要求 | 文档或公告 | ToS §2："at least the age of majority in your jurisdiction … or 18 years old, whichever is higher"、"your registration and use of the Service is in compliance with all applicable laws in your region"；Hobby："No credit card required"；购买经 Stripe checkout（"Complete payment through Stripe checkout"）；Cursor Start 须验证印度手机号；Admin API 使用 "Basic Authentication with your API key" | [ToS §2](https://cursor.com/terms-of-service)、[定价页 FAQ](https://cursor.com/pricing)、[帮助中心定价 FAQ](https://cursor.com/help/account-and-billing/pricing)、[Cursor Start](https://cursor.com/help/account-and-billing/cursor-start) |
| 支付方式 | 公开 | 定价页 FAQ："Self-serve plans support all major credit and debit cards. For invoice-based billing and wire transfers, please contact us to discuss the Enterprise plan."；ToS §4.3：经 **Stripe** 处理；iOS 应用内购由 Apple 作为 merchant of record（仅月付 Pro/Pro+/Ultra，且见中国维度）；Cursor Start："UPI … Indian credit and debit cards (3D Secure authentication is required)"；管理入口为 Stripe billing portal | [定价页 FAQ](https://cursor.com/pricing)、[ToS §4.3](https://cursor.com/terms-of-service)、[App Store 订阅](https://cursor.com/help/account-and-billing/app-store-subscription)、[Cursor Start](https://cursor.com/help/account-and-billing/cursor-start) |
| 地区政策 | 文档或公告 | 无面向网页版产品的"支持国家清单"；地区差异官方声明有四处：(1) 模型级地区限制由模型提供商决定，"certain models may not be available in your region"（[地区与模型可用性](https://cursor.com/help/security-and-privacy/regions)、[地区参考](https://cursor.com/docs/account/regions)）；(2) Cursor Start 仅限印度，含反 VPN 措施："If you access Cursor from outside India or use a VPN, your requests may be blocked"；(3) iOS 内购计划 "available in every region where Cursor is on the App Store, which is everywhere except mainland China"；(4) ToS §17.5 出口管制："The Service may not be used in or for the benefit of, or exported or re-exported to (a) any U.S. embargoed country or territory or (b) any individual or entity with whom dealings are prohibited or restricted under applicable trade laws"（未点名中国大陆） | 同左 |
| 官方购买链接 | 公开 | 定价页 "Get Pro" → `https://cursor.com/api/auth/checkoutDeepControl?yearly=false`；计划变更为 `https://cursor.com/dashboard/billing`（Stripe portal，需登录）；Teams 创建 `https://cursor.com/team/new-team`；Enterprise/ pooled usage "Contact sales"（`cursor.com/contact-sales`）；官方明示**禁经分销商**："Cursor subscriptions are only sold directly through cursor.com. We do not authorize any resellers or third-party sellers." | [定价页](https://cursor.com/pricing)、[帮助中心定价 FAQ](https://cursor.com/help/account-and-billing/pricing) |
| 官方 API（用量可见性） | 官方 API | Admin API（Teams/Enterprise）：`GET /teams/members`、`GET /teams/audit-logs`、`POST /teams/daily-usage-data`（"aggregated at the hourly level"，含 `composerRequests/chatRequests/agentRequests/subscriptionIncludedReqs/usageBasedReqs/bugbotUsages/mostUsedModel` 等）、`POST /teams/spend`（`spendCents`=on-demand、`overallSpendCents`=含包含用量、`monthlyLimitDollars`/`hardLimitOverrideDollars`）、`POST /teams/filtered-usage-events`（事件级，账单请求数以 `requestsCosts` 求和为准）；另有 Organizations API（跨团队）。注意：API **不输出**套餐包含额度的官方数值；个人计划无 Admin API，用量仅登录 Dashboard（Spending 页）可见 | [Admin API](https://cursor.com/docs/account/teams/admin-api)、[用量与限制](https://cursor.com/help/models-and-usage/usage-limits) |
| 更新时间 | 文档或公告 | ToS 页首 "Last updated August 13, 2026"；Pricing Policy "Last updated Aug 21, 2026"（且 URL 按日期版本化）；博客与 changelog 均带日期；帮助中心与文档页抓取内容**未显示**更新时间 → 价格/额度字段的"最后确认时间"须由采集方记录抓取日期 | [ToS](https://cursor.com/terms-of-service)、[Pricing Policy](https://cursor.com/terms/pricing)、[changelog](https://cursor.com/changelog) |

---

## 3. 价格/额度的原始表达方式与归一化歧义

### 3.1 官方原始表述（照录）

- 定价页卡片：`Hobby: Free`、`Individual: $20 / mo.`、`Teams: $40 / user / mo.`（Standard/Premium 切换）、`Enterprise: Custom`；JSON-LD：Hobby 0 / Pro 20 / Pro+ 60 / Ultra 200 / Teams 40（USD）。
- 帮助中心表格：`| Hobby | Free | Limited |`、`| Pro | $20/mo | $20 |`、`| Pro+ | $60/mo | $70 |`、`| Ultra | $200/mo | $400 |`、`| Teams Standard | $40/user/mo | Standard team allowance |`、`| Teams Premium | $120/user/mo | 5x Standard team allowance |`。
- 用量池表述：**"Cursor Models: Significantly more included usage for Cursor Grok 4.5 and Composer 2.5."**；**"Other Models: … include at least $20 of third-party model usage each month (more on higher tiers)"**；Teams 博客称两池为 "First-party models pool" 与 "Third-Party API"，文档现行称 "Cursor Models" 与 "Other Models"。
- Auto：**"Auto Cost pricing is set per million tokens, regardless of which model is used"**（$1.25 input / $0.25 cache read / $6 output）；Balance/Intelligence "bill at the routed model's rate"。
- Cursor Token Rate（Teams/Enterprise）：**"$0.25 per million tokens"**，"applies to input tokens, output tokens, and cached tokens on eligible third-party model requests … This applies to BYOK as well"。
- legacy（历史原文）："a limit of 500 requests per month, with Sonnet models costing two requests"；"at least $20 of model inference at API prices per month"；官方道歉文给的中位换算："about 225 Sonnet 4 requests, 550 Gemini requests, or 650 GPT 4.1 requests"。
- 年付："Yearly plans offer a 20% discount."（帮助中心推荐计划页）；Teams 年付官方数值 "$32 per seat per month for annual plans; … $96 … Premium"。

### 3.2 归一化歧义清单

1. **第一方池无数值**：Pro/Pro+/Ultra 的 "Cursor Models" 池只有 "Generous included usage"，无美元/token 数值；跨 Vendor 比较时该池只能定性，核心可比数值只有 Other Models 池（$20/$70/$400）。且池内不同模型按各自 token 费率消耗（"usage is not 1:1 by token count"），同额度可支撑的请求量随模型浮动。
2. **"unlimited" 限定条件漂移**：2025-07 官方口径为 "Unlimited usage of Tab and models in Auto"（Auto 无限）；2026 现行文档中 unlimited 仅余 "unlimited tab completions"，Auto 改为按 token 计费入池。对 "unlimited" 字段必须记录时间点与限定对象，不可直接当无限额处理。
3. **混合计价单位**：订阅内含额度按"美元等值 @API 费率"表达，模型价按 "per million tokens"，legacy 按请求数（Sonnet=2 requests）。三套单位并存；请求级换算依赖模型选择（官方明确 "one prompt"/单请求 token 量波动可达数量级）。
4. **附加费率乘数**：Teams/Enterprise 第三方请求 +$0.25/M（Cursor Token Rate，含 BYOK）；数据驻留 +10%；legacy Max Mode/on-demand +20%；长上下文（GPT-5.6 Sol >272k 输入 2x、输出 1.5x；Claude 4 Sonnet 1M >200k 成本 2x）。归一化需按"通道+模型+开关"组合计算，不能单看 $20/$70/$400。
5. **Auto 模式歧义**：同名 "Auto" 在 Cost/Balance/Intelligence 三模式间成本差可达 2–4 倍（官方 overages 页："Balance and Intelligence cost about twice as much as the previous Auto mode on average, and up to two to four times as much"），且路由模型对外默认隐藏（"the routed model identity is hidden"）。
6. **年付价**：仅 Teams 年付有官方数值（$32/$96）；个人年付只有 "20% discount" 的官方说法，具体月单价（$16/$48/$160 为我方按 20% 换算，非官方显示文本）需登录 Stripe checkout 才能确认。
7. **区域计划不可比**：Cursor Start（₹649/月、仅第一方模型、无第三方池、无 on-demand、Grok 固定 medium effort）与全球计划不是同一字段集合，需单列 schema。
8. **Team 席位计量**："Cursor bills per active paid seat, not pre-allocated seats"，含 Free 管理席位与 Premium 5x 席位，人均价格≠席位列价。

---

## 4. 来源冲突、更新频率与历史变更方式

- **展示层冲突（非数值冲突）**：营销定价页可见卡片只有 4 张（Hobby/Individual/Teams/Enterprise），Pro+/Ultra 需切换档位控件才显示，但同页 FAQ 文本与 JSON-LD、帮助中心表格均列出 Pro+/Ultra——同一域名内呈现不一致，Provider 不应只抓卡片。
- **术语漂移**：同一事实在不同官方页表述不同——第一方池：`First-party models pool`（博客/用量页）vs `Cursor Models`（文档现行）vs 旧称 `Auto + Composer`（论坛官方答复记录 2026-07-08 更名）；包含额度：`$20 of API agent usage`（用量页）vs `$20 Other Models usage`（帮助中心表）。字段映射表必须收录同义词。
- **价格数值冲突**：本次采集中未发现官方页面之间的数值冲突（定价页 JSON-LD、帮助中心表、文档表一致）。历史上曾发生官方沟通失误：2025-06-16 改制将 Pro 从"500 requests/month（Sonnet 计 2 次）"改为用量制，2025-07-04 官方道歉并退款，明确 "'unlimited usage' was only for Auto and not all other models"。
- **更新频率**：changelog 约每周多条（产品功能）；定价类变更 2025 年至今至少 6 次（见下）；模型价格表随模型发布频繁更新（本次页面即含 2026-08-31 到期的促销价 "Launch promotion: $2/M input and $10/M output through August 31, 2026"）。
- **历史变更方式**：(1) 带日期署名的官方博客（重大变更）；(2) 版本化 URL 的 Pricing Policy（`/terms/pricing/2026-04-10` → 现行 "Last updated Aug 21, 2026"）；(3) ToS 页首 "Last updated"；(4) changelog 按日期；(5) 帮助中心专页宣布计划终止（学生优惠 "discontinued new sign-ups … on June 25, 2026"、推荐计划 "discontinued"）。
- **主要历史变更记录（官方可考）**：
  - 2025-06-16：Ultra（$200，"20x more usage than Pro"）发布；Pro 由请求制转用量制（[blog/new-tier](https://cursor.com/blog/new-tier)）。
  - 2025-07-04：定价澄清与道歉、退款（[blog/june-2025-pricing](https://cursor.com/blog/june-2025-pricing)）。
  - 2025-08-12：Teams 从 "250 Sonnet requests per month + $0.08/Sonnet request" 转为 "$20 of agent usage per user"（API list price + $0.25/M tokens，即 Cursor Token Rate 起源）（[blog/aug-2025-pricing-teams](https://cursor.com/blog/aug-2025-pricing-teams)）。
  - 2026-03-19 / 2026-05-18：Composer 2 / Composer 2.5 发布，第一方池成形（[blog/composer-2](https://cursor.com/blog/composer-2)、[blog/composer-2-5](https://cursor.com/blog/composer-2-5)）。
  - 2026-06-01：Teams 双池 + Premium 席位 + 年付价（[blog/teams-pricing-june-2026](https://cursor.com/blog/teams-pricing-june-2026)）。
  - 2026-06-25：学生优惠停止新注册（[帮助中心](https://cursor.com/help/account-and-billing/student-discount)）。
  - 2026-07-08：Grok 4.5 发布入第一方池（[blog/grok-4-5](https://cursor.com/blog/grok-4-5)）。
  - 2026-07-28：Cursor Start 上线（印度）（[blog/cursor-start-india](https://cursor.com/blog/cursor-start-india)）。
  - Cursor Router（Auto 拆分为 Cost/Balance/Intelligence）上线日期：官方公告 URL 未定位成功（`blog/cursor-router` 404），**无法确认**；现行规则见帮助中心。
- **无法确认当前有效值的字段**：个人计划年付具体月单价；Cursor Models 池数值；Hobby 具体限额；当前注册流程是否含 Pro 免费试用（本次所有抓取页面均未提及 trial）；Pro+ 层级首次上线日期；并发限制。

---

## 5. 中国 Availability（五维度）

> 原则声明：本节区分"官方明确声明"与"无法确认"；**页面无法访问或抓取失败不作为官方政策限制的证据**。检索过的官方渠道：定价页、帮助中心（定价/账单/地区/隐私/App Store/Cursor Start/学生优惠/推荐计划）、ToS 全文（含 §17.5）、Pricing Policy、官方博客、changelog、llms.txt。ToS 全文检索 "China/Chinese" 无命中。

| 维度 | 状态 | 说明 |
|---|---|---|
| 注册 | 官方明确声明（通用前提）+ 中国维度无法确认 | 官方明确（通用）：注册需账号（邮箱+密码），"at least the age of majority … or 18 years old"，且 "your registration and use of the Service is in compliance with all applicable laws in your region"（[ToS §2](https://cursor.com/terms-of-service)）。**未找到**任何官方页面声明中国大陆用户可否注册；亦无"支持国家清单"。辅助事实：官方提供简体中文文档（`cursor.com/cn/docs/...`，见 [llms.txt](https://cursor.com/llms.txt)），但语言本地化不是可用性承诺。 |
| 支付 | 官方明确声明（渠道性）+ 中国维度无法确认 | 官方明确：自助计划经 **Stripe** 支付，"all major credit and debit cards"；Enterprise 可发票/电汇；iOS 内购由 Apple 代收（[定价页 FAQ](https://cursor.com/pricing)、[ToS §4.3](https://cursor.com/terms-of-service)、[App Store 订阅](https://cursor.com/help/account-and-billing/app-store-subscription)）。**中国大陆专属声明仅一条**：iOS 内购计划 "available in every region where Cursor is on the App Store, which is everywhere except mainland China"。中国大陆银行卡/支付宝/微信能否通过 Stripe 完成自助订阅：**无法确认**（官方未列出各国可用卡种；Stripe 侧规则属于第三方政策，不在本调研采信范围）。 |
| 网络访问 | 无法确认 | 官方未声明中国大陆的网络可达性或封锁。官方只说明服务架构与模型托管（"Models are hosted by the model provider, a trusted partner, or Cursor"，[Models & Pricing FAQ](https://cursor.com/docs/models-and-pricing)），及模型级地区限制由 provider 决定（[地区页](https://cursor.com/help/security-and-privacy/regions)）。印度计划的反 VPN 表述（"If you access Cursor from outside India or use a VPN, your requests may be blocked"）证明 Cursor **技术上具备**地区访问控制能力，但无对中国大陆适用该机制的任何声明。 |
| 服务政策 | 官方明确声明（部分）+ 中国维度无法确认 | 官方明确（通用贸易条款）："The Service may not be used in or for the benefit of, or exported or re-exported to (a) any U.S. embargoed country or territory …"（[ToS §17.5](https://cursor.com/terms-of-service)）——该条**未点名中国大陆**（中国大陆不属美国全面禁运地区），属通用合规条款而非对华政策。管辖与释法：德州法律、"Unless prohibited by your country's applicable law"（[ToS §16.1](https://cursor.com/terms-of-service)）。除此之外，**未找到**任何官方页面声明 Cursor 服务在中国大陆提供或不提供；区域化定价先例仅印度（Cursor Start），官方表态 "availability may expand to more regions over time"（论坛官方回复，非页面政策）。 |
| 功能限制 | 官方明确声明（模型级，间接）+ 中国维度无法确认 | 官方明确（机制）：部分模型有 provider 侧地区限制，"certain models may not be available in your region. When this happens, those models won't appear in Cursor, but all other models continue to work"，缓解手段为 Auto/换模型/BYOK（[地区页](https://cursor.com/help/security-and-privacy/regions)、[地区参考](https://cursor.com/docs/account/regions)）。即中国大陆用户若在受影响地区，官方预期行为是**部分模型不显示**而非服务不可用；具体哪些模型在大陆受影响取决于 provider 页面（Anthropic/OpenAI/Google 官方支持地区列表，属第三方来源，本次未逐项核对）。iOS 内购渠道在大陆整体不可用（见支付维度）。无其他针对大陆的功能差异化声明。 |

---

## 6. 对 Data Provider / Recommendation Policy 的建议（供后续 ticket 引用）

- **最小来源契约**：`cursor.com/pricing`（JSON-LD Offer：计划+价格+币种）+ `cursor.com/help/account-and-billing/pricing`（6 计划价格与包含额度表）+ `cursor.com/docs/models-and-pricing`（双池、模型单价、Token Rate、Auto 模式）三页可覆盖全部核心字段，均为静态可抓（`.md` 版本可用）。
- **核心字段（缺失应阻止强排名）**：价格、币种、计费周期、Other Models 池额度、on-demand 费率口径（是否加价/附加 Token Rate）、年付折扣。注意第一方池无数值，属"官方故意不公开"而非采集失败。
- **失败分类建议**：`OK`（docs/help 静态页）；`RENDER_DEPENDENT`（pricing 页的 Yearly 切换、Individual 档位切换；替代方案=JSON-LD + 帮助中心表）；`LOGIN_REQUIRED`（dashboard/billing 实际成交价、个人用量页）；`API_AVAILABLE`（Teams 用量：Admin API，需团队 API Key）。
- **字段优先级提示**：Admin API 只解决"团队实际用量/支出"，不提供"套餐额度定义"；个人计划完全没有 API 通道。跨 Vendor 归一化时，Cursor 的"包含额度"应建模为"美元等值 @ 模型 API 费率"而非请求数。
- **监控点**：官方博客（定价类）、`/terms/pricing` 页首日期与版本化 URL、changelog、帮助中心"计划终止"类页面（学生优惠/推荐计划先例）。

## 7. 未解决问题

1. 个人计划年付的具体月单价（页面为客户端渲染，仅官方声明 "Yearly plans offer a 20% discount"；需登录 Stripe checkout 验证）。
2. "Cursor Models" 池的官方数值口径（仅 "Generous included usage"），以及 2026-07-08 起 Grok 4.5 计量入池后是否有等效美元值。
3. Pro+ 层级的首次上线日期与当时公告（官方博客未检索到；现行值以文档为准）。
4. Cursor Router（Auto 三模式拆分）的 GA 日期与发布公告 URL。
5. Hobby 层 "Limited Agent requests / Limited Tab completions" 的具体数值，以及当前注册是否附带 Pro 限时试用。
6. 中国大陆用户经 Stripe 自助订阅的实际可用性（官方无声明，须实机验证，超出本调研范围）；以及各模型 provider 对中国大陆的覆盖细项（第三方页面，未逐项核对）。

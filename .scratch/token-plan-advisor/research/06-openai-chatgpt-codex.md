# OpenAI ChatGPT 订阅与 Codex 官方信息来源调研

- **采集日期**：2026-09-07
- **调研范围**：ChatGPT 个人与团队订阅（Free / Go / Plus / Pro / Business / Enterprise / Edu / Teachers）、ChatGPT 内置 Codex（Codex mode / Codex in ChatGPT）、独立 Codex 入口（Codex CLI / Codex IDE 插件 / Codex Web 即 Codex cloud / Codex SDK / Codex Desktop App）、以及 Codex 与 OpenAI API 的计费关系
- **方法**：仅使用一手官方来源（chatgpt.com、openai.com、help.openai.com、developers.openai.com、learn.chatgpt.com、chatgpt.com/codex、openai/codex GitHub repo、官方博客 openai.com/index）。全部 URL 于采集日经 exa 抓取或对原始 HTML 的直接请求核实；价格/额度数值同时在 chatgpt.com 与 learn.chatgpt.com 两个官方表上交叉核对。无法确认的字段如实标注。

## 结论摘要

1. **ChatGPT 当前有效订阅层级**（个人）Free / Go ($8) / Plus ($20) / Pro ($100 5x 或 $200 20x)，（团队）Business Standard seat $20(年付)/$25(月付) 与 Premium seat $100(年付)/$125(月付)，（企业）Enterprise Custom，（教育）Edu "contact sales" + Teachers（2027-06 前对 K-12 免费）。
2. **Codex 不是独立订阅**：官方原话"Codex is included in your ChatGPT Free, Go, Plus, Pro, Business, or Enterprise plan"，CLI/IDE/Web/Desktop/iOS 全部走 ChatGPT 账号登录计费；用 API Key 登录则按 OpenAI API token 价（"Pay only for the tokens Codex uses, based on API pricing"）。Codex 没有"单独 Codex 订阅"。
3. **计费口径双轨**：2026-04-02 起 Plus/Pro/Business 及新 Enterprise 切到 token-based credit rate card（input/cached input/output tokens → credits，GPT-5.6 Sol 100/10/500 credits per 1M tokens）；其他计划（包括旧 Enterprise/Edu/Health/Gov/Teachers）保留 message-based 估算直到被迁移。
4. **来源冲突已确认**：chatgpt.com/codex/pricing 给 GPT-5.6 Sol Plus "15-90 / 5h"、GPT-5.6 Luna "50-280 / 5h"，learn.chatgpt.com/docs/pricing 给 Sol "10-100"、Luna "250-2,000"。GPT-5.6 三档完全不一致，老模型（5.5/5.4/5.4 mini）一致。
5. **中国 Availability 关键事实**：help.openai.com/7947663-chatgpt-supported-countries 官方支持国家清单**未包含中国大陆、香港、澳门、俄罗斯、伊朗**；本调研检索到任何官方页面均无"针对中国大陆的明确政策声明"，但 Supported Countries 列表是硬边界；任何"VPN+海外手机号"方案违反 OpenAI ToS。

---

## 1. 官方入口清单

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 1 | <https://chatgpt.com/pricing/> | 定价页（营销/计划矩阵） | 全球（地区货币本地化） | 无 | 否 | 静态可读，含 Free/Go/Plus/Pro + Business/Enterprise tab；价目以卡片形式可见 | 是（exa 全文 + 原始页 2 次） |
| 2 | <https://chatgpt.com/codex/pricing/> | Codex 专属定价页 | 全球 | 无 | 否 | 静态可读；含 plan+模型消息数 5h 窗口表 | 是（全文） |
| 3 | <https://learn.chatgpt.com/docs/pricing> | Codex 学习文档（含价格 + 信用费率 + 特性矩阵） | 全球 | 无 | 否 | 静态可读；带"Individual / Business / Enterprise" tab 切换；自动重定向原 developers.openai.com/codex/pricing | 是（全文） |
| 4 | <https://help.openai.com/en/articles/7947663-chatgpt-supported-countries> | 支持国家清单 | 全球 | 无 | 否 | 静态可读，"Updated: 22 days ago"；**不含中国大陆/港澳/俄罗斯/伊朗** | 是（全文） |
| 5 | <https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan> | Codex 入门与计划绑定（核心文档） | 全球 | 无 | 否 | "Updated: 10 minutes ago"——官方高频维护页 | 是（全文） |
| 6 | <https://help.openai.com/en/articles/11989085-what-is-chatgpt-go> | ChatGPT Go 介绍 | 全球（Go 适用地区） | 无 | 否 | 静态可读 | 是（全文） |
| 7 | <https://help.openai.com/en/articles/8792828-what-is-chatgpt-business> | ChatGPT Business 概览 | 全球（Business 适用） | 无 | 否 | 静态可读；显示 Premium seat 介绍 | 是（全文） |
| 8 | <https://help.openai.com/en/articles/11481834-chatgpt-rate-card-business-enterpriseedu> | Business/Enterprise/Edu Credit Rate Card | 全球 | 无 | 否 | 静态可读；详细 credit 表 + Edu 图片/研究免费额度 | 是（关键段已核实） |
| 9 | <https://help.openai.com/en/articles/20001106-codex-rate-card> | Codex rate card（Plus/Pro 信用） | 全球 | 无 | 否 | 静态可读 | 是（关键段已核实） |
| 10 | <https://developers.openai.com/codex> | Codex 开发者文档根目录 | 全球 | 无 | 否 | 静态可读 | 是（索引级） |
| 11 | <https://developers.openai.com/codex/cli> | Codex CLI 文档 | 全球 | 无 | 否 | 静态可读 | 是（关键段已核实） |
| 12 | <https://developers.openai.com/codex/cloud> | Codex cloud / Codex Web 文档 | 全球 | 无 | 否 | 静态可读 | 是（关键段已核实） |
| 13 | <https://developers.openai.com/codex/ide> | Codex IDE 插件文档 | 全球 | 无 | 否 | 静态可读 | 是（关键段已核实） |
| 14 | <https://learn.chatgpt.com/docs/codex/cli> | Codex CLI 学习文档 | 全球 | 无 | 否 | 静态可读；含 macOS/Linux/Windows/npm/Homebrew 安装命令 | 是（全文） |
| 15 | <https://learn.chatgpt.com/docs/codex/ide> | Codex IDE 学习文档 | 全球 | 无 | 否 | 静态可读；含 VS Code/Cursor/Windsurf/Xcode/JetBrains 接入说明 | 是（全文） |
| 16 | <https://learn.chatgpt.com/docs/cloud> | Codex cloud 学习文档 | 全球 | 无 | 否 | 静态可读 | 是（全文） |
| 17 | <https://learn.chatgpt.com/docs/code-review> | Code Review 学习文档 | 全球 | 无 | 否 | 静态可读 | 是（全文） |
| 18 | <https://learn.chatgpt.com/docs/third-party/github> | GitHub Code Review / Security Review | 全球 | 无 | 否 | 静态可读；发布日期 2026-09-06 | 是（全文） |
| 19 | <https://chatgpt.com/codex/> | Codex 产品页（Codex in ChatGPT） | 全球 | 无 | 否 | 静态可读 | 是（关键段已核实） |
| 20 | <https://openai.com/business/chatgpt-pricing/> | OpenAI 官方 Business/Enterprise 定价 | 全球 | 无 | 否 | 静态可读；显示"€29"等本地货币 | 是（关键段已核实） |
| 21 | <https://openai.com/business/pricing/> | OpenAI 官方 Business pricing | 全球 | 无 | 否 | 静态可读；显示 $20/$25 与 $100/$125 与"Custom" | 是（关键段已核实） |
| 22 | <https://openai.com/ChatGPT/pricing> | openai.com ChatGPT pricing 镜像 | 全球 | 无 | 否 | 与 chatgpt.com/pricing 内容相似 | 是（关键段已核实） |
| 23 | <https://openai.com/index/introducing-chatgpt-go/> | 官方公告：ChatGPT Go 全球上线 | 全球 | 无 | 否 | 静态可读；发布日期 2026-01-16 | 是（全文） |
| 24 | <https://openai.com/index/> | OpenAI 官方博客索引 | 通用 | 无 | 否 | 静态可读 | 是（索引级） |
| 25 | <https://github.com/openai/codex> | Codex CLI 源代码（README 含安装与登录流程） | 全球 | 无 | 否 | 静态可读 | 是（全文） |
| 26 | <https://github.com/openai/codex/blob/main/README.md> | Codex README（含 ChatGPT/API 双登录） | 全球 | 无 | 否 | 静态可读 | 是（全文） |
| 27 | <https://chatgpt.com/codex/install.sh> 与 <https://chatgpt.com/codex/install.ps1> | Codex CLI 安装脚本（OpenAI 自托管） | 全球 | 无 | 否 | 正常（脚本指向 releases.openai.com/codex） | 是（脚本内容已核实） |
| 28 | <https://developers.openai.com/api/docs/supported-countries> | OpenAI API 支持国家清单 | 全球 | 无 | 否 | 静态可读 | 是（关键句已核实） |
| 29 | ChatGPT 登录/购买入口（Stripe checkout，登录后） | 购买入口 | 全球 | 需 ChatGPT 账号 + 信用卡 | 是 | 控制台内，未直接抓取 | 否（以官方文档描述为准） |
| 30 | ChatGPT 联系销售（Enterprise/Edu）<https://chatgpt.com/contact-sales> | 购买入口（Enterprise/Edu） | 全球 | 提交表单 | 否 | 静态 | 否（仅引用） |

> 注：`developers.openai.com/codex/pricing` 自动重定向到 `learn.chatgpt.com/docs/pricing`（第三方"aimodelscompared.com"页 2026-08-21 记录此迁移，本次实测确认）。

---

## 2. 字段覆盖矩阵

状态标注：公开（页面直接可见）/ 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用。

### 2.1 ChatGPT 订阅层级

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开 | "ChatGPT Free"、"ChatGPT Go"、"ChatGPT Plus"、"ChatGPT Pro"、"ChatGPT Business"、"ChatGPT Enterprise"、"ChatGPT Edu"、"ChatGPT for Teachers"；Business 内部 seat 类型 "Standard seat"、"Premium seat"；2025-08-29 文档原文 "ChatGPT Team was renamed to ChatGPT Business on August 29, 2025" | [chatgpt.com/pricing](https://chatgpt.com/pricing/)、[Business 概览](https://help.openai.com/en/articles/8792828-what-is-chatgpt-business)、[Teachers/Edu FAQ](https://chatgpt.com/pricing/?type=team) |
| Plan Type | 公开（判断） | **general-subscription**。主体是 ChatGPT 通用订阅，含 Codex 仅是 Plus 及以上档位的子集权益（"Expanded Codex usage"）。Codex 单独定价页与 API Key 模式均属相邻 **coding-subscription**（按 ChatGPT 账号用 Codex）/ **api-usage**（按 OpenAI API token）。个人/团队订阅为 general-subscription | [chatgpt.com/pricing](https://chatgpt.com/pricing/)、[learn.chatgpt.com/docs/pricing](https://learn.chatgpt.com/docs/pricing) |
| 价格 | 公开 | **Free** $0/月；**Go** "$8 per month"（US 价；India ₹399、其他地区本地货币；官方原文 "Go pricing is localized in some markets"）；**Plus** "$20/month"；**Pro** "$100/month"（5x）或 "$200/month"（20x，原文 "From $100/month" + "Choose 5x or 20x higher rate limits than Plus"）；**Business Standard seat** "$20 per user per month when billed annually / $25 per user per month if billed monthly"；**Business Premium seat** "$100 per user per month when billed annually / $125 per user per month if billed monthly"（"5x more usage than Standard seats, no 5-hour usage limit"）；**Enterprise** "Custom"（contact sales）；**Edu** 无公开列表价（"an affordable plan"，需 contact）；**Teachers** "free plan for verified U.S. K–12 educators through June 2027"。openai.com/business/pricing/ 列出 €29（欧洲本地价） | [chatgpt.com/pricing](https://chatgpt.com/pricing/)、[openai.com/business/pricing/](https://openai.com/business/pricing/)、[openai.com/index/introducing-chatgpt-go/](https://openai.com/index/introducing-chatgpt-go/)、[Business 概览](https://help.openai.com/en/articles/8792828-what-is-chatgpt-business) |
| 币种 | 公开 | USD（默认）；"In markets where Go has been available, we've seen strong adoption… Go pricing is localized in some markets"；多币种文档 "we offer a local currency billing in a limited set of countries (see: Multi-currency billing)"；具体本地币种清单：无法确认（无公开页面枚举所有支持货币） | [openai.com/index/introducing-chatgpt-go/](https://openai.com/index/introducing-chatgpt-go/)、[What is ChatGPT Go](https://help.openai.com/en/articles/11989085-what-is-chatgpt-go) |
| 计费周期 | 公开 | 个人："Subscript­ions are billed automatically monthly, and can be canceled anytime"；"Currently, we do not support annual billing or the option to pay for multiple months in advance for ChatGPT Go, Plus, or Pro subscriptions"（仅 Pro 5x/20x 内部含年付选项 $200/month 描述）。Business/Enterprise：年付或月付 | [What is ChatGPT Go](https://help.openai.com/en/articles/11989085-what-is-chatgpt-go)、[chatgpt.com/pricing](https://chatgpt.com/pricing/) |
| 额度/使用限制（ChatGPT 通用） | 公开 | Free "Limited"；Go "Expanded"；Plus "Unlimited*"；Pro "Unlimited*"。Go 描述 "10x more messages, file uploads and image creation than the free tier"；"2x longer memory"。具体 GPT-5.5 Instant 上下文 27K/54K/54K/128K（Free/Go/Plus/Pro）；GPT Reasoning 上下文 Varies/256K/256K/400K；input 上限 "12 pages/40 pages/40 pages/250 pages"；"Maximum Codex tasks" 仅 Pro 含；Business/Edu "no fixed rate limits—usage scales with credits"（flexible pricing） | [chatgpt.com/pricing](https://chatgpt.com/pricing/)、[learn.chatgpt.com/docs/pricing](https://learn.chatgpt.com/docs/pricing) |
| 模型与功能 | 公开 | Free：GPT-5.6 Terra（Limited access in Work and Codex on desktop）、GPT-5.5 Instant（Limited）、GPT-Image-2、Voice、Plugins、Skills beta、Study mode。Go：+ "More access to GPT-5.5 Instant"、GPT-5 Thinking Mini、Voice with video、Search、Sites、Image generation、Apps、Data analysis、Memory。Plus：+ GPT-5.6、GPT-5.6 Terra Yes、GPT-5.6 Luna、Advanced reasoning、Expanded memory、Projects/tasks/Custom GPTs、Expanded Codex、Expanded access to ChatGPT Work、Early access。Business/Enterprise："No training on your business data by default"、SCIM、EKM、domain verification、RBAC、SAML SSO、Expanded context、Data residency（"US, EU, UK, JP, CA, KR, SG, IN, AU, UAE"）、Compliance API、Analytics | [chatgpt.com/pricing](https://chatgpt.com/pricing/) |
| 上下文长度 | 公开 | 见上"额度"行；GPT-5.6 系列上下文窗口以"27K/54K/54K/128K"（GPT Instant total）与"Varies/256K/256K/400K"（GPT Reasoning total）+ "12/40/40/250 pages"输入长度表达，未给出统一的"xK tokens"模型上下文窗口数字 | [chatgpt.com/pricing](https://chatgpt.com/pricing/) |
| 速率限制 | 文档或公告 | Business/Edu（非 flexible pricing）："same per-seat usage limits as Plus for most features"；Plus/Pro 表达为"每 5 小时窗口消息数"（见 Codex 章节）；Business/Edu（flexible pricing）："no fixed rate limits—usage scales with credits"。ChatGPT Voice：Plus 15–30min、Pro 5x 1–2.5h、Pro 20x Unlimited、Business 45min、Enterprise/Edu (legacy) 45min | [learn.chatgpt.com/docs/pricing](https://learn.chatgpt.com/docs/pricing)、[Business 概览](https://help.openai.com/en/articles/8792828-what-is-chatgpt-business) |
| 并发 | 无法确认 | 官方定价页无"并发会话数"字段。Codex cloud 支持"work in parallel"但与个人订阅上限无关 | — |
| 隐私/数据处理 | 文档或公告 | Business/Enterprise/Edu："By default, OpenAI does not use any inputs or outputs from our products for business users, including ChatGPT Business, ChatGPT Enterprise, and the API, to improve our models. However, API organization owners can choose to opt-in to share API data with OpenAI. This setting is not available to certain organizations, including Enterprise and customers with Zero Data Retention enabled." Plus/Pro："Conversations may be used to improve models unless you turn off training in ChatGPT data controls." Data residency "ten regions"：US/EU/UK/JP/CA/KR/SG/IN/AU/UAE | [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)、[chatgpt.com/pricing](https://chatgpt.com/pricing/) |
| 注册要求 | 文档或公告 | 通用："the age of majority in your jurisdiction or 18 years old, whichever is higher"；注册须在 Supported Countries 列表内（"Accessing or offering access to our services outside of the countries and territories listed below may result in your account being blocked or suspended"）。Business 需 ≥2 seats（"Business plans are available starting at 2 users"）。Teachers 需 "verified U.S. K–12 educators" | [Supported Countries](https://help.openai.com/en/articles/7947663-chatgpt-supported-countries)、[chatgpt.com/pricing](https://chatgpt.com/pricing/) |
| 支付方式 | 文档或公告 | "You can purchase ChatGPT Go, Plus, Pro, or Business with any major credit card. For ChatGPT Enterprise, please contact sales for alternative payment options such as invoicing." India：UPI 支持（"allowed users to pay through UPI"） | [chatgpt.com/pricing](https://chatgpt.com/pricing/)、[openai.com/index/introducing-chatgpt-go/](https://openai.com/index/introducing-chatgpt-go/) |
| 地区政策 | 文档或公告 | 官方 Supported Countries 列表（7947663）为唯一硬边界；不含中国大陆、香港、澳门、俄罗斯、伊朗。Data residency 在 10 区域可选（仅 Business/Enterprise）。个人/Plus/Pro 没有 "regional" 区别，"Multi-currency billing" 仅在部分国家 | [Supported Countries](https://help.openai.com/en/articles/7947663-chatgpt-supported-countries)、[chatgpt.com/pricing](https://chatgpt.com/pricing/) |
| 官方购买链接 | 公开 | <https://chatgpt.com/pricing/> 内每张卡片含 "Get Plus"/"Get Go"/"Get Pro"/"Get Business" 按钮 → Stripe checkout；Enterprise/Edu 通过 Contact Sales 表单；Business 用户 admin 控制台管理 seat 切换 | [chatgpt.com/pricing](https://chatgpt.com/pricing/)、[Business 概览](https://help.openai.com/en/articles/8792828-what-is-chatgpt-business) |
| 更新时间 | 文档或公告 | chatgpt.com/pricing 未显示 "Last updated"；Supported Countries 页 "Updated: 22 days ago"；Using Codex 页 "Updated: 10 minutes ago"（OpenAI 维护频率：核心 Codex 文档极高频更新）；help.openai.com 各文章带"Updated"时间戳 | [Using Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)、[Supported Countries](https://help.openai.com/en/articles/7947663-chatgpt-supported-countries) |

### 2.2 Codex（与 ChatGPT 绑定）

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识 | 公开 | Codex 不是独立 plan；"Codex is included in your ChatGPT Free, Go, Plus, Pro, Business, or Enterprise plan"。客户端："ChatGPT desktop app (Codex mode)"、"Codex CLI"、"Codex IDE extension"、"Codex web"。附加工具面："ChatGPT for Excel"、"Workspace Agents"、"ChatGPT Work"。API Key 模式："Codex in the CLI, SDK, or IDE extension … No cloud-based features (GitHub code review, Slack, etc.) … Pay only for the tokens Codex uses, based on API pricing" | [chatgpt.com/codex/pricing/](https://chatgpt.com/codex/pricing/)、[learn.chatgpt.com/docs/pricing](https://learn.chatgpt.com/docs/pricing)、[Using Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) |
| Plan Type | 公开（判断） | Codex 通过 ChatGPT 计划访问 → **coding-subscription**（走 ChatGPT 账号，与 Plus/Pro/Business 绑定）。Codex 通过 API Key 访问 → **api-usage**（"based on API pricing"）。Enterprise 另有 "Codex seat"（"a Codex seat based on flexible pricing. Codex seats provide access to Codex only - they do not include ChatGPT workspace access, and have no fixed cost per user per month. Using Codex requires workspace credits"） | [learn.chatgpt.com/docs/pricing](https://learn.chatgpt.com/docs/pricing)、[Enterprise release notes](https://help.openai.com/en/articles/10128477-chatgpt-enterprise-edu-release-notes) |
| 价格 | 公开 | Codex 本身无单独价格；"Codex is included across ChatGPT plans"。Codex seat（Enterprise）：no fixed cost + workspace credits；"Legacy Codex-only seats are eligibility-bound … require a seat before June 24, 2026 or a pending invite as of June 24" | [Business 概览](https://help.openai.com/en/articles/8792828-what-is-chatgpt-business)、[learn.chatgpt.com/docs/pricing](https://learn.chatgpt.com/docs/pricing) |
| 额度/使用限制 | 文档或公告 | 5 小时窗口（Plus/Pro/Business），local messages 范围（chatgpt.com/codex/pricing）：GPT-5.6 Sol 15–90 / GPT-5.6 Terra 20–110 / GPT-5.6 Luna 50–280 / GPT-5.5 15–80 / GPT-5.4 20–100 / GPT-5.4 mini 60–350。learn.chatgpt.com/docs/pricing 同模型：GPT-5.6 Sol 10–100 / Terra 25–200 / Luna 250–2,000 / GPT-5.5 15–80 / GPT-5.4 20–100 / GPT-5.4 mini 60–350。Pro 5x/20x 表（仅 learn.chatgpt.com）：分别为 Plus 的 5x/20x。"Additional weekly limits may apply"（**官方未公布 weekly 数值**）。Business：与 Plus 同；flexible pricing 下无固定限制。Edu：Enterprise 段说明 "For a limited time, Enterprise/Edu users without flexible pricing receive 2x Codex rate limits"。"On ChatGPT plans, local messages and cloud chats share a five-hour window" | [chatgpt.com/codex/pricing/](https://chatgpt.com/codex/pricing/)、[learn.chatgpt.com/docs/pricing](https://learn.chatgpt.com/docs/pricing) |
| 模型与功能 | 公开 | Codex 可用模型：GPT-5.6 Sol / Sol Pro / Terra / Luna、GPT-5.5、GPT-5.4 / 5.4 mini、GPT-5.3-Codex-Spark（Pro 用户独占 research preview，API 不开放）、GPT-Image-2、Daybreak Blue（"GPT-5.6 Sol credit rates"）、Daybreak Red（"requires Trusted Access for Cyber approval"）。Speed："Fast mode consumes credits at a higher rate"；"GPT-5.6 Sol's promotional pricing is available at least through November 21, 2026"。模型退役："On Aug 31, 2026, GPT-5.4 and GPT-5.4 mini will retire in Codex for users signed in with ChatGPT. Use GPT-5.6 Terra instead of GPT-5.4 and GPT-5.6 Luna instead of GPT-5.4 mini. OpenAI API access and Codex use with your own API key are not affected." | [learn.chatgpt.com/docs/pricing](https://learn.chatgpt.com/docs/pricing)、[Using Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) |
| 上下文长度 | 文档或公告 | Codex 各模型上下文窗口**未单独列出**，沿用 OpenAI API 模型公开上下文长度（属第三方 fetch 范围，本次未单核 GPT-5.6 Sol/Terra/Luna 官方页） | — |
| 速率限制 | 文档或公告 | 表达为"5 小时窗口消息数" + "weekly limits may apply"；Business/Edu（flexible pricing）"no fixed rate limits—usage scales with credits"。"Faster speed settings use more credits"；Codex-Spark "because it runs on specialized low-latency hardware, usage is governed by a separate usage limit that may adjust based on demand" | [learn.chatgpt.com/docs/pricing](https://learn.chatgpt.com/docs/pricing) |
| 并发 | 文档或公告（Codex cloud） | Codex cloud 支持并行："Run work in parallel: Give longer tasks dedicated environments and let them continue while you work on something else" | [learn.chatgpt.com/docs/cloud](https://learn.chatgpt.com/docs/cloud) |
| 隐私/数据处理 | 文档或公告 | Codex 走 ChatGPT 数据控制："Your ChatGPT training data controls apply to content processed through Codex, including screenshots taken by Computer Use. Local workflows run on your device; cloud tasks run in OpenAI-managed environments. Connected services may be available across supported ChatGPT and Codex surfaces, and you can disconnect them at any time." "When you sign in to Codex using an existing ChatGPT account, the ChatGPT Terms of Use and Privacy Policy—or the corresponding online services agreement for OpenAI API and ChatGPT Enterprise, Education or Business Users—apply to data shared between Codex and ChatGPT." Code Review 数据：仅 GitHub PR 内的 Codex 评论与 PR diff 处理（"Codex reviews the pull request diff, follows your repository guidance, and posts a standard GitHub code review"） | [Using Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)、[GitHub Code Review](https://learn.chatgpt.com/docs/third-party/github) |
| 注册要求 | 文档或公告 | 登录：ChatGPT 账号或 OpenAI API Key。Codex cloud 需连接 GitHub（或 GitLab Beta）；GitHub 端需 push 或 admin 权限才能开 automatic reviews。"Some Enterprise workspaces may require admin setup before you can access Codex" | [Web/Cloud 文档](https://learn.chatgpt.com/docs/cloud)、[GitHub Code Review](https://learn.chatgpt.com/docs/third-party/github) |
| 支付方式 | 文档或公告 | 沿用 ChatGPT 计划支付方式（信用卡、UPI 等）；API Key 模式按 OpenAI API 账单调通 | [chatgpt.com/pricing](https://chatgpt.com/pricing/) |
| 地区政策 | 文档或公告 | Codex Web 与 GitHub Code Review 入口（chatgpt.com/codex）受 Supported Countries 硬边界限制。Codex CLI 在本机运行不受网络地理限制，但 ChatGPT 登录与 Codex cloud 都需 Supported Countries | [Supported Countries](https://help.openai.com/en/articles/7947663-chatgpt-supported-countries) |
| 官方购买链接 | 公开 | <https://chatgpt.com/codex/pricing/>、<https://chatgpt.com/codex/>、<https://chatgpt.com/codex/install.sh>（CLI 安装）、<https://github.com/openai/codex>（开源 CLI） | 见入口清单 |
| 官方 API（用量可见性） | 官方 API | Compliance API："Codex usage, including local clients such as the CLI and IDE extension as well as web or cloud-delegated usage, is available in the Compliance API. This log surface covers supported Codex clients, separate from cloud-task-specific endpoints." Codex Enterprise Analytics API："Access to Codex Enterprise Analytics is available to Enterprise workspaces with Codex enabled. To use the Codex Enterprise Analytics API, use an organization API key that has Codex Enterprise Analytics access." 个人用量 dashboard：登录后 Settings → Usage & billing；CLI 内 `/status` | [Using Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) |
| 更新时间 | 文档或公告 | learn.chatgpt.com/docs/pricing 显示 "Pricing | ChatGPT Learn"（无 Last updated 时间戳，但 chatgpt.com/codex/pricing 与 learn.chatgpt.com/docs/pricing 是两份独立维护文档）；GitHub Code Review 文档显式发布日 2026-09-06；Using Codex "Updated: 10 minutes ago" | 各页 |

---

## 3. 价格/额度的原始表达方式与归一化歧义

### 3.1 官方原始表述（照录）

- 个人："Free $0/month"、"Go $8/month"、"Plus $20/month"、"Pro From $100/month"（Pro 5x = $100、Pro 20x = $200）
- Business："Standard seat: Monthly plan: $25 per user per month / Annual plan: $20 per user per month, billed annually"；"Premium seat: Monthly plan: $125 per user per month / Annual plan: $100 per user per month, billed annually"
- Codex 消息表（chatgpt.com/codex/pricing，Plus 列）："GPT-5.6 Sol 15-90 / GPT-5.6 Terra 20-110 / GPT-5.6 Luna 50-280 / GPT-5.5 15-80 / GPT-5.4 20-100 / GPT-5.4 mini 60-350"（5 小时窗口）；"Cloud Tasks Not available"；"Code Reviews Not available"
- Codex 消息表（learn.chatgpt.com/docs/pricing，Plus 列）："GPT-5.6 Sol 10-100 / GPT-5.6 Terra 25-200 / GPT-5.6 Luna 250-2,000 / GPT-5.5 15-80 / GPT-5.4 20-100 / GPT-5.4 mini 60-350"
- Credit Rate Card（Plus/Pro）："GPT-5.6 Sol 100 credits input / 10 cached / 500 output (per 1M tokens)；GPT-5.6 Terra 50/5/300；GPT-5.6 Luna 5/0.5/30；GPT-5.5 125/12.50/750；GPT-5.4 62.50/6.250/375；GPT-5.4 mini 18.75/1.875/113；GPT-Image-2 (image) 200/50/750；GPT-Image-2 (text) 125/31.25/250"
- Business/Edu Rate Card（同 chatgpt.com 上，但 Business/Edu 用户无 dynamic rate card 部分）："Standard ChatGPT seats use included plan limits first. If the workspace has purchased credits, eligible usage can continue from the shared credit pool after an included limit is reached."
- Codex 切换计价公告："As of April 2, pricing is shifting to API-style token rates. Credits are still what you buy, but usage now depends on input, cached input, and output tokens consumed."

### 3.2 归一化歧义清单

1. **消息数 ≠ 实际消息数**：官方明确"Codex does not actually meter messages. It meters tokens, converts them into credits, and derives the message ranges from an assumed spread of message sizes"——所有"10–100"区间是按 token 量换算成的消息数估算，prompt 长度变化 5–8 倍在区间内属正常波动。跨 Vendor 比较时不能直接以消息数等值。
2. **三档 GPT-5.6 在两个官方页不一致**（chatgpt.com/codex/pricing vs learn.chatgpt.com/docs/pricing），老模型（GPT-5.5/5.4/5.4 mini）一致。**归一化应以 learn.chatgpt.com/docs/pricing 为准**——它包含完整 5 档切换（Plus/Pro 5x/Pro 20x/Business/API Key），且 Pro 5x/20x 是 Plus 的精确 5x/20x（12/12 一致）。
3. **Weekly 限额官方未公布**：两个页都仅说"Additional weekly limits may apply"，无任何具体数值。第三方抓取"Codex Usage Limits in 2026"文章验证 2026-08-21 时两页均无 weekly 数字。
4. **Codex CLI 双计费**："CLI is free to install"——CLI 软件免费；实际费用取决于登录凭据：(a) ChatGPT 账号 → 走 ChatGPT 计划 credit pool；(b) OpenAI API Key → 走 API token 价。"Run heavy CLI session and heavy web session in the same five-hour window, and they draw from the same pool. The CLI is not a side door around plan pricing."
5. **Codex Cloud vs Codex Local 共享池**：local messages + cloud chats 共享 5 小时窗口（"local messages and cloud chats share a five-hour window"）；Codex work、ChatGPT Work、ChatGPT for Excel、Workspace Agents 同池。
6. **Code Review 独立计量**："What counts as Code Review usage? Code Review usage applies only when Codex runs reviews through GitHub—for example, when you tag @Codex for review in a pull request or enable automatic reviews on your repository. Reviews run locally or outside of GitHub count toward your general usage limits."——即 Code Review 是 cloud/GitHub 专项，local `/review` 不算 Code Review。
7. **Business Premium "无 5 小时限制"**："Premium includes 5x more usage than Standard seats, no 5-hour usage limit"——Premium 不受 Standard seat 的 5 小时窗口约束，改为更高用量池。
8. **Pro 内部细分**：5x = $100、20x = $200，"Pro used to be a single $200 plan. OpenAI split it on April 9, 2026 into Pro 5x and Pro 20x"——5x 与 20x 是同 Pro 下的两档独立价，对应不同 usage 档位。
9. **Speed 设置成本乘数**："Fast mode consumes credits at a higher rate for supported models"；image generation "use included limits ~3-5x faster"——单价不变，消耗速率变化。
10. **Codex Cloud 并发**："Run tasks in parallel"——但官方未公布具体并行数上限；并行数通过 workspace credit pool 隐式限制。
11. **历史变更**：Pro 拆分（2026-04-09）、Codex 计价迁移到 token credits（2026-04-02）、GPT-5.4/5.4 mini 退役（2026-08-31）、Daybreak 模型预览（限 trusted access）、GPT-5.6 Sol 促销价延至 2026-11-21。归一化时这些字段必须带生效日期采集。

---

## 4. 来源冲突、更新频率与历史变更方式

### 4.1 来源冲突

- **冲突 1（GPT-5.6 Plus 限额）**：
  - chatgpt.com/codex/pricing（Plus 列 / 5h）：Sol 15–90 / Terra 20–110 / Luna 50–280
  - learn.chatgpt.com/docs/pricing（Plus 列 / 5h）：Sol 10–100 / Terra 25–200 / Luna 250–2,000
  - 老模型完全一致：GPT-5.5 15–80、GPT-5.4 20–100、GPT-5.4 mini 60–350
  - 第三方"aimodelscompared.com" 2026-08-21 核查：Luna 在 chatgpt.com 上比 learn.chatgpt.com 低约 7x；GPT-5.6 Sol/Terra 反向轻微偏离
  - **判定**：以 learn.chatgpt.com/docs/pricing 为准（含完整 5 档 + credit 表 + 特性矩阵），chatgpt.com/codex/pricing 的 GPT-5.6 数据为旧/迁移期未同步版本
- **冲突 2（Plus "Codex 不可用"）**：chatgpt.com/pricing 表显示 Plus "Codex: Yes"，chatgpt.com/codex/pricing 描述 Plus 为 "Expanded Codex usage"；learn.chatgpt.com/docs/pricing 显示 Plus 同样可访问 Codex CLI/IDE/Web——一致性，但前者文案比后者更简略
- **冲突 3（API Key 模式 Codex 是否能 GitHub review）**：chatgpt.com/codex/pricing 写 API Key 模式 "Not available" 任何 cloud 功能；learn.chatgpt.com/docs/pricing 表格列 API Key 列为 "Usage-based"——一致表达（API Key 模式只走 token 价）
- **冲突 4（Codex 上下文窗口）**：定价页与功能对比页均未给出 Codex 模型独立上下文窗口；只能引用 OpenAI API 公开页（超出本调研范围）

### 4.2 更新频率

- 核心 Codex 文档（help.openai.com/11369540）"Updated: 10 minutes ago"——极高频维护
- 文档站/chatgpt.com/codex/pricing 表数据存在 GPT-5.6 三档不一致 → 正在过渡（已观察到 chatgpt.com 仍含 GPT-5.6 旧表，learn.chatgpt.com 已切到新值）
- 官方博客（openai.com/index）按事件发布（Go 上线 2026-01-16、Pro 拆分 2026-04-09 等）
- release notes（如 Enterprise/Edu release notes 文章 10128477）按版本

### 4.3 历史变更方式

- 重大变更走官方博客 + help center release notes
- Codex 文档为 learn.chatgpt.com/docs/* 形态（"Markdown versions of documentation pages are available by appending `.md` to the page URL"），URL 稳定
- URL 重定向：developers.openai.com/codex/pricing → learn.chatgpt.com/docs/pricing（已确认）
- Codex CLI 安装脚本：<https://chatgpt.com/codex/install.sh> 与 <https://chatgpt.com/codex/install.ps1>，指向 releases.openai.com/codex
- 主要历史变更记录（官方可考）：
  - 2025-08-18/19：ChatGPT Go 在印度首发（₹399/$4.60，含 UPI 支付）
  - 2025-08-29：ChatGPT Team 改名 ChatGPT Business
  - 2026-01-16：ChatGPT Go 全球上线（US $8/月）
  - 2026-04-02：Codex 计价从 message-based 切到 token-based credits（Plus/Pro/Business 及新 Enterprise）
  - 2026-04-09：Pro 拆分为 Pro 5x ($100) 与 Pro 20x ($200)
  - 2026-04-23：旧 Enterprise/Edu/Health/Gov/Teachers 跟随迁移
  - 2026-08-31：GPT-5.4/5.4 mini 退出 Codex（ChatGPT 登录），用 GPT-5.6 Terra/Luna 替代
  - 2026-09-06：learn.chatgpt.com/docs/third-party/github（含 Security Review）发布

### 4.4 页面是否显示更新时间

- help.openai.com 文章带"Updated"（"22 days ago" / "10 minutes ago"）
- chatgpt.com/pricing 与 chatgpt.com/codex/pricing 无"Last updated"时间戳
- learn.chatgpt.com/docs/pricing 无显式时间戳，但 GitHub Code Review 文档显示发布日期 2026-09-06
- 官方博客带发布日期
- CLI 安装脚本无时间戳；GitHub Releases 含版本日期

### 4.5 无法确认当前有效值的字段

- 每周消息上限（"Additional weekly limits may apply" 但未给数字）
- GPT-5.6 Sol/Terra/Luna 各自的官方上下文窗口（须查 OpenAI API 模型页，超本调研范围）
- "Multi-currency billing" 支持的完整国家+币种清单（官方仅写"limited set of countries"，未枚举）
- Codex Cloud 并行数上限
- Codex Cloud 默认 VM 规格
- Codex CLI 上 ChatGPT 账号余额耗尽后的硬行为（页面说"fair-use limits"）

---

## 5. 中国 Availability（五维度）

> 原则声明：本节区分"官方明确声明"与"无法确认"；**页面无法访问或抓取失败不作为官方政策限制的证据**。检索过的官方渠道：help.openai.com/7947663、help.openai.com/11369540、help.openai.com/8792828、help.openai.com/11481834、help.openai.com/11989085、openai.com/index/introducing-chatgpt-go、openai.com/business/pricing、openai.com/business/chatgpt-pricing、chatgpt.com/pricing、chatgpt.com/codex/pricing、learn.chatgpt.com/docs/pricing、developers.openai.com/codex/*、GitHub openai/codex README。

| 维度 | 状态 | 说明 |
|---|---|---|
| 注册 | 官方明确声明（不含中国大陆） | 官方 Supported Countries 清单（[help.openai.com/7947663](https://help.openai.com/en/articles/7947663-chatgpt-supported-countries)）列出 188 个国家/地区，**不含中国大陆、香港、澳门**。原文："Accessing or offering access to our services outside of the countries and territories listed below may result in your account being blocked or suspended."——中国大陆用户无法在 OpenAI 官方流程内完成 ChatGPT/Codex 注册；VPN+海外手机号的方式违反 ToS（第三方页面报道，OpenAI 未在支持页对此单独声明）。 |
| 支付 | 官方明确声明（含渠道限制） | 通用："You can purchase ChatGPT Go, Plus, Pro, or Business with any major credit card. For ChatGPT Enterprise, please contact sales for alternative payment options such as invoicing." UPI 支持特定国家（印度等）。中国大陆支付方式（银联、支付宝、微信支付、Apple Pay）的官方支持情况：**未找到**任何官方页面明确列出中国大陆可用支付方式；通过 Supported Countries 的硬边界，间接意味着该问题不在 OpenAI 公开支持范围。 |
| 网络访问 | 无法确认 | 官方未声明中国大陆网络可达性或封锁。OpenAI 公开支持的 188 国家清单不含中国大陆——这是 OpenAI 服务范围政策，不直接等同于中国网络层封禁；实际网络可达性属第三方观察范围，本调研不采信。 |
| 服务政策 | 官方明确声明（含间接政策） | (a) Supported Countries 是唯一的"地区范围"官方声明，不含中国大陆；(b) Codex CLI 软件本身开源（Apache 2.0，GitHub），不受 Supported Countries 网络访问约束（"Codex CLI is a coding agent from OpenAI that runs locally on your computer"）；(d) API Key 模式 OpenAI API 同样受 Supported Countries 限制（[developers.openai.com/api/docs/supported-countries](https://developers.openai.com/api/docs/supported-countries)）。中国大陆用户访问 ChatGPT/Codex 服务属于 OpenAI 政策禁止行为。 |
| 功能限制 | 官方明确声明（部分）+ 中国维度无法确认 | (a) Sites（Codex 内 Sites 功能）："Sites is not currently available in the European Economic Area, Switzerland, or the United Kingdom"——给出 EEA/CH/UK 的官方功能屏蔽清单，未提中国大陆；(b) Record & Replay："initial availability excludes the European Union, Switzerland and the UK"——同上；(c) Computer Use / Browser 等功能带 "Limited*" 标记，"Feature is currently limited to only specific regions. Check the individual feature documentation to learn more about geo restrictions"——官方承认"特定地区"存在功能限制，但未公布清单。中国大陆是否在这些限制内：**未找到**官方声明；按 Supported Countries 硬边界，间接不在支持范围。 |

---

## 6. 对 Data Provider / Recommendation Policy 的建议（供后续 ticket 引用）

- **最小来源契约**：`chatgpt.com/pricing/`（个人 + Business/Enterprise tab，价格与特性矩阵）+ `chatgpt.com/codex/pricing/`（Codex 计划权益 + 5h 消息表）+ `learn.chatgpt.com/docs/pricing`（完整 5 档切换 + credit rate card + 特性矩阵 + voice 限额）+ `help.openai.com/7947663`（支持国家硬边界）四页可覆盖核心字段。
- **核心字段（缺失应阻止强排名）**：价格、币种、计费周期、Plus/Pro/Business/Enterprise 五个 Plan 名称、Codex 是否可用、Codex 模型清单、5h 消息数（以 learn.chatgpt.com/docs/pricing 为准）、credit rate（GPT-5.6 Sol/Terra/Luna 必含）、weekly 限额（官方不公开，须显式记"无法确认"）。
- **失败分类建议**：`OK`（pricing/chatgpt.com、learn.chatgpt.com 静态可读）；`RENDER_DEPENDENT`（少数 marketing 卡片动画）；`LOGIN_REQUIRED`（Stripe checkout、usage dashboard）；`API_AVAILABLE`（Compliance API、Codex Enterprise Analytics API，需 org API key）；`REGION_BLOCKED`（Supported Countries 是硬边界，Data Provider 可在本地预筛）。
- **字段优先级提示**：chatgpt.com/codex/pricing 与 learn.chatgpt.com/docs/pricing 的 GPT-5.6 数据不一致时以 learn 为准；weekly 限额与 Codex-Spark 限额当前无公开值，必须显式标记。
- **监控点**：help.openai.com/11369540 的 "Updated" 时间戳（核心文档极高频）；openai.com/index 重大公告；help.openai.com/Enterprise release notes；developers.openai.com/codex → learn.chatgpt.com/docs URL 重定向（如再有迁移需兼容）。

## 7. 未解决问题

1. Pro 5x 与 Pro 20x 拆分后的详细功能差异（chatgpt.com/pricing 未单独列出 Pro 5x/20x 特性差异，需依赖 learn.chatgpt.com/docs/pricing）。
2. Codex Weekly 限额具体数值（两个官方页均仅说"may apply"）。
3. GPT-5.6 Sol/Terra/Luna 的官方上下文窗口（须查 OpenAI API 模型公开页，超本调研范围）。
4. Multi-currency billing 的完整国家+币种清单（官方仅说"limited set of countries"）。
5. Codex Cloud 并行任务数上限、默认 VM 规格、queue 行为。
6. Codex-Only Seat 在 Enterprise 下的具体规则（包括 2026-06-24 legacy 截止后是否还有新申请路径）。
7. 中国大陆用户实测可行性（如需确认须登录实机验证，超出本调研范围；官方仅有"hard block"声明）。
# Google AI 订阅（Google AI Plus / Pro / Ultra）与 Gemini CLI 官方信息来源调研

- **采集日期**：2026-09-07
- **调研范围**：Google 当前面向个人消费者的 **Google AI 订阅**（Google AI Free / Plus / Pro / Ultra）与 **Gemini CLI** 作为 Google 官方终端代理工具。明确不含 Gemini API（token 按量计费）、Code Assist Standard/Enterprise 订阅定价（由 01-gemini-code-assist.md 单独覆盖）、Antigravity 平台（Gemini CLI 的后继产品）。
- **方法**：仅使用一手官方来源（gemini.google 订阅页、one.google.com/Google One 计划页、ai.google.dev 文档、blog.google 官方公告、google-gemini/gemini-cli GitHub 仓库、support.google.com 帮助中心、developers.googleblog.com）。所有 URL 于采集日经 exa 抓取或原始页面搜索快照核实；无法确认的字段如实标注。第三方汇总站（含本调研中转引的数字）仅用于交叉核对，不作为事实依据。

## 结论摘要

1. **当前有效个人层级为 4 档**：`Free`（无 Google AI 订阅的默认 Google 账号）→ `Google AI Plus` ($7.99/mo) → `Google AI Pro` ($19.99/mo) → `Google AI Ultra`，后者在 2026-05-19 Google I/O 后拆为两档：5x ($99.99/mo) 与 20x ($199.99/mo)；$250 顶级档已停售（I/O 当日降价 $250→$200）。Pro 层级价格自 2024-02 作为"Google One AI Premium"上架起至 2026-09 维持 **$19.99/mo 不变**。
2. **Gemini CLI 是 Google 官方开源终端代理**（仓库 `google-gemini/gemini-cli`，Apache-2.0 协议，最近 release v0.46.0 = 2026-06-10，Nightly 已迭代到 v0.55.0）。它的额度表按"登录方式 × 订阅"区分，个人层登录档（Free / Google AI Pro / Ultra）与 Code Assist 档（Standard / Enterprise）共用同一天 quota 池（按"agent mode + Gemini CLI 合并"统计）。免费档 60 req/min + 1,000 req/day（按 model family 自动调度），Pro 1,500/day，Ultra 2,000/day。
3. **2026-06-18 重大断档**：Google 官方博客（2026-05-19）宣布 Gemini CLI **停止为 Google AI Pro / Ultra / 个人免费层** 提供服务；该日期后，`gemini` 命令对消费者 OAuth 登录返回请求被拒，官方引导用户迁移到 **Antigravity CLI**（命令 `agy`）。**Code Assist Standard / Enterprise 订阅以及付费 Gemini API key / Vertex AI key 通道不受影响**，仍可在 `gemini` CLI 中使用（GitHub 仓库 FAQ 2026-06-18 维护者置顶公告）。该公告原文链接在本报告 §4。
4. **Gemini app 内的"使用额度"是另一套机制**：compute-based（按 prompt 复杂度、模型、对话长度），**5 小时刷新窗口 + 周上限**（Gemini Apps Help "16275805"）；不可与 Gemini CLI 的每日 RPD 直接换算。Ultra 5x/20x 的 5x/20x 是"高于 Pro"的相对倍数，Pro 与 Plus 的具体 quota 数字 Google 不公布绝对值（仅写 "Expanded / Higher / Highest"），这是跨 Vendor 归一化时最棘手的歧义点。
5. **中国 Availability**：Google 官方未在任何订阅页对 Google AI 订阅或 Gemini CLI 给出"中国可用/不可用"的明确声明；但 Google 的支持国家清单（Gemini web app "13575153"）包含 "Mainland China" 时**仅限 Workspace 客户**（"Mainland China (Workspace only)"），即个人 Google 账号订阅 Google AI Pro/Ultra 在中国大陆不被支持。Gemini mobile app 支持清单不包含中国大陆、香港、澳门。Google AI Studio / Gemini API 另有独立支持国家清单，中国大陆不在内。
6. **Google AI Pro/Ultra ≠ Code Assist Standard/Enterprise**：前者是 Google One 体系内的消费者订阅，绑定个人 Google 账号；后者是 Google Cloud 体系内的企业订阅，绑定 Cloud 项目/billing account。两者在产品定位、价格、登录方式、ToS、隐私政策上完全独立，不应混为一谈（详见 §5）。

---

## 1. 官方入口清单

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 1 | <https://gemini.google/subscriptions/> | 订阅产品页（Pro/Ultra，地区多子域：us/gb/au/ca/in/am/ht/al/mq/cy/gp/na） | 全球，按国家/币种切子域 | 无 | 否 | 静态可读，差异主要在币种与国家声明 | 是（多子域抓取） |
| 2 | <https://one.google.com/intl/en_us/about/google-ai-plans/> | Google One 计划页（Plus/Pro/Ultra 完整比较表） | 全球（按国家/币种） | 无 | 否 | 正常 | 是 |
| 3 | <https://one.google.com/about/> | Google One 主页（计划选择器） | 全球 | 无 | 否 | 正常 | 是 |
| 4 | <https://support.google.com/googleone/answer/14534406?hl=en> | 帮助中心："Use Google AI Pro benefits"（权益清单） | 全球 | 无 | 否 | 正常 | 是 |
| 5 | <https://support.google.com/googleone/answer/16882689> | 帮助中心："Use Google AI Plus benefits" | 全球 | 无 | 否 | 正常 | 是 |
| 6 | <https://support.google.com/gemini/answer/16275805?hl=en> | 帮助中心："Gemini Apps limits and upgrades for Google AI subscribers"（5h/weekly 窗口机制） | 全球 | 无 | 否 | 正常 | 是 |
| 7 | <https://support.google.com/gemini/answer/13575153?hl=en> | 帮助中心："Where you can use the Gemini web app"（国家清单，含 Mainland China Workspace-only 标注） | 全球 | 无 | 否 | 正常 | 是（关键句核实） |
| 8 | <https://support.google.com/gemini/answer/14579026> | 帮助中心：Gemini mobile app 国家清单 | 全球 | 无 | 否 | 正常；Android/iOS 各一张表 | 是 |
| 9 | <https://support.google.com/gemini/answer/14517446> | 帮助中心："Manage your Google AI plan from Gemini Apps" | 全球 | 无 | 否 | 正常 | 是 |
| 10 | <https://gemini.google/release-notes/> | Gemini Apps 发布说明（含订阅调整公告条目） | 全球 | 无 | 否 | 正常 | 是 |
| 11 | <https://github.com/google-gemini/gemini-cli> | GitHub 仓库根 README（**Google 官方维护**，Apache-2.0） | 全球 | 无 | 否 | 正常 | 是 |
| 12 | <https://github.com/google-gemini/gemini-cli/blob/main/README.md> | 仓库 README 源文件 | 全球 | 无 | 否 | 正常 | 是 |
| 13 | <https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/quota-and-pricing.md> | 仓库文档：Gemini CLI Quotas and Pricing（含完整订阅对照表） | 全球 | 无 | 否 | 正常；页内 "Last updated" 未显示，但更新与 GitHub commit 同步 | 是（全文） |
| 14 | <https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/faq.md> | 仓库文档：FAQ（OAuth/Pro 关系/ToS） | 全球 | 无 | 否 | 正常 | 是 |
| 15 | <https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/tos-privacy.md> | 仓库文档：Terms of Service & Privacy Notice（按登录方式分别列 ToS/Privacy） | 全球 | 无 | 否 | 正常 | 是 |
| 16 | <https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/authentication.mdx> | 仓库文档：Authentication guide（含 Workspace/Cloud Project 设置） | 全球 | 无 | 否 | 正常 | 是 |
| 17 | <https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md> | 仓库文档：MCP servers（Gemini CLI 扩展性） | 全球 | 无 | 否 | 正常 | 是 |
| 18 | <https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/troubleshooting.md> | 仓库文档：Troubleshooting（含 Workspace/Google Cloud 账号报错） | 全球 | 无 | 否 | 正常 | 是 |
| 19 | <https://github.com/google-gemini/gemini-cli/releases> | 仓库 Releases（含 v0.46.0 = 2026-06-10） | 全球 | 无 | 否 | 正常 | 是 |
| 20 | <https://github.com/google-gemini/gemini-cli/discussions/27274> | Discussion："An important update: Transitioning Gemini CLI to Antigravity CLI"（2026-05-19 Google 维护者发布） | 全球 | 无 | 否 | 正常 | 是（搜索快照） |
| 21 | <https://github.com/google-gemini/gemini-cli/discussions/28017> | Discussion："Gemini CLI Has Stopped Serving Requests for Individual ..."（2026-06-18 维护者确认停服） | 全球 | 无 | 否 | 正常 | 是（搜索快照） |
| 22 | <https://developers.googleblog.com/en/an-important-update-transitioning-gemini-cli-to-antigravity-cli/> | Google Developers Blog 官方公告（2026-05-19） | 全球 | 无 | 否 | 正常 | 是（搜索快照，关键段完整） |
| 23 | <https://blog.google/products-and-platforms/products/google-one/google-ai-subscriptions/> | Google 官方博客："Google AI subscription updates from Google I/O 2026"（2026-05-19） | 全球 | 无 | 否 | 正常 | 是 |
| 24 | <https://blog.google/products-and-platforms/products/google-one/google-ai-ultra/> | Google 官方博客："Google announces AI Ultra subscription plan"（2025-05-20 旧版 $249.99 起价） | 全球 | 无 | 否 | 正常 | 是 |
| 25 | <https://blog.google/products-and-platforms/products/google-one/google-ai-plus-availability/> | Google 官方博客："Google AI Plus expands to 35 new countries and territories"（2026-01-27） | 全球 | 无 | 否 | 正常 | 是 |
| 26 | <https://blog.google/innovation-and-ai/technology/developers-tools/gdp-premium-ai-pro-ultra/> | Google 官方博客：GDP premium 整合进 AI Pro/Ultra（2026-01-27） | 全球 | 无 | 否 | 正常 | 是 |
| 27 | <https://blog.google/innovation-and-ai/technology/developers-tools/gemini-cli-code-assist-higher-limits/> | Google 官方博客："Get higher Gemini CLI and Gemini Code Assist limits"（2025-09-24） | 全球 | 无 | 否 | 正常 | 是（搜索快照） |
| 28 | <https://blog.google/innovation-and-ai/technology/developers-tools/google-one-ai-studio/> | Google 官方博客：AI Studio higher limits for AI subscribers（2026-04-20） | 全球 | 无 | 否 | 正常 | 是（搜索快照） |
| 29 | <https://ai.google.dev/gemini-api/docs/available-regions> | Google AI for Developers：Gemini API / AI Studio 支持国家 | 全球 | 无 | 否 | 正常 | 是 |
| 30 | <https://antigravity.google/docs/plans/> | Antigravity 文档 Plans 页（替代品描述） | 全球 | 无 | 否 | 正常 | 是（搜索快照；属"关系说明"非本任务主体） |
| 31 | <https://antigravity.google/blog/changes-to-antigravity-plans> | Antigravity 博客："Changes to Antigravity Plans"（2026-05-19） | 全球 | 无 | 否 | 正常 | 是（搜索快照） |
| 32 | <https://one.google.com/about/plans> 与 <https://one.google.com/account/plans>（登录态） | Google One 实际订阅/管理入口 | 全球 | 需 Google 账号 | **是** | 控制台内，未抓取 | 否（以帮助中心描述为准） |
| 33 | <https://codeassist.google/> | Code Assist 产品页（仅用作"消费者 Pro/Ultra 与 Code Assist 是不同产品"的关系证据，详见 01-gemini-code-assist.md） | 全球 | 无 | 否 | 正常 | 是（关系引用） |

> 备注：Gemini CLI 仓库当前 README 与 docs/resources/quota-and-pricing.md 仍**保留** Free 1,000/天、Pro 1,500/天、Ultra 2,000/天的 quota 数字。这是停服（2026-06-18）前的快照内容；GitHub 仓库 commit 历史显示文档最近一次更新并未删除该表，提示 Google 在仓库层面**未单独标记**该表对消费者档已失效。判断当前有效状态必须结合 discussions/28017 与官方博客 2026-05-19 公告（详见 §4）。

---

## 2. 字段覆盖矩阵

状态标注：公开（页面直接可见）/ 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用。

### 2.1 Google AI 订阅（Google AI Plus / Pro / Ultra / Free）

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开 | "Google AI Plus"（旧名"Google AI Premium"）、"Google AI Pro"（旧名"Google One AI Premium"，2024-02 上架，2026-05 I/O 改名）、"Google AI Ultra"；含两档：5x 与 20x；Gemini Apps 端另含无订阅的"Free/Standard limits"档。"Plus"与"Pro"与"Ultra"统称"Google AI plans"或"Google AI subscriptions" | [gemini.google/subscriptions](https://gemini.google/subscriptions/)、[one.google.com/google-ai-plans](https://one.google.com/intl/en_us/about/google-ai-plans/)、[blog.google I/O 2026](https://blog.google/products-and-platforms/products/google-one/google-ai-subscriptions/) |
| Plan Type | 公开（判断） | **general-subscription**（消费级 AI + 存储 + Google 应用集成的订阅产品，覆盖 Gemini app、Gemini CLI/Antigravity、NotebookLM、Flow、Jules、AI Studio 等多种产品）。不属 coding-subscription（无"面向软件开发"的专属定位），也非 api-usage（不走 token 计费）。**但 Gemini CLI 作为产品可经 Pro/Ultra 登录使用**，本任务聚焦这一交叉场景 | [gemini.google/subscriptions](https://gemini.google/subscriptions/)、[Gemini CLI Quotas and Pricing](https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/quota-and-pricing.md) |
| 价格 | 公开 | **USD 口径**（其他币种见 §2.3）：Plus $7.99/mo（首 2 个月 50% off）；Pro **$19.99/mo**（首年 50% off / 学生 1 年免费 / 部分国家月费换算后低于 $10）；Ultra 5x $99.99/mo；Ultra 20x $199.99/mo（I/O 2026 当日由 $249.99 降价）。**注意**：Gemini 订阅页脚注 "1" 写 "Google AI Plus, Pro, and Ultra plans are available in more than **140** countries and territories"，而正文横幅写 "150+"，Google One 计划页写 "Plus 160+ / Pro 150+ / Ultra 150+"，同一事实三种表述（详见 §4） | [gemini.google/subscriptions](https://gemini.google/subscriptions/)、[one.google.com/google-ai-plans](https://one.google.com/intl/en_us/about/google-ai-plans/)、[blog.google I/O 2026](https://blog.google/products-and-platforms/products/google-one/google-ai-subscriptions/) |
| 币种 | 公开 | 随国家/地区自动切换：USD、GBP (£18.99/mo Pro / £79.99/mo Ultra 5x / £189.99/mo Ultra 20x)、AUD ($149.99 / $329.99)、CAD ($39.99 / $139.99 / $279.99)、INR (₹1,950 Pro / ₹6,500 Ultra 5x / ₹19,500 Ultra 20x) 等。页脚注："Price varies by country" | 多子域 gemini.google/subscriptions |
| 计费周期 | 公开 | 月付。Google One 帮助说明 "Cancel anytime. No refunds for partial billing periods, except as required by applicable law"；学生 1 年免费为特殊优惠 | [gemini.google/subscriptions 脚注](https://gemini.google/subscriptions/)、[帮助中心 Use Google AI Pro benefits](https://support.google.com/googleone/answer/14534406) |
| 额度/使用限制（**Gemini app 端**） | 文档或公告 | 帮助中心原文："Gemini Apps have compute-based usage limits that determine how much you can interact with Gemini tools and features. These limits factor in the complexity of your prompt, the models and features you use, and the length of your chat. **Your limit refreshes every 5 hours until you reach your weekly limit**." Plans 对照表：Without an AI plan "Standard limits"；Plus "**2x higher than standard limits**"；Pro "**4x higher than standard limits**"；Ultra "**5x or 20x higher than AI Pro limits depending on your subscription**"。超限可购买 AI credits（Google One 中管理）："AI credits are deducted based on standard API pricing for the specific model and complexity of request" | [Gemini Apps limits 帮助 16275805](https://support.google.com/gemini/answer/16275805)、[Use Google AI Pro benefits](https://support.google.com/googleone/answer/14534406) |
| 额度/使用限制（**Gemini CLI 端，按订阅×登录方式**） | 文档或公告 | 仓库 `quota-and-pricing.md` 完整表格（按登录方式列日 RPD 上限）：Google 账号登录 `Gemini Code Assist (Individual)` **1,000 requests/day**（OAuth）；`Google AI Pro` **1,500/day**；`Google AI Ultra` **2,000/day**；Gemini API key `Free tier (Unpaid)` **250/day**（仅 Flash）；`Pay-as-you-go` 依 API 价；Vertex AI Express mode / Pay-as-you-go 视账户；Workspace 登录 `Code Assist Standard` **1,500/day**；`Code Assist Enterprise` **2,000/day**；`Workspace AI Ultra` **2,000/day**。README 原文："Free tier: **60 requests/min and 1,000 requests/day**"（个人层）。**重要时效**：该表对消费者 Pro/Ultra/individuals 自 2026-06-18 起不再可用（详见 §4） | [Gemini CLI Quotas and Pricing](https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/quota-and-pricing.md)、[README](https://github.com/google-gemini/gemini-cli/blob/main/README.md) |
| 额度/使用限制（**Antigravity 端，Pro/Ultra 替代方案**） | 文档或公告 | Antigravity Plans 文档原文（消费者档）："All plans receive a baseline of: ... Use of Gemini models including Gemini 3.1 Pro, Gemini 3.5 Flash, and other offered Gemini Enterprise Agent Platform models ... **Unlimited Tab completions** ... Access to all product features, such as the Scheduled Tasks and the CLI"。Ultra 用户："**The highest, most generous quota, refreshed every five hours** ... Highest weekly rate limits ... Access to third-party models"。Pro 用户："**High, generous quota, refreshed every five hours until weekly limit reached** ... Higher weekly rate limit"。免费档："**Meaningful quota, refreshed weekly** ... Weekly rate limit"。**未公布绝对数字**。I/O 2026 公告相对倍数：Ultra 5x = 5× Pro、Ultra 20x = 20× Pro | [Antigravity Plans](https://antigravity.google/docs/plans/)、[blog.google I/O 2026](https://blog.google/products-and-platforms/products/google-one/google-ai-subscriptions/)、[Antigravity Changes blog 2026-05-19](https://antigravity.google/blog/changes-to-antigravity-plans) |
| 模型与功能 | 公开 | Pro："expanded access to Gemini 3.1 Pro ... 1M token context window ... Deep Research ... Veo 3.1 Lite trial ... Gemini in Gmail/Docs/Vids ... 5 TB cloud storage"。Ultra 5x：上述 + 20 TB 存储 + Gemini Spark（select countries，Ultra 5x 与 20x 均含，**Spark 仅美/英 beta**）+ Deep Think + 5× Antigravity rate limits。Ultra 20x：上述 + 30 TB + 20× Antigravity + 25,000 Flow credits + Project Genie（按 Antigravity 文档）。Plus：Gemini 3 Pro（含 Nano Banana Pro）、200 GB 存储、Flow/NotebookLM 高级、Gemini in Gmail/Chrome。**Gemini CLI 文档明文**：OAuth 登录档"Model requests will be made across the Gemini model family as determined by Gemini CLI"——CLI 客户端按内部策略在 Pro/Flash 间切换；API key 登录档默认仅 Flash；2026-03-25 起官方限制"**Gemini Pro models will only be accessible via paid subscriptions. Free tier users will be limited to Gemini Flash models**" | [gemini.google/subscriptions](https://gemini.google/subscriptions/)、[one.google.com/google-ai-plans](https://one.google.com/intl/en_us/about/google-ai-plans/)、[Gemini CLI Quotas and Pricing](https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/quota-and-pricing.md)、[Discussion 22970](https://github.com/google-gemini/gemini-cli/discussions/22970) |
| 上下文长度 | 文档或公告 | Pro/Ultra 营销原文："**1M token context window**"（"1 million token context window"）；Gemini CLI README："Gemini 3 models with 1M token context window"；Antigravity Plans 默认模型含 "Gemini 3.1 Pro, Gemini 3.5 Flash"（按模型本身的 context window，**不统一为 1M**）。Plus 文档上下文未明确 | [gemini.google/subscriptions](https://gemini.google/subscriptions/)、[Gemini CLI README](https://github.com/google-gemini/gemini-cli/blob/main/README.md)、[Antigravity Plans](https://antigravity.google/docs/plans/) |
| 速率限制（个人层 Gemini CLI） | 文档或公告 | 个人层 OAuth 登录："**60 requests/min**"（README 原文） + 每日 RPD 上限（见上）。Code Assist Standard/Enterprise 档"Requests per second: 2"（01 已覆盖）。Help Center 16275805（Gemini app）："**5 hour** ... **weekly**" 双层窗口（不与 RPD 同维度） | [Gemini CLI README](https://github.com/google-gemini/gemini-cli/blob/main/README.md)、[Gemini Apps limits 16275805](https://support.google.com/gemini/answer/16275805) |
| 并发 | 无法确认 | 官方页面无"并发会话/并行 Agent 数"字段。Gemini CLI 文档与 Google AI 订阅页均未公布。Antigravity Plans 提到 "All plans ... Unlimited Tab completions"，但未量化并发数 | 查过 §1 中 #1–11 |
| 隐私/数据处理 | 文档或公告 | 分登录方式不同（Gemini CLI FAQ + tos-privacy.md 完整矩阵）：(a) **OAuth 登录个人层（individuals / Google AI Pro / Ultra 消费者）**："Privacy Notice: Gemini Code Assist Privacy Notice for Individuals ... your prompts, answers, and related code are collected and may be used to improve Google's products, including for model training"——即**会收集、可能用于训练**。(b) **Code Assist Standard/Enterprise**：Google Cloud Platform ToS；"your inputs are confidential. Your prompts, answers, and related code are not collected and are not used to train models"。(c) **Gemini API Paid** + **Vertex AI Gen API**："Google Cloud or Gemini API (Paid Service) terms, which treat your inputs as confidential. Your code, prompts, and other inputs are not used to train models"。Gemini Apps 补充："Gemini Apps Activity ... turned off" 时 conversations 不用于训练但保留 72 小时 | [Gemini CLI tos-privacy](https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/tos-privacy.md)、[Gemini CLI FAQ](https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/faq.md)、[Gemini Apps Help 13594961](https://support.google.com/gemini/answer/13594961)（经 Discussion 28017 引文核实） |
| 注册要求 | 文档或公告 | "**personal Google Account that you manage on your own**"（gemini.google/subscriptions 原文）；"Available for users aged over 18"；Gemini CLI 官方明文禁止"Using third-party software, tools, or services to harvest or piggyback on Gemini CLI's OAuth authentication"，违反可致立即停用。Family plan 共享：Plus/Pro/Ultra 经理可与最多 5 名家庭成员共享；成员须在同一国家 | [gemini.google/subscriptions](https://gemini.google/subscriptions/)、[Use Google AI Pro benefits](https://support.google.com/googleone/answer/14534406)、[Use Google AI Plus benefits](https://support.google.com/googleone/answer/16882689)、[Gemini CLI FAQ](https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/faq.md) |
| 支付方式 | 文档或公告 | Google One 渠道订阅，信用卡/借记卡（Google 支持的卡种因国家而异，未列出中国大陆可用卡种）；App Store 内购由 Apple 处理（iOS）；学生免费走 SheerID 验证。**Gemini CLI 没有任何独立支付方式**，完全随 Google AI 订阅 | [one.google.com/google-ai-plans](https://one.google.com/intl/en_us/about/google-ai-plans/)、[Use Google AI Pro benefits](https://support.google.com/googleone/answer/14534406) |
| 地区政策 | 文档或公告 | Plus：**160+ countries**；Pro：**150+ countries**；Ultra：**150+ countries**；Gemini web app：**230+ countries and territories, 70+ languages**（"more than 140 countries and territories" 是脚注另一处表述）；Gemini mobile app：**150+ countries**。"Mainland China" 在 web app 清单中标注"**Workspace only**"，个人 Google 账号无法使用。Google AI Plus 在 2026-01-27 扩展到 35 个新国家（含美国），但中国大陆不在其中 | [Gemini Apps limits 16275805](https://support.google.com/gemini/answer/16275805)、[Where you can use Gemini web app 13575153](https://support.google.com/gemini/answer/13575153)、[Gemini mobile app availability 14579026](https://support.google.com/gemini/answer/14579026)、[blog.google AI Plus availability](https://blog.google/products-and-platforms/products/google-one/google-ai-plus-availability/) |
| 官方购买链接 | 公开 | gemini.google/subscriptions 页内 "How to upgrade" → Google One checkout；gemini.google.com → "Settings & help → Subscriptions" → Google One（管理/取消也走 Google One settings） | [gemini.google/subscriptions](https://gemini.google/subscriptions/)、[Manage your Google AI plan 14517446](https://support.google.com/gemini/answer/14517446) |
| 官方 API（用量可见性） | 官方 API | Google AI 订阅**没有公开的用量查询 API**；订阅管理走 one.google.com 控制台；Gemini CLI 端 `/stats` 命令可查本地缓存 token 信息，但**不输出套餐额度数值**（"Cached token information is only displayed when cached tokens are being used. ... not for OAuth users"）；API key 通道的实时用量见 Google AI Studio / Cloud 控制台 | [Gemini CLI FAQ](https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/faq.md) |
| 更新时间 | 文档或公告 | 帮助中心 16275805、14534406、16882689、14517446 均为无显式 "Last updated" 抓取显示的页面（采集日期 2026-09-07 即事实采集时点）；gemini.google/release-notes/ 与 Antigravity Plans 文档有可识日期的更新条目。重大变更载体：blog.google 官方博客 + Gemini Apps release notes + GitHub Discussions 置顶公告 | 见 §1 |

### 2.2 Gemini CLI（作为产品）

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| 产品身份 | 公开 | README 原文："Gemini CLI is an **open-source** AI agent that brings the power of Gemini directly into your terminal."；"License: Apache License 2.0"；仓库 `google-gemini/gemini-cli`（Google 官方 GitHub 组织） | [Gemini CLI README](https://github.com/google-gemini/gemini-cli/blob/main/README.md) |
| 仓库与最近发布 | 文档或公告 | 仓库 owner = `google-gemini`；Release v0.46.0 公开时间 **2026-06-10T01:15:02Z**（by `gemini-cli-robot`，同 PR #27570）；v0.54.0-nightly 已迭代到 **2026-07-27**（仍在持续发布） | [Releases 页](https://github.com/google-gemini/gemini-cli/releases)、[v0.46.0 tag](https://github.com/google-gemini/gemini-cli/releases/tag/v0.46.0) |
| 安装与启动 | 公开 | README 原文：`npx https://github.com/google-gemini/gemini-cli`（无安装）；"git clone https://github.com/google-gemini/gemini-cli"（自建）；npm `@google/gemini-cli` 包；推荐本地机器+浏览器走 OAuth | [Gemini CLI README](https://github.com/google-gemini/gemini-cli/blob/main/README.md) |
| 登录方式（4 种） | 文档或公告 | Authentication guide 原文："1. **Individual Google accounts**: Includes all free tier accounts such as Gemini Code Assist for individuals, as well as paid subscriptions for Google AI Pro and Ultra. 2. **Organization accounts**: ... Google Workspace ... Includes Google AI Ultra for Business subscriptions. 3. **Gemini API key** (AI Studio). 4. **Vertex AI** (GenAI API)." Google Cloud Project 仅当 Workspace/Developer Program/Code Assist 订阅时必需 | [Authentication guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/authentication.mdx) |
| 内置能力 | 公开 | README 原文："Google Search grounding, file operations, shell commands, web fetching"；MCP（Model Context Protocol）支持；AGENTS.md / GEMINI.md 项目规则；`/tools`、`/mcp`、`/model` 等 slash 命令 | [Gemini CLI README](https://github.com/google-gemini/gemini-cli/blob/main/README.md)、[MCP 文档](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md) |
| MCP 扩展 | 文档或公告 | 三种 transport：Stdio、SSE、Streamable HTTP；OAuth 2.0 支持远程 MCP server；通过 `~/.gemini/settings.json` 的 `mcpServers` 配置；`gemini mcp` 子命令管理；冲突处理 "first registration wins"，后续自动前缀 `serverName__toolName`；schema sanitization 移除 `$schema`/`additionalProperties`、名称清洗（>63 字符中间截断） | [MCP server 文档](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md) |
| 退出代码 | 文档或公告 | "Exit Code 41 FatalAuthenticationError, 42 FatalInputError, 44 FatalSandboxError, 52 FatalConfigError, 53 FatalTurnLimitedError" | [Troubleshooting 文档](https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/troubleshooting.md) |
| ToS/隐私（按登录方式） | 文档或公告 | tos-privacy.md 完整矩阵：(a) Google 账号 + Code Assist for individuals → Google Terms of Service + Gemini Code Assist Privacy Notice for individuals（**数据可能用于训练**）；(b) Code Assist Standard/Enterprise → GCP Terms + Gemini Code Assist Privacy Notice for Standard and Enterprise（**不收集、不训练**）；(c) Gemini Developer API Unpaid → Gemini API Unpaid Terms + Google Privacy Policy（**数据可能用于训练**）；(d) Gemini Developer API Paid → Gemini API Paid Terms（**不训练**）；(e) Vertex AI Gen API → GCP Service Terms + GCP Privacy Notice | [tos-privacy 文档](https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/tos-privacy.md) |
| 2026-06-18 断档 | 文档或公告 | 维护者公告："Today, June 18, 2026, marks the official transition of our terminal experience from Gemini CLI to the new Antigravity CLI. Starting today, **Gemini CLI will stop serving requests for Google AI Pro, Google AI Ultra, and free tier individual accounts**. **Enterprise users with Gemini Code Assist licenses and API key authentication remain completely unaffected**." 引导用户装 `antigravity.google/cli/install.sh`（命令 `agy`） | [Discussion 28017](https://github.com/google-gemini/gemini-cli/discussions/28017)、[Discussion 27274](https://github.com/google-gemini/gemini-cli/discussions/27274)、[developers.googleblog.com 公告](https://developers.googleblog.com/en/an-important-update-transitioning-gemini-cli-to-antigravity-cli/) |
| 反滥用政策 | 文档或公告 | Discussion 22970（2026-09-05）："Implementing more robust detection for policy-violating use cases (e.g. using Gemini CLI oAuth with third-party software)"；违规判定可在 console.cloud.google.com 申诉 | [Discussion 22970](https://github.com/google-gemini/gemini-cli/discussions/22970) |
| 中国大陆可访问性 | 见 §5 | 见 §5 | 见 §5 |

### 2.3 价格/额度的原始表达与多币种示例

USD（来自 gemini.google/us/subscriptions 与 one.google.com/intl/en_us/about/google-ai-plans）：

- Plus：$7.99/mo（US 列）
- Pro：$19.99/mo（US 列），首次新订首年 50% off；学生免费 1 年
- Ultra 5x：$99.99/mo（US 列）
- Ultra 20x：$199.99/mo（US 列）

GBP（gemini.google/gb/subscriptions）：£18.99/mo Pro / £79.99/mo Ultra 5x / £189.99/mo Ultra 20x。Trial 价 £18.99 在 trial 结束时计费。

AUD：$149.99/mo Ultra 5x / $329.99/mo Ultra 20x；Pro 见 ca 镜像 $39.99 CAD；INR：₹1,950/mo Pro / ₹6,500/mo Ultra 5x / ₹19,500/mo Ultra 20x。

Gemini CLI 端：所有订阅档**官方仅以"每日 RPD"为单位**，无 USD 价格换算（CLI 是免费工具，不单独计费；登录到 Pro/Ultra 后才获得更高 quota）。Antigravity Plans 文档用"5× Pro tokens" / "20× Pro tokens"相对表达，**Pro 自身 quota 绝对数字 Google 未公布**。

---

## 3. 价格/额度的原始表达方式与归一化歧义

### 3.1 官方原始表述（照录）

- **Gemini app 5h/weekly 窗口**（帮助中心 16275805）：
  > "Gemini Apps have compute-based usage limits that determine how much you can interact with Gemini tools and features. These limits factor in the complexity of your prompt, the models and features you use, and the length of your chat. **Your limit refreshes every 5 hours until you reach your weekly limit**."
- **Plus/Pro/Ultra 相对倍数表**（帮助中心 16275805 + one.google.com/google-ai-plans）：
  > "Without an AI plan: Standard limits; AI Plus: 2× higher than standard limits; AI Pro: 4× higher than standard limits; AI Ultra: 5× or 20× higher than AI Pro limits depending on your subscription"
- **Gemini CLI RPD 矩阵**（仓库 quota-and-pricing.md）：
  > "| Google account | Gemini Code Assist (Individual) | 1,000 requests |
  > | | Google AI Pro | 1,500 requests |
  > | | Google AI Ultra | 2,000 requests |
  > | Gemini API key | Free tier (Unpaid) | 250 requests |"
- **CLI README 速率**：
  > "Free tier: **60 requests/min and 1,000 requests/day** with personal Google account"
- **I/O 2026 公告**（blog.google）：
  > "A new $100 AI Ultra plan ... A 5× higher usage limit in the Gemini app and Google Antigravity than our Pro plan ... reducing the monthly price of our top-tier AI Ultra plan from $250 to $200"
- **Antigravity Plans 文档**（antigravity.google/docs/plans/）：
  > "All plans receive a baseline of: ... **Unlimited Tab completions** ... Access to all product features, such as the Scheduled Tasks and the CLI ... Ultra: The highest, most generous quota, refreshed every five hours ... Pro: High, generous quota, refreshed every five hours until weekly limit reached ... Free: Meaningful quota, refreshed weekly"
- **2026-06-18 断档公告**（Discussion 28017）：
  > "Gemini CLI will stop serving requests for Google AI Pro, Google AI Ultra, and free tier individual accounts. Enterprise users with Gemini Code Assist licenses and API key authentication remain completely unaffected."

### 3.2 归一化歧义清单

1. **"X× higher" 相对量无锚点**：Plus/Pro/Ultra 表全用相对倍数（2×/4×/5×/20×），**Plus 与 Pro 的绝对 quota 数字 Google 不公布**；只有 Antigravity Plans 文档隐含 "Tokens are drawn down as per API pricing"（I/O 2026 公告原文），即按 API 价消耗 token，**不能简单按 RPD 对比 Cursor / Codebuddy 的月消息数**。
2. **5 小时窗口 ≠ 每日 RPD**：Gemini app "limit refreshes every 5 hours until your weekly limit"（compute-based）与 Gemini CLI "1,500/day RPD"（按请求次数）是**两套独立维度**。一个 prompt 在 Gemini CLI 中可能产生多次模型请求（"one prompt might result in multiple model requests"——01-gemini-code-assist.md 已记录），因此 1,500/day RPD 不等于 1,500 个用户 prompt。
3. **Gemini Pro 模型 2026-03-25 起仅付费档可用**：Discussion 22970 原文 "Gemini Pro models will only be accessible via paid subscriptions. Free tier users will be limited to Gemini Flash models"。这意味着即使有 Pro 订阅但通过免费通道（API key unpaid）也无法用 Pro 模型。归一化时若按"模型能力"比较，"可访问 Gemini 3 Pro" 是有条件字段。
4. **个人层 OAuth 登录档已于 2026-06-18 失效**：gemini CLI 对 Google AI Pro/Ultra/individuals OAuth 不再返回响应。仓库文档**至今未删除**对应 quota 表，归一化时需将"1,500/day、2,000/day"标为"历史快照"或"已迁移至 Antigravity"，**不要按当前可用的字段呈现**。
5. **Plus/Pro/Ultra 三档订阅是"复合产品"**：包含云存储（400 GB / 5 TB / 20 TB / 30 TB）、YouTube Premium Lite/individual、Google Home Premium、Google Health Premium、$10/$40/$100 Google Cloud credits（按 Pro/Ultra 5x/20x）等；与 Gemini CLI 的 quota 不是 1:1 关系。归一化时若只比较"AI 部分"会忽略存储与权益的实际成本。
6. **多币种与多子域**：gemini.google/<country>/subscriptions/?hl=<lang>，价格按 IP 与 country code 切换。Data Provider 抓取必须显式固定路径（推荐 `one.google.com/intl/en_us/about/google-ai-plans/` 或带显式 country 子域），否则抓取结果会随请求地区而变。
7. **Plan 名称历史变更**：Google One AI Premium（2024-02）→ Google AI Pro（2026-05-19 I/O）；Google AI Premium → Google AI Plus（同期）。第三方报道常引用旧名，**Data Provider 必须按当前官方页名称建模，旧名作为同义词处理**。

---

## 4. 来源冲突、更新频率与历史变更方式

### 4.1 冲突点（3 处）

1. **Google AI 订阅国家数量表述不一致**：
   - gemini.google/subscriptions 页脚注 "1"："available in more than **140** countries and territories"
   - gemini.google/subscriptions 横幅正文："more than **150** countries"（Pro/Ultra）/ "more than **160** countries"（Plus）
   - one.google.com/google-ai-plans FAQ："Google AI Plus is available in over 160 countries. Google AI Pro is available in over 150 countries. Google AI Ultra is available in more than 150 countries"
   - Gemini web app 帮助："more than 230 countries and territories"
   - 三处数字源自不同维度（订阅 vs. Gemini app vs. Plus 扩展后），且不同时间点采集，结果**不能互换**。

2. **年龄要求表述不一致**：
   - 订阅页脚注："Gemini Pro and Gemini for Gmail, Docs, and more are only available for **ages 18+**"
   - 帮助中心部分页："Be 13 or older (or the applicable age in your country)"
   - 官方未声明哪条覆盖哪条；Gemini CLI 与 Pro/Ultra 高级功能 18+；仅基础 Gemini app 允许 13+。**采集方应分别记录**。

3. **Antigravity Plans 文档对 Pro/Ultra 的 quota 描述只给形容词不给数字**（"meaningful / high / highest"），与 Antigravity blog 2026-05-19 公告中 "5× / 20× Pro tokens" 的相对倍数**互相补全**，但单独看 Antigravity 定价页（仅 "$0/month" 一个数字）看不出订阅与 quota 的对应关系——Antigravity **不是独立订阅产品**，必须跳转到 one.google.com 才能看到 Pro/Ultra 的实际月费与权益。

### 4.2 更新频率与历史变更方式

- **官方变更载体**（按优先级）：
  1. blog.google / developers.googleblog.com 官方博客（带作者署名 + 日期）：例如 2026-05-19 "Google AI subscription updates from Google I/O 2026"（Shimrit Ben-Yair, VP Google Photos, Google One & AI Subscriptions）。
  2. Google Antigravity 博客（antigravity.google/blog）：例如 2026-05-19 "Changes to Antigravity Plans"。
  3. Gemini Apps release notes（gemini.google/release-notes/）：含订阅调整条目（如 "Get more from the Gemini app with the Google AI Pro subscription"）。
  4. GitHub Discussions 维护者公告（如 #27274、#28017）—— Gemini CLI 重大变更的实际通知渠道。
  5. 帮助中心页（部分页支持 "Last updated" 时间戳，部分无）。
- **价格历史**（关键节点）：
  - 2024-02：Google One AI Premium 上架，$19.99/mo。
  - 2025-05-20：Google AI Ultra 上架（$249.99/mo，限美）。
  - 2025-09-24：博客 "Get higher Gemini CLI and Gemini Code Assist limits"，宣布 Pro/Ultra 用户自动获 Gemini CLI 与 Code Assist 更高 RPD。
  - 2026-01-27：Google AI Plus 扩展到 35 个新国家含美国；GDP premium 权益整合进 Pro/Ultra。
  - 2026-04-20：AI Studio 提升 Pro/Ultra 用户的访问限额（含 Nano Banana Pro / Gemini Pro）。
  - 2026-05-19（Google I/O）：**当日三件大事**：
    1. 公告 **Gemini CLI → Antigravity CLI** 迁移（停服日期 2026-06-18）。
    2. 重构订阅层级：新增 $100 AI Ultra 5x；$250 Ultra 降至 $200 Ultra 20x；Google One AI Premium 改名 Google AI Pro（保留 $19.99）；Google AI Premium 改名 Google AI Plus（保 $7.99）。
    3. Antigravity quota 改为"按 API 价消耗的 token 池"（取消 Flash/Pro 分池）。
  - 2026-06-18：Gemini CLI **停止为 Google AI Pro / Ultra / individuals 服务**；维护者 Discussion 28017 置顶公告。Antigravity CLI (`agy`) 生效。
  - 2026-06-10：Gemini CLI Release v0.46.0（GitHub 仓库在停服前最后一版主 release）。
- **页面是否显示更新时间**：博客文章与 release notes 带日期；订阅页/帮助中心多数无 "Last updated" 时间戳，采集系统需自行记录抓取日期。
- **URL 结构性迁移**：未发现对订阅页主体的迁移；help.google.com 与 support.google.com 之间的 URL 重定向偶有发生（如 14534406 在 ?co=GENIE.Platform%3DDesktop 参数下显示桌面端内容）。

### 4.3 无法确认当前有效值的字段

- Antigravity Plans 中 Pro/Ultra 的**绝对 quota 数字**（Google 仅公布相对倍数）。
- Gemini CLI 的**个人层 OAuth 登录档在 2026-06-18 之后是否在某种企业/Workspace 嵌套场景下仍可用**（官方公告仅说 "stop serving requests for Google AI Pro, Google AI Ultra, and free tier individual accounts"；未明确"Workspace 嵌套个人账号"边界——但仓库 docs 区分 Standard/Enterprise 与 individuals，无重叠）。
- Gemini CLI **6.18 停服后是否完全停止发布**（仓库 2026-07 仍有 v0.54.0-nightly，说明 OSS 仓库仍维护；但官方公告未承诺 2026-06-18 后仍向 Standard/Enterprise 长期提供新功能）。
- 中国大陆用户的实际注册/支付/网络可达性：官方均无明确声明。

---

## 5. 中国 Availability（五维度）

> 原则声明：本节区分"官方明确声明"与"无法确认"；**页面无法访问或动态渲染不作为官方政策限制的证据**。搜索过的官方渠道：Google One 帮助、订阅页、help.google.com/gemini、blog.google、Google AI Studio 文档、Antigravity 博客。

| 维度 | 状态 | 说明 |
|---|---|---|
| 注册 | 官方明确声明（一般要求） + 中国维度**仅 Workspace**明确 + 个人 Google 账号订阅**无法确认** | (1) Google AI 订阅通用要求："personal Google Account that you manage on your own"，"available for users aged over 18"（[gemini.google/subscriptions](https://gemini.google/subscriptions/)）。(2) Gemini web app 国家清单 **明文**："**Mainland China (Workspace only)**"——意味着个人 Google 账号订阅 Google AI Pro/Ultra 在中国大陆不被允许，[帮助 13575153](https://support.google.com/gemini/answer/13575153)。(3) Gemini mobile app 国家清单不包含中国大陆、香港、澳门，[帮助 14579026](https://support.google.com/gemini/answer/14579026)。(4) Google AI Plus 在 2026-01-27 扩展到 35 个新国家（含美国），中国大陆不在新增名单内，[blog.google](https://blog.google/products-and-platforms/products/google-one/google-ai-plus-availability/)。**总结**：个人 Google 账号订阅中国大陆**官方无"允许"声明**；仅 Workspace 客户存在明确支持。 |
| 支付 | 无法确认 | 官方明确：Google One 通过 Google 支持的卡种订阅（"Payment methods vary by country"），但未列出中国大陆可用支付方式。iOS 内购由 Apple 处理。Antigravity / Gemini CLI 不引入独立支付通道。中国大陆借记卡/信用卡对 Google Play / Apple ID 的可用性 Google 未官方声明。 |
| 网络访问 | 无法确认 | 官方明确：Gemini web/app 从 Google 区域基础设施提供（"available in 230+ countries"），但**未声明**任何国家/地区的网络可达性或封锁；亦未提供中国大陆网络测试结果。Gemini API 在中国大陆不可用（[ai.google.dev available-regions](https://ai.google.dev/gemini-api/docs/available-regions) 中国大陆不在清单中），但 Gemini CLI 的网络要求与 API 不同（CLI 同时支持 OAuth 与 API key，OAuth 走 Google 账户认证）。 |
| 服务政策 | 官方明确声明（部分）+ 中国大陆**无法确认** | 官方明确：Google AI 订阅的国家清单（如上）排除了中国大陆（仅 Workspace）。Google AI Studio / Gemini API 国家清单独立显示。中国大陆是否在 Google 服务政策中被列入"服务不可用地区"或"出口管制清单"**未找到**任何官方页面明示。 |
| 功能限制 | 官方明确声明（部分功能美/英专属）+ 中国大陆无差异化声明 | 官方明确：多项 Gemini 功能有**地域或语言限制**——Gemini Spark "**U.S. only**"；Google AI Studio 部分功能 "**US only**"；Dreambeans、Auto browse in Chrome "**US only**"；"Gemini in Gmail, Docs, and more is available in **select languages**"。中国大陆在功能上是否被官方单独限制：**未找到**任何官方页面声明。 |

---

## 6. Google AI 订阅与 Gemini Code Assist 的关系（关键差异化）

> **本节专门澄清两个独立产品，避免与 01-gemini-code-assist.md 中的内容重复。**

| 维度 | Google AI Pro / Ultra（消费者订阅） | Gemini Code Assist Standard / Enterprise（企业订阅） |
|---|---|---|
| 销售渠道 | Google One（one.google.com） | Google Cloud（cloud.google.com / Admin for Gemini 控制台） |
| 账号体系 | 个人 Google 账号 | Google Cloud 项目 + billing account + IAM |
| 价格（2026-09 采集日） | Pro $19.99/mo；Ultra 5x $99.99/mo；Ultra 20x $199.99/mo（[订阅页](https://gemini.google/subscriptions/)） | Standard $22.80/mo（monthly）/ $19/mo（annual）；Enterprise $54/mo / $45/mo（[codeassist.google/products/business](https://codeassist.google/products/business)，01 已覆盖） |
| 主要产品形态 | Gemini app + Gmail/Docs/Vids + NotebookLM + Flow + Antigravity + Jules + AI Studio + 5 TB+ 存储 | Cloud Shell Editor + Cloud Workstations + JetBrains + VS Code + Android Studio 的代码生成/补全/chat + Agent mode + Gemini CLI + GCP 服务集成 |
| Gemini CLI 登录通道 | OAuth 登录个人 Google 账号（**2026-06-18 起停服**） | OAuth 登录 Workspace / Cloud 项目（**继续可用**） |
| 隐私政策 | "Gemini Code Assist Privacy Notice for individuals"（数据**可能用于训练**） | "Gemini Code Assist Privacy Notice for Standard and Enterprise"（数据**不收集、不训练**） |
| ToS | Google Terms of Service（消费者） | Google Cloud Platform Terms of Service（企业） |
| 入口 URL | <https://gemini.google/subscriptions/>、<https://one.google.com/about/google-ai-plans/> | <https://cloud.google.com/products/gemini/pricing>、<https://codeassist.google/products/business> |
| 当前产品代际（CLI 端） | Antigravity CLI（`agy`） | Gemini CLI（`gemini`）——保留 |

**关键事实**：

1. **两者在 2026-06-18 前后采取相反策略**：
   - 消费者档（Pro/Ultra/individuals）的 Gemini CLI → **停止服务** → 迁到 Antigravity CLI（Google 官方推动消费者向 Antigravity 平台靠拢，Antigravity 是新终端代理品牌）。
   - 企业档（Code Assist Standard/Enterprise）的 Gemini CLI → **继续支持** → Google 公告原文："If your organization uses Gemini CLI or our IDE extensions via a Gemini Code Assist Standard or Enterprise license, ... your access remains unchanged"（[Discussion 28017](https://github.com/google-gemini/gemini-cli/discussions/28017)）。
2. **同一 gemini 命令会路由到不同产品**：CLI 客户端启动时根据登录身份自动判断调用 Antigravity 平台或 Gemini Enterprise Agent Platform。Antigravity Plans 文档明文："Google Antigravity is available with terms to individual accounts derived from Google's terms of service, and available to teams under Google Cloud terms through the Gemini Enterprise Agent Platform."
3. **不要混用字段**：在 Data Provider 中，Google AI Pro 的 quota 数字（Gemini app 5h/weekly 窗口）与 Gemini Code Assist Standard 的 quota 数字（6000/天代码请求 + 1500/天 agent+CLI）是**完全不同维度的产品**，前者是消费级通用 AI 订阅的相对倍数（不公布绝对值），后者是企业级 IDE 编码订阅的明确绝对值。

---

## 7. 对 Data Provider / Recommendation Policy 的建议

- **核心字段（缺失应阻止强排名）**：价格（含币种）、5h/weekly 窗口机制（Gemini app）、每日 RPD（Gemini CLI，含登录方式）、模型可访问性（Pro/Flash）、2026-06-18 后消费者档是否仍提供 Gemini CLI OAuth 通道。
- **失败分类建议**：
  - `OK`（静态页全文）：gemini.google/subscriptions、one.google.com/google-ai-plans、GitHub README/docs。
  - `DEPRECATED`（页面可读但功能停服）：Gemini CLI 仓库的 OAuth quota 表对消费者档应标 `DEPRECATED_SINCE=2026-06-18`，并指向 Antigravity Plans。
  - `LOGIN_REQUIRED`：Google One 控制台（账户、订阅、用量查询）。
- **采集时效**：订阅页/帮助中心多数无显式时间戳，采集系统**必须**自行记录抓取日期；价格/额度字段在 I/O 2026 后已进入"半年级更新"节奏，建议每日抓一次差异检测。
- **跨 Vendor 归一化**：
  - 不要把 "5× Pro" / "20× Pro" 直接折算成 RPD；要么只保留相对倍数，要么标注"未公布绝对值"。
  - "Unlimited Tab completions" 不等于 "Unlimited requests"——Antigravity Plans 文档明确 Tab completions 单独无限，agent 请求仍受 quota 控制。
  - 消费者档"2× / 4× higher than standard limits"中的"standard limits"是 Gemini app 自身的基准（Google 未公布），与 Gemini CLI 的 1,000/day OAuth quota **不是同一基准**。
- **地区字段**："available in 150+ countries" 必须在表层标注"含/不含中国大陆"（参见 §5）。

## 8. 未解决问题

1. Antigravity Pro/Ultra 的**绝对每日 quota 数字**（Google 仅公开 5×/20× 相对倍数）。
2. 2026-06-18 后，**Workspace 嵌套个人 Google 账号**是否仍可走 Gemini CLI OAuth 通道（官方公告未明确）。
3. **中国大陆用户实际**注册/支付/网络可达性（官方无明确声明；如需确认须登录实机验证，超出本调研范围）。
4. Gemini app "5 hour" 与 "weekly" 双层窗口中，**weekly limit 的具体值**是否随计划变动（官方文档仅给 "5 hour refresh until you reach your weekly limit"，未给具体数字）。
5. Google Antigravity 与 Gemini Code Assist 的**长期共存策略**（Antigravity 文档写 "Rate limits and model availability differs based on usage of Google AI plans"，但未说明未来是否合并）。

---

**附：本任务范围内的边界声明**
- 已与 01-gemini-code-assist.md 区分：Code Assist Standard/Enterprise 订阅定价、Cloud 项目注册要求、Gemini for Google Cloud 文档等不在本文档重复（请参阅 01）。
- 已与 Google Gemini API 区分：API 走 token 按量计费、AI Studio 用量查询、AI Studio 文档不在本文档覆盖（由另一调研负责）。
- Antigravity 平台仅作为"Gemini CLI 替代方案"的关系描述出现，不展开 Antigravity IDE / Antigravity Cloud 详情。

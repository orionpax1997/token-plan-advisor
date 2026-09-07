# Trae（字节跳动）官方信息来源调研

- **采集日期**：2026-09-07
- **调研范围**：Trae 两条产品线的个人订阅套餐——国际版（trae.ai / docs.trae.ai，英文，美元计费）与中国版（TRAE CN：trae.cn / trae.com.cn / docs.trae.cn，中文，人民币积分计费），另记录中国版企业版要点
- **方法**：仅使用一手官方来源（官网、定价页、官方文档 docs.trae.ai / docs.trae.cn、官方博客、订阅 FAQ、更新日志、隐私政策）。全部 URL 于采集日经 exa 抓取或对官方页面的搜索快照核实；无法确认的字段如实标注；页面无法访问不推断为官方政策限制。

## 结论摘要

1. **Trae 存在两条完全独立的产品线，不能混合归一化**。国际版（trae.ai）用"美元用量（Dollar Usage）"计费，五档套餐 Free / Lite / Pro / Pro+ / Ultra（连续包月 $0/$3/$10/$30/$100）；中国版（trae.cn）用"积分"计费，四档会员 Lite / Pro / Pro+ / Ultra（¥49/¥99/¥239/¥699，无免费套餐名但有免费用户权益）。两线客户端版本号不同（国际版 v3.5.x，中国版 v3.3.x），内置模型集不同（国际版含 GPT/Gemini，中国版以 Seed/GLM/DeepSeek/Kimi/Qwen 等国内模型为主）。
2. **"支持国家/地区不含中国大陆"经复核成立**：国际版文档 [Supported countries and regions](https://docs.trae.ai/ide/supported-countries-and-regions) 原文 "TRAE is currently available in the following countries and regions."，Asia 列表 41 个国家/地区**不含中国大陆、香港、澳门、台湾**；计费文档的支付服务地区列表含 "Hong Kong SAR (China), Macao SAR (China)" 但同样**不含中国大陆**；FAQ 明确 "TRAE provides subscription services only in certain countries and regions."（原文见第 2、5 节）。
3. **国际版额度表达是"美元等值 @ 模型 API 费率"**：每月 Basic Usage $3/$5/$20/$90/$400 + 数额不定的 Bonus Usage，按 token × 模型 API 费率扣减（[模型费率表](https://docs.trae.ai/ide/models)公开到 /1M tokens 级）；超额可开 On-Demand Usage（每累计 $3 结算一次）。计费单位、上下文（Regular 272K / Max 1M tokens）均官方公开。
4. **企业采购仅中国版提供**：国际版 FAQ 原文 "Currently, only TRAE CN supports enterprise procurement."；中国版企业版经火山引擎销售（团队版 ¥149/席/月、旗舰版 ¥259/席/月，2026-06-09 起新计费）。
5. 官方来源之间有两处需要注意的不一致：(a) Pro 试用期 7 天（现行文档）vs 14 天（2026-02-13 博客公告）；(b) 港澳出现在计费地区列表但不在通用可用性列表。设备上限中国版文档为 3 台，国际版对应页面正文无法获取（客户端渲染），**无法确认**。

---

## 1. 官方入口清单

### 1.1 国际版（trae.ai）

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 1 | <https://www.trae.ai> | 产品页（首页） | 全球（英文） | 无 | 否 | 客户端渲染，仅获取营销标题与导航 | 部分 |
| 2 | <https://www.trae.ai/pricing> | 定价页（购买入口） | 全球（USD） | 无 | 购买需 | **重度客户端渲染**：抓取仅返回 FAQ 问题标题（"Can I request a refund?"）与页脚联系邮箱（ussupport@mail.traeai.us），无套餐卡片正文 | 否（仅框架） |
| 3 | <https://docs.trae.ai/ide/new-plans-and-billing> | 帮助文档（现行计费，核心来源） | 全球 | 无 | 否 | 正文可读；套餐对比表为合并单元格，抓取文本存在列展开伪影（已用 FAQ/博客交叉核对列值） | 是（全文） |
| 4 | <https://docs.trae.ai/ide/plans-and-billing-faqs> | 帮助文档（订阅 FAQ） | 全球 | 无 | 否 | 正常 | 是（全文） |
| 5 | <https://docs.trae.ai/ide/on-demand-usage> | 帮助文档（按量付费） | 全球 | 无 | 否 | 正常 | 是（全文） |
| 6 | <https://docs.trae.ai/ide/billing> | 帮助文档（Legacy 旧版计费） | 全球 | 无 | 否 | 正常；页首注明新版计费已上线 | 是（全文） |
| 7 | <https://docs.trae.ai/ide/supported-countries-and-regions> | 帮助文档（**支持国家/地区列表**） | 全球 | 无 | 否 | 正常 | 是（全文） |
| 8 | <https://docs.trae.ai/ide/models> | 帮助文档（内置模型 + API 费率表） | 全球 | 无 | 否 | 正常 | 是（全文） |
| 9 | <https://www.trae.ai/blog/trae_membership_0213> | 官方公告（2026-02-13 会员升级/token 计费转型） | 全球 | 无 | 否 | 正常 | 是（全文） |
| 10 | <https://docs.trae.ai/ide/changelog> | 更新日志（按日期） | 全球 | 无 | 否 | 正常 | 是（最新条目 2026-08-19） |
| 11 | <https://docs.trae.ai/ide/set-up-trae> | 帮助文档（Quickstart） | 全球 | 无 | 否 | 正常 | 是 |
| 12 | <https://docs.trae.ai/solo/privacy-mode> | 帮助文档（TraeWork 隐私模式） | 全球 | 无 | 否 | 正文经搜索快照核实关键句（未逐字全文抓取） | 部分（关键句已核实） |
| 13 | <https://www.trae.ai/privacy-policy> | 法律条款（隐私政策，**US users 口径**） | 美国（声明口径为 "US users and other US individuals"） | 无 | 否 | 正文经搜索快照核实关键句 | 部分（关键句已核实） |
| 14 | <https://www.trae.ai/terms-of-service> | 法律条款（服务条款） | 全球 | 无 | 否 | 客户端渲染，正文未获取；搜索元数据显示发布日期 2026-01-22 | 否 |
| 15 | <https://docs.trae.ai/ide/privacy-mode>、<https://docs.trae.ai/ide/payment-service>、<https://docs.trae.ai/ide/device-limit>、<https://docs.trae.ai/ide/manage-subscriptions>、<https://docs.trae.ai/ide/max-mode> | 帮助文档（5 个页面） | 全球 | 无 | 否 | **客户端渲染失败**（返回 JS 引导/SSR 空数据，`renderLevel:2`），正文未获取 | 否 |
| 16 | TRAE Console（官网登录后的 Plan & Billings / Usage 面板） | 购买/用量入口 | 全球 | 需 TRAE 账号 | 是 | 控制台内，未直接抓取；FAQ 与计费文档均指引用户登录控制台操作 | 否（以文档描述为准） |

### 1.2 中国版（TRAE CN）

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 17 | <https://www.trae.cn/pricing> | 定价页（个人方案与定价，购买入口） | 中国大陆市场（人民币） | 无 | 购买需 | 客户端渲染，仅获取页头导航与标题；套餐正文以官方文档为准 | 部分 |
| 18 | <https://www.trae.com.cn> | 产品页（**官方文档引用的"TRAE 官网"域名**，下载 CDN 为 lf-cdn.trae.com.cn） | 中国大陆市场 | 无 | 否 | 本次未单独抓取首页（经 docs.trae.cn 快速开始文档核实该域名为官网入口） | 未直接抓取 |
| 19 | <https://docs.trae.cn/ide_plans-and-billing>（`.md` 直链可用） | 帮助文档（套餐与计费，核心来源） | 中国大陆市场 | 无 | 否 | 正常；**全站支持 `.md` 后缀与 [llms.txt](https://docs.trae.cn/llms.txt) 索引** | 是（全文） |
| 20 | <https://docs.trae.cn/ide_coming-soon.md> | 官方公告（"重磅更新：以积分为核心的计费模式正式上线"） | 中国大陆市场 | 无 | 否 | 正常 | 是（全文） |
| 21 | <https://docs.trae.cn/ide_models.md> | 帮助文档（TraeCode 内置模型，含会员档位门控） | 中国大陆市场 | 无 | 否 | 正常 | 是（全文） |
| 22 | <https://docs.trae.cn/ide_device-limit> | 帮助文档（设备数量限制：3 台） | 中国大陆市场 | 无 | 否 | 经搜索快照获取全文关键段 | 是 |
| 23 | <https://docs.trae.cn/ide_privacy-mode.md> | 帮助文档（隐私模式） | 中国大陆市场 | 无 | 否 | 正常 | 是（全文） |
| 24 | <https://docs.trae.cn/ide_get-started-with-trae.md> | 帮助文档（快速开始：登录方式、官网域名） | 中国大陆市场 | 无 | 否 | 正常 | 是（全文） |
| 25 | <https://docs.trae.cn/ide_changelog.md> | 更新日志（按日期，CN 版本线 v3.3.x） | 中国大陆市场 | 无 | 否 | 正常 | 是（最新条目 2026-08-20） |
| 26 | <https://docs.trae.cn/enterprise_coming-soon> | 官方公告（"TRAE 企业版套餐焕新升级"，2026-06-09 起新版） | 中国大陆市场 | 无 | 否 | 经搜索快照获取全文关键段 | 是 |
| 27 | <https://docs.trae.cn/enterprise_billing-overview-for-trae-enterprise>、<https://docs.trae.cn/enterprise_billing-items>、<https://docs.trae.cn/enterprise_model-settings-for-trae-enterprise> | 帮助文档（企业版套餐/计费项/模型刊例价） | 中国大陆市场 | 无 | 否 | 经搜索快照获取关键段（含模型 Token 刊例价表） | 部分（关键段已核实） |
| 28 | <https://docs.trae.cn/ide_intro-to-llm.md> | 合规公示（豆包大模型备案公示，未抓正文） | 中国大陆市场 | 无 | 否 | 经 CN 文档索引确认存在 | 否（仅索引） |
| 29 | 火山引擎 TRAE 企业版控制台/下单页 | 购买入口（企业版；"企业版选型与咨询，前往火山引擎 ↗"） | 中国大陆市场 | 需火山引擎账号 | 是 | 控制台内，未直接抓取 | 否（以企业版文档描述为准） |

---

## 2. 字段覆盖矩阵

状态标注：公开（页面直接可见）/ 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用。

### 2.1 国际版（trae.ai，五档个人套餐）

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开 | "TRAE offers five plans: **Free, Lite, Pro, Pro+, and Ultra**"；旧版为 "Free plan / Pro plan"（Legacy 文档，已由新版取代） | [Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing)、[Legacy](https://docs.trae.ai/ide/billing) |
| Plan Type | 公开（判断） | **coding-subscription**。主体是 AI 代码编辑器 TraeCode（含 IDE 模式与 SOLO mode）的按月/按年订阅，额度按 token 折算美元扣减，不按纯 API token 出售；BYOK/自定义模型为附加能力。注意：国际版套餐是否同时覆盖 TraeWork（2026-08 上线的 AI 工作台）权益，官方套餐表**未说明**，无法确认 | [Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing)、[docs 首页 TraeWork 公告](https://docs.trae.ai/) |
| 价格 | 公开 | 连续包月（"Recurring monthly price (recommended)"）：**$0 / $3 / $10 / $30 / $100**；单月（"Single month price, Will not auto-renew after expiration"）：**$4.5 / $15 / $45 / $150**；年付（"Annual price"）：**$27 (average $2.25/month) / $90 (average $7.5/month) / $270 (average $22.5/month) / $900 (average $75/month)**。Free 档无单月/年付价。列值经 FAQ（"Pro users have $20 per month, and Pro+ users have $90 per month"）与博客（"Lite ... only $3 per month ... $5 basic usage"）交叉核对 | [Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing)、[FAQ](https://docs.trae.ai/ide/plans-and-billing-faqs)、[博客](https://www.trae.ai/blog/trae_membership_0213) |
| 币种 | 公开 | USD（表格以 $ 计价）；美国用户加税："Due to U.S. tax regulations, users in the United States are required to pay additional taxes on top of the original subscription price"；客服邮箱按 US / 非 US 区分 | [Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing) |
| 计费周期 | 文档或公告 | 月付自动续费、年付预付；升级/续费规则见 FAQ（"Your account will be charged for automatic renewal one day before the current subscription period expires"）。现行文档未写明"每月=30 天"的月长度定义；Legacy 文档曾写 "Each month is calculated as 30 calendar days"（现行是否沿用：无法确认） | [FAQ](https://docs.trae.ai/ide/plans-and-billing-faqs)、[Legacy](https://docs.trae.ai/ide/billing) |
| 额度/使用限制 | 公开 | 官方术语（原文）："**Dollar Usage**：The core billing concept in TRAE, referring to actual US dollar currency, which is used as the final deduction unit"；"**Basic Usage**：The basic quota obtained after subscribing to a plan... The unused quota for the current month will not be carried over to the next month"；"**Bonus Usage**：...an additional flexible usage each month based on your actual use（无数值）"；"**Extra Package**：If TRAE conducts official marketing campaigns, the granted quota will be issued in the form of an Extra Package"。数值：Basic Usage/month **$3（Free）/ $5（Lite）/ $20（Pro）/ $90（Pro+）/ $400（Ultra）**；AI chat："Billed based on token consumption... Actual cost ($) = Number of tokens × Model API rate"；**Autocompletion：Free "5,000 times/month"，Lite–Ultra "Unlimited"**；**Concurrent Cloud Tasks：2 / 2 / 10 / 15 / 20**；Queue Priority：Free "Standard queue"，Lite–Ultra "Fast queue"（表格合并单元格展开值，Lite 列如需精确认证需浏览器核对）；SOLO mode：Free/Lite ❌，Pro/Pro+/Ultra ✅；Early access to new models：仅 Ultra ✅；On-Demand Usage："Each time the accumulated amount reaches $3, a payment will be triggered"，仅 Lite 及以上可开 | [Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing)、[On-Demand Usage](https://docs.trae.ai/ide/on-demand-usage) |
| 模型与功能 | 公开 | 内置模型（原文表）：GPT-5.4、GPT-5.2、Seed-2.1-Turbo、MiniMax-M3、MiniMax-M2.7、Kimi-K2.5、Gemini-3.1-Pro-Preview、Gemini-3-Flash-Preview；"The following AI models are not available to users in the United States: GPT series and MiniMax series."；功能：IDE/SOLO 双模式、Agent、MCP、CUE 补全、Max mode（Ultra 大上下文）、Cloud Tasks；自定义模型接入（预设服务商含 Google、OpenAI、Anthropic、BytePlus、Volcano Engine 等 30+） | [Models](https://docs.trae.ai/ide/models)、[Quickstart](https://docs.trae.ai/ide/set-up-trae) |
| 上下文长度 | 文档或公告 | 博客原文："Context Window Size — Regular Mode: up to 272K tokens, depending on model choices; Max Mode: up to 1M tokens, depending on model choices"；"Up to 200 tool calls per session across all modes"；FAQ："If the model you select (such as Gemini) supports an ultra-large context (for example, 1M tokens), a 'Max' switch will appear"。注意"up to ... depending on model choices"是软上限表述 | [博客](https://www.trae.ai/blog/trae_membership_0213)、[FAQ](https://docs.trae.ai/ide/plans-and-billing-faqs) |
| 速率限制 | 文档或公告（部分） | 现行制度仅有队列优先级（Standard queue / Fast queue），**无每分钟/每秒速率数值**；Legacy 制度原文："The longest queue time for a fast request is 15 seconds."（fast request 已退场） | [Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing)、[Legacy](https://docs.trae.ai/ide/billing) |
| 并发 | 公开（云端）+ 无法确认（设备） | 云端："Concurrent Cloud Tasks: 2 / 2 / 10 / 15 / 20"（计划表）。IDE 登录设备数：国际版 [device-limit](https://docs.trae.ai/ide/device-limit) 页面客户端渲染失败，**无法确认**（中国版为 3 台，见 2.2） | [Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing) |
| 隐私/数据处理 | 文档或公告 | TraeWork 隐私模式文档原文："your information like your chat interactions, including related code snippets and AI-generated outputs, may be used for analytics, product improvement, and model training. When Privacy mode is enabled, TraeWork will not use any of your chat interactions ... for the above-mentioned purposes."；"Regardless of your Privacy mode setting, TraeWork will not use your codebase files for analytics, product improvement, or model training."；"Privacy mode is only effective when your TRAE account is logged in."；云服务（TraeWork Web / cloud agent）"your codebase files are processed and retained in the cloud"；US 隐私政策："temporarily upload your codebase files to our servers to compute embeddings, after which all plaintext code will be permanently deleted"，并声明数据用于 "train and improve technology"。IDE 版 privacy-mode 页正文渲染失败，内容以 TraeWork 文档与中国版同源文档为准（两者表述一致） | [TraeWork Privacy mode](https://docs.trae.ai/solo/privacy-mode)、[Privacy Policy](https://www.trae.ai/privacy-policy)、[CN 隐私模式](https://docs.trae.cn/ide_privacy-mode.md) |
| 注册要求 | 文档或公告 | 需 TRAE 账号登录（登录页："by continuing, you are agreeing to TRAE's Terms of Service and Privacy Policy"；登录方式清单官方未在可抓取页面列出，**无法确认**具体 SSO 选项）；Pro Trial 资格："New users who register for TRAE need to claim Pro Trial within 48 hours after registration"，且 "Free trial is available only to users who pay with a credit card. Other payment methods, such as debit cards, Alipay, and WeChat Pay, are not supported at this time."；2026-02-01 前注册的老用户不享该 trial | [Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing) |
| 支付方式 | 公开 | 原文清单——Global payment methods："Alipay"、"WeChat Pay (not supported in the United States)"、"Credit card & debit card: Mastercard, JCB, Visa, Diners Club, American Express, Discover, UnionPay"、"PayPal (not supported in Macao SAR (China), Netherlands, Myanmar, and Turkey)"；Local payment methods："MoMo"、"Kakao Pay"、"DANA"、"GrabPay"；支付故障排查提到收银台（cashier）选 Alipay、绑卡鉴权费 $1.1、印度用户跨境支付限制等 | [Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing)、[FAQ](https://docs.trae.ai/ide/plans-and-billing-faqs) |
| 地区政策 | 文档或公告 | 两份官方清单 + FAQ 声明，原文见第 5 节（**均不含中国大陆**） | [Supported countries and regions](https://docs.trae.ai/ide/supported-countries-and-regions)、[Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing)、[FAQ](https://docs.trae.ai/ide/plans-and-billing-faqs) |
| 官方购买链接 | 需登录 | 定价页 <https://www.trae.ai/pricing>（卡片按钮需登录后操作）；实际购买/管理在 TRAE Console 的 "Plan & Billings" 面板（FAQ/文档指引，控制台 URL 未在公开页面直接给出）；Pro Trial 从 Pricing 页 Pro 卡片领取 | [FAQ](https://docs.trae.ai/ide/plans-and-billing-faqs)、[On-Demand Usage](https://docs.trae.ai/ide/on-demand-usage) |
| 官方 API（用量可见性） | 无法确认 | 未发现公开的用量/订阅 Admin API 文档（docs.trae.ai 站点目录中无对应条目）；用量查询渠道为 IDE 内 Usage 入口与官网 Usage 页（"Visit the Usage page on TRAE.ai, where you can find detailed records of each transaction in Usage Events"），需登录 | [FAQ](https://docs.trae.ai/ide/plans-and-billing-faqs) |
| 更新时间 | 文档或公告 | changelog 按日期（本次最新 2026-08-19 Hotfix v3.5.89~3.5.91）；官方博客带日期（例：2026-02-13 会员升级公告）；**文档页与定价页均不显示页面级更新时间**（docs 站点元数据显示站点 updated_at 2026-08-26，为站点级而非页面级） | [Changelog](https://docs.trae.ai/ide/changelog) |

### 2.2 中国版（TRAE CN，trae.cn）

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开 | "**会员 Lite、会员 Pro、会员 Pro+、会员 Ultra**"；存量套餐"会员 Express"（原"优速通 Express"）"不再开放购买，并将在所有存量套餐到期后下架"；更早历史套餐名为"速通 Pro / 速通 Pro+ / 速通 Ultra / 优速通 Express"；免费用户无套餐名（存在免费用户权益） | [套餐与计费](https://docs.trae.cn/ide_plans-and-billing)、[积分计费上线公告](https://docs.trae.cn/ide_coming-soon.md) |
| Plan Type | 公开（判断） | Pro/Pro+/Ultra 为 **coding-subscription**（"通用积分：同时适用于 TraeCode 和 TraeWork"，TraeCode 为 AI IDE）；**会员 Lite 为边界情况**："仅 TraeWork"（2000 Work 专属积分），TraeWork 是"AI 原生工作台"（Work+Code 双模式），更接近 general-subscription，归一化时需单列 | [套餐与计费](https://docs.trae.cn/ide_plans-and-billing)、[docs 首页 TraeWork 公告](https://docs.trae.cn/) |
| 价格 | 公开 | 单月价格：**¥49 / ¥99 / ¥239 / ¥699**；连续包月：**¥45 / ¥89 / ¥219 / ¥629**，其中 Lite/Pro 有"限时首月优惠：首月 ¥29.9 / ¥69，第 2 个月恢复 ¥45 / ¥89。仅限付费新用户"；"有效期：31 个自然日" | [套餐与计费](https://docs.trae.cn/ide_plans-and-billing) |
| 币种 | 公开 | 人民币（元/¥）；企业版加量包、按量计费均为人民币计价 | [套餐与计费](https://docs.trae.cn/ide_plans-and-billing)、[企业版计费项](https://docs.trae.cn/enterprise_billing-items) |
| 计费周期 | 公开 | "有效期：31 个自然日"（按自然日计，与国际版 Legacy 的"每月=30 天"口径不同）；支持连续包月；"目前不支持将会员套餐降至更低档位" | [套餐与计费](https://docs.trae.cn/ide_plans-and-billing) |
| 额度/使用限制 | 公开 | "积分/月：**2000 Work 专属积分（Lite）/ 4000 通用积分（Pro）/ 12000 通用积分（Pro+）/ 40000 通用积分（Ultra）**"；"云端任务并行数量上限：2 / 10 / 10 / 20 个"；"高峰期优先使用：✅（全部付费档）"；"新模型优先体验：仅 Ultra"；"Seed 模型福利：Seed-2.1-Turbo 和 Seed-Code 模型计费享 2.5 折（全部付费档）"；增购积分："每 1000 积分 50 元。可选档位包括 1000、2000、3000、5000、10000、20000 积分"，有效期 31 个自然日；免费用户权益："每月登录赠送 500 通用积分（当前自然月）"、"新用户注册福利：一次性赠送 2000 通用积分和 2000 Work 专属积分（31 个自然日）"、"每日签到：每天 150 通用积分（会员为 200）"、"邀请新用户：各获 500 Work 专属积分"；历史折算："1 次'速通'可折算为 40 通用积分"；"仅调用 TRAE 内置模型时会消耗积分；调用自定义模型不会消耗积分" | [套餐与计费](https://docs.trae.cn/ide_plans-and-billing) |
| 模型与功能 | 公开 | CN TraeCode 内置模型：Seed-Evolving、Seed-2.1-Pro、Seed-2.1-Turbo、Seed-Code、GLM-5.3-Flash、GLM-5.3、GLM-5.2、DeepSeek-V4-Pro 正式版、DeepSeek-V4-Pro、DeepSeek-V4-Flash 正式版、DeepSeek-V4-Flash、Kimi-K3、Kimi-K2.7-Code、MiniMax-M3、Qwen3.8-Max、Qwen3.7-Plus；**会员档位门控（原文）**："Seed-Evolving（仅限会员 Pro、会员 Pro+、会员 Ultra 和会员 Express 用户使用）"、"DeepSeek-V4-Flash 正式版（仅限会员 Pro、会员 Pro+、会员 Ultra 和会员 Express 用户使用）"、"Kimi-K3（仅限会员 Pro+、会员 Ultra 和会员 Express 用户使用）"；会员补贴："调用 TRAE 内置模型 GLM-5.2、Seed-2.1-Turbo 和 Seed-Code 时将享有专属补贴" | [内置模型](https://docs.trae.cn/ide_models.md)、[套餐与计费](https://docs.trae.cn/ide_plans-and-billing) |
| 上下文长度 | 文档或公告（企业版）+ 无法确认（个人版逐模型） | 企业版模型表给出 "上下文长度" 列，多数模型为 1M（如 GLM-5.3、DeepSeek-V4-Pro 正式版、Qwen3.8-Max 等，"输入 & 输出：[0, 1M]"）；CN 个人版 TraeCode 更新日志确认 Max 模式已上线（2026-08-07 "支持为部分模型开启 Max 模式"），但个人版逐模型上下文窗口数值**无法确认**（个人版模型文档未提供该表） | [企业版模型设置](https://docs.trae.cn/enterprise_model-settings-for-trae-enterprise)、[CN 更新日志](https://docs.trae.cn/ide_changelog.md) |
| 速率限制 | 公开（定性） | "高峰期优先使用：✅"（付费档定性权益，无数值）；历史"速通"即 fast request 权益（已折算为积分）；无每分钟速率数值 | [套餐与计费](https://docs.trae.cn/ide_plans-and-billing) |
| 并发 | 公开 | "云端任务并行数量上限：2 个（Lite）/ 10 个（Pro）/ 10 个（Pro+）/ 20 个（Ultra）"；设备数："同一个 TRAE 账号最多可同时登录 3 台设备。计入设备数量的客户端包括：TRAE IDE、TRAE SOLO 桌面版和 TRAE SOLO 移动版。TRAE SOLO 网页版不计入设备数量。" | [套餐与计费](https://docs.trae.cn/ide_plans-and-billing)、[设备数量限制](https://docs.trae.cn/ide_device-limit) |
| 隐私/数据处理 | 文档或公告 | 原文："当你使用 TraeCode 的服务时，你的相关信息（包括对话内容、代码片段及 AI 生成的输出结果）可能会被用于数据分析、产品优化以及模型训练。开启隐私模式后，TraeCode 将不会将你的任何对话内容……用于上述用途。"；"无论隐私模式是否开启，TraeCode 绝不会将你的代码库文件用于数据分析、产品优化或模型训练。"；"为实现代码库索引功能，TraeCode 会临时将你的代码库文件上传至服务器计算嵌入向量，计算完成后所有明文代码将被永久删除。"；"隐私模式仅在你登录 TRAE 账号时生效"；合规入口：豆包大模型备案公示（[ide_intro-to-llm.md](https://docs.trae.cn/ide_intro-to-llm.md)，正文未抓取） | [CN 隐私模式](https://docs.trae.cn/ide_privacy-mode.md) |
| 注册要求 | 公开 | 登录方式原文："使用手机号、抖音账号、苹果账号、手机号或稀土掘金账号登录 TraeCode"；支持 macOS 12+ / Windows 10、11 / Linux（deb/rpm）；是否强制实名认证：官方未说明，**无法确认** | [CN 快速开始](https://docs.trae.cn/ide_get-started-with-trae.md) |
| 支付方式 | 公开 | 原文："抖音支付"、"支付宝"、"微信支付（连续包月暂不支持该支付方式）"；增购积分"支持开票"；企业版经火山引擎下单（连续包年/包月、1 年、3 个月、6 个月，可用代金券） | [套餐与计费](https://docs.trae.cn/ide_plans-and-billing)、[企业版订阅管理](https://docs.trae.cn/enterprise_manage-subscriptions-for-trae-enterprise) |
| 地区政策 | 无法确认 | CN 版无"仅限中国大陆"或"支持国家清单"类官方声明；官网语言、支付方式（抖音/支付宝/微信）、登录方式（手机号/抖音/掘金）、企业版销售渠道（火山引擎）均指向中国大陆市场，但这些是事实性观察而非官方地区政策声明 | 同上各页 |
| 官方购买链接 | 公开 | "直接前往 TRAE CN 官网的定价页面进行订阅"→ <https://www.trae.cn/pricing>（docs 亦引用 <https://www.trae.com.cn> 为官网）；企业版："前往 TRAE 企业版首页，然后点击 立即下单"，经火山引擎 | [套餐与计费](https://docs.trae.cn/ide_plans-and-billing)、[企业版订阅管理](https://docs.trae.cn/enterprise_manage-subscriptions-for-trae-enterprise) |
| 官方 API（用量可见性） | 文档或公告（企业版） | 企业版旗舰版含 "Admin API"；个人版未见公开 API | [企业版套餐](https://docs.trae.cn/enterprise_billing-overview-for-trae-enterprise) |
| 更新时间 | 文档或公告 | CN changelog 按日期（本次最新 2026-08-20 v3.3.92）；企业版价格调整有预公告（例：DeepSeek-V4-Flash 调价公告明确"新价格将于 2026 年 8 月 25 日（北京时间 00:00）起生效"）；文档页不显示页面级更新时间 | [CN 更新日志](https://docs.trae.cn/ide_changelog.md)、[企业版计费项](https://docs.trae.cn/enterprise_billing-items) |

### 2.3 中国版企业版（要点，供对照）

- 套餐（2026-06-09 起新版）：**团队版 ¥149/席/月（起购 1 席）、旗舰版 ¥259/席/月（起购 3 席）**；内置模型额度 "40 元/席/月（团队）/ 100 元/席/月（旗舰，且额度池化共享）"；CUE 补全 "30M Tokens（团队）/ 暂不限量（旗舰）"；最大并发任务数 10/20；旗舰版独有：TraeCode CLI、Admin API、命令黑名单、内容安全策略、IP 白名单、专有网络访问等（[套餐类型](https://docs.trae.cn/enterprise_billing-overview-for-trae-enterprise)、[焕新公告](https://docs.trae.cn/enterprise_coming-soon)）。
- 计费项三类："席位费、按量计费、加量包"；加量包 "50 元、500 元和 5000 元"，有效期 12 个月；按量计费"小时后付费"；企业版内置模型按 Token 刊例价计费（示例：Doubao-Seed-Evolving 输入 6 元/百万 Tokens、输出 30 元/百万 Tokens；GLM-5.3 8/28；DeepSeek-V4-Pro 正式版 9/27 等），并有"套餐内用量限时半价"促销与模型调价预公告（[计费项](https://docs.trae.cn/enterprise_billing-items)）。
- 国际版 FAQ 明确企业采购仅 CN 提供："Currently, only TRAE CN supports enterprise procurement."（[FAQ](https://docs.trae.ai/ide/plans-and-billing-faqs)）。docs.trae.ai 另有 TRAE Enterprise 文档分区（2026-06-17 创建，本次未抓取正文）。

---

## 3. 价格/额度的原始表达方式与归一化歧义

### 3.1 官方原始表述（照录）

- 国际版价格："Recurring monthly price (recommended)：$0 / $3 / $10 / $30 / $100"；"Single month price ... $4.5 / $15 / $45 / $150"；"Annual price：$27 (average $2.25/month) / $90 / $270 / $900"。
- 国际版额度："Basic Usage/month：$3 / $5 / $20 / $90 / $400"；"Billed based on token consumption ... Actual cost ($) = Number of tokens × Model API rate"；"After Basic Usage is exhausted ... enable the On-Demand Usage feature"；"Each time the accumulated amount reaches $3, a payment will be triggered"。
- 国际版模型费率（/1M tokens，摘录）：GPT-5.4 输入 <=272k: $2.500、>272k: $5.000，输出 <=272k: $15.000、>272k: $22.500；Seed-2.1-Turbo $0.500/$2.500；Gemini-3.1-Pro-Preview <=200k: $2.000/>200k: $4.000，输出 <=200k: $12.000/>200k: $18.000 等（含 Cache Read/Write 列，分上下文区间定价）。
- 国际版历史单位（Legacy）："600 fast requests per month + Unlimited number of slow requests"（Pro，$10/月）；加量包 "USD $3: 100 fast requests / $7: 300 / $12: 600"，30 天有效；换算规则 "6 Fast Requests = $1 Dollar Usage"。
- 中国版价格："单月价格 ¥49/¥99/¥239/¥699；连续包月 ¥45/¥89/¥219/¥629"；额度单位为"积分"（"2000 Work 专属积分 / 4000 / 12000 / 40000 通用积分"）；增购"每 1000 积分 50 元"；历史单位"速通"（1 次 = 40 通用积分）。
- 中国版企业版模型计价："元 / 百万 Tokens"刊例价表（输入/输出/缓存读取分列，部分模型按上下文区间分档），与-cn 个人版"积分"是两套单位。

### 3.2 归一化歧义清单

1. **两产品线计费单位完全不同**：国际版"美元用量（实际扣减单位=美元，按 token×API 费率实时折算）" vs 中国版"积分"（积分→人民币换算仅有增购价 ¥50/1000 积分可推，1 积分≈¥0.05 为**我方换算，非官方表述**；个人版各模型积分消耗率表未见官方公开）。跨 Vendor 比较时必须把两条线作为两个独立 Provider 记录。
2. **"Basic Usage + Bonus Usage"双层结构**：Basic Usage 有官方数值，Bonus Usage 官方明确"based on your actual use"发放、**无数值**——实际可用额度 ≥ Basic Usage，但不可精确比较。CN 版的等价物是"奖励积分"（活动发放）。
3. **模型档位决定单位消耗**：国际版按所选模型 API 费率扣美元（同一 $20 在 Gemini-3-Flash 与 GPT-5.4 下可支撑的请求数差可达数量级）；官方仅给示例口径（"Pro users using Gemini 3 Pro (with a maximum 200k context window) can still have approximately 600 chats per month"；SOLO Mode 约 3 倍提升）。CN 版按"积分"+模型补贴/折扣（Seed 系 2.5 折、GLM-5.2 补贴），同样不可按固定"请求/积分"换算。
4. **上下文分档计价**：国际版模型费率按输入上下文区间分档（<=272k/>272k 等），Max Mode（最大 1M 上下文）"will significantly increase costs"；与其他 Vendor 比较时须区分"标称价格"与"Max Mode 实际价格"。
5. **历史单位残留**：fast/slow requests（国际版 Legacy）、"速通"（CN）均已退场但文档保留折算规则（6 Fast Requests = $1；1 次速通 = 40 通用积分）。采集系统需能识别"旧单位字段+折算率"的组合。
6. **"Unlimited" 仅限补全**：Autocompletion 付费档 "Unlimited"，AI chat/agent 无无限档。CN 版无任何 unlimited 标注（旗舰版企业 CUE "暂不限量"是企业版权益）。
7. **试用期**：Pro Trial 含 "$5 Basic Usage"（与正式 Pro 的 $20 不同），试用结束自动转 $10/月订阅——采集时须把 trial 作为独立状态建模。
8. **有效期口径不一致**：CN "31 个自然日" vs 国际版 Legacy "30 calendar days"——同为"月度"周期，天数定义不同。

---

## 4. 来源冲突、更新频率与历史变更方式

### 4.1 来源冲突与不一致（本次发现）

1. **Pro 试用时长 7 天 vs 14 天**：现行 [Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing) 原文 "we offer a **7-day** free trial for new users"；2026-02-13 [官方博客](https://www.trae.ai/blog/trae_membership_0213) 原文 "we will offer a **14-day** free Pro trial"。判定：博客为上线时公告，现行值以文档为准（7 天），变更公告未见——**从 14 天缩短为 7 天的官方变更公告：无法确认**。
2. **港澳是否可用**：[Supported countries and regions](https://docs.trae.ai/ide/supported-countries-and-regions)（"TRAE is currently available in the following countries and regions"）的 Asia 列表**不含**香港/澳门；[计费文档](https://docs.trae.ai/ide/new-plans-and-billing) 的 "Supported countries/regions"（付费服务开通范围）**含** "Hong Kong SAR (China), Macao SAR (China)"。两份清单口径不同（产品可用性 vs 付费订阅范围），采集时须分开记录，不可互相推导。
3. **设备上限**：CN 官方文档明确 3 台；国际版对应页面渲染失败无法确认。辅助信号（非文档，采信度低）：官方 GitHub 仓库（Trae-AI org）团队回复在 2026-02 曾称"现在设备是 2 台上限"，与 CN 现行文档 3 台不一致，可能反映政策调整时间线，**国际版现行值无法确认**。
4. **docs 站点结构差异**：docs.trae.cn 全站支持 `.md` 直链 + llms.txt 索引（对采集友好）；docs.trae.ai 未发现 `.md` 直链，且多个页面（pricing、max-mode、privacy-mode、payment-service、device-limit、manage-subscriptions、ToS）为纯客户端渲染，正文抓取失败。同一 Vendor 两站采集可行性差异极大。

### 4.2 更新频率与历史变更方式

- **更新频率**：两线 changelog 均约每周 1–3 条（功能发布 + Hotfix）；重大计费变更走"官方博客（国际版，带日期）/docs 公告页（CN）+ changelog 条目"组合。
- **历史变更记录（官方可考）**：
  - 2025-11-25：CN v3.0.0，"SOLO 模式免费使用，按照加入等待名单的顺序逐步开放使用权限"（[CN changelog](https://docs.trae.cn/ide_changelog.md)）。
  - 2026-02-06：CN 企业版"焕新订阅套餐，提供基础版、团队版、旗舰版"（CN changelog）。
  - 2026-02-13（公告）/2026-02-24 2 AM UTC（生效）：国际版转 token 计费，新增 Lite/Pro+/Ultra，转 $20 迁移奖励（90 天有效），存量 fast requests 按比例折算（[博客](https://www.trae.ai/blog/trae_membership_0213)、[Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing)）。
  - 2026-06-09：CN 企业版服务升级为新版团队版/旗舰版计费（[焕新公告](https://docs.trae.cn/enterprise_coming-soon)）。
  - 2026-06-17：国际版 changelog "Launched TRAE Enterprise"（[changelog](https://docs.trae.ai/ide/changelog)）。
  - 2026-07-30：CN "上线以积分为核心的计费模式"（CN changelog v3.3.81~83；公告页 [ide_coming-soon](https://docs.trae.cn/ide_coming-soon.md)），存量"速通"按 1 次=40 通用积分折算。
  - 2026-08-25：CN 企业版 DeepSeek-V4-Flash 模型刊例价上调（预公告载明生效时间"北京时间 00:00"）——CN 价格调整采用**带生效日期的预公告**方式（[企业版计费项](https://docs.trae.cn/enterprise_billing-items)）。
- **页面是否显示更新时间**：两线文档页均不显示页面级 "Last updated"；带时间戳的载体是 changelog、官方博客、带生效日期的调价公告。价格字段的"最后确认时间"须由采集方记录抓取日期。
- **无法确认当前有效值的字段**：国际版 Bonus Usage 数值（官方不公开）、国际版设备上限、国际版登录方式清单、Pro Trial 从 14 天改 7 天的变更公告、CN 个人版逐模型积分消耗率、CN 版官方地区政策声明、trae.com.cn 首页内容。

---

## 5. 中国 Availability（五维度）

> 原则声明：本节区分"官方明确声明"与"无法确认"；**页面无法访问或客户端渲染失败不作为官方政策限制的证据**。检索过的官方渠道：docs.trae.ai（支持地区、计费、FAQ、模型、Quickstart）、www.trae.ai（定价页、ToS、隐私政策）、docs.trae.cn（套餐、模型、快速开始、设备限制、隐私模式）、官方博客与 changelog。

### 5.1 国际版（trae.ai）对中国大陆用户

| 维度 | 状态 | 说明 |
|---|---|---|
| 注册 | 官方明确声明（排除式，产品可用性层面） | [Supported countries and regions](https://docs.trae.ai/ide/supported-countries-and-regions) 原文："TRAE is currently available in the following countries and regions."，其 Asia 清单共 41 项：Indonesia, Singapore, Malaysia, Philippines, Thailand, Vietnam, India, Japan, Korea, Myanmar, Laos, Cambodia, Brunei, Timor-Leste, Cocos (Keeling) Islands, Christmas Island, Bangladesh, Sri Lanka, Nepal, Maldives, Bhutan, Pakistan, Afghanistan, Mongolia, Saudi Arabia, United Arab Emirates, Bahrain, Yemen, Iraq, Oman, Israel, Palestine, Jordan, Qatar, Lebanon, Kuwait, Uzbekistan, Tajikistan, Turkmenistan, Kyrgyzstan, Kazakhstan, Turkey——**不含中国大陆、香港、澳门、台湾**；Europe/North America/South America/Oceania/Africa/Antarctica 各清单亦无中国大陆。该页未区分免费/付费，按原文是产品整体可用性口径。注册所需账号体系（SSO 方式）官方可抓取页面未列出，**无法确认**。 |
| 支付 | 官方明确声明（部分）+ 中国维度无法确认 | 官方明确：支付方式清单含 "Alipay"、"WeChat Pay (not supported in the United States)"、含 UnionPay 的银行卡列表、PayPal（部分地区排除）及东南亚本地支付（[Plans & billing](https://docs.trae.ai/ide/new-plans-and-billing)）——支付宝/微信支付/银联卡在列，但清单未按国家说明可用性；同时付费订阅地区清单不含中国大陆。**中国大陆银行卡/支付宝账户能否实际完成订阅：官方无声明，无法确认**。Pro Trial 仅限信用卡（官方明确）。 |
| 网络访问 | 无法确认 | 官方未声明对中国大陆的网络可达性、封锁或镜像；亦未公布服务端区域架构。查过 docs.trae.ai 全站目录（无 infrastructure/regions 类页面）、FAQ、Quickstart。 |
| 服务政策 | 官方明确声明（排除式，订阅层面） | FAQ 原文："Why does the message indicate that the current region cannot be subscribed to? **TRAE provides subscription services only in certain countries and regions.** For more information, refer to '(New) Plans & billing'."（[FAQ](https://docs.trae.ai/ide/plans-and-billing-faqs)）；结合计费文档地区清单（不含中国大陆），可确认**付费订阅未对中国大陆开放**。产品可用性清单同样不含中国大陆（见注册维度）。未找到面向中国大陆的专门政策声明（如制裁/出口管制条款——ToS 正文渲染失败，无法核验其通用贸易条款，**无法确认**）。 |
| 功能限制 | 官方明确声明（美国为例）+ 中国维度无法确认 | 官方明确的模型级地区限制以美国为对象："The following AI models are not available to users in the United States: GPT series and MiniMax series."（[Models](https://docs.trae.ai/ide/models)）。未找到任何针对中国大陆的功能差异化声明。 |

### 5.2 中国版（TRAE CN）在中国大陆

| 维度 | 状态 | 说明 |
|---|---|---|
| 注册 | 官方明确声明（产品能力层面） | 官方明确登录方式："使用手机号、抖音账号、苹果账号、手机号或稀土掘金账号登录 TraeCode"（[CN 快速开始](https://docs.trae.cn/ide_get-started-with-trae.md)）。手机号默认为中国大陆手机号体系，但官方未写明是否支持非大陆手机号，**边界无法确认**。 |
| 支付 | 官方明确声明 | "抖音支付、支付宝、微信支付（连续包月暂不支持该支付方式）"（[套餐与计费](https://docs.trae.cn/ide_plans-and-billing)）；企业版经火山引擎下单；支持开票。均为中国大陆主流支付渠道。 |
| 网络访问 | 无法确认（无声明需要） | 产品即面向中国大陆市场运营（备案公示、国内支付/登录渠道、.cn 域名），官方无需另行声明网络可达性；未找到服务架构/节点位置说明。 |
| 服务政策 | 官方明确声明（合规层面，部分） | CN 文档含"豆包大模型备案公示"页面（[ide_intro-to-llm](https://docs.trae.cn/ide_intro-to-llm.md)，正文未抓取），表明内置模型经中国大陆生成式 AI 备案流程；企业版合同主体与购买流程在火山引擎（火山引擎用户协议/自动续费规则在下单流程中被引用，原文见企业版订阅管理文档）。是否有"仅限中国大陆用户"条款：**无法确认**。 |
| 功能限制 | 官方明确声明（相对国际版的差异） | CN 内置模型集与国际版不同（无 GPT/Gemini/Kimi-K2.5 国际版组合，改为 Seed/GLM/DeepSeek/Kimi-K3/Qwen 等国内模型，[CN 模型](https://docs.trae.cn/ide_models.md)）；国际版对 US 屏蔽 GPT/MiniMax，CN 版未见对称声明。CN 版另有企业级内容安全策略（企业版旗舰功能）。两版账号体系关系：CN changelog 原文 "TRAE CN 与 TRAE 国际版的全局技能目录相互兼容"（2026-06-04）——仅技能目录兼容的表述，账号/订阅是否互通：**无法确认**。 |

---

## 6. 对 Data Provider / Recommendation Policy 的建议（供后续 ticket 引用）

- **最小来源契约**：
  - 国际版：`docs.trae.ai/ide/new-plans-and-billing`（价格/额度/支付/地区，一页覆盖大部分核心字段）+ `docs.trae.ai/ide/models`（模型与 API 费率）+ `docs.trae.ai/ide/plans-and-billing-faqs`（规则细节）。
  - 中国版：`docs.trae.cn/ide_plans-and-billing`（有 `.md` 直链）+ `docs.trae.cn/ide_models.md`；企业版另加 `enterprise_billing-*` 系列。
- **必须按产品线分库**：trae.ai 与 trae.cn 是两个独立"Vendor 记录"（币种、单位、模型、版本线、支付全不同），Schema 需支持 `currency=USD/$-usage` 与 `currency=CNY/credits` 两种额度模型。
- **核心字段（缺失应阻止强排名）**：价格、币种、计费周期（含有效期口径 31 天/30 天）、Basic Usage/积分数值、模型集、地区清单。
- **失败分类建议**：`OK`（docs.trae.cn 全站 `.md`；docs.trae.ai 的 plans/billing/models/FAQ/on-demand/changelog）；`RENDER_DEPENDENT`（www.trae.ai/pricing、docs.trae.ai 的 max-mode/privacy-mode/payment-service/device-limit/manage-subscriptions、www.trae.cn/pricing——部分字段可由已抓取文档页替代）；`GONE/未获取`（ToS 正文）；`LOGIN_REQUIRED`（TRAE Console 购买与用量、火山引擎企业版控制台）。
- **监控点**：两线 changelog（按日期）、国际版官方博客（计费类）、CN 企业版调价预公告（带生效日期）、定价页卡片（需浏览器渲染，可低频抽查）。

## 7. 未解决问题

1. 国际版登录方式清单（邮箱/Google/SSO 选项）与 IDE 设备上限（对应文档页渲染失败，须浏览器人工核对）。
2. Pro Trial 时长由 14 天改为 7 天的官方变更公告（现仅能确认两份官方来源数值不一致，以现行文档 7 天为准）。
3. CN 个人版各内置模型的积分消耗率表（若存在，未在 docs.trae.cn 检索到；企业版有 Token 刊例价表，个人版是否同价**无法确认**）。
4. CN 版是否有官方"仅限中国大陆"或完整支持地区声明。
5. 国际版套餐是否覆盖 TraeWork 权益（CN 版套餐表明确"适用产品"，国际版套餐表未提及 TraeWork）。
6. ToS 全文（含管辖法、出口管制、内容授权条款）——页面客户端渲染，本次未能核验；搜索结果中的第三方引用（GitHub issue 等）不作为事实依据。
7. docs.trae.ai 是否存在类似 docs.trae.cn 的 `.md`/llms.txt 采集通道（本次未发现，未穷举验证）。

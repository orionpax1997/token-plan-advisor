# Google Gemini Code Assist 官方信息来源调研

- **采集日期**：2026-09-07
- **调研范围**：Google Gemini Code Assist 全部官方定价层级（Standard / Enterprise；个人免费层已于 2026-06-18 停止服务，见下文）
- **方法**：仅使用一手官方来源（Google 产品页、定价页、官方文档、官方博客、发布说明）；全部 URL 于采集日经 exa 抓取或官方页面搜索快照核实；无法确认的字段如实标注。

## 结论摘要

1. Gemini Code Assist 当前有效付费层级为 **Standard** 与 **Enterprise**（Google Cloud 按用户订阅）。两个官方页面给出**两种口径的价格**：定价页按"每小时许可费"（如 Standard 月度承诺 $0.031232877 / 1 hour），商业版产品页按"每用户每月"（Standard $22.80/$19、Enterprise $54/$45）——数值一致（换算见下），可作为同一事实的两种原始表达。
2. **个人免费层（Gemini Code Assist for individuals）已停服**：官方文档与博客明确，自 2026-06-18 起 IDE 扩展与 Gemini CLI 停止服务 individuals、Google AI Pro/Ultra 层，用户被引导迁移到 Antigravity；Standard/Enterprise 不受影响。
3. 额度字段官方文档非常完整：代码类请求 6000/天/用户、chat 类 960/天/用户、2 RPS、agent mode+Gemini CLI 合并 1500（Standard）/2000（Enterprise）/天/用户、1,000,000 token 上下文窗口。
4. 中国 Availability 五个维度中，**官方均无针对中国大陆的明确可用/禁用声明**；能确认的只有服务架构事实（从美/欧/新加坡区域全球提供服务、支付方式因国家而异、注册需 Google 账号与 Cloud billing account）。页面动态渲染或抓取失败**不得**推断为官方政策限制。
5. 官方来源之间存在一处不一致：商业版页称 Code Assist 也可经 Google Developer Program 获得，但 Developer Program 当前计划页已不再列出 Gemini Code Assist Standard 权益（改为 Antigravity 请求额度 + AI Pro/Ultra 云抵扣金），当前有效形式**无法确认**。

---

## 1. 官方入口清单

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 1 | <https://cloud.google.com/products/gemini/pricing> | 定价页（Standard/Enterprise） | 全球（USD 报价） | 无 | 否 | 含 Hourly/Monthly 切换标签页 | 是（全文） |
| 2 | <https://codeassist.google/products/business> | 产品页 + 价格表（Standard/Enterprise） | 全球 | 无 | 否 | 正常静态可读；页首有 Antigravity 迁移公告横幅 | 是（全文） |
| 3 | <https://codeassist.google> | 产品页（根域，同商业版内容；定价页把"个人版"咨询指引到本域） | 全球 | 无 | 否 | 正常 | 是（全文） |
| 4 | <https://codeassist.google/products/individuals> | 产品页（个人版） | 全球 | 无 | 否 | **重度客户端渲染**：抓取仅返回 JS 引导代码（WIZ_global_data 等），无正文 | 否（仅 JS，无内容） |
| 5 | <https://docs.cloud.google.com/gemini/docs/codeassist/overview> | API/产品文档（概览、版本功能对比） | 全球 | 无 | 否 | 正常 | 是 |
| 6 | <https://cloud.google.com/gemini/docs/quotas> | 文档（配额与系统限制） | 全球 | 无 | 否 | 正常 | 是 |
| 7 | <https://docs.cloud.google.com/gemini/docs/locations> | 文档（服务区域） | 全球 | 无 | 否 | 正常 | 是 |
| 8 | <https://developers.google.com/gemini-code-assist/docs/set-up-gemini-standard-enterprise> | 文档（购买/设置/注册要求） | 全球 | 无 | 否 | 正常 | 是 |
| 9 | <https://cloud.google.com/gemini/docs/admin> | 文档（订阅管理，含购买入口 Admin for Gemini） | 全球 | 无 | 否 | 正常 | 是 |
| 10 | <https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals> | 文档（个人层弃用公告） | 全球 | 无 | 否 | 正常；页尾显示 "Last updated 2026-06-11 UTC" | 是 |
| 11 | <https://developers.google.com/gemini-code-assist/docs/set-up-gemini> | 文档（消费者账户/个人层状态与迁移 FAQ） | 全球 | 无 | 否 | 正常 | 是 |
| 12 | <https://developers.googleblog.com/en/an-important-update-transitioning-gemini-cli-to-antigravity-cli/> | 官方博客（2026-05-19） | 全球 | 无 | 否 | 正常 | 是 |
| 13 | <https://docs.cloud.google.com/gemini/docs/codeassist/release-notes> | 发布说明（按日期） | 全球 | 无 | 否 | 正常 | 是 |
| 14 | <https://docs.cloud.google.com/gemini/docs/discover/data-governance> | 文档（数据治理） | 全球 | 无 | 否 | 正常 | 经官方页搜索快照核实关键句（未逐字全文抓取） |
| 15 | <https://docs.cloud.google.com/gemini/docs/codeassist/security-privacy-compliance> | 文档（安全/隐私/合规） | 全球 | 无 | 否 | 正常 | 经官方页搜索快照核实关键句 |
| 16 | <https://cloud.google.com/billing/docs/how-to/payment-methods> | 文档（Cloud Billing 支付方式） | 全球（按国家/币种） | 无 | 否 | 正常 | 是 |
| 17 | <https://developers.google.com/program/plans-and-pricing> | 定价页（Google Developer Program，商业版页列为另一获取渠道） | 全球（低价计划曾限定美国，见下） | 无 | 否 | 正常 | 是 |
| 18 | Admin for Gemini（Google Cloud 控制台内页面，官方文档给出的购买入口） | 购买入口 | 全球 | 需 Google Cloud 账号 + billing account + `consumerprocurement.orders.place` 权限 | **是** | 控制台内，未直接抓取 | 否（以官方文档描述为准） |

已核实的失效/迁移 URL：`https://cloud.google.com/gemini/docs/data-governance` 返回 404，现指向 `https://docs.cloud.google.com/gemini/docs/discover/data-governance`（官方文档域名整体迁移的证据）。

---

## 2. 字段覆盖矩阵

状态标注：公开（页面直接可见）/ 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用。

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开 | "Gemini Code Assist Standard"、"Gemini Code Assist Enterprise"；历史名称 "Gemini Code Assist for individuals"（免费层，已停服） | [定价页](https://cloud.google.com/products/gemini/pricing)、[弃用文档](https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals) |
| Plan Type | 公开（判断） | 属 **coding-subscription**（按用户/月的 IDE+CLI AI 编码订阅，隶属 Gemini for Google Cloud）。Enterprise 同时捆绑企业级 Google Cloud 助手功能，但主体仍是编码订阅，不归为 general-subscription 或 api-usage。注：Gemini CLI 也可凭付费 Gemini API key 使用（博客），属于相邻 api-usage 通道，非本 Plan | [定价页](https://cloud.google.com/products/gemini/pricing)、[官方博客](https://developers.googleblog.com/en/an-important-update-transitioning-gemini-cli-to-antigravity-cli/) |
| 价格 | 公开 | 定价页（Hourly 口径）：Standard monthly commitment **$0.031232877 / 1 hour**、12-month commitment **$0.026027397 / 1 hour**；Enterprise **$0.073972603 / 1 hour**、**$0.061643836 / 1 hour**。商业版页（Monthly 口径）：Standard monthly **$22.80 per user per month**（30 天免费试用最多 50 用户）、annual **$19 per user per month with an upfront annual commitment**；Enterprise monthly **$54 per user per month**（试用同前）、annual **$45 per user per month with an upfront annual commitment** | [定价页](https://cloud.google.com/products/gemini/pricing)、[商业版页](https://codeassist.google/products/business) |
| 币种 | 公开 | USD；页面原文："If you pay in a currency other than USD, then the prices listed in your currency on Cloud Platform SKUs apply." | [定价页](https://cloud.google.com/products/gemini/pricing) |
| 计费周期 | 公开 | "All subscriptions are billed monthly."（月度或年度承诺，均按月出账；年度承诺为折扣费率按月收取） | [定价页](https://cloud.google.com/products/gemini/pricing)、[订阅管理文档](https://cloud.google.com/gemini/docs/admin) |
| 额度/使用限制 | 文档或公告 | 代码类请求（生成/补全）**6000 请求/天/用户**；chat、可视化、data insight 等 **960 请求/天/用户**；agent mode 与 Gemini CLI **合并**限额 Standard **1500/天/用户**、Enterprise **2000/天/用户**（"one prompt might result in multiple model requests"）；GitHub 版 PR 评审 **"at least 100 pull request reviews per day"**；本地代码库感知 **1,000,000 token context window**；代码自定义仓库上限 **20,000**；30 天免费试用最多 50 用户（商业版页）；首月使用抵扣金已于 2026-08-20 取消（release notes） | [配额页](https://cloud.google.com/gemini/docs/quotas)、[商业版页](https://codeassist.google/products/business)、[发布说明](https://docs.cloud.google.com/gemini/docs/codeassist/release-notes) |
| 模型与功能 | 公开 | 商业版页："with Gemini 3 and a 1M token context window"（Gemini 3 面向 Preview 通道订阅者）；定价页 Standard/Enterprise 功能矩阵（补全/生成/chat、agent mode、Gemini CLI、代码自定义仅 Enterprise、Apigee/Application Integration/Cloud Assist 仅 Enterprise 等）；发布说明 2026-06-08："Gemini 3.5 Flash is generally available to Gemini Code Assist users in VS Code and IntelliJ" | [商业版页](https://codeassist.google/products/business)、[定价页](https://cloud.google.com/products/gemini/pricing)、[发布说明](https://docs.cloud.google.com/gemini/docs/codeassist/release-notes) |
| 上下文长度 | 文档或公告 | "Local codebase awareness: 1,000,000 token context window"（配额页）；营销表述 "1M token context window"（商业版页）。两处是否同一口径：无法确认 | [配额页](https://cloud.google.com/gemini/docs/quotas) |
| 速率限制 | 公开 | "Requests per second: 2"（每用户每项目）；agent/CLI 限额按天（"Requests are limited per user per minute and are subject to the availability of the service in times of high demand"——分钟级具体数值未给出） | [配额页](https://cloud.google.com/gemini/docs/quotas) |
| 并发 | 无法确认 | 官方无"并发会话/设备数"字段；最接近的是 2 RPS 与许可证数。查过配额页与定价页 | [配额页](https://cloud.google.com/gemini/docs/quotas) |
| 隐私/数据处理 | 文档或公告 | "Gemini doesn't use your prompts or its responses as data to train its models"；"Gemini Code Assist Standard and Enterprise are stateless Google Cloud services, they don't store prompts and responses"；IP 赔付；SOC 1/2/3、ISO/IEC 27001/27017/27018/27701；受 Cloud Data Processing Addendum 约束 | [数据治理](https://docs.cloud.google.com/gemini/docs/discover/data-governance)、[安全隐私合规](https://docs.cloud.google.com/gemini/docs/codeassist/security-privacy-compliance)、[商业版页](https://codeassist.google/products/business) |
| 注册要求 | 公开 | 需 Google Cloud 项目 + billing account + 启用 Gemini for Google Cloud API（`cloudaicompanion.googleapis.com`）+ IAM 角色；购买需 `consumerprocurement.orders.place` 权限；**Enterprise 至少购买 10 个许可证**（"if you are purchasing Enterprise edition, then you must purchase at least 10 licenses"）；用户经 IDE 用 Google 账号登录并选择项目 | [设置文档](https://developers.google.com/gemini-code-assist/docs/set-up-gemini-standard-enterprise)、[订阅管理文档](https://cloud.google.com/gemini/docs/admin) |
| 支付方式 | 文档或公告 | Cloud Billing 文档："The payment methods available for your self-serve (online) Cloud Billing account depend on your currency and country."；信用卡 Amex/MasterCard/Visa 等；订阅绑 billing account（每 billing account 仅一个 Code Assist 订阅）。中国大陆可用支付方式：未找到官方清单 | [支付方式文档](https://cloud.google.com/billing/docs/how-to/payment-methods)、[订阅管理文档](https://cloud.google.com/gemini/docs/admin) |
| 地区政策 | 文档或公告 | "Gemini Code Assist Standard and Enterprise use Google Cloud for load-balancing, so they are able to operate globally... you can't choose which region to use."服务区域：美国（Iowa/Oregon/Las Vegas/N. Virginia）、欧洲（Belgium/Finland）、亚太（Singapore）；GitHub 企业版连接固定 `us-east1`。**无中国大陆区域；无针对中国大陆用户的官方政策声明** | [服务区域文档](https://docs.cloud.google.com/gemini/docs/locations) |
| 官方购买链接 | 公开 | Google Cloud 控制台 "Admin for Gemini" → "Get Gemini Code Assist"（需登录，见入口清单 #18）；定价页："You can purchase your licenses directly from the Gemini Admin console, or connect with our sales team"；商业版页有销售联系表单 | [定价页](https://cloud.google.com/products/gemini/pricing)、[设置文档](https://developers.google.com/gemini-code-assist/docs/set-up-gemini-standard-enterprise) |
| 更新时间 | 文档或公告 | 文档页带 "Last updated"（例：弃用文档 2026-06-11 UTC）；发布说明按日期条目（最新条目 2026-08-20）；**定价页与产品页不显示更新时间** | [弃用文档](https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals)、[发布说明](https://docs.cloud.google.com/gemini/docs/codeassist/release-notes) |

---

## 3. 价格/额度的原始表达方式与归一化歧义

### 3.1 官方原始表述（照录）

- 定价页（小时口径）："License fees (monthly commitment): $0.031232877 / 1 hour"；"License fees (12-month commitment): $0.026027397 / 1 hour"（Enterprise 同构：$0.073972603、$0.061643836）。页面另有 Hourly/Monthly 切换标签，本次抓取捕获的是 Hourly 标签内容。
- 商业版页（月度口径）："$22.80 per user per month." / "$19 per user per month with an upfront annual commitment." / "$54 per user per month." / "$45 per user per month with an upfront annual commitment."
- 配额页："Maximum requests per user per day — Standard: 1500, Enterprise: 2000"（agent mode 与 Gemini CLI 合并）；"Requests per day ... code requests: 6000"；"...chat ...: 960"；"Requests per second: 2"；"Local codebase awareness: 1,000,000 token context window"；"Code customization repositories: 20,000"。

### 3.2 数值一致性换算（我方验算，非官方显示文本）

按 24h×365 天÷12 折算：0.026027397→≈$19.00/用户/月、0.031232877→≈$22.80、0.061643836→≈$45.00、0.073972603→≈$54.00。两页口径互洽，可判定为同一价格的不同表达。

### 3.3 归一化歧义清单

1. **两套限额单位并存且不可互换**："6000 代码请求/天"是 IDE 补全/生成类；"1500/2000 请求/天"仅覆盖 agent mode+Gemini CLI，且官方明示"一次 prompt 可能产生多次模型请求"，实际 prompt 吞吐远低于请求数。跨 Vendor 对比（如按"消息/月"或"请求/月"计价的 Vendor）时不能直接比数字，需按通道拆分。
2. **小时费率 vs 月价**：Data Provider 若只抓定价页会得到"$/小时"，需要换算假设（24×365/12）；若只抓商业版页会漏掉承诺期差异。建议以"per user per month + commitment term"为规范字段、小时价保留为原始引用。
3. **动态/软性限额**："at least 100 pull request reviews per day"是软下限；agent/CLI 限额"subject to the availability of the service in times of high demand"，存在官方动态降额空间。
4. **上下文口径**：配额页的 1,000,000 token（local codebase awareness）与营销的 "1M token context window" 未必同义（后者可能指 chat 上下文），归一化时须区分"代码库上下文窗口"与"模型上下文窗口"。
5. **免费试用**：30 天/50 用户的试用属于价格字段的附加属性，需单独建模，避免与免费层（已停）混淆。
6. **首月抵扣金取消**（2026-08-20）说明"新客优惠"类字段时效性极强，必须带生效日期采集。

---

## 4. 来源冲突、更新频率与历史变更方式

- **来源冲突（1 处）**：商业版页称 "Gemini Code Assist is also available through the Google Developer Program"；但 Developer Program 当前 [计划与定价页](https://developers.google.com/program/plans-and-pricing) 的 Premium 权益表只列 Antigravity 请求额度与 AI Pro/Ultra 云抵扣金（$10/$40/$100 per user per month），未列 Gemini Code Assist Standard。2025-08 官方博客曾宣布 Premium（$24.99/月）含 Gemini Code Assist Standard 且月付计划"currently only available in the US"。**当前经 Developer Program 获取 Code Assist 的形式与地区范围：无法确认。**
- **免费层残值冲突**：定价页仍写 "If you are looking for information about Gemini Code Assist for individuals... please visit codeassist.google"，而官方文档已宣布该层 2026-06-18 停服且个人版页面动态渲染无法核验内容 → 免费层当前有效值：**无法确认（应视为已停）**。
- **更新频率**：发布说明约每周至每月一条（VS Code/IntelliJ 插件版本 + Announcement）；重大变更走官方博客 + deprecations 文档。
- **历史变更方式**：官方博客（带日期署名）、`deprecations/` 专用文档、release notes（带日期，可 RSS 订阅）、文档页 "Last updated 2026-06-11 UTC" 时间戳。
- **页面是否显示更新时间**：文档页显示；定价页/产品页不显示 → 价格字段无官方"最后确认时间"，采集系统需自行记录抓取时间。
- **URL 结构性迁移**：`cloud.google.com/gemini/docs/*` → `docs.cloud.google.com/gemini/docs/*`（旧 data-governance URL 实测 404）。Provider 应同时兼容两个域名。
- **无法确认当前有效值的字段**：Developer Program 渠道的 Code Assist 权益；个人免费层任何数值；分钟级 agent/CLI 速率具体值；"1M token context window"的准确口径。

---

## 5. 中国 Availability（五维度）

> 原则声明：本节区分"官方明确声明"与"无法确认"；**页面无法访问或动态渲染不作为官方政策限制的证据**。搜索过的官方渠道：Google Cloud 帮助/文档站、定价页、billing 文档、官方博客；"Google Cloud China" 相关搜索仅返回客户案例页（网易、YOOZOO、美图等），无政策声明。

| 维度 | 状态 | 说明 |
|---|---|---|
| 注册 | 官方明确声明（注册要求本身）+ 中国维度无法确认 | 官方明确：使用需 Google 账号登录 + Google Cloud 项目/billing account（[设置文档](https://developers.google.com/gemini-code-assist/docs/set-up-gemini-standard-enterprise)）。但**未找到**任何官方页面声明中国大陆用户可否完成注册。免费个人层的 "Login with Google" 通道已随 2026-06-18 停服关闭（[消费者账户文档](https://developers.google.com/gemini-code-assist/docs/set-up-gemini)）。 |
| 支付 | 无法确认 | 官方明确：支付方式"depend on your currency and country"（[支付方式文档](https://cloud.google.com/billing/docs/how-to/payment-methods)），需自查其支付选项工具；**未找到**列出中国大陆可用支付方式的官方页面。 |
| 网络访问 | 无法确认 | 官方明确：服务从美/欧/新加坡区域全球负载均衡、用户不可选区（[服务区域文档](https://docs.cloud.google.com/gemini/docs/locations)）；官方未声明中国大陆的网络可达性或封锁。 |
| 服务政策 | 无法确认 | 未找到任何官方页面声明 Gemini Code Assist（或 Gemini for Google Cloud）在中国大陆可用/不可用；`cloud.google.com/docs/geography-and-regions` 只提供区域结构说明，未做国别排除声明；完整数据中心列表指向 ISO/IEC 27001 证书与 Cloud locations 页（本次未逐项核查）。 |
| 功能限制 | 无法确认 | 未找到针对中国大陆的功能差异化声明。设置文档中 "If you are using Gemini Code Assist Standard or Enterprise from outside of..." 一句指 VPC-SC ingress 策略配置，属企业网络安全功能，**不是**地理限制。 |

---

## 6. 对 Data Provider / Recommendation Policy 的建议（供后续 ticket 引用）

- **最小来源契约**：定价页（价格+承诺期）+ 商业版页（月价+试用）+ 配额页（额度）三页即可覆盖核心字段；建议以 `docs.cloud.google.com` 域为准并兼容旧域。
- **核心字段（缺失应阻止强排名）**：价格、币种、计费周期、承诺期、每日/每秒限额（按通道拆分）、个人层停服状态。
- **失败分类建议**：`OK`（静态页全文）/ `RENDER_DEPENDENT`（codeassist.google/products/individuals 类 JS 渲染页）/ `GONE`（404，需域名迁移重试）/ `LOGIN_REQUIRED`（Admin for Gemini 控制台）。
- **采集时效**：文档页记录 "Last updated"；营销页无时间戳，必须记录抓取日期；重大变更监控官方博客与 `deprecations/` 目录。

## 7. 未解决问题

1. Developer Program 渠道当前能否获得 Gemini Code Assist Standard（官方两页信息不一致）。
2. "1M token context window" 与配额页 "1,000,000 token context window" 是否同口径。
3. 分钟级 agent/CLI 请求速率的官方具体数值（配额页仅给日上限与"per user per minute"表述）。
4. 中国大陆用户注册/支付的实际可行性（官方无声明；如需确认须登录实机验证，超出本调研范围）。

# 智谱 GLM Coding Plan 官方信息来源调研（z.ai 国际版 + bigmodel.cn 中国区）

- **采集日期**：2026-09-07（15:00–16:00 CST 之间完成主要抓取）
- **调研范围**：智谱 GLM Coding Plan（GLM Coding Plan 订阅套餐），分**国际区 z.ai**（运营主体 JINGSHENG HENGXING TECHNOLOGY PTE.LTD，新加坡）与**中国区 bigmodel.cn** 两入口
- **方法**：仅使用一手官方来源（z.ai 订阅页、docs.z.ai 官方文档与公告、法律条款页）；全部 URL 于采集日经 exa 抓取或对原始 HTML 的直接请求核实。**本次核查因采集窗口限制，z.ai 国际版已完成主体核查；bigmodel.cn 中国区未能完成页面级核查**（详见 §6 与未解决问题）。

## 结论摘要

1. **z.ai 国际版当前有效套餐为三层个人计划 Lite / Pro / Max + 团队计划（Standard Seat / Premium Seat）**，2026-07-30 起从"prompt 计数制"切换为"credits 计数制"（[Plan Update Announcement](https://docs.z.ai/devpack/notice/usage-revision)，发布日期 July 30, 2026）：旧计划停售，存量用户保留原权益至当前计费周期结束。当前额度官方口径：个人 Lite 2,000 / Pro 12,000 / Max 28,000 credits 每 5 小时，周配额 10,000 / 60,000 / 140,000 credits（[Overview](https://docs.z.ai/devpack/overview.md)）。
2. **价格仅"起价"有当前官方数值**：官方文档现行表述 "Starting at just 18 USD per month"（[Overview](https://docs.z.ai/devpack/overview.md)）；订阅页 meta 描述 "Plans from 18/month"。**新 credits 制下 Pro / Max 的当前官方价目未能从官方渠道确认**（z.ai/subscribe 为重客户端渲染，静态 HTML 无价格数据；官方登录后台不可访问）。历史官方价格（2026-04-21 迁移公告所载，"example based on current pricing, for reference only"）：月付 Lite $18 / Pro $72 / Max $160（[Legacy Plan Migration Notice](https://docs.z.ai/devpack/transition.md)）。
3. 额度消耗为**credits 乘数制**：`Model credit usage = (Input tokens × Input multiplier + Cached Input tokens × Cached Input multiplier + Output tokens × Output multiplier) / 10,000`；GLM-5.3 乘数 6.9/1.7/24；非高峰时段按标准费率 50% 计费；高峰时段为周一至周五 14:00–18:00（新加坡时间 UTC+8）。官方给出估算：Lite 43–87M tokens/week、Pro 263–526M、Max 613–1226M（[Overview](https://docs.z.ai/devpack/overview.md)）。
4. **bigmodel.cn 中国区本次未完成核查**。可确认的间接事实：z.ai 订阅页静态资源（Next.js chunks）托管于 `static.bigmodel.cn/z-ai-website/`，图标托管于 `z-cdn.chatglm.cn`，说明 z.ai 国际站与智谱基础设施同源；但两站账号/套餐/定价是否互通**无官方声明，无法确认**。
5. 中国 Availability：智谱是中国厂商，但 **z.ai 国际版的数据控制者为新加坡实体**（[Privacy Policy](https://docs.z.ai/legal-agreement/privacy-policy.md)，Last Update September 29, 2025）；其 Terms of Use 出口管制条款禁用地区为伊朗/朝鲜/古巴/克里米亚/顿涅茨克/扎波罗热等，**未点名中国大陆，也无针对中国大陆用户的可用/禁用声明**。

---

## 1. 官方入口清单（z.ai 国际区，本次核实）

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 1 | <https://z.ai/subscribe> | 定价页 + 购买入口（Individual/Team 切换，URL 参数 `?plantype=individual`） | 国际（USD 报价） | 无 | 购买需登录 | **重度客户端渲染**：curl 取得 171KB HTML 仅含 meta/导航，价格由运行时 API 返回；meta title/desc/keywords 完整可读 | 部分（meta 与模型/工具清单已核实；价格数字未获取） |
| 2 | <https://docs.z.ai/devpack/overview.md> | 帮助文档（套餐总览、credits 规则、乘数表、token 估算） | 国际 | 无 | 否 | 正常（`.md` 原文可直接抓取） | 是（全文） |
| 3 | <https://docs.z.ai/devpack/usage-policy.md> | 帮助文档（速率限制、账号规则、订阅管理、退款） | 国际 | 无 | 否 | 正常 | 是 |
| 4 | <https://docs.z.ai/devpack/teamplan.md> | 帮助文档（Team Plan 权益、credits、席位规则） | 国际 | 无 | 否 | 正常 | 是 |
| 5 | <https://docs.z.ai/devpack/faq.md> | 帮助文档（FAQ：模型、配额、扣款、取消、1113 错误） | 国际 | 无 | 否 | 正常 | 是 |
| 6 | <https://docs.z.ai/devpack/quick-start.md> | 帮助文档（注册→订阅→取 Key→配工具全流程） | 国际 | 无 | 否 | 正常 | 是 |
| 7 | <https://docs.z.ai/devpack/notice/usage-revision.md> | 官方公告（2026-07-30 credits 制改版） | 国际 | 无 | 否 | 正常 | 是 |
| 8 | <https://docs.z.ai/devpack/transition.md> | 官方公告（2026-04-21 旧计划迁移，含官方价格表） | 国际 | 无 | 否 | 正常 | 是 |
| 9 | <https://docs.z.ai/devpack/notice/event-glm-5.3-flash.md> | 官方公告（GLM-5.3-Flash 用量活动，2026-09-03～09-20） | 国际 | 无 | 否 | 正常 | 是 |
| 10 | <https://docs.z.ai/legal-agreement/subscription-terms.md> | 法律条款（订阅、费用与支付） | 国际 | 无 | 否 | 正常 | 是 |
| 11 | <https://docs.z.ai/legal-agreement/terms-of-use.md> | 法律条款（Last Update April 14, 2026，含 §X 出口管制） | 国际 | 无 | 否 | 正常（抓取尾部略有截断，§X/§XI/§XII 已核实） | 是 |
| 12 | <https://docs.z.ai/legal-agreement/privacy-policy.md> | 法律条款（Last Update September 29, 2025，含 API DPA） | 国际 | 无 | 否 | 正常 | 是 |
| 13 | <https://docs.z.ai/llms.txt> | 文档总目录 | 国际 | 无 | 否 | 正常 | 是 |
| 14 | <https://docs.z.ai/help/faq.md> | 帮助文档（平台 FAQ：充值、3DS、速率查询） | 国际 | 无 | 否 | 正常 | 是 |
| 15 | `https://z.ai/manage-apikey/subscription`、`/manage-apikey/billing`、`/manage-apikey/rate-limits` | 用量/购买/限制查询后台（官方文档引用） | 国际 | 需 Z.ai 账号 | **是** | 控制台内，未抓取 | 否（以文档描述为准） |
| 16 | <https://docs.z.ai/guides/overview/pricing.md> | 文档（API 按量定价，非订阅） | 国际 | 无 | 否 | 未单独抓取（本调研仅作对照引用） | 否 |

**bigmodel.cn 中国区入口**：本次未完成定位与抓取（见 §6、§8），无已核实条目。

---

## 2. 字段覆盖矩阵（z.ai 国际区）

状态标注：公开（页面直接可见）/ 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用。

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开 | 个人计划：**"Lite"、"Pro"、"Max"**（credits 制，2026-07-30 起）；团队计划：**"Standard Seat"、"Premium Seat"**。历史名称：Legacy Plan V1 / Legacy Plan V2 / Team Plan（"Team Edition"） | [Overview](https://docs.z.ai/devpack/overview.md)、[Team Plan](https://docs.z.ai/devpack/teamplan.md)、[改版公告](https://docs.z.ai/devpack/notice/usage-revision.md) |
| Plan Type | 公开（判断） | **coding-subscription**。"The GLM Coding Plan is a subscription package designed specifically for AI-powered coding"；条款明示配额"only used within officially supported tools"，禁止通用 API 用途（与 api-usage 严格分界；按量 API 另售） | [Overview](https://docs.z.ai/devpack/overview.md)、[Subscription Terms §4](https://docs.z.ai/legal-agreement/subscription-terms.md) |
| 价格 | 文档或公告（部分）+ 无法确认（Pro/Max 现价） | 当前官方起价："Generous Usage at a Fair Price: … **Starting at just 18 USD per month**"；订阅页 meta："Plans from 18/month"。**2026-04-21 官方迁移公告价格表**（标注 "based on current pricing, for reference only"）：月付 Lite **$18** / Pro **$72** / Max **$160**；季付 Lite **$48.60** / Pro **$194.40** / Max **$432**；年付 Lite **$172.80** / Pro **$691.20** / Max **$1,536**。新 credits 计划 Pro/Max 现价：无法确认 | [Overview](https://docs.z.ai/devpack/overview.md)、[迁移公告](https://docs.z.ai/devpack/transition.md)、[订阅页 meta](https://z.ai/subscribe) |
| 币种 | 文档或公告 | USD（"Starting at just 18 USD per month"；迁移公告价表以 $ 计）。其他币种选项：无官方说明 | 同上 |
| 计费周期 | 文档或公告 | 月/季/年（迁移公告列 Monthly/Quarterly/Annual Plan 三表）；"Your subscription will automatically renew at the end of each billing cycle"；周配额 "resets every 7 days"、5 小时配额 "Dynamically refreshed; credit quota resets 5 hours after consumption" | [Usage Policy](https://docs.z.ai/devpack/usage-policy.md)、[Overview](https://docs.z.ai/devpack/overview.md)、[迁移公告](https://docs.z.ai/devpack/transition.md) |
| 额度/使用限制 | 公开 | credits 制（现行）：5 小时/周双池——Lite **2,000 / 10,000**、Pro **12,000 / 60,000**、Max **28,000 / 140,000** credits；团队 Standard Seat **15,000 / 66,000**、Premium Seat **35,000 / 155,000** credits。扣减公式与乘数表见 §3。Legacy V2 原文（prompt 制）："Lite Plan: Up to approx. 80 prompts / 5h + approx. 400 prompts/week；Pro 400/2,000；Max 1,600/8,000"；"One prompt refers to one query. Each prompt is estimated to invoke the model 15–20 times."；"The monthly available quota is converted based on API pricing, equivalent to approximately 15–30× the monthly subscription fee (weekly caps already factored in)." | [Overview](https://docs.z.ai/devpack/overview.md)、[Team Plan](https://docs.z.ai/devpack/teamplan.md)、[改版公告](https://docs.z.ai/devpack/notice/usage-revision.md) |
| 模型与功能 | 公开 | 现行文档："All plans support GLM-5.3, GLM-5-Turbo and GLM-4.7. Requests for previous models (GLM-5.2/GLM-5.1) will be automatically routed to GLM-5.3."；FAQ 与公告另有 **GLM-5.3-Flash**（Flash 专属活动、团队乘数表含 GLM-5.3-Flash）；订阅页 meta 列 GLM-5.3/GLM-5.3-Flash/GLM-5.2/GLM-5-Turbo。工具："Claude Code, Roo Code, Kilo Code, Cline, OpenCode, OpenClaw, Crush, Goose, Cursor"（Quick Start 配置指南列表）；meta keywords 另列 Codex、Windsurf、Trae、ZCode。端点：Anthropic Messages `https://api.z.ai/api/anthropic`、OpenAI Chat Completions `https://api.z.ai/api/coding/paas/v4`。专属 MCP：Vision Understanding（GLM-4.6V）、Web Search、Web Reader、Zread（"All plans support"） | [Overview](https://docs.z.ai/devpack/overview.md)、[Quick Start](https://docs.z.ai/devpack/quick-start.md)、[FAQ](https://docs.z.ai/devpack/faq.md)、[Flash 活动](https://docs.z.ai/devpack/notice/event-glm-5.3-flash.md)、[订阅页 meta](https://z.ai/subscribe) |
| 上下文长度 | 无法确认 | Coding Plan 文档未给出模型上下文窗口数值。查过 Overview、FAQ、Team Plan、Quick Start。API 文档 `guides/llm/glm-5.3.md` 未在本次核查窗口内核实 | 本调研核查过的页面 |
| 速率限制（并发） | 文档或公告 | "Rate (concurrency) limits are tied to your plan tier. The platform dynamically adjusts these limits based on resource availability, with the general principle being Max > Pro > Lite."；推荐并发项目数 Lite 1 / Pro 1–2 / Max 2+（团队 Standard 1–2 / Premium 2+）；"Plan users will enjoy higher concurrency limits during off-peak hours (dynamically increased)"。**无数值化 RPM/并发数**；登录后台 `manage-apikey/rate-limits` 可查（需登录） | [Usage Policy](https://docs.z.ai/devpack/usage-policy.md)、[Team Plan FAQ](https://docs.z.ai/devpack/teamplan.md)、[平台 FAQ](https://docs.z.ai/help/faq.md) |
| 并发 | 文档或公告（定性）+ 无法确认（数值） | 同上：仅"动态调整、Max>Pro>Lite、非高峰动态提升"的定性描述，无公开数值 | 同上 |
| 隐私/数据处理 | 文档或公告 | 个人计划用户内容可用于改进服务/训练："For individual users, we reserve the right to process any User Content to improve our existing Services and/or to develop new products and services… including developing, improving, or promoting our Services, such as when we train and improve our models"（ToS §IV.3.a + Privacy Policy §3）；团队计划："**Data is not used for model training by default**: Code, prompts, conversations, and related content are excluded from model training by default"（[Team Plan](https://docs.z.ai/devpack/teamplan.md)）；API DPA："The Company do not store any of the content the Customer or its End Users provide or generate… not saved on our servers"；数据一般存储/处理于新加坡（"We generally provide the Services from Singapore… your personal data is generally processed in Singapore"） | [Privacy Policy](https://docs.z.ai/legal-agreement/privacy-policy.md)、[ToS §IV.3](https://docs.z.ai/legal-agreement/terms-of-use.md)、[Team Plan](https://docs.z.ai/devpack/teamplan.md) |
| 注册要求 | 文档或公告 | "Access Z.AI Open Platform, Register or Login"（Quick Start）；账号信息含 "date of birth (where applicable), username, email address, and password"；支持 Google/GitHub 第三方登录（Privacy Policy §2.1）；"Our Services are not directed to, or intended for, the individual under 18"；订阅绑定单一自然人账号、禁止共享（Subscription Terms §4）。**实名认证要求：官方页面未见**（中国大陆实名认证是 bigmodel.cn 侧要求，未核查） | [Quick Start](https://docs.z.ai/devpack/quick-start.md)、[Privacy Policy](https://docs.z.ai/legal-agreement/privacy-policy.md)、[Subscription Terms §4](https://docs.z.ai/legal-agreement/subscription-terms.md) |
| 支付方式 | 文档或公告 | 扣款顺序："1. Priority is given to the bonus balance… 2. …cash balance… 3. …deducted from your linked third-party payment method (**e.g., bank card or PayPal**)"；FAQ 同序并称信用卡扣款有最低金额、不足四舍五入；**"3DS verification is not supported in our platform at this moment"**（信用卡不支持 3DS）；平台 Credits（邀请返奖励）可抵扣订阅、不可提现；企业可申请 **VAT 发票**（"Verified enterprises can request special VAT invoices"）。支付宝/微信/Stripe 字样未见于已核查官方页 | [Usage Policy](https://docs.z.ai/devpack/usage-policy.md)、[FAQ](https://docs.z.ai/devpack/faq.md)、[平台 FAQ](https://docs.z.ai/help/faq.md)、[Team Plan](https://docs.z.ai/devpack/teamplan.md) |
| 地区政策 | 文档或公告 | 出口管制与制裁条款（ToS §X）："the service shall not be used for the benefit of, nor exported, re-exported, or transferred to: (a) any person or entity located in **Iran, North Korea, Cuba, Crimea, Donetsk, or Zaporizhzhia**…"；另确认不在联合国/美国 SDN/实体清单/EU 清单/中国不可靠实体清单等。**无支持/排除国家正面清单；未点名中国大陆**。无面向 Coding Plan 的区域化定价（对照 Cursor Start 类） | [ToS §X](https://docs.z.ai/legal-agreement/terms-of-use.md) |
| 官方购买链接 | 公开（入口）+ 需登录（成交） | <https://z.ai/subscribe>（Individual/Team 切换）；实际下单与续费管理在登录后控制台（"Log in to the Z.ai API Platform → profile icon → Payment Method → Subscription"） | [订阅页](https://z.ai/subscribe)、[Usage Policy](https://docs.z.ai/devpack/usage-policy.md) |
| 官方 API（用量可见性） | 官方 API | 用量统计在登录后台："You can check your quota consumption progress in Usage Statistics"（`z.ai/manage-apikey/subscription`）；"You can view the number of tokens consumed under each pricing type and the number of tool calls on the Charge Type page"。**未发现公开的只读用量 API 文档**（`docs.z.ai/api-reference` 为按量模型 API，非订阅用量） | [Overview](https://docs.z.ai/devpack/overview.md)、[改版公告](https://docs.z.ai/devpack/notice/usage-revision.md) |
| 更新时间 | 文档或公告 | 法律条款页首显示 "Last Update"（Privacy Policy: September 29, 2025；ToS: April 14, 2026）；公告带 "Publication date"（改版 July 30, 2026；迁移 April 21, 2026；活动 2026-09-03～09-20）；**Overview/FAQ/Team Plan 等 devpack 文档页未见显示更新时间** | 各链接 |

---

## 3. 价格/额度的原始表达方式与归一化歧义

### 3.1 官方原始表述（照录）

- 现行 credits 公式："**Model credit usage = (Input tokens × Input multiplier + Cached Input tokens × Cached Input multiplier + Output tokens × Output multiplier) / 10,000**；MCP tool credit usage = Number of calls × Output multiplier"
- 乘数表（个人/团队一致项）：GLM-5.3 **6.9 / 1.7 / 24**（输入/缓存输入/输出）；GLM-5-Turbo **5.7 / 1.5 / 21**；GLM-4.7 **4.6 / 1.2 / 16**；GLM-4.6V（Vision MCP）**1.2 / 0.3 / 2.7**；Web Search / Web Reader / Zread MCP 输出乘数 **1.2**。团队计划将 GLM-5.3-Flash 列为 **2.3 / 0.56 / 8**（含视觉 MCP）。
- "During off-peak hours, model usage is charged at **50% of the standard credit rate**. Peak hours: Monday to Friday, **14:00–18:00 Singapore Standard Time (UTC+8)**."
- 周配额估算（官方）：Lite **43–87 million tokens/week**、Pro **263–526**、Max **613–1226**（"Assuming all usage is on GLM-5.3 and the cache hit rate is 90.9%"；上限=全非高峰 0.5×，下限=全高峰 1×）。
- Legacy V2（旧 prompt 制原文）："Up to approx. 80/400/1,600 prompts"（5h）与 "approx. 400/2,000/8,000 prompts"（周）；"One prompt refers to one query. Each prompt is estimated to invoke the model **15–20 times**."
- Legacy 乘数表述（改版公告）："GLM-5.3: … **1× during off-peak hours and 3× during peak hours**"；"GLM-5.3-Flash: … **0.4× … 1.2×**"。
- 团队超额："on-demand usage overage… **(Limited-time offer: Overage usage is billed at a 10% discount from the model API list price.)**"
- 官方性价比表述（Team Plan）："By fully leveraging off-peak discounts, users can save up to **92%** compared with using the GLM-5.3 Standard API on a pay-as-you-go basis."

### 3.2 归一化歧义清单

1. **三套额度单位先后并存**：Legacy V1（无周限）、Legacy V2（prompt 计数，1 prompt≈15–20 次模型调用）、现行 credits（token 加权）。跨 Vendor 归一化必须先按"计划版本"分流；同一名称 Lite/Pro/Max 在三个版本下含义完全不同。
2. **credits 不是 token**：credits = token × 模型乘数 ÷ 10,000，且非高峰折半。官方"周 token 估算"是一个区间（43–87M 等），取决于高峰/非高峰占比与缓存命中率假设（90.9%），不能当作固定配额。
3. **"5 小时窗口"口径**：`credit quota resets 5 hours after consumption`（从**消费发生**起算动态刷新），而周配额从**下单时间**起算 7 天周期——两个窗口起点口径不同，与"固定整点窗口"类 Vendor 不可直接对齐。
4. **动态/软性限制**：并发"platform dynamically adjusts"、非高峰"动态提升"；"The above figures are estimates"（Legacy 表）——所有数字都带官方动态调整保留权，归一化时只能当"官方口径上界"。
5. **价格字段的时效断层**：现行官方文档只承诺"from $18/month"；$72/$160 等数字出自 2026-04 迁移公告且标注"for reference only"；credits 制上线（2026-07-30）后 Pro/Max 是否调价，官方静态渠道无法确认。**价格字段缺失时不应与其他 Vendor 强排名**。
6. **MCP 限额口径变更**：Legacy HTML 快照期为"每月 100/1,000/4,000 次 web search+reader"（月度池）；credits 制下 MCP 按次数 × 输出乘数从 credits 池扣——两种口径不能混用（exa 对 `docs.z.ai/devpack/overview` 的新旧两版缓存并存，采集系统须以 URL+日期双维度去重）。

---

## 4. 来源冲突、更新频率与历史变更方式

- **来源间冲突（已记录 3 处）**：
  1. **支持模型清单**：Overview 写 "All plans support GLM-5.3, GLM-5-Turbo and GLM-4.7"，FAQ 写 "All plans support GLM-5.3, GLM-5.3-Flash"，订阅页 meta 列 GLM-5.3/GLM-5.3-Flash/GLM-5.2/GLM-5-Turbo，团队乘数表含 GLM-5.3/GLM-5.3-Flash/GLM-4.6V。综合判断（文档间互证）：当前主力为 GLM-5.3 与 GLM-5.3-Flash，GLM-5.2/GLM-5.1 请求自动路由到 GLM-5.3；GLM-4.7 是否仍可直接调用**无法确认**（文档内部不一致）。
  2. **取消提前期**：Usage Policy 写 "at least **3 days** before the next billing date"，FAQ 与 Subscription Terms 写 "**24 hours**"。
  3. **扣款余额名称**：Usage Policy 写 "bonus balance"，FAQ 写 "Credits balance"（疑同一物，无官方对照表）。
- **更新频率**：devpack 公告页可考的密集变更——2026-04-21 迁移公告、2026-04-30 执行、2026-07-30 credits 改版、2026-09-03 Flash 活动；配合模型发布节奏（GLM-5.3 上线前后），约每月 1–2 次套餐规则调整。
- **历史变更方式**：专用公告 URL（`docs.z.ai/devpack/notice/*`，带 Publication date）+ 旧页面内容整体替换（Overview 已被 credits 制覆盖，旧 prompt 制仅存于改版公告附录与 exa 旧快照）；法律条款用页首 "Last Update" 日期。**无版本化 URL、无 RSS、无 changelog 式逐条定价史**。
- **官方承认的价格调整**：迁移公告原文 "the current plan pricing has already gone through a recent price increase"（2026-04 时点承认近期涨价）； Subscription Terms §3 保留单方调价权，续费按"扣款当日页面显示价"而非订阅时价格。
- **页面是否显示更新时间**：法律条款与公告显示；devpack 文档页不显示 → 额度/乘数表无"最后确认时间"，须由采集方记录抓取时间。
- **无法确认当前有效值的字段**：新 credits 计划 Pro/Max 价格与季/年折扣；GLM-4.7 当前可用性；月度 MCP 次数制是否尚有残余适用面；模型上下文窗口；数值化速率限制。

---

## 5. 中国 Availability（五维度，z.ai 国际版入口）

> 原则声明：区分"官方明确声明"与"无法确认"；**页面无法访问或客户端渲染不作为官方政策限制的证据**。已检索官方渠道：订阅页、devpack 全部文档与公告、ToS（含 §X 出口管制）、Privacy Policy、Subscription Terms、平台 FAQ。ToS/Privacy/Subscription Terms 全文检索未见 "China" 作为限制对象（出口管制条款列举的地区不含中国大陆）。

| 维度 | 状态 | 说明 |
|---|---|---|
| 注册 | 官方明确声明（通用前提）+ 中国维度无法确认 | 官方明确（通用）：需注册 Z.ai Open Platform 账号（邮箱/用户名/密码，或 Google/GitHub 登录），18 岁以下不适用（[Quick Start](https://docs.z.ai/devpack/quick-start.md)、[Privacy Policy §2/§9](https://docs.z.ai/legal-agreement/privacy-policy.md)）。**未见**"禁止/允许中国大陆用户注册"的官方声明，也未见实名认证要求（z.ai 侧）。 |
| 支付 | 官方明确声明（通道）+ 中国维度无法确认 | 官方明确：绑定的第三方支付方式示例为 "**bank card or PayPal**"；信用卡不支持 3DS；支持平台 Credits 抵扣；企业可开 VAT 发票（[Usage Policy](https://docs.z.ai/devpack/usage-policy.md)、[平台 FAQ](https://docs.z.ai/help/faq.md)、[Team Plan](https://docs.z.ai/devpack/teamplan.md)）。**未找到**官方声明的可用卡种国家清单；中国大陆银行卡/支付宝/微信能否支付：无法确认（已核查页面未出现支付宝/微信/Stripe 字样）。 |
| 网络访问 | 无法确认 | 官方未声明服务端点在中国大陆的可达性或封锁。技术事实：API 端点 `api.z.ai`、静态资源 `static.bigmodel.cn`（[订阅页 HTML](https://z.ai/subscribe)）——`static.bigmodel.cn` 为智谱中国 CDN 域名，仅说明基础设施关联，**不构成**可用性声明。 |
| 服务政策 | 官方明确声明（通用条款）+ 中国维度无法确认 | 官方明确（通用）：出口管制禁用地区为伊朗、朝鲜、古巴、克里米亚、顿涅茨克、扎波罗热及各类制裁清单主体（[ToS §X](https://docs.z.ai/legal-agreement/terms-of-use.md)）——未点名中国大陆；用户须遵守包括美/欧在内的适用法律（ToS §III.2）；数据控制者为新加坡实体、数据一般在新处理（[Privacy Policy §1/§8](https://docs.z.ai/legal-agreement/privacy-policy.md)）。除上述外，无对中国大陆的服务提供/不提供声明。 |
| 功能限制 | 无法确认 | 未找到针对中国大陆用户的功能差异化声明。计划内限制均为**账号级**而非地区级：仅限官方支持工具、禁止账号共享/转售、违规风控（限速→冻结→封号）（[Usage Policy](https://docs.z.ai/devpack/usage-policy.md)、[Subscription Terms §4](https://docs.z.ai/legal-agreement/subscription-terms.md)）。模型级地区限制机制：未见类似其他 Vendor 的"模型因地区不可见"官方说明。 |
| （补充）中国大陆用户默认入口 | 部分无法确认 | 智谱为中国厂商，中国大陆用户的产品入口预期为 **bigmodel.cn**（其是否提供同类 Coding Plan、定价与支付方式，本次未完成核查，见 §6）；经 z.ai 国际版订阅对中国大陆用户的可行性：官方无声明，无法确认。 |

---

## 6. bigmodel.cn（中国区）与 z.ai（国际区）差异

**本次采集窗口内未能完成 bigmodel.cn 页面级核查**，以下仅记录已确认事实与未决项：

- 已确认（间接，来自官方页面基础设施）：z.ai 订阅页静态资源托管于 `https://static.bigmodel.cn/z-ai-website/_next/...`，站点图标托管于 `https://z-cdn.chatglm.cn/...`（[订阅页 HTML](https://z.ai/subscribe)，curl 直接核实）——两站共用智谱基础设施。
- 已确认（法律实体分层）：z.ai 服务由新加坡实体 JINGSHENG HENGXING TECHNOLOGY PTE.LTD 运营并作为数据控制者（[ToS](https://docs.z.ai/legal-agreement/terms-of-use.md)、[Privacy Policy](https://docs.z.ai/legal-agreement/privacy-policy.md)）；bigmodel.cn 侧运营主体**未核查**。
- 已确认（文档口径）：官方文档与公告全部以 z.ai 为口径（USD、新加坡时区、PayPal/银行卡、VAT 发票），未出现 bigmodel.cn 的人民币定价、支付宝/微信支付、中国大陆实名认证等描述——**两区入口分开运维是文档层面的直接观感，但具体差异清单需补核查**。
- 未决项（需后续核查，本调研不下结论）：bigmodel.cn 是否在售同名/同构 GLM Coding Plan；人民币定价与折扣结构；实名认证要求；支付宝/微信支付；两区账号与 API Key 是否互通（官方无声明）。

---

## 7. 对 Data Provider / Recommendation Policy 的建议（供后续 ticket 引用）

- **最小来源契约**：`docs.z.ai/devpack/overview.md`（层级+credits+乘数+模型）+ `docs.z.ai/devpack/teamplan.md`（团队）+ `docs.z.ai/devpack/notice/*`（变更）+ `z.ai/subscribe`（价格，仅 meta 可静态核验）。devpack 的 `.md` 后缀可直接抓取原文，优先于 HTML 渲染页。
- **核心字段（缺失应阻止强排名）**：价格（当前仅起价 $18 可静态确认）、币种（USD）、计费周期、5 小时/周双池 credits、乘数表、模型清单。**价格不全或计划版本不明（V1/V2/credits）时应阻止强排名**。
- **失败分类建议**：`OK_MD`（docs.z.ai 的 .md 页）/ `RENDER_DEPENDENT`（z.ai/subscribe 正文）/ `LOGIN_REQUIRED`（manage-apikey 后台三页）/ `STALE_SNAPSHOT`（exa 对同一 URL 缓存多版本，须按内容特征识别 V1/V2/credits 版本，防误采旧价格）。
- **监控点**：`docs.z.ai/devpack/notice/` 目录（公告是新规则的第一发布位）；ToS/Privacy 页首 "Last Update"；订阅页 meta title 中的模型名变化（模型换代会先反映在 title/keywords）。

## 8. 未解决问题

1. 新 credits 计划 Pro/Max 当前官方价与季/年折扣价（需登录 z.ai/subscribe 渲染页或购买流程核验）。
2. bigmodel.cn 中国区 Coding Plan 的在售状态、定价、支付、实名认证要求（本次未核查，需单独补一轮采集）。
3. GLM-4.7 当前是否仍为 Coding Plan 可直调模型（官方文档不一致）。
4. 模型上下文窗口数值（未在 Coding Plan 文档出现；API 模型页未核）。
5. 数值化并发/速率限制（仅登录后台可见）。
6. 中国大陆用户注册/支付 z.ai 的实际可行性（官方无声明，须实机验证，超出本调研范围）。

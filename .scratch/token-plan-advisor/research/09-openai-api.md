# OpenAI API 官方信息来源调研（api-usage Plan Type）

- **采集日期**：2026-09-07
- **调研范围**：OpenAI 公开 API（platform.openai.com 开发者平台 / developers.openai.com API 文档）当前定价、Rate tier、模型族（GPT-5.x、o-series、GPT-6 Astra、Codex API）、Realtime、Embeddings、Images、Audio transcription、Sora 视频、Tools/Built-in tools、Batch、Flex、Fast mode、Data residency、Your Data（数据用于训练政策）。**本调研聚焦 API 形态（api-usage Plan Type）**；ChatGPT 订阅与 Codex CLI/IDE/桌面 App 已在 `06-openai-chatgpt-codex.md` 中覆盖，本文件不重复覆盖。
- **方法**：仅使用 OpenAI 一手官方来源（platform.openai.com/docs、developers.openai.com/api/docs、help.openai.com、openai.com/policies、openai.com/index、learn.chatgpt.com/codex/codex-manual）。本次通过 exa 抓取或 curl 直接访问的页面经核实为官方页面；时效性以 2026-09-07 为准。第三方汇总站、媒体转载未作为事实依据。

## 结论摘要

1. **OpenAI API 定价体系完整**且文档化：主定价页 `developers.openai.com/api/docs/pricing`（含 GPT-6 Astra、GPT-5.6 Sol/Terra/Luna、Codex gpt-5.3-codex、GPT-Realtime 2.1、Sora 2/Sora 2 Pro、Transcription、Tools），每模型详细页 (`platform.openai.com/docs/models/<model>`) 提供 token 价格、上下文窗口、Rate tier 表、功能开关、Modalities。**USD 报价，按 1M tokens 计量**。
2. **Plan 标识**：OpenAI API 的"Plan 标识"不是订阅层级，而是 **Usage tier**（Free / Tier 1–5），依据"已支付金额"自动升级——这是 api-usage 形态的核心字段。Tier 1=$5 paid/$100 monthly cap, Tier 2=$50/$500/mo, Tier 3=$100/$1,000/mo, Tier 4=$250/$5,000/mo, Tier 5=$1,000/$200,000/mo。
3. **Service tier 体系**：Standard / Flex（与 Batch 同价，同步调用，可能 429）/ Fast mode（原 Priority processing，2026-07-30 更名）；Fast mode 在 GPT-5.6 Sol 上"up to 2.5× faster speeds than standard processing at twice the price"；Ultrafast mode（2026-08-13 起限预发布 GPT-5.6 Sol，可达 14× 标准速度）。Fast mode 与 Standard 共享 rate limit；ramp rate 限制：≥1M TPM 且 15 分钟内 >50% TPM 增幅时部分请求降级为 Standard。
4. **数据政策（关键事实）**：API 数据 **自 2023-03-01 起不用于训练**（"As of March 1, 2023, data sent to the OpenAI API is not used to train or improve OpenAI models"），但保留 abuse monitoring logs 30 天；可申请 Zero Data Retention（ZDR）或 Modified Abuse Monitoring（MAM），需要 OpenAI 单独审批；`store=true` 默认开启 30 天应用状态保留（chat/responses）；细粒度 per-endpoint 表见 Your Data 指南。
5. **Data Residency**：2026-03-05 后发布且支持 data residency 的模型收 10% uplift；2026-08-21 起支持按请求选择区域（区域前缀域名 + Global 项目 API key）；非美国区域需要 abuse monitoring 控制审批 + Modified Retention 修订；UAE 区域需额外销售审批。
6. **Batch API**：24h 完成窗口、50% 折扣、所有模型统一**；上限 50,000 请求/batch，200 MB 输入文件；上限 2,000 batches/hour；与同步 API 速率分开计算（更高上限）。Flex（同步，Batch 同价）与 Batch（异步，同价）是"价同机制不同"的双通道。Prompt cache 与 Batch/Flex 可叠加。
7. **Realtime**：原生按 token 计费（Audio $32/$64 input/output per 1M tokens for gpt-realtime 2.1, Text $4/$24）；WebRTC/WebSocket/SIP 三种传输；Session 类型分 voice-agent / translation / transcription；GA 接口（2026-05-12 Realtime Beta 已弃用）。
8. **Codex API**：在 Responses API 中独立定价（gpt-5.3-codex $1.75/$14；gpt-5-codex、gpt-5.1-codex $1.25/$10；gpt-5.2-codex $1.75/$14），与 ChatGPT 订阅路径共享 Codex 品牌但**计费独立**（API key 走 token 定价，ChatGPT Plus/Pro/Business/Edu/Enterprise 走 credits）。Fast mode 在 Codex CLI 同样适用（GPT-5.6/GPT-5.5 速度 1.5×，credits 2.5×；GPT-5.4 速度 1.5×，credits 2×）。
9. **中国 Availability**：OpenAI API 在中国大陆**无官方服务可用性**的明确声明页面（与"是否注册/支付/网络"相关的一手页面在本次抓取范围内未命中"中国大陆"字样）。但 Europe Terms of Use 揭示了 OpenAI Ireland Ltd（EEA/Switzerland）与 OpenAI OpCo LLC（UK）的法人主体——即服务**按地理划分了法人实体**；登录 API 需对应 OpenAI 账号体系。中国大陆具体可用性、注册、支付、网络访问均**无法从本次抓到的一手页面确认**。
10. **文档域迁移**：旧 `platform.openai.com/docs/guides/...` 部分路径（data-residency、data-usage-policies、supported-countries）已被 OpenAI 重定向到 `developers.openai.com` 的 404 页面——这本身是一次值得记录的架构变化。具体内容已并入 `your-data` 主文档（Data controls 页面同时承载原 data-residency 与 per-endpoint 数据保留矩阵）。

---

## 1. 官方入口清单

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 1 | <https://developers.openai.com/api/docs/pricing> | 定价页（主表：GPT-6 Astra、GPT-5.6 家族、Codex、Image、Realtime、Transcription、Tools） | 全球（USD） | 无 | 否 | 正常静态可读 | 是（全文） |
| 2 | <https://developers.openai.com/api/docs/models> | 模型目录页（旗舰模型卡片：GPT-5.5、GPT-5.4、GPT-5.4 mini、GPT-Realtime、Image、Speech、Transcription） | 全球 | 无 | 否 | 正常 | 是 |
| 3 | <https://platform.openai.com/docs/models/o3> | 模型详细页（o3：$2/$8，200K ctx，rate tier 表） | 全球 | 无 | 否 | 正常 | 是 |
| 4 | <https://platform.openai.com/docs/models/o4-mini> | 模型详细页（o4-mini：$1.10/$4.40，200K ctx，rate tier 表） | 全球 | 无 | 否 | 正常 | 是 |
| 5 | <https://platform.openai.com/docs/models/gpt-5-codex> | Codex 模型详细页（gpt-5-codex：$1.25/$10，400K ctx） | 全球 | 无 | 否 | 正常 | 是 |
| 6 | <https://platform.openai.com/docs/models/gpt-5.1-codex> | Codex 模型详细页（gpt-5.1-codex：$1.25/$10，400K ctx） | 全球 | 无 | 否 | 正常 | 是 |
| 7 | <https://platform.openai.com/docs/models/gpt-5.2-codex> | Codex 模型详细页（gpt-5.2-codex：$1.75/$14，400K ctx） | 全球 | 无 | 否 | 正常 | 是 |
| 8 | <https://platform.openai.com/docs/models/gpt-realtime> | Realtime 模型详细页（Text $4/$16, Audio $32/$64） | 全球 | 无 | 否 | 正常 | 是 |
| 9 | <https://platform.openai.com/docs/models/text-embedding-3-small> | Embedding 模型详细页（$0.02/1M） | 全球 | 无 | 否 | 正常 | 是 |
| 10 | <https://platform.openai.com/docs/models/text-embedding-3-large> | Embedding 模型详细页（$0.13/1M） | 全球 | 无 | 否 | 正常 | 是 |
| 11 | <https://platform.openai.com/docs/models/gpt-image-2> | Image 模型详细页（image $30/M, text input $5/M） | 全球 | 无 | 否 | 正常 | 是 |
| 12 | <https://platform.openai.com/docs/guides/rate-limits> | Rate limits 文档（含 Usage tier 资格门槛表） | 全球 | 无 | 否 | 正常；"use-tiers" 子页 exa 超时未抓取，但主文档已含完整 Tier 资格表 | 是（主文档） |
| 13 | <https://platform.openai.com/docs/guides/your-data> | Data controls 文档（含 Data residency + per-endpoint 数据保留矩阵） | 全球 | 无 | 否 | 正常 | 是 |
| 14 | <https://platform.openai.com/docs/guides/batch> | Batch API 文档（24h SLA，50% discount，50000 req/200 MB/batch） | 全球 | 无 | 否 | 正常 | 是 |
| 15 | <https://platform.openai.com/docs/guides/flex-processing> | Flex processing 文档（与 Batch 同价，可能 resource unavailable） | 全球 | 无 | 否 | 正常 | 是 |
| 16 | <https://platform.openai.com/docs/guides/priority-processing> | Priority processing 文档（已重命名为 Fast mode，2026-07-30） | 全球 | 无 | 否 | 正常 | 是 |
| 17 | <https://developers.openai.com/api/docs/guides/realtime> | Realtime 文档（架构：voice-agent / translation / transcription session；WebRTC/WebSocket/SIP） | 全球 | 无 | 否 | 正常 | 是 |
| 18 | <https://developers.openai.com/api/docs/changelog> | Changelog（按月，按条目；含 deprecations 链接） | 全球 | 无 | 否 | 正常 | 是 |
| 19 | <https://developers.openai.com/api/docs/deprecations> | Deprecations 页（模型/接口退役时间表） | 全球 | 无 | 否 | 未直接抓取（仅由 changelog 与 your-data 间接引用） | 否（部分内容经 changelog 核实） |
| 20 | <https://developers.openai.com/codex/codex-manual.md> | Codex 手册（Codex pricing 段：API key vs ChatGPT credits 双通道） | 全球 | 无 | 否 | 正常 markdown | 是 |
| 21 | <https://developers.openai.com/codex/sdk.md> | Codex SDK 文档（TypeScript `@openai/codex-sdk`、Python `openai-codex`） | 全球 | 无 | 否 | 正常 markdown | 是 |
| 22 | <https://openai.com/policies/terms-of-use/> | Europe Terms of Use（OpenAI Ireland Ltd 法人主体；"Business Terms 治理 API"） | 欧洲（EEA/Switzerland/UK） | 无 | 否 | 正常；上次更新 2026-01-16 | 是 |
| 23 | <https://openai.com/policies/row-privacy-policy/> | Privacy Policy（Rest of World） | 全球 | 无 | 否 | 正常；上次更新 2026-02-06 | 是 |
| 24 | <https://help.openai.com/en/articles/8553685-billing-and-payment-faq> | 帮助中心 Billing FAQ | 全球 | 无 | 视图层不需要 | **Cloudflare 反爬验证**（"Enable JavaScript and cookies to continue"），curl 直接访问被拦截 | 否（被 CF 拦截；仅通过 changelog 与 Europe Terms 间接推断） |
| 25 | <https://help.openai.com/en/articles/8868588-best-practices-for-api-key-safety> | API key 安全最佳实践 | 全球 | 无 | 视图层不需要 | 同上，被 CF 拦截 | 否 |
| 26 | <https://help.openai.com/en/articles/9179066-api-organization-settings> | API Organization 设置 | 全球 | 无 | 视图层不需要 | 同上，被 CF 拦截 | 否 |
| 27 | <https://platform.openai.com/docs/guides/data-residency> | Data Residency 独立页 | 全球 | 无 | 否 | **已迁移/重定向到 developers.openai.com 404**——功能并入 `your-data` 主文档 | 否（404；内容已并入 your-data 文档） |
| 28 | <https://platform.openai.com/docs/guides/supported-countries> | 支持国家/地区 | 全球 | 无 | 否 | **已迁移/重定向到 developers.openai.com 404** | 否（404） |
| 29 | <https://platform.openai.com/docs/guides/data-usage-policies> | 数据使用政策独立页 | 全球 | 无 | 否 | **已迁移/重定向到 developers.openai.com 404**——并入 `your-data` | 否（404） |
| 30 | <https://platform.openai.com/docs/guides/usage-policies> | Usage Policies | 全球 | 无 | 否 | **已迁移到 developers.openai.com 404** | 否（404） |
| 31 | <https://platform.openai.com/login> | API Dashboard（含 Settings、Limits、Usage、Costs、Spend limits 等） | 全球 | 需 OpenAI 账号 | **是** | 控制台内，本次未登录抓取 | 否（仅作为官方购买/管理入口） |
| 32 | <https://platform.openai.com/api-keys> | API Key 管理 | 全球 | 需 OpenAI 账号 | **是** | 控制台内 | 否 |

---

## 2. 字段覆盖矩阵

状态标注：公开（页面直接可见）/ 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用。

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开（判断） | API 形态的"Plan"在 OpenAI 用 **Usage Tier** 表达：`Free / Tier 1 / Tier 2 / Tier 3 / Tier 4 / Tier 5`；每模型页头有一张 Rate limits 表，列同一组 tier。**这不是订阅层级**，是 API 消费后自动升级的算力额度档位。同一组织下可创建多个 Project，Project-level 可设 Service tier（Standard/Fast）。订阅层级（Plus/Pro/Business/Edu/Enterprise）是 ChatGPT 消费服务，不归本调研 | [Rate limits 主文档](https://platform.openai.com/docs/guides/rate-limits)、[模型 Rate limits 表](https://platform.openai.com/docs/models/o3) |
| Plan Type | 公开（判断） | **api-usage**（按 token 计费的标准 API 模型）。OpenAI API 的计价单位是 1M tokens（USD），与 Codex 共享品牌但计费分离：API key 路径走 token 价，ChatGPT 计划路径走 credits（已归 `06-openai-chatgpt-codex.md`） | [定价页](https://developers.openai.com/api/docs/pricing)、[Codex Manual](https://developers.openai.com/codex/codex-manual.md) |
| 价格 | 公开 | **GPT-6 Astra**（短上下文）$10/$50 per 1M input/output；（长上下文）$20/$75。**GPT-5.6 Sol**（短）$4/$20、（长）$8/$30（注：2026-08-21 降价前为更高价；促销价至少保持至 2026-11-21）。**GPT-5.6 Terra**（短）$2/$12、（长）$4/$18。**GPT-5.6 Luna**（短）$0.20/$1.20、（长）$0.40/$1.80。**GPT-5.5**（旗舰）$5/$30；**GPT-5.4**（更经济）$2.50/$15；**GPT-5.4 mini** $0.75/$4.50。**o3** $2/$8（cache $0.50）；**o4-mini** $1.10/$4.40（cache $0.275）。**Codex**：`gpt-5.3-codex` $1.75/$14（cache $0.175），`gpt-5-codex` & `gpt-5.1-codex` $1.25/$10（cache $0.125），`gpt-5.2-codex` $1.75/$14（cache $0.175）；Fast mode（API Priority）下 GPT-5.6 价格 2× Standard；Batch API 50% 折扣 | [定价页](https://developers.openai.com/api/docs/pricing)、[GPT-5.6 Sol 降价](https://developers.openai.com/api/docs/changelog)、[各模型页](https://platform.openai.com/docs/models/o3) |
| 币种 | 公开 | USD（页面原文 "Prices per 1M tokens"，未列多币种）；Regional processing 加价 10% 以 USD 计算；非美国区域结算/币种按 billing account 配置（具体货币兑换未在定价页声明） | [定价页](https://developers.openai.com/api/docs/pricing) |
| 计费周期 | 公开 | **Per 1M tokens**（输入/输出/缓存输入/缓存写入分别计费）；**Tools** 按调用计费（Web search $10 / 1k calls、File search tool call $2.50 / 1k calls）；**Containers** 按 20-min 会话（自 2026-06-02 起按分钟计费，5 分钟最低）；**Sora 2/Pro** 按秒计费；**Transcription** 每分钟音频计费；**Usage limits** 按月重置（"approved monthly usage limit for each organization"）；**Batch 24h 完成窗口** | [定价页](https://developers.openai.com/api/docs/pricing)、[Your Data](https://platform.openai.com/docs/guides/your-data)、[Rate limits](https://platform.openai.com/docs/guides/rate-limits)、[Changelog 2026-06-02](https://developers.openai.com/api/docs/changelog) |
| 额度/使用限制 | 文档或公告 | **Usage tier 资格门槛**（按"已支付金额"自动升级 + 月额度上限）：Free "User must be in an allowed geography" $100/月；Tier 1 $5 paid + $100/月；Tier 2 $50 + $500/月；Tier 3 $100 + $1,000/月；Tier 4 $250 + $5,000/月；Tier 5 $1,000 + $200,000/月。"OpenAI sets an approved monthly usage limit for each organization. This is separate from the spend limits that you can configure for an organization or project." 2026-07-22 起组织/项目可设 **hard spend limit**（达上限返回 429）。Batch API 速率另算（更高） | [Rate limits](https://platform.openai.com/docs/guides/rate-limits)、[Changelog 2026-07-22](https://developers.openai.com/api/docs/changelog) |
| 模型与功能 | 公开 | **Frontier**：`GPT-5.5`（旗舰：reasoning+computer use+coding+research；128K max output；1M ctx）；`GPT-5.4`（更经济，1M ctx）；`GPT-5.4 mini`（400K ctx）。**Reasoning**：o3、o4-mini（200K ctx）。**Codex**：`gpt-5.3-codex`（api-usage 路径）、`gpt-5-codex`、`gpt-5.1-codex`、`gpt-5.2-codex`（皆 Responses API only，400K ctx，128K max output）；`codex-mini-latest`（chat path）；`gpt-5.3-codex-spark`（research preview，Pro only）。**Realtime**：`gpt-realtime-2.1`、`gpt-realtime-2.1-mini`（Text/Audio/Image 多模态，32K ctx）；`gpt-realtime-translate`、`gpt-live-transcribe`、`gpt-realtime-whisper`、`gpt-transcribe`、`gpt-4o-transcribe`（2026-08-26 宣布弃用，2027-02-26 关闭）。**Image**：`gpt-image-2`（生成 $30/M image、$5/M text input；编辑 $15/M image、$2.50/M text input）。**Video**：`sora-2` 720p $0.10/s、`sora-2-pro` 720p $0.30/s、1024p $0.50/s、1080p $0.70/s。**Embedding**：`text-embedding-3-small` $0.02、M、`text-embedding-3-large` $0.13/M。**Daybreak Blue/Red**：防御性安全专用模型（gpt-daybreak-blue-latest → gpt-5.6-sol，gpt-daybreak-red-latest → gpt-5.6-cyber），需单独审批 | [Models](https://developers.openai.com/api/docs/models)、[定价页](https://developers.openai.com/api/docs/pricing)、[各模型页](https://platform.openai.com/docs/models/o3)、[Codex Manual](https://developers.openai.com/codex/codex-manual.md)、[Changelog 2026-07-09 / 2026-08-07](https://developers.openai.com/api/docs/changelog) |
| 上下文长度 | 公开 | GPT-5.5/GPT-5.4/GPT-5.4 mini：1M / 1M / 400K tokens（max output 128K）。o3/o4-mini：200K（max output 100K）。Codex (gpt-5-codex / 5.1-codex / 5.2-codex)：400K（max output 128K）。GPT-Realtime：32K（max output 4,096）。GPT-Image-2：未列（按 image 计算）。长上下文阈值普遍为 272K（"long context"，超过后 GPT-5.6 Sol 输入 2×、输出 1.5×） | [Models](https://developers.openai.com/api/docs/models)、[各模型页](https://platform.openai.com/docs/models/o3)、[定价页](https://developers.openai.com/api/docs/pricing) |
| 速率限制 | 公开 | **指标体系**：RPM（requests/min）、RPD（requests/day）、TPM（tokens/min）、IPM（images/min）、audio minutes/min。**每模型 Rate tier 表**（以 o3 / o4-mini / GPT-5-Codex / GPT-Realtime / GPT-Image-2 / Embeddings 为例）：o3 Free=不支持 / Tier 1:500 RPM + 30K TPM + 90K batch queue / Tier 2:5K+450K+1.35M / Tier 3:5K+800K+50M / Tier 4:10K+2M+200M / Tier 5:10K+30M+5B；o4-mini Tier 1:1K+100K+1M / Tier 5:30K+150M+15B；GPT-5-Codex Tier 1:500+500K+1.5M / Tier 5:15K+10M+15B（Tier 5 不同代 Codex 模型 TPM 上限有差异：5.1-Codex Tier 5 TPM=40M）；GPT-Realtime Tier 1:200 RPM + 1K RPD + 40K TPM / Tier 5:20K RPM + 15M TPM；GPT-Image-2 Tier 1:100K TPM + 5 IPM / Tier 5:8M TPM + 250 IPM；Embedding Tier 1:3K RPM + 1M TPM / Tier 5:10K+10M。**Batch API** 与同步 rate limit 分开，单批上限 50K 请求 + 200 MB，batch 创建上限 2,000/hour。**Priority/Fast mode**：与 Standard 共享 rate limit，ramp rate 限制（≥1M TPM 且 15 分钟内 TPM 增幅 >50% 时部分请求降级为 Standard） | [Rate limits](https://platform.openai.com/docs/guides/rate-limits)、[Batch 文档](https://platform.openai.com/docs/guides/batch)、[Priority 文档](https://platform.openai.com/docs/guides/priority-processing)、[模型 Rate tables](https://platform.openai.com/docs/models/o3) |
| 并发 | 文档或公告 | **官方未公布"并发会话/并行连接数"字段**。最接近的是 Batch API 的"queue limit"（按输入 token 数计算的待执行容量）与 Rate limit 本身的 RPM（"hitting the limit on requests per minute"）；Realtime 用 session 表达持续连接，但未给"每账号最大并发 session 数"。Flex 可能返回 429 resource_unavailable；Priority/Fast 有 ramp rate 限制（"may be downgraded to Standard"）。"Some model families have shared rate limits. Any models listed under a 'shared limit' in your organizations limit page share a rate limit between them" | [Rate limits](https://platform.openai.com/docs/guides/rate-limits)、[Flex 文档](https://platform.openai.com/docs/guides/flex-processing)、[Priority 文档](https://platform.openai.com/docs/guides/priority-processing) |
| 隐私/数据处理 | 文档或公告 | **核心事实**："As of March 1, 2023, data sent to the OpenAI API is not used to train or improve OpenAI models (unless you explicitly opt in to share data with us)." **Abuse monitoring logs**：默认保留 30 天（除非法律要求或必要的安全防护延长）；可申请 Zero Data Retention（ZDR）或 Modified Abuse Monitoring（MAM），需 OpenAI 单独审批；ZDR 启用后 `store=true` 强制为 `false`。**Application state**：默认 30 天（chat/responses），可手动/自动删除；background mode 暂存 ~10 分钟；audio output 1 小时以支持多轮。**Image/file inputs**：上传时扫描 CSAM；检测到则保留人工审查（即使启用 ZDR/MAM）。**HIPAA/BAA**：web search 不覆盖；web search 离线模式 (`external_web_access: false`) 仅在 ZDR 项目内可用 BAA。**Data residency**：2026-03-05 后发布且支持 DR 的模型 10% uplift；非美国区域需 abuse monitoring 控制审批 + Modified Retention 修订；UAE 需额外销售审批；2026-08-21 起支持按请求选择区域（前缀域名 + Global 项目 API key）。**/v1/videos** API 不可用 ZDR/MAM；如启用需将项目 retention 设为 None | [Your Data 文档](https://platform.openai.com/docs/guides/your-data) |
| 注册要求 | 文档或公告 | 需 OpenAI 账号 + Organization；通过 platform.openai.com 注册；登录 API Dashboard 创建 Project 与 API Key；Organization 验证（identity verification）由 OpenAI 按账户使用情况触发，未给出明确阈值；信用额度加自动评估（"approved monthly usage limit"）；Webhooks / Workload identity federation / mTLS（2026-08-29 GA）；Terraform provider（2026-07-29 GA）。帮助中心具体细节（account verification、tax form、business verification）被 CF 反爬拦截，未能直接核对 | [Europe ToU](https://openai.com/policies/terms-of-use/)、[Changelog 2026-08-29 / 2026-07-29](https://developers.openai.com/api/docs/changelog)、[Login](https://platform.openai.com/login) |
| 支付方式 | 文档或公告 | **OpenAI Platform 订阅（API credits）通过 API Dashboard 充值**；Credit-based 模式（在 platform.openai.com 设置 billing）；Tier 升级按已支付金额触发。**OpenAI Business 合同**用于 Enterprise 与支持 Data residency / ZDR / MAM 等企业级控制。Europe ToU 提到 "fees will be in U.S. Dollars"，但 API 业务（Business Terms 治理）支付方式以 billing account 设定为准。**具体支持哪些国家/卡种未在抓取范围内命中明确列表**——帮助中心 Billing FAQ 被 CF 拦，无法确认卡种 | [Europe ToU §4](https://openai.com/policies/terms-of-use/)、[Rate limits Usage tier 表](https://platform.openai.com/docs/guides/rate-limits) |
| 地区政策 | 文档或公告 | OpenAI 在 Europe ToU 中明确划分了**两个法人主体**：OpenAI Ireland Ltd（EEA / Switzerland）与 OpenAI OpCo LLC（UK）；其余地区适用 Rest of World Terms（"If you live outside of the EEA, Switzerland, or UK, these Terms of Use apply to you"）；**Business Terms** 治理 ChatGPT Enterprise、APIs 与面向企业/开发者的其他服务。Data residency 区域列表与具体国家清单未在本次抓取的一手页面命中独立清单页（data-residency 旧 URL 已 404 并入 your-data），仅能确认 US 是默认区域 + 多个支持区域 + 区域选择需符合数据保留控制审批 + UAE 需额外销售审批 + non-US 区域需 Modified Retention amendment。"Free tier: User must be in an allowed geography" 是唯一一处直接的"地理准入"门槛表述，**"allowed geography" 的具体国家清单本次未命中官方清单** | [Europe ToU](https://openai.com/policies/terms-of-use/)、[Your Data § Data residency](https://platform.openai.com/docs/guides/your-data) |
| 官方购买链接 | 公开 | **API Dashboard**：<https://platform.openai.com/login>；**Billing/Payments**：<https://platform.openai.com/billing>；**API keys**：<https://platform.openai.com/account/api-keys>；**Settings**：<https://platform.openai.com/settings/organization/security>；**Usage 仪表盘**：<https://platform.openai.com/usage>；**Project 创建与 Spend limits**：<https://platform.openai.com/settings/organization/usage>。**Account auth**：<https://platform.openai.com/login>（已抓取页面文本显示"Sign up or login with an OpenAI account to build with the OpenAI API"）。**没有公开的"按购买入口到下单页"的引导**（与 SaaS 营销页不同），所有操作都在登录后的 Dashboard 内 | [platform.openai.com/billing](https://platform.openai.com/billing)、[pricing](https://platform.openai.com/pricing)、[login](https://platform.openai.com/login) |
| 官方 API（用量可见性） | 官方 API | **Usage API**：`/v1/organization/usage/...`（Changelog 2026-08-04 增加按 API key 维度过滤）；**Costs API**：<https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/costs>；**Admin API Keys**：可在 org 内创建受管 API key；**Rate Limits List**：`/v1/organization/projects/{project_id}/rate_limits`（按 project 查询当前 RPM/TPM）；**Fine-tuning limits**：`GET /v1/fine_tuning/model_limits`（需 API key）；**MCP servers**：第三方服务（"data sent to an MCP server is subject to their data retention policies"）；**OpenAPI 规范**：<https://platform.openai.com/docs/static/api-definition.yaml>（v2.3.0，MIT） | [Changelog 2026-08-04 / 2026-05-26](https://developers.openai.com/api/docs/changelog)、[Rate limits](https://platform.openai.com/docs/guides/rate-limits)、[OpenAPI yaml](https://platform.openai.com/docs/static/api-definition.yaml) |
| 更新时间 | 文档或公告 | **Changelog** 按月组织、每日/周多条；**Models/Endpoints** 未显示页面级 "Last updated"，但 Changelog 内每条标注日期；**Europe ToU** "Updated: January 16, 2026"；**Privacy Policy** "Updated: February 6, 2026"；**Pricing 主页**未显示 "Last updated"；**Models 页面**未显示（依靠 changelog 与快照日期）。**Changelog 是价格变更的首要载体**（GPT-5.6 Sol 降价 2026-08-21、GPT-5.6 Luna/Terra 降价 2026-07-30 等均有 changelog 条目） | [Changelog](https://developers.openai.com/api/docs/changelog)、[Europe ToU 页头](https://openai.com/policies/terms-of-use/) |

---

## 3. 价格/额度的原始表达方式与归一化歧义

### 3.1 官方原始表述（照录）

- **定价主页表头**：`Prices per 1M tokens.` 表列：`Model | Short context: Input | Cached input | Cache writes | Output | Long context: Input | Cached input | Cache writes | Output`。**GPT-6 Astra** 行：`$10.00 | $1.00 | $12.50 | $50.00 | $20.00 | $2.00 | $25.00 | $75.00`。**GPT-5.6 Sol** 行（2026-08-21 降价后）：`$4.00 | $0.40 | $5.00 | $20.00 | $8.00 | $0.80 | $10.00 | $30.00`，注释：`"GPT-5.6 Sol's promotional pricing is available at least through November 21, 2026"`。
- **Realtime/音频模型表**：`gpt-realtime-2.1` Audio `$32.00 | $0.40 | $64.00`；Text `$4.00 | $0.40 | $24.00`；Image `$5.00 | $0.50 | -`。`gpt-realtime-2.1-mini` Audio `$10.00 | $0.30 | $20.00`；Text `$0.60 | $0.06 | $2.40`；Image `$0.80 | $0.08 | -`。
- **Transcription 模型**：`gpt-realtime-transcribe $0.034/minute`、`gpt-live-transcribe $0.017/minute`、`gpt-realtime-whisper $0.017/minute`、`gpt-transcribe $0.0045/minute`、`gpt-4o-transcribe $2.50 input + $10.00 output + $0.006/min estimated`、`gpt-4o-mini-transcribe $1.25 input + $5.00 output + $0.003/min estimated`。
- **Image 生成模型**：`gpt-image-2` Image input $8.00 / cached input $2.00 / output $30.00；Text input $5.00 / cached input $1.25。**编辑**版：Image input $4.00 / cached input $1.00 / output $15.00；Text input $2.50 / cached input $0.625。
- **Video 模型**：`sora-2` 720p $0.10/s；`sora-2-pro` 720p $0.30/s、1024p $0.50/s、1080p $0.70/s。**Video 用 Priority/Batch 减半**（页面表 2，标准 $0.10/s、priority $0.05/s）。
- **Tools 表**：
  - **Web search**：`$10.00 / 1k calls + Search content tokens billed at model rates`（reasoning models 含 GPT-5/o-series preview）；`$25.00 / 1k calls + Search content tokens are free`（non-preview, non-reasoning）。
  - **Containers**（Hosted Shell / Code Interpreter）：`1 GB $0.03, 4 GB $0.12, 16 GB $0.48, 64 GB $1.92 per 20-minute session`；自 2026-06-02 起按分钟计费、5 分钟最低。
  - **File search**：Storage `$0.10 / GB per day (1 GB free)`；Tool call `$2.50 / 1k calls`（仅 Responses API）。
  - **Agent Kit**：ChatKit 文件/图片存储 `$0.10 / GB-day after 1 GB free per account per month`。
- **ChatGPT / Codex 模型（API 计费）**：`chat-latest` $5.00 input + $0.50 cached + $30.00 output；`gpt-5.3-codex` $1.75 input + $0.175 cached + $14.00 output。Codex-Spark 仅 ChatGPT Pro 可用（research preview，credits 计费）。
- **Fast mode 注释**：`For GPT-5.6, GPT-5.5, and GPT-5.4, Fast mode increases model speed by 1.5x. GPT-5.6 and GPT-5.5 consume credits at 2.5x the Standard rate; GPT-5.4 consumes credits at 2x the Standard rate. … GPT-6 Astra Fast mode consumes credits at 2.5x the Standard rate`。
- **Fast mode 长上下文**：`As of today, long-context prompts exceeding 272K tokens can run in Fast mode, delivering speeds up to 2.5× faster than the Standard tier`。
- **Rate limits 资格门槛**：`Free | User must be in an allowed geography | $100 / month`；`Tier 1 | $5 paid | $100 / month`；`Tier 2 | $50 paid | $500 / month`；`Tier 3 | $100 paid | $1,000 / month`；`Tier 4 | $250 paid | $5,000 / month`；`Tier 5 | $1,000 paid | $200,000 / month`。
- **Header-based rate limit 元数据**：`x-ratelimit-limit-requests`、`x-ratelimit-limit-tokens`、`x-ratelimit-remaining-requests`、`x-ratelimit-remaining-tokens`、`x-ratelimit-reset-requests`、`x-ratelimit-reset-tokens`、`x-ratelimit-limit-project-tokens`、`x-ratelimit-remaining-project-tokens`、`x-ratelimit-reset-project-tokens`。

### 3.2 归一化歧义清单

1. **Usage tier ≠ 订阅层级**：OpenAI 用 Usage tier（自动按花费升级的算力档位）替代订阅层级；这与 Gemini 的按 SKU 订阅、Cursor 的按席位订阅、Anthropic 的按 seat API 计划都不同。跨 Vendor 对比时，"Plan 价格"字段对 OpenAI 无意义，**核心字段应是"每模型每 token 价格 + 当前 tier 的 RPM/TPM 上限"**。
2. **三层 Service tier**：Standard / Flex / Fast（原 Priority）三套价格不同（Standard 全价；Flex = Batch 同价 = 0.5×；Fast = 2× Standard），且 Fast 与 Standard 共享 rate limit。"service_tier" 参数可在请求级指定，也可在 Project Settings 设为默认；Flex 可能 429。**归一化必须明确所取 service tier**，否则价格差可达 4×。
3. **Prompt cache 的两层折扣**：缓存输入 (Cached input) 是"读取已缓存内容的价格"（标准价的 0.1×）——这是正常折扣；**缓存写入 (Cache writes)** 是"将内容写入缓存的价格"（高于 Standard 输出），即"写入收费"。Batch/Flex 与 cache 可叠加。模型页有专门的 `Cached input` / `Cache writes` 列。**跨 Vendor 对比时不能只看 input/output 单价**，要分别建模 cache read / cache write。
4. **长上下文阈值**：GPT-5.6 Sol 超过 272K tokens 进入长上下文区间，input 2×、output 1.5×；Fast mode 长上下文可达 2.5×。Codex 各模型长上下文策略单独列。**长上下文是隐性倍数**，需要从上下文窗口表与定价页注释中提取。
5. **Regional processing 10% uplift**：仅 2026-03-05 后发布且支持 DR 的模型；旧模型无加价；UAE 加价叠加销售审批门槛。归一化时若不含区域加价会低估价格。
6. **API key vs ChatGPT credits**：Codex 模型在两种路径下都有"价格"，但单位不同——API 走 token，ChatGPT 走 credits（Fast mode 2.5× GPT-5.6/GPT-5.5，2× GPT-5.4）。**跨路径比较 Codex 价格时必须先归一化单位**。Codex-Spark 仅 ChatGPT Pro 可用、无 API 通道。
7. **Priority → Fast mode 更名（2026-07-30）**：`service_tier: "priority"` 与 `"fast"` 在 API 请求中等价；旧文档 `priority-processing` 仍可访问但被 changelog 标记为 replaced by Fast mode。同一时间线采集中术语可能共存。
8. **Fine-tuning 状态**：定价页明确 "OpenAI is winding down the fine-tuning platform. The platform is no longer accessible to new users, but existing users of the fine-tuning platform will be able to create training jobs for the coming months. All fine-tuned models will remain available for inference until their base models are deprecated."（即"现有用户过渡期 + 已微调模型持续到基模退役"）。**新用户已不能新开 fine-tuning**，归一化时该字段应为"仅存量"状态。
9. **Codex CLI 中的 Fast mode 价格 vs API Priority**：Codex Manual 明确："Fast mode is a ChatGPT credit feature. With an API key, Codex uses API token pricing instead, and ChatGPT credit multipliers don't apply. API Priority processing has its own billing rate; for GPT-5.6, it costs 2x the Standard API token rate."——即 ChatGPT credit 倍数与 API Priority 倍数是**两套独立的 2.5× / 2×**。归一化时要先选定"API 路径"还是"ChatGPT 路径"。
10. **Image / Video 计价单位差异**：Image 按"每张 image"计费（不等于 token），文本输入部分按 token 计费；Sora 按"每秒视频"计费；Transcription 按"每分钟音频"计费。**跨 Vendor 归一化"每 1M tokens"假设不适用**于这些模态，必须单独建字段。
11. **容器计费的"5 分钟最低 + 按分钟"**：自 2026-06-02 起从 20 分钟会话改为按分钟、5 分钟最低，**单价保持不变**。归一化"容器/Shell 价格"字段时要按会话实际时长（5min ~ 20min 区间有平台最低，>20min 按 20min 倍数）测算。
12. **Web search 双价格**：reasoning 模型（含 GPT-5/o-series）的 `web_search_preview` 是 $10/1k calls + content tokens 按模型价；非 reasoning 模型是 $25/1k calls + content tokens free。**两条线不能合并**。

---

## 4. 来源冲突、更新频率与历史变更方式

- **文档域迁移证据**（2026 年内）：以下旧 URL 直接 curl 返回 404（被重定向到 developers.openai.com 的 404 页面）：
  - `https://platform.openai.com/docs/guides/data-residency`
  - `https://platform.openai.com/docs/guides/data-usage-policies`
  - `https://platform.openai.com/docs/guides/supported-countries`
  - `https://platform.openai.com/docs/guides/usage-policies`

  Data residency / data usage policies 的核心内容已并入 `https://platform.openai.com/docs/guides/your-data`（同一份文档承载"数据用于训练 + 数据保留控制 + 区域 + per-endpoint 矩阵"）；但 `supported-countries` 与 `usage-policies` 的独立旧页面在本次抓取范围内无新域对应内容，**内容状态无法确认当前是否仍可通过 `developers.openai.com` 路径访问**。
- **Pricing 页面表头注释作为价格变更的"软载体"**：GPT-5.6 Sol 价格 2026-08-21 由 $5/$25 降到 $4/$20 后，主定价页同步更新；Changelog 同日有条目 "GPT-5.6 Sol now costs $4 per million input tokens and $20 per million output tokens"。**两份载体互洽**，但定价页无 "Last updated" 时间戳，需采集系统记录抓取时间。
- **2026-07-30 重大事件**：
  - `gpt-5.6-luna` -80% 价格；`gpt-5.6-terra` -20% 价格；
  - **Fast mode 取代 Priority processing**："This change is backward compatible: requests tagged priority will automatically use Fast mode"——即旧参数 `"priority"` 自动翻译为 `"fast"`，无须迁移代码；
  - Fast mode 文档路径仍是 `/priority-processing`，但文档头已加 Fast mode 别名（页面正文仍称 "Priority processing"，文本不一致）。
- **2026-08-13 新增**：Ultrafast mode（GPT-5.6 Sol，限预发布客户，14× 标准速度）——尚未进主定价页标准表，仅出现在 changelog。
- **2026-08-21**：Regional processing 可按请求选择（per-request region via prefixed domain）；GPT-5.6 Sol 降价。
- **2026-08-26**：Whisper-1、gpt-4o-transcribe、gpt-4o-mini-transcribe、gpt-4o-transcribe-diarize 宣布弃用，2027-02-26 关闭；Assistants API 当日关闭。
- **2026-08-29**：mTLS 与 X.509 Workload Identity Federation GA。
- **2026-09-01**：`api.openai.com` 支持 IPv6。
- **2026-09-03**：GPT-6 Astra 发布（不支持 `none` reasoning、不支持 `temperature`/`top_p`/`logprobs`；tool calling 需 Responses API；含 misalignment monitoring）。
- **Domain 拆分**：API 文档主域已从 `platform.openai.com/docs/*` 迁到 `developers.openai.com/api/docs/*`；模型详情页（`platform.openai.com/docs/models/<model>`）仍保留作为 legacy 路径；Codex 文档主域迁到 `learn.chatgpt.com/docs/*`，Codex SDK 文档保留在 `developers.openai.com/codex/sdk`。
- **更新频率**：Changelog 每日~多条；定价变更约每月 1-2 次；模型发布节奏约每 1-2 周一次（自 2026-06 至 2026-09 已发布 gpt-5.4/5.4 mini/5.5/5.6 全系、gpt-5.6-cyber、gpt-realtime-2.1/2.1-mini、gpt-transcribe/gpt-live-transcribe、gpt-image-2、gpt-6 astra 等）。
- **历史变更载体**：(1) Changelog 按月按条目；(2) Models 页面快照日期标注（"Sep 30, 2024 knowledge cutoff"、"Jun 01, 2024" 等）；(3) Europe ToU / Privacy Policy "Updated" 日期；(4) Pricing 页面**没有 "Last updated"**，仅靠 changelog 推断。
- **来源之间的小型冲突**：
  - **Priority 文档路径与正文不一致**：URL 仍为 `/priority-processing`，正文仍称 "Priority processing"，但 changelog 与定价页注释已全面使用 "Fast mode" 术语。两者并存反映迁移进行中。
  - **Codex 模型页的快照标注**：GPT-5-Codex 标注 "Sep 30, 2024 knowledge cutoff"，GPT-5.1-Codex 标注相同 "Sep 30, 2024"，GPT-5.2-Codex 标注 "Aug 31, 2025"——同系列日期跨 12 个月，**这是不同 snapshot 的合理差异**，非数据冲突。
  - **`data-residency` 与 `your-data` 内容重复**：`your-data` 文档末尾的 "Data residency controls" 一节包含原独立 data-residency 页的核心要点；无内容丢失，但定位 URL 已失效。
- **无法确认当前有效值的字段**：
  - Fast mode 长上下文价格在 GPT-5.6 Sol 的具体数值（页面说"2.5× faster at twice the price"但 GPT-5.6 长上下文与 Fast mode 叠加的精确数值未给——需从定价页的 Fast mode 行 × 长上下文倍数推算）；
  - Codex-Spark（gpt-5.3-codex-spark）的 API 定价（仅 ChatGPT Pro，API 路径未公开定价）；
  - Ultrafast mode 的具体价格表（仅 changelog 提及，未进标准定价表）；
  - Free tier 在哪些"allowed geographies"开放的具体清单（"User must be in an allowed geography" 表述无清单）；
  - Data Residency 完整可支持区域清单（独立页已 404，仅从 changelog 与 your-data 间接证据推断）；
  - 各地区可用支付方式（帮助中心被 CF 拦截）。

---

## 5. 中国 Availability（五维度）

> 原则声明：本节区分"官方明确声明"与"无法确认"；**页面无法访问、404、Cloudflare 拦截、动态渲染不作为官方政策限制的证据**。本次检索过的官方渠道：platform.openai.com/docs、developers.openai.com/api/docs、openai.com/policies、help.openai.com（CF 拦截部分内容）、learn.chatgpt.com/codex/codex-manual、Europe ToU 全文（含 "China / Chinese / mainland" 关键词未命中）。

| 维度 | 状态 | 说明 |
|---|---|---|
| 注册 | **官方明确（注册要求本身）** + 中国维度无法确认 | 官方明确（通用）：需 OpenAI 账号 + Organization，可经 platform.openai.com 注册；登录 API Dashboard 创建 Project + API Key；"Free tier: User must be in an allowed geography"——这是唯一一处直接的"地理准入"门槛表述，但**未公开"allowed geography"清单**。**未找到**任何官方页面声明中国大陆用户可否完成注册；Free tier 本身"allowed geography"清单未在抓取范围内命中。注：Europe ToU 全文 "China" / "Chinese" / "mainland" 关键词未命中 |
| 支付 | **官方明确（结算/法人架构）** + 中国维度无法确认 | 官方明确（结构）：Europe ToU 公开披露 OpenAI **按地理划分法人实体**——OpenAI Ireland Ltd（EEA/Switzerland）、OpenAI OpCo LLC（UK）；其余地区适用 Rest of World Terms；API 业务由 Business Terms 单独治理（Europe ToU 链接到独立 Business Terms）。**未找到**任何官方页面列明中国大陆可用支付方式；具体支持的卡种/钱包渠道在帮助中心 Billing FAQ 中（`help.openai.com/en/articles/8553685-billing-and-payment-faq`，本次被 CF 反爬验证拦截，无法直接读取） |
| 网络访问 | 无法确认 | 官方未声明中国大陆的网络可达性或封锁。**Changelog 2026-09-01 条目**："Connections to `api.openai.com` can now use IPv6"——IPv6 支持属全球级基础设施升级，不指向国别可达性。**未找到**任何官方页面声明 `api.openai.com` 在中国大陆的连通性 |
| 服务政策 | **官方明确（数据居住政策不含中国大陆特有条款）** + 中国维度无法确认 | 官方明确（结构）：Data residency 提供"按项目配置区域"的能力；非美国区域需 abuse monitoring 控制审批 + Modified Retention 修订；UAE 需额外销售审批。**未找到**任何官方页面将中国大陆列入或排除支持区域。Data residency 的独立旧 URL 已 404，本次未能拿到完整的"可支持区域清单"页面（这部分内容已并入 `your-data` 文档，但具体国家列表仍需登录配置阶段才能在 Dashboard 内呈现） |
| 功能限制 | **官方明确（部分功能在 EU/CH/UK 启用节奏不同；非中国维度）** + 中国维度无法确认 | 官方明确（非中国，但显示"按地区差异化功能"机制存在）：Codex Manual changelog 显示 "Computer History in Europe: Use Computer History in the EEA, Switzerland, and the United Kingdom. It remains off by default for ChatGPT Pro, Business, and Enterprise users on macOS. … Initial availability excludes the European Union, Switzerland, and the United Kingdom"；Fast mode 长上下文在 GPT-5.6 全系已 GA（2026-08-05）；Fast mode 在 GPT-6 Astra "EU data residency" 上**不可用**（"Fast mode is unavailable for GPT-6 Astra with EU data residency"）。**以上说明 OpenAI 的功能差异化按"区域 / 数据居住选项"机制实现**——该机制不直接对中国大陆给出差异化声明，但**意味着若中国大陆未在 Data residency 清单内，相关"区域特定功能"对中国大陆用户自然不可用**。中国大陆用户实际可见功能与本次抓取范围内的一手证据**无法确认** |

补充事实（**已知官方声明，与本调研相关但非中国特有**）：
- Europe ToU "Updated: January 16, 2026"——ToS 周期性更新；
- Privacy Policy "Updated: February 6, 2026"——R.o.W. 版本；
- Data residency：10% uplift（2026-03-05 后发布且支持的模型），US 默认；
- Fine-tuning 平台对新用户已不可访问（仅存量用户过渡期）；
- Assistants API 已于 2026-08-26 关闭；
- DALL·E 与 Realtime Beta 已于 2026-05-12 退役；
- Whisper 系列将于 2027-02-26 关闭。

---

## 6. 对 Data Provider / Recommendation Policy 的建议（供后续 ticket 引用）

- **最小来源契约**：`developers.openai.com/api/docs/pricing`（主定价表 + Tools/Realtime/Image/Video/Transcription）+ `platform.openai.com/docs/guides/rate-limits`（Usage tier + 资格门槛）+ `platform.openai.com/docs/guides/your-data`（数据政策 + Data residency + per-endpoint 矩阵）+ Changelog（价格/模型变更时间线）四类即可覆盖核心字段。所有页面均支持 `.md` 后缀抓取纯文本。
- **核心字段（缺失应阻止强排名）**：
  - **价格**：按模型 + service tier（Standard/Flex/Fast）+ 长上下文标记分别建字段；
  - **Rate tier**：按模型 + tier 等级的 RPM/TPM/RPD/IPM 上限；
  - **Plan type**：必须明确 "api-usage"（不是订阅层级）；
  - **数据政策**：是否用于训练、是否支持 ZDR/MAM、是否支持 Data residency；
  - **Plan 标识 = Usage tier + Project service tier**（不是 Plus/Pro）。
- **失败分类建议**：
  - `OK`（静态页全文）：`/api/docs/pricing`、`/api/docs/models`、模型页、`/docs/guides/rate-limits`、`/docs/guides/your-data`、`/api/docs/changelog`、`/codex/codex-manual.md`；
  - `LOGIN_REQUIRED`：`platform.openai.com/login` 后的 Dashboard / Usage / Costs / Limits / Spend limits；
  - `GONE`（需重定向到新域）：`/docs/guides/data-residency`、`/docs/guides/data-usage-policies`、`/docs/guides/supported-countries`、`/docs/guides/usage-policies` —— Provider 应优先尝试 `developers.openai.com/api/docs/...` 路径；
  - `CF_BLOCKED`：`help.openai.com/en/articles/8553685-billing-and-payment-faq` 等帮助中心页（Cloudflare 拦截 curl，需浏览器渲染或登录）；
  - `API_AVAILABLE`：`/v1/organization/usage/*`、`/v1/fine_tuning/model_limits`、`/v1/organization/projects/{id}/rate_limits`（需 API key 或 Admin Key）。
- **字段优先级提示**：
  - "Tier 自动升级门槛"（$5/$50/$100/$250/$1000）是 OpenAI 特有的算力自动升级机制，对"用户升级路径预测"是高价值信号；
  - "Service tier"（Standard/Flex/Fast/Ultrafast）是 OpenAI 特有的同模型多价机制，对"成本优化建议"是高价值信号；
  - "Regional processing 10% uplift" 仅适用于 2026-03-05 后发布的特定模型，不能普适到所有模型；
  - Codex 双路径（API token vs ChatGPT credits）需独立建模——API 价格归本调研，ChatGPT credits 归 `06-openai-chatgpt-codex.md`；
  - Fast mode 长上下文可达 2.5× faster 但 **Fast 价 + 长上下文价**是双重加成（GPT-5.6 Sol：Fast 2× × 长上下文 2× = 4× 输入）。
- **监控点**：
  - `developers.openai.com/api/docs/changelog`（按月+按日）；
  - `developers.openai.com/api/docs/pricing` 与各 `platform.openai.com/docs/models/<model>`（无时间戳，必须记录抓取日期）；
  - `developers.openai.com/api/docs/deprecations`（未直接抓取，需后续抓取）；
  - `openai.com/policies/`（Europe ToU / Privacy Policy 的 "Updated" 日期）；
  - `learn.chatgpt.com/docs/changelog`（Codex 侧产品更新——与 API 平台不同步）。
- **跨 Vendor 归一化注意**：
  - 不要把 OpenAI "Usage tier" 映射为 Cursor "Plan 层级"；两者语义不同；
  - "Fast mode"（API Priority 2×） ≠ Anthropic "Priority Tier"（Anthropic 是 throughput pool，无加价）；
  - "Batch API 50% 折扣" 与 Anthropic / Google 一致（50%），但 xAI 仅 20%、且仅 4 个模型——跨 Vendor 比较时不能假定 50% 是行业标准。

---

## 7. 未解决问题

1. **中国大陆用户注册/支付的实际可行性**：官方无任何"中国大陆"字样的明确声明；本次抓取范围内帮助中心 Billing FAQ 被 CF 拦截，未能直接确认卡种/币种可用性。
2. **Data Residency 的完整可支持区域清单**：独立页面已 404，具体国家/区域清单在 `your-data` 文档中未集中列出，可能需要登录 Dashboard 才能呈现。
3. **Free tier "allowed geography" 清单**："User must be in an allowed geography" 是唯一一处地理门槛表述，但**未列出 allowed geography 具体国家清单**。
4. **Fast mode 长上下文 + 长上下文阈值叠加的精确价格**：定价页 Fast mode 行未单独列出长上下文区间价格；定价注释"long context >272K, input 2×, output 1.5×"需结合 Fast mode 2× 计算（GPT-5.6 Sol：Fast × long context = 输入 4×、输出 3×，但官方未直接声明此组合）。
5. **Codex-Spark (gpt-5.3-codex-spark) 的 API 路径定价**：官方仅 ChatGPT Pro 渠道提及（research preview），未公开 API 定价。
6. **Ultrafast mode (2026-08-13) 的价格表与适用范围**：changelog 提及但未进标准定价表；适用客户清单需注册表单（`openai.com/form/ultrafast/`）。
7. **优先级页路径仍为 `/priority-processing`、正文仍称 "Priority" 但 changelog 与定价页已使用 "Fast mode"**：术语迁移尚未完全统一，需在数据模型中保留两个别名。
8. **Help center 抓取受 Cloudflare 限制**：Billing FAQ、API key 安全、组织设置三篇核心帮助文档在 curl 直接访问时被 CF 反爬拦截，未能直接核对；这些页面承载了中国维度支付/注册的官方说明候选。
9. **`developers.openai.com/api/docs/deprecations` 未直接抓取**：changelog 引用了它，但本次未单独抓取确认完整弃用时间表。
10. **`platform.openai.com/docs/guides/rate-limits/use-tiers` 子页**：抓取超时（exa），主文档已含 Tier 资格门槛表，但子页是否含更详细的资格/监控说明未知。
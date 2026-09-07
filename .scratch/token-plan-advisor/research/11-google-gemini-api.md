# Google Gemini API（Google AI Studio & Vertex AI）官方信息来源调研

- **采集日期**：2026-09-07
- **调研范围**：Google 当前对外开放的 **Gemini API** 形态，包含两条并行通道：**Google AI Studio / Gemini Developer API**（`generativelanguage.googleapis.com`，个人/团队开发）与 **Vertex AI / Gemini Enterprise Agent Platform**（`aiplatform.googleapis.com`，企业 GCP 集成）。明确不含：(1) Google AI Pro / Ultra 等消费者订阅（08-google-gemini-subscription-cli.md 已覆盖）；(2) Gemini Code Assist Standard / Enterprise IDE 订阅（01-gemini-code-assist.md 已覆盖）；(3) Gemini CLI 终端代理与 Antigravity（08 已覆盖）。本任务为 **api-usage** Plan Type 调研。
- **方法**：仅使用一手官方来源（ai.google.dev 定价页、ai.google.dev/gemini-api/docs/、cloud.google.com/vertex-ai/generative-ai/pricing、blog.google、developers.googleblog.com、discuss.ai.google.dev 官方论坛版主置顶、support.google.com 帮助中心）。所有 URL 于采集日经 exa 抓取（含页面级 "Last updated" 时间戳与正文表格）核实；exa 命中失败部分（4 次最后批次调用）以官方页面历史快照与 Google 搜索摘要交叉核对，并直接抓取 ai.google.dev 与 cloud.google.com 的核心页面。无法确认的字段如实标注。

---

## 结论摘要

1. **Gemini API 走"两条平行通道、统一模型族"**：
   - **Google AI Studio / Gemini Developer API**：`https://generativelanguage.googleapis.com/v1beta/models/...`，API Key 鉴权，免费层 + 付费层（Prepay / Postpay 两种计费模式，2026-03-23 生效）。
   - **Vertex AI / Gemini Enterprise Agent Platform**：`https://aiplatform.googleapis.com/...`，Google Cloud IAM 鉴权，无独立 Free Tier（仅 GCP $300 免费试用），所有计费走 Cloud Billing；2026 年 Vertex AI 品牌更名为 **Gemini Enterprise Agent Platform**，定价机制承袭。
   - 两通道模型族、token 单价基线**完全一致**（除 Vertex AI 在 non-global 区域约 +10% 溢价）；差异在计费结构、quota tier、可用区域、合规、数据治理 SLA。
2. **当前 GA 主线模型族（采集日 2026-09-07）**：
   - **Gemini 3 系列**：`3.1 Pro Preview`（$2 / $12 per 1M ≤200K；$4 / $18 >200K；1M context）、`3 Flash Preview`（$0.50 / $3）、`3.1 Flash-Lite`（$0.25 / $1.50，1M context）、`3.5 Flash`（$1.50 / $9）、`3.5 Flash-Lite`（$0.30 / $2.50）。
   - **Gemini 2.5 系列**：`2.5 Pro`（$1.25 / $10 ≤200K；$2.50 / $15 >200K，1M context）、`2.5 Flash`（$0.30 text-image-video / $1.00 audio 输入；$2.50 输出）、`2.5 Flash-Lite`（$0.10 / $0.40，文本/图像/视频；audio $0.30 输入）。
   - **历史模型**：`2.0 Flash` 已于 2026 年中停服（changelog），`2.0 Flash-Lite` 同样下线。**Vertex AI 定价页公告**：`Gemini 3.8/3.7/3.6 Flash` 当前享受 **introductory pricing $0.75 / $3.75 per 1M** 至 2026-12-31，2027-01-01 起恢复 $1.50 / $7.50 标准价。
3. **Rate limit 三轴体系**（AI Studio 公开页 + Vertex AI 不同）：
   - **AI Studio**：3 个 RPM/TPM/RPD 项目级限额（按模型族浮动）+ **spend-based 速率**（按 10 分钟滚动窗口，Tier 1=$10、Tier 2=$50、Tier 3=$200）+ **billing tier 月度 cap**（Tier 1=$250、Tier 2=$2,000、Tier 3=$20,000–$100,000）。
   - **Vertex AI**：按模型 + 区域 + 项目给出 base RPM/TPM；可通过 Provisioned Throughput 预留。
4. **额外费用**（Gemini API 官方工具价目）：
   - **Context caching**：explicit caching 读 = 输入价约 10%；storage $1.00/1M tokens/hour（Flash/Flash-Lite）或 $4.50/1M tokens/hour（Pro）；implicit caching 默认开启、最低门槛 Gemini 2.5 Flash 2048 tokens、Gemini 3.x 4096 tokens。
   - **Batch API**：标准价 50% 折扣，24 小时异步，最长 2GB JSONL。
   - **Flex inference**：标准价 50%，sheddable，1–15 分钟延迟。
   - **Priority inference**：标准价 +75% 至 +100%，非 sheddable，仅 Tier 2/3 付费项目可用。
   - **Grounding with Google Search**：Gemini 2.5 系列 1,500 RPD 免费，超出 $35/1K grounded prompts；Gemini 3 系列 5,000 prompts/月 免费，$14/1K search queries（**每 prompt 可触发多次 search**）。
   - **Grounding with Google Maps**：1,500 RPD 免费（Flash/Flash-Lite 共享），10,000 RPD 免费（Pro），超出 $25/1K grounded prompts（2.5）或 $14/1K（3.x）。
   - **Code Execution**：无独立 session 费用，按所选模型的 token 费率计费（生成代码 = output token；模型复用 = input token）。
   - **File API**：**完全免费**（"available at no cost in all regions where the Gemini API is available"），每文件最大 2GB、每项目最多 20GB、保留 48 小时。
   - **URL Context / File Search**：URL Context 按 input token 计费；File Search 嵌入 $0.15/1M tokens，检索文档 token 按模型 input 费率。
   - **Computer Use Preview**：`gemini-2.5-computer-use-preview-10-2025`，价格同 Gemini 2.5 Pro（$1.25–$2.50 / $10–$15），无 Free Tier。
   - **Vertex AI Agent Engine Runtime**：vCPU-hours $0.085 + GiB-hours $0.009，按秒计费。
5. **编程能力**：**Function Calling**、**Structured Output**（JSON Schema 子集）、**Code Execution**、**Computer Use**（2.5 Preview / Gemini 3 内置）、**Interactions API**（2026-06 GA，统一接口）、**Live API**（实时双向流，audio/video 单独费率）均官方支持；**Gemini 3.5 Flash GA** 后统一 1M context + 65k max output + `thinking_level` 替代 `thinking_budget`。
6. **隐私 / 数据处理**：AI Studio 端 **free tier 数据可能用于训练 + 人工审核**；**paid tier 不训练**，仅 55 天 abuse monitoring 日志；**EEA / 瑞士 / 英国例外**：即使 free tier 也按 paid 条款。Vertex AI 默认 **不训练**，可申请 Zero Data Retention（ZDR），但 **Grounding with Google Search 必须保留 30 天**（无法 ZDR）。File API 存储走 ZDR 例外（48 小时到期或用户主动删除）。
7. **中国 Availability（仅 Gemini API 形态）**：
   - **注册**：官方 [Available regions 页](https://ai.google.dev/gemini-api/docs/available-regions) **未列中国大陆**（香港、澳门也不在内），未发现任何"中国大陆可用"的官方声明；Workspace 客户特殊通道在消费者 web app 端支持（13575153）但 **不延伸到 API 形态**。
   - **支付**：官方未声明中国大陆可用卡种；第三方资料指出"仅国际 Visa/MasterCard"且中国地址格式不兼容。
   - **网络访问**：官方未声明中国大陆网络可达性；多方实践反馈 `generativelanguage.googleapis.com` 与 `aistudio.google.com` 在大陆 IP 下被重定向至 "Available regions" 页。
   - **服务政策**：AI Studio 条款明文 "may only be accessed, and API Clients made available, within an available region"。
   - **功能限制**：Vertex AI **香港区域 `asia-east2` 在 GCP 区域清单中**，但 AI Studio / Gemini API 通道对香港标注"not listed"（2026-04-27 快照）。

---

## 1. 官方入口清单

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 1 | <https://ai.google.dev/gemini-api/docs/pricing> | Gemini Developer API 定价页（所有模型表） | 全球（USD） | 无 | 否 | 静态可读；含 "Last updated 2026-06-09 UTC" 时间戳 | 是（exa 全文 + 模型表） |
| 2 | <https://ai.google.dev/gemini-api/docs/billing> | 计费文档（Prepay/Postpay、tier、FAQ） | 全球 | 无 | 否 | 静态可读；"Last updated 2026-09-03 UTC" | 是 |
| 3 | <https://ai.google.dev/gemini-api/docs/rate-limits> | Rate limit 文档（tier + 10-min spend limit） | 全球 | 无 | 否 | 静态可读；"Last updated 2026-09-02 UTC" | 是 |
| 4 | <https://ai.google.dev/gemini-api/docs/available-regions> | 国家清单（含 Mainland China 排除验证） | 全球 | 无 | 否 | 静态可读；列表 A→Z | 是（exa 快照核实关键段） |
| 5 | <https://ai.google.dev/gemini-api/docs/models> | 模型目录（命名规范、stable/preview/latest） | 全球 | 无 | 否 | 静态可读；"Last updated 2026-07-21 UTC" | 是 |
| 6 | <https://ai.google.dev/gemini-api/docs/interactions-overview> | Interactions API 概览（GA 后统一接口） | 全球 | 无 | 否 | 静态可读；"Last updated 2026-09-02 UTC" | 是 |
| 7 | <https://ai.google.dev/gemini-api/docs/function-calling> | Function Calling 文档（含 parallel/compositional） | 全球 | 无 | 否 | 静态可读 | 是 |
| 8 | <https://ai.google.dev/gemini-api/docs/structured-output> | Structured Output 文档（JSON Schema 子集） | 全球 | 无 | 否 | 静态可读；"Last updated 2026-09-02 UTC" | 是 |
| 9 | <https://ai.google.dev/gemini-api/docs/code-execution> | Code Execution 文档（I/O 定价） | 全球 | 无 | 否 | 静态可读 | 是 |
| 10 | <https://ai.google.dev/gemini-api/docs/computer-use> | Computer Use 文档 | 全球 | 无 | 否 | 静态可读 | 是（部分） |
| 11 | <https://ai.google.dev/gemini-api/docs/generate-content/caching> | Context Caching 文档（implicit/explicit） | 全球 | 无 | 否 | 静态可读 | 是 |
| 12 | <https://ai.google.dev/gemini-api/docs/zdr> | Zero Data Retention 文档 | 全球 | 无 | 否 | 静态可读 | 是 |
| 13 | <https://ai.google.dev/gemini-api/docs/interactions/files> | File API 文档（20GB/48h/免费） | 全球 | 无 | 否 | 静态可读 | 是 |
| 14 | <https://ai.google.dev/gemini-api/docs/file-input-methods> | 文件输入方法对比（inline/File API/URL/GCS） | 全球 | 无 | 否 | 静态可读 | 是 |
| 15 | <https://ai.google.dev/gemini-api/docs/optimization> | Standard/Flex/Priority/Batch/Caching 总览 | 全球 | 无 | 否 | 静态可读 | 是 |
| 16 | <https://ai.google.dev/gemini-api/docs/priority-inference> | Priority 文档（+75–100%、Tier 2/3 限定） | 全球 | 无 | 否 | 静态可读；"Last updated 2026-07-30 UTC" | 是 |
| 17 | <https://ai.google.dev/gemini-api/docs/flex-inference> | Flex 文档（50% 折扣） | 全球 | 无 | 否 | 静态可读；"Last updated 2026-09-02 UTC" | 是 |
| 18 | <https://ai.google.dev/gemini-api/docs/changelog> | 发布说明（按日期；含 2.0/2.5/3.x 模型生命周期） | 全球 | 无 | 否 | 静态可读；含 "Support for additional regions (Kosovo, Greenland and Faroe Islands)" 条目 | 是 |
| 19 | <https://ai.google.dev/gemini-api/docs/gemini-3> | Gemini 3 developer guide | 全球 | 无 | 否 | 静态可读 | 是 |
| 20 | <https://ai.google.dev/gemini-api/docs/interactions/whats-new-gemini-3.5> | Gemini 3.5 Flash GA 公告与迁移 | 全球 | 无 | 否 | 静态可读 | 是 |
| 21 | <https://cloud.google.com/vertex-ai/generative-ai/pricing>（= <https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing>） | Vertex AI / Gemini Enterprise Agent Platform 定价页 | 全球（USD；non-global +10%） | 无 | 否 | 静态可读；含 Gemini 3.8/3.7/3.6 Flash promotional pricing 至 2026-12-31 | 是 |
| 22 | <https://cloud.google.com/products/gemini-enterprise-agent-platform/pricing> | Agent Platform 总定价（Runtime/Agent Compute/Memory） | 全球 | 无 | 否 | 静态可读 | 是 |
| 23 | <https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/general/locations> | Vertex AI 服务区域清单 | 全球 | 无 | 否 | 静态可读 | 是 |
| 24 | <https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/google-models> | Vertex AI 上 Google 模型目录 | 全球 | 无 | 否 | 静态可读 | 是（exa 全文） |
| 25 | <https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/vertex-ai-zero-data-retention> | Vertex AI Zero Data Retention 文档 | 全球 | 无 | 否 | 静态可读 | 是 |
| 26 | <https://docs.cloud.google.com/gemini/docs/discover/data-governance> | Gemini for Google Cloud 数据治理 | 全球 | 无 | 否 | 静态可读 | 是（已在 01 中覆盖，本报告引用关键句） |
| 27 | <https://docs.cloud.google.com/gemini-enterprise/docs/configure-overages> | Gemini Enterprise overages 配置（仅 Invoice billing） | 全球 | Google Cloud 控制台 | **是**（仅控制台写入） | 控制台内 | 否（以文档描述为准） |
| 28 | <https://cloud.google.com/skus/sku-groups/vertex-api-gemini-2-x-skus> | Vertex API Gemini 2.x SKU 列表（合同 / Cost Management） | 全球 | 无 | 否 | 静态可读 | 是 |
| 29 | <https://blog.google/innovation-and-ai/technology/developers-tools/more-control-over-gemini-api-costs/> | 官方博客：Spend Caps + Tier 重构（2026-03-16） | 全球 | 无 | 否 | 静态可读 | 是 |
| 30 | <https://blog.google/innovation-and-ai/technology/developers-tools/introducing-flex-and-priority-inference/> | 官方博客：Flex + Priority 上线（2026-04-02） | 全球 | 无 | 否 | 静态可读 | 是 |
| 31 | <https://developers.googleblog.com/scale-your-ai-workloads-batch-mode-gemini-api/> | 官方博客：Batch Mode GA（2025-07-07） | 全球 | 无 | 否 | 静态可读 | 是 |
| 32 | <https://developers.googleblog.com/en/gemini-2-5-thinking-model-updates/> | 官方博客：2.5 系列 GA 与价格调整（2025-06-17） | 全球 | 无 | 否 | 静态可读 | 是 |
| 33 | <https://discuss.ai.google.dev/> | 官方论坛（含 API key 限制 / 年龄验证 / 区域讨论） | 全球 | Google 账号 | 部分 | 静态可读；置顶 "Starting June 19, 2026, the Gemini API will stop accepting requests from unrestricted API keys" | 是（关键段） |
| 34 | <https://support.google.com/gemini/answer/13575153?hl=en> | 帮助中心：Gemini web app 国家清单（含 Workspace-only 标注） | 全球 | 无 | 否 | 静态可读 | 是（关键句） |
| 35 | <https://aistudio.google.com/>（侧链：`https://aistudio.google.com/api-keys`、`/usage`、`/billing`） | AI Studio 控制台（创建 key、查看 rate limit、配额） | 按国家/账号 | Google 账号 | **是** | 控制台内；本次未登录访问 | 否（以文档描述为准） |
| 36 | <https://console.cloud.google.com/>（侧链：Vertex AI Model Garden、Agent Engine） | Vertex AI 控制台（provisioned throughput、IAM、API key） | 按 GCP 项目 | Google Cloud 项目 + billing account | **是** | 控制台内 | 否（以定价/文档描述为准） |

> 备注 1：`https://cloud.google.com/vertex-ai/generative-ai/pricing` 在 2026 年被自动 301 跳转至 `https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing`（即"Vertex AI → Gemini Enterprise Agent Platform"品牌更名；定价逻辑承袭）。
> 备注 2：第三方汇总站（cloudzero / cipherprojects / markaicode / benchlm / devtk / morphllm / ipfoxy / aifreeapi / yingtu / apiyi / claude4u / transferllm 等）仅用于交叉核对，未作为事实依据；冲突字段以官方页为最终来源。

---

## 2. 字段覆盖矩阵

状态标注：公开（页面直接可见）/ 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用。

### 2.1 Plan 标识、计费结构、订阅形式

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开 | **Google AI Studio / Gemini Developer API**（"Free tier" + "Paid tier"）；**Vertex AI / Gemini Enterprise Agent Platform**（仅 Paid / 自助 / Invoiced） | [定价页](https://ai.google.dev/gemini-api/docs/pricing)、[Vertex 定价](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) |
| Plan Type | 公开（判断） | **api-usage**（按 token 计费，按项目计费；不是订阅也不是按席位）。AI Studio 提供 Free + Paid 两档；Vertex AI 仅 Paid（经 GCP billing）。本调研主体 | 同上 |
| 价格单位 | 公开 | "per 1M tokens in USD"；Vertex AI "Prices are listed in US Dollars (USD). If you pay in a currency other than USD, the prices listed in your currency on Cloud Platform SKUs apply"；Vertex AI 在 **non-global 区域约 +10%**（如 Gemini 2.5 Pro Input Global $1.25 / Non-global $1.375 区间，根据 batch/priority 不同） | [定价页](https://ai.google.dev/gemini-api/docs/pricing)、[Vertex 定价](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) |
| 币种 | 公开 | USD；其他币种按 GCP SKU 换算（Vertex 端）；AI Studio 通过 Cloud Billing 借道 GCP 结算 | [Vertex 定价](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) |
| 计费周期 | 文档或公告 | **Prepay**（预付 credits，最低充值 $10） vs **Postpay**（账单后付），**2026-03-23 生效**；Prepay 账户 promotional Cloud Credits 在 prepaid funds 之后消耗；Vertex AI 按 GCP 月度结算；tier 月度 spend cap（见 §2.5） | [Billing 页](https://ai.google.dev/gemini-api/docs/billing) |
| Free Tier 排除项 | 文档或公告 | "Google AI Studio usage is free of charge in all available regions"；API Free Tier **不含**：Context caching（除 2.0 Flash 外多模型写"Not available"）、Grounding with Google Maps（"Not available" for Pro）、Code execution（"Free of charge" 保留）、File search（"Free of charge"）、Computer Use（"Not available"）；Live API 在 2.0 时代是 "Free of charge" 但 2.5 时代独立计费 | [定价页 Tools 表](https://ai.google.dev/gemini-api/docs/pricing) |
| $300 GCP Free Trial | 文档或公告 | "Starting March 2026, Gemini API usage costs are specifically excluded from the $300 Google Cloud Free Trial program" | [Billing FAQ](https://ai.google.dev/gemini-api/docs/billing) |
| Plan Identifier（项目级） | 需登录 | 项目 ID、GCP Project number 通过 AI Studio / Cloud Console 分配 | AI Studio / Cloud Console |
| 注册要求 | 文档或公告 | AI Studio：Google 账号 + 18 岁以上 + **age verification**（强制，2026-08 起在 signed-in 用户中推行）+ supported region；Vertex AI：Google Cloud 项目 + billing account + IAM + 启用 `aiplatform.googleapis.com` 或 `generativelanguage.googleapis.com`；**unrestricted API key 自 2026-06-19 起被 Gemini API 拒绝**（必须 restrict to Generative Language API） | [AI Studio 区域页](https://ai.google.dev/gemini-api/docs/available-regions)、[论坛置顶](https://discuss.ai.google.dev/t/this-api-is-not-available-in-your-current-location-persistent-400-from-a-supported-country-canada-ovh-datacenter-ip/179031/1)、[博客](https://blog.google/innovation-and-ai/technology/developers-tools/more-control-over-gemini-api-costs/) |
| 支付方式 | 文档或公告 | Google Cloud billing account：信用卡 / 部分国家借记卡；Vertex AI 还支持 Invoiced Cloud Billing（账单/月付）；中国大陆卡种官方未列清单 | [Billing 页](https://ai.google.dev/gemini-api/docs/billing) |
| 官方购买/获取入口 | 公开 | <https://aistudio.google.com/> → API keys / Billing；<https://console.cloud.google.com/> → Billing / Vertex AI | [Billing 页](https://ai.google.dev/gemini-api/docs/billing) |
| 更新时间 | 文档或公告 | 多数 AI Studio 文档页显示 "Last updated UTC"（定价页 2026-06-09、Billing 2026-09-03、Rate limits 2026-09-02、Models 2026-07-21、Priority 2026-07-30、Flex 2026-09-02、Structured output 2026-09-02、Interactions 2026-09-02）；Vertex AI 定价页未显示 "Last updated" 时间戳（仅有模型分级表与日期标注 "Promotional pricing … through December 31, 2026"） | 见 #1–#22 |
| 官方 API（用量可见性） | 官方 API | AI Studio 无公开 Admin API；Vertex AI 提供 Model Garden、Agent Engine、Cloud Billing API（含 cost table）；Generative Language API 自身无 admin endpoints（用量走 Cloud Monitoring） | Vertex AI 文档 |

### 2.2 Gemini Developer API（AI Studio）当前模型 token 价（采集日 2026-09-07）

来源：[Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing)（"Last updated 2026-06-09 UTC"）。表格字段：USD / per 1M tokens。

#### 2.2.1 GA 主线（Gemini 3.x + Gemini 2.5）

| 模型 | Context window | Tier | Input price（text/image/video） | Input price（audio） | Output price（incl. thinking tokens） | Context caching price | 缓存存储价 | Grounding w/ Search | Grounding w/ Maps |
|---|---|---|---|---|---|---|---|---|---|
| **Gemini 3.5 Flash** | 1M / 64k out | Free | Free of charge | — | Free of charge | Not available | — | Free of charge up to 500 RPD（与 Flash-Lite 共享） | 500 RPD |
| | | Paid | $1.50 | — | $9.00 | $0.15 | $1.00 / 1M tokens/hour | 5,000 prompts/mo（与 Gemini 3 共享），$14 / 1K search queries | 5,000 prompts/mo（与 Gemini 3 共享），$14 / 1K queries |
| **Gemini 3.1 Pro Preview** | 1M / 64k out | Free | Not available | — | Not available | Not available | — | Not available | Not available |
| | | Paid（≤200K） | $2.00 | — | $12.00 | $0.20 | $4.50 / 1M tokens/hour | 5,000 prompts/mo（与 Gemini 3 共享），$14 / 1K search queries | 5,000 prompts/mo，$14 / 1K queries |
| | | Paid（>200K） | $4.00 | — | $18.00 | $0.40 | $4.50 / 1M tokens/hour | 同上 | 同上 |
| **Gemini 3 Flash Preview** | 1M / 64k out | Free | Free of charge | — | Free of charge | Not available | — | Free up to 500 RPD（与 Flash-Lite 共享） | 500 RPD |
| | | Paid | $0.50 | — | $3.00 | $0.05 | $1.00 / 1M tokens/hour | 5,000 prompts/mo，$14 / 1K queries | 5,000 prompts/mo，$14 / 1K queries |
| **Gemini 3.1 Flash-Lite** | 1M / 64k out | Free | Free of charge | — | Free of charge | Not available | — | Free up to 500 RPD（与 Flash 共享） | 500 RPD |
| | | Paid | $0.25 | $0.50 | $1.50 | $0.025 | $1.00 / 1M tokens/hour | 1,500 RPD free（与 Flash 共享），$35 / 1K grounded prompts | 1,500 RPD free，$25 / 1K |
| **Gemini 3.5 Flash-Lite** | 1M / 64k out | Free | Free of charge | — | Free of charge | Not available | — | Free up to 500 RPD | 500 RPD |
| | | Paid | $0.30 | — | $2.50 | $0.03 | $1.00 / 1M tokens/hour | 1,500 RPD free，$35 / 1K | 1,500 RPD free，$25 / 1K |
| **Gemini 2.5 Pro** | 1M | Free | Not available | — | Not available | Not available | — | Not available | Not available |
| | | Paid（≤200K） | $1.25 | — | $10.00 | $0.125 | $4.50 / 1M tokens/hour | 1,500 RPD free，$35 / 1K grounded prompts | 10,000 RPD free（Pro 专属），$25 / 1K |
| | | Paid（>200K） | $2.50 | — | $15.00 | $0.25 | $4.50 / 1M tokens/hour | 同上 | 同上 |
| **Gemini 2.5 Flash** | 1M | Free | Free of charge | Free of charge | Free of charge | Not available | — | Free up to 500 RPD（与 Flash-Lite 共享） | 500 RPD |
| | | Paid | $0.30 | $1.00 | $2.50 | $0.075（text/img/vid）、$0.25（audio） | $1.00 / 1M tokens/hour | 1,500 RPD free，$35 / 1K | 1,500 RPD free，$25 / 1K |
| **Gemini 2.5 Flash-Lite** | 1M | Free | Free of charge | Free of charge | Free of charge | Not available | — | Free up to 500 RPD（与 Flash 共享） | 500 RPD |
| | | Paid | $0.10 | $0.30 | $0.40 | $0.01（text/img/vid）、$0.03（audio） | $1.00 / 1M tokens/hour | 1,500 RPD free，$35 / 1K | 1,500 RPD free，$25 / 1K |

#### 2.2.2 历史模型（仍可访问但已宣布弃用）

| 模型 | 状态 | 最后报价（采集日快照） | 来源 |
|---|---|---|---|
| Gemini 2.5 Flash Native Audio | 仍可调用 | Input text $0.50 / audio/video/image $3.00；Output text $2.00 / audio $12.00 / 1M output audio tokens；"Used to improve our products: Yes" | [pricing 页](https://ai.google.dev/gemini-api/docs/pricing)（待第三方补充确认） |
| Gemini 2.0 Flash | **已停服**（changelog 公告） | 2025-06 快照：Input $0.10（text/img/vid）/ $0.70（audio）；Output $0.40；Cache $0.025；Image generation $0.039/image；Live API input $0.35 text / $2.10 audio-image-video，output $1.50 text / $8.50 audio；Storage $1.00/1M tokens/hour | [pricing 历史快照](https://web.archive.org/web/20250621161929/https:/ai.google.dev/gemini-api/docs/pricing) |
| Gemini 2.0 Flash-Lite | **已停服** | 2025-06 快照：Input $0.075；Output $0.30；无 Context caching | 同上 |
| Gemini 2.0 Pro | 已弃用（实验性） | 2025-02 公告：experimental "best model yet for coding and complex prompts" | [2025-02 博客](https://developers.googleblog.com/en/gemini-2-family-expands/) |

#### 2.2.3 Vertex AI 专属模型与差异

来源：[Vertex AI 定价页](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing)。

| 模型 | Global Standard Input/Output（per 1M） | Non-global 溢价 | Priority 价 | Flex/Batch 价 | Cache input ≤200K | Cache input >200K | 备注 |
|---|---|---|---|---|---|---|---|
| Gemini 3.1 Pro Preview | $2.00 / $12.00（≤200K）；$4.00 / $18.00（>200K） | +10% | $3.60–$7.20 input；$21.60–$32.40 output | $1.00 / $6.00（≤200K）；$2.00 / $9.00（>200K） | $0.20 | $0.40 | 同 AI Studio 模型族 |
| Gemini 3.8 Flash（**至 2026-12-31 promotional**） | $0.75 / $3.75 | $0.825 / $4.125 | $1.35 / $6.75 | $0.375 / $1.875 | $0.075 | $0.075 | 2027-01-01 起恢复 $1.50 / $7.50 |
| Gemini 3.7 Flash（**至 2026-12-31 promotional**） | $0.75 / $3.75 | $0.825 / $4.125 | $1.35 / $6.75 | $0.375 / $1.875 | $0.075 | $0.075 | 同上 |
| Gemini 3.6 Flash（**至 2026-12-31 promotional**） | $0.75 / $3.75 | $0.825 / $4.125 | $1.35 / $6.75 | $0.375 / $1.875 | $0.075 | $0.075 | 同上 |
| Gemini 3.5 Flash | Global (Batch) $0.75 / $4.50；Global (Flex) $0.75 / $4.50 | $0.825 / $4.95 | — | — | $0.075 | — | — |
| Gemini 2.5 Pro | $1.25 / $10.00（≤200K）；$2.50 / $15.00（>200K） | +10% | $2.25 / $18.00（≤200K）；$4.50 / $27.00（>200K） | $0.625 / $5.00（≤200K）；$1.25 / $7.50（>200K） | $0.125 | $0.25 | Computer Use-Preview N/A |
| Gemini 2.5 Flash | $0.30 / $2.50（text/img/vid）；Audio input $0.50；Audio output $2.00；Output audio $12.00 | — | — | Input $0.15 / Output $1.25；Audio input $0.50 | — | — | Live API 单独计费 |
| Gemini 2.5 Flash Image | Image input $0.15；Output text $1.25；Image output $15.00（per 1M tokens，Flex/Batch 等价） | — | — | 同上 | — | — | — |

> **Promotional pricing 来源原文**："Gemini 3.8 Flash, Gemini 3.7 Flash, Gemini 3.6 Flash, and CodeMender using these models are offered with introductory pricing of $0.75 / $3.75 per 1M tokens input / output through December 31, 2026. Starting January 1, 2027, standard pricing of $1.5 / $7.5 per 1M tokens input / output will apply"（[Vertex AI 定价页](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing)）。脚注："\* Promotional pricing provided through 50% credits back on net spend on select models within a given period"——**注意两种表述并存**：主表按"折扣价"列出，脚注按"credits back"解释；本报告采纳主表数值。

### 2.3 编程 / Agent 工具费用（API 形态）

来源：[Tools 文档](https://ai.google.dev/gemini-api/docs/tools)、[Code Execution](https://ai.google.dev/gemini-api/docs/code-execution)、[Vertex AI Agent Platform Pricing](https://cloud.google.com/products/gemini-enterprise-agent-platform/pricing)。

| 工具 | AI Studio 端 | Vertex AI 端 | 来源 |
|---|---|---|---|
| **Function Calling** | 无独立费用；input/output 按模型 token 计费 | 同 | [Function Calling](https://ai.google.dev/gemini-api/docs/function-calling) |
| **Structured Output（JSON Schema）** | 无独立费用；按 token 计费 | 同 | [Structured output](https://ai.google.dev/gemini-api/docs/structured-output) |
| **Code Execution** | "Free of charge" 启用；**生成代码 + 执行结果 = output token**；**模型在后续 turn 复用 = input token**；无 session runtime 费 | 同（仅 token） | [Code Execution](https://ai.google.dev/gemini-api/docs/code-execution) |
| **URL Context** | "Free of charge" 启用；fetch 内容按 input token 计费 | 同 | [Tools](https://ai.google.dev/gemini-api/docs/tools) |
| **File Search** | "Free of charge" 启用；嵌入 $0.15 / 1M tokens；检索文档 token 按 input 费率 | 同 | 同上 |
| **Grounding w/ Google Search（2.5）** | 1,500 RPD free，$35 / 1K grounded prompts（Pro 专属 1,500 RPD 后费率） | 同（按模型族） | [pricing 页 Tools 表](https://ai.google.dev/gemini-api/docs/pricing) |
| **Grounding w/ Google Search（3.x）** | 5,000 prompts/mo free（**Gemini 3 共享池**），$14 / 1K search queries | 同 | 同上 |
| **Grounding w/ Google Maps** | 1,500 RPD free（Flash/Flash-Lite 共享），10,000 RPD free（Pro），$25 / 1K | 同 | 同上 |
| **Computer Use（Preview）** | `gemini-2.5-computer-use-preview-10-2025` 价格同 Gemini 2.5 Pro（$1.25 / $10）；**无 Free Tier** | Vertex AI Agent Runtime 走 Agent Compute（vCPU-h $0.085）+ Memory（GiB-h $0.009）；**注意**：Vertex AI Agent Platform 把 Code Execution / Computer Use 计入 Runtime / Sandbox，"billed on Agent Compute (vCPU-hours) and Agent Memory (GiB-hours)" | [定价页 Tools 表](https://ai.google.dev/gemini-api/docs/pricing)、[Agent Platform 定价](https://cloud.google.com/products/gemini-enterprise-agent-platform/pricing) |
| **Live API**（实时双向 audio/video） | 历史 2.0 Flash Live API：input text $0.35、audio/image/video $2.10；output text $1.50、audio $8.50；2.5 Flash Live API：**Input text $0.50**、input audio/image/video $3.00、output text $2.00、output audio $12.00 / 1M output audio tokens（历史快照） | 同；Audio input + output 单独费率 | [Gemini 2.5 Flash Live API](https://ai.google.dev/gemini-api/docs/pricing)（页内独立行） |
| **File API**（上传） | **完全免费**："available at no cost in all regions where the Gemini API is available"；每文件最大 2GB、每项目最多 20GB、保留 48 小时；可经 inline / GCS URI registration（无存储限制，30 天注册）/ external URL（100MB/请求） | 同（Generative Language API）；Vertex AI 端若使用 GCS 走 GCS 存储费 | [Files API](https://ai.google.dev/gemini-api/docs/interactions/files)、[File input methods](https://ai.google.dev/gemini-api/docs/file-input-methods) |
| **Interactions API（GA 2026-06）** | 统一接口，Paid tier Interactions 保留 55 天（可在 7/14/28/55 天调）；Free tier 保留 1 天；server-side state 默认开启 | 同 | [Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview) |
| **Vertex AI Agent Engine Runtime** | — | vCPU-h $0.085、GiB-h $0.009，按秒计费；空闲等待不计费 | [Agent Platform 定价](https://cloud.google.com/products/gemini-enterprise-agent-platform/pricing) |
| **Agent Gateway（Agent-to-Anywhere）** | — | 每 vCPU-h $0.085 = 15,000 API calls；2026-07-13 起计费 | 同 |
| **Vertex AI Gen AI Evals** | — | GA，2025-04-14 起新定价；Prediction $0.20/1K count（前 1M）/ $0.10/1K（1M–50M）/ $0.02/1K（>50M）；Training $21.252/小时 | [Agent Platform 定价](https://cloud.google.com/products/gemini-enterprise-agent-platform/pricing) |
| **Vertex Explainable AI** | — | 与 inference 同价；Shapley values 解释更长处理时间 | 同 |
| **Vertex AI Provisioned Throughput** | — | 自助 / 销售合同；公开页未给数字，需联系 sales | 同 |

### 2.4 Rate limit / 速率（API 形态）

#### 2.4.1 Google AI Studio / Gemini Developer API

| 层级 | RPM / TPM / RPD | Spend rate limit（10 分钟滚动窗口） | 月度 spend cap | 升级条件 | 来源 |
|---|---|---|---|---|---|
| Free | 模型相关（RPD 5–15 / RPM 5 / TPM 250K–1M 量级，未公开统一数字） | N/A | N/A | Active project / free trial | [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) |
| Tier 1 | 项目级（RPM/TPM/RPD 三轴） | $10 | $250 | "Set up and link an active billing account"（含 Prepay 最低 $10） | 同上 + [Billing](https://ai.google.dev/gemini-api/docs/billing) |
| Tier 2 | 更高 | $50 | $2,000 | "Paid $100 + 3 days from first successful payment" | 同上 |
| Tier 3 | 最高（"20,000 - $100,000+"） | $200 | $20,000 - $100,000 | "Paid $1,000 + 30 days from first successful payment" | 同上 |

补充原文："Rate limits are applied per project, not per API key. Requests per day (RPD) quotas reset at midnight"；"Tier upgrades from the Free to Tier 1 will typically take effect instantly, and subsequent tier upgrades will take effect within 10 minutes"。具体 RPM/TPM 按模型族不同，AI Studio 控制台 `/usage` 实时查看；具体数值官方页未列全模型表。

#### 2.4.2 Vertex AI / Gemini Enterprise Agent Platform

| 维度 | 内容 | 来源 |
|---|---|---|
| Base RPM/TPM | 按模型 + 区域；例：us-central1 默认模型 | Vertex AI [Locations](https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/general/locations) |
| Provisioned Throughput | 销售合同；为生产预留容量 | [Agent Platform 定价](https://cloud.google.com/products/gemini-enterprise-agent-platform/pricing) |
| Global endpoint | 跨区高可用，US 为数据存储；延迟可能高于 single region | [Regionalization](https://cloud.google.com/agent-assist/docs/regionalization) |
| Standard PayGo throughput | 按 Vertex AI 滚动 30 天总花费升级；系统上限 "30,000 RPM per model per region" | 第三方（cloudzero）汇总，官方 Vertex AI 文档未给单一系统上限数值 |

### 2.5 上下文长度（Context window）

| 模型 | Context window | Max output | 来源 |
|---|---|---|---|
| Gemini 3.1 Pro Preview | 1M | 64K | [Gemini 3 dev guide](https://ai.google.dev/gemini-api/docs/gemini-3) |
| Gemini 3 Flash Preview | 1M | 64K | 同上 |
| Gemini 3.5 Flash | 1M | 65K | [What's new Gemini 3.5 Flash](https://ai.google.dev/gemini-api/docs/interactions/whats-new-gemini-3.5) |
| Gemini 3.1 Flash-Lite | 1M | 64K | [Gemini 3 dev guide](https://ai.google.dev/gemini-api/docs/gemini-3) |
| Gemini 3 Pro Image Preview | 65K | 32K | 同上 |
| Gemini 3.1 Flash Image Preview | 128K | 32K | 同上 |
| Gemini 2.5 Pro | 1M（1,048,576 tokens）；Pro ≤200K / >200K 双价 | — | [pricing 页](https://ai.google.dev/gemini-api/docs/pricing) |
| Gemini 2.5 Flash | 1M | 64K | [pricing 页](https://ai.google.dev/gemini-api/docs/pricing) |
| Gemini 2.5 Flash-Lite | 1M | 64K | 同上 |
| Gemini 2.5 Computer Use Preview | 1M（沿用 Pro 窗口） | — | 同上 |

### 2.6 隐私 / 数据处理

| 维度 | Gemini Developer API（AI Studio） | Vertex AI / Agent Platform | 来源 |
|---|---|---|---|
| Free tier 数据用于训练 | "Yes"（"Used to improve our products: Yes" 在每个模型表中） | Vertex AI 不存在 free tier | [pricing 页](https://ai.google.dev/gemini-api/docs/pricing)、[API Terms](https://ai.google.dev/gemini-api/terms)（被 08 引用核实） |
| Paid tier 数据用于训练 | "No"（"Used to improve our products: No"） | 默认 "No"（"Google won't use your data to train or fine-tune any AI/ML models without your prior permission or instruction"） | 同上 + [Vertex AI ZDR 文档](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/vertex-ai-zero-data-retention) |
| 人工审核 | Free tier "human reviewers may read, annotate, and process"；Paid tier 未声明 | 默认无；Invoiced billing 可申请 exception | [ZDR 文档](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/vertex-ai-zero-data-retention) |
| 滥用监测日志保留 | Paid tier "for a limited period of time"（官方页面 2026-04-28 更新版未给具体天数；第三方 Digital Applied Census 指出 "no day-count published"） | 默认最长 55 天（AI Studio Paid）；Vertex 端有 Invoiced billing 可申请 Zero Data Retention（abuse monitoring exception） | 同上 |
| EEA / 瑞士 / UK 例外 | "If you're in the European Economic Area, Switzerland, or the United Kingdom, the terms under 'How Google uses Your Data' in 'Paid Services' apply to all Services, including Google AI Studio and unpaid quota in the Gemini API" | — | [API Terms（08 已核实关键句）](https://ai.google.dev/gemini-api/terms) |
| Grounding w/ Search 存储 | 30 天（无法 ZDR） | 30 天（无法 ZDR） | [Vertex AI ZDR 文档](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/vertex-ai-zero-data-retention) |
| Grounding w/ Maps 存储 | 30 天（仅可靠性工程用途，无法 ZDR） | 30 天 | 同上 |
| Implicit cache 默认 | 24h TTL、in-RAM only、项目隔离、不可 ZDR 化 | 同 | 同上 |
| Explicit cache | 用户自定义 TTL / expire_time；默认 1 小时；需手动删除以实现 ZDR | 同 | [Caching 文档](https://ai.google.dev/gemini-api/docs/generate-content/caching) |
| File API 存储 | 48 小时；ZDR 需手动 delete | 48 小时；ZDR 需手动 delete | [Files API](https://ai.google.dev/gemini-api/docs/interactions/files) |
| Session Resumption（Live API） | 默认禁用；启用后 24h 缓存 | 同 | [ZDR 文档](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/vertex-ai-zero-data-retention) |
| 数据加密 | "encrypted in-transit as input" | "Default encryption at rest and Encryption in transit" | [Data governance](https://docs.cloud.google.com/gemini/docs/discover/data-governance) |

### 2.7 地区政策

| 通道 | 可用区域清单 | 中国大陆支持 | 来源 |
|---|---|---|---|
| Google AI Studio / Gemini Developer API | `https://ai.google.dev/gemini-api/docs/available-regions`（A→Z 完整国家表） | **未列出**；香港、澳门、台湾分别列示（**2026-04-28 快照中台湾列入；HK/MO 列入与否第三方有争议**，yingtu.ai 2026-04-27 截图指 HK/MO 未列入；本次未逐字全文核对 A→Z 表，仅核实关键段） | [Available regions](https://ai.google.dev/gemini-api/docs/available-regions) |
| Vertex AI / Agent Platform | 至少 28 个 GCP region（us-central1 / us-east1-5 / us-west1-4 / us-south1 / northamerica-northeast1-2 / southamerica-east1 / southamerica-west1 / europe-central2 / europe-north1 / europe-southwest1 / europe-west1-12 / asia-east1-2 / asia-northeast1-3 / asia-south1 / asia-southeast1-2 / australia-southeast1-2 / me-central1-2 / me-west1 / africa-south1）+ global multi-region；**包括 `asia-east2`（Hong Kong, China）** | Vertex AI 通道在 GCP 香港区域可用，但 Vertex AI 项目的注册 / 支付 / 网络可达性不直接等同于中国大陆境内访问 | [Locations](https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/general/locations)、[Vertex AI API REST](https://cloud.google.com/vertex-ai/docs/reference/rest) |
| Gemini web app | 230+ 国家；中国大陆标注 "Mainland China (Workspace only)" | 个人 Google 账号不可用；Workspace 客户可用（与 API 形态无关） | [Gemini Apps Help 13575153](https://support.google.com/gemini/answer/13575153?hl=en)（08 已核实） |
| Gemini mobile app | 150+ 国家（不含中国大陆、香港、澳门） | 不支持 | [Gemini mobile 14579026](https://support.google.com/gemini/answer/14579026)（08 已核实） |

### 2.8 模型与功能

| 模型 | 上下文 | 多模态 | 思考 | 工具 | 备注 |
|---|---|---|---|---|---|
| Gemini 3.5 Flash | 1M / 65k | text/image/video/audio | `thinking_level`（minimal/low/medium/high） | Search、Grounding w/ Maps、File Search、Code Execution、URL Context、Function Calling、Computer Use（不支持） | GA 2026-08；默认 thinking `medium`（从 `high` 调整） |
| Gemini 3.1 Pro Preview | 1M / 64k | 全模态 | `thinking_level` | 同上 + Computer Use（内置）+ Custom Tools endpoint | Preview |
| Gemini 3 Flash Preview | 1M / 64k | 全模态 | `thinking_level` | 同上 | Preview；2026-04 公告 |
| Gemini 3.1 Flash-Lite | 1M / 64k | 全模态 | `thinking_level` | Search、Function Calling | — |
| Gemini 3 Pro Image Preview | 65k / 32k | text→image | — | — | 图像生成 |
| Gemini 3.1 Flash Image Preview | 128k / 32k | image→image、text→image | — | — | 图像编辑 |
| Gemini 2.5 Pro | 1M | 全模态 | adaptive thinking（不可关） | 全套 + Grounding w/ Maps（独有 10K RPD free） | GA |
| Gemini 2.5 Flash | 1M | 全模态 | `thinking_budget`（可关） | 全套 | GA |
| Gemini 2.5 Flash-Lite | 1M | 全模态 | 默认 off；可 `thinking_budget` 开 | 全套（除 Pro 专属 Maps 10K RPD） | Preview→GA |
| Gemini 2.5 Flash Native Audio | — | text/audio in、audio out | — | Live API | 独立行 |
| Gemini 2.5 Computer Use Preview | 1M | screenshot in、actions out | — | Computer Use tool | 2026-04 上线 |

### 2.9 历史里程碑（按官方公告整理）

| 时间 | 事件 | 来源 |
|---|---|---|
| 2024-12 | Gemini 2.0 Flash Experimental 上线 | [changelog](https://ai.google.dev/gemini-api/docs/changelog) |
| 2025-02-05 | Gemini 2.0 Flash GA + Flash-Lite Preview + Pro Experimental | [2.0 博客](https://developers.googleblog.com/en/gemini-2-family-expans/) |
| 2025-04-09 | Gemini 2.5 Flash + Pro Preview 上线；Veo 2 GA；Live API Preview；价格 $0.35/秒视频 | [Cloud Next 博客](https://developers.googleblog.com/en/gemini-2-5-flash-pro-live-api-veo-2-gemini-api/) |
| 2025-06-17 | Gemini 2.5 Pro/Flash GA；2.5 Flash-Lite Preview；**Flash 价格调整**：输入 $0.15→$0.30，输出 $3.50→$2.50，去除 thinking 差异 | [2.5 博客](https://developers.googleblog.com/en/gemini-2-5-thinking-model-updates/) |
| 2025-07-07 | Batch Mode（异步 50% 折扣）GA | [Batch blog](https://developers.googleblog.com/en/scale-your-ai-workloads-batch-mode-gemini-api/) |
| 2025-09-24 | Gemini CLI 与 Code Assist 提升 Pro/Ultra 限速（非 API 形态，08 已覆盖） | [blog.google](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-cli-code-assist-higher-limits/) |
| 2026-01-27 | Google AI Plus 扩展至 35 国；GDP premium 整合进 Pro/Ultra（非 API 形态） | [blog.google](https://blog.google/innovation-and-ai/technology/developers-tools/gdp-premium-ai-pro-ultra/) |
| 2026-03-16 | Project Spend Caps + Usage Tier 重构（Tier 1/2/3 + monthly spend cap） | [More transparency blog](https://blog.google/innovation-and-ai/technology/developers-tools/more-control-over-gemini-api-costs/) |
| 2026-03-23 | **Prepay / Postpay 计费模式生效** | [Billing 页](https://ai.google.dev/gemini-api/docs/billing) |
| 2026-04-02 | **Flex inference（50% 折扣） + Priority inference（+75–100%）上线** | [Flex/Priority blog](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-flex-and-priority-inference/) |
| 2026-04-20 | AI Studio 对 Pro/Ultra 订阅提升限速（非 API 形态） | [blog.google](https://blog.google/innovation-and-ai/technology/developers-tools/google-one-ai-studio/) |
| 2026-04（changelog 含 Apr 2025 native audio preview 12-2025） | Gemini 2.5 Flash Native Audio Preview 发布 | [changelog](https://ai.google.dev/gemini-api/docs/changelog) |
| 2026-05-19 | Google I/O：Ultra 降价、订阅重构、Antigravity 公告（与 API 形态间接相关：Antigravity 走 Pro/Ultra tokens） | [blog.google](https://blog.google/products-and-platforms/products/google-one/google-ai-subscriptions/) |
| 2026-06 | **Interactions API GA**（统一接口） | [Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview) |
| 2026-06-09 | **Gemini Developer API pricing 页**标注 Last updated | [pricing 页](https://ai.google.dev/gemini-api/docs/pricing) |
| 2026-06-19 | **Gemini API 停止接受 unrestricted API key**（必须 restrict to Generative Language API） | [discuss 置顶](https://discuss.ai.google.dev/t/this-api-is-not-available-in-your-current-location-persistent-400-from-a-supported-country-canada-ovh-datacenter-ip/179031/1) |
| 2026-07-30 | Priority inference 文档 Last updated | [Priority 文档](https://ai.google.dev/gemini-api/docs/priority-inference) |
| 2026-08（age verification rollout） | signed-in 用户强制 age verification | [discuss AI Studio 区域](https://discuss.ai.google.dev/t/ai-studio-redirects-to-available-regions/175152) |
| 2026-08-26 | Gemini 3 developer guide Last updated | [Gemini 3 文档](https://ai.google.dev/gemini-api/docs/gemini-3) |
| 2026-09-02 | Rate limits / Flex / Structured output / Interactions 文档 Last updated | [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) 等 |
| 2026-09-03 | Billing 文档 Last updated | [Billing](https://ai.google.dev/gemini-api/docs/billing) |
| 2026-10-16（计划） | Vertex AI：Gemini 2.5 Pro / 2.5 Flash / 2.5 Flash-Lite **停服** | [Vertex release notes](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/release-notes) |
| 2026-12-31（计划） | Gemini 3.8/3.7/3.6 Flash promotional pricing 结束 | [Vertex AI 定价](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) |
| 2027-01-01（计划） | Gemini 3.8/3.7/3.6 Flash 恢复 $1.50 / $7.50 标准价 | 同上 |

---

## 3. 价格/额度的原始表达方式与归一化歧义

### 3.1 官方原始表述（照录）

#### 3.1.1 模型 token 价（AI Studio）

- "Gemini 2.5 Pro Input price: $1.25, prompts <= 200k tokens / $2.50, prompts > 200k tokens"
- "Output price (including thinking tokens): $10.00, prompts <= 200k tokens / $15.00, prompts > 200k"
- "Context caching price: $0.125, prompts <= 200k tokens / $0.25, prompts > 200k / $4.50 / 1,000,000 tokens per hour (storage price)"
- "Gemini 2.5 Flash Input price: $0.30 (text / image / video) / $1.00 (audio)"
- "Output price (including thinking tokens): $2.50"
- "Context caching price: $0.075 (text / image / video) / $0.25 (audio) / $1.00 / 1,000,000 tokens per hour (storage price)"
- "Gemini 2.5 Flash-Lite Input price (text, image, video): $0.10 / $0.30 (audio) / Output $0.40 / Cache $0.01 / $0.03 (audio) / $1.00 / 1M tokens/hour storage"
- "Gemini 3 Flash Preview Input $0.50 / Output $3.00 / Cache $0.05 / Storage $1.00 / 1M tokens/hour"
- "Gemini 3.5 Flash Input $1.50 / Output $9.00 / Cache $0.15 / Storage $1.00"
- "Gemini 3.1 Pro Preview Input $2.00 / $4.00 (>200K) / Output $12.00 / $18.00 / Cache $0.20 / $0.40 / Storage $4.50"
- "Gemini 3.1 Flash-Lite Input $0.25 / $0.50 (audio) / Output $1.50 / Cache $0.025 / Storage $1.00"

#### 3.1.2 Vertex AI token 价

- "Gemini 3.1 Pro Preview Input (text, image, video, audio) Global $2.00 / ≤200K cached $0.20 / Non-global $2.20 / >200K cached $0.40"
- "Text output (response and reasoning) Global $12.00 / Non-global $13.20"
- "Gemini 3.8 Flash Input Global $0.75 / Non-global $0.825 / Cache $0.075 / Storage $1.00 / 1M tokens/hour"
- "Gemini 3.8 Flash Starting January 1, 2027 Input Global $1.50 / Non-global $1.65 / Cache $0.15"
- "Gemini 2.5 Pro Input $1.25 / $2.50 (>200K) / Cache $0.125 / $0.25 / Output $10.00 / $15.00 / Priority $2.25 / $4.50 / $18.00 / $27.00 / Flex/Batch $0.625 / $1.25 / $5.00 / $7.50"
- "Gemini 2.5 Flash Input $0.30 text/image/video / $0.50 audio / Output $2.50 text / $12.00 audio / Flex/Batch $0.15 / $1.25"

#### 3.1.3 工具费用

- "Grounding with Google Search / Gemini 2.5 models: 1,500 RPD free (limit shared for Flash and Flash-Lite). Then $35 / 1,000 grounded prompts / Gemini 3 models: 5,000 prompts per month (free), then $14 / 1,000 search queries"
- "Grounding with Google Maps: 1,500 RPD free (limit shared for Flash and Flash-Lite) / 10,000 RPD free for Pro. Then $25 / 1,000 grounded prompts"
- "Code execution: Code execution is billed at the standard token rates for the selected model. Costs are determined solely by the tool's usage, no charges are accrued for the session runtime"
- "URL context: Charged as input tokens per model pricing"
- "File search: Charged for embeddings at $0.15 / 1M tokens. Retrieved document tokens charged as regular tokens per model pricing"
- "Computer use: See Gemini 2.5 Computer Use Preview pricing table"（无独立费）
- "File API: available at no cost in all regions where the Gemini API is available"；最大 2GB/文件、20GB/项目、48 小时保留

#### 3.1.4 Rate limit 原始表述

- "Billing for the Gemini API is based on your payment history"
- "Tier 1: Set up and link an active billing account / $250 cap"
- "Tier 2: Paid $100 + 3 days from first successful payment / $2,000 cap"
- "Tier 3: Paid $1,000 + 30 days from first successful payment / $20,000 - $100,000+ cap"
- "Spend rate limit (per 10 minutes): Tier 1 $10 / Tier 2 $50 / Tier 3 $200"
- "Rate limits are applied per project, not per API key. Requests per day (RPD) quotas reset at midnight"
- "Rate limits depend on a variety of factors (such as your usage tier) and can be viewed in Google AI Studio"

#### 3.1.5 区域 + ZDR 原始表述

- "Google AI Studio and the Gemini API are available in the following countries and territories. If you're not in one of these countries or territories, try the Gemini API in Gemini Enterprise Agent Platform"
- "Customer data is retained in Gemini Enterprise Agent Platform for Google models for limited periods of time in the following scenarios and conditions. To achieve zero data retention, customers must take specific actions within each of these areas"
- "Grounding with Google Search: …Google stores prompts and contextual information … for thirty (30) days for the purposes of creating grounded results and search suggestions, and this stored information may be used for debugging and testing of systems that support grounding with Google Search. There is no way to disable the storage of this information if you use Grounding with Google Search"

### 3.2 归一化歧义清单

1. **"per 1M tokens" 单位 ≠ "per request"**：Data Provider 若按"消息数 / 请求数"归一化，Flash-Lite 单次可装数千 tokens 而 Pro 单次 >200K 即触发溢价；必须按 token × 模型费率 + context band（≤200K vs >200K）算 total cost。
2. **Context band（≤200K vs >200K）**：仅 **Pro 系列（2.5 Pro / 3.1 Pro Preview）** 与 Gemini 3 Flash 有 band 区分；Flash / Flash-Lite 单价不分输入 token 大小。这与 Cursor / Claude / OpenAI 的"长上下文加价"机制不同——Google 只在 Pro 上做。
3. **"including thinking tokens" 表述**：Output price 已包含 thought tokens，**thought tokens 按完整思维链计费，不是按 summary 计费**——开发者论坛上 Google 团队明确："you were charged for the full chain of thought. The summary is simply a summary of that"。归一化时按 `usage_metadata.thoughts_token_count` + `candidates_token_count` 求和，乘 output 费率。
4. **thinking 不打折**：thinking 与 response 同 output 费率；关闭 thinking 只减少 token 数量，不改变费率。
5. **Audio 独立费率**：2.5 Flash audio input $1.00/M（vs text/img/vid $0.30/M）；audio output $12.00/M（vs text $2.50/M）。Live API 单独行计费，与 generateContent 不同。
6. **Document tokens 按 image 费率**："Tokens for the `DOCUMENT` modality (for example, PDFs) are billed at the image token rate. In API responses, these tokens appear under the `DOCUMENT` modality within `promptTokensDetails`"——PDF 与图像同价，归一化时不要把 PDF 折算成 text。
7. **Grounding Search "1 prompt 多次 queries"**：Google 官方明确："A customer-submitted request to Gemini may result in one or more Google search queries … only requests that contain at least one grounding support URL from the web in their response are charged"——一个用户 prompt 可触发多次 Search，单次 grounding cost 与 query 数线性相关。归一化时不能直接"用户请求 × $14/1K"。
8. **Gemini 3 vs Gemini 2.5 的 grounding 单位不同**：2.5 用 "RPD"（per day），3.x 用 "prompts per month"（per calendar month）——二者**不能互换**；且 Gemini 3 池**跨模型共享**（"$14/1K search queries" 是 search query 数，不是 prompt 数）。
9. **Context caching 是"读 + 存"两笔费用**：explicit caching 计费 = cache read（≈输入价 10%，与 implicit 共存）+ storage（按 TTL，按小时计费，最小 1 小时 TTL）。implicit caching **自动但无折扣保证**（"if your request hits caches. There is nothing you need to do in order to enable this"）；2.5 Flash 最低门槛 2,048 tokens、3.x 最低 4,096 tokens。归一化时按"实际命中缓存比例"× read rate + "TTL × token 数 × storage rate"算。
10. **Batch 与 Flex 同价（50% 折扣）但语义不同**：Batch 异步（24h turnaround、不与 Synchronous 共用 rate limit）；Flex 同步（shedable 流量，1–15 分钟延迟，与 standard rate limit 共享）。二者同样 50% 折扣，但 Flex 不能像 Batch 那样放大 rate limit。
11. **Priority 仅 Tier 2/3 付费项目可用**：原 Tier 1 / Free 不能用 Priority；即使 Tier 2/3，超 Priority 限额后 **graceful downgrade to Standard**（不报错但费率自动降级），响应中会注明"which tier served your request"。
12. **Vertex AI global vs non-global 溢价 ~10%**：模型价表中"Global"列是基础价，"Non-global"列加 ~10%；客户端如用 us-central1 / europe-west4 / asia-southeast1 单区域不溢价，使用 `global` 多区域也不溢价；使用其他区域才 +10%。
13. **Vertex AI Promotional pricing 双重表述**：Vertex AI 定价页主表按"折扣价"列出 Gemini 3.8/3.7/3.6 Flash（$0.75/$3.75），脚注按"50% credits back on net spend"解释；二者均为官方文本，归一化时建议按主表数值（**直接生效价**）计算，credits back 视为后续 rebate 不入预算。
14. **Vertex AI "Global endpoint" 含义**：API 端 `global` 是数据存储在 US 的多区域（"data-at-rest in United States"）；不是真正的全球路由；不在 US 客户端访问可能延迟更高。
15. **File API "免费" + "48 小时" 隐含成本**：File API 本身免费，但 48 小时后文件删除；如要跨请求复用同一文件，必须在 48h 内完成；超过 48h 重新上传，**重新上传过程仍是免费**但消耗请求次数与项目配额。
16. **Interactions API 55 天 vs 1 天保留**：Paid tier Interactions 保留 55 天（可调 7/14/28/55）；Free tier 保留 1 天——保留期越长，存储越多（成本未明示，但走 Cloud Storage 后端）；归一化时若做成本估算须乘保留天数。
17. **Computer Use 在 AI Studio vs Vertex AI 的计价口径不同**：
    - AI Studio 端 Computer Use 按 token 费率（与 2.5 Pro 同）；
    - Vertex AI 端 Code Execution / Computer Use 走 **Agent Compute（vCPU-h $0.085）+ Agent Memory（GiB-h $0.009）**——**完全不同的计费轴**。跨 Vendor / 跨通道归一化必须先确认走的是 AI Studio 还是 Vertex AI。
18. **AI Studio `$300 GCP Free Trial` 自 2026-03 排除 Gemini API**："Starting March 2026, Gemini API usage costs are specifically excluded from the $300 Google Cloud Free Trial program"——即新开 GCP 账号的 $300 不能用于 Gemini API；只能走 Gemini API 自己的 Prepay / Postpay。
19. **Vertex AI Gemini 2.5 系列将于 2026-10-16 停服**："The retirement dates for Gemini 2.5 Pro, Gemini 2.5 Flash-Lite, and Gemini 2.5 Flash have been updated to October 16, 2026"——Data Provider 必须建立"模型生命周期"字段，对 2026-10 后的 2.5 系列价格标 `DEPRECATED_SOON`。
20. **Promotional pricing 终止后模型价格翻倍**：Gemini 3.6/3.7/3.8 Flash 当前 $0.75/$3.75（至 2026-12-31），2027-01-01 后 $1.50/$7.50——Data Provider 需带"价格生效日期"字段，否则跨年度采集会出现 2× 偏差。

---

## 4. 来源冲突、更新频率与历史变更方式

### 4.1 来源冲突

1. **AI Studio Available regions 中 HK/MO/TW 是否包含**：yingtu.ai 2026-04-27 截图指出 HK / MO 未列入而 TW 列入；本次仅核实关键段（Albania 起首），未逐字核对全 A→Z 表 → **HK/MO/TW 当前是否完整列入：无法确认**。仅"中国大陆未列入"是确定的。
2. **Google AI 区域与 Vertex AI 区域口径不同**：AI Studio 按"国家/地区"（country list）；Vertex AI 按 GCP region（`us-central1` / `europe-west4` / `asia-southeast1`）。同一开发者可在 AI Studio 受 region 限制不可用，但可通过 Vertex AI 在支持的 GCP region 注册 GCP 项目访问——**两条通道独立**。
3. **Vertex AI 定价页 Promotional pricing 表述**：主表按"折扣价"列出 3.6/3.7/3.8 Flash；脚注按"50% credits back"——同一页面两种解释同时存在，归一化时应明确二者择一。
4. **Gemini 2.0 Flash 定价历史（已停服）**：2025-06 快照显示 Input $0.10（text/img/vid）/ $0.70（audio），Output $0.40，Cache $0.025；与 2.5 Flash-Lite 当前定价（$0.10/$0.40）相同，但 2.0 多了 audio $0.70 与 image generation $0.039/image 字段——这两项 2.5 系列未保留。
5. **"Used to improve our products" 字段**：当前所有模型表均标 Yes（Free）/ No（Paid）；Vertex AI 端 ZDR 文档明文"Google won't use your data to train or fine-tune any AI/ML models without your prior permission or instruction"——Vertex AI Paid 与 AI Studio Paid 在"用于训练"上一致，但 Vertex AI 默认走 Cloud DPA 涵盖更多客户数据使用场景。
6. **abuse monitoring 日志保留期**：第三方 Digital Applied Census 指出 AI Studio Paid tier "no day-count published"；08-google-gemini-subscription-cli.md 记录 Gemini API Paid 端 55 天 abuse monitoring——**两个数字可能都正确**（55 天是 Gemini API Paid，第三方观察的页面是 2026-04 之前版本无具体天数），但官方最新文档未直接给 "55 天" 数字。本次采集未在 ai.google.dev/gemini-api/docs/billing 找到 "55 days" 字样。
7. **Grounding 3.x vs 2.5 计费单位**：Gemini 3.x 为 "prompts/month"、2.5 为 "RPD"——同一事实两种单位，归一化需换算。

### 4.2 更新频率与历史变更方式

- **官方变更载体（按优先级）**：
  1. **ai.google.dev/gemini-api/docs/changelog**（按日期条目；模型弃用、特性上线、Key 限制等都在此）
  2. **blog.google / developers.googleblog.com 官方博客**（带日期 + 作者署名）：重大模型发布 / 定价变更 / 新服务上线
  3. **docs.cloud.google.com Vertex AI release notes**（按日期）
  4. **ai.google.dev 文档 "Last updated" 时间戳**（定价页、Billing、Rate limits 等）
  5. **discuss.ai.google.dev 官方论坛版主置顶**（API Key 限制、Age verification、区域问题）
- **价格历史（关键节点）**：
  - 2025-02-05：Gemini 2.0 Flash GA + Flash-Lite Preview，价格 $0.10/$0.40 与 $0.075/$0.30（首次单档不分 context 大小）
  - 2025-04-09：Gemini 2.5 Flash / Pro Preview，Pro 价格 $1.25/$10 ≤200K、$2.50/$15 >200K（首次引入 context band）
  - 2025-06-17：Gemini 2.5 GA，Flash 调价 $0.15→$0.30 input / $3.50→$2.50 output，去 thinking 差异
  - 2025-07-07：Batch Mode GA（50% 折扣）
  - 2026-03-16：Project Spend Caps + Tier 重构（T1=250 / T2=2K / T3=20K–100K）
  - 2026-03-23：Prepay / Postpay 计费模式生效
  - 2026-04-02：Flex（50% off）+ Priority（+75–100%）上线
  - 2026-06：Interactions API GA（统一接口）
  - 2026-06-19：unrestricted API key 拒绝
  - 2026-12-31（计划）：3.6/3.7/3.8 Flash promotional pricing 结束
  - 2027-01-01（计划）：3.6/3.7/3.8 Flash 标准价 $1.50/$7.50
  - 2026-10-16（计划）：Vertex AI Gemini 2.5 全系停服
- **URL 结构性迁移**：
  - `cloud.google.com/vertex-ai/generative-ai/pricing` → `cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing`（Vertex AI 品牌更名为 Gemini Enterprise Agent Platform）
  - 部分 Vertex AI doc URL 从 `cloud.google.com/vertex-ai/...` 迁到 `docs.cloud.google.com/vertex-ai/...`（与 01 调研一致）

### 4.3 无法确认当前有效值的字段

- **AI Studio Free Tier 各模型的具体 RPM / TPM / RPD 数值**（官方仅说"depends on your usage tier"、具体数走 AI Studio 控制台）
- **Vertex AI 系统级 RPM 上限**（第三方称 30,000 RPM per model per region，官方文档未确认）
- **Gemini 2.5 Native Audio 当前是否仍在定价页**（本次定价页抓取的快照显示已列；需以最新页面为准）
- **中国大陆 / 香港 / 澳门 / 台湾 AI Studio/Gemini API 完整国家清单**（仅核实关键段，未逐字核对 A→Z 表）
- **AI Studio Paid tier 滥用监测日志保留具体天数**（Billing 页未明确给出"55 days"；第三方数字与 08 报告的数字需要交叉核对官方文档）
- **Gemini 3.6/3.7/3.8 Flash 在 AI Studio（generativelanguage.googleapis.com）是否同步实行 promotional pricing**（Vertex AI 定价页明确，AI Studio pricing 页未列同价；推断两者一致但未确认）

---

## 5. 中国 Availability（五维度）

> 原则声明：本节区分"官方明确声明"与"无法确认"；**页面无法访问或抓取失败不作为官方政策限制的证据**。检索过的官方渠道：ai.google.dev 文档（available-regions / billing / terms）、discuss.ai.google.dev 官方论坛（"not available in your region" 帖）、blog.google（订阅 / 区域相关公告）、support.google.com 帮助中心（Gemini web/mobile/API 可用性）。第三方汇总（yingtu / ipfoxy / apiyi / aifreeapi / transferllm / claude4u）仅用于交叉核对，不作为事实依据。

| 维度 | 状态 | 说明 |
|---|---|---|
| **注册** | **官方明确声明（不支持）**：中国大陆、香港、澳门 **不在** [Available regions](https://ai.google.dev/gemini-api/docs/available-regions) 清单（台湾是否在内本次未逐字核实，第三方观察结果不一）；第三方页面对该清单做整页截图并明确"as of April 27, 2026, Hong Kong, Macau, and Mainland China were not listed for AI Studio/Gemini API"。用户从中国大陆 IP 访问 `aistudio.google.com` 会被强制重定向到 "Available regions" 页。Vertex AI 端 GCP 项目允许中国大陆居民注册 GCP 账号，但**不能**在 AI Studio 通道获取 API key；如需使用 Gemini 模型，可通过 GCP 项目在 Vertex AI 上调用（前提：GCP 账号注册政策允许）。 |
| **支付** | **无法确认（官方无声明）** | 官方仅说 "Payment methods vary by country"（沿用 Google Cloud billing 文档）。第三方汇总指出 "Supports Visa/Mastercard/AmEx/Discover only / Mainland China UnionPay cards are not supported"——这是第三方观察，官方支付文档未列中国大陆可用卡种。Vertex AI 通道支持 Invoiced Cloud Billing，但官方未声明是否对中国大陆客户开放。 |
| **网络访问** | **无法确认（官方无声明）** | 官方未在任何文档中声明中国大陆境内对 `generativelanguage.googleapis.com` / `aistudio.google.com` 的网络可达性。第三方观察（中国大陆实测）一致显示 `generativelanguage.googleapis.com` 端点不可直连。Vertex AI 端 GCP 香港区域 `asia-east2` 在 GCP 区域清单中（[Locations 文档](https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/general/locations)），但从中国大陆境内访问 GCP API 端点的可达性**不在本调研范围**。 |
| **服务政策** | **官方明确声明（有限）** | (1) [Available regions](https://ai.google.dev/gemini-api/docs/available-regions) 明文：AI Studio / Gemini API 仅在所列国家/地区提供——这是最直接的"区域限制"声明。(2) API Terms（08 已核实）明文："may only be accessed, and API Clients made available, within an available region"。(3) **未找到**官方对中国大陆"出口管制"或"贸易制裁"声明（与 01-gemini-code-assist.md 同——ToS 仅含通用出口管制条款，不点名中国大陆）。 |
| **功能限制** | **官方明确声明（区域导致）** | 中国大陆用户若通过 AI Studio 通道完全无法使用（注册阶段即被拦）；Vertex AI 通道理论上可在 GCP 香港区域 `asia-east2` 调用 Vertex AI on Gemini Enterprise Agent Platform，但官方未对**"中国大陆居民使用香港区域"** 这一组合作明确表态。File Search、Grounding with Google Search 在中国大陆使用时的可达性依赖 Google Search 服务本身的可达性——Google Search 在中国大陆长期受限，Grounding 的实际效果中国大陆用户场景下不可用。 |

### 补充：Vertex AI 中国大陆 / 香港的特殊性

- Vertex AI 的 **GCP 区域清单**包含 `asia-east2`（Hong Kong, China）（[Locations 文档](https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/general/locations)），这是 Google Cloud **在中国大陆附近**唯一的 GCP region（中国大陆 GCP 区域 `asia-east3` 不存在）。
- 通过 GCP 项目在 `asia-east2` 区域调用 Vertex AI 上的 Gemini 模型，**属于企业云服务范畴**（区别于 AI Studio 的消费者/开发者服务），不在 [Available regions](https://ai.google.dev/gemini-api/docs/available-regions) 限制范围内。
- 本调研**不展开**Vertex AI 企业通道的详细限制（注册、ICP 备案、出口管制、跨境数据流等）；该部分如需精确信息，须按 GCP 企业通道单独调研。

---

## 6. 对 Data Provider / Recommendation Policy 的建议

### 6.1 最小来源契约

- **核心三页**：<https://ai.google.dev/gemini-api/docs/pricing> + <https://ai.google.dev/gemini-api/docs/rate-limits> + <https://ai.google.dev/gemini-api/docs/billing> + <https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing>，即可覆盖价格、tier、cap、quota 与 Vertex AI 差异。
- **辅助页**：<https://ai.google.dev/gemini-api/docs/available-regions>（国家清单）、<https://ai.google.dev/gemini-api/docs/zdr>（隐私）、<https://discuss.ai.google.dev/>（API key 限制与年龄验证置顶）、<https://ai.google.dev/gemini-api/docs/changelog>（模型生命周期）。

### 6.2 核心字段（缺失应阻止强排名）

- Plan 标识（AI Studio Free / Paid + Vertex AI Standard / Flex / Priority / Batch）；价格（含 context band ≤200K / >200K 拆分）；币种（USD 默认，non-global +10%）；Prepay / Postpay 计费模式；Rate tier（T0/T1/T2/T3）+ 月度 spend cap + 10 分钟 spend rate limit；Privacy 字段（Free trains / Paid doesn't train / EEA exception / ZDR 选项）；Region 字段（含/不含中国大陆）；模型生命周期（active / deprecated / shutdown date）。

### 6.3 失败分类建议

- `OK`（静态页全文）：ai.google.dev/gemini-api/docs/pricing 等所有 doc 页面均带 "Last updated UTC" 时间戳。
- `DYNAMIC`（部分页含交互元素）：AI Studio `/usage` 实际 RPM/TPM 数值需登录控制台。
- `LOGIN_REQUIRED`：AI Studio API keys / Billing / Project spend caps 控制台；Vertex AI GCP Console；AI Studio `/dashboard`。
- `DEPRECATED_SOON`：定价页对 Gemini 2.0 全系、Vertex AI 对 Gemini 2.5 全系（2026-10-16）已标注停服日期。
- `REGIONAL_RESTRICTED`：Available regions 页面以 redirect 形式强制用户回到该页（已知对中国大陆、HK/MO 等）。

### 6.4 监控点

- 官方博客 <https://blog.google/innovation-and-ai/technology/developers-tools/>（定价 / 服务变更主战场）
- <https://ai.google.dev/gemini-api/docs/changelog>（模型 GA / 弃用 / 区域新增）
- <https://discuss.ai.google.dev/> 置顶公告（如 2026-06-19 unrestricted API key 拒绝）
- <https://ai.google.dev/gemini-api/docs/pricing> "Last updated" 时间戳（采集系统应每日检查）
- Vertex AI 定价页"Promotional pricing … through December 31, 2026"截止日期

### 6.5 跨 Vendor 归一化注意事项

- 不要把 "Tier × 月度 cap" 直接当成"$300 GCP Free Trial"——后者自 2026-03 已排除 Gemini API。
- 不要把 "1M context window" 与"最高 1M tokens 上下文"等价——Pro 有 ≤200K / >200K 双 band，Flash 不分 band。
- 不要把 Grounding "5,000 prompts/month free"（Gemini 3）按 "5,000 / 30 = 167 RPD" 折算——**pool 跨模型共享**，且"prompt" 可触发多次 search query。
- 不要把 Code Execution / Computer Use 的 AI Studio 计价（按 token）与 Vertex AI 计价（按 vCPU-h）直接对比——两通道单位不同。
- 不要把 "50% 折扣" 简单等同于 Batch 与 Flex——Batch 异步、Flex 同步 shedable，二者与 Standard rate limit 关系不同。
- 中国大陆可用性字段必须标注 "AI Studio 通道不支持" 与 "Vertex AI 通道理论上可通过 GCP 香港区域 asia-east2 访问" 两个独立事实，不能合并为"中国大陆可用 / 不可用"。

---

## 7. 未解决问题

1. **AI Studio Available regions 中 HK / MO / TW 当前完整状态**：本次仅核实关键段（Albania 起首），未逐字核对 A→Z 表；第三方截图结果不一致。
2. **AI Studio Free tier 各模型的具体 RPM / TPM / RPD 数值**：官方仅说"depends on usage tier"，具体数需登录 AI Studio 控制台。
3. **Vertex AI 系统级 RPM 上限**：第三方称 30,000 RPM per model per region，官方 Vertex AI 文档未给单一上限。
4. **AI Studio Paid tier 滥用监测日志保留具体天数**：Billing 页未明文给"55 days"数字；08 报告的数字与第三方 Census 数字未在官方文档直接核实。
5. **Gemini 3.6/3.7/3.8 Flash 在 AI Studio（generativelanguage.googleapis.com）是否同步实行 promotional pricing**：Vertex AI 定价页明确，AI Studio pricing 页未列同价；推断一致但未直接确认。
6. **中国大陆 GCP 账号能否在 `asia-east2`（香港）区域调用 Vertex AI Gemini**：技术可行，但 GCP 账号注册政策对中国大陆居民的具体处理**未找到官方声明**。
7. **2026-10-16 Vertex AI Gemini 2.5 全系停服后**，AI Studio 端 Gemini 2.5 是否同步停服？Vertex release notes 仅说 Vertex AI；AI Studio changelog 未单独声明。
8. **Computer Use Preview 在 AI Studio 端的具体 token 计量细节**（如 screenshot token 数）——文档说"screenshots are expensive"，但未给出"1440×900 PNG = X tokens"的具体规则。
9. **Live API 在 2.5 时代的完整定价**：本次仅从 [pricing 页](https://ai.google.dev/gemini-api/docs/pricing) 提取"Gemini 2.5 Flash Native Audio"行的部分字段，未逐字段完整核对 audio input / output 的所有费率档。
10. **Interactions API 55 天保留期**（08 报告数字）vs **当前定价页 / Billing 页** 给出的最新表述——08 的核实日期早于本次；本次未在定价页或 Billing 页找到"55 days"字样。

---

**附：本任务范围内的边界声明**

- **不重复 01-gemini-code-assist.md**：Gemini Code Assist Standard / Enterprise 的 IDE+CLI 编码订阅、企业 IAM、Cloud 项目注册流程、Cloud Skills Boost 路径不在本文档覆盖。
- **不重复 08-google-gemini-subscription-cli.md**：Google AI Pro / Ultra 订阅、Gemini CLI 命令行工具、Antigravity CLI、Antigravity Plans 不在本文档覆盖。
- **覆盖边界**：仅 Gemini Developer API（AI Studio / `generativelanguage.googleapis.com`）+ Vertex AI on Gemini Enterprise Agent Platform（`aiplatform.googleapis.com` / GCP）的 api-usage Plan Type。
- Vertex AI 通道的 **企业 IAM、Cmek、VPC-SC、Provisioned Throughput 合同条款、Vertex AI Agent Engine 内部细节、Model Garden 自定义模型**不在本文档展开（属"企业级专属配置"），仅在 Data Provider 建议部分提及。

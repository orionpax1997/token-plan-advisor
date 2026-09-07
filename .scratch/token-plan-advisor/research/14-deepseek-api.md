# DeepSeek API 官方信息来源调研（api-usage Plan Type）

- **采集日期**：2026-09-07
- **调研范围**：DeepSeek 公开 API（`platform.deepseek.com` + `api-docs.deepseek.com` + `api.deepseek.com`）当前定价、模型族、并发与速率、Prompt caching（Context Caching on Disk）、Tool Calls / Function Calling、Thinking Mode、Anthropic 兼容 API、Responses API、Files API、Chat Prefix Completion / FIM（Beta）、JSON Output、余额模型、Peak/Off-Peak 峰谷定价、数据政策。覆盖时间跨度：DeepSeek-V3.1（2025-08-21）→ V3.1-Terminus（2025-09-22）→ V3.2-Exp（2025-09-29）→ V3.2（2025-12-01）→ V4 Preview（2026-04-24）→ V4-Flash Public Beta（2026-07-31）→ V4-Pro GA（2026-08-13）→ V4-Flash-Vision-Exp（2026-08-21）。**本调研聚焦 API 形态（api-usage Plan Type）**；DeepSeek Chat 网页/移动 app（`chat.deepseek.com` / `download.deepseek.com/app/`）免费、不属本调研范围。
- **方法**：仅使用一手官方来源（`api-docs.deepseek.com` Docusaurus 文档、`platform.deepseek.com`、`deepseek.com` 官网、`api.deepseek.com` 实时端点、`status.deepseek.com`、`cdn.deepseek.com/policies/` 条款与隐私、`cdn.deepseek.com/api-docs/codex-deepseek-setup-en.sh` 一键配置脚本）。本次通过 curl 直抓与 exa 搜索核实，第三方汇总、媒体转载未作为事实依据；Exa 免费档本日配额有限时仅做定位辅助，最终事实以官方页面为准。无法确认的字段如实标注。

## 结论摘要

1. **当前有效的官方模型（V4 系列）**：`deepseek-v4-flash`（DeepSeek-V4-Flash-0731，public beta）、`deepseek-v4-pro`（DeepSeek-V4-Pro-0813，GA）、`deepseek-v4-flash-vision-exp`（实验性多模态）；两个 legacy 别名 `deepseek-chat` / `deepseek-reasoner` 已于 2026-07-24 15:59 UTC 退役。**1M tokens context / 384K max output** 对所有当前模型统一。三模型均"supports both non-thinking and thinking (default) modes"。
2. **当前有效定价**：API docs 定价页（`/quick_start/pricing`）采用 **Peak/Off-Peak 双价制**（2026-08-16 16:00 UTC 生效），off-peak = ½ × peak。USD per 1M tokens：`deepseek-v4-flash` peak/off-peak = cache hit $0.014/$0.007、cache miss $0.44/$0.22、output $1.32/$0.66；`deepseek-v4-pro` peak/off-peak = cache hit $0.044/$0.022、cache miss $1.32/$0.66、output $3.96/$1.98；`deepseek-v4-flash-vision-exp` 与 V4-Flash 同价。**美元版**（`/quick_start/pricing`，en）与**中文版**（`/zh-cn/quick_start/pricing`）分别以 USD 与 CNY 列示，**人民币表按"元/百万 tokens"**，由余额货币决定结算通道。
3. **Plan Type = api-usage**：DeepSeek API 没有任何月度订阅层级（Free / Plus / Pro），只按 token 即时扣减预充值余额；`/user/balance` 返回 `topped_up_balance` + `granted_balance`（赠送额度优先消耗），支持 `CNY` / `USD` 两种货币。错误码 `402 - Insufficient Balance` 与 `429 - Rate Limit Reached`（429 错误消息官方建议"暂时切换到 OpenAI 等替代 LLM 服务"）佐证 pay-as-you-go 形态。**DeepSeek Chat 网页/移动 app 是独立免费产品**，与 API 余额无关。
4. **API 形态的"额度"字段 = Concurrency Limit**：每个账号 `deepseek-v4-pro` 默认 500、`deepseek-v4-flash` 与 `deepseek-v4-flash-vision-exp` 默认 2500（per-account 计数，无论用哪个 API key）；并发满载返回 429。超额并发需通过 [飞书企业表单](https://trtgsjkv6r.feishu.cn/share/base/form/shrcnda9jNKvhyYr8xb843xLEzc) 申请容量扩展，官方明示"no additional cost for capacity expansion"。
5. **编程相关能力**全部为 API 形态下的功能维度，不另立 Plan：Thinking Mode（`thinking` + `reasoning_effort`，默认 high，支持 low/high/max 三档，OpenAI/Anthropic/Responses 三套参数映射）；Function Calling / Tool Calls（`tools` + `tool_choice`；`strict` Beta 模式需 `base_url=https://api.deepseek.com/beta` 并校验 JSON Schema）；JSON Output（`response_format={"type":"json_object"}`，需在 prompt 含 "json" 字样）；Files API（image upload，`purpose=user_data`，单文件 ≤64 MiB，上传限时 10 分钟，过期时间 1h–30d 可选）；Anthropic 兼容（`base_url=https://api.deepseek.com/anthropic`，自动映射 `claude-opus*` → `deepseek-v4-pro`，`claude-haiku*`/`claude-sonnet*` → `deepseek-v4-flash`）；Responses API（OpenAI 兼容格式，原生支持 Codex）；Chat Prefix Completion / FIM（Beta，需 `base_url=https://api.deepseek.com/beta`，FIM 最大 4K tokens，仅 non-thinking 模式）。**DeepSeek 无独立 Code Interpreter / Web Search / Sandbox 工具**——所有 Tool 调用均需用户自行实现 function execution。
6. **Context Caching on Disk**：默认对所有用户启用、**无需代码改动**——按 prefix 完全匹配命中；命中价 ≈ 1.6% of cache miss；持久化规则：请求边界 + 公共前缀检测 + 固定 token 间隔；不同 prompt 部分必须"完整匹配"前缀单元才能命中（不支持部分前缀）。
7. **中国 Availability**：Hangzhou DeepSeek Artificial Intelligence Co., Ltd. 是 Data Controller；数据"directly collect, process and store your Personal Data in People's Republic of China"；ICP 备案"浙ICP备2023025841号"、"浙B2-20250178"、"浙公网安备33010502011812号"；条款 §1.5 明示"不保证所有地区持续可用，功能可能在不同地区有所差异"；**未在本次抓取的一手页面命中"中国大陆禁止注册/支付"或"海外用户禁止使用"的明确排除声明**——所有官方页面默认服务全球，唯一硬性提示是 Terms §1.5 与 Payment Personal Data 收集条款。
8. **历史价格多次大幅波动**：V3.1 (2025-08-21) 缓存命中 $0.07、缓存未命中 $0.56、输出 $1.68；2025-12-01 V3.2 缓存命中 $0.028、未命中 $0.28、输出 $0.42；2026-04-24 V4 Preview 缓存命中 $0.0028/0.003625、未命中 $0.14/0.435、输出 $0.28/0.87（取消夜间折扣，统一 OFF-PEAK 价）；2026-08-16 16:00 UTC 在 V4 上首次启用 Peak/Off-Peak 双价。完整历史见 [Change Log](https://api-docs.deepseek.com/updates)。

---

## 1. 官方入口清单

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 1 | <https://api-docs.deepseek.com/quick_start/pricing> | API 文档定价页（英文版 USD） | 全球 | 无 | 否 | Docusaurus 静态可读，含完整 OFF-PEAK / PEAK 双价表 | 是（curl 全文） |
| 2 | <https://api-docs.deepseek.com/zh-cn/quick_start/pricing> | API 文档定价页（中文版 CNY） | 全球 | 无 | 否 | 静态可读，人民币元/百万 tokens | 是（curl 全文） |
| 3 | <https://api-docs.deepseek.com/quick_start/pricing-details-usd> | API 文档定价页（独立 URL，USD 重定向） | 全球 | 无 | 否 | 静态可读 | 是（curl 全文） |
| 4 | <https://www.deepseek.com/en/platform/> | 产品页 + 价格摘要（营销页，OFF-PEAK 单价） | 全球 | 无 | 否 | Next.js 客户端渲染；React Flight payload 嵌入 `ds-text-price` 节点，curl 可直接读到 6 个数字（V4-Flash/Pro 的 cache hit/miss/output 各 3 项）；页面文案"Prices may change. For details, see the Pricing" | 是（curl 全文 + 提取 ds-text-price） |
| 5 | <https://www.deepseek.com/platform/> | 产品页 + 价格摘要（中文版营销页） | 全球 | 无 | 否 | Next.js 客户端渲染；占位文案"platformPriceInputCacheHit":"输入（缓存命中）"存在，但**实际价格未渲染到 DOM**（ds-text-price 节点为零）；页面文案"根据 token 数进行计量计费，预计7月中旬开始采用峰谷定价策略"（V3 时代遗留文案，与实际定价页/英文页时点不一致） | 是（curl 全文；价格数字未渲染） |
| 6 | <https://api-docs.deepseek.com/> | API 文档首页（Your First API Call） | 全球 | 无 | 否 | Docusaurus 静态可读；列出三个 model 名 `deepseek-v4-flash` / `deepseek-v4-pro` / `deepseek-v4-flash-vision-exp` | 是 |
| 7 | <https://api-docs.deepseek.com/quick_start/token_usage> | API 文档 Token 用量 | 全球 | 无 | 否 | 静态可读；包含离线 tokenizer 下载链接 | 是 |
| 8 | <https://api-docs.deepseek.com/quick_start/rate_limit> | API 文档 Rate Limit & Isolation | 全球 | 无 | 否 | 静态可读；含并发限制表 + `user_id` 隔离机制 + 容量扩展飞书表单 | 是（curl 全文） |
| 9 | <https://api-docs.deepseek.com/quick_start/error_codes> | API 文档错误码 | 全球 | 无 | 否 | 静态可读；429 错误消息含"temporarily switch to OpenAI"提示 | 是 |
| 10 | <https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code> | API 文档 Claude Code 集成 | 全球 | 无 | 否 | 静态可读；含 Linux/Mac/Windows 环境变量配置 | 是 |
| 11 | <https://api-docs.deepseek.com/quick_start/agent_integrations/codex> | API 文档 Codex 集成 | 全球 | 无 | 否 | 静态可读；含一键安装 bash 脚本 + models.json schema | 是 |
| 12 | <https://api-docs.deepseek.com/guides/coding_agents> | API 文档 AI Coding Tools 集成（Claude Code/OpenCode/OpenClaw） | 全球 | 无 | 否 | 静态可读 | 是 |
| 13 | <https://api-docs.deepseek.com/guides/thinking_mode> | API 文档 Thinking Mode | 全球 | 无 | 否 | 静态可读；OpenAI/Anthropic/Responses 三套参数对照 | 是 |
| 14 | <https://api-docs.deepseek.com/guides/vision> | API 文档 Vision | 全球 | 无 | 否 | 静态可读；JPEG/PNG/GIF/WebP；base64/外链/file_id 三种传图方式 | 是 |
| 15 | <https://api-docs.deepseek.com/guides/json_mode> | API 文档 JSON Output | 全球 | 无 | 否 | 静态可读 | 是 |
| 16 | <https://api-docs.deepseek.com/guides/tool_calls> | API 文档 Tool Calls（含 strict Beta） | 全球 | 无 | 否 | 静态可读 | 是 |
| 17 | <https://api-docs.deepseek.com/guides/files_api> | API 文档 Files API | 全球 | 无 | 否 | 静态可读；`purpose=user_data`；1h–30d 可选过期 | 是 |
| 18 | <https://api-docs.deepseek.com/guides/kv_cache> | API 文档 Context Caching | 全球 | 无 | 否 | 静态可读；详细解释持久化规则 | 是 |
| 19 | <https://api-docs.deepseek.com/guides/responses_api> | API 文档 Responses API | 全球 | 无 | 否 | 静态可读；SSE 事件类型清单 | 是 |
| 20 | <https://api-docs.deepseek.com/guides/anthropic_api> | API 文档 Anthropic API 兼容 | 全球 | 无 | 否 | 静态可读；含完整字段兼容性矩阵（HTTP Header/Simple Fields/Tool Fields/Message Fields） | 是（curl 全文） |
| 21 | <https://api-docs.deepseek.com/guides/multi_round_chat> | API 文档多轮对话 | 全球 | 无 | 否 | 静态可读；强调 stateless API | 是 |
| 22 | <https://api-docs.deepseek.com/guides/chat_prefix_completion> | API 文档 Chat Prefix Completion（Beta） | 全球 | 无 | 否 | 静态可读；需 `base_url=https://api.deepseek.com/beta` | 是 |
| 23 | <https://api-docs.deepseek.com/guides/fim_completion> | API 文档 FIM Completion（Beta） | 全球 | 无 | 否 | 静态可读；最大 4K tokens；仅 non-thinking；提及 Continue VSCode 集成 | 是 |
| 24 | <https://api-docs.deepseek.com/api/create-chat-completion> | API 参考 Chat Completions | 全球 | 无 | 否 | 静态可读；OpenAPI 风格 schema | 是 |
| 25 | <https://api-docs.deepseek.com/api/list-models> | API 参考 List Models | 全球 | 无 | 否 | 静态可读；`GET /models` | 是 |
| 26 | <https://api-docs.deepseek.com/api/get-user-balance> | API 参考 Get User Balance | 全球 | 无 | 否 | 静态可读；返回 `balance_infos[].currency ∈ [CNY, USD]` | 是 |
| 27 | <https://api-docs.deepseek.com/updates> | API 文档 Change Log | 全球 | 无 | 否 | 静态可读；按日期倒序，含完整模型与价格变更历史 | 是（curl 全文） |
| 28 | <https://api-docs.deepseek.com/news/news260424> | News：DeepSeek V4 Preview | 全球 | 无 | 否 | 静态可读；V4-Pro 1.6T/49B、V4-Flash 284B/13B、1M context 默认 | 是 |
| 29 | <https://platform.deepseek.com/> | API 平台控制台（登录入口） | 全球 | DeepSeek 账号 | **是** | Next.js SPA；提供 API keys、Top up、Balance、Usage 等；curl 抓到 login redirect HTML（"<title>DeepSeek</title>" + meta description "Join DeepSeek API platform..."） | 否（仅作为官方购买/管理入口） |
| 30 | <https://platform.deepseek.com/api_keys> | API Key 管理 | 全球 | DeepSeek 账号 | **是** | 控制台内 | 否 |
| 31 | <https://status.deepseek.com/> | 服务状态页 | 全球 | 无 | 否 | Atlassian Statuspage；列各服务组件 Jun 2026 - Sep 2026 uptime（V4 Pro 99.90%、V4 Flash 99.81%、Vision Exp 100%、Chat Service 99.84%、Instant Mode 99.79%、Expert Mode 99.74%、Vision Mode 100%、File Upload 100%、Search 99.87%） | 是（curl 全文） |
| 32 | <https://status.deepseek.com/history> | 服务历史事件 | 全球 | 无 | 否 | 显示 Jul 2026 - Sep 2026 历史；具体事件列表本次未逐项抓取 | 部分（抓取框架已确认，内容未深抓） |
| 33 | <https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html> | 隐私政策（英文） | 全球 | 无 | 否 | 静态可读；"Last Update: Feb 10, 2026"；含 EEA/CH/UK 补充条款 | 是（curl 全文） |
| 34 | <https://cdn.deepseek.com/policies/en-US/deepseek-terms-of-use.html> | 用户条款（英文） | 全球 | 无 | 否 | 静态可读；"Last Update: March 27, 2026"；含 §1.5 地区可用性条款 | 是（curl 全文） |
| 35 | <https://cdn.deepseek.com/policies/en-US/model-algorithm-disclosure.html> | 模型原理与训练方法说明 | 全球 | 无 | 否 | 静态可读；含 V4 Training Data Summary | 是（curl 全文） |
| 36 | <https://cdn.deepseek.com/policies/en-US/cookies-policy.html> | Cookie 政策 | 全球 | 无 | 否 | 静态可读 | 是（链接在 Privacy Policy 中引用） |
| 37 | <https://www.deepseek.com/en/transparency/> | 透明度中心 | 全球 | 无 | 否 | Next.js；列出 V4.0 (2026-04-24)、V3.2 (2025-12-01) | 是（curl 全文） |
| 38 | <https://deepseek-harness.github.io/deepseek-harness/en/guide/quickstart> | DeepSeek Harness 文档（GitHub Pages） | 全球 | 无 | 否 | 静态可读；提供 Web UI / Python SDK / CLI 等 | 是（curl 全文） |
| 39 | <https://github.com/deepseek-ai/awesome-deepseek-integration/tree/main> | GitHub 集成仓库（awesome 列表） | 全球 | 无 | 否 | 静态可读 | 是（链接在 API docs 侧边栏） |
| 40 | <https://api.deepseek.com/user/balance> | 余额 API（实时） | 全球 | Bearer token | **是** | 实时 REST API；curl 用无效 token 抓取返回 HTTP 401 `Authentication Fails, Your api key: ****alid is invalid` | 是（仅验证端点可达，401 符合官方错误码 #401） |
| 41 | <https://cdn.deepseek.com/api-docs/codex-deepseek-setup-en.sh> | Codex 一键安装脚本 | 全球 | 无 | 否 | bash 脚本；运行后写入 `~/.codex/config.toml` + `models.json` | 是（链接在 Codex integration 文档中引用） |
| 42 | <https://static.deepseek.com/faq/index.html?lang=en#/category/4> | FAQ（SPA） | 全球 | 无 | 否 | **SPA 客户端渲染**，curl 仅返回 562 字节 HTML shell（`<div id="root"></div>`）；实际内容由 JS chunk `JSON.parse('...')` 注入；本次未抓到 FAQ 实质内容 | 否（结构已确认；FAQ 实质内容需浏览器渲染） |

已核实的失效/迁移 URL：本次抓取范围内**未发现 DeepSeek 文档站点的 404 页面或主域迁移**，所有文档 URL 仍在原位。

---

## 2. 字段覆盖矩阵

状态标注：公开（页面直接可见）/ 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用。

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开 | 模型名（model id）`deepseek-v4-flash` / `deepseek-v4-pro` / `deepseek-v4-flash-vision-exp`；显示名 DeepSeek-V4-Flash-0731 / DeepSeek-V4-Pro-0813 / DeepSeek-V4-Flash-Vision-Exp；legacy `deepseek-chat` / `deepseek-reasoner` 已退役。**DeepSeek API 不存在"月度订阅层级"概念**——只有"topped-up balance"（预充值余额）和"granted balance"（赠送额度） | [定价页](https://api-docs.deepseek.com/quick_start/pricing)、[Change Log](https://api-docs.deepseek.com/updates)、[Balance API](https://api-docs.deepseek.com/api/get-user-balance) |
| Plan Type | 公开（判断） | **api-usage**。按 token 用量即时扣减预充值余额；赠送额度优先；无月度配额 / 无消息额度 / 无 seat 计费 / 无并发服务费 | [定价页](https://api-docs.deepseek.com/quick_start/pricing)、[Balance API](https://api-docs.deepseek.com/api/get-user-balance) |
| 价格 | 公开 | **USD per 1M tokens**（英文版 [定价页](https://api-docs.deepseek.com/quick_start/pricing)）：<br>• `deepseek-v4-flash`：cache hit OFF-PEAK $0.007 / PEAK $0.014；cache miss OFF-PEAK $0.22 / PEAK $0.44；output OFF-PEAK $0.66 / PEAK $1.32<br>• `deepseek-v4-pro`：cache hit OFF-PEAK $0.022 / PEAK $0.044；cache miss OFF-PEAK $0.66 / PEAK $1.32；output OFF-PEAK $1.98 / PEAK $3.96<br>• `deepseek-v4-flash-vision-exp`：与 V4-Flash 同价<br>**CNY 元 / 百万 tokens**（中文版 [定价页](https://api-docs.deepseek.com/zh-cn/quick_start/pricing)）：<br>• V4-Flash：cache hit 0.05 / 0.10 元；cache miss 1.5 / 3.0 元；output 4.5 / 9.0 元<br>• V4-Pro：cache hit 0.15 / 0.30 元；cache miss 4.5 / 9.0 元；output 13.5 / 27.0 元<br>• Vision-Exp：与 V4-Flash 同价<br>高峰时段定义（中文版）：**北京时间周一至周五 9:00 - 12:00、14:00 - 18:00**（其余为空闲时段）<br>高峰时段定义（英文版）：**01:00 - 04:00 and 06:00 - 10:00 UTC, Monday through Friday**（与北京时间窗口 9:00-12:00、14:00-18:00 一致，UTC+8）<br>Peak 价 = 2 × Off-Peak 价（"Off-peak rates are half of the peak rates"） | [定价页 en](https://api-docs.deepseek.com/quick_start/pricing)、[定价页 zh-cn](https://api-docs.deepseek.com/zh-cn/quick_start/pricing)、[Change Log 2026-08-13](https://api-docs.deepseek.com/updates) |
| 币种 | 公开 | **USD**（英文版）与 **CNY**（中文版）；`/user/balance` 响应中 `currency` 字段取值 `[CNY, USD]`；余额查询按用户充值时选择的币种返回 | [Balance API](https://api-docs.deepseek.com/api/get-user-balance) |
| 计费周期 | 文档或公告 | **按 token 即时计量 + 余额扣减 + 赠送额度优先**。"The expense = number of tokens × price. The corresponding fees will be directly deducted from your topped-up balance or granted balance, with a preference for using the granted balance first when both balances are available." Vision-Exp 图片按尺寸换算为 token 计费（最多 384 tokens/image，按 V4-Flash 价）。**价格"可能发生变动"，DeepSeek 保留修改价格的权利**（定价页顶部原文） | [定价页](https://api-docs.deepseek.com/quick_start/pricing)、[Vision 文档](https://api-docs.deepseek.com/guides/vision)、[V4-Flash-Vision news](https://api-docs.deepseek.com/news/news260821) |
| 额度/使用限制 | 文档或公告 | **无月度配额、无消息额度、无 seat 上限**；限制字段是 **Concurrency Limit**（并发连接数）：per-account 计数（无论用哪个 API key），`deepseek-v4-pro` 默认 500，`deepseek-v4-flash` 与 `deepseek-v4-flash-vision-exp` 默认 2500。"If you need higher concurrency, you can submit a capacity expansion request. We will match the appropriate concurrency based on your actual business needs. **There is no additional cost for capacity expansion**"（通过 [飞书表单](https://trtgsjkv6r.feishu.cn/share/base/form/shrcnda9jNKvhyYr8xb843xLEzc) 申请）。`user_id` 维度单独设并发上限：V4-Pro 500/uid、V4-Flash 2500/uid、Vision-Exp 2500/uid（仅 quota 提升用户生效；普通用户所有 uid 合并计算） | [Rate Limit 页](https://api-docs.deepseek.com/quick_start/rate_limit) |
| 模型与功能 | 公开 | **当前模型**：`deepseek-v4-flash`（V4-Flash-0731，public beta，284B/13B MoE）、`deepseek-v4-pro`（V4-Pro-0813，GA，1.6T/49B MoE）、`deepseek-v4-flash-vision-exp`（实验性多模态）。**所有当前模型** 支持 1M tokens context、384K max output、Thinking + Non-thinking 双模式、JSON Output、Tool Calls、Responses API、Anthropic API、Chat Prefix Completion（Beta）；FIM Completion（Beta）仅 non-thinking 模式（Vision-Exp 不支持 FIM）。**Thinking Mode effort 档**：low / high / max（默认 high；medium / xhigh 映射到 high；OpenAI/Anthropic/Responses 三套参数：OpenAI `{"thinking":{"type":"enabled/disabled"}}` + `reasoning_effort`；Anthropic `{"reasoning":{"effort":"none/low/high/max"}}`；Responses `output_config={"effort":"low/high/max"}`） | [定价页](https://api-docs.deepseek.com/quick_start/pricing)、[Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode)、[V4 Preview news](https://api-docs.deepseek.com/news/news260424) |
| 上下文长度 | 公开 | **1M tokens**（三个当前模型统一）；**Max output 384K tokens**；**Chat Prefix Completion Beta 最大 4K tokens**（FIM Beta 最大 4K tokens） | [定价页](https://api-docs.deepseek.com/quick_start/pricing)、[FIM 文档](https://api-docs.deepseek.com/guides/fim_completion) |
| 速率限制 | 文档或公告 | **并发连接数**（见"额度/使用限制"）；**未公开 RPM / TPM / RPD 数值**——官方仅用并发数管控；429 错误消息建议"pace your requests reasonably ... temporarily switch to the APIs of alternative LLM service providers, like OpenAI"（429 错误页原文）；超时机制：非流式请求 10 分钟内若未开始推理，server 关闭连接 | [Rate Limit 页](https://api-docs.deepseek.com/quick_start/rate_limit)、[Error Codes 页](https://api-docs.deepseek.com/quick_start/error_codes) |
| 并发 | 文档或公告 | V4-Pro 500；V4-Flash 与 Vision-Exp 2500（per-account）；`user_id` 维度同值（仅 quota 提升用户）；提升并发不另收费用（飞书表单申请）；并发满载 → HTTP 429 | [Rate Limit 页](https://api-docs.deepseek.com/quick_start/rate_limit) |
| 隐私/数据处理 | 文档或公告 | **Data Controller**：Hangzhou DeepSeek Artificial Intelligence Co., Ltd., 中国注册。"we directly collect, process and store your Personal Data in People's Republic of China"（隐私政策 §"Where We Store Your Personal Data"）。**Training Policy**："to enhance transparency, DeepSeek hereby publishes Training Data Summary"——V4 训练数据分 Public Data（互联网公开信息）+ Licensed Data（第三方合法授权）；**"the pre-training phase does not require personal information for training ... we do not intentionally collect personal information to associate with any specific account or individual, nor do we proactively use it to train our models"**；优化训练阶段含少量 user input 衍生数据，使用前"apply secure encryption, strict de-identification, and anonymization to make it cannot be linked to any specific individual"；**"Users are also given the right to opt out"**（参见 Privacy Policy 中的"right to opt-out of using your Personal Data for training our models or optimizing our technologies"）。**数据保留**："we retain Personal Data for as long as necessary to provide our Services ... for account Personal Data, input and payment Personal Data, as long as you have an account"；违反条款时可延长保留。**Children**："Our Services are not aimed at children, and we do not knowingly process Personal Data from children"。**EEA/CH/UK 补充条款**：含 GDPR legal bases 表、用户访问/更正/删除/限制处理/数据可携带/反对权等 | [Privacy Policy](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html)、[Model Mechanism Disclosure](https://cdn.deepseek.com/policies/en-US/model-algorithm-disclosure.html) |
| 注册要求 | 文档或公告 | **API 控制台**：邮箱或第三方账号（Apple/Google）注册（Terms §2.2 原文："register an account using your Email or third-party account as per the page instructions"）；**不需要中国大陆手机号**（API 控制台层面；DeepSeek Chat 移动 app 注册路径不同，未在本调研范围）。**实名认证要求**：未在官方页面明确列出。**企业认证**：未在官方页面明确列出（仅提到"为企业提效，联系我们支持申请更大并发"——[platform 页](https://www.deepseek.com/en/platform/) 原文"Scale your business — contact us for higher concurrency"，且容量扩展本身"no additional cost"）。**年龄限制**：Terms §2.1 服务"primarily intended for adults"；18 岁以下需监护人同意 | [Terms of Use](https://cdn.deepseek.com/policies/en-US/deepseek-terms-of-use.html)、[platform 页](https://www.deepseek.com/en/platform/)、[Rate Limit 页](https://api-docs.deepseek.com/quick_start/rate_limit) |
| 支付方式 | 文档或公告 | **充值余额模型**（pay-as-you-go prepaid balance）；**支持货币**：CNY / USD（Balance API `currency` 字段）。**具体支付渠道（支付宝/微信/Stripe/信用卡）**：本次抓取范围内**未命中官方公开页面列出完整支付方式清单**——Privacy Policy §"Payment Personal Data" 仅说"we collect your payment order and transaction Personal Data to provide Services such as order placement, payment, customer service, and after-sales support"，未点名渠道；Error Codes 页"402 - Insufficient Balance"提示"go to the Top up page to add funds"；实际支付渠道**无法确认**（需登录控制台查看） | [Privacy Policy](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html)、[Balance API](https://api-docs.deepseek.com/api/get-user-balance)、[Error Codes 页](https://api-docs.deepseek.com/quick_start/error_codes) |
| 地区政策 | 文档或公告 | **Terms §1.5 官方明确声明**："We make no warranty that the Services are available or will continue to be available in certain jurisdictions. The functions or features of the Services may also vary in different jurisdictions."（**即官方对服务地区有保留声明，但未公开具体排除清单**）。**Privacy Policy**：数据存于中国境内；EEA/CH/UK 有补充条款（GDPR-aligned）；不针对儿童；不使用敏感数据。**ICP 备案**："浙ICP备2023025841号"、"浙B2-20250178"、"浙公网安备33010502011812号"（中文 platform 页底部 + en transparency 页底部）。**官方 1.5 条款**意味着服务可用性可能在不同司法管辖区变化但**无具体国家清单**——本次抓取范围内**未发现"中国大陆禁用 / 海外禁用 / 受限地区清单"的明确声明页**。中国大陆用户默认可用（无官方排除声明）；海外用户默认可用（无官方排除声明）；具体可用性受 Terms §1.5 约束 | [Terms §1.5](https://cdn.deepseek.com/policies/en-US/deepseek-terms-of-use.html)、[platform 页](https://www.deepseek.com/en/platform/) |
| 官方购买链接 | 公开 | **API 控制台**：<https://platform.deepseek.com/>；**Top up 页**：控制台内（路径未在公开页给出；Error Codes 402 提示"go to the Top up page"）；**企业大并发申请**：[飞书表单](https://trtgsjkv6r.feishu.cn/share/base/form/shrcnda9jNKvhyYr8xb843xLEzc)；**Codex 一键安装脚本**：<https://cdn.deepseek.com/api-docs/codex-deepseek-setup-en.sh>（Windows PowerShell 等价：<https://cdn.deepseek.com/api-docs/codex-deepseek-setup-en.ps1>）；**API Docs 入口**：<https://api-docs.deepseek.com/>；**Pricing**：<https://api-docs.deepseek.com/quick_start/pricing>；**API Platform 营销页**：<https://www.deepseek.com/en/platform/> | [Rate Limit 页](https://api-docs.deepseek.com/quick_start/rate_limit)、[Codex 集成](https://api-docs.deepseek.com/quick_start/agent_integrations/codex) |
| 官方 API（用量可见性 / 程序化） | 官方 API | **`GET /models`**：返回当前可用模型列表（schema：id/object/owned_by；示例 `deepseek-v4-flash` / `deepseek-v4-pro`）；**`GET /user/balance`**：返回 `is_available` + `balance_infos[]`（每条 `currency ∈ [CNY, USD]`、`total_balance`/`granted_balance`/`topped_up_balance`）；**`POST /chat/completions`**：OpenAI 兼容主接口；**`POST /responses`**：OpenAI Responses API 兼容（DeepSeek 原生支持）；**`/anthropic` 前缀**：Anthropic Messages API 兼容；**`POST /files`** + `POST /files/{id}` + `DELETE /files/{id}` + `GET /files`：OpenAI Files API 兼容；**`/beta` 前缀**：Chat Prefix Completion + FIM；**`POST /embeddings`** / **FIM `/beta/completions`** / **`POST /images`**：**本次未在官方文档中直接核对**（不在主页侧边栏，需 curl 自验证） | [API Reference](https://api-docs.deepseek.com/api/create-chat-completion)、[Balance API](https://api-docs.deepseek.com/api/get-user-balance)、[List Models](https://api-docs.deepseek.com/api/list-models)、[Files API](https://api-docs.deepseek.com/guides/files_api) |
| 更新时间 | 文档或公告 | **API docs Pricing 页**：无 Last updated 时间戳；Change Log 按日期条目记录价格变更；**Change Log**：按日期倒序（最新 2026-08-21 V4-Flash-Vision-Exp、2026-08-13 V4-Pro GA + Peak/Off-Peak 公告 + 2026-08-16 16:00 UTC 生效、2026-07-31 V4-Flash Public Beta、2026-04-24 V4 Preview、2025-12-01 V3.2、2025-09-29 V3.2-Exp、2025-09-22 V3.1-Terminus、2025-08-21 V3.1、2025-05-28 deepseek-reasoner → R1-0528、2025-03-24 deepseek-chat → V3）；**Privacy Policy**："Last Update: Feb 10, 2026"；**Terms of Use**："Last Update: March 27, 2026"；**platform 营销页**：无 Last updated 时间戳；**Status 页**：Jun 2026 - Sep 2026 滚动窗口 | [Change Log](https://api-docs.deepseek.com/updates)、[Privacy Policy](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html)、[Terms](https://cdn.deepseek.com/policies/en-US/deepseek-terms-of-use.html)、[Status](https://status.deepseek.com/) |

---

## 3. 价格/额度的原始表达方式与归一化歧义

### 3.1 官方原始表述（照录）

- **定价页顶部**（英文版）：
  > "The prices listed below are in units of per 1M tokens. A token, the smallest unit of text that the model recognizes, can be a word, a number, or even a punctuation mark. We will bill based on the total number of input and output tokens by the model."
- **定价页表格脚注**（英文版）：
  > "(1) Off-peak rates are half of the peak rates. Peak hours are 01:00 - 04:00 and 06:00 - 10:00 UTC, Monday through Friday (all other hours are off-peak).
  > (2) Images sent to deepseek-v4-flash-vision-exp are converted into tokens based on their dimensions and billed as input tokens together with your text tokens. See Vision: Token Usage for the conversion rule.
  > (3) For more details on concurrency limits, please refer to Rate Limit & Isolation."
- **中文版定价页脚注**：
  > "(1) 空闲时段价格为高峰时段价格的一半。高峰时段为北京时间周一至周五 9:00 - 12:00、14:00 - 18:00（其余为空闲时段）。
  > (2) 发送给 deepseek-v4-flash-vision-exp 的图片会按其尺寸换算成 token，与文本 token 一并计费。
  > (3) 更多并发限制细节，请参考 限速与隔离。"
- **扣费规则**：
  > "扣减费用 = token 消耗量 × 模型单价，对应的费用将直接从充值余额或赠送余额中进行扣减。 当充值余额与赠送余额同时存在时，优先扣减赠送余额。 产品价格可能发生变动，DeepSeek 保留修改价格的权利。"
- **V4-Pro 三项定价（英文版表格）**：
  > | Model | Cache Hit OFF-PEAK | Cache Hit PEAK | Cache Miss OFF-PEAK | Cache Miss PEAK | Output OFF-PEAK | Output PEAK |
  > | deepseek-v4-flash | $0.007 | $0.014 | $0.22 | $0.44 | $0.66 | $1.32 |
  > | deepseek-v4-pro | $0.022 | $0.044 | $0.66 | $1.32 | $1.98 | $3.96 |
- **Balance API 响应示例**：
  > `{"is_available": true, "balance_infos": [{"currency": "CNY", "total_balance": "110.00", "granted_balance": "10.00", "topped_up_balance": "100.00"}]}`
- **Context Caching 默认启用**：
  > "The DeepSeek API Context Caching on Disk Technology is enabled by default for all users, allowing them to benefit without needing to modify their code. Each user request will trigger the construction of a hard disk cache. If subsequent requests have overlapping prefixes with previous requests, the overlapping part will only be fetched from the cache, which counts as a 'cache hit.'"
- **Thinking Mode 控制**（OpenAI/Anthropic/Responses 三套参数原文）：
  > "OpenAI Format: Thinking Toggle `{"thinking": {"type": "enabled/disabled"}}`; Effort Control `reasoning_effort: low/high/max`. Anthropic Format: Thinking Toggle `{"reasoning": {"effort": "none/low/high/max"}}` (none disables thinking mode); Effort Control `output_config: {"effort": "low/high/max"}`. Responses API Format: Effort Control `reasoning_effort: low/high/max`. ... Thinking mode is enabled by default, with the default effort being high."
- **Tool Calls strict Beta**：
  > "In strict mode, the model strictly adheres to the format requirements of the Function's JSON schema when outputting a tool call ... To use strict mode, you need to: (1) Use `base_url="https://api.deepseek.com/beta"` to enable Beta features; (2) In the `tools` parameter, all `function` need to set the `strict` property to `true`; (3) The server will validate the JSON Schema of the Function provided by the user."
- **Files API 上传限制**：
  > "A single file may be at most 64 MiB, and the upload must complete within 10 minutes. ... `expires_after[seconds]`: Lifetime in seconds, between 3600 and 2592000 (1 hour to 30 days). Omit both expires_after fields to keep the file permanently."
- **Anthropic 模型映射**：
  > "When you use the Anthropic API, we map the Claude model names you pass in: Models starting with `claude-opus` are mapped to `deepseek-v4-pro`; Models starting with `claude-haiku` or `claude-sonnet` are mapped to `deepseek-v4-flash`."
- **Anthropic 兼容字段矩阵节选**：
  > "HTTP Header: `anthropic-beta` Ignored for `/messages`; required (`files-api-2025-04-14`) for Files API endpoints. `anthropic-version` Ignored. `x-api-key` Fully Supported. Simple Fields: `model` Use DeepSeek Model Instead. `container` Ignored. `mcp_servers` Ignored. `metadata.user_id` is supported, others are ignored. `service_tier` Ignored. `thinking` Supported (`budget_tokens` is ignored). Message Fields: `array, type='image'` Supported (`source.type` can be `base64`/`url`/`file`); `array, type='document'` Not Supported; `array, type='search_result'` Not Supported; `array, type='redacted_thinking'` Not Supported; `array, type='code_execution_tool_result'` Not Supported; `array, type='mcp_tool_use'` Not Supported; `array, type='mcp_tool_result'` Not Supported; `array, type='container_upload'` Not Supported."
- **V4-Flash-Vision-Exp 图片计费**：
  > "Images are tokenized for billing: up to 384 tokens each, at V4-Flash pricing."
- **429 错误码消息原文**：
  > "Cause: You are sending requests too quickly. Solution: Please pace your requests reasonably. We also advise users to temporarily switch to the APIs of alternative LLM service providers, like OpenAI."
- **企业大并发申请说明**：
  > "If you need higher concurrency, you can submit a capacity expansion request. We will match the appropriate concurrency based on your actual business needs. **There is no additional cost for capacity expansion**."

### 3.2 跨 Vendor 归一化歧义清单

1. **"Plan 标识" = model id，不是订阅层级**：DeepSeek API 没有 Plus/Pro/Business 概念；归一化到统一 Plan 模型时**应把 model id 作为 Plan 标识**，不能用 Subscription tier 字段（对比 OpenAI "Usage tier"、Anthropic "Evaluation/Start/Build/Scale"、Cursor seat 模型均不适用）。
2. **币种两套表并存**：USD 与 CNY 是**两套独立价表**，不是按汇率换算——`$0.14 cache miss` 对应"1.5 元"（1.5/0.14 ≈ 10.7），`$0.0028 cache hit` 对应"0.05 元"（0.05/0.0028 ≈ 17.9），比例不一致；归一化时**不能假定 USD/CNY 是固定汇率换算**，必须把两套表分别建模，由用户充值货币决定实际扣费通道。Balance API 返回的 `currency` 字段是判断依据。
3. **Peak/Off-Peak = 2 倍关系**：这是 V4 起的强制双价制；归一化时**必须把 off-peak 与 peak 分别建字段**，不能用平均价或区间近似，否则高负载时段用户成本被低估 100%。
4. **Cache Hit 仅在 prefix 完全匹配时**：DeepSeek Context Caching 是 **prefix unit 完整匹配**机制——"A subsequent request can only hit the cache if it fully matches a cache prefix unit"，不支持子串匹配。这与 Anthropic Prompt Caching（默认 4 段断点，自动匹配到最长前缀）、OpenAI Prompt Caching（同样按 prefix 自动匹配）的"最长前缀匹配"不同。归一化"缓存命中率"字段时必须提示：DeepSeek 模型的实际缓存命中率可能低于 Anthropic/OpenAI（因前缀必须严格完整匹配）。
5. **Cache 自动启用、零代码改动**：与 Anthropic/OpenAI 默认开启但需在 request header 启用不同；归一化"缓存启用方式"字段时，DeepSeek 字段值是"default-on, no opt-in needed"。
6. **V4-Flash 与 V4-Pro 并发数差异显著**：500 vs 2500（5 倍）；归一化"并发上限"字段时必须按模型分别建值，不能取平均值。
7. **peak/off-peak 高峰时段按 UTC/北京时分别声明**：英文版"01:00-04:00 and 06:00-10:00 UTC, Mon-Fri"，中文版"北京时间 9:00-12:00、14:00-18:00 周一至周五"——两个表述**指向同一时段**（UTC+8 转换后），但需注意 UTC 表述是 Mon-Fri 而非所有天（即**周末全天 off-peak**）。
8. **周末与节假日不设高峰**：英文版明示"all other hours are off-peak"，中文版未明示但等价。归一化时这是隐性默认字段。
9. **Vision 模型按图片尺寸计费**：最多 384 tokens/image；归一化"图片计费"字段时不能简单按张数计费（对比 OpenAI 按"每张 image + 每 token text input"双计）。
10. **Thinking Mode 三套参数**：OpenAI / Anthropic / Responses API 三套映射（OpenAI 用 `thinking` + `reasoning_effort`；Anthropic 用 `reasoning.effort` + `output_config.effort`；Responses 用 `reasoning_effort`）；归一化"thinking 字段"时必须先识别 SDK/协议栈；reasoning tokens **作为 output 计费**（与 Anthropic/OpenAI 一致，但需要在文档中明确"reasoning_content 也算 output"）。
11. **FIM 仅 non-thinking**：与 Anthropic/OpenAI FIM 在 thinking 模式下可用不同；归一化"FIM 模式"字段时 DeepSeek 字段值是"non-thinking only"。
12. **Anthropic API 兼容但不完整**：Anthropic `/messages` 接口可用，但 `container` / `mcp_servers` / `service_tier` / `citations` / `cache_control` / Anthropic `document` content type / `code_execution_tool_result` / `mcp_tool_use|mcp_tool_result` / `container_upload` 全部 Not Supported；归一化"Anthropic 兼容度"字段时需区分"可用功能集"与"不可用功能集"。
13. **`reasoning_content` 在 multi-turn 中有条件回传**（Thinking Mode 文档原文）："If the request carries the tools parameter: the reasoning_content of all previous turns should be passed back ... If the request does not carry the tools parameter: reasoning_content does not need to be passed back"。归一化"thinking 多轮处理"字段时必须区分是否带 tools。
14. **`base_url` 三个域**：`https://api.deepseek.com`（OpenAI 主）、`https://api.deepseek.com/anthropic`（Anthropic）、`https://api.deepseek.com/beta`（Chat Prefix Completion + FIM + strict mode）；归一化"endpoint"字段时需区分。
15. **`/v1` 是兼容性 alias 不是版本号**（deepseekv4pro 第三方文档归纳）：`https://api.deepseek.com/v1` 与 `https://api.deepseek.com` 等价，仅为兼容 OpenAI SDK 默认 `baseURL`；归一化"API 版本"字段时这是隐性事实。
16. **DeepSeek 无 Code Interpreter / Web Search / Sandbox / 容器工具**：所有 tool 调用都需用户自实现 function execution（"The model itself does not execute specific functions"——Tool Calls 文档原文）。归一化"内置工具集"字段时 DeepSeek 字段值是"无 server tools"（对比 Anthropic web_search/code_execution、OpenAI web_search/file_search/containers）。
17. **`user_id` 不是 Abuse Monitoring 标签而是调度隔离键**：DeepSeek 用 `user_id` 区分 content safety + KVCache + scheduling isolation（Rate Limit 页原文）；归一化"abuse monitoring 标识"字段时，DeepSeek 没有等价 OpenAI 的 `safety_identifier`，归一化为"per-user concurrency + cache partition key"。
18. **429 错误消息建议切换到 OpenAI**：官方原文"temporarily switch to the APIs of alternative LLM service providers, like OpenAI"——这是 DeepSeek 官方承认高并发限流的直接证据；归一化"过载降级策略"字段时应记录"官方建议下游业务自行准备多 vendor fallback"。

---

## 4. 来源冲突、更新频率与历史变更方式

### 4.1 来源冲突（已识别 2 处，已分析）

1. **中文 platform 页 vs 英文 platform 页：价格内容时点不一致**
   - 中文 platform 页（`https://www.deepseek.com/platform/`）的文案是"**预计 7 月中旬开始采用峰谷定价策略，高峰时段价格为平时价格 2 倍，详情查看**"——这是 V3 时代（2025 年）的旧文案；**实际价格数字未渲染到 DOM**（`ds-text-price` 节点为零）。
   - 英文 platform 页（`https://www.deepseek.com/en/platform/`）的文案是"**Prices may change. For details, see the Pricing**"；实际价格数字（V4-Flash/Pro 三项单价）渲染到 DOM。
   - **判定**：英文 platform 页与 API docs 定价页数据一致（OFF-PEAK 单价）；中文 platform 页因客户端渲染缺失 + 文案过期，**实际不展示价格**，仅提供文案。中文定价数据应以 API docs 中文版（`/zh-cn/quick_start/pricing`）为准——人民币元/百万 tokens 含完整 Peak/Off-Peak 双价表。中文 platform 页可视为"过时的占位文案"。
2. **Cache Hit 价的官方表述 vs 第三方汇总**
   - 官方（Change Log 2025-12-01 V3.2 + 2026-04-24 V4 Preview + 2026-08-16 Peak/Off-Peak 上线）：cache hit 单价随 cache miss 价变动而变动，**不是独立的"折扣率"字段**。
   - 第三方汇总（如 pricepertoken、ofox.ai、layer3labs）多以"cache hit 是 cache miss 的 1/50 ~ 1/55"作为比较口径——这是计算结果，不是官方表述。
   - **判定**：跨 Vendor 归一化 cache 字段时，应以"cache hit 单价 + cache miss 单价"两套原始数字为主，折扣率作为衍生字段；不能用单一"折扣率"代替两组单价。

### 4.2 更新频率

- **API 文档定价页**：约每 2–4 个月一次重大变更（V4 Preview 2026-04-24 → V4-Flash Public Beta 2026-07-31 → V4-Pro GA + Peak/Off-Peak 上线 2026-08-16 → V4-Flash-Vision-Exp 2026-08-21）。
- **Change Log**：约每 2–4 周一次主要条目；2025-08 至 2026-08 累计 9 条主要模型/价格变更。
- **法律文档**：约每季度更新（Privacy Policy 2026-02-10；Terms 2026-03-27）。
- **Status 页**：实时滚动（Jun 2026 - Sep 2026 uptime 监控）。

### 4.3 历史变更方式（已可考的官方记录）

- **2025-03-24**：`deepseek-chat` 升级到 DeepSeek-V3（基线）；早期定价未在 Change Log 明示。
- **2025-05-28**：`deepseek-reasoner` 升级到 DeepSeek-R1-0528；R1 系列首次带 Function Calling。
- **2025-08-21**：**DeepSeek-V3.1** 发布；首次**统一 thinking 与 non-thinking 单价**（hybrid reasoning），`cache hit $0.07 / cache miss $0.56 / output $1.68 per 1M tokens`；**取消夜间折扣**（off-peak discount ended）。这是 V3 时代最大的价格调整之一。
- **2025-09-22**：`deepseek-chat` + `deepseek-reasoner` 升级到 DeepSeek-V3.1-Terminus；仅 bug fix，**价格不变**。
- **2025-09-29**：`deepseek-chat` + `deepseek-reasoner` 升级到 DeepSeek-V3.2-Exp；价格未在 Change Log 明示变更。
- **2025-12-01**：`deepseek-chat` + `deepseek-reasoner` 升级到 DeepSeek-V3.2；**V3.2-Speciale** 通过临时 endpoint `https://api.deepseek.com/v3.2_speciale_expires_on_20251215` 提供至 2025-12-15 15:59 UTC（已过期）；archive.ph 2025-12-01 快照显示 cache hit $0.028 / cache miss $0.28 / output $0.42（即 V3.2 比 V3.1 大幅降价）。
- **2026-04-24**：**DeepSeek V4 Preview** 上线（V4-Pro 1.6T/49B、V4-Flash 284B/13B MoE，1M context 默认）；`deepseek-chat` 与 `deepseek-reasoner` 退役倒计时三个月（2026-07-24）；archive.ph 2026-05-26 快照显示 V4 起步价 cache hit $0.0028/0.003625（标注 "75% off"）、cache miss $0.14/0.435、output $0.28/0.87——**与当前定价页完全一致**。
- **2026-07-24 15:59 UTC**：`deepseek-chat` 与 `deepseek-reasoner` 正式退役。
- **2026-07-31**：**DeepSeek-V4-Flash API Public Beta**（DeepSeek-V4-Flash-0731）；首次**原生支持 Responses API**，适配 Codex。
- **2026-08-13**：**DeepSeek-V4-Pro GA**（DeepSeek-V4-Pro-0813）；Agent 能力大幅提升；Thinking Mode 升级到 low/high/max 三档；Change Log 公告"**API Pricing Adjustment** ... we will adopt peak/off-peak pricing, with off-peak prices set at half of the peak-hour prices ... new prices will take effect at 16:00 (UTC Time) on August 16, 2026"。
- **2026-08-16 16:00 UTC**：**Peak/Off-Peak 双价制正式生效**（V4 系列）。
- **2026-08-21**：**DeepSeek-V4-Flash-Vision-Exp** 上线（实验性多模态）；Files API 上线（Free to use）；DeepSeek Harness 0.1.1 发布。

### 4.4 页面是否显示更新时间

- **API docs Pricing 页**：**无** Last updated 时间戳；靠 Change Log 推断变更时点。
- **Change Log 页**：按日期条目（每条带具体日期），最新条目 2026-08-21。
- **Legal 文档**：Privacy Policy "Last Update: Feb 10, 2026"；Terms "Last Update: March 27, 2026"。
- **platform 营销页**：**无** Last updated 时间戳；价格数字直接渲染到 DOM。
- **Status 页**：Jun 2026 - Sep 2026 滚动窗口（90 天）。
- **Help Center / FAQ**：SPA 客户端渲染（curl 抓不到内容）；时间戳未确认。

### 4.5 无法确认当前有效值的字段

- **官方公开的支付渠道清单（支付宝 / 微信 / Stripe / 信用卡 / Apple Pay）**：本次抓取范围内 Privacy Policy 仅提"Payment Personal Data ... order placement, payment, customer service, and after-sales support"，未点名支付方式；Error Codes 提示"go to the Top up page"，但 Top up 页需登录。第三方攻略（如 ofox.ai）声称 DeepSeek 控制台接受支付宝、微信、Stripe、信用卡——**这是第三方观察，官方页面未公开确认**。
- **实名认证 / KYC 触发条件**：未在官方页面找到具体阈值或规则。
- **企业认证 / 公司账户注册路径**：未在官方页面找到。
- **退款政策**：未在官方页面找到（Terms 全文未命中"refund"；Privacy Policy 仅提"Payment Personal Data"）。
- **发票 / 增值税专用发票**：未在官方页面找到。
- **企业 SLA / 99.9% uptime 保障**：未在官方页面找到（Status 页仅展示实时数据，无 SLA 承诺条款）。
- **海外用户（北美 / 欧洲）注册与充值的具体可行性**：Terms §1.5 留有"availability in different jurisdictions"的保留声明，但未公开具体排除清单；Privacy Policy 含 EEA/CH/UK 补充条款暗示欧洲可用；**未找到任何"北美/欧洲/东南亚用户注册流程差异"的官方说明**。
- **企业销售联系邮件**：platform 页只说"contact us"，但 Contact 入口未直接给出邮箱（[Privacy Policy](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html) 提 `privacy@deepseek.com`；[API docs footer](https://api-docs.deepseek.com/) 提 `api-service@deepseek.com`；中文 platform 页/Status 页/企业大并发申请使用飞书表单）——`service@deepseek.com` 与 `enterprise@deepseek.com` 的有效性**无法确认**。
- **`POST /embeddings` / `POST /images` / 其他 OpenAI 兼容端点**：本次未在官方文档侧边栏找到；可能不存在（DeepSeek 未发布 embed 模型或 image 生成模型）——**端点存在性无法确认**。
- **FAQ 实质内容**：SPA 渲染，curl 抓不到——**无法确认**。
- **an`/static.deepseek.com/faq/...` 中 `index.html` 之外的分类页内容**：抓不到。
- **Peak/Off-Peak 价生效的实际时点**：Change Log 公告"2026-08-16 16:00 UTC"，但本次抓取定价页已是生效后状态，**实际生效时点"8 月 16 日 16:00 UTC"以 Change Log 文本为准**，无第三方仲裁页确认。
- **历史归档价格表（V3.1 完整版）**：Change Log 仅描述"cache hit $0.07 / cache miss $0.56 / output $1.68"，archive.ph 快照显示 2025-08-21 版本表格完整，但官方定价页已切换到 V4——**V3.1 历史价表无独立官方归档页**，需依赖 archive.ph 快照。

---

## 5. 中国 Availability（五维度）

> 原则声明：本节区分"官方明确声明"与"无法确认"；**页面无法访问或抓取失败不作为官方政策限制的证据**。本次抓取的官方渠道：`api-docs.deepseek.com` 全站、`platform.deepseek.com` 登录页、`deepseek.com` 官网 + 中文版 + transparency、`status.deepseek.com`、Privacy Policy + Terms + Model Mechanism Disclosure (`cdn.deepseek.com/policies/`)；Balance API 端点验证（401 符合预期）。"中国大陆" / "China" / "Chinese mainland" 关键词命中已逐条核对。

| 维度 | 状态 | 说明 |
|---|---|---|
| 注册 | **官方明确（结构性可用 + 数据存储地点）** + 部分细节无法确认 | **官方明确**：① Data Controller 为 Hangzhou DeepSeek Artificial Intelligence Co., Ltd.，注册地中国杭州；② Terms §2.2"register an account using your **Email or third-party account**"——注册可走邮箱或 Apple/Google 第三方登录，**未要求中国大陆手机号**（API 控制台层面）；③ 隐私政策"we directly collect, process and store your Personal Data in People's Republic of China"——数据存于中国境内；④ ICP 备案"浙ICP备2023025841号"等三项中文平台底部 + en transparency 页底部均明示。**未确认**：① 是否需要实名认证 / KYC（官方页面无相关条款；② 企业认证 / 公司账户注册流程；③ 海外用户（北美/欧洲/东南亚）能否通过邮箱注册并持续保持账号；④ 第三方登录（Apple ID/Google）在中国大陆的可用性（受中国大陆网络环境影响，非 DeepSeek 政策）。 |
| 支付 | **官方明确（币种 + 余额模型）** + 具体渠道无法确认 | **官方明确**：① `/user/balance` 支持 `currency ∈ [CNY, USD]`；② "topped-up balance"+"granted balance"，赠送额度优先；③ Error Codes 402 提示"go to the Top up page to add funds"；④ 隐私政策提"Payment Personal Data"收集"order placement, payment, customer service, and after-sales support"。**未确认**：① 支付宝 / 微信支付 / 银联 / Stripe / 信用卡 / Apple Pay 等具体支付渠道清单（官方页面未公开列出，需登录控制台）；② 海外用户充值渠道；③ 退款政策；④ 发票/增值税专用发票；⑤ 最低充值金额；⑥ 自动续费/订阅扣款（API 形态无订阅，应不适用）。 |
| 网络访问 | **官方未声明** | 官方未就"中国大陆网络可达性"或"海外网络可达性"做任何声明；`api.deepseek.com` 的实际可达性属于本地网络层面，需经实机测试。Terms §1.5 的"availability in different jurisdictions"是政策保留，非网络可达性声明。`api-docs.deepseek.com`、`deepseek.com`、`status.deepseek.com` 在本次抓取中（curl，海外出口）均可达——但这只是**抓取可行性**而非**用户可达性**证据。 |
| 服务政策 | **官方明确（结构性 + 保留声明）** | **官方明确**：① Hangzhou DeepSeek Artificial Intelligence Co., Ltd. 中国注册；② ICP 备案（中国大陆合规）；③ Privacy Policy / Terms 法律实体明确；④ Terms §1.5 官方明示"不保证所有地区持续可用，功能可能在不同地区有所差异"——即对全球服务可用性有保留声明。**未确认**：① 中国大陆用户是否被排除（无官方排除声明 → 默认可用）；② 海外用户是否被排除（无官方排除声明 → 默认可用，但 Terms §1.5 保留权利）；③ 不同地区功能差异的具体清单（Terms 仅泛指，未列出）；④ 制裁/出口管制（如美国 OFAC、欧盟 sanctions）合规清单——未在官方页面找到。 |
| 功能限制 | **官方明确（部分功能在不同地区可能有差异）** + 具体清单无法确认 | **官方明确**：Terms §1.5"The functions or features of the Services may also vary in different jurisdictions"——即**官方承认有按地区差异化的功能机制**，但**未公开具体差异清单**。**未确认**：① 中国大陆用户与海外用户在 Thinking Mode / Function Calling / Files API / Responses API / Anthropic 兼容等具体功能上是否有可用性差异（本次抓取的 docs 页面对所有地区一视同仁，但 Terms 保留权利）；② Vision 模型（V4-Flash-Vision-Exp）是否在所有地区可用（docs 页面无地区限制条款）；③ FIM / Chat Prefix Completion（Beta）是否在所有地区可用；④ 中国大陆对 API 内容的合规审查（PRC 生成式 AI 服务管理办法）—— 未在 DeepSeek 官方页面找到。 |

补充事实（**官方已声明**，与本调研相关但非中国特有）：
- ICP 备案"浙ICP备2023025841号"、"浙B2-20250178"、"浙公网安备33010502011812号"
- 微信公众号 `qr-wechat.png` 在 footer 中提供；扫码关注 DeepSeek on WeChat
- Terms §1.5 "We make no warranty that the Services are available or will continue to be available in certain jurisdictions. The functions or features of the Services may also vary in different jurisdictions."
- Privacy Policy "we directly collect, process and store your Personal Data in People's Republic of China"
- Training Policy "we do not intentionally collect personal information ... to train our models" + "Users are also given the right to opt out"
- 429 错误消息建议"temporarily switch to the APIs of alternative LLM service providers, like OpenAI"（官方承认并发限流）

---

## 6. 对 Data Provider / Recommendation Policy 的建议（供后续 ticket 引用）

- **最小来源契约**：`api-docs.deepseek.com/quick_start/pricing`（英文 USD + 完整 Peak/Off-Peak 表）+ `api-docs.deepseek.com/zh-cn/quick_start/pricing`（中文 CNY + 完整 Peak/Off-Peak 表）+ `api-docs.deepseek.com/quick_start/rate_limit`（并发数）+ `api-docs.deepseek.com/updates`（价格变更时间线）+ `api-docs.deepseek.com/api/get-user-balance`（币种判定）+ Status 页 + 隐私/条款 + cn/platform 页（占位文案监控）六类即可覆盖核心字段。Pricing 页与 Change Log 都支持 `.md` 文本爬取；不需要浏览器渲染。
- **核心字段（缺失应阻止强排名）**：
  - **价格**：按 model × {cache hit, cache miss, output} × {off-peak, peak} × {USD, CNY} 共 6×4 = 24 个基础价格单元；
  - **并发数**：按 model 分（V4-Pro 500 vs V4-Flash/Vision-Exp 2500）；
  - **context window**：1M tokens；
  - **max output**：384K tokens；
  - **Plan type = api-usage**（不是订阅）；
  - **数据存储位置**：PRC；
  - **training opt-out**：可用（Privacy Policy 明示）；
  - **Peak/Off-Peak 高峰时段**：UTC 01:00-04:00 / 06:00-10:00 Mon-Fri；
  - **FIM/Chat Prefix Completion 限制**：non-thinking only / Beta；
  - **Anthropic 兼容字段矩阵**：可用/不可用字段需明确列出。
- **失败分类建议**：
  - `OK`（静态页全文）：所有 api-docs.deepseek.com/* + cdn.deepseek.com/policies/* + status.deepseek.com + deepseek.com/en/platform/；
  - `JS_RENDERED_NO_DATA`（客户端渲染但内容已注入）：`www.deepseek.com/en/platform/`（ds-text-price 已注入，curl 可抓到价格数字）；
  - `JS_RENDERED_EMPTY`（客户端渲染但价格未注入）：`www.deepseek.com/platform/`（中文 platform 页 ds-text-price 为零，无实际价格内容）；
  - `SPA`（客户端完全渲染，curl 拿不到内容）：`static.deepseek.com/faq/index.html`、`chat.deepseek.com`；
  - `LOGIN_REQUIRED`：`platform.deepseek.com/*` 控制台内页面；
  - `API_AVAILABLE`：`api.deepseek.com/user/balance`（需 Bearer token）、`/models`、`/chat/completions`、`/responses`、`/anthropic/v1/messages`、`/files`、`/beta/completions`。
- **字段优先级提示**：
  - "Peak/Off-Peak 双价制"是 DeepSeek V4 起的**强制机制**，对"成本优化建议"是高价值信号（提示用户把任务调度到周末或夜间可降本 50%）；
  - "Cache Hit 仅 prefix 完全匹配"与 Anthropic/OpenAI 的"最长前缀匹配"不同，对"缓存利用率预测"是高价值信号；
  - "USD/CNY 两套独立价表（非固定汇率）"对"价格比较"是高价值信号——不能用 USD/CNY 7:1 直接换算；
  - "V4-Flash-Vision-Exp 图片按 384 tokens/image 限价"对"多模态成本测算"是高价值信号；
  - "Anthropic 兼容但不完整（Not Supported: document/search_result/redacted_thinking/code_execution/mcp/container）"对"现有 Claude 代码迁移 DeepSeek"是高价值信号；
  - "429 错误消息建议切换 OpenAI"对"多 vendor fallback 设计"是高价值信号。
- **监控点**：
  - `api-docs.deepseek.com/updates`（按日期条目，频繁更新）；
  - `api-docs.deepseek.com/quick_start/pricing` 与 `zh-cn/quick_start/pricing`（无时间戳，需自记抓取日期）；
  - `status.deepseek.com`（Jun 2026 - Sep 2026 滚动窗口）；
  - `deepseek.com/en/platform/` 与 `/platform/`（营销页文案与价格摘要）；
  - `cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html`（Last Update 2026-02-10）；
  - `cdn.deepseek.com/policies/en-US/deepseek-terms-of-use.html`（Last Update 2026-03-27）。
- **跨 Vendor 归一化注意**：
  - 不要把 DeepSeek "model id" 映射为 Cursor "Plan 层级"——DeepSeek 无订阅概念；
  - "Peak/Off-Peak 双价"≠ Anthropic "Priority Tier"（后者是 throughput pool，无加价）——DeepSeek Peak 价是 ×2 强制定价；
  - "DeepSeek Cache"≠ OpenAI "Prompt Cache"（前者需 prefix 完全匹配，后者按最长前缀自动）；
  - "DeepSeek Tool Calls strict" ≠ Anthropic "strict tool use"（DeepSeek 是 Beta + JSON Schema 校验；Anthropic 是 production GA）；
  - "DeepSeek 无 server tools（无 web_search / code_execution / containers）"≠ Anthropic "有" 或 OpenAI "有"——这是核心功能差异，需在 Schema 中标注 `has_server_tools: false`；
  - "DeepSeek Files API 仅 image + user_data" ≠ OpenAI "Files API 支持多用途"（assistants / vision / batch / fine-tune）——用途范围更窄。

---

## 7. 未解决问题

1. **官方支付渠道清单（支付宝 / 微信 / Stripe / 信用卡）**：官方页面（Privacy Policy + Terms + Platform 页 + API docs）均未列出；第三方汇总（ofox.ai / layer3labs）声称有支付宝和 Stripe，但**官方未公开确认**。需登录 platform.deepseek.com Top up 页才能确认。
2. **实名认证 / KYC 触发条件**：未在官方页面找到具体阈值或规则。
3. **退款政策 / 发票 / 增值税专用发票**：未在官方页面找到相关条款。
4. **企业销售联系邮箱**：`service@deepseek.com` 在中文 platform 页 React Flight payload 中存在但未直接以 mailto 形式呈现；`enterprise@deepseek.com` 的有效性未确认；飞书表单用于"申请更大并发"，不一定是销售联系。
5. **`POST /embeddings` / `POST /images` / OpenAI 其他兼容端点**：本次未在 API docs 侧边栏找到——DeepSeek 是否提供 embed 模型、image 生成模型、audio transcription 等**未确认**。
6. **FAQ 实质内容**：`static.deepseek.com/faq/index.html` 是 SPA，curl 抓不到；FAQ 分类按"category/N"路径组织（如 `/category/4`），实际内容需浏览器渲染。
7. **海外用户注册 / 充值的实际可行性**：Terms §1.5 留有保留声明，但未公开具体排除清单；Privacy Policy 含 EEA/CH/UK 补充条款暗示欧洲可用；**未找到任何"北美/欧洲/东南亚用户注册流程差异"的官方说明**。
8. **PRC 生成式 AI 服务管理办法合规声明**：DeepSeek 作为中国境内的生成式 AI 服务提供者，是否在 API 文档或 Privacy Policy 中有针对 PRC《生成式人工智能服务管理暂行办法》的合规声明——**未找到**（可能需要登录控制台或备案查询）。
9. **an`/static.deepseek.com/faq/...` 中 `index.html` 之外的分类页内容**：未抓到；具体分类（计费 / 退款 / 注册等）下的问题清单**未确认**。
10. **`user_id` 隔离的 per-uid 并发限额生效条件**：原文"For API users with **increased concurrency quotas**, we will limit the total concurrency under your account, and we will also impose concurrency limits on each `user_id`"——但**未说明"increased concurrency quotas"的具体触发条件**（是申请扩容后立即按 model × uid 限额？还是按其他规则？）。
11. **Peak/Off-Peak 在中国大陆法定节假日是否调整**：英文版与中文版均仅声明"周一至周五"，未说明法定节假日（如春节、国庆）是否仍按 weekday 高峰计费。
12. **第三方价格变动的"interim"快照价格**（如 archive.ph 2026-05-26 快照中标注的"75% off"是否对应官方某条公告）：archive.ph 快照显示"V4-Pro 75% off"，与当前定价页 cache hit $0.003625（标注"75% off (3)"）一致，但**官方 Change Log 没有"V4-Pro 75% off"的独立条目**——这意味着"75% off"是相对早期预览价的相对表述而非独立促销。归档时需注明这是相对表述。

---

## 附：本次调研已访问的关键 URL 速查

| 类别 | URL |
|---|---|
| API 文档定价页（英文 USD） | <https://api-docs.deepseek.com/quick_start/pricing> |
| API 文档定价页（中文 CNY） | <https://api-docs.deepseek.com/zh-cn/quick_start/pricing> |
| API 文档 Rate Limit | <https://api-docs.deepseek.com/quick_start/rate_limit> |
| API 文档 Error Codes | <https://api-docs.deepseek.com/quick_start/error_codes> |
| API 文档 Token Usage | <https://api-docs.deepseek.com/quick_start/token_usage> |
| API 文档 Thinking Mode | <https://api-docs.deepseek.com/guides/thinking_mode> |
| API 文档 Vision | <https://api-docs.deepseek.com/guides/vision> |
| API 文档 JSON Output | <https://api-docs.deepseek.com/guides/json_mode> |
| API 文档 Tool Calls | <https://api-docs.deepseek.com/guides/tool_calls> |
| API 文档 Files API | <https://api-docs.deepseek.com/guides/files_api> |
| API 文档 Context Caching | <https://api-docs.deepseek.com/guides/kv_cache> |
| API 文档 Responses API | <https://api-docs.deepseek.com/guides/responses_api> |
| API 文档 Anthropic API 兼容 | <https://api-docs.deepseek.com/guides/anthropic_api> |
| API 文档 Chat Prefix Completion (Beta) | <https://api-docs.deepseek.com/guides/chat_prefix_completion> |
| API 文档 FIM Completion (Beta) | <https://api-docs.deepseek.com/guides/fim_completion> |
| API 文档 Coding Agents 集成 | <https://api-docs.deepseek.com/guides/coding_agents> |
| API 文档 Claude Code 集成 | <https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code> |
| API 文档 Codex 集成 | <https://api-docs.deepseek.com/quick_start/agent_integrations/codex> |
| API 文档 Change Log | <https://api-docs.deepseek.com/updates> |
| API 文档 News: V4 Preview | <https://api-docs.deepseek.com/news/news260424> |
| API 文档 News: V4-Flash-Vision-Exp | <https://api-docs.deepseek.com/news/news260821> |
| API 参考 Chat Completions | <https://api-docs.deepseek.com/api/create-chat-completion> |
| API 参考 List Models | <https://api-docs.deepseek.com/api/list-models> |
| API 参考 Get User Balance | <https://api-docs.deepseek.com/api/get-user-balance> |
| 官网平台页（英文） | <https://www.deepseek.com/en/platform/> |
| 官网平台页（中文） | <https://www.deepseek.com/platform/> |
| 官网透明度中心 | <https://www.deepseek.com/en/transparency/> |
| 平台控制台（登录入口） | <https://platform.deepseek.com/> |
| 服务状态 | <https://status.deepseek.com/> |
| 服务历史 | <https://status.deepseek.com/history> |
| 隐私政策（英文） | <https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html> |
| 用户条款（英文） | <https://cdn.deepseek.com/policies/en-US/deepseek-terms-of-use.html> |
| 模型原理与训练方法（英文） | <https://cdn.deepseek.com/policies/en-US/model-algorithm-disclosure.html> |
| Cookie 政策（英文） | <https://cdn.deepseek.com/policies/en-US/cookies-policy.html> |
| DeepSeek Harness 文档 | <https://deepseek-harness.github.io/deepseek-harness/en/guide/quickstart> |
| Codex 一键安装脚本（Linux/macOS） | <https://cdn.deepseek.com/api-docs/codex-deepseek-setup-en.sh> |
| Codex 一键安装脚本（Windows） | <https://cdn.deepseek.com/api-docs/codex-deepseek-setup-en.ps1> |
| Awesome DeepSeek 集成 | <https://github.com/deepseek-ai/awesome-deepseek-integration/tree/main> |
| Balance API 实时端点 | <https://api.deepseek.com/user/balance> |
| FAQ（SPA） | <https://static.deepseek.com/faq/index.html?lang=en#/category/4> |
| 飞书企业大并发申请表单 | <https://trtgsjkv6r.feishu.cn/share/base/form/shrcnda9jNKvhyYr8xb843xLEzc> |

# 智谱开放平台 bigmodel.cn（中国区）官方信息来源调研 — API + Coding Plan

- **采集日期**：2026-09-07
- **调研范围**：
  - A. **智谱开放平台 API**（bigmodel.cn / open.bigmodel.cn / docs.bigmodel.cn，GLM-5.3/5.3-Flash/5.2/5.1/5/4.7/4.6/4.5/CogView-4/CogVideoX-3/Embedding-3 等），含 GLM-4.5/4.6 系列详细价格档（输入/输出/缓存分档）。
  - B. **bigmodel.cn 中国版 GLM Coding Plan + Claude Code 兼容订阅**（docs.bigmodel.cn/cn/coding-plan/*，含 Lite/Pro/Max 个人版 + 团队标准版/高级版 + 工具端点 + Anthropic 协议接入 + 限时活动）。
  - 与 z.ai 国际版的差异在 §6 集中列出（z.ai 侧主体调研已在 05-zhipu-glm-coding-plan.md 完成）。
- **方法**：仅使用一手官方来源——bigmodel.cn 营销页（JS 渲染，静态抓取仅 meta 与 loader）、open.bigmodel.cn 定价页（JS 渲染失败）+ docs.bigmodel.cn 文档站（Mintlify，`.md` 原文可直接抓取，含 llms.txt 全站目录）、官方公告页（`docs.bigmodel.cn/cn/coding-plan/notice/*`）。所有价格、积分、模型、错误码均来自 docs.bigmodel.cn 的 markdown 原文；营销页/订阅页价格通过 exa 官方页面快照核实（已在 URL 标注"exa 快照"）。第三方汇总站、媒体转载仅作为冲突佐证，不作为事实依据。

## 结论摘要

1. **bigmodel.cn API 是典型的 api-usage Plan Type**：按 token 计费（人民币 CNY），按"现金余额账户 / 资源包账户"双账户扣减，优先扣资源包；图像/视频/搜索模型按次收费；输入模态含文本、图片、视频、文件、音频；免费模型（GLM-4.7-Flash、GLM-4.5-Flash、GLM-4.6V-Flash、CogView-3-Flash、CogVideoX-Flash 等）以"模型编码 Free + GLM-4-Flash 系列"标识，价格表注明"限时免费"或"免费"或"0 元"（采集日 exa 快照）。
2. **官方定价页（open.bigmodel.cn/pricing、bigmodel.cn/pricing）JS 渲染无法静态抓取**，但 exa 抓到的页面快照给出完整模型价表（含 GLM-5 系列、CogView-4、CogVideoX-3 等）。本次未能静态抓取页内表格 → **以 exa 快照为"窗口内容已核实"标注，且与 docs.bigmodel.cn 模型页交叉核对模型上下文字段**。
3. **bigmodel.cn 上存在完整的 GLM Coding Plan 订阅产品**（编码套餐），与 z.ai 国际版共享同一文档体系（docs 站托管），但：
   - 文档站文档（`docs.bigmodel.cn/cn/coding-plan/*`）默认面向 bigmodel.cn（中国区）用户；
   - 套餐价格以**人民币**显示（Lite 连续包月 ¥94.4/月 / ¥118/月 标准；Pro ¥430.4/月 / ¥538/月；Max ¥862.4/月 / ¥1078/月；季/年折扣后 ¥118→¥94.4 约 8 折）。
   - Claude Code / Codex / Cline / Cursor 等 20+ 编程工具通过专属 Coding 端点（`https://open.bigmodel.cn/api/coding/paas/v4`）或 Anthropic 兼容端点（`https://open.bigmodel.cn/api/anthropic`）接入；
   - 积分制（与 z.ai 同：Model credit = (Input × Input mult + Cached × Cached mult + Output × Output mult) / 10000；GLM-5.3 乘数 6.9/1.7/24；GLM-5.3-Flash 乘数 2.3/0.56/8）；
   - 高峰时段（周一至周五 14:00–18:00 UTC+8）1×，非高峰 0.5×；
   - **2026-09-03 至 2026-09-20 限时活动**：每日 23:00–次日 09:00，ZCode 端 GLM-5.3-Flash 0 积分、其他 Agent ×2 积分（[夜间畅用活动公告](https://docs.bigmodel.cn/cn/coding-plan/notice/event-glm-5.3-flash.md)）。
4. **Claude Code 兼容接入**由 docs.bigmodel.cn 多页确认：Claude Code 通过 `ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic` 接入；服务端做模型映射（Claude Code UI 显示 "Claude 模型" 但实际调用 GLM-5.3 / GLM-5.3-Flash 等）；提供 Coding Tool Helper（`npx @z_ai/coding-helper`）一键安装。
5. **2026-07-30 套餐改版**：智谱与 z.ai 国际版**同日同步**推出"积分制"新版（个人 V2 老套餐可继续按 ¥49/¥149/¥469 包月、季 9折、年 8 折续订/升级至 2026-08 中旬迁移入口；V1 老套餐到期前可按 V2 价订阅；新用户直接买新版积分套餐）——见 [老用户权益说明](https://docs.bigmodel.cn/cn/coding-plan/notice/usage-revision.md)。
6. **中国 Availability（五个维度）**：
   - 注册：支持海外手机号 + 国内手机号 + 企业/个人认证 + 微信扫码登录（页面源码含 `res.wx.qq.com`），账号无登录端数量限制；
   - 支付：**明确支持支付宝与微信**（[充值协议 §5.1](https://docs.bigmodel.cn/cn/terms/recharge-agreement.md)）；企业公对公打款 + 个人/企业发票（增值税专用/普通发票）；
   - 网络访问：服务主域 `open.bigmodel.cn`、`docs.bigmodel.cn`、`bigmodel.cn`，官方未声明对中国大陆网络可达性的官方声明；
   - 服务政策：服务区域明确在中国境内；条款适用中华人民共和国大陆地区法律（北京海淀区法院管辖）；
   - 功能限制：实名认证不强制（FAQ 明示），企业认证可享企业权益；非工作时段额度限速（1302/1305/1308/1316/1317 等错误码）。

---

## 1. 官方入口清单

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 1 | <https://bigmodel.cn/pricing> | 营销站定价页 | 中国（CNY） | 无 | 否 | **重度客户端渲染**：curl 取得 3.9KB shell HTML，无正文表格 | 否（页面 JS 渲染失败）；**通过 exa 官方页面快照**核实价表关键句（见 §2） |
| 2 | <https://open.bigmodel.cn/pricing> | 开发者站定价页 | 中国（CNY） | 无 | 否 | **重度客户端渲染**：3.9KB shell HTML + loader 动画 | 否；**通过 exa 官方页面快照**核实 |
| 3 | <https://docs.bigmodel.cn/llms.txt> | 文档站全站目录 | 全球（中文） | 无 | 否 | 纯文本 | 是（全文） |
| 4 | <https://docs.bigmodel.cn/cn/guide/start/model-overview.md> | 模型概览（9 款核心 + 文本/视觉/图像/视频/语音/向量分类） | 中国 | 无 | 否 | 正常 `.md` 文本 | 是（全文） |
| 5 | <https://docs.bigmodel.cn/cn/guide/start/quick-start.md> | API 快速开始（注册→取 Key→调用） | 中国 | 无 | 否 | 正常 `.md` 文本 | 是（全文） |
| 6 | <https://docs.bigmodel.cn/cn/guide/start/concept-param.md> | 核心参数文档（max_tokens、temperature、thinking） | 中国 | 无 | 否 | 正常 | 是（关键段已核实） |
| 7 | <https://docs.bigmodel.cn/cn/guide/models/text/glm-5.3.md> | GLM-5.3 模型页（旗舰、1M 上下文、128K max output、thinking 三档） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 8 | <https://docs.bigmodel.cn/cn/guide/models/text/glm-4.6.md> | GLM-4.6 模型页（200K 上下文、对齐 Claude Sonnet 4） | 中国 | 无 | 否 | 正常 | 是（关键段） |
| 9 | <https://docs.bigmodel.cn/cn/guide/models/text/glm-4.5.md> | GLM-4.5 模型页（128K 上下文、价格 0.8/2 元） | 中国 | 无 | 否 | 正常 | 是（关键段） |
| 10 | <https://docs.bigmodel.cn/cn/guide/models/free/glm-4.7-flash.md> | GLM-4.7-Flash（免费模型页） | 中国 | 无 | 否 | 正常 | 是（关键段） |
| 11 | <https://docs.bigmodel.cn/cn/guide/models/vlm/glm-4.6v.md> | GLM-4.6V 模型页（视觉理解 + 原生 Function Calling） | 中国 | 无 | 否 | 正常 | 是（关键段） |
| 12 | <https://docs.bigmodel.cn/cn/guide/capabilities/function-calling.md> | Function Calling 文档（tool_choice 仅 auto） | 中国 | 无 | 否 | 正常 | 是（关键段） |
| 13 | <https://docs.bigmodel.cn/cn/guide/capabilities/cache.md> | 上下文缓存文档（自动隐式缓存） | 中国 | 无 | 否 | 正常 | 是（关键段） |
| 14 | <https://docs.bigmodel.cn/cn/guide/capabilities/struct-output.md> | 结构化输出文档（JSON 模式） | 中国 | 无 | 否 | 正常 | 是（关键段） |
| 15 | <https://docs.bigmodel.cn/cn/guide/tools/web-search.md> | 网络搜索 API 文档 | 中国 | 无 | 否 | 正常 | 是（关键段） |
| 16 | <https://docs.bigmodel.cn/cn/guide/tools/batch.md> | Batch API 文档（50% 折扣、50K req/file、100MB） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 17 | <https://docs.bigmodel.cn/cn/guide/tools/knowledge/price.md> | 知识库服务计费（Embedding 0.5 元/百万 tokens） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 18 | <https://docs.bigmodel.cn/cn/faq/fee-issues.md> | 费用问题 FAQ（计费方式、扣减顺序、token 单价） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 19 | <https://docs.bigmodel.cn/cn/faq/registration-login.md> | 注册/登录 FAQ（海外手机号、企业账号） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 20 | <https://docs.bigmodel.cn/cn/faq/authentication-issues.md> | 实名认证 FAQ（个人/企业/海外企业） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 21 | <https://docs.bigmodel.cn/cn/faq/api-code.md> / <https://docs.bigmodel.cn/cn/api/api-code.md> | 错误码文档（1113/1302/1305/1308/1309/1316/1317/1320/1321） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 22 | <https://docs.bigmodel.cn/cn/terms/recharge-agreement.md> | 充值协议（明确"目前支持支付宝和微信"） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 23 | <https://docs.bigmodel.cn/cn/coding-plan/overview.md> | Coding Plan 套餐概览（积分制、模型、5h/周双池） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 24 | <https://docs.bigmodel.cn/cn/coding-plan/quick-start.md> | Coding Plan 快速开始（含 Anthropic + OpenAI + Response 协议端点） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 25 | <https://docs.bigmodel.cn/cn/coding-plan/usage-notes.md> | Coding Plan 使用须知（并发、退款、自动续费） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 26 | <https://docs.bigmodel.cn/cn/coding-plan/faq.md> | Coding Plan FAQ（套餐详情、MCP、订阅管理） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 27 | <https://docs.bigmodel.cn/cn/coding-plan/team.md> | 团队版权益（标准版/高级版 积分） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 28 | <https://docs.bigmodel.cn/cn/coding-plan/latest-model.md> | 如何切换模型（Claude Code env 配置 GLM-5.3） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 29 | <https://docs.bigmodel.cn/cn/coding-plan/tool/claude> | Claude Code 接入指南（`npx @z_ai/coding-helper`） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 30 | <https://docs.bigmodel.cn/cn/coding-plan/tool/others.md> | 接入工具列表 | 中国 | 无 | 否 | 正常 | 是（导航项已核） |
| 31 | <https://docs.bigmodel.cn/cn/coding-plan/notice/usage-revision.md> | 老用户权益说明（V1/V2 套餐迁移、新版积分制） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 32 | <https://docs.bigmodel.cn/cn/coding-plan/notice/event-glm-5.3-flash.md> | 夜间畅用活动公告（2026-09-03 至 09-20） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 33 | <https://docs.bigmodel.cn/cn/guide/develop/claude/introduction.md> | Anthropic Messages 兼容文档（base_url 替换） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 34 | <https://docs.bigmodel.cn/cn/guide/develop/openai/introduction.md> | OpenAI Chat Completion 兼容文档 | 中国 | 无 | 否 | 正常 | 是（关键段） |
| 35 | <https://docs.bigmodel.cn/cn/api/rate-limit.md> | 速率限制文档（1302/1305 错误码） | 中国 | 无 | 否 | 正常 | 是（全文） |
| 36 | <https://www.bigmodel.cn/glm-coding>（`?plantype=individual` / `?plantype=team`） | 营销站订阅页（连续包月价 ¥94.4/¥118、¥430.4/¥538、¥862.4/¥1078） | 中国 | 无 | 购买需登录 | **重度客户端渲染**；**exa 官方页面快照**核实价表 | 否（curl 仅 shell HTML）；通过 exa 快照核实 |
| 37 | <https://open.bigmodel.cn/api/paas/v4> | API 端点（OpenAI Chat Completion 协议） | 中国 | API Key | — | HTTP API | 是（端点存在，已在文档中确认） |
| 38 | <https://open.bigmodel.cn/api/anthropic> | Anthropic Messages API 兼容端点（Claude Code 接入） | 中国 | API Key | — | HTTP API | 是（端点存在，已在文档中确认） |
| 39 | <https://open.bigmodel.cn/api/coding/paas/v4> | Coding Plan 专属 OpenAI 协议端点 | 中国 | Coding API Key | — | HTTP API | 是 |
| 40 | <https://open.bigmodel.cn/api/v1> | Coding Plan 专属 OpenAI Response 协议端点（Codex） | 中国 | Coding API Key | — | HTTP API | 是 |
| 41 | <https://bigmodel.cn/usercenter/proj-mgmt/apikeys> | API Key 管理（控制台内） | 中国 | 账号 | **是** | 控制台内，未直接抓取 | 否（以文档描述为准） |
| 42 | <https://bigmodel.cn/usercenter/auth> | 实名认证（控制台内） | 中国 | 账号 | **是** | 控制台内 | 否 |
| 43 | <https://bigmodel.cn/glm-coding>（含 `closedialog=true` / `ic=xxx`） | 营销站订阅入口（同 #36） | 中国 | 账号 | 购买需登录 | JS 渲染；exa 快照已核 | 否（curl）；通过 exa 快照核实 |

> **抓取状态总览**：open.bigmodel.cn/pricing、bigmodel.cn/pricing、www.bigmodel.cn/glm-coding 三页 JS 渲染无法静态抓取正文（HTML 仅含 loader）。docs.bigmodel.cn 全站可静态抓取原文（`.md` 后缀）。本调研把"营销页价表数值"标注为"exa 快照核实"，把"文档与公告的数值"标注为"docs.bigmodel.cn 全文"。其他第三方汇总站（priceai.cc、网易科技、SegmentFault）作为冲突佐证，**不作事实依据**。

---

## 2. 字段覆盖矩阵

状态标注：公开（页面直接可见）/ 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用。

### 2.1 API 部分（bigmodel.cn / open.bigmodel.cn）

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 文档或公告 | 智谱开放平台采用"用户账户"模式，按"用户权益等级"分配额度；Coding Plan 用户有独立的"套餐"维度（Lite/Pro/Max/团队标准版/团队高级版）。GLM Coding Plan 专属 API Key（"个人编程套餐 > 套餐概览"）、团队套餐 Key（"团队编程套餐 > 我的套餐"）——两类 Key 与平台通用 API Key 互不通用 | [FAQ](https://docs.bigmodel.cn/cn/coding-plan/faq.md)、[Coding Plan Quick Start](https://docs.bigmodel.cn/cn/coding-plan/quick-start.md) |
| Plan Type | 公开（判断） | **api-usage**（按 token / 按次计费）。官方明确区分两类：(1) "GLM Coding Plan 套餐额度与标准 API 是相互独立的，分别适用于不同的调用场景"，(2) 通用 API 走现金余额/资源包按量付费，Coding Plan 走积分制 | [FAQ §一](https://docs.bigmodel.cn/cn/coding-plan/faq.md) |
| 价格（核心文本模型） | 文档或公告（部分）+ exa 快照（部分） | **按上下文长度分档**（≤32K / 32K~128K / >128K）按"输入长度 + 输出长度"双轴分档。exa 官方页面快照核实（bigmodel.cn/pricing 营销页价表）：<br>• **GLM-4.7**：输入长度 [0, 32K) 输出 [0, 0.2K) **¥2/¥8**/M tokens；输入 [0, 32K) 输出 [0.2K+) **¥3/¥14**；输入 [32K, 200K) **¥4/¥16**；缓存存储 ¥0.4/¥0.6/¥0.8 每百万 tokens/小时；缓存命中读数另计<br>• **GLM-4.6V**（视觉）：输入 [0, 32K) **¥1/¥3**/M；输入 [32K, 128K) **¥2/¥6**；缓存存储 ¥0.2/¥0.4 每百万 tokens/小时<br>• **GLM-4.5-Air**：输入 [0, 32K) 输出 [0, 0.2K) **¥0.8/¥2**/M；输入 [0, 32K) 输出 [0.2K+) **¥0.8/¥6**；输入 [32K, 128K) **¥1.2/¥8**；缓存存储 ¥0.16/¥0.16/¥0.24 每百万 tokens/小时<br>• **GLM-4.5** 文档页确认 "API 调用价格低至输入 **0.8 元/百万 tokens**，输出 **2 元/百万 tokens**"<br>• **GLM-4 系列**（[open.bigmodel.cn/pricing exa 快照]）：GLM-4-Plus ¥5/M；GLM-4-Air ¥0.5/M；GLM-4-AirX ¥10/M；GLM-4-FlashX-250414 ¥0.1/M；GLM-4-Long ¥1/M；GLM-4-Assistant ¥5/M（Batch 5 折）<br>• **Cogview-3**（图像生成，按次）：¥0.02/1K tokens（旧单价，exa 快照）<br>• **免费模型**：GLM-4.7-Flash / GLM-4.5-Flash / GLM-4.6V-Flash / GLM-4.1V-Thinking-Flash / GLM-4V-Flash / CogView-3-Flash / CogVideoX-Flash 标注"免费"或"限时免费"<br>• 上下文缓存存储：exa 快照表内所有 GLM-4.5/4.6/4.7 系列写"限时免费"<br>• **Batch API** 一律 50% 折扣（GLM-4-Flash Batch 完全免费）<br>• **训练 / 微调**：GLM-4.5 32K ¥0.1/1K tokens（LoRA）；GLM-4.5-Air 32K ¥0.035/1K tokens（LoRA）；GLM-4.5 16K ¥0.125/1K tokens（Full）<br>• **模型部署（GPU）**：GLM-4.6 200K-fp8 ¥175/GPU Unit/Day；GLM-4.5 128K-fp8 ¥175/GPU Unit/Day；GLM-4.5-Air 128K-fp8 ¥100/GPU Unit/Day；其他 8K/128K 量化版本 ¥100/GPU Unit/Day | [GLM-4.5 文档页](https://docs.bigmodel.cn/cn/guide/models/text/glm-4.5.md)、[GLM-4.6 文档页](https://docs.bigmodel.cn/cn/guide/models/text/glm-4.6.md)、[费用问题 FAQ](https://docs.bigmodel.cn/cn/faq/fee-issues.md)、[GLM-4 文档](https://docs.bigmodel.cn/cn/guide/models/text/glm-4.md)、[知识库服务计费](https://docs.bigmodel.cn/cn/guide/tools/knowledge/price.md)、[bigmodel.cn/pricing exa 快照](https://bigmodel.cn/pricing) |
| 价格（视觉/图像/视频/向量） | 文档或公告（部分）+ exa 快照（部分） | **CogVideoX-3**：exa 快照中部分细节受限于 JS 渲染未抓全；**GLM-Image / Vidu Q1 / Vidu 2** 等按次计费，未在文档站给出官方单价（在定价页 JS 渲染），仅知识库文档载明"图像模型、视频模型、搜索模型按次收费，不消耗 tokens"——**本次未抓取完整单价表，exi 快照中仅有 GLM-4 系列 + Cogview-3 + GLM-4.5/4.6/4.7/4.6V/4.5-Air 五档可读**<br>**Embedding-3 / Embedding-3-pro / Embedding-2 / Embedding-Multimodal**：¥0.5/百万 tokens（[知识库服务计费](https://docs.bigmodel.cn/cn/guide/tools/knowledge/price.md)）<br>**GLM-rerank-pro / GLM-rerank**：¥0.8/百万 tokens；**bge-reranker-large**：免费<br>**深度解析**：¥0.12/页<br>**知识库存储**：1 GB 免费，超出 **¥0.04/GB/小时** | [费用问题 FAQ](https://docs.bigmodel.cn/cn/faq/fee-issues.md)、[知识库服务计费](https://docs.bigmodel.cn/cn/guide/tools/knowledge/price.md) |
| 币种 | 公开 | **人民币 CNY（¥）**；所有 API 价格以 ¥ 标示，套餐页与文档页一致 | 全部价表 |
| 计费周期 | 文档或公告 | (1) **API 用量**：按 token 实时计费，无月度配额，按"现金余额账户"或"资源包账户"扣减；(2) **Coding Plan**：包月/包季 9 折/包年 8 折；(3) **资源包**：充值后无有效期、不可叠加延期，可叠加使用（[充值协议 §6.3](https://docs.bigmodel.cn/cn/terms/recharge-agreement.md)）；(4) **5 小时 / 周双池**（Coding Plan 积分：5h 动态刷新 / 周 自下单起 7 天周期） | [Coding Plan 概览](https://docs.bigmodel.cn/cn/coding-plan/overview.md)、[充值协议](https://docs.bigmodel.cn/cn/terms/recharge-agreement.md) |
| 额度/使用限制 | 文档或公告 | (1) **Rate limit 错误码 1302**："您的账户已达到速率限制，请您控制请求频率"；**错误码 1305**："该模型当前访问量过大，请您稍后再试"；**错误码 1308**："已达到 `${number} ${unit}` 的使用上限。您的限额将在 `${next_flush_time}` 重置"；**1309**："您的 GLM Coding Plan 套餐已到期"；**1316/1317**："5 小时/7 天超额 + 主账号余额不足"；**1318-1321**："团队子账号/企业超额"；**1301**："输入或生成内容可能包含不安全或敏感内容"；**1113**："您的账户已欠费，请充值后重试"<br>(2) **Coding Plan**：个人 Lite 2,000/10,000 credits（5h/周）、Pro 12,000/60,000、Max 28,000/140,000；团队标准版 15,000/66,000；团队高级版 35,000/155,000<br>(3) **官方说明**："GLM Coding Plan 用户按订阅套餐等级统一并发，**暂不支持申请调整**"；通用 API 用户可在控制台提交调整申请，"10 个工作日内完成审核"<br>(4) **Batch 文件限制**：单文件最多 **50,000 请求**，文件 ≤ **100 MB**，每 batch 仅 1 个模型；每个请求必须含 `custom_id`<br>(5) **知识库存储**：1 GB 免费，超出按 ¥0.04/GB/小时；欠费 1–7 天暂停服务，7 天后数据列入删除计划 | [错误码文档](https://docs.bigmodel.cn/cn/coding-plan/faq.md)、[API 错误码](https://docs.bigmodel.cn/cn/coding-plan/notice/usage-revision.md)（亦见 §5 [速率限制文档](https://docs.bigmodel.cn/cn/api/rate-limit.md)）、[批量处理文档](https://docs.bigmodel.cn/cn/guide/tools/batch.md)、[知识库计费](https://docs.bigmodel.cn/cn/guide/tools/knowledge/price.md) |
| 模型与功能 | 公开 | **文本模型（当前在售）**：GLM-5.3（1M 上下文、128K 输出、思考三档 low/high/max）、GLM-5.3-Flash（原生多模态、1M 上下文）、GLM-5.2、GLM-5.1、GLM-5、GLM-5-Turbo、GLM-4.7、GLM-4.7-FlashX、GLM-4.6、GLM-4.5-Air、GLM-4.5-AirX、GLM-4-Long（1M ctx/4K out）、GLM-4-FlashX-250414、GLM-4-Flash-250414<br>**免费文本模型**：GLM-4.7-Flash、GLM-4.5-Flash（即将下线）、GLM-4-Flash-250414<br>**视觉理解模型**：GLM-5V-Turbo、GLM-4.6V、GLM-4.6V-FlashX、GLM-4.1V-Thinking-FlashX、AutoGLM-Phone；**免费**：GLM-4.6V-Flash、GLM-4.1V-Thinking-Flash、GLM-4V-Flash<br>**图像生成**：CogView-4、CogView-3-Flash（免费）<br>**视频生成**：CogVideoX-3、Vidu Q1、Vidu 2、CogVideoX-Flash（免费）<br>**音视频**：GLM-TTS、GLM-ASR-2512、GLM-Realtime、GLM-4-Voice、GLM-TTS-Clone<br>**向量与其他**：Embedding-3、Embedding-2、CodeGeeX-4、Rerank | [模型概览](https://docs.bigmodel.cn/cn/guide/start/model-overview.md)、[GLM-5.3 模型页](https://docs.bigmodel.cn/cn/guide/models/text/glm-5.3.md)、[GLM-4.6V 模型页](https://docs.bigmodel.cn/cn/guide/models/vlm/glm-4.6v.md) |
| 上下文长度 | 公开 | GLM-5.3 / GLM-5.3-Flash / GLM-5.2 / GLM-5 / GLM-5.1 / GLM-5-Turbo / GLM-4.7 / GLM-4.7-FlashX / GLM-4.6 = **200K**；GLM-5.3 / 5.3-Flash / 5.2 = **1M**；GLM-4.5-Air / 4.5-AirX / 4-FlashX-250414 / 4.7-FlashX = **128K**；GLM-4-Long = **1M**；GLM-4.6V / 4.6V-FlashX = **128K**；GLM-4.1V-Thinking-FlashX = **64K**；GLM-OCR 单图 ≤10MB / PDF ≤50MB / 最大 100 页；AutoGLM-Phone 20K；CodeGeeX-4 = **128K**；Embedding-3 / Embedding-2 = **8K**；GLM-4.6V-Flash 128K；GLM-4V-Flash 16K | [模型概览](https://docs.bigmodel.cn/cn/guide/start/model-overview.md) |
| 最大输出 Tokens | 公开 | GLM-5.3 / 5.3-Flash / 5.2 / 5.1 / 5 / 5-Turbo / 4.7 / 4.7-FlashX / 4.6 = **128K**；GLM-4.5-Air / 4.5-AirX / 4-FlashX-250414 = **96K**（GLM-4.5 文档）/ **16K**（GLM-4-FlashX-250414 文档为 16K，存在文档口径差异）；GLM-4-Long = **4K**；GLM-4.6V = **32K**（FlashX/Flash = 32K/16K）；GLM-4.6V-Flash = **32K**；GLM-4.1V-Thinking-FlashX = **16K**；GLM-4V-Flash = **1K**；CodeGeeX-4 = **32K**；AutoGLM-Phone = **2048**；GLM-4-Plus/Air/AirX/Flash/FlashX = 动态计算 / 4095 | [模型概览](https://docs.bigmodel.cn/cn/guide/start/model-overview.md) |
| 速率限制（RPM/TPM/QPS） | 文档或公告 | 官方文档**未公布数值化 RPM/TPM/QPS**。错误码 1302 触发"用户速率限制"，错误码 1305 触发"平台服务过载"。**Lite 建议单项目并发**；**Pro 1–2 个项目并发**；**Max 2+ 个项目并发**；**团队标准版 1–2**；**团队高级版 2+**（动态调整，低峰期动态提升） | [速率限制文档](https://docs.bigmodel.cn/cn/api/rate-limit.md)、[使用须知](https://docs.bigmodel.cn/cn/coding-plan/usage-notes.md) |
| 并发 | 文档或公告（定性）+ 无法确认（具体值） | 同上；官方**未公布每用户最大并发连接数**或并行会话数；推荐并发"项目数"是产品侧建议而非硬性上限 | [使用须知](https://docs.bigmodel.cn/cn/coding-plan/usage-notes.md) |
| 隐私/数据处理 | 文档或公告 | (1) **Coding Plan 团队版**："**数据默认不用于模型训练**：提交的代码、提示词、对话内容等不会用于模型训练"——这是 bigmodel.cn 上**唯一明确的数据训练承诺**（[团队版权益](https://docs.bigmodel.cn/cn/coding-plan/team.md)）；个人 Coding Plan 是否用于训练：**未在文档明示**<br>(2) **知识库存储欠费**：欠费 1–7 天暂停服务、数据安全保留；超 7 天系统将删除超出 1 GB 的部分（保留最近上传 1 GB），数据删除前 24 小时通知<br>(3) **API Key 删除后**："该 API Key 将无法再次成功调用接口，也不会产生扣费"<br>(4) **Batch 文件**：系统只保留数据 **30 天**，过期自动删除不可恢复 | [团队版权益](https://docs.bigmodel.cn/cn/coding-plan/team.md)、[知识库计费](https://docs.bigmodel.cn/cn/guide/tools/knowledge/price.md)、[费用问题 FAQ](https://docs.bigmodel.cn/cn/faq/fee-issues.md)、[批量处理](https://docs.bigmodel.cn/cn/guide/tools/batch.md) |
| 注册要求 | 文档或公告 | (1) **手机号**：支持海外手机号 + 中国大陆手机号（注册时选择国家区号 + 短信验证）；(2) **个人认证**：人脸识别即时通过；(3) **企业认证**：法人人脸识别 / 营业执照授权 7 个工作日；**企业对公打款最快 30 分钟**；(4) **海外企业**：可在实名认证页选择"海外企业"并提交材料；(5) **多端登录**：账号"支持多端同时登录，目前没有登录端数量限制"；(6) **实名认证不强制**：FAQ 明示"目前调用 API 并不强制要求实名认证"；(7) **API Key 管理**：`bigmodel.cn/usercenter/proj-mgmt/apikeys` | [注册登录 FAQ](https://docs.bigmodel.cn/cn/faq/registration-login.md)、[实名认证 FAQ](https://docs.bigmodel.cn/cn/faq/authentication-issues.md) |
| 支付方式 | 文档或公告 | **明确支持**：**支付宝、微信**（[充值协议 §5.1](https://docs.bigmodel.cn/cn/terms/recharge-agreement.md)："用户充值可以选择智谱科技认可的第三方支付企业（目前支持支付宝和微信）支付充值金额"）；**企业**：对公打款（30 分钟内到账，认证通过后）；**Coding Plan 续费扣款顺序**：优先赠金余额 → 现金余额 → 绑定的第三方支付方式（微信/支付宝）；**大额订阅（团队）**：可"先通过公对公打款将金额充值至智谱开放平台账户余额，再使用账户余额完成支付"；也可"通过支付宝支持的余额、企业网银转账等方式" | [充值协议](https://docs.bigmodel.cn/cn/terms/recharge-agreement.md)、[Coding Plan FAQ](https://docs.bigmodel.cn/cn/coding-plan/faq.md)、[使用须知](https://docs.bigmodel.cn/cn/coding-plan/usage-notes.md) |
| 地区政策 | 文档或公告 | (1) **协议适用法**："本协议适用**中华人民共和国大陆地区法律**。用户如因本协议与智谱科技发生争议的，双方应首先友好协商解决，如协商不成的，该等争议将由**北京市海淀区人民法院**管辖"<br>(2) **海外用户**：支持海外手机号 + 海外企业认证<br>(3) **官方未给出"国家/地区准入清单"**（与 Anthropic/Gemini 的 supported-countries 页不同），仅在用户协议层面定法律适用区 | [充值协议 §十](https://docs.bigmodel.cn/cn/terms/recharge-agreement.md)、[注册登录 FAQ](https://docs.bigmodel.cn/cn/faq/registration-login.md)、[实名认证 FAQ](https://docs.bigmodel.cn/cn/faq/authentication-issues.md) |
| 官方购买链接 | 公开 | (1) **API Key 管理**：[bigmodel.cn/usercenter/proj-mgmt/apikeys](https://bigmodel.cn/usercenter/proj-mgmt/apikeys)<br>(2) **实名认证**：[bigmodel.cn/usercenter/auth](https://bigmodel.cn/usercenter/auth)<br>(3) **Coding Plan 个人版**：[bigmodel.cn/glm-coding](https://bigmodel.cn/glm-coding)（含 `plantype=individual`）<br>(4) **Coding Plan 团队版**：[bigmodel.cn/glm-coding?plantype=team](https://bigmodel.cn/glm-coding?plantype=team)<br>(5) **API 文档入口**：[docs.bigmodel.cn](https://docs.bigmodel.cn)<br>(6) **财务总览**：[open.bigmodel.cn/finance/overview](https://open.bigmodel.cn/finance/overview)<br>(7) **费用账单**：[open.bigmodel.cn/finance/expensebill/list](https://open.bigmodel.cn/finance/expensebill/list?active=detail)<br>(8) **导出账单**：[open.bigmodel.cn/finance/exportrecord](https://open.bigmodel.cn/finance/exportrecord)<br>(9) **资源包管理**：[open.bigmodel.cn/finance/resourcepack](https://open.bigmodel.cn/finance/resourcepack) | 全部来自 docs.bigmodel.cn 文档页链接 |
| 编程能力（Function Calling / Structured Output / Code Interpreter / MCP） | 文档或公告 | (1) **Function Calling**：支持 `tools` 参数 + `tool_choice="auto"`（"默认且仅支持 `auto`"）<br>(2) **结构化输出**：`response_format={"type": "json_object"}` 启用 JSON 模式<br>(3) **上下文缓存**：**自动隐式缓存**（"隐式缓存，智能识别重复的上下文内容，无需手动配置"），**响应字段** `usage.prompt_tokens_details.cached_tokens`；支持 GLM-5.2/5.1/5 系列等"所有主流模型"<br>(4) **批量处理**：Batch API 50% 折扣（GLM-4-Flash 免费）、50K req/file、100MB、24h SLA、超 7 天自动取消、30 天后文件过期删除<br>(5) **联网搜索**（Web Search API）：意图增强检索、结构化输出、多引擎（自研+搜狗+夸克），`search_engine="search_pro"`、`count` 1-50、`search_recency_filter="noLimit"` 等参数；MCP 服务 `https://open.bigmodel.cn/api/mcp-broker/proxy/web-search/mcp?Authorization=...`<br>(6) **思考模式**：`thinking.type=enabled` 启用深度思考（GLM-5.3 仅支持 enabled，不可 disabled；`reasoning_effort=low|high|max` 默认 max）；旧版本可用 `thinking.type=disabled`（GLM-5.2 及以下），GLM-5.3 强制 always-on<br>(7) **工具流式输出**：支持<br>(8) **MCP 工具**：Coding Plan 含视觉理解 MCP（GLM-4.6V）、联网搜索 MCP、网页读取 MCP、开源仓库 MCP（zread）<br>(9) **未提供独立"Code Interpreter"工具**（与 Anthropic Code Execution / OpenAI Code Interpreter Tool 不同）——Coding Agent 任务由 GLM-4.6V（视觉）+ 编程模型 + MCP 工具组合实现；GLM 在终端/Coding Agent 场景**未列出独立的 Sandbox/Code Interpreter 定价** | [Function Calling](https://docs.bigmodel.cn/cn/guide/capabilities/function-calling.md)、[结构化输出](https://docs.bigmodel.cn/cn/guide/capabilities/struct-output.md)、[上下文缓存](https://docs.bigmodel.cn/cn/guide/capabilities/cache.md)、[批量处理](https://docs.bigmodel.cn/cn/guide/tools/batch.md)、[联网搜索](https://docs.bigmodel.cn/cn/guide/tools/web-search.md)、[GLM-5.3 模型页](https://docs.bigmodel.cn/cn/guide/models/text/glm-5.3.md) |
| 官方 API（用量可见性） | 官方 API + 需登录 | (1) **财务总览** 控制台页：`open.bigmodel.cn/finance/overview`（今日消费 + 近 6 个月统计）<br>(2) **费用账单** 控制台页：`open.bigmodel.cn/finance/expensebill/list`<br>(3) **导出账单** 控制台页：`open.bigmodel.cn/finance/exportrecord`<br>(4) **资源包** 控制台页：`open.bigmodel.cn/finance/resourcepack`<br>(5) **Coding Plan 用量统计** 控制台页（"用量统计"）；团队版另有"我的套餐"页<br>(6) **API 端点**：`https://open.bigmodel.cn/api/paas/v4/batches`（Batch 创建）、`/files`（文件上传删除）、`/batches/{batch_id}`（查询）<br>(7) **本次未发现公开的"用量 / 费用"只读 REST API 文档**（仅控制台页可见） | [费用问题 FAQ](https://docs.bigmodel.cn/cn/faq/fee-issues.md)、[批量处理文档](https://docs.bigmodel.cn/cn/guide/tools/batch.md) |
| 更新时间 | 文档或公告 | **docs.bigmodel.cn 文档页**：部分页面带"Last updated"标记（如 GLM-4.5 文档已含版本信息），但 Mintlify 默认不显示采集日期；**公告页**：标注"发布时间"或日期（如老用户权益说明标注"发布时间：2026 年 7 月 30 日"；夜间畅用活动标注"2026 年 9 月 3 日至 2026 年 9 月 20 日"）；**开放平台主要定价页（open.bigmodel.cn/pricing、bigmodel.cn/pricing、www.bigmodel.cn/glm-coding）**：**均不显示"Last updated"时间戳**（静态抓取失败，由采集方记录抓取日期） | 各页 |

### 2.2 Coding Plan 部分（bigmodel.cn 中国版）

> 已在 05-zhipu-glm-coding-plan.md §6 列为"未决项"。本次补齐。

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| 产品存在性 | 公开 | **存在**：bigmodel.cn 上有完整的 **GLM Coding Plan 订阅套餐**（与 z.ai 国际版功能对等），位于 [bigmodel.cn/glm-coding](https://bigmodel.cn/glm-coding)；docs.bigmodel.cn/cn/coding-plan/* 文档站为其官方产品文档 | [Coding Plan 概览](https://docs.bigmodel.cn/cn/coding-plan/overview.md)、[订阅页 exa 快照](https://www.bigmodel.cn/glm-coding) |
| Plan 标识与名称 | 公开 | 个人：**Lite / Pro / Max**；团队：**标准版 / 高级版**（团队标准版/高级版为 docs 站表述，订阅页显示"团队标准版"/"团队高级版"） | [Coding Plan 概览](https://docs.bigmodel.cn/cn/coding-plan/overview.md)、[团队版权益](https://docs.bigmodel.cn/cn/coding-plan/team.md) |
| Plan Type | 公开（判断） | **coding-subscription**（仅限"官方支持的指定工具与产品环境"中使用，不可用于自建应用/API 集成） | [Coding Plan 概览](https://docs.bigmodel.cn/cn/coding-plan/overview.md)、[FAQ](https://docs.bigmodel.cn/cn/coding-plan/faq.md) |
| 价格（个人版，连续包月） | exa 官方页面快照 | **Lite ¥94.4/月（包季 9 折/包年 8 折后）/ ¥118/月 标准价**（订阅页 exa 快照原文："¥ 94.4/月 ¥ 118/月"）<br>**Pro ¥430.4/月（折后）/ ¥538/月**（"6 倍 Lite 用量额度"）<br>**Max ¥862.4/月（折后）/ ¥1078/月**（"14 倍 Lite 用量额度"）<br>"选择适合您的 GLM Coding Plan 套餐，包季/包年订阅享优惠折扣" | [bigmodel.cn/glm-coding exa 快照](https://www.bigmodel.cn/glm-coding) |
| 价格（个人版，V2 老套餐过渡价） | 文档或公告 | 老用户可按 V2 价续订：**Lite 包月 ¥49 / 包季 ¥44.1 / 包年 ¥39.2**；**Pro 包月 ¥149 / 包季 ¥134.1 / 包年 ¥119.2**；**Max 包月 ¥469 / 包季 ¥422.1 / 包年 ¥375.2**（"9 折"/"8 折"折扣） | [老用户权益说明](https://docs.bigmodel.cn/cn/coding-plan/notice/usage-revision.md) |
| 价格（团队版） | 文档或公告 | 团队"标准版"和"高级版"按"席位"计价；**最少 2 个席位起购，无上限**；连续订阅仅支持订阅金额 ≤ 3 万元，超出须按月/按年购买 | [团队版权益](https://docs.bigmodel.cn/cn/coding-plan/team.md) |
| 币种 | 公开 | **人民币 CNY（¥）** | [订阅页 exa 快照](https://www.bigmodel.cn/glm-coding) |
| 计费周期 | 文档或公告 | (1) **订阅**：包月/包季/包年，自动续费；(2) **积分双池**：5 小时积分（动态刷新，从"消费发生"起 5h）+ 周积分（自下单起 7 天周期）；(3) **取消**：至少在下一扣费日前 **3 天**取消；退款："订阅服务一经购买即视为确认，**不支持退款**" | [使用须知](https://docs.bigmodel.cn/cn/coding-plan/usage-notes.md)、[Coding Plan FAQ](https://docs.bigmodel.cn/cn/coding-plan/faq.md) |
| 额度/使用限制 | 文档或公告 | (1) **个人 Lite/Pro/Max 5h/周**：2,000/10,000；12,000/60,000；28,000/140,000<br>(2) **团队标准版/高级版**：15,000/66,000；35,000/155,000<br>(3) **周积分刷新**："自套餐下单时起，以 7 天为一个周期刷新"<br>(4) **Token 估算**（缓存命中率 95%）：Lite 0.48~0.97 亿 tokens/周（GLM-5.3），Pro 2.90~5.80 亿；Max 6.76~13.52 亿<br>(5) **使用场景限制**："GLM Coding Plan 仅限在官方支持的指定工具与产品环境中使用"；官网体验中心不支持使用编码套餐<br>(6) **未用完不延续**：再次购买/升级，旧套餐作废，剩余时间作为现金价值计算<br>(7) **超额**（团队版可开启超额按量付费）：API 刊例价 9 折 | [Coding Plan 概览](https://docs.bigmodel.cn/cn/coding-plan/overview.md)、[团队版权益](https://docs.bigmodel.cn/cn/coding-plan/team.md)、[FAQ](https://docs.bigmodel.cn/cn/coding-plan/faq.md) |
| 模型与功能 | 公开 | **当前**：GLM-5.3、GLM-5.3-Flash（"已面向全量用户（Max & Pro & Lite）支持"）；**历史模型**：GLM-5.2/5.1 请求"自动切换至 GLM-5.3"；GLM-5-Turbo、GLM-4.7 "将自动切换至 GLM-5.3-Flash"；**多模态/工具**：GLM-4.6V（视觉理解 MCP）、联网搜索 MCP、网页读取 MCP、开源仓库 MCP（zread）、**GLM in Excel（Beta）**、**ZCode**（"面向 Long Horizon Task 的全功能 ADE"） | [Coding Plan 概览](https://docs.bigmodel.cn/cn/coding-plan/overview.md)、[夜间畅用活动](https://docs.bigmodel.cn/cn/coding-plan/notice/event-glm-5.3-flash.md) |
| 上下文长度 | 无法确认 | Coding Plan 文档未给出模型上下文窗口数值（需要查模型文档） | — |
| 速率限制（并发） | 文档或公告（定性） | "速率（并发数）限制与您的套餐等级相关，平台会根据资源进行动态调整，基本原则 Max > Pro > Lite"；"Lite 建议单项目；Pro 1-2 个项目；Max 2+ 个项目"；"低峰期享有更高速率（动态提升）" | [使用须知](https://docs.bigmodel.cn/cn/coding-plan/usage-notes.md)、[速率限制文档](https://docs.bigmodel.cn/cn/api/rate-limit.md) |
| 限时活动 | 公告 | **夜间畅用活动（2026-09-03 至 2026-09-20）**：每日 23:00 至次日 09:00，ZCode 端 GLM-5.3-Flash **积分消耗 = 0**；其他 Agent 中 GLM-5.3-Flash 可用额度 **×2 倍**；仅 GLM-5.3-Flash 模型参与；已满 5h/周上限暂停活动 | [夜间畅用活动](https://docs.bigmodel.cn/cn/coding-plan/notice/event-glm-5.3-flash.md) |
| 适用工具 | 公开 | **ZCode**（官方 ADE）、**Claude Code**（智能终端编码助手）、**Codex**（OpenAI）、**Cline**（VS Code）、**OpenCode**（开源）、**Roo Code**（轻量）、**Kilo Code**（高性能）、**Cursor**（AI IDE）、**TRAE**、**CodeBuddy**；"其它 Coding 工具支持持续扩展中" | [快速开始](https://docs.bigmodel.cn/cn/coding-plan/quick-start.md) |
| 接入端点（官方协议） | 公开 | **Anthropic Messages**：`https://open.bigmodel.cn/api/anthropic`（Claude Code / Goose）<br>**OpenAI Chat Completion**：`https://open.bigmodel.cn/api/coding/paas/v4`（Cline / Roo Code / OpenCode / Kilo Code / Cursor 等）<br>**OpenAI Response**：`https://open.bigmodel.cn/api/v1`（Codex）<br>**Cherry Studio**：`https://open.bigmodel.cn/api/coding/paas/v4/` | [快速开始](https://docs.bigmodel.cn/cn/coding-plan/quick-start.md)、[Claude Code 接入](https://docs.bigmodel.cn/cn/coding-plan/tool/claude)、[如何切换模型](https://docs.bigmodel.cn/cn/coding-plan/latest-model.md) |
| Anthropic 兼容性 | 文档或公告 | "智谱提供与 Claude API 兼容的接口，您可以使用现有的 Anthropic SDK 代码，只需要简单修改 API 密钥和基础 URL，就能无缝切换到智谱的模型服务"；模型编码使用智谱模型（如 `glm-5.3`）；"现有 Claude 应用如 Claude Code 等可以快速迁移到智谱平台" | [Claude API 兼容文档](https://docs.bigmodel.cn/cn/guide/develop/claude/introduction.md) |
| Claude Code 1M 上下文 | 文档或公告 | 在 `settings.json` 添加 `"CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000"` + `glm-5.3[1m]` / `glm-5.3-flash[1m]` 模型后缀启用 1M 上下文；支持 effort 切换（输入 `/effort`）；"thinking.type 未传、true、enabled、adaptive → max" | [如何切换模型](https://docs.bigmodel.cn/cn/coding-plan/latest-model.md) |
| 团队版企业能力 | 文档或公告 | (1) 组织席位与权限；(2) 用量与研发效能监测；(3) 超额按量付费（API 刊例价 9 折）+ 预算控制；(4) 集中账单 + 企业专票（"完成企业认证即可开具企业专票"）；(5) IP 白名单；(6) **数据默认不用于模型训练**；(7) 高级版首发接入最新旗舰模型 + 高峰期资源优先保障 | [团队版权益](https://docs.bigmodel.cn/cn/coding-plan/team.md) |
| 退款政策 | 文档或公告 | "订阅服务一经购买即视为确认，不支持退款。即使您未使用完套餐，费用也无法退回" | [FAQ](https://docs.bigmodel.cn/cn/coding-plan/faq.md) |
| 升级规则 | 文档或公告 | 在订阅管理中"升级"，**支付差额后立即生效**；再次购买/升级编码套餐时，"把之前的套餐作废，之前套餐未使用时间会作为现有套餐剩余价值，计算到您的再次购买中" | [FAQ](https://docs.bigmodel.cn/cn/coding-plan/faq.md) |
| 席位规则（团队） | 文档或公告 | 2 个席位起购；不支持多人共用同一席位；不支持团队标准版和高级版混合购买；"在套餐权益有效期内管理员可以重新分配席位"；席位的有效期与套餐权益有效期一致；不支持从标准版升级到高级版 | [团队版权益](https://docs.bigmodel.cn/cn/coding-plan/team.md) |
| 个人信息处理 | 文档或公告 | 团队版"**数据默认不用于模型训练**"；个人版未明示 | [团队版权益](https://docs.bigmodel.cn/cn/coding-plan/team.md) |
| 注册要求 | 文档或公告 | 与 API 用户共用账号体系；通过 [bigmodel.cn](https://bigmodel.cn) 注册 → 在 [个人中心 → API Keys](https://bigmodel.cn/usercenter/proj-mgmt/apikeys) 创建 API Key → 在 [个人编程套餐 > 套餐概览](https://bigmodel.cn/glm-coding) 创建 Coding Plan 专属 API Key；实名认证不强制但建议；企业认证可享企业版 Coding Plan 与专票 | [Coding Plan 快速开始](https://docs.bigmodel.cn/cn/coding-plan/quick-start.md) |
| 支付方式 | 文档或公告 | **个人**：微信、支付宝、账户余额（现金/赠金）、对公打款<br>**团队**：可"先通过公对公打款将金额充值至账户余额，再使用账户余额完成支付"；可"通过支付宝支持的余额、企业网银转账等方式" | [充值协议](https://docs.bigmodel.cn/cn/terms/recharge-agreement.md)、[Coding Plan FAQ](https://docs.bigmodel.cn/cn/coding-plan/faq.md)、[团队版权益](https://docs.bigmodel.cn/cn/coding-plan/team.md) |
| 发票 | 文档或公告 | 企业认证完成后"即可开具企业专票"；Coding Plan 个人订阅："订阅服务一经购买即视为确认，不支持退款。即使您未使用完套餐，费用也无法退回" | [团队版权益](https://docs.bigmodel.cn/cn/coding-plan/team.md) |
| 地区政策 | 文档或公告 | 服务主域 bigmodel.cn / open.bigmodel.cn / docs.bigmodel.cn 全部部署于中国大陆（CDN `static.bigmodel.cn`、`z-cdn.chatglm.cn`），适用中华人民共和国大陆地区法律；**官方未给出"国家/地区准入清单"**；FAQ 显示"支持海外手机号"和"支持海外企业认证"——意味着海外用户**可注册并付费** | [充值协议](https://docs.bigmodel.cn/cn/terms/recharge-agreement.md)、[注册登录 FAQ](https://docs.bigmodel.cn/cn/faq/registration-login.md) |
| 官方购买链接 | 公开 | 个人版 [bigmodel.cn/glm-coding](https://bigmodel.cn/glm-coding)；团队版 [bigmodel.cn/glm-coding?plantype=team](https://bigmodel.cn/glm-coding?plantype=team)；售前咨询微信扫码 | [Coding Plan 概览](https://docs.bigmodel.cn/cn/coding-plan/overview.md)、[团队版权益](https://docs.bigmodel.cn/cn/coding-plan/team.md) |
| 与 z.ai 国际版的差异 | 公开 | 见 §6 | docs.bigmodel.cn + docs.z.ai |

---

## 3. 价格/额度的原始表达方式与归一化歧义

### 3.1 官方原始表述（照录）

#### A. API 部分

- **价格表（exa 官方页面快照，原文照录）**：
  - "GLM-4.7 | 输入长度 [0, 32) 输出长度 [0, 0.2) | **2元** | **8元** | 限时免费 | **0.4元** | 文本"
  - "GLM-4.7 | 输入长度 [0, 32) 输出长度 [0.2+) | **3元** | **14元** | 限时免费 | **0.6元** | 文本"
  - "GLM-4.7 | 输入长度 [32, 200) | **4元** | **16元** | 限时免费 | **0.8元** | 文本"
  - "GLM-4.6V | 输入长度 [0, 32) | **1元** | **3元** | 限时免费 | **0.2元**"
  - "GLM-4.6V | 输入长度 [32, 128) | **2元** | **6元** | 限时免费 | **0.4元**"
  - "GLM-4.5-Air | 输入长度 [0, 32) 输出长度 [0, 0.2) | **0.8元** | **2元** | 限时免费 | **0.16元**"
  - "GLM-4.5-Air | 输入长度 [0, 32) 输出长度 [0.2+) | **0.8元** | **6元** | 限时免费 | **0.16元**"
  - "GLM-4.5-Air | 输入长度 [32, 128) | **1.2元** | **8元** | 限时免费 | **0.24元**"
  - 表头："模型名称 | 上下文 (千tokens) | **输入单价 (百万tokens)** | **输出单价 (百万tokens)** | **缓存存储 (百万tokens/小时)** | 输入模态"
  - "**¥5 / M Tokens** | ¥2.5 / M Tokens（Batch）| GLM-4-Plus Flagship 128K"
  - "**¥0.5 / M Tokens** | ¥0.25 / M Tokens（Batch）| GLM-4-Air High-performance 128K"
  - "**¥10 / M Tokens** | Not Supported（Batch）| GLM-4-AirX Fastest 8K"
  - "**¥0.1 / M Tokens** | ¥0.05 / M Tokens（Batch）| GLM-4-FlashX-250414 Fast and Cheap 128K"
  - "**¥1 / M Tokens** | ¥0.5 / M Tokens（Batch）| GLM-4-Long Long input 1M"
  - "**¥5 / M Tokens** | Not Supported（Batch）| GLM-4-Assistant Agent 128K"
  - "GLM-4.5 | 32k | ¥0.1 / 1k tokens | Not Supported | 训练 LoRA"
  - "GLM-4.5 | 16k | Not Supported | ¥0.125 / 1k tokens | 训练 Full"
  - "GLM-4.5-Air | 32k | ¥0.035 / 1k tokens | ¥0.05 / 1k tokens | 训练"
  - "Cogview-3 | 1k | Not Supported | ¥0.02 / 1k tokens | 训练"
  - "GLM-4.6 | 200k-fp8 | **¥175 / GPU Unit / Day** | 模型部署"
  - "GLM-4.5 | 128k-fp8 | **¥175 / GPU Unit / Day**"
  - "GLM-4.5-Air | 128k-fp8 | **¥100 / GPU Unit / Day**"
  - "GLM-4-Plus | 8k-int4 | ¥100 / GPU Unit / Day"
  - 训练套餐："GLM-4.5 | 算力单元数量 5840 个 | 训练语料额度 10 亿 tokens | 用户权益升级 V3 | **110 万元/年**"
  - 训练套餐："GLM-4.5-Air | 算力单元数量 5840 个 | 训练语料额度 10 亿 tokens | 用户权益升级 V2 | **50 万元/年**"
- **GLM-4.5 文档页（原文）**："API 调用价格低至输入 **0.8 元/百万 tokens**，输出 **2 元/百万 tokens**；同时，高速版本实测生成速度超过 100 tokens/秒"
- **上下文缓存（原文）**："隐式缓存，智能识别重复的上下文内容，无需手动配置"；"缓存命中的 Token 按更低价格计费"；"响应字段 `usage.prompt_tokens_details.cached_tokens`"
- **Batch API（原文）**："通过 Batch API，开发者可以通过文件提交大量任务，且**价格降低 50%（GLM-4-Flash 免费）、无并发限制**"；"单个文件最多支持 50,000 个请求且大小不超过 100M"；"完成窗口已废弃，新的任务调度策略将根据系统负载情况自动调整；预计任务将在 24 小时内完成，如果任务超过 7 天未处理完，将自动取消"；"系统只保留您的数据 30 天。请及时下载和备份您的数据，过期后文件将自动删除，无法恢复"
- **知识库存储（原文）**："存储容量：1 GB；只要您的知识库总存储量在 1 GB 以内，即可永久免费使用"；"当您的知识库存储量超出 1 GB 的免费额度时，超出的部分将按以下规则计费：计费单价：**0.04 元/GB/小时**；计费方式：按量计费，后付费（先使用，后结算）"
- **Embedding**：Embedding-3 / Embedding-3-pro / Embedding-2 / Embedding-Multimodal **¥0.5/百万 tokens**；GLM-rerank-pro / GLM-rerank **¥0.8/百万 tokens**；深度解析 **¥0.12/页**

#### B. Coding Plan 部分

- **套餐积分（原文）**："Lite 套餐 **2,000** / **10,000**"（5h/周）；"Pro 套餐 **12,000** / **60,000**"；"Max 套餐 **28,000** / **140,000**"
- **公式**："**Model credit usage = (Input tokens × Input multiplier + Cached Input tokens × Cached Input multiplier + Output tokens × Output multiplier) / 10000**"
- **乘数表**：
  - "GLM-5.3 | Input **6.9** | Cached Input **1.7** | Output **24**"
  - "GLM-5.3-Flash（含视觉理解 MCP）| Input **2.3** | Cached Input **0.56** | Output **8**"
  - "MCP 工具（联网搜索/网页读取/开源仓库）：Output multiplier **1.2**"
- **高峰/非高峰**："非高峰时段内，模型调用按基础积分消耗的 **50%** 抵扣。**高峰时段：每周一至周五的 14:00～18:00 （UTC+8）**"
- **Token 估算（缓存 95%）**：
  - Lite：GLM-5.3 0.48–0.97 亿 tokens/周；GLM-5.3-Flash 1.46–2.92 亿
  - Pro：GLM-5.3 2.90–5.80 亿；GLM-5.3-Flash 8.77–17.55 亿
  - Max：GLM-5.3 6.76–13.52 亿；GLM-5.3-Flash 20.47–40.95 亿
- **Token 节省**："当充分利用非高峰时段优惠时，相较于按量调用 GLM-5.3 标准 API，最高可节省 **92%** 成本"
- **夜间活动**："错峰时段（每日 23:00 至次日 09:00）内，通过 GLM Coding Plan 使用 GLM-5.3-Flash 模型的额度消耗规则如下：通过 ZCode 使用：额度消耗全部为 **0**；通过套餐支持的其他 Agent 使用：可用额度在您套餐标准规则的基础上全部 **×2 倍**"
- **价格（订阅页 exa 快照）**：
  - "Lite | **¥94.4/月 ¥118/月**"
  - "Pro | **¥430.4/月 ¥538/月** | 6 倍 Lite 用量额度 | Lite 全部权益 | 优先体验最新旗舰模型及功能 | 覆盖多款精选 MCP 工具 | 更快生成速度"
  - "Max | **¥862.4/月 ¥1078/月** | 14 倍 Lite 用量额度 | Pro 全部权益 | 首发接入最新旗舰模型及功能 | 高峰期专属资源优先保障"
- **V2 老套餐价格**："Lite 包月 ¥49 / 包季 ¥44.1 / 包年 ¥39.2；Pro 包月 ¥149 / 包季 ¥134.1 / 包年 ¥119.2；Max 包月 ¥469 / 包季 ¥422.1 / 包年 ¥375.2"
- **扣款顺序**："优先使用赠金余额 → 现金余额 → 绑定的第三方支付方式（**微信、支付宝**）扣款"
- **退款**："订阅服务一经购买即视为确认，不支持退款。即使您未使用完套餐，费用也无法退回"
- **取消**："请务必在下一个扣费日**至少 3 天**前取消，以避免自动续费"

### 3.2 归一化歧义清单

1. **"元/百万 tokens" vs "元/千 tokens"** vs "元/张图像" vs "元/页" vs "元/GB/小时"：bigmodel.cn 计价单位**至少有 6 种**——按 token（百万或千）、按次（图像/视频/搜索）、按页（深度解析）、按存储（GB/小时）、按 GPU Unit/天（模型部署）、按 token/1K（训练）。**跨 Vendor 比较时必须先归一化单位**。
2. **上下文分档**：GLM-4.7 价格表按"输入长度 [0, 32) 输出长度 [0, 0.2)"等 5 档划分——这是 OpenAI/Anthropic 等按"长上下文阈值"二档划分（≤200K / >200K）的**更细粒度分档**，归一化时必须把"输入长度 + 输出长度"两轴分档映射到等效平均成本。
3. **缓存计费双层**：GLM 的"缓存存储"（¥0.4–¥0.8/百万 tokens/小时）= "缓存写入收费"；"缓存命中按输入价更低"= "缓存读取折扣"（exa 快照表中"限时免费"暗示促销期可能免存储费）；归一化时不能与 OpenAI cache_read/cache_write 倍率等同。
4. **免费模型口径**：exa 快照中 GLM-4.7-Flash 等模型标注"免费"，但 Coding Plan FAQ 写"GLM-4.7-Flash 缓存命中：免费"——"免费"指的是 cache read？还是整 token？文档口径**不一致**。
5. **5 小时窗口口径**："积分额度在请求消耗 5 小时后刷新重置"——从**消费发生时**起算的动态 5h 滚动窗口（与 z.ai 一致），而非整点窗口。跨 Vendor 比较时要按"窗口起点"对齐。
6. **"包月原价 vs 连续包月折后价"**：bigmodel.cn 营销页显示两组数（¥118 与 ¥94.4、¥538 与 ¥430.4、¥1078 与 ¥862.4）——前者为标准包月价、后者为"连续包月"自动续费折扣价；归一化时若不区分会高估 20%。
7. **GLM-5.3 强制 always-on 思考**：与其他 Vendor 的"可选思考"不同，GLM-5.3 "始终启用思考功能，支持三个思考强度级别"——**输出 token 必然包含 reasoning_content**，对"按输出 token 计费"的用户成本影响显著；归一化"输出 token 数"时要考虑 reasoning_content 是否被计费。
8. **Code Interpreter 缺失**：bigmodel.cn 上**未公布独立的 Code Interpreter / Sandbox 定价**（与 Anthropic code_execution $0.05/h 不同）；Coding Agent 的代码执行能力由"编程模型 + 工具调用"实现，定价包含在 token 计费内；归一化时不能与有独立 Code Interpreter 价格的 Vendor 直接对比。
9. **Batch 价格 "50% 折扣"** 与官方命名口径：bigmodel.cn 文档原文是"价格降低 50%（GLM-4-Flash 免费）、无并发限制"——Batch 走文件上传、50K req/file、100MB、24h SLA、30 天后过期；这与 OpenAI/Anthropic 的 Batch API 设计**完全一致**，跨 Vendor 跨 Vendor 可对齐为"50% 折扣 + 24h SLA + 文件上传"。
10. **GLM Coding Plan 团队版 "API 刊例价 9 折"** 超额计费：这是国内版独有（z.ai 团队版原文是"按模型 API 列表价的 10% 折扣"——10% off，即 9 折）——**口径一致**，归一化无歧义。
11. **"限时免费" vs "免费"**：exa 快照中部分模型缓存存储列标"限时免费"，部分模型本体标"免费"——促销活动 vs 永久免费的政策差异需逐模型核对。
12. **资源包 vs 现金余额双账户扣减顺序**："优先扣除满足模型适用场景的资源包余额，再扣除现金账户余额"+"存在多个相同适用场景的资源包时，将优先扣除最快过期的资源包"——这是 bigmodel.cn **独有的扣减顺序**，归一化"支付成本"时要把"用户持有什么资源包"作为前置条件建模。

---

## 4. 来源冲突、更新频率与历史变更方式

### 4.1 已识别的来源冲突

1. **GLM-4.5-Air 模型页 vs 模型概览页**：文档页与"模型概览"页均列 GLM-4.5-Air，但 exa 抓到的"核心参数文档"给出 GLM-4.5 系列默认 max_tokens 65536、最大 98304——这与"GLM-4.5-Air 文档页"显示的 96K 最大输出**一致**；GLM-4-FlashX-250414 在核心参数文档中给出 max=32768，而模型概览列"16K"——**不同 GLM-4-Flash 变体存在**，可能误为冲突。
2. **GLM-5.3 与旧版本 thinking 语义**：GLM-5.3 文档明示"始终启用思考功能，支持三个思考强度级别：`low`、`high` 和 `max`，**并不再支持禁用思考功能**"；旧文档示例仍带 `thinking: {type: "enabled"}` —— GLM-5.2 等仍接受 disabled，GLM-5.3 强制 enabled。归一化"思考开关"字段时按模型版本分流。
3. **"团队标准版/高级版" vs "Standard Seat / Premium"**：z.ai 团队版原文为 "Standard Seat / Premium Seat"（英文 + 订阅费 USD）；bigmodel.cn 团队版权益原文为"团队标准版 / 团队高级版"（中文 + 席位制 RMB）。**这是两区命名与计费单位差异**，不是事实冲突。
4. **官方 vs 第三方对改版日期的描述**：bigmodel.cn 官方"老用户权益说明"标注"公告发布时间：**2026 年 7 月 30 日**"；z.ai 官方"Plan Update Announcement"标注"July 30, 2026"——**同日同步**，无冲突。
5. **GLM-4.7-Flash 是否真的"免费"**：
   - 模型概览页：标"免费文本模型"
   - exa 官方价格页快照：标"GLM-4.7-Flash | 免费 | 免费 | 缓存命中: 免费"
   - Coding Plan 概览页：GLM-5.3-Flash（多模态）写为"含视觉理解 MCP"乘数 2.3/0.56/8，**不提及 GLM-4.7-Flash**
   - 综合判断：**GLM-4.7-Flash 在 API 路径下免费**；**GLM Coding Plan 已不再使用 GLM-4.7**（GLM-5-Turbo、GLM-4.7 自动路由到 GLM-5.3-Flash）。
6. **官方定价页（open.bigmodel.cn/pricing、bigmodel.cn/pricing）静态抓取失败**：本次抓取仅获得 shell HTML，所有价表数值依赖 exa 快照——若 exa 缓存落后于官方实时价格，则**实际价表可能与 exa 快照不完全一致**；本次无法验证。
7. **多模型上下文长度差异**：GLM-5.3 上下文 1M（实测），GLM-4.5-Air 128K，GLM-4.6V 128K——同一品牌不同型号上下文差异显著，归一化"模型上下文长度"字段必须按 model code 区分。
8. **GLM-5.3 与 GLM-5.3-Flash 区分**：GLM-5.3（文本旗舰）vs GLM-5.3-Flash（原生多模态）；两者上下文 1M、最大输出 128K 一致，但乘数（6.9/1.7/24 vs 2.3/0.56/8）与价格（待核实）不同；Coding Plan 文档默认两者**都可用**。
9. **CogVideoX / Vidu / CogView / GLM-Image 视频/图像模型单价**：exa 快照中**未捕获完整单价表**（仅 Cogview-3 ¥0.02/1K tokens）；GLM-Image / Vidu Q1 / Vidu 2 / CogVideoX-3 的当前单价**无法从一手来源确认**（仅 docs 模型页有"按次收费"提示）——本次未确认字段。
10. **GLM-5.3-Flash 实际调用需 Coding Plan 订阅才能完整使用？** 文档原文："如果您有订阅过 GLM Coding Plan（含已过期），那么暂时您只能通过 OpenAI Chat Completion 协议调用模型 API，我们将在近期迭代优化"——意指 GLM-5.3 在 Coding Plan 用户的 Anthropic 协议端点上**当前未完全开放**，只能走 OpenAI Chat Completion。这是 **GLM-5.3 上线初期阶段的临时限制**。

### 4.2 更新频率

- **模型发布**：自 2025-07 GLM-4.5 上线以来，约每月 1–2 个新模型（GLM-4.5 → 4.6 → 4.7 → 5 → 5.1 → 5.2 → 5.3）；2026-09 当前主推 GLM-5.3 + GLM-5.3-Flash
- **价格变更**：exa 快照表内显示"限时免费"促销标记 → 价格有周期性促销
- **Coding Plan 公告**：约每月 1 条；2026-07-30 改版 + 2026-09-03 限时活动
- **官方文档**：docs.bigmodel.cn 文档站基于 Mintlify，更新由文档团队手动；模型页有版本号（如 GLM-5.3 模型页底部含 v0.2.3 之类的 SDK 版本号）；无 RSS
- **Batch API / 错误码**：错误码文档稳定，2026 年内陆续增加 1313–1321（团队超额 / 子账号限额）

### 4.3 历史变更方式

- **新模型上线**：docs.bigmodel.cn 文档站更新模型页 + 营销站推送 + 微信/微博公告
- **价格变更**：open.bigmodel.cn/pricing 价表（JS 渲染，**无法静态抓取历史快照**）+ docs 模型页"价格"段
- **套餐改版**：`docs.bigmodel.cn/cn/coding-plan/notice/usage-revision.md` 专项公告（已存在 2026-07-30 改版 + 2026-04 老用户迁移）
- **限时活动**：`docs.bigmodel.cn/cn/coding-plan/notice/event-*.md` 专项公告
- **API 兼容性变更**：thinking.enabled 强制升级（GLM-5.2 disabled → GLM-5.3 enabled 强制）通过模型页与迁移公告同步

### 4.4 页面是否显示更新时间

- **docs.bigmodel.cn 文档页**：Mintlify 默认**不显示 "Last updated"** 时间戳（GLM-4.5 等模型页无 Last updated）；**公告页（notice/*）** 显示"发布时间"
- **错误码文档**：2026-09 期间持续更新（1309/1313/1316–1321 为较新条目）
- **open.bigmodel.cn/pricing、bigmodel.cn/pricing、www.bigmodel.cn/glm-coding**：均**不显示 Last updated**；JS 渲染 + 营销站无版本时间戳
- **充值协议 / 实名认证 FAQ**：无时间戳，政策类内容相对稳定

### 4.5 无法确认当前有效值的字段

- **GLM-5 系列（CogVideoX-3 / Vidu Q1 / Vidu 2 / GLM-Image / GLM-TTS / GLM-ASR-2512 / GLM-Realtime / CodeGeeX-4）当前单价**：exa 快照仅 Cogview-3 + GLM-4 系列；JS 渲染价表无法抓取
- **数值化 RPM/TPM/QPS**（任何模型）：官方文档**未公布**，仅有错误码触发条件
- **GLM Coding Plan 当前 Pro/Max 的"包季 9 折 / 包年 8 折"具体折后价**：订阅页 exa 快照只给出连续包月折后价，季/年折后价**未在公开渠道列出**
- **中国大陆地区政策的国家/地区准入清单**：官方无 supported-countries 页（与 Anthropic / Gemini 不同），仅在用户协议中定法律适用区
- **个人版 Coding Plan 数据训练政策**：官方仅明示团队版"数据默认不用于模型训练"，个人版未明示
- **GLM-5.3 在 Anthropic 协议端点的完整可用性**（GLM-5.3 文档原文："如果您有订阅过 GLM Coding Plan（含已过期），那么暂时您只能通过 OpenAI Chat Completion 协议调用模型 API，我们将在近期迭代优化"——当前限制）
- **CogView-4 单价**：exa 快照未捕获
- **GLM-Image / CogVideoX-3 单价**：exa 快照未捕获
- **历史价格变更时间线**：无版本化 PDF 或 changelog，**抓取范围内不可重建**

---

## 5. 中国 Availability（五个维度）

> 原则声明：本节区分"官方明确声明"与"无法确认"；**页面无法访问或客户端渲染失败不作为官方政策限制的证据**。检索过的官方渠道：bigmodel.cn / open.bigmodel.cn / docs.bigmodel.cn / 充值协议 / 注册登录 FAQ / 实名认证 FAQ / Coding Plan 全套文档 / 模型页 / 错误码 / 速率限制 / 批量处理 / 联网搜索。

| 维度 | 状态 | 说明 |
|---|---|---|
| 注册 | **官方明确（结构 + 流程 + 边界）** | 官方明确：(1) 支持海外手机号（注册时选择国家区号 + 短信验证）（[注册登录 FAQ](https://docs.bigmodel.cn/cn/faq/registration-login.md)）；(2) 个人人脸识别认证即时完成，企业认证 7 个工作日 / 对公打款 30 分钟（[实名认证 FAQ](https://docs.bigmodel.cn/cn/faq/authentication-issues.md)）；(3) 海外企业可在实名认证页选择"海外企业"上传认证材料；(4) 实名认证不强制（"目前调用 API 并不强制要求实名认证"）；(5) 账号"支持多端同时登录，目前没有登录端数量限制"；(6) 个人 → 企业升级路径明确。**未确认**：智谱未公开"禁止/允许注册的国家清单"（与 Anthropic Supported Countries 160 个国家清单 / Gemini 145 国清单不同），仅在用户协议中定中国法律管辖 |
| 支付 | **官方明确（通道 + 流程 + 退款）** | 官方明确：(1) **支持支付宝、微信**（[充值协议 §5.1](https://docs.bigmodel.cn/cn/terms/recharge-agreement.md)）；(2) 企业支持对公打款 + 30 分钟内到账；(3) 个人/企业可申请发票（[Coding Plan FAQ](https://docs.bigmodel.cn/cn/coding-plan/faq.md) 中明示"完成企业认证即可开具企业专票"）；(4) 退款"通常不支持"，特殊情况联系客服（[费用问题 FAQ](https://docs.bigmodel.cn/cn/faq/fee-issues.md)）；(5) 资源包"无有效期、可叠加使用"（[充值协议 §6.3](https://docs.bigmodel.cn/cn/terms/recharge-agreement.md)）；(6) **未确认**：是否支持 Visa / MasterCard / PayPal / 国际信用卡——本次抓取范围内未见任何"国际信用卡"声明；充值协议明确"目前支持支付宝和微信"暗示**主要支付方式是中国本地支付通道** |
| 网络访问 | **官方未声明 + 技术观察** | 官方未声明中国大陆 ISP 层面的可达性。技术观察：(1) `open.bigmodel.cn`、`bigmodel.cn`、`docs.bigmodel.cn` 解析至中国大陆 IP（DNS 指向阿里云 / 智谱自建 CDN）；(2) `static.bigmodel.cn` CDN 域名托管静态资源；(3) z.ai 国际版与 bigmodel.cn 共用基础设施（z.ai 静态资源托管于 `static.bigmodel.cn/z-ai-website/`）——表明两站互联互通但**bigmodel.cn 是中国大陆主入口** |
| 服务政策 | **官方明确（结构性）** | 官方明确：(1) 充值协议适用**中华人民共和国大陆地区法律**（北京市海淀区法院管辖）；(2) 数据控制者为北京智谱华章科技股份有限公司；(3) 团队版 Coding Plan **"数据默认不用于模型训练"**；(4) 个人版 Coding Plan 数据训练政策**未明示**；(5) 实名认证不强制但建议认证；(6) Batch API 数据保留 30 天；(7) API Key 删除后不再扣费 |
| 功能限制 | **官方明确（账号级 + 套餐级）** | 官方明确：(1) 错误码 1301 触发敏感内容过滤；(2) 错误码 1302/1305 触发用户速率限制 / 平台过载；(3) 错误码 1308/1309/1316/1317/1318-1321 触发 5h/7d/团队超额上限；(4) 错误码 1313 触发公平使用策略违规（"详见《条款与协议-订阅及自动续费协议》"）；(5) Coding Plan 仅限官方支持的 20+ 工具；(6) Claude Code UI 显示 Claude 模型但实际调用 GLM-5.3 等（"服务端模型映射"）；(7) GLM-5.3 在 Anthropic 协议端点**当前仅 Coding Plan 用户开放、且仅 OpenAI Chat Completion 协议可用** |

补充事实（已知官方声明，与中国 Availability 相关）：
- 大陆用户默认入口即 bigmodel.cn（中国大陆主站）
- 海外用户可通过海外手机号 + 海外企业认证 + 支付宝/微信/对公打款在 bigmodel.cn 注册
- z.ai 国际版是独立入口（新加坡主体 JINGSHENG HENGXING TECHNOLOGY PTE.LTD，已在 05-zhipu-glm-coding-plan.md 覆盖）
- 两区账户**官方未声明互通**（用户协议、文档、FAQ 均未提及账号互通过桥）

---

## 6. bigmodel.cn（中国区）vs z.ai（国际区）差异

> 本节补齐 05-zhipu-glm-coding-plan.md §6 列为"未决项"的内容。所有事实均来自 docs.bigmodel.cn（本次采集）+ docs.z.ai（05 文件已采集）。

| 维度 | bigmodel.cn（中国区） | z.ai（国际区） | 来源 |
|---|---|---|---|
| 运营主体 | 北京智谱华章科技股份有限公司 | JINGSHENG HENGXING TECHNOLOGY PTE.LTD.（新加坡） | 充值协议 vs docs.z.ai/legal-agreement/terms-of-use.md |
| 法律适用法 | 中华人民共和国大陆地区法律（北京海淀法院） | 出口管制条款（ToS §X）禁地区：伊朗/朝鲜/古巴/克里米亚/顿涅茨克/扎波罗热 | 充值协议 §十 vs docs.z.ai/legal-agreement/terms-of-use.md §X |
| 主域名 | bigmodel.cn / open.bigmodel.cn / docs.bigmodel.cn | z.ai / docs.z.ai / api.z.ai | DNS |
| 计费币种 | 人民币 CNY（¥） | 美元 USD（$） | 全部价表 |
| 套餐价格（个人版，连续包月折后/标准） | Lite ¥94.4/月 / ¥118；Pro ¥430.4/月 / ¥538；Max ¥862.4/月 / ¥1078 | Lite $16.2/月（折后）/ $18；Pro $64.8/月 / $72；Max $144/月 / $160 | 订阅页 exa 快照（bigmodel.cn）/ docs.z.ai/devpack/transition.md（z.ai） |
| 套餐层级 | 个人 Lite/Pro/Max + 团队标准版/团队高级版 | 个人 Lite/Pro/Max + 团队 Standard Seat / Premium Seat | docs.bigmodel.cn/cn/coding-plan/team.md vs docs.z.ai/devpack/teamplan.md |
| 团队版超额计费 | "超出额度部分按模型 API 刊例价的 9 折计费" | "Limited-time offer: Overage usage is billed at a 10% discount from the model API list price" | docs.bigmodel.cn/cn/coding-plan/team.md vs docs.z.ai/devpack/teamplan.md |
| 团队版席位规则 | 2 席位起购、无上限；连续订阅仅 ≤3 万元 | Standard/Premium Seat 分级；席位数规则按 z.ai 文档 | docs.bigmodel.cn/cn/coding-plan/team.md vs docs.z.ai/devpack/teamplan.md |
| 支付通道 | **支付宝、微信**、对公打款 | **bank card / PayPal**（信用卡无 3DS） | 充值协议 §5.1 vs docs.z.ai/devpack/usage-policy.md |
| 实名认证 | 不强制（个人/企业/海外企业三档）；企业认证 7 工作日 | 未要求 | 实名认证 FAQ vs docs.z.ai 文档 |
| 数据训练政策 | 团队版："数据默认不用于模型训练"；个人版未明示 | 个人版："For individual users, we reserve the right to process any User Content to improve our existing Services and and/or to develop new products and services… including developing, improving, or promoting our Services, such as when we train and improve our models"；团队版："Data is not used for model training by default" | docs.bigmodel.cn/cn/coding-plan/team.md vs docs.z.ai/legal-agreement/privacy-policy.md §3 + docs.z.ai/devpack/teamplan.md |
| 退款政策 | "订阅服务一经购买即视为确认，不支持退款" | "订阅一经购买不支持退款"（z.ai 同样） | Coding Plan FAQ vs docs.z.ai 文档 |
| 限时活动（夜间） | 2026-09-03 至 09-20，每日 23:00–09:00，ZCode 端 GLM-5.3-Flash 0 积分 | z.ai 侧未发现同期公告；Flash 活动（2026-09-03 至 09-20）由 z.ai docs.z.ai/devpack/notice/event-glm-5.3-flash.md 公告（z.ai 侧活动细则有差异） | 夜间畅用活动 vs docs.z.ai/devpack/notice/event-glm-5.3-flash.md |
| 模型清单（相同） | GLM-5.3 / GLM-5.3-Flash / GLM-5.2 / GLM-5.1 / GLM-5 / GLM-5-Turbo / GLM-4.7 / GLM-4.6 / GLM-4.5-Air 等 | 同 | 模型概览 vs docs.z.ai/devpack/overview.md |
| Coding 接入端点（Anthropic） | `https://open.bigmodel.cn/api/anthropic` | `https://api.z.ai/api/anthropic` | 快速开始 vs docs.z.ai/devpack/quick-start.md |
| Coding 接入端点（OpenAI Chat） | `https://open.bigmodel.cn/api/coding/paas/v4` | `https://api.z.ai/api/coding/paas/v4` | 快速开始 vs docs.z.ai/devpack/quick-start.md |
| Coding 接入端点（OpenAI Response） | `https://open.bigmodel.cn/api/v1`（Codex） | docs.z.ai/devpack/latest-model 中 同步 | 切换模型 vs docs.z.ai |
| 实名/手机号验证 | 中国大陆手机号 + 海外手机号 + 人脸识别 + 企业营业执照 | 未要求（邮箱/Google/GitHub 登录） | 实名认证 FAQ vs docs.z.ai/legal-agreement/privacy-policy.md |
| 海外用户可否直接购买 | 是（海外手机号 + 海外企业认证 + 支付宝/微信/对公打款） | 是（PayPal / bank card） | 充值协议 + 实名认证 FAQ vs docs.z.ai/devpack/usage-policy.md |
| 账号互通 | **无官方声明**——bigmodel.cn 注册账号与 z.ai 注册账号**无法确认互通** | **无官方声明** | docs.bigmodel.cn / docs.z.ai 文档均未提 |

**关键结论**：
- bigmodel.cn 与 z.ai 是**同一公司、同一模型族、同一 Coding Plan 产品矩阵**的两个地区性入口；
- 主要差异在**币种（¥ vs $）、法律适用法（中国大陆 vs 新加坡/出口管制）、支付通道（支付宝/微信 vs PayPal/bank card）、数据训练政策（bigmodel.cn 团队版默认不训练 vs z.ai 个人版保留训练权）、实名认证要求**；
- 价格方面，**两区价差已被抹平**（网易科技 2026-07-31 报道：Lite 连续包月 ¥118 ≈ $18 × 6.747 ≈ ¥121；Pro ¥538 ≈ $72 × 6.747 ≈ ¥485 ≈ 略高于国内；Max ¥1078 ≈ $160 × 6.747 ≈ ¥1078 接近持平）——网易科技为第三方媒体报道，本文不作事实依据；但 exa 抓到的 z.ai 价格（$16.2/$64.8/$144 "9 折促销价"）与 bigmodel.cn 折后价（¥94.4/¥430.4/¥862.4 ≈ $14/$64/$128）按 7.0 汇率计算确实**接近**。
- 跨区账户**互通性：未官方声明**，不互通概率高。

---

## 7. 对 Data Provider / Recommendation Policy 的建议

- **最小来源契约**：
  - API 部分：`docs.bigmodel.cn/cn/guide/start/model-overview.md`（模型清单 + 上下文 + 最大输出）+ `docs.bigmodel.cn/cn/faq/fee-issues.md`（计费规则）+ `docs.bigmodel.cn/cn/guide/tools/batch.md`（Batch API）+ `docs.bigmodel.cn/cn/guide/tools/knowledge/price.md`（向量 + 知识库）+ 营销页 `bigmodel.cn/pricing`（价格，**仅 exa 快照可读**）
  - Coding Plan 部分：`docs.bigmodel.cn/cn/coding-plan/overview.md`（套餐+积分+乘数）+ `docs.bigmodel.cn/cn/coding-plan/quick-start.md`（端点 + 工具）+ `docs.bigmodel.cn/cn/coding-plan/team.md`（团队）+ `docs.bigmodel.cn/cn/coding-plan/notice/usage-revision.md`（V1/V2 老套餐迁移）+ `docs.bigmodel.cn/cn/coding-plan/notice/event-glm-5.3-flash.md`（限时活动）+ 订阅页 exa 快照（个人版连续包月价）
- **核心字段（缺失应阻止强排名）**：
  - **价格**：按模型 + 输入/输出分档（≤32K / 32K-128K / >128K）+ 输出长度分档（短/长）；按 cache 命中率分场景
  - **币种**：CNY（人民币）
  - **计费周期**：API 按 token 实时 / Coding Plan 包月包季包年
  - **额度（API）**：错误码 1302/1305/1308/1309 触发条件 + 用户权益等级
  - **额度（Coding Plan）**：5h / 周双池 credits + 乘数（GLM-5.3 6.9/1.7/24；GLM-5.3-Flash 2.3/0.56/8）+ MCP × 1.2
  - **Plan 标识**：区分通用 API vs Coding Plan 个人版/团队版；API Key 互不通用
  - **GLM-5.3 强制 always-on 思考**：归一化"输出 token"时必须包含 reasoning_content
- **失败分类建议**：
  - `OK_MD`（docs.bigmodel.cn 全站 `.md` 文档）：可直接抓取
  - `RENDER_DEPENDENT`（`open.bigmodel.cn/pricing`、`bigmodel.cn/pricing`、`bigmodel.cn/glm-coding`）：JS 渲染，**仅 exa 快照可读**；建议建立 exa 快照轮询机制
  - `LOGIN_REQUIRED`（`bigmodel.cn/usercenter/proj-mgmt/apikeys`、`bigmodel.cn/usercenter/auth`、`bigmodel.cn/finance/overview`、`bigmodel.cn/finance/expensebill/list`）：控制台内
- **字段优先级提示**：
  - 智谱的"上下文分档 + 输出长度分档"是少见的**细粒度定价**，跨 Vendor 对比时建议先做"档位等效平均成本"映射
  - 智谱"Coding Plan 额度与 API Key 互不通用"是产品边界关键信号，对"账号体系"建模至关重要
  - 智谱"团队版 API 刊例价 9 折超额计费"与 z.ai 一致——可对齐为统一字段"overage_pricing"
  - 智谱"GLM-5.3 强制 always-on 思考"对"成本优化建议"字段影响显著
  - 智谱夜间活动（每日 23:00–09:00）是限时促销，对"用额度预测"字段有周期性扰动
- **监控点**：
  - `docs.bigmodel.cn/cn/coding-plan/notice/` 目录（公告是新规则第一发布位）
  - `docs.bigmodel.cn/cn/guide/start/model-overview.md`（新模型上线入口）
  - `docs.bigmodel.cn/cn/api/api-code.md`（错误码更新）
  - 营销页 `bigmodel.cn/pricing` 与 `bigmodel.cn/glm-coding`（价格 + 套餐变更，但**仅 exa 快照**）
  - 微信/微博公告（如能定位到"智谱"官方公众号入口，标注为"官方公众号"入口类型）

---

## 8. 未解决问题

1. **GLM-5 / CogVideoX-3 / Vidu Q1 / Vidu 2 / GLM-Image / GLM-TTS / GLM-ASR-2512 / GLM-Realtime / CodeGeeX-4 等模型当前单价**：exa 快照仅捕获 Cogview-3 + GLM-4 系列 + GLM-4.5/4.6/4.7/4.6V/4.5-Air + 训练 + 模型部署价；JS 渲染定价表无法静态抓取。
2. **数值化 RPM/TPM/QPS**：官方文档**未公布**任何具体模型的 RPM/TPM；仅有"用户权益等级"定性表述与错误码触发条件。
3. **GLM Coding Plan 个人版数据训练政策**：团队版明示"默认不训练"，个人版未明示。
4. **bigmodel.cn 国家/地区准入清单**：官方**无 supported-countries 页**（与 Anthropic 160 国 / Gemini 145 国不同）；仅在用户协议中定中国法律管辖。
5. **GLM-5.3 在 Anthropic 协议端点的完整可用性**：GLM-5.3 文档明示"如果您有订阅过 GLM Coding Plan，那么暂时您只能通过 OpenAI Chat Completion 协议调用模型 API"——意味着 Coding Plan 用户在 Anthropic 端点可能尚不支持 GLM-5.3（Claude Code 默认走 Anthropic 端点，Coding Plan 默认在 Anthropic 端点走 GLM-5.3-Flash）。
6. **GLM Coding Plan 个人版"包季 9 折 / 包年 8 折"具体折后价**：订阅页 exa 快照只给出连续包月折后价。
7. **bigmodel.cn 与 z.ai 账号互通**：两区账号体系**官方无互通声明**。
8. **历史价格变更时间线**：无版本化 PDF 或 changelog。
9. **GLM-4.5-Flash 即将下线的具体时间**：模型概览标注"（即将下线）"，无明确日期。
10. **Code Interpreter 工具定价**：bigmodel.cn 上**未公布独立的 Code Interpreter / Sandbox 定价**；Coding Agent 代码执行能力由模型 token 计费承担，与 Anthropic Code Execution / OpenAI Code Interpreter 定价口径不同。

---

## 9. 与既有 05-zhipu-glm-coding-plan.md 的关系

- 05 文件覆盖 z.ai 国际版（JINGSHENG HENGXING TECHNOLOGY PTE.LTD，新加坡主体）+ 标注 bigmodel.cn 中国区**未完成核查**（§6、§8）。
- 本文件（13）**补齐 bigmodel.cn 中国区**调研，包括：
  - bigmodel.cn 上 **GLM Coding Plan 完整产品存在性**（Lite ¥94.4/¥118、Pro ¥430.4/¥538、Max ¥862.4/¥1078，2026-09-03 至 09-20 限时夜间活动）；
  - **Claude Code 兼容接入**（`https://open.bigmodel.cn/api/anthropic` + Coding Tool Helper `npx @z_ai/coding-helper` + 1M 上下文 `glm-5.3[1m]` 后缀）；
  - **中国区 vs 国际区差异**（§6）：币种、主体、法律、支付通道、数据训练政策；
  - **中国 Availability 五个维度**（§5）：注册（支持海外手机 + 海外企业）/ 支付（明确支付宝微信）/ 网络（中国大陆主域）/ 服务（中国法律 + 北京海淀法院）/ 功能（错误码体系 + 套餐级限制）。
- 本文件**不重复** z.ai 国际版详情（已在 05 覆盖）。
- 建议下游 ticket（如 Coding Plan Schema 归一化）**先读 05 + 13**，再读 09/10/11 理解 bigmodel.cn 与 OpenAI / Anthropic / Gemini 的归一化歧义。
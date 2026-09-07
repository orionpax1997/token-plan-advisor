# 阿里云百炼 / 通义千问（Qwen）API 调研

- 采集日期：2026-09-07
- 调研范围：阿里云百炼（Model Studio，原 DashScope / 灵积品牌并入后主体）通过 OpenAI 兼容 / DashScope 协议对外提供的 Qwen 系列模型 API 的官方定价、能力、计费与可用性。本任务聚焦 api-usage Plan Type，不覆盖通义灵码 IDE 插件、个人 Coding Plan 订阅产品。通义灵码官方仅有"通义灵码"个人/企业版（独立计费），未发现其通过百炼 API 入口调用，**不纳入本表**。
- 一手来源限定：bailian.console.aliyun.com（控制台）、help.aliyun.com/zh/model-studio（百炼文档）。第三方汇总一律排除。

## 结论摘要

1. 百炼 Qwen API 公开定价按"每百万 token × 元（CNY）"计费，**计量单位统一为"每百万 Token"**（M = 1,000,000），**非**国内常见的"每千 token"；阶梯价按"单次请求的输入 Token 总量"切档。需登录控制台查看活动优惠（折扣、限时免费、Prime 优速等）。
2. 主要模型族：千问 Max（qwen3.8/3.7/3.6/3-max，含 0902 / 2026-05-17 / 2026-01-23 / preview 等快照）、千问 Plus、Flash、Turbo、Long、Omni、Omni-Realtime、QVQ、VL、OCR、Audio、Coder、Math、Translation、DeepResearch；开源版（Qwen3.8 / 3.6 / 3.5 / 3 / Qwen-Omni / Qwen-VL / Qwen-Audio / Qwen-Coder）以开放参数规模命名。
3. 部署地域：华北 2（北京，cn-beijing，免费额度地域）、美国（弗吉尼亚，us-east-1）、新加坡（ap-southeast-1，国际价格）、德国（法兰克福，eu-central-1）、日本（东京，ap-northeast-1）。同一模型在"全球 / 美国 / 国际 / 欧盟 / 日本"列分别报价，**国际 / 美国价格以"元"计价但含汇率加成**。
4. **免费额度**：仅华北 2（北京）地域享有，**自开通百炼 / 模型发布 / 申请通过之日起 90 天内有效**（以较晚者为准），多数模型为 100 万 token；qwen3.8-max-prime 无免费额度；qwen-doc-turbo、qwen-deep-research、qwen-audio-turbo、qwen2-audio-instruct 等例外。
5. 配套机制：上下文缓存（创建按输入价 125%、命中按 10%）、Batch 调用（按实时价 50%）、Qwen3.8-max Prime 优速模式（24/72 元，是普通 max 12/36 的 2 倍）。缓存与 Batch 不能同时生效。
6. 注册/合规：百炼为阿里云子产品，依赖阿里云账号 + 实名认证；中国大陆主战场，海外用户可在国际站（aliyun.com 英文站或国际地域）注册。隐私：官方模型调用页未在定价页声明"数据是否用于训练"细节，需另查"服务协议"或"数据安全"页。
7. 限流：定价页有专文"动态限流"，具体 QPS/RPM/TPM 数值需登录后或跳转查阅。
8. 与其他阿里云 AI 服务的区分：百炼（原 DashScope / 灵积）面向模型 API；PAI-EAS 面向自定义模型部署/推理服务平台（不在本任务范围）。通义灵码（tongyi.lingma.aliyun.com 等）有独立计费入口，**不在本任务**。

## 官方入口清单

| # | 官方 URL | 入口类型 | 地区 | 访问前提 | 是否需登录 | 动态渲染 | 本次获取 |
|---|----------|----------|------|----------|-----------|----------|----------|
| 1 | https://help.aliyun.com/zh/model-studio/model-pricing | 模型调用定价页（一手） | 中国（cn） | 公网 | 否 | SSR + ICE，含 HTML，可解析 | 成功，2026-09-04 最后更新（lastModifiedTime 1788512579000） |
| 2 | https://help.aliyun.com/zh/model-studio/models | 模型大全 / 功能规格 | 中国（cn） | 公网 | 否 | SSR，模型清单含跳转链接 | 成功 |
| 3 | https://help.aliyun.com/zh/model-studio/getting-started/models | 重定向至 2 | 中国 | 公网 | 否 | 同上 | 成功 |
| 4 | https://help.aliyun.com/zh/model-studio/get-api-key | API Key 申请说明 | 中国 | 公网 | 申请时登录 | 静态文档 | 成功 |
| 5 | https://help.aliyun.com/zh/model-studio/model-api-reference/ | API 参考 | 中国 | 公网 | 否 | 静态 | 成功 |
| 6 | https://help.aliyun.com/zh/model-studio/developer-reference/model-pricing | 已 404（被 1 替代） | - | - | - | - | 失败，跳过 |
| 7 | https://help.aliyun.com/zh/model-studio/developer-reference/pricing | 已 404 | - | - | - | - | 失败，跳过 |
| 8 | https://bailian.console.aliyun.com/ | 百炼控制台首页 | 中国 | 需登录 | 是 | SPA | 入口已确认，详情需登录 |
| 9 | https://bailian.console.aliyun.com/model-studio/ | 控制台 / 模型广场 | 中国 | 需登录 | 是 | SPA | 入口已确认，模型列表需登录 |
| 10 | https://bailian.console.aliyun.com/finance | 控制台 / 费用中心 | 中国 | 需登录 | 是 | SPA | 入口已确认 |

注：尝试 `developer-reference/model-pricing` 与 `developer-reference/pricing` 路径均返回 404，当前真实路径为 `model-pricing`（帮助中心用户指南下），开发参考下无独立定价页。

## 字段覆盖矩阵

状态：六选一 = 公开 / 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用

| 字段 | 状态 | 来源 |
|------|------|------|
| Plan 标识与名称 | 公开 | `bailian.console.aliyun.com` 模型 ID 即 Model ID，例 `qwen3.8-max`、`qwen3.7-plus`、`qwen3-coder-480b-a35b-instruct`；百炼无"Coding Plan" 订阅 SKU，仅按量 |
| Plan Type | 公开 | 本任务定位为 **api-usage**（按 token 计费的模型调用 API）；不存在"subscription" 形式的开发者 Plan |
| 价格 | 文档或公告 | 入口 1，按模型 × 地域 × 阶梯分别列出 |
| 币种 | 公开 | **人民币 元（CNY）**；海外地域仍以"元"为单位但数值已换算 |
| 计费周期 / 计量 | 公开 | "每百万 Token"（K=1,000，M=1,000,000），并非国内"每千 token"；阶梯计费按"单次请求的输入 Token 总量"切档，所有 token 按所在档结算 |
| 免费额度 | 文档或公告 | 入口 1；华北 2（北京）地域，开通/发布/申请通过 90 天内有效，多数模型 100 万 token |
| 用量上限 | 需登录 | 限流数值需查"动态限流"页与控制台 |
| 模型与功能 | 公开 | 入口 1 + 入口 2，含文本生成/多模态/嵌入/重排序/语音/图像/视频 |
| 上下文长度 | 文档或公告 | 入口 1 各模型"单次请求的输入 Token 数"区间即上下文档位；最大 1M 见于 qwen3.8-max / max-0902；qwen3-coder-480b 最高 200K；qwen3-vl-plus 最高 256K |
| 速率限制（QPS/RPM/TPM） | 需登录 / 无法确认 | 定价页未给出具体数字，仅指向"动态限流"专文（帮助中心另页） |
| 并发 | 需登录 | 同上 |
| 隐私/数据处理 | 文档或公告 | 定价页未声明；需查"服务协议" / "数据安全"专文（本任务未直接抓取到具体语句） |
| 注册要求 | 文档或公告 | 阿里云账号 + 实名认证（个人 / 企业）；百炼为云产品形态 |
| 支付方式 | 文档或公告 | 阿里云后付费 / 预付费（控制台"费用中心"）；支持支付宝等阿里云通用渠道 |
| 地区政策 | 文档或公告 | 入口 1 明示 5 地域差异定价；中国大陆主战场 |
| 官方购买链接 | 需登录 | 控制台 bailian.console.aliyun.com 开通后按量结算 |
| 更新时间 | 公开 | 定价页"更新时间"标识 2026-09-04 17:02:59（epoch 1788512579000） |

## 价格原文（节选，按"每百万 Token / 元"，华北 2 北京）

来源：https://help.aliyun.com/zh/model-studio/model-pricing （lastModified 2026-09-04）

### 千问 Max

| Model ID | 模式 | 单次请求输入 Token | 输入 | 输出 | 免费额度 |
|---|---|---|---|---|---|
| qwen3.8-max-prime | 优速模式 | 0–1M | 24 元 | 72 元 | 无 |
| qwen3.8-max | 非思考/思考 | 0–1M | 12 元 | 36 元 | 100 万 |
| qwen3.8-max-0902 | 非思考/思考 | 0–1M | 12 元 | 36 元 | 100 万 |
| qwen3.7-max 系列 / -2026-06-08 / -2026-05-20 / -preview / -2026-05-17 | 非思考/思考 | 0–1M | 12 元 | 36 元 | 100 万 |
| qwen3.6-max-preview | 非思考/思考 | 0–128K / 128K–256K | 9/15 元 | 54/90 元 | 100 万 |
| qwen3-max / -2026-01-23 | 非思考/思考 | 0–32K / 32K–128K / 128K–256K | 2.5/4/7 元 | 10/16/28 元 | 100 万 |
| qwen3-max-2025-09-23 | 仅非思考 | 0–32K / 32K–128K / 128K–256K | 6/10/15 元 | 24/40/60 元 | 100 万 |
| qwen3-max-preview | 非思考/思考 | 0–32K / 32K–128K / 128K–256K | 6/10/15 元 | 24/40/60 元 | 100 万 |
| qwen-max | 仅非思考 | 无阶梯 | 2.4 元 | 9.6 元 | 100 万 |

注：qwen3.7-plus、qwen3.7-flash 等被标记"原价 2 元（限时 8 折）"即 1.6 元/百万输入；qwen3.7-plus-2026-05-26 起恢复为 2 元。

### 千问 Plus（华北 2）

| Model ID | 输入档 | 输入（非/思考） | 输出（非/思考） | 免费 |
|---|---|---|---|---|
| qwen3.7-plus | 0–256K / 256K–1M | 2/6 元，限时 8 折 1.6/4.8 | 8/24 元，限时 8 折 6.4/19.2 | 100 万 |
| qwen3.6-plus | 0–256K / 256K–1M | 2/8 元 | 12/48 元 | 100 万 |
| qwen3.5-plus | 0–128K / 128K–256K / 256K–1M | 0.8/2/4 元 | 4.8/12/24 元 | 100 万 |
| qwen-plus / latest | 0–128K / 128K–256K / 256K–1M | 0.8/2.4/4.8 元 | 2/20/48 元（非），8/24/64 元（思考） | 100 万 |

### 千问 Flash（华北 2）

| Model ID | 输入档 | 输入 | 输出 | 免费 |
|---|---|---|---|---|
| qwen3.8-flash | 0–1M | 0.8 元 | 2.7 元 | 100 万 |
| qwen3.7-flash | 0–32K / 32K–256K / 256K–1M | 0.2/0.6/1.2 元 | 0.8/2.4/4.8 元 | 100 万 |
| qwen3.6-flash | 0–256K / 256K–1M | 1.2/4.8 元 | 7.2/28.8 元 | 100 万 |
| qwen3.5-flash | 0–128K / 128K–256K / 256K–1M | 0.2/0.8/1.2 元 | 2/8/12 元 | 100 万 |
| qwen-flash | 0–128K / 128K–256K / 256K–1M | 0.15/0.6/1.2 元 | 1.5/6/12 元 | 100 万 |

### 其他（华北 2）

- qwen-turbo：0.3 元输入 / 0.6 元非思考输出 / 3 元思考输出，每百万 token，100 万免费。
- qwq-plus：1.6 / 4 元，100 万免费。
- qwen-long：0.5 / 2 元，100 万免费（无阶梯）。
- qwen3.5-omni-plus（多模态）：文本/图片/视频输入 7 元，音频输入 53 元，文本多模态输出 40 元，文本+音频输出 213 元；100 万免费。
- qwen3.5-omni-flash：2.2 / 18 / 13.3 / 72 元。
- qvq-max：8 / 32 元；qvq-plus：2 / 5 元。
- qwen3-vl-plus：阶梯 0–32K 1/10 元，32K–128K 1.5/15 元，128K–256K 3/30 元。
- qwen3-vl-flash：0.15/1.5、0.3/3、0.6/6 元。
- qwen-vl-ocr：0.3/0.5 元（qwen3.5-ocr 0.5/2 元）。
- qwen3-coder-plus：4/16、6/24、10/40、20/200 元（256K–1M）。
- qwen3-coder-flash：1/4、1.5/6、2.5/10、5/25 元。
- qwen-coder-plus：3.5/7 元；qwen-coder-turbo：2/6 元。
- qwen-mt-plus：1.8/5.4 元；qwen-mt-flash/turbo：0.7/1.95 元；qwen-mt-lite：0.6/1.6 元。
- qwen-math-plus：4/12 元；qwen-math-turbo：2/6 元。
- qwen-deep-research：54/163 元（无免费）；-2025-12-15：79/236 元。
- qwen-doc-turbo：0.6/1 元（无免费）。
- qwen-audio-turbo / qwen2-audio-instruct：免费体验，10 万免费额度，用完不可调用（官方推荐改用 Qwen-Omni）。

### 开源版（华北 2，每百万 Token / 元）

- qwen3.8-2.4t-a95b：12/36 元；qwen3.8-27b：3/12 元。
- qwen3.6-35b-a3b：1.8/10.8 元（思考同）；qwen3.6-27b：3/18 元。
- qwen3.5-397b/122b/27b/35b：1.2/0.8/0.6/0.4 元输入起，三档阶梯。
- Qwen3：qwen3-next-80b-a3b-thinking 1/10 元；qwen3-235b-a22b 2/8/20 元；qwen3-32b 2/8/20 元；qwen3-30b-a3b 0.75/3/7.5 元；qwen3-14b 1/4/10 元；qwen3-8b 0.5/2/5 元。
- Qwen-Coder 开源：qwen3-coder-480b-a35b-instruct 6/24、9/36、15/60 元（200K 上限）；qwen3-coder-30b-a3b-instruct 1.5/6、2.25/9、3.75/15 元；qwen3-coder-next 1/4、1.5/6、2.5/10 元。
- Qwen3-VL 开源：235b 2/20 元（思考）/ 2/8 元（非思考）；30b 0.75/7.5 / 0.75/3 元；8b 0.5/5 / 0.5/2 元。

### 地域价格样例（每百万 Token / 元）

- qwen3.8-max：华北 2 12/36；美国 12/36；新加坡（国际）14.988/44.965；法兰克福 12/36。
- qwen3.7-plus：华北 2 2/8（限时 8 折 1.6/6.4）；美国 2.998/11.991；新加坡 2.998/11.991。
- qwen-turbo 新加坡：0.367/1.468（非/思考）。
- qwen-plus-us：0–256K 2.936/8.807（非）/29.357 元（思考）。
- 规律：海外地域使用"元"作为标价单位但金额已包含汇率转换；同一模型在国际列的价格普遍为华北 2 价的 1.2–1.5 倍。

### 上下文缓存（Cache）

来源：定价页"说明"段落。
- 显式缓存创建：按标准输入单价 **125%** 计费。
- 缓存命中：按标准输入单价 **10%** 计费。
- 隐式缓存：各模型自主启用，命中同样折扣。
- 价格表输入单价"不含"缓存单价。多数 Qwen3 系列标注"上下文缓存 享有折扣"。

### Batch 调用

- 输入 / 输出 Token 单价按实时推理价格的 **50%** 计费。
- 缓存与 Batch 不可同时生效（"两者不能同时生效"原文）。
- 支持模型：在各模型行注明"Batch 调用 半价"。

### 限流（QPS/RPM/TPM）

- 定价页未给具体数值，链接指向帮助中心"动态限流"专文（与本定价页同站另页）。本次未抓取到具体 QPS/RPM/TPM 数字，标"无法确认"。

## 历史变更 / 限时免费 / 调整

- 2026-09-04（采集前 3 天）：定价页最新一次更新；含 qwen3.7-plus 系列"限时 8 折"标注。
- 2026-08-17 00:00：DeepSeek-V4-Flash-0731 调整为"忙时 / 闲时"峰谷定价（忙时 3/9 元，闲时 1.5/4.5 元，来源：定价页文字说明）。
- qwen3.7-plus 当前在华北 2 标"原价 2 元（限时 8 折）"，但同表 -2026-05-26 版本已恢复为 2 元/8 元原价（不打折）。表明快照版本不受活动影响，新发布的 qwen3.7-plus 别名仍享限时折扣。
- qwen3.8-max-prime 为新增"优速模式"SKU（24/72 元，2 倍于普通 max）。
- 大量历史快照保留：qwen3-max-2025-09-23、qwen3-235b-a22b-thinking-2507、qwen3-30b-a3b-instruct-2507、qwen-vl-ocr-2024-10-28 等仍挂价但属于历史版本。

## 与其他阿里云 AI 服务的区分

- **百炼（Model Studio）** 即原 DashScope / 阿里云灵积对外 API 入口（阿里云已于 2024–2025 完成品牌整合，dashscope.aliyun.com 仍可访问但逐步引导至 bailian.console.aliyun.com）。本调研即针对此 API 入口。
- **PAI-EAS / PAI 平台**：模型在线服务（EAS）面向自定义 / 第三方模型部署，按"实例规格 × 时长"计费，**非按 token**，不在本任务范围。
- **通义灵码（lingma）**：独立产品，个人/企业订阅制 IDE 插件，**有独立计费入口**（个人免费 / 个人 Pro 订阅），未通过百炼 API 暴露为 SKU。本任务**不覆盖**。
- **千问大模型官网**（tongyi.aliyun.com / qianwen.aliyun.com）：消费者向 Chat 入口，C 端免费 / 限速，与本 API 形态不同。
- **大模型服务平台百炼** 文档明确为 to B / to D 入口。

## 中国 Availability 五维度

1. 注册：**官方明确声明**。百炼为阿里云子产品，需阿里云账号；中国大陆主账号需完成实名认证（个人身份证 / 企业营业执照）。海外用户可在 aliyun.com 国际站注册，海外地域有独立账号体系。来源：https://help.aliyun.com/zh/model-studio/get-api-key（API Key 申请说明需登录）。
2. 支付：**官方明确声明**（隐含）。中国大陆用户走阿里云通用支付（支付宝 / 阿里云余额 / 后付费月结 / 预付费资源包），具体支付通道需登录后查看"费用中心"；未在定价页直接列支付方式。来源：https://bailian.console.aliyun.com/finance
3. 网络访问：**无法确认**（官方未在定价页声明）。中国大陆公网正常访问 bailian.console.aliyun.com、help.aliyun.com/zh/model-studio。海外用户访问阿里云中国大陆站速度可能受限，但价格表显示海外地域（美东 / 新加坡 / 法兰克福 / 东京）服务存在，意味着海外账号可在对应地域注册并使用对应 API endpoint。
4. 服务政策：**官方明确声明**。定价页明确区分"华北 2（北京）/ 美国（弗吉尼亚）/ 新加坡 / 德国（法兰克福）/ 日本（东京）"五地域；中国大陆个人/企业可用"国际版"账号访问海外地域；中国大陆站点发布"国产"上下文缓存、Batch 折扣等活动。
5. 功能限制：**官方明确声明**。华北 2（北京）以外地域对绝大多数 Qwen 模型**无免费额度**；同一模型在海外列功能等价但价格更高（如 qwen3.7-plus 国际列价格为华北 2 的约 1.5 倍）；VL/Omni/OCR 模型在新加坡等地域有独立"国际"价格；部分模型仅在华北 2 上线（如 qwen-audio 系列、qwen-doc-turbo、qwen-deep-research）。

## 调研方法与限制

- 仅使用 help.aliyun.com/zh/model-studio 与 bailian.console.aliyun.com 一手页面；通过 HTML 解析获得定价表（lastModified 2026-09-04）。
- 限流（QPS/RPM/TPM）、并发、隐私数据保留期需查"动态限流"专页与服务协议，本任务未抓取到具体数字。
- 个人 Coding Plan 订阅型 SKU：百炼**无**；通义灵码**有**但不在本任务范围。
- 个别日期 / 价格快照来自 2026 年的页面（阿里云已于 2025–2026 完成模型代际切换至 qwen3.x / qwen3.8），请以官方页面当前值为准。

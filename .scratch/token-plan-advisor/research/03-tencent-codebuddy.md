# 腾讯 CodeBuddy（腾讯云代码助手）官方信息来源调研

- **采集日期**：2026-09-07
- **调研范围**：腾讯 CodeBuddy 的两套官方入口：①中国站（cloud.tencent.com 产品"腾讯云代码助手"，文档产品 1749，含 CodeBuddy IDE / 插件 / CodeBuddy Code CLI 与 WorkBuddy 融合计费）；②国际站（codebuddy.ai 官网 + Tencent Cloud International 文档产品 1256）。两个入口为**独立运营、独立定价、独立账号体系**，本报告全程分开记录。
- **方法**：仅使用一手官方来源（腾讯云产品页/文档中心/公告、codebuddy.cn 与 codebuddy.ai 官网文档、tencentcloud.com/intl.cloud.tencent.com 文档与产品页、腾讯云官网 PDF）。全部 URL 于采集日经 exa 抓取核实；无法确认的字段如实标注。注意：腾讯云开发者社区（cloud.tencent.com/developer）文章可由个人账号发布，本报告不将其作为事实依据（见 §4）。

## 结论摘要

1. 国内个人版当前有效层级为**体验版（免费 500 积分/月）/ 标准版（99 元/月）/ 高级版（199 元/月）/ 旗舰版（999 元/月）**（2026-07-01 订阅升级生效）；企业版为 **SaaS 企业版 198 元/人/月（1 坐席起）、专有云企业版 316 元/人/月（100 坐席起）、私有化企业版（咨询报价）**。国际个人版为 **Free（100 credits/月）/ Pro（$10/月或 $96/年，2,000 credits/月）/ Team（$40/seat/月，1,000 credits/seat 共享池）**，2026-08-07 起生效。
2. 计量单位是**积分（Credits）**："Credits 消耗量由模型类型、Token 用量及任务复杂度共同决定"，各模型单位消耗明细**需登录个人主页查看**，公开页面无换算表——这是跨 Vendor 归一化最大障碍。
3. **来源冲突多处**：国内 1749/126592 计费概述（2026-06-08 更新）仍是"个人专业版 58 元"旧口径，与同产品 1749/109769 版本说明（2026-08-03 更新）的三档新口径并存；国际站产品页仍显示旧价 $9.95/$119.40 年，与 Billing Overview 新价 $10/$96 并存；国际 Subscription 文档写 Pro "1,000 credits/mo"，Pricing/Billing Overview 写"2,000（1,000 基础+1,000 加赠）"。
4. 中国 Availability：腾讯为中国厂商，**中国大陆用户默认可用性最好**——注册走腾讯云账号（微信/QQ 扫码）+实名认证，支付走微信支付/QQ 钱包/网银，国际站也支持 WeChat 支付；国际站服务协议签约主体为 **Tencent Cloud International Pte. Ltd.（新加坡）**，隐私政策声明功能 "available to users globally"，个人数据存新加坡（登录/凭据存香港）。官方**未发现任何针对中国大陆用户的排除性声明**。
5. 官方 API：未发现公开的套餐/用量查询 API（国际站 Admin API 亦未检索到）；用量只能登录 Web 个人主页/企业管理后台查看。

---

## 1. 官方入口清单

### 1.1 中国站

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 1 | <https://cloud.tencent.com/product/acc> | 产品页 | 中国站（简体中文；未声明地区限制） | 无 | 否 | 正常静态可读 | 是（全文） |
| 2 | <https://cloud.tencent.com/document/product/1749/126592> | 计费概述（帮助文档） | 中国站 | 无 | 否 | 正常；页首显示"最近更新时间：2026-06-08 17:47:20" | 是（全文） |
| 3 | <https://cloud.tencent.com/document/product/1749/109769> | 版本说明（帮助文档） | 中国站 | 无 | 否 | 正常；显示"最近更新时间：2026-08-03 15:25:00" | 是（全文） |
| 4 | <https://cloud.tencent.com/document/product/1749/129680> | 积分说明（帮助文档） | 中国站 | 无 | 否 | 正常 | 是（exa 快照，关键段完整） |
| 5 | <https://cloud.tencent.com/document/product/1749/126593> | 计费说明（帮助文档，企业版购买/抵扣示例） | 中国站 | 无 | 否 | 正常 | 是（exa 快照，关键段完整） |
| 6 | <https://cloud.tencent.com/document/product/1749/129681> | 个人版账号管理（用量查询说明） | 中国站 | 查询需登录 | 查询需是 | 正常 | 是（exa 快照） |
| 7 | <https://cloud.tencent.com/document/product/1749/104248> | 常见问题（CodeBuddy FAQ） | 中国站 | 无 | 否 | 正常；显示"最近更新时间：2026-07-20 19:49:30" | 是（全文） |
| 8 | <https://cloud.tencent.com/announce/detail/2270> | 官方公告（企业计费调整） | 中国站 | 无 | 否 | 正常；公告页不显示发布日期（搜索元数据显示 2026-04-28） | 是（全文） |
| 9 | <https://www.codebuddy.cn/docs/ide/Account/pricing> | 官网文档·定价（国内个人版+企业版） | 中国大陆 | 无 | 否 | 正常 | 是（全文） |
| 10 | <https://www.codebuddy.cn/docs/ide/Account/credits> | 官网文档·积分 | 中国大陆 | 无 | 否 | 正常 | 是（exa 快照，关键段完整） |
| 11 | <https://www.codebuddy.cn/docs/enterprise/price/Pricing> | 官网文档·企业定价 | 中国大陆 | 无 | 否 | 正常 | 是（exa 快照，关键段完整） |
| 12 | <https://www.codebuddy.cn/docs/enterprise/Overview> | 官网文档·企业版概述 | 中国大陆 | 无 | 否 | 正常 | 是（exa 快照，关键段完整） |
| 13 | <https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model> | 官网文档·模型配置（内置模型表） | 中国大陆 | 无 | 否 | 正常 | 是（全文） |
| 14 | <https://main.qcloudimg.com/raw/document/product/pdf/1749_109768_cn.pdf> | 购买指南 PDF（腾讯云官方 CDN） | 中国站 | 无 | 否 | 正常 | 是（exa 快照，关键段完整） |
| 15 | <https://cloud.tencent.com/document/faq/1749> 及 <https://cloud.tencent.com/document/product/1749/115710> | FAQ 索引 | 中国站 | 无 | 否 | 正常 | 是（索引级） |

"个人版订阅升级公告"原文：2026-06-16 腾讯云发布《Buddy AI 国内个人版订阅升级公告》，**其 cloud.tencent.com/announce 详情页 URL 本次未能定位**（多轮搜索只返回转载与文档引用）；公告全文要点经官方文档（codebuddy.cn 定价页、1749 PDF）交叉确认，转载源（新浪财经/财闻网）仅用于定位日期，不作为事实依据。

### 1.2 国际站

| # | 官方 URL | 入口类型 | 地区范围 | 访问前提 | 需登录 | 动态渲染/访问限制 | 本次是否成功获取 |
|---|---|---|---|---|---|---|---|
| 16 | <https://www.codebuddy.ai/> （根域，产品页/下载入口） | 产品页 | 国际（英文） | 无 | 否 | 营销页较重渲染，本次未逐页抓取 | 部分 |
| 17 | <https://www.codebuddy.ai/pricing> | 定价页（营销） | 国际 | 无 | 否 | 抓取失败（fetch failed）；定价事实以 docs 页为准 | 否 |
| 18 | <https://www.codebuddy.ai/docs/ide/Account/pricing> | 官网文档·定价 | 国际 | 无 | 否 | 正常；页尾"Last updated:"为空 | 是（全文） |
| 19 | <https://www.tencentcloud.com/document/product/1256/77269> | 帮助文档·Billing Overview | 国际 | 无 | 否 | 正常；显示"Last updated: 2026-08-07 09:37:37" | 是（全文） |
| 20 | <https://www.tencentcloud.com/document/product/1256/77270> | 帮助文档·Price details | 国际 | 无 | 否 | 正常；显示"Last updated: 2026-07-24" | 是（全文） |
| 21 | <https://intl.cloud.tencent.com/products/acc>（同内容 <https://www.tencentcloud.com/products/acc>） | 产品页 | 国际 | 无 | 否 | 正常静态 | 是（全文） |
| 22 | <https://www.tencentcloud.com/document/product/1256/77266> | 帮助文档·Product Overview | 国际 | 无 | 否 | 正常；显示"Last updated: 2026-03-02" | 是（全文） |
| 23 | <https://www.codebuddy.ai/docs/ide/Account/Subscription> | 官网文档·订阅政策 | 国际 | 无 | 否 | 正常 | 是（exa 快照，关键段完整） |
| 24 | <https://www.codebuddy.ai/docs/zh/ide/Account/credits> | 官网文档·积分（中文镜像） | 国际 | 无 | 否 | 正常 | 是（exa 快照，关键段完整） |
| 25 | <https://www.codebuddy.ai/document/term> | 法律条款·服务协议 | 国际 | 无 | 否 | 正常 | 是（exa 快照，关键段完整） |
| 26 | <https://www.codebuddy.ai/document/privacy-policy> | 法律条款·隐私政策 | 国际 | 无 | 否 | 正常 | 是（exa 快照，关键句完整） |
| 27 | <https://www.tencentcloud.com/document/product/1316/82344> | 法律条款·CodeBuddy Enterprise 隐私政策 | 国际 | 无 | 否 | 正常 | 是（exa 快照，关键句完整） |
| 28 | <https://www.codebuddy.ai/document/dpsa>、<https://www.codebuddy.ai/docs/ide/Support/security-privacy> | 法律条款·DPSA / 安全与隐私文档 | 国际 | 无 | 否 | 正常 | 是（exa 快照，关键段完整） |
| 29 | <https://www.codebuddy.ai/docs/cli/models> | CLI 文档·models.json（自定义模型） | 国际 | 无 | 否 | 正常 | 是（exa 快照，关键段完整） |
| 30 | codebuddy.ai 定价页 checkout（登录后） | 购买入口 | 国际 | 需账号 | 是 | 控制台内，未抓取 | 否（以文档描述为准） |

---

## 2. 字段覆盖矩阵

状态标注：公开（页面直接可见）/ 文档或公告 / 需登录 / 官方 API / 无法确认 / 不适用。

### 2.1 中国站（国内版）

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开 | 个人版：体验版 / 标准版 / 高级版 / 旗舰版（2026-07-01 起；此前为"个人体验版/个人专业版"）；企业版：企业旗舰版（SaaS 企业版）、企业专享版（专有云企业版）、私有化企业版。产品名："腾讯云代码助手，即腾讯云 CodeBuddy（Tencent Cloud CodeBuddy，简称 CodeBuddy）"；1749 文档树现名"WorkBuddy Enterprise" | [版本说明](https://cloud.tencent.com/document/product/1749/109769)、[计费概述](https://cloud.tencent.com/document/product/1749/126592)、[公告 2270](https://cloud.tencent.com/announce/detail/2270)、[1749 简介 PDF](https://main.qcloudimg.com/raw/document/product/pdf/1749_109768_cn.pdf) |
| Plan Type | 公开（判断） | 个人/企业档位属 **coding-subscription**（按"积分/Credits"计量的 AI 编程订阅，覆盖 IDE/插件/CLI）。但 2026-07-01 起 CodeBuddy 与 WorkBuddy（AI 办公工作台）**同一账号积分共享**（"CodeBuddy 和 WorkBuddy 同一账号积分共享，无需分别订阅"），标准版及以上同时覆盖办公智能体场景——已带有 general-subscription 性质，归一化时需注明双产品属性。私有化企业版属企业方案。另：官网文档"模型配置"提及可把"腾讯云 Token Plan""Coding Plan"作为自定义模型供应商接入（API 型产品，非本 Plan 本体） | [计费概述](https://cloud.tencent.com/document/product/1749/126592)、[codebuddy.cn 定价](https://www.codebuddy.cn/docs/ide/Account/pricing)、[模型配置](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model) |
| 价格 | 公开 | 体验版：免费。标准版 99 元/月（连续包月 70 元/月；年付 840 元/年；连续包年 672 元/年）；高级版 199 元/月（140 元/月；1,680 元/年；1,344 元/年）；旗舰版 999 元/月（700 元/月；8,400 元/年；6,720 元/年）。个人加量包：1,000 积分/50 元（1 个月）。企业：SaaS 企业版 198 元/人/月、2,376 元/人/年（1 坐席起购）；专有云企业版 316 元/人/月、3,792 元/人/年（100 坐席起购）；私有化企业版"详情请咨询"。企业加量包：2,000 Credits/100 元、5,000/245 元、10,000/480 元、50,000/2,375 元、200,000/9,200 元（6 个月）。**注意**：1749/126592 计费概述仍显示旧口径"个人专业版 58 元/人/月（696 元/人/年）" | [codebuddy.cn 定价](https://www.codebuddy.cn/docs/ide/Account/pricing)、[版本说明](https://cloud.tencent.com/document/product/1749/109769)、[计费概述](https://cloud.tencent.com/document/product/1749/126592) |
| 币种 | 公开 | 人民币（元）。未见其他币种选项说明 | 同上 |
| 计费周期 | 公开 | 月付/连续包月/年付/连续包年；"最长支持购买 30 个月"；"连续包月/连续包年默认自动续费，可随时在个人主页取消"；"到期后降级为体验版"；积分"按月发放，当月有效、不累积结转"；月会员有效期"新购当日 ~ 次月当日" | [codebuddy.cn 定价](https://www.codebuddy.cn/docs/ide/Account/pricing)、[1749 购买指南 PDF](https://main.qcloudimg.com/raw/document/product/pdf/1749_109768_cn.pdf)、[积分说明](https://cloud.tencent.com/document/product/1749/129680) |
| 额度/使用限制 | 公开 | 原文（个人版表）：基础积分/月 500/2,000/4,000/20,000；加赠积分/月（限时）—/2,000/5,000/30,000；每月实得积分（限时）500/4,000/9,000/50,000；代码实时补全"5,000 次/月（限免无限次）"或"无限次"；自动任务 3 个（限免 99 个）/15（99）/30（99）/99；模型调度"Auto 模型调度（限免全模型可选）"或"全模型可选"；创建项目数 5/10/15/20 个/人；项目成员数 3 人/项目（限免 5 人）/5/8/10；个人助理数 3/5/8/10。企业版："包含 2000 Credits/人，每月刷新，Credits 团队内共享使用，对话问答不限频"；私有化企业版"无用量限制"。赠送积分"自到账日起 1 个月内有效"。**体验版"对话和问答频率限制"无具体数值**："高频使用对话和问答时会触发限频" | [版本说明](https://cloud.tencent.com/document/product/1749/109769)、[计费概述](https://cloud.tencent.com/document/product/1749/126592)、[积分说明](https://cloud.tencent.com/document/product/1749/129680) |
| 模型与功能 | 公开 | 内置模型（模型配置页原文）：Hy3（混元思考模型，限时免费，图片输入/思考模式）、GLM-5.2（1M 上下文，长程任务）、GLM-5.1、GLM-5v-Turbo（多模态）、MiniMax-M3、MiniMax-m2.7、Kimi-K3、Kimi-K2.7-Code、Kimi-K2.6、Deepseek-V4-Flash（1M 上下文窗口）、Deepseek-V4-Pro（1M 上下文窗口）。产品简介（1749）："基于腾讯混元 + DeepSeek 双轮模型驱动……Craft 编码智能体、智能代码补全、单元测试、智能评审、代码修复等 Agent 智能体拓展能力，兼容 MCP 开放生态"。三形态：CodeBuddy IDE / 插件（VS Code、JetBrains、微信开发者工具、Xcode、Visual Studio、Android Studio）/ CodeBuddy Code CLI | [模型配置](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model)、[1749 简介 PDF](https://main.qcloudimg.com/raw/document/product/pdf/1749_109768_cn.pdf)、[产品页](https://cloud.tencent.com/product/acc)、[Product Overview 国际镜像](https://www.tencentcloud.com/document/product/1256/77266) |
| 上下文长度 | 文档或公告（部分） | 仅模型简介级："1M 上下文"（GLM-5.2）、"支持 1M 上下文窗口"（Deepseek-V4-Flash/Pro）；未公布产品级统一上下文窗口字段 | [模型配置](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model) |
| 速率限制 | 无法确认 | 体验版"对话和问答频率限制"：官方仅写"高频使用对话和问答时会触发限频"，无数值；付费版"对话问答不限频" | [计费概述](https://cloud.tencent.com/document/product/1749/126592)、[版本说明](https://cloud.tencent.com/document/product/1749/109769) |
| 并发 | 无法确认 | 官方页面无并发会话/设备数字段。查过版本说明、计费概述、FAQ | 同上 |
| 隐私/数据处理 | 文档或公告 | 国内 FAQ 含"数据安全"章节（1749/115710 索引 → 104248 正文披露插件连接域名 copilot.tencent.com）；自定义模型政策："配置参数（含 API Key）仅保存在本地 models.json 中，不上传云端"；国际企业隐私政策披露个人数据"stored in servers in Singapore"，登录/安全凭据"stored in Hong Kong"，且腾讯全球支持团队"including from the People's Republic of China (PRC), who may access your personal information"。国内个人信息处理规则专页：未单独定位 | [CodeBuddy FAQ](https://cloud.tencent.com/document/product/1749/104248)、[模型配置](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model)、[Enterprise 隐私政策](https://www.tencentcloud.com/document/product/1316/82344) |
| 注册要求 | 公开 | 腾讯云账号体系："腾讯云账号需要完成账号实名认证才能购买和使用云产品"；个人实名认证方式："微信扫码认证/ QQ 扫码认证/人脸识别认证"；注册方式含微信扫码/邮箱/QQ/公众号/企业微信。CodeBuddy 国内版客户端登录：微信登录（官方 CLI 安装说明："国际版选择 Google/GitHub 登录，国内版微信登录"——开发者社区官方稿，账号属性见 §4） | [实名认证概述](https://cloud.tencent.com/document/product/378/3629)、[注册腾讯云](https://cloud.tencent.com/document/product/378/17985) |
| 支付方式 | 文档或公告 | 腾讯云费用中心："在线充值方式包括微信支付、QQ 钱包和网银支付"；"如需使用国际卡支付，请先前往微信绑定国际卡后使用微信支付"；"账户充值前务必进行实名认证"。个人套餐自动续费扣款经微信支付（订阅升级公告："微信支付与短信会再次提醒"，经官方定价页过渡表收录） | [在线充值](https://cloud.tencent.com/document/product/555/7425)、[codebuddy.cn 定价](https://www.codebuddy.cn/docs/ide/Account/pricing) |
| 地区政策 | 无法确认 | 中国站产品页/文档**未发现**任何关于服务地区范围或国别排除的声明；私有化企业版面向"客户自有 IDC，支持离线部署" | [版本说明](https://cloud.tencent.com/document/product/1749/109769) |
| 官方购买链接 | 公开 | 企业版："下单购买后自动创建企业，立即购买"（版本说明内嵌购买入口）；个人版：codebuddy.cn 官网登录后在"个人主页 > 订阅管理"购买/管理（"加量包购买无常驻入口……CodeBuddy 或个人主页-订阅管理中会弹出提醒入口"）；产品页含"产品定价"入口与 VS Code/JetBrains 插件市场、Cloud Studio 体验入口 | [版本说明](https://cloud.tencent.com/document/product/1749/109769)、[codebuddy.cn 定价](https://www.codebuddy.cn/docs/ide/Account/pricing)、[产品页](https://cloud.tencent.com/product/acc) |
| 官方 API（用量可见性） | 无法确认 | 未发现公开套餐/用量 API；用量查询方式为"登录 CodeBuddy 官网……个人主页 > 用量管理"（Web 登录态）；企业管理后台可看成员用量明细 | [个人版账号管理](https://cloud.tencent.com/document/product/1749/129681)、[积分说明](https://cloud.tencent.com/document/product/1749/129680) |
| 更新时间 | 文档或公告 | 1749 文档页显示"最近更新时间"（计费概述 2026-06-08、版本说明 2026-08-03、FAQ 2026-07-20）；产品页与 codebuddy.cn 文档页未显示更新时间 | 各文档页 |

### 2.2 国际站（codebuddy.ai / Tencent Cloud International）

| 字段 | 状态 | 内容（保留官方原文） | 来源 |
|---|---|---|---|
| Plan 标识与名称 | 公开 | "Free"、"Pro"、"Team"（个人版与 Team 版）；文档称 "Buddy AI International Site Individual Edition" | [Pricing docs](https://www.codebuddy.ai/docs/ide/Account/pricing)、[Billing Overview](https://www.tencentcloud.com/document/product/1256/77269) |
| Plan Type | 公开（判断） | **coding-subscription**（AI 编程订阅，IDE/Plugin/CLI 三形态共用额度）。隐私政策显示产品另有 Work Mode（办公智能体），与国际站 WorkBuddy 融合趋势同国内一致 | [Billing Overview](https://www.tencentcloud.com/document/product/1256/77269)、[Enterprise 隐私政策](https://www.tencentcloud.com/document/product/1316/82344) |
| 价格 | 公开 | Free：Free。Pro：Monthly Subscription "$10.00 / month"；Annual "$96.00 / year ($8.00 / month, billed annually)"。Team："$40.00 / seat / month"、"$480.00 / seat / year"。Pro 加量包：500 Credits/$15.00（1 个月）；Team 加量包：2,000 credits/$40.00、5,000/$100.00、10,000/$200.00、50,000/$1,000.00、200,000/$4,000.00（6 个月）。**旧价**（Price details，2026-07-24 更新）："Pro $9.95 / month (Original price: $19.90 / month)"、个人加量包 1,000 credits/$9.95 | [Pricing docs](https://www.codebuddy.ai/docs/ide/Account/pricing)、[Billing Overview](https://www.tencentcloud.com/document/product/1256/77269)、[Price details](https://www.tencentcloud.com/document/product/1256/77270) |
| 币种 | 公开 | USD（所有价格以 $ 计） | 同上 |
| 计费周期 | 公开 | 月付/年付；"Base and bonus credits are issued monthly and are valid for that month; they do not roll over."；"Your billing cycle starts on the day of subscription."；加量包一次性购买不可退款 | [Pricing docs](https://www.codebuddy.ai/docs/ide/Account/pricing)、[Billing Overview](https://www.tencentcloud.com/document/product/1256/77269) |
| 额度/使用限制 | 公开 | Free：Base Credits 100/月、Promotional Bonus "30 credits / day"（当日有对话即视为活跃）、"Real-Time Code Completion 5,000 completions / month (unlimited during the promotional period)"、Automated Tasks "3 (99 during the promotional period)"、Model Routing "Auto routing (all models available during the promotional period)"。Pro：1,000 base + 1,000 bonus = 2,000 credits/月、促销 "50 credits / day"、补全 Unlimited、Automated Tasks "15 (99 during the promotional period)"、"All models available"。Team："1,000 credits per seat per month, shared through a team credit pool"。新用户："New users receive 250 credits upon registration and login……valid for 14 days"；"Pro 7-Day Free Trial……after binding a credit card and enabling auto-renewal"，赠 500 credits（7 天有效）；"After subscribing to Pro or starting the 7-day Pro trial, the Free plan's 100 credits are no longer issued separately." | [Pricing docs](https://www.codebuddy.ai/docs/ide/Account/pricing)、[Billing Overview](https://www.tencentcloud.com/document/product/1256/77269) |
| 模型与功能 | 文档或公告（部分） | Pro "All advanced models"、"Unlimited BuddyTab"、"Unlimited next-step edit prediction"、Preview feature；Team 另有 Admin Console、Unified Billing Management、"Supports use across IDEs and CLIs"。产品能力（Product Overview）：PRD 生成、设计稿生成、Figma 转码、代码补全/评审、BaaS 集成（Supabase、Tencent CloudBase）、一键部署（CloudStudio、EdgeOne Pages）。**国际版内置模型完整清单：无法确认**（docs 首页仅称 "Multi-Model Support: Supports various conversational large models including Hunyuan, DeepSeek, and more"） | [Price details](https://www.tencentcloud.com/document/product/1256/77270)、[Product Overview](https://www.tencentcloud.com/document/product/1256/77266)、[docs 首页](https://www.codebuddy.ai/docs/) |
| 上下文长度 | 无法确认 | 国际站未公布产品级上下文窗口；CLI models.json 仅有用户自定义模型的 `maxInputTokens` 字段（示例值非承诺值） | [cli/models](https://www.codebuddy.ai/docs/cli/models) |
| 速率限制 | 无法确认 | 未公布速率数值；限额表现为 credits 消耗 + 月度池 | 同上 |
| 并发 | 无法确认 | 官方页面无并发字段 | 同上 |
| 隐私/数据处理 | 文档或公告 | 隐私政策："This Feature is available to users globally, but primarily intended for users located in the same country/region as the selected service region for optimal performance."；企业版："your personal information will be stored in servers in Singapore"（登录与安全凭据存香港）；"We do not store any such data permanently"（DPSA：代码与项目内容仅为提供功能而处理，不永久存储）；保留期限：IP 180 天、后端日志 14 天、账号删除后 30 天内删除信息等；签约主体见地区政策行 | [隐私政策](https://www.codebuddy.ai/document/privacy-policy)、[Enterprise 隐私政策](https://www.tencentcloud.com/document/product/1316/82344)、[DPSA](https://www.codebuddy.ai/document/dpsa)、[Security and Privacy](https://www.codebuddy.ai/docs/ide/Support/security-privacy) |
| 注册要求 | 公开 | 需 codebuddy.ai 账号（CLI 官方说明：国际版 "Google/GitHub 登录"）；Pro 试用需"binding a credit card and enabling auto-renewal"；DPSA 要求终端用户达到所在司法辖区最低同意年龄；服务协议签约对象为 "Tencent Cloud International Pte. Ltd., a Singapore registered entity" | [Billing Overview](https://www.tencentcloud.com/document/product/1256/77269)、[服务协议](https://www.codebuddy.ai/document/term)、[cli 安装说明（见 §4 注）](https://developer.cloud.tencent.com/article/2566270) |
| 支付方式 | 公开 | "Supported payment methods: Credit Card / Debit Card / WeChat / Prepaid Card."（Billing Overview / Subscription 两处一致） | [Billing Overview](https://www.tencentcloud.com/document/product/1256/77269)、[Subscription](https://www.codebuddy.ai/docs/ide/Account/Subscription) |
| 地区政策 | 文档或公告 | 服务协议主体为新加坡实体 Tencent Cloud International Pte. Ltd.；隐私政策："This Feature is available to users globally"；个人数据存新加坡（登录/凭据存香港）。**未发现国别排除清单** | [服务协议](https://www.codebuddy.ai/document/term)、[隐私政策](https://www.codebuddy.ai/document/privacy-policy) |
| 官方购买链接 | 公开 | "Go to the CodeBuddy Pricing page. Ensure you are logged in……"（登录 codebuddy.ai 后订阅）；企业版经 tencentcloud.com/codebuddy.ai 售前渠道 | [Billing Overview](https://www.tencentcloud.com/document/product/1256/77269) |
| 官方 API（用量可见性） | 无法确认 | 未发现公开用量/套餐 API（查过 docs 目录、Billing Overview、credits 文档）；用量查看："登录 codebuddy.ai → 头像 → 个人主页 → 用量" | [国际积分说明](https://www.codebuddy.ai/docs/zh/ide/Account/credits) |
| 更新时间 | 文档或公告 | tencentcloud.com 文档显示 Last updated（77269：2026-08-07；77270：2026-07-24；77266：2026-03-02）；codebuddy.ai Pricing docs 页尾 "Last updated:" 为空 | 各页 |

---

## 3. 价格/额度的原始表达方式与归一化歧义

### 3.1 官方原始表述（照录）

- 国内（个人版表）："基础积分 / 月 500｜2,000｜4,000｜20,000"、"每月实得积分（限时）500｜4,000｜9,000｜50,000"、"代码实时补全 5,000 次/月（限免无限次）→ 无限次"、"自动任务 3 个（限免 99 个）"。
- 国内（企业版）："198 元/人/月，1 个坐席起购 包含 2000 积分/人，每月刷新 积分团队内共享使用 对话问答不限频"。
- 国际："Total Credits / Month 100｜2,000"、"Promotional Bonus (Limited-Time Offer) 30 credits / day｜50 credits / day"、"5,000 completions / month (unlimited during the promotional period)"、"$96.00 / year ($8.00 / month, billed annually)"。

### 3.2 归一化歧义清单

1. **Credits 是黑盒复合单位**：官方明确消耗由"模型类型、Token 用量及任务复杂度"共同决定，各模型单位消耗明细需登录查看——无法从公开页面把"2,000 credits/月"换算成消息数或 token 数。跨 Vendor 比较只能保留"credits"原单位，不能与 Cursor 的美元等值池或 Gemini 的请求数直接换算。
2. **两套"积分"口径并存**：国内"基础积分"与"加赠积分（限时）"构成"每月实得积分"；国际同构（1,000 base + 1,000 bonus）。Subscription 文档写 Pro "1,000 credits/mo"指基础额度，Pricing 页 "Total 2,000"指实得——采集时必须区分 base/bonus/total 三个槽位，且 bonus 属"限时"权益（促销结束即回落）。
3. **"无限/不限频"的限定条件**：补全"无限次"仅付费档；体验版补全"5,000 次/月（限免无限次）"——"限免"促销口径与标准口径在同一单元格内并存。"对话问答不限频"仅付费档，体验版限频但无数值。
4. **限时活动字段时效性极强**：国内"加赠积分/月（限时）"、企业"双倍 Credits"（2026-07-01～09-30）、国际"Promotional Bonus"（结束时间"will be notified separately"）、"7 月内一次性补发 500 积分"等一次性补偿，都必须带生效区间采集。
5. **双产品共享额度**：CodeBuddy 与 WorkBuddy 同账号积分共享，同一个额度池横跨编程与办公场景，"人均编程用量"无法从套餐字段推断。
6. **国内/国际同构不同价不同币**：国内标准版 99 元 vs 国际 Pro $10（约 72 元），档位名完全不同（标准/高级/旗舰 vs Free/Pro/Team），不能按档位名对齐。
7. **计费周期折扣链复杂**：国内有月付/连续包月（7 折）/年付（7 折）/连续包年（再享 8 折）四条价格线；"连续包年"是"订阅式年付"，与"年付"（一次性）价格不同，建模时是两个 SKU。

---

## 4. 来源冲突、更新频率与历史变更方式

- **冲突 1（国内个人版价格，未收敛）**：1749/126592 计费概述（最近更新 2026-06-08）仍列"个人专业版 58 元/人/月、696 元/人/年、含 2000 Credits"；1749/109769 版本说明（2026-08-03）与 codebuddy.cn 定价页已列三档新方案（99/199/999 元）。同一文档产品内两页并存，**当前有效价以版本说明/官网定价页为准，计费概述页未同步**。
- **冲突 2（国际站价格过渡）**：Billing Overview（2026-08-07）："When the pricing plan takes effect on August 7, 2026 (UTC+8)……"，新价 $10/月、$96/年；同页"Price Retention: Pro (monthly/annual) users who enabled auto-renewal before August 7, 2026 retain their subscription price of $9.95/month"。而 Price details（2026-07-24）与产品页仍显示 $9.95（划线 $19.90）、$119.40/year、加量包 $9.95——**旧价页面未下线**，价格字段存在三个版本并存。
- **冲突 3（国际 Pro 额度口径）**：Subscription 文档 "Pro $9.95/mo, 1,000 credits" vs Pricing/Billing Overview "2,000 (1,000 base + 1,000 bonus)"。属"基础额度 vs 实得额度"口径差，不是数值错误，但若只抓单页会得出减半结论。
- **开发者社区/媒体内容的采信边界**：cloud.tencent.com/developer 文章可由个人发布（如"中国版Cursor问世"作者"凯冰"、专栏 Base_CDNKevin，2025-05-30；"CodeBuddy IDE 内测启动"2025-07-11），**不作为事实依据**。带官方色彩但发布在第三方平台的内容：博客园"腾讯云专区"（brands.cnblogs.com/tencentcloud，2025-09-09 CLI 发布+IDE 公测稿）、新浪财经/财闻网转载订阅升级公告全文（2026-06-16）、Futu 快讯（2025-07-22 内测、2025-08-21 国内公测，含模型型号 DeepSeek-V3.1-Think/hunyuan-turbos）——仅作历史线索，本报告字段矩阵未采信。CLI 登录方式（国际 Google/GitHub、国内微信）出自开发者社区 2025-09-10 稿，属官方稿但账号属性未能核实，已标注。
- **更名/产品线演变（官方可考部分）**：产品原名"腾讯云 AI 代码助手"，官方简介现表述为"腾讯云代码助手，即腾讯云 CodeBuddy（Tencent Cloud CodeBuddy，简称 CodeBuddy）"；2026 年与 WorkBuddy 融合为 "Buddy AI"（公告 2270："双产品融合"），1749 文档树更名"WorkBuddy Enterprise"，但产品页与 FAQ 仍称"腾讯云代码助手"——同一时刻三个名称并存。品牌更名的确切日期：**官方公告原文未能定位，无法确认**。
- **历史变更记录（官方公告/文档可考）**：①2026-05-15 企业计费调整（企业旗舰版 78→198 元/人/月更名 SaaS 企业版；专享 158→316 元更名专有云企业版；加量包同步涨价，公告 2270）；②2026-07-01 国内个人版三档升级（标准版由专业版 58 元变更为 99 元档，老用户"2026 年 12 月 31 日前按 58 元/月自动续费，2027 年 1 月 1 日起按 70 元/月"）；③2026-08-07（UTC+8）国际个人版调价生效（Pro $9.95→$10、额度调整至 2,000 credits、老用户保价）。更早的免费时代（"国内版免费/测试期赠送额度"）仅见开发者社区稿，**官方定价页无存档，无法确认具体日期**。
- **更新频率**：tencentcloud.com/1749 文档页带"最近更新时间"且更新频繁（计费类页面 2026 年内至少 3 次）；codebuddy.ai docs 不显示时间；公告页不显示发布日期（需靠搜索元数据）。
- **无法确认当前有效值的字段**：体验版限频具体数值；各模型 credits 消耗明细（需登录）；国际版内置模型完整清单；国内版 CodeBuddy IDE（非 WorkBuddy 文档树）内置模型清单是否与上表一致；品牌更名与 IDE 各版本（内测/公测/GA）确切日期；个人版订阅升级公告的官方公告 URL。

---

## 5. 中国 Availability（五维度）

> 原则声明：本节区分"官方明确声明"与"无法确认"；页面无法访问不作为官方政策限制的证据。腾讯 CodeBuddy 为中国厂商产品，此处重点回答三问：大陆用户默认可用性、海外用户可否使用、官方对服务地区的声明。

| 维度 | 状态 | 说明 |
|---|---|---|
| 注册 | 官方明确声明 | 国内站：需腾讯云账号，注册方式含微信扫码/QQ/邮箱等（[注册腾讯云](https://cloud.tencent.com/document/product/378/17985)）；"腾讯云账号需要完成账号实名认证才能购买和使用云产品"，个人实名认证为"微信扫码认证/QQ 扫码认证/人脸识别认证"（[实名认证概述](https://cloud.tencent.com/document/product/378/3629)）——**中国大陆用户注册即默认流程，实名认证是购买前提**。国际站：需 codebuddy.ai 账号，Pro 试用需绑卡（[Billing Overview](https://www.tencentcloud.com/document/product/1256/77269)）；未发现"中国大陆用户不得注册国际站"的声明。 |
| 支付 | 官方明确声明 | 国内站：微信支付、QQ 钱包、网银支付（[在线充值](https://cloud.tencent.com/document/product/555/7425)），充值前须实名；个人套餐自动续费经微信支付扣款（官方定价页过渡表）。国际站："Credit Card / Debit Card / **WeChat** / Prepaid Card"（[Billing Overview](https://www.tencentcloud.com/document/product/1256/77269)）——**官方明确国际站支持微信支付**，中国大陆用户可否用人民币银联卡走卡通道：官方未列卡种清单，无法确认。海外用户购买国内站套餐：需先完成国内实名认证（港澳台个人有微信扫码认证通道，见 378/3629），实际可行性官方未进一步说明。 |
| 网络访问 | 官方明确声明（架构事实）+ 中国维度无法确认 | 国内服务域名 copilot.tencent.com（[FAQ](https://cloud.tencent.com/document/product/1749/104248)），部署于腾讯云（SaaS 企业版"腾讯云共享 VPC"、专享版"专享 VPC"、私有化版"客户自有 IDC，支持离线部署"）；**未发现任何关于海外访问国内站受限的声明**，反之亦然。 |
| 服务政策 | 官方明确声明（国际站）+ 中国维度无法确认 | 国际站服务协议主体为腾讯云国际（新加坡）实体，隐私政策声明 "This Feature is available to users globally"，个人数据存新加坡、登录/凭据存香港（[隐私政策](https://www.codebuddy.ai/document/privacy-policy)、[Enterprise 隐私政策](https://www.tencentcloud.com/document/product/1316/82344)）。**这是本次调研中唯一的"地区范围"官方声明，且为全球可用口径，未排除中国大陆**。国内站无服务地区声明。 |
| 功能限制 | 官方明确声明（产品线差异）+ 中国维度无法确认 | 官方明确的差异是**产品线/市场维度而非用户地域维度**：国内站内置模型为混元/GLM/MiniMax/Kimi/DeepSeek 系列，国际站内置模型清单未公布（docs 仅称含 Hunyuan、DeepSeek 等）；免费期活动、限时加赠、老用户保价等均按站点独立执行。未发现"中国大陆用户功能受限"的声明；也未发现海外用户使用国内站的功能限制说明。 |

---

## 6. 对 Data Provider / Recommendation Policy 的建议（供后续 ticket 引用）

- **最小来源契约**：国内 = `codebuddy.cn/docs/ide/Account/pricing`（个人+企业价格/额度全表）+ `cloud.tencent.com/document/product/1749/109769`（版本说明，企业三形态与功能差异）+ `cloud.tencent.com/document/product/1749/129680`（积分规则）；国际 = `codebuddy.ai/docs/ide/Account/pricing` + `tencentcloud.com/document/product/1256/77269`（Billing Overview，生效日期/过渡/支付）。5 页可覆盖全部核心字段。
- **核心字段（缺失应阻止强排名）**：价格+币种+计费周期、每月实得积分（区分 base/bonus/限时）、补全限额、Credits 消耗模型（黑盒声明本身）。国际站**必须同时抓 77269 与 77270**，否则会漏掉调价过渡。
- **失败分类建议**：`OK`（docs/文档静态页）；`RENDER_DEPENDENT`（codebuddy.ai/pricing 营销页，本次 fetch 失败；替代=docs 定价页）；`LOGIN_REQUIRED`（各模型 credits 消耗明细、用量页）；`STALE_CONFLICT`（1749/126592、intl 产品页旧价——需要多源交叉而非取第一个值）。
- **字段优先级提示**：本 Vendor 的"额度"没有 token/请求换算表（登录后才有），跨 Vendor 归一化时应把"credits/月"建模为独立单位并标注"官方黑盒"，禁止与请求式/token 式额度直接换算排名。

## 7. 未解决问题

1. 各模型 Credits 消耗明细表（官方明确需登录个人主页查看；未获取）。
2. 体验版"对话和问答频率限制"的具体数值（官方只写"高频使用会触发限频"）。
3. 国际版（codebuddy.ai）内置模型完整清单及各 Plan 模型差异；国内 CodeBuddy IDE 内置模型清单与 WorkBuddy 文档所列是否一致。
4. 《Buddy AI 国内个人版订阅升级公告》的官方公告 URL（cloud.tencent.com/announce 详情页）；"腾讯云AI代码助手→CodeBuddy"品牌更名的官方原文与日期。
5. CodeBuddy IDE 内测（约 2025-07）/国内版公测（约 2025-08-21）/公测开放（2025-09-09）的官方一手公告（现仅媒体/社区线索）。
6. 产品级上下文窗口字段（仅个别模型简介标"1M 上下文"）；并发与速率数值（无官方字段）。
7. 国内站是否提供面向个人的官方用量/套餐 API；国际站是否有 Admin API（未检索到文档）。

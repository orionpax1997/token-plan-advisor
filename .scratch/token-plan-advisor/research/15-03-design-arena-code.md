# Design Arena Code Leaderboard 调研

- 来源：<https://www.designarena.ai/leaderboard/code>
- 维护主体：Arcada Labs Incorporated（Design Arena）
- 榜单名称：Overall Frontend (Text-to-HTML)
- 本次采集：2026-09-08 06:27 UTC
- 官方方法：<https://www.designarena.ai/about>、<https://notes.designarena.ai/methodology/>

## 定位与数据获取

该页面不是通用软件工程或代码正确性 benchmark，而是用户对模型生成前端作品的盲测偏好排行榜。当前页面实际调用：

```http
POST https://www.designarena.ai/api/leaderboard
{"arenaType":"models","category":"allcategories"}
```

接口当前返回 164 个有分数的模型条目，字段包括 `modelId`、`wins`、`losses`、`battles`、`winRate`、`elo`、`btStdErr` 和 `avgGenerationTimeMs`。官方 registry 当前返回 496 个模型，不能把 registry 总数当榜单覆盖数。正式 API 需要 API key；文档称可用于个人和商业项目但要求署名和链接，Terms 又限制爬虫、复制和商业用途，存在适用范围张力。生产使用应采用获批 API 并先确认许可，不依赖匿名接口批量抓取。

来源：<https://www.designarena.ai/api/leaderboard>、<https://www.designarena.ai/api/registry>、<https://docs.designarena.ai/introduction>、<https://docs.designarena.ai/api-reference/leaderboard>、<https://www.designarena.ai/terms-and-conditions>

## 能力与指标

Overall Frontend 聚合 Website、UI Component、Game Development、Data Visualization 和 3D Design 五类单文件 HTML 输出。真实用户 prompt 触发生成，结果在浏览器中渲染，再由用户进行匿名 pairwise preference 选择。

- `Elo`：基于模型间 head-to-head 的相对技能评分，平台内部约以 1200 为基准。
- `winRate`：直接比较中的胜率。
- `battles`：参与的比较次数。
- `avgGenerationTimeMs`：平均生成时间，可作平台特定速度参考。
- 页面有 Preference vs Price 图表，但价格不是当前 leaderboard 原始评分字段。

官方方法称每个 pairwise vote 等权，Elo 是 Bradley-Terry strength 的近似；不同官方页面对最低比较数存在差异，方法页写 15，About 页写主图少于 50 过滤且约 200 次才较可靠。当前 `allcategories` 的 `btStdErr` 为 null，不应自行制造精确误差范围。

来源：<https://notes.designarena.ai/methodology/>、<https://www.designarena.ai/about>、<https://docs.designarena.ai/api-reference/leaderboard>

## 评测条件

- Code 页面是单轮、单文件 HTML 生成，无 agent loop、tool calls 或 follow-ups。
- 任务来自真实用户 prompt，不是固定公开题库；官方方法页称 prompt 少于 5,000 字符，system prompt bundle 又声明 10,000 字符上限，限制可能已变化。
- 可选 prompt enhancement 使用 `gemini-2.5-flash-lite-preview-09-2025`，增强前后不是同一 prompt 分布。
- 输出在 sandboxed iframe、约 1200px viewport 中渲染；允许部分 CDN/library。
- 每个投票 session 随机抽取 4 个模型加 1 个 backup，形成多组 pairwise votes；active sampling 使模型曝光和对手结构不必均匀。
- 没有编译、单元测试或功能测试通过率；主要成功信号是用户视觉和交互偏好。

来源：<https://www.designarena.ai/system-prompts>、<https://www.designarena.ai/about>、<https://notes.designarena.ai/methodology/>、<https://github.com/Design-Arena/agent-runner>

## 可比性与风险

只在同一类别、同一时间快照、相近 battle 数和相同过滤规则下比较。Overall Frontend 不能与单独 Website/UI/Game 等类别直接等价；Elo 是随模型池、prompt 分布和采样策略变化的相对位置，历史快照不能直接比较。win rate 与 Elo 也可能不同排序。

主要风险：主观视觉偏好、真实用户 prompt 分布、五类任务混合、active sampling、模型推理配置和 output token 不统一、版本漂移、CDN 依赖、样本量不足以及当前误差字段不可验证。官方 Terms 还声明不保证数据完整、及时或可靠。

建议证据等级：页面/接口/registry/system prompt 当前字段为 A；About、Methodology、API 文档的方法说明为 B；无法由此确认固定厂商权重版本、代码正确性或工程能力。

## Coding Plan 使用边界

可作为单轮单文件 HTML 前端生成、视觉设计、布局、交互表现和 prompt adherence 的相对偏好信号；`avgGenerationTimeMs` 只能作为该平台的粗略生成速度参考。

不得推断编译、测试、代码正确性、可维护性、安全性、多文件仓库开发、终端工具、调试、重构、后端、部署、生产可靠性、通用智能或 Coding Plan 整体优劣，也不能把模型排名直接映射为套餐排名。

# 02: 探索 Benchmark 数据源、指标与可比性

**What to build:** 产出一份可供后续 Benchmark Adapter、标准能力 Schema 和 Recommendation Policy 使用的 benchmark 调研结果，明确哪些 benchmark 数据源可信、能够覆盖哪些 Coding 能力指标、适用哪些模型或 Vendor，以及不同来源之间在什么条件下可以或不可以比较。该 ticket 只做事实探索和可比性分析，不实现生产 Adapter，不把 benchmark 分数直接纳入推荐排序。

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] 建立候选 benchmark 数据源清单，优先记录官方 benchmark、公开且可复核的原始结果、研究机构或标准组织来源；每个来源记录 URL、维护主体、发布时间/更新时间、许可或访问限制和数据获取方式。
- [ ] 为每个来源记录可覆盖的能力指标，例如代码生成、代码修改、仓库级任务、工具调用、调试、测试生成、上下文理解、长上下文、响应速度或成本相关指标，并区分 benchmark 原始指标与可供 Recommendation 使用的标准化指标。
- [ ] 记录每项结果的模型版本、Vendor、测试 harness、任务集版本、提示词、工具环境、上下文长度、成功判定、重复次数、时间窗口和其他影响结果解释的条件。
- [ ] 分析不同 benchmark、不同版本、不同模型快照和不同测试条件之间的可比性，明确哪些结果可以直接比较、需要归一化后比较、只能作为参考，以及完全不可比较的情况。
- [ ] 识别 benchmark 数据的时效性、重复测试、选择偏差、样本量、缺失条件、营销性自报结果和第三方转载风险；提出置信状态或证据等级建议。
- [ ] 分析 benchmark 指标如何与 Coding Plan 发生关联，特别是 Plan 包含多个模型、模型可动态变化或套餐能力与模型 benchmark 能力不等价的情况；禁止把模型分数直接当成 Plan 分数的场景要明确列出。
- [ ] 给出 Benchmark Adapter 所需的最小输入/输出信息、字段优先级、不可比条件和禁止推断规则，并明确哪些数据可以进入评分、只能进入解释、或必须排除。
- [ ] 将调研结论、来源链接、采集日期、指标覆盖矩阵、可比性规则、风险和未解决问题写入该 ticket 的 `## Answer`，使后续实现 ticket 可以直接引用，不用重新猜测 benchmark 能力。

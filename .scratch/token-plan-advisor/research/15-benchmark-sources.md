# Benchmark 数据源调研索引

> 对应 issue：`.scratch/token-plan-advisor/issues/02-explore-benchmark-sources-and-comparability.md`
>
> 本次只探索用户指定的 6 个来源。每个来源由独立 subagent 负责调研并写入独立 Markdown；本索引只记录状态和后续汇总入口。

## 独立调研文件

| 来源 | 文件 | 状态 |
|---|---|---|
| DeepSWE | [15-01-deepswe.md](15-01-deepswe.md) | 已完成 |
| Arena Agent | [15-02-arena-agent.md](15-02-arena-agent.md) | 已完成 |
| Design Arena Code | [15-03-design-arena-code.md](15-03-design-arena-code.md) | 已完成 |
| Artificial Analysis Intelligence | [15-04-artificial-analysis-intelligence.md](15-04-artificial-analysis-intelligence.md) | 已完成 |
| Harbor Terminal-Bench | [15-05-harbor-terminal-bench.md](15-05-harbor-terminal-bench.md) | 已完成 |
| Zapier Benchmarks | [15-06-zapier-benchmarks.md](15-06-zapier-benchmarks.md) | 已完成 |

## 统一要求

每份来源文件应记录：维护主体、URL、采集日期、页面更新时间、许可/访问限制、数据获取方式、能力指标、原始指标定义、模型和 Vendor、模型版本、harness、任务集、提示词、工具环境、上下文、成功判定、重复次数、可比性规则、风险、证据等级、Coding Plan 可用范围和禁止推断。

跨来源结论将在 issue 的 `## Answer` 中统一整理，不把不同来源的原始分数直接合并为 Plan 分数。

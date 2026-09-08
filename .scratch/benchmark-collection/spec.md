# Benchmark Collection：6 来源 Benchmark 信息采集（第二批）

Status: ready-for-agent

本批次在核心包内实现 Benchmark 信息采集：Benchmark Record Schema v1、Adapter 契约、6 个指定来源的快照采集、能力标签、证据等级与可比性门控。范围以 [探索 02 的 Answer](../token-plan-advisor/issues/02-explore-benchmark-sources-and-comparability.md) 为准，单来源事实见 [research/](../token-plan-advisor/research/) 下 15 系列文件。本批次是 [父规格](../token-plan-advisor/spec.md) 的第二个垂直切片，依赖第一批建立的核心包脚手架。

关键定位：benchmark 结果本质是版本化快照，"最新"指最新已发布的 leaderboard/dataset revision，实时抓取动态榜单反而破坏可比性；因此本批统一以官方快照为输入（探索实现约束），不实现自动抓取。

## In Scope

- Benchmark Record Schema v1：探索 Answer 定义的最小输入/输出字段全集、9 类标准化能力标签、证据等级 A/B/C、可比性分级、`allowed_use`（scoring | explanation | exclude）与禁止推断清单
- 6 个来源的快照采集与标准化：DeepSWE v1.1、Terminal-Bench 4.0（`4-0-0`）、Zapier AutomationBench 1.0.6、Artificial Analysis Intelligence v4.1.1、Arena Agent、Design Arena Code
- CLI benchmark 采集命令与机读输出契约（本批冻结）

## Out of Scope

- 模型→Plan 映射引擎（探索未解决问题 1、7，需要官方 Plan 模型清单与路由事实）
- Recommendation Policy、评分、动态权重、跨来源加权、统一 0-100 尺度或"Plan benchmark 总分"
- 对任何来源的自动抓取/定时刷新（含技术上可行的 DeepSWE/Terminal-Bench/Zapier）；许可与授权确认后另立 tickets
- ToS 受限来源（Arena、Design Arena、Artificial Analysis）的自动化访问授权申请
- coding-subscription 采集批次（core-coding-plan-collection）之外的 Plan Provider 工作

## Tickets

| # | Ticket | Blocked by |
|---|--------|-----------|
| 01 | Benchmark Record Schema v1 + Adapter 契约 + DeepSWE 端到端 | [core 批次 01](../core-coding-plan-collection/issues/01-core-schema-zai-provider.md) |
| 02 | Terminal-Bench 4.0 与 Zapier AutomationBench 采集 | 本批 01 |
| 03 | Artificial Analysis Intelligence v4.1.1 采集 | 本批 01 |
| 04 | Arena Agent 与 Design Arena Code 快照采集（仅参考类） | 本批 01（02–04 可并行） |
| 05 | 6 来源验收与 benchmark 输出契约冻结 | 本批 02、03、04 |

依赖图：

```text
core 批次 01
    └── 本批 01 ──┬── 02 ──┐
                  ├── 03 ──┼── 05
                  └── 04 ──┘
```

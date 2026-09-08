# Arena Agent Leaderboard 调研

- 来源：<https://arena.ai/leaderboard/agent>
- 维护主体：Arena Intelligence, Inc. d/b/a Arena
- 页面当前快照：显示更新时间 2026-09-05、2,285,256 sessions、59 models；本次访问时间 2026-09-08 UTC。
- 定位：动态真实用户 Agent 会话测量，不是固定 benchmark 数据集。

## 数据与访问限制

数据来自 Agent Mode 的真实用户工作流，公开页面提供模型/Vendor、总体 Net Improvement、五类信号、sessions、P50 cost/task、P50 output tokens/task、价格、置信区间和排名。未公开固定任务集、完整 prompt、原始 session trace、system prompt、工具 schema/版本、采样参数、逐任务结果、固定 API model ID 或可本地重跑 harness。

服务条款禁止程序化或自动化抓取、提取或下载网页数据，未发现 Agent leaderboard 聚合数据的独立开放许可证。若需系统性使用，应先取得 Arena 明确许可。隐私政策说明数据可能来自真实用户内容并被汇总、去标识化或用于评估和产品改进。

来源：<https://help.arena.ai/articles/5629909088-terms-of-use>、<https://arena.ai/robots.txt>、<https://help.arena.ai/articles/3765052346-privacy-policy>

## 评测对象与指标

评测对象是 Agent orchestrator，即决定何时、如何调用 bash、web search、文件读写等工具的主模型；当前生产设置为 `K=1`。任务包括软件工程、研究、规划、文档、网页开发和文件分析等。

| 信号 | 含义 | 原始方向 |
|---|---|---|
| Confirmed Success | 用户对 task 轨迹 approve/disapprove | 高好 |
| Praise vs Complaint | task 内表扬是否多于抱怨 | 高好 |
| Steerability | 用户纠正后模型是否有效修正 | 高好 |
| Bash Recovery | bash 失败后恢复到成功命令的行为 | 重试少好 |
| Tool Hallucination | 调用不存在工具或向工具字段泄漏无效内容 | 发生率低好 |

Net Improvement 是相对随机化平均 baseline 的 treatment effect，不是绝对成功率；总体值当前为五个信号的等权聚合，页面提供 95% 置信区间。成本和 token 是真实任务工作流的 P50 统计，不是 headline correctness 指标。

来源：<https://arena.ai/blog/agent-arena-methodology>、<https://help.arena.ai/articles/5432423882-how-to-use-agent-mode>、<https://arena.ai/blog/agent-categories-and-cost>

## 评测条件

Agent Mode 通过随机分流将 session 分配给一个模型。用户可使用 bash/sandbox、web search、文件读写、文件上传等工具；一个 session 可包含多个 task、长时间多轮交互和上下文 carry-over。没有固定 prompt、题集、重复次数、seed、统一上下文窗口或公开完整的工具和失败处理配置。

## 可比性、风险与证据等级

1. 优先只比较同一页面快照内的相对表现，并查看 95% 置信区间。
2. 跨日期不能直接比较绝对 Net Improvement，因为时间衰减和新增模型会改变 baseline。
3. Overall 是混合任务分布，不能解释为 coding-only 排名。
4. 不同模型、工具、system prompt、上下文和 harness 的组合不能拆成纯模型分数与其他 benchmark 横比。
5. Tool Hallucination 等指标须保留原始方向，不能把所有列都当同一种概率。
6. 真实用户任务、用户反馈、任务混合、模型版本漂移和隐私不可审计是主要偏差来源。

证据等级建议：当前页面快照字段为 A；官方指标和因果方法为 A-；Agent Mode 产品环境为 B+；固定 API 版本、绝对代码成功率、测试通过率和 pass@k 未提供。

## Coding Plan 使用边界

可作为多轮工具编排、bash 错误恢复、用户纠错响应、真实 Agent 工作流完成信号和相对工作流成本的方向性外部证据。

不得推断单元测试/集成测试通过率、SWE issue resolution、固定 coding prompt 的绝对能力、代码质量、企业仓库成功率、特定 API model ID、Coding Plan 的价格/额度/延迟/可用性/合规性，也不得把 Overall 排名直接映射为 Coding Plan 排名。

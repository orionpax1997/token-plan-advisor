# DeepSWE Benchmark 调研

- 来源：<https://deepswe.datacurve.ai/>
- 维护主体：Datacurve；官方仓库：<https://github.com/datacurve-ai/deep-swe>
- 本次采集：2026-09-08T06:18:34Z
- 当前 release：v1.1；官网显示更新时间 2026-09-03，113 个任务。

## 数据与许可

官方公开任务、trials 和 leaderboard JSON artifacts、任务目录、执行说明和运行代码。仓库标注 Apache License 2.0，但该许可不能自动覆盖引用的第三方仓库、任务数据、模型输出或其他第三方内容；未发现独立的 DeepSWE 数据集许可证。官网要求 benchmark 数据不进入训练语料，并提供 `deep-swe-canary` GUID。提交自有模型或 agent 需要联系维护方。

来源：<https://deepswe.datacurve.ai/run>、<https://deepswe.datacurve.ai/artifacts/v1.1/release.json>、<https://raw.githubusercontent.com/datacurve-ai/deep-swe/main/README.md>、<https://raw.githubusercontent.com/datacurve-ai/deep-swe/main/LICENSE>

## 能力与覆盖

评估 coding agent 在活跃开源仓库中完成长周期软件工程任务的能力，包括新功能、增强和 bug 修复。v1.1 有 113 个任务、91 个仓库：Go 34、Python 34、TypeScript 35、JavaScript 5、Rust 5。任务含 `task.toml`、`instruction.md`、环境、测试/评分配置和参考 patch；参考 patch 不用于 grading，agent 应看不到它。

公开 v1.1 trials artifact 有 31,617 条 trial 记录，leaderboard artifact 有 70 个配置、28 个模型标签，并含模型、harness、reasoning effort、run、reward、token、cost、步骤、时间和错误字段。官方 `provider` 字段大量为空，Vendor 只能按模型名称族做非官方归类。

来源：<https://deepswe.datacurve.ai/artifacts/v1.1/tasks.json>、<https://deepswe.datacurve.ai/artifacts/v1.1/trials.json>、<https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json>

## 原始指标

通用 grader 将测试节点分为 `f2p` 和 `p2p`。reward=1 的条件是存在 `f2p`、所有 `f2p` 通过且没有 `p2p` 失败；缺失结果和 skipped 不算通过，重复节点采用 worst-status-wins。另有 `f2p`、`p2p`、`partial` 比例。

Leaderboard：

- `Pass@1`：计入评分的 rollout attempts 中通过的比例。
- `Pass@4`：同一任务的 4 次 rollout 中至少一次通过的任务比例。
- context-window failure 和 agent timeout 计为失败。
- provider、verifier、network error 被排除。
- cost、token、agent steps、duration 和 95% run-to-run 区间是辅助指标。

来源：<https://raw.githubusercontent.com/datacurve-ai/deep-swe/main/tasks/abs-module-cache-flags/tests/grader.py>、<https://deepswe.datacurve.ai/artifacts/v1.1/leaderboard-live.json>

## 评测条件

Leaderboard 主要使用 `mini-swe-agent + Pier + Modal`。示例任务 agent 和 verifier 均为 `no-network`，无 MCP server；每个任务有自己的 prompt、固定 base commit 和独立环境。verifier 在独立容器应用提交 patch 后执行测试。示例限制为 2 CPUs、8192 MB memory、20480 MB storage，agent timeout 10800 秒、verifier timeout 1800 秒；具体任务可能不同。leaderboard 通常 `n_runs=4`，但上下文窗口上限和截断策略未公开。

来源：<https://deepswe.datacurve.ai/run>、<https://raw.githubusercontent.com/datacurve-ai/deep-swe/main/tasks/abs-module-cache-flags/task.toml>、<https://deepswe.datacurve.ai/blog/deepswe-v1-1>

## 可比性规则与风险

1. 只比较同一 release；v1 与 v1.1 的评分、verifier 和提交条件不同，不能视为同口径。
2. 固定 harness、reasoning effort、任务集和 verifier 版本；`Best` 聚合行不能证明相同预算下的模型能力。
3. 检查 denominator 和 excluded trial，避免有效样本不对称造成误读。
4. 不把 cost、token、steps 当质量分数，也不横比不同 harness、工具集或 reasoning effort。
5. 结果受语言/仓库分布、手写 verifier 覆盖、模型访问中断、价格修正和版本漂移影响。
6. 官网“任务原创”声明与 manifest 中 `source_dataset = swe-bench-ultra` 存在未解释的 provenance 差异，需标记为未解决问题。

来源：<https://deepswe.datacurve.ai/changelog>、<https://raw.githubusercontent.com/datacurve-ai/deep-swe/main/tasks/manifest.json>、<https://deepswe.datacurve.ai/blog/deepswe-v1-1>

## Coding Plan 使用边界

可作为“长周期、多文件、受限 OSS 仓库修改”能力的外部参考；可在完全相同的 v1.1 执行条件下比较模型配置。建议证据等级：任务、字段、语言分布、指标定义、run 数和 verifier 规则为 A；维护方关于污染控制和真实世界复杂度的声明为 B+。

不得把 Pass@1/Pass@4 当作任意 Coding Plan 用户成功率，不得据此推断套餐价格、配额、SLA、延迟、并发、编辑器体验、供应商整体能力、生产安全性或长期维护性，也不得把 `mini-swe-agent` 结果当裸模型结果。

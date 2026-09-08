# Zapier AutomationBench 调研

## 0. 范围与结论摘要

- **用户指定来源**：<https://zapier.com/benchmarks>。
- **本报告的扩展一手材料**：仅使用该页面直接链接的 Zapier 官方仓库及其 raw 文件，用于补充页面没有展开的公开任务、运行器、评分和许可证信息；没有引入其他 benchmark 或第三方排行榜。仓库 README 明确把 `zapier.com/benchmarks` 作为官方榜单入口，benchmark 页面也直接提供 “View on GitHub” 链接。来源：<https://zapier.com/benchmarks>、<https://github.com/zapier/AutomationBench>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- **一句话结论**：AutomationBench 是面向多应用业务工作流的 AI agent 端到端执行评测，重点看 agent 是否把一个隔离的模拟公司环境最终改成正确状态；它不是代码生成、仓库级软件工程或 Coding Plan 综合体验 benchmark。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- **最重要的使用边界**：可把它作为“跨应用工具调用、信息查找、状态变更、流程遵循和端到端完成”的模型相对信号；不能把榜单分数直接当作 Coding Plan 用户成功率、代码能力、套餐性价比或 Vendor 综合排名。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>

## 1. 维护主体、URL 与采集时间

### 1.1 维护主体

- 公开仓库的主体是 **Zapier, Inc.**；仓库描述为 “A benchmark for evaluating AI agents on realistic business workflows”，默认分支为 `main`，页面主页字段指向 <https://zapier.com/benchmarks>。来源：<https://api.github.com/repos/zapier/AutomationBench>
- benchmark 页面标题为 **AutomationBench: AI Agent Benchmarks | Zapier**，页面的官方描述称其评估 LLM 在真实工具和业务领域上的端到端工作流执行，并采用确定性评分。来源：<https://zapier.com/benchmarks>

### 1.2 目标 URL 与实际采集

- **目标 URL**：<https://zapier.com/benchmarks>。
- **实际采集时间**：2026-09-08T06:32:56Z；这是本次 HTTP 响应头记录的 UTC 时间，报告不是历史快照，页面后续变化时应重新采集。
- **页面可见/HTML 元数据更新时间**：页面 HTML 注释写明 `Published Sep 5, 2026, 6:50 PM UTC`；HTTP 响应的 `last-modified` 为 `Sat, 05 Sep 2026 18:50:56 GMT`。来源：<https://zapier.com/benchmarks>
- **仓库采集参考点**：本次核对的默认分支当前提交为 `4a8e1061254004d9dac807054eed33fad7d1ff14`，提交时间为 2026-08-04T21:42:13Z，仓库 API 的 `updated_at` 为 2026-09-08T04:22:04Z；仓库 README 和页面榜单均显示 benchmark 版本 `1.0.6`。来源：<https://api.github.com/repos/zapier/AutomationBench/commits/main>、<https://api.github.com/repos/zapier/AutomationBench>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/pyproject.toml>、<https://zapier.com/benchmarks>
- **数据更新时间的限制**：页面给出页面发布/修改时间和版本号，但没有给出每一个模型结果的独立评测日期、运行批次 ID、完整榜单时间戳或 API 模型快照 ID。因此下文榜单数字只能理解为本次采集到的当前页面快照，不应当视为永久版本化数据。来源：<https://zapier.com/benchmarks>

### 1.3 数据获取方式

- 页面通过公开 HTTPS GET 获取，返回静态/服务端渲染 HTML；本次读取了页面正文、HTML 元数据和 HTTP `last-modified`，没有调用未公开的评分 API，也没有用第三方 benchmark 聚合页。来源：<https://zapier.com/benchmarks>
- 页面直接链接到 Zapier 官方 GitHub 仓库；仓库 raw 文件用于核对公开任务集、运行器、任务契约、成本导出和许可证。来源：<https://zapier.com/benchmarks>、<https://github.com/zapier/AutomationBench>
- 官方榜单的任务集不是公开仓库中的同一份任务：README 明确说官方 leaderboard 使用每个 domain 独立的 held-out private task set，公开仓库提供的是 public task set。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>

## 2. 评测对象、目标与覆盖

### 2.1 评测对象

- 评测对象是使用工具完成业务工作流的 AI agent / AI model 配置，而不是只输出文本的问答模型。页面概括为“每个任务启动一个小型模拟公司，给 agent 一个真实运营人员会收到的请求，然后检查它留下的世界状态”；agent 的自然语言回复本身不计分，数据状态计分。来源：<https://zapier.com/benchmarks>
- 公开 README 将目标描述为衡量 AI model 完成销售、营销、运营、支持、财务和 HR 日常业务工作流的能力；每个任务初始化 CRM、日历、收件箱等模拟业务环境，并检查最终状态。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 页面宣传语提到 benchmark 建立在 Zapier 每月 2B+ tasks、3.7M companies 的真实模式上；这说明任务设计的业务背景来源，但页面没有证明公开/私有任务是从这些真实客户任务逐条抽样，也不能把这两个数字当作 benchmark 样本数。来源：<https://zapier.com/benchmarks>

### 2.2 业务域和工具覆盖

- 页面称 AutomationBench 覆盖 47 个真实工具、六个业务函数：Sales、Marketing、Operations、Support、Finance、HR。方法说明和 README 的实现语境更具体地称为 **47 个模拟 SaaS apps/tools**，因此应理解为本地模拟应用/API，而非对 47 个真实生产账号执行操作。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 公开任务集按六个主 domain 各 100 个任务，共 600 个公开任务：Sales、Marketing、Operations、Support、Finance、HR。公开 README 还列出了每个域的覆盖主题，例如 Sales 的 CRM/lead management/cross-app workflows，Finance 的 AP/AR/expenses/reporting/bookkeeping，HR 的 recruitment/onboarding/time off/payroll。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 公开仓库另有 `simple` domain，包含 200 个基础单步和两步任务，覆盖 CRM、email、Slack、calendar、project management 等；它不纳入 benchmark score，只用于验证基础工具使用。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 页面方法区显示 `600+ Held-out evaluation tasks`、6 个业务域、47 个 simulated apps、约 500 个 API endpoints。README 同时说明公开集为 600 个任务、官方榜单用单独私有集；因此不能从“600+”反推出私有集的精确任务数。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>

## 3. 当前页面榜单快照

### 3.1 榜单字段

- 页面表头为 `Rank`、`Model`、`Score`、`Cost / task`。页面当前首屏展示前 10 名，并标注另有 85 条；本次报告只把明确可读取的前 10 条作为快照，不把未展开的 85 条补猜成完整覆盖清单。来源：<https://zapier.com/benchmarks>
- 页面顶层 `Score` 对应 benchmark 的官方 headline 指标，即严格的 `task_completed_correctly` / pass rate；成本列是每任务成本展示值，但页面没有完整公开其所有 token 计费、缓存、折扣和舍入规则。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>

### 3.2 当前前十条目

| 排名 | 页面显示的模型/配置 | Vendor（页面或配置可确认者） | Score | Cost / task |
|---:|---|---|---:|---:|
| 1 | GPT 6 Astra (Max) | OpenAI | 41.4% | $1.77 |
| 2 | GPT 6 Astra (XHigh) | OpenAI | 38.96% | $1.53 |
| 3 | GPT 6 Astra (High) | OpenAI | 37.14% | $1.45 |
| 4 | GPT 6 Astra (Medium) | OpenAI | 34.09% | $1.28 |
| 5 | Claude Fable 5.1 with Opus 5 Fallback (Max) | Anthropic；混合 fallback 配置 | 31.4% | $2.45§ |
| 6 | Gemini 3.7 Flash (High) | Google | 30.44% | $0.61* |
| 7 | GPT 6 Astra (Low) | OpenAI | 30.29% | $1.08 |
| 8 | Gemini 3.8 Flash (Medium) | Google | 29.68% | $0.55* |
| 9 | Gemini 3.8 Flash (High) | Google | 29.68% | $0.62* |
| 10 | GPT-5.6 Sol (Max) | OpenAI | 28.77% | $0.91 |

来源：<https://zapier.com/benchmarks>

- 页面脚注说明第 5 名不是单一模型：Fable 5.1 遇到 safety classifier 拒绝某一步时由 Opus 5 完成该步，再由 Fable 继续；Opus 5 处理约 40% 的任务，即 657 个任务中的 260 个。31.4% 包含 fallback 完成，但页面显示的 `$2.45` 仅为 Fable 5.1，不含 fallback tokens，真实组合成本更高。来源：<https://zapier.com/benchmarks>
- 页面脚注说明 Gemini 的排名和 Cost / task 使用标准 list pricing；页面另列出促销价：Gemini 3.7 Flash 在 2026-12-31 前为 `$0.30 / task`，Gemini 3.8 Flash 为 Medium `$0.27`、High `$0.31` / task。促销价不是页面榜单成本列。来源：<https://zapier.com/benchmarks>

### 3.3 按 domain 的当前结果

| Domain | 第一名 | Score | 第二名（不同模型） | Score |
|---|---|---:|---|---:|
| Sales | GPT 6 Astra (Max) — OpenAI | 40.2% | Gemini 3.7 Flash (High) — Google | 28.21% |
| Marketing | GPT 6 Astra (Max) — OpenAI | 50.0% | Gemini 3.8 Flash (High) — Google | 43.0% |
| Operations | GPT 6 Astra (Max) — OpenAI | 62.0% | GPT-5.6 Sol (High) — OpenAI | 53.0% |
| Support | GPT 6 Astra (XHigh) — OpenAI | 39.0% | Claude Fable 5.1 (Max) — Anthropic | 29.0% |
| Finance | GPT 6 Astra (High) — OpenAI | 43.33% | Gemini 3.7 Flash (High) — Google | 37.5% |
| HR | Gemini 3.8 Flash (Medium) — Google | 26.67% | GPT 6 Astra (Max) — OpenAI | 20.8% |

来源：<https://zapier.com/benchmarks>

- 页面特别说明：domain 分数取 standalone model 在其 best effort level 的结果，并排除 fallback completion；overall leaderboard 的第 5 名包含 Fable 5.1 + Opus 5 fallback，因此二者不能直接比较。`2nd Place model` 指另一模型的最佳结果，不是第一名模型的另一 effort level。来源：<https://zapier.com/benchmarks>

## 4. 原始指标定义与成功判定

### 4.1 官方 headline 指标：`task_completed_correctly`

- 页面明确把官方指标命名为 `task_completed_correctly`，定义为严格 pass/fail：所有 scored assertions 都必须通过才算通过；官方榜单分数基于 held-out private evaluation set，页面称 run-to-run variance 通常在 1% 以内。来源：<https://zapier.com/benchmarks>
- README 的实现定义是：每个任务的 `task_completed_correctly` 为 0 或 1，只有每一个 assertion 都通过时才为 1；官方 AutomationBench pass rate 是纳入评分任务上该值的平均值，`simple` domain 排除。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 页面示例展示正向和负向断言：既要更新正确记录、给正确团队发正确内容，也要确认错误团队没有收到通知；负向断言用于防止“给所有人发邮件”这类投机行为。来源：<https://zapier.com/benchmarks>
- 因此该指标不是“回复是否说得像完成了”，也不是单条工具调用成功率，而是最终模拟业务世界是否满足全部预先定义的断言。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/runner.py>

### 4.2 诊断指标：`partial_credit`

- `partial_credit` 是通过断言数占全部断言数的比例，范围为 0.0–1.0；它可作为调试、训练信号或 RL dense reward，但不是 headline leaderboard score。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 页面示例中 6 个断言通过 5 个时，`partial_credit = 0.83`，但严格 headline metric 仍然失败；这说明“多数步骤正确”不会被官方 pass rate 视为成功。来源：<https://zapier.com/benchmarks>

### 4.3 确定性 grader

- 页面声明评分检查最终 environment state 与 fixed success criteria，使用 deterministic assertions，不使用 LLM-as-judge。来源：<https://zapier.com/benchmarks>
- 官方 runner 的任务契约包括 prompt、initial state、assertions 和允许的 Zapier tools，并为一次 rollout 计算 task contract SHA-256；这有助于固定一次评测实际收到的任务表面，但不代表私有榜单任务本身公开。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/task_contract.py>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/runner.py>

## 5. Harness、任务集、提示词、工具、上下文与重复次数

### 5.1 官方榜单与公开 harness 的关系

- 官方 leaderboard：页面明确说 leaderboard scores run in **API mode**；模拟 app 后端使用 Pydantic models 作为 source of truth，模拟真实 API 的 schemas、pagination、required fields 和 4xx error cases，但状态保存在本地，所以 runs 可复现。每个任务最多 50 steps，页面称通常很少达到上限。来源：<https://zapier.com/benchmarks>
- 公开可运行 harness：Zapier 官方仓库的 `auto-bench` runner 默认 `toolset=api`，默认 `--max-steps=50`、`--max-concurrent=100`、`--num-examples=-1`；runner 使用 `verifiers` 的 `StatefulToolEnv`，从 task dataset 初始化 world state，并在任务级过滤工具。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/scripts/eval.py>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/runner.py>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/pyproject.toml>
- 公开仓库提供的 harness、公开任务和官方私有榜单不是同一数据集；README 明确警告本地公开集分数与官方 leaderboard 不会 1:1 一致，只应期待方向性一致。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>

### 5.2 任务集与上下文

- 每个任务包含：trigger data / 初始触发消息、pre-populated initial state、domain-specific tools、基于 assertions 的 final-state evaluation。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 页面方法说明称每个任务会创建一个 fresh simulated business，可能包含 CRM records、inbox threads、spreadsheets、support cases 等，并给所有模型相同初始世界；陷阱包括过期行、近重复名称和藏在 inbox 中的政策。来源：<https://zapier.com/benchmarks>
- 任务启动方式是一条 trigger message；agent 独立工作，没有 clarifying questions 或 human in the loop，需要自行搜索和读取环境中的信息。来源：<https://zapier.com/benchmarks>
- 公开任务代码通常把 prompt 表示为 `system` + `user` 消息。系统提示要求执行 workflow、不要提问、使用约 50 个 tool-using turns，并对已处理/跳过项目的总结行为作约束；用户消息给出业务请求和若干上下文线索。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/domains/sales/tasks.py>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/domains/operations/tasks.py>
- 示例公开任务 `sales.multi_hop_lookup` 要求在 Salesforce、Google Sheets、Gmail 等应用间查找并更新数据、按政策路由通知、换算金额并检查支持升级；其 `initial_state` 直接包含模拟 Gmail、表格和 CRM 数据，说明任务上下文是结构化状态和消息内容的组合，而非单一纯文本题目。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/domains/sales/tasks.py>

### 5.3 工具与工具表面

- 页面说明 API mode 使用两个工具：`search` 在 API schemas 上做 BM25 keyword search 并返回 top 5 candidate，`execute` 以 method、URL、body 模拟 curl/fetch；发现正确 endpoint 本身就是任务挑战。来源：<https://zapier.com/benchmarks>
- 页面说明 benchmark 也支持 Zapier-tool mode 和 Limited Zapier toolset，用来实验工具表面形状对性能的影响；官方 leaderboard 页面明确称其分数运行在 API mode，因此不能把 Zapier-tool mode 的本地结果直接当作官方榜单结果。来源：<https://zapier.com/benchmarks>
- 公开 runner 的 `toolset` 选项为 `api`、`zapier`、`limited_zapier`；`api` 模式使用全部 API tools，`limited_zapier` 按任务的 `zapier_tools` 列表过滤，`zapier` 模式注册搜索与执行的 meta-tools。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/runner.py>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/scripts/eval.py>
- 任务 contract 将 `zapier_tools`、`initial_state`、`assertions` 和 prompt 固定到同一份 rollout 输入中；这支持复现实验的输入审计，但私有榜单工具清单没有公开。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/task_contract.py>

### 5.4 模型调用、effort 和重复次数

- 当前页面模型名称带有 `Low`、`Medium`、`High`、`XHigh`、`Max` 等 effort 标签；同一模型不同 effort 被作为不同榜单配置展示。页面没有公布每个条目的底层 API model ID、日期版 snapshot、system prompt 完整文本、temperature/top-p、最大 token、网络重试轨迹或每项配置的独立运行日期。来源：<https://zapier.com/benchmarks>
- 公开 runner 的 `--reasoning-effort` 可取 `none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`；对 Anthropic 新模型可能使用 adaptive thinking 和 `output_config.effort`，其他路径传递 provider 相关 reasoning effort。该代码描述公开 runner 的可配置方式，不足以证明官方榜单每个模型内部参数完全相同。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/scripts/eval.py>
- **官方重复次数：未披露。** 页面只说 run-to-run variance 通常在 1% 以内，没有给出每模型运行次数、每任务重复次数、随机种子或如何聚合重复运行。来源：<https://zapier.com/benchmarks>
- **公开 runner 默认重复次数：每个 example 一次 rollout。** `env.evaluate(...)` 调用中明确使用 `rollouts_per_example=1`；仓库另有针对中断/abort 的补跑机制，但那是故障恢复，不应理解为对同一任务的统计重复采样。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/scripts/eval.py>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/export.py>
- 因此不能用公开 runner 的一次 rollout 默认值推断官方私有榜单重复次数，也不能据“通常在 1% 以内”自行构造置信区间。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/scripts/eval.py>

## 6. 模型与 Vendor 覆盖、版本记录

### 6.1 页面直接可确认的覆盖

- 当前可见榜单前十覆盖 OpenAI、Google、Anthropic 三个 Vendor；其中 Anthropic 第 5 名是 Fable 5.1 + Opus 5 fallback 的混合配置。来源：<https://zapier.com/benchmarks>
- 当前页面按 domain 显示的第一/第二名也只明确出现 OpenAI、Google、Anthropic。页面标注另有 85 条榜单记录，但未在本次读取中展开完整列表，因此不能声称当前官方榜单只覆盖这三家。来源：<https://zapier.com/benchmarks>
- 公开 README 的公开基线表另外出现 Claude Opus 5、Kimi K3、Claude Fable 5、GPT-5.6 Sol、Gemini 3.6 Flash、Claude Opus 4.8、Gemini 3.5 Flash、GPT-5.6 Terra、Claude Sonnet 5、GLM 5.2；这是公开集基线，不是当前私有 leaderboard 的完整模型覆盖。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>

### 6.2 页面/仓库给出的模型版本信息

- 当前页面明确可读的模型/版本标签包括：GPT 6 Astra、GPT-5.6 Sol、Claude Fable 5.1、Opus 5、Gemini 3.7 Flash、Gemini 3.8 Flash，以及对应 reasoning effort。来源：<https://zapier.com/benchmarks>
- 公开 README 的模型标签包括 Claude Opus 5、Kimi K3、Claude Fable 5、GPT-5.6 Sol、Gemini 3.6 Flash、Claude Opus 4.8、Gemini 3.5 Flash、GPT-5.6 Terra、Claude Sonnet 5、GLM 5.2。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- **版本粒度不足**：这些是展示名称，不是完整 provider model ID 或带日期的 immutable snapshot。页面没有提供官方榜单每个模型对应的底层版本字符串、API provider、system/developer prompt 版本和评测运行日期；因此只能记录页面展示名，不能把展示名规范化成另一个 API ID。来源：<https://zapier.com/benchmarks>
- benchmark/harness 版本可确认是 `1.0.6`。CHANGELOG 称 1.0.6 修复了任务可发现性与公平性问题、增加 Google Sheets 任务的 Drive access、更新 Verifiers 到 0.2.0、改进 prompt caching/refusal tracking，并刷新官方 runs；同时私有任务为补偿修复而变得更难。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/CHANGELOG.md>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/pyproject.toml>

## 7. 可比性规则

### 7.1 官方明确规则

- **同一评分口径内比较**：overall leaderboard 的严格分数与 domain 表的 standalone best-effort 分数不能混为同一口径；特别是 Fable 5.1 + Opus 5 fallback 组合不能和 standalone domain 结果直接比较。来源：<https://zapier.com/benchmarks>
- **同一任务集边界内比较**：官方私有 held-out set 与公开仓库 600-task set 不是同一任务集；公开本地结果与官方榜单不保证 1:1，只能期待方向性一致。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- **同一 benchmark 版本内比较**：CHANGELOG 说明任务、公平性、verifier 和私有任务难度会随版本变化；应至少固定 benchmark version、任务集、grader/verifier 和工具模式。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/CHANGELOG.md>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/pyproject.toml>
- **同一 effort/config 内比较**：页面把同模型不同 reasoning effort 分成不同条目，因此不能把 `Max`、`High`、`Medium` 视为同一模型的单一能力分数。来源：<https://zapier.com/benchmarks>
- **不要把组合配置当单模型**：Fable 5.1 + Opus 5 fallback 的分数包含两个模型的完成，且成本列排除了 fallback tokens。来源：<https://zapier.com/benchmarks>

### 7.2 适用于分析的保守规则

- 比较两个模型时，应同时固定：私有/公开 task set、benchmark version、domain 范围、API/toolset mode、最大 steps、reasoning effort、模型展示版本及其实际 API snapshot；任一项未知时，应降级为方向性参考而非严格排名。上述固定项中，官方页面/仓库只完整公开了部分项，后半句是数据使用的分析规则。来源依据：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/scripts/eval.py>
- 不要横向比较 `Score` 与 `partial_credit`，也不要把 `Cost / task` 当质量指标；官方只把 `task_completed_correctly` 的平均作为 pass rate，`partial_credit` 是诊断信号。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 不要把 domain 分数平均成新的总分，除非任务数量、私有集构成、过滤规则和聚合方法都已确认；页面只发布各 domain 结果，没有给出可供外部重算完整官方总分的私有数据。来源：<https://zapier.com/benchmarks>

## 8. 许可、访问限制和复现条件

- benchmark 页面本身公开可访问；页面没有在 benchmark 正文中给出一份单独的 leaderboard 数据许可证、完整数据下载接口或私有任务授权条款。来源：<https://zapier.com/benchmarks>
- 官方 GitHub 仓库的 LICENSE 是 MIT。其范围说明：Zapier 原创的 benchmark code、test frameworks、simulation logic、mock data generators、configuration files、documentation 等属于原创作品并适用 MIT；仓库内由公开第三方 API 文档独立推导的 API schema representations 不被 Zapier 声称为原创，也不应把 MIT 解释为授予第三方知识产权。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/LICENSE>
- 公开仓库任务和代码可按仓库许可证获取并本地运行，但运行公开任务需要相应模型 API key；README 给出了 OpenAI、Anthropic 等环境变量和 `uv run auto-bench` 命令。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 官方 leaderboard 的 held-out private task set 不发布，因此外部无法仅凭公开仓库完整复现官方榜单数字；公开集本地结果不能作为私有集结果的替代。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 本报告没有把页面 README 中指向的其他平台、论文或第三方价格站作为事实来源；特别是没有引入其他 benchmark 的分数或排名。

## 9. 时效性、偏差与质量风险

### 9.1 时效性风险

- 页面是动态榜单，模型、effort、价格、排名和 domain 结果会变化；本报告只对应 2026-09-08T06:32:56Z 采集到的页面快照。页面本身的发布时间是 2026-09-05，仓库也可能晚于页面更新。来源：<https://zapier.com/benchmarks>、<https://api.github.com/repos/zapier/AutomationBench>
- CHANGELOG 明确说修复 bug 后可能把 private tasks 调得更难，以维持 benchmark 的挑战性；因此跨版本分数不能当作严格时间序列。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/CHANGELOG.md>
- 页面未提供每个模型结果的独立 run date、底层 model snapshot、随机种子和重复次数，无法完全判断同一页面内不同条目的时间同质性。来源：<https://zapier.com/benchmarks>

### 9.2 任务与生态偏差

- 任务来自 Zapier 业务自动化语境，覆盖 CRM、邮箱、表格、工单、广告、HR 等跨应用工作；这会偏向信息检索、流程遵循和状态更新，而不能代表所有 agent、代码库或终端任务。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 使用模拟 API 和本地状态有利于可重复和确定性 grading，但不能覆盖真实 SaaS 的网络故障、权限治理、限流、数据新鲜度、真实账号配置、隐私合规和生产副作用。页面只声明模拟 schemas/pagination/required fields/4xx 行为接近真实 API，并未声明完整生产等价。来源：<https://zapier.com/benchmarks>
- 严格 all-assertions pass 会放大任一关键步骤失败，适合衡量端到端可靠完成，但可能低估“部分完成且人工可接手”的业务价值；`partial_credit` 虽能诊断这一点，却不是 headline score。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 公开集与私有集都由维护方设计和维护，私有任务还可能因修复而变难；这带来任务选择、断言设计、工具接口设计、模型/供应商接入和成本计算的维护方偏差。来源：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/CHANGELOG.md>
- 页面中的 `2B+ monthly tasks` 和 `3.7M companies` 是背景定位数据，不是已公开的 benchmark 采样框或独立代表性证明；不能据此推断任务对所有企业、地区或行业具有统计代表性。来源：<https://zapier.com/benchmarks>
- Fallback 组合会改变有效模型配置；第 5 名成本列还排除了 fallback tokens，因此同时比较其分数和成本会产生不对称。来源：<https://zapier.com/benchmarks>

## 10. 证据等级

本报告采用以下等级：

- **A：页面/官方仓库直接披露或可由官方代码直接核验。** 包括榜单字段和当前可见数值、六个 domain、47 simulated apps、官方指标名和定义、API mode、50-step 上限、公开任务数量、公开 runner 默认参数、许可证文字和 Fallback 脚注。来源主要为 <https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/LICENSE>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/scripts/eval.py>。
- **B：基于 A 级材料的保守分析规则或局限判断。** 例如建议只在同版本/同 task set/同 toolset/同 effort 下比较，以及将 benchmark 视为跨应用工作流信号而非代码能力。它们不是 Zapier 另外发布的官方承诺，而是为 Coding Plan 分析设定的使用边界。来源依据：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>。
- **未证实：官方没有披露或当前材料不足。** 包括官方重复次数、完整榜单 85 条记录的逐条覆盖、每个模型的底层 API snapshot、temperature/top-p、完整 prompt 版本、private task 数量、成本公式、逐模型评测日期和外部统计代表性。不得用代码默认值或常识补齐这些字段。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>。

## 11. 对 Coding Plan 的可用范围

### 11.1 可以使用的范围

- 可将 AutomationBench 作为**模型级、配置级的跨应用 agent 执行信号**：它能帮助观察模型是否会查找分散信息、遵循业务政策、跨多个模拟应用写入状态、处理近重复/过期数据，并在严格正负断言下完成任务。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/domains/sales/tasks.py>
- 如果某个 Coding Plan 明确提供与榜单相同的模型版本、相近 reasoning effort 和可执行工具环境，可以把相同模型的 AutomationBench 结果作为外部背景信号；该信号应标成“业务自动化 agent 能力”，而不是该套餐的直接得分。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 可用于提醒推荐系统：工具调用能力、工作流状态一致性和代码仓库编辑能力是不同维度，不能因为某模型在 AutomationBench 高分就跳过 Coding Plan 的代码编辑、测试、调试和仓库任务证据。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>

### 11.2 不可直接使用的范围

- 不能用于直接排名 Coding Plan 的价格、订阅额度、token/消息配额、并发、SLA、地区可用性、编辑器体验、CLI 体验、上下文窗口、缓存策略或套餐性价比；AutomationBench 页面没有这些套餐事实。来源：<https://zapier.com/benchmarks>
- 不能把 benchmark pass rate 映射为 Coding Plan 用户成功率。官方任务是隔离模拟环境、固定断言、无人工澄清的 agent workflow，和用户的真实代码库、依赖、权限、网络、测试命令不是同一条件。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 不能据此推断代码生成质量、编译/测试通过率、SWE issue 修复、代码审查、重构、安全性、可维护性、Git 操作、终端操作、部署或生产可靠性。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
- 不能把 `Cost / task` 当作 Coding Plan 用户实际支付成本；它受模型 token 计费、上下文、fallback、缓存和页面未公开的官方成本实现影响，而且第 5 名明确排除了 fallback tokens。来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/pricing.py>
- 不能把模型榜单直接转成 Vendor 榜单或 Plan 榜单：effort、fallback、模型版本和 domain 差异均可能改变结果，且页面只展示部分榜单记录。来源：<https://zapier.com/benchmarks>

## 12. 禁止推断

以下结论不能由本来源推出：

1. AutomationBench 排名高的模型一定更适合写代码、修 bug、重构大型仓库或通过单元测试。
2. 榜单分数等于任何 Coding Plan 用户的任务完成概率、月度成功率或生产自动化成功率。
3. 页面中的 `2B+ monthly tasks`、`3.7M companies` 等背景数等于 benchmark 样本量、代表性样本或客户授权的数据集规模。
4. 页面模型展示名可以无损映射到某个未公开的 provider API model ID、日期 snapshot、系统提示词或采样参数。
5. 公开 600-task set 的本地结果等于官方私有 held-out leaderboard 结果；README 明确否定 1:1 等价。
6. `partial_credit` 是官方排行榜分数，或可以用它替代 `task_completed_correctly` 做套餐评分。
7. `Cost / task` 是真实用户在某个 Coding Plan 中的价格、token 消耗或总拥有成本。
8. Fable 5.1 + Opus 5 fallback 是单一模型能力结果，或其标注成本已包含所有 fallback token。
9. 某一 domain 的第一名一定是整体最优模型，或六个 domain 可以在未知任务数/未知聚合规则下自行平均成官方总分。
10. 官方榜单已经披露了可复现所需的完整任务、prompt、工具、模型 snapshot、随机种子、重复次数和 cost formula。

来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/CHANGELOG.md>

## 13. 未解决问题

1. 官方 leaderboard 的 private held-out task set 精确有多少任务？页面只写 `600+`，README 只说明它与公开 600-task set 分离且不发布。
2. 官方榜单每个模型/effort 运行多少次、每任务是否重复、是否使用固定 seed、如何计算页面所称通常 1% 的 run-to-run variance？
3. 当前前十及另 85 条记录各自对应的底层 provider model ID、日期 snapshot、API endpoint、system/developer prompt 和采集/运行日期是什么？
4. `Cost / task` 的完整计算式是什么？是否包括 reasoning tokens、cached input、tool-call token、重试、fallback、批处理折扣和失败任务？第 5 名的脚注只明确了 fallback token 被排除，不能据此补全其他条目公式。
5. 私有任务与公开任务的准确 domain 分布、任务难度、断言数量和版本差异是否完全一致？README 只说“similar task distribution and assertion framework”并且 private set purposely harder。
6. 官方榜单是否使用公开仓库同一版本的 verifier、同一份 system prompt、同一 max-step 逻辑和同一错误重试/abort 修复流程？页面确认 API mode，但没有完整发布榜单运行配置。
7. “2B+ monthly tasks across 3.7M companies”与 benchmark 任务设计之间的抽样、脱敏、授权和代表性关系是什么？页面没有给出数据卡或采样说明。
8. 页面“47 real tools”和方法区“47 simulated apps”之间的产品措辞如何严格对应？当前证据支持评测执行的是本地模拟 apps/API，不支持把它理解为真实 SaaS 账号上的生产操作。
9. 完整榜单 85 条未展开条目的 Vendor、模型版本、effort、分数、成本和更新时间是什么？当前页面正文只直接提供了前十和 domain 摘要。

来源：<https://zapier.com/benchmarks>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/scripts/eval.py>、<https://raw.githubusercontent.com/zapier/AutomationBench/main/CHANGELOG.md>

## 14. 来源清单

1. Zapier AutomationBench benchmark 页面：<https://zapier.com/benchmarks>
2. Zapier 官方 AutomationBench 仓库：<https://github.com/zapier/AutomationBench>
3. 官方 README：<https://raw.githubusercontent.com/zapier/AutomationBench/main/README.md>
4. 官方许可证：<https://raw.githubusercontent.com/zapier/AutomationBench/main/LICENSE>
5. 官方 CHANGELOG：<https://raw.githubusercontent.com/zapier/AutomationBench/main/CHANGELOG.md>
6. 官方公开 runner：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/scripts/eval.py>
7. 官方环境 runner：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/runner.py>
8. 官方任务契约：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/task_contract.py>
9. 官方公开 Sales 任务示例：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/domains/sales/tasks.py>
10. 官方公开 Operations 任务示例：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/domains/operations/tasks.py>
11. 官方结果导出：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/export.py>
12. 官方成本实现：<https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/pricing.py>
13. 官方仓库 API 元数据：<https://api.github.com/repos/zapier/AutomationBench>、<https://api.github.com/repos/zapier/AutomationBench/commits/main>

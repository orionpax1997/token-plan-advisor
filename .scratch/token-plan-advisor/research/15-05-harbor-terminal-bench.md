# Harbor Hub Terminal-Bench 4.0 调研

## 结论摘要

本次调研严格限定在用户指定的 Harbor Hub 页面，以及该页面直接关联的 Harbor/Terminal-Bench 官方文档、官方 GitHub 仓库和 README：

- 指定页面对应 `terminal-bench/terminal-bench` 的数据集版本 `4`，官方排行榜选择为 `4-0-0`，标题为 **Terminal-Bench 4.0**。页面给出的描述是：Terminal-Bench 用来衡量 Agent 使用终端完成任务的能力。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 本次实际浏览器渲染采集到该版本的 **66 个任务**和排行榜的 **18 条可见提交记录**。排行榜按 `accuracy` 降序排列，展示 Agent、Model、Effort、Accuracy、Release Date、Agent Org、Model Org、Tokens、Cost。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 当前可见记录的 `accuracy` 范围为 **11.2% 至 58.2%**；页面同时显示一个 `±` 误差值，排行榜元数据把该字段命名为 `accuracy_ci95_half_width`。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- Harbor 官方 README 将 Terminal-Bench 定义为持续演进的 benchmark，任务集会随时间更新；因此该页面是一个带版本的时间快照，不应与其他版本或未来的 `latest` 结果直接拼接。[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)
- 页面没有公开统一的完整提示词、上下文窗口、每条提交的 `n_trials`、具体 CI 计算公式或所有 Agent 的工具协议。以下报告对这些项目明确标记为未解决，不以常识补全。

## 维护主体与来源范围

### 维护主体

- 直接维护项目是 GitHub 上的 `harbor-framework/terminal-bench` 官方仓库；其 README 说明 Terminal-Bench 用于衡量 Agent 在多样、困难任务上的工作能力，并且是持续 benchmark。[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)
- 官方 README 的 Contributors 区域列出项目领导人为 Ryan Marten、Alex Shaw、Andy Konwinski、Ludwig Schmidt，并说明 Terminal-Bench hosted by Harbor 和 Laude Institute。这里记录的是项目页面公开的维护/托管信息，不据此推断法律主体或商业归属。[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)
- Harbor 官方教程称 Harbor 是运行 Terminal-Bench 2.0 的官方 harness；当前 Terminal-Bench 仓库 README 也要求安装 Harbor 来运行最新数据集。[来源：Harbor 官方运行 Terminal-Bench 教程](https://www.harborframework.com/docs/tutorials/running-terminal-bench)、[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)

### 目标 URL与采集时间

- 用户指定目标 URL：<https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0>
- 实际采集时间：**2026-09-08 06:40:15 UTC**。
- 采集方式是访问公开 Harbor Hub 页面并等待客户端渲染排行榜；静态 HTML 初始内容只显示 `Loading leaderboard`，随后浏览器渲染出排行榜行。页面、任务列表、排行榜行和排行榜元数据均来自上述目标页面。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

### 页面/数据更新时间

- Harbor Hub 页面内的排行榜元数据显示：`created_at = 2026-08-27T18:30:27.559933+00:00`，`updated_at = 2026-09-03T21:34:07.080891+00:00`。这里的 `updated_at` 是该排行榜定义/数据展示对象的更新时间，不能解释为每一条模型调用发生的时间。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 每条排行榜记录另有页面显示的 `Release Date`，本次可见记录的日期从 2026-05-28 到 2026-09-03 不等。该字段是提交记录的发布日期，不是本次采集时间。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- Terminal-Bench 官方 README 明确称 benchmark 是 continuous benchmark，并且有 tagged releases；因此页面更新时间和任务版本是解释分数时必须保留的时间条件。[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)

## 许可与访问限制

- `harbor-framework/terminal-bench` 仓库的 LICENSE 是 **Apache License 2.0**，允许在满足许可证条件的情况下复制、修改和分发仓库 Work。[来源：Terminal-Bench 官方 LICENSE](https://github.com/harbor-framework/terminal-bench/blob/main/LICENSE)
- Apache 2.0 的许可事实适用于该官方仓库中受该许可证覆盖的代码、文档或任务文件；Harbor Hub 页面本身没有在本次可见页面内容中给出一个单独的“数据集整体许可证”声明。因此不能把仓库许可证自动扩展成所有任务输入、第三方依赖、模型输出或外部数据的许可证。[来源：Terminal-Bench 官方 LICENSE](https://github.com/harbor-framework/terminal-bench/blob/main/LICENSE)、[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 目标页面及其排行榜是公开可访问的；页面提供新建 Job 的入口，README 也提供公开数据集/排行榜链接。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)、[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)
- 复现实验需要 Harbor 运行环境。官方教程要求先安装 Harbor，并指出运行需要 Docker；官方 README 的推荐命令使用 Modal，页面 README 还说明 Terminal-Bench 包含 GPU 和多容器任务，推荐 Modal 或 Daytona。[来源：Harbor 官方运行 Terminal-Bench 教程](https://www.harborframework.com/docs/tutorials/running-terminal-bench)、[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 使用外部模型或云环境还需要相应的模型 API key、云环境凭据或服务权限；官方教程示例显式设置 `DAYTONA_API_KEY` 和 `ANTHROPIC_API_KEY`。[来源：Harbor 官方运行 Terminal-Bench 教程](https://www.harborframework.com/docs/tutorials/running-terminal-bench)
- Harbor Hub CLI 的管理命令要求先登录 Harbor 或使用 API key；这是 Hub 管理/上传接口的访问限制，不代表公开排行榜页面需要登录。[来源：Harbor 官方 Hub 文档](https://www.harborframework.com/docs/hub)

## 数据获取方式

1. 打开用户指定的固定数据集版本 URL，而不是使用不固定的 `latest`。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
2. 读取页面内嵌的版本、任务列表和排行榜定义元数据。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
3. 等待 Harbor Hub 客户端加载公开排行榜表格，再记录当前可见行。页面的排行榜行不是静态正文直接提供的，而是页面渲染后显示的结果；因此本报告把采集时间和当前快照写入文件。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
4. 交叉核对运行和任务判定机制时，只使用 Harbor 官方教程、官方任务结构文档、官方指标文档及 Terminal-Bench 官方 README。[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)、[来源：Harbor 官方指标文档](https://www.harborframework.com/docs/datasets/metrics)、[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)

本次没有抓取或引用其他 benchmark、第三方排行榜、二手文章或非官方比较文章。

## 评测对象与能力指标

### 评测对象

- 评测对象是“Agent + Model + reasoning effort”组合，而不是脱离 Agent harness 的裸模型分数。排行榜列有 Agent、Model 和 Effort 三列；同一个模型在不同 effort 下可出现不同记录。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- Terminal-Bench 的总体目标是评估 Agent 在终端环境中完成任务的能力；官方 Hub 对该数据集的简述是“measuring agents' abilities to complete tasks using a terminal”。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 官方 README 进一步把任务描述为多样、困难、面向有价值工作的任务，并说明任务会持续演进。[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)

### 原始指标定义

目标页面公开的排行榜 schema 包含以下字段：

| 字段 | 页面公开含义/形态 | 本报告的解释边界 |
|---|---|---|
| `accuracy` | 数值，范围 0 到 100；表格按此字段降序排名 | 页面没有在可见说明中给出更细的分子、分母或聚合公式 |
| `accuracy_ci95_half_width` | 数值，范围 0 到 100；表格以 `Accuracy` 后的 `±` 形式显示 | 字段名表明是 95% CI 半宽，但页面没有公开计算公式、独立性假设或单位换算细节 |
| `display_accuracy` | 用于表格展示的字符串 | 当前页面以百分比字符串显示，例如 `58.2% ± 2.8%` |
| `n_trials` | 非负数 | schema 要求该字段，但当前排行榜表格没有把它配置为显示列，不能仅凭表格读出每条提交的重复次数 |
| `successes` | 非负数 | schema 允许该字段；当前表格未显示 |
| `pass_at_2`、`pass_at_3`、`pass_at_4`、`pass_at_5` | 0 到 1 的数值 | schema 允许这些字段；当前官方表格未显示，且页面未给出其计算定义，不能自行按常见 pass@k 公式重算 |
| `total_tokens` | 非负数 | 当前表格以 Tokens 列显示，并使用页面格式化值 |
| `total_cost_usd` | 非负数 | 当前表格以 Cost 列显示；成本口径、定价快照和是否包含环境成本未在页面说明 |
| `output_tokens`、`cached_input_tokens`、`uncached_input_tokens` | 非负数 | schema 允许，但当前表格未显示 |
| `avg_trial_duration_sec` | 非负数 | schema 允许，但当前表格未显示 |

以上 schema、列配置和排名规则均直接取自用户指定页面。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

Harbor 通用指标文档说明：默认情况下 Harbor 会跨任务平均 rewards，并把缺失 reward 当作 0；自定义 `metric.py` 可以输出多个指标。这个通用规则可以解释 Harbor 的默认聚合背景，但官方没有在本次页面中明确声明 Terminal-Bench 4.0 的 `accuracy` 一定完全等同于该默认实现。因此本报告把“accuracy 是页面排名字段”和“accuracy 的具体分母/CI 算法”分开记录。[来源：Harbor 官方指标文档](https://www.harborframework.com/docs/datasets/metrics)

### 当前排行榜可见记录

下表是本次采集时页面直接显示的全部 18 条可见记录。每行的来源均为用户指定的 Harbor Hub 页面；`±` 是页面显示值，不是本报告重算的置信区间。

| Rank | Agent | Model | Effort | Accuracy | Release Date | Agent Org | Model Org | Tokens | Cost |
|---:|---|---|---|---:|---|---|---|---:|---:|
| 1 | Codex | GPT-6 Astra | max | 58.2% ± 2.8% | Sep 3, 2026 | OpenAI | OpenAI | 1.5B | $3.3k |
| 2 | Claude Code | Fable 5.1 | max | 57.9% ± 3.8% | Sep 1, 2026 | Anthropic | Anthropic | 2.7B | $6.2k |
| 2 | Codex | GPT-6 Astra | xhigh | 57.9% ± 2.7% | Sep 3, 2026 | OpenAI | OpenAI | 1.2B | $2.4k |
| 2 | Codex | GPT-6 Astra | high | 57.9% ± 3.0% | Sep 3, 2026 | OpenAI | OpenAI | 1.2B | $2.3k |
| 5 | Codex | GPT-6 Astra | medium | 54.2% ± 2.7% | Sep 3, 2026 | OpenAI | OpenAI | 1.1B | $1.9k |
| 6 | Claude Code | Opus 5 | max | 51.8% ± 3.4% | Jul 24, 2026 | Anthropic | Anthropic | 6.5B | $6.0k |
| 7 | Codex | GPT-6 Astra | low | 50.6% ± 2.8% | Sep 3, 2026 | OpenAI | OpenAI | 889.8M | $1.6k |
| 8 | Claude Code | Fable 5 | max | 44.5% ± 3.8% | Jun 9, 2026 | Anthropic | Anthropic | 3.8B | $7.3k |
| 9 | Claude Code | GLM-5.3 | max | 41.8% ± 3.2% | Aug 14, 2026 | Anthropic | Z.ai | 8.7B | $2.7k |
| 10 | Codex | GPT-5.6 Sol | max | 37.3% ± 3.8% | Jun 26, 2026 | OpenAI | OpenAI | 4.4B | $2.5k |
| 11 | Claude Code | Opus 4.8 | max | 23.6% ± 3.6% | May 28, 2026 | Anthropic | Anthropic | 6.4B | $6.5k |
| 12 | Codex | GPT-5.6 Terra | max | 21.5% ± 3.3% | Jun 26, 2026 | OpenAI | OpenAI | 5.7B | $1.7k |
| 13 | Grok Build | Grok 4.6 | high | 20.3% ± 3.1% | Aug 12, 2026 | xAI | xAI | 4.0B | $3.6k |
| 14 | mini-SWE-agent | Gemini 3.8 Flash | high | 19.1% ± 3.4% | Sep 2, 2026 | SWE-agent | Google | 17.2B | $1.8k |
| 15 | Codex | GPT-5.6 Luna | max | 17.3% ± 2.8% | Jun 26, 2026 | OpenAI | OpenAI | 11.6B | $346.67 |
| 16 | Grok Build | Grok 4.5 | high | 12.4% ± 2.6% | Jul 16, 2026 | xAI | xAI | 3.4B | $2.1k |
| 16 | Claude Code | Sonnet 5 | max | 12.4% ± 3.1% | Jun 30, 2026 | Anthropic | Anthropic | 21.6B | $9.6k |
| 18 | mini-SWE-agent | Gemini 3.7 Flash | high | 11.2% ± 2.4% | Aug 13, 2026 | SWE-agent | Google | 11.1B | $1.3k |

来源：上述全部记录均来自 [Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)。页面存在并列排名，不能把 Rank 当作唯一序号。

### Model/Vendor 覆盖

- 可见排行榜包含 18 条记录、14 个不同的 Model 展示名、5 个不同的 Model Org：OpenAI、Anthropic、Z.ai、xAI、Google。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 可见的 Agent Org 有 4 个：OpenAI、Anthropic、xAI、SWE-agent；可见 Agent 展示名有 Codex、Claude Code、Grok Build、mini-SWE-agent。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 这些是该页面当前公开记录的覆盖范围，不是 Terminal-Bench 支持的全部 Vendor、全部模型或全部 Agent 的清单。页面没有给出“未提交者”或完整候选池。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

### 模型版本

- 页面以 `Model` 和 `Release Date` 展示提交使用的模型标签，例如 `GPT-6 Astra`、`Fable 5.1`、`Opus 5`、`GLM-5.3`、`Gemini 3.8 Flash` 等；本报告原样记录这些公开展示名。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 页面没有统一的底层 API model ID、模型权重/快照 hash、系统提示词版本或推理服务部署版本字段。因此展示名不能被扩展解释为可复现的精确模型构建版本。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

## 评测 harness、任务集与实验条件

### Harness

- 官方运行路径是 Harbor。Terminal-Bench 官方 README 给出 `harbor run -d terminal-bench/terminal-bench@latest`，并用 `--agent` 与 `--model` 指定评测组合。[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)
- 官方教程明确称 Harbor 是运行 Terminal-Bench 的官方 harness，并给出 `harbor run -d terminal-bench/terminal-bench-2 -a oracle` 的示例。[来源：Harbor 官方运行 Terminal-Bench 教程](https://www.harborframework.com/docs/tutorials/running-terminal-bench)
- 目标版本页面的 README 示例使用 `harbor run -d terminal-bench/terminal-bench`，并示例 `--agent claude-code`、`--model anthropic/claude-fable-5`、`--n-concurrent 100`、`--env modal`；这是页面提供的运行示例，不足以证明排行榜每条记录都使用完全相同的命令。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 官方 README 建议运行 Oracle solutions 5 次以确认任务在沙箱环境中正常工作，示例参数为 `-k 5`；这是 Oracle/环境健全性检查建议，不能当作所有排行榜提交的重复次数。[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)

### 任务集

该固定版本页面显示 66 个任务，任务名如下；任务集合本身是 Terminal-Bench 4.0 页面的一部分。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

`atrx-vep-crispr`、`batched-eval-parity`、`biped-contact-dynamics`、`bun-sourcemap-leak`、`cad-model`、`cargo-flight-dispatch`、`coq-block-bound`、`ctr-optimization`、`cumulative-layout-shift`、`data-anonymization`、`distributed-dedup`、`embedding-drift-monitor`、`fin-saccr-rwa`、`foodstuff-beta-activity`、`formal-crypto`、`fp8-rmsnorm-gemm`、`freecad-impeller`、`freecad-platform-drawing`、`freecad-spring-clip`、`freight-dispatch-shift`、`glycan-ms2-elucidation`、`gsea-proteomics`、`heat-pump-warranty`、`hof-topology-interpenetration`、`html-js-filter`、`interleaved-vigenere`、`intrastat-meldung`、`jax-speedrun-gpu`、`ks-solver-cpp`、`kv-live-surgery`、`lake-temp-glm`、`layout-config-recreation`、`layout-config-recreation2`、`legacy-utility-triage`、`live-database-cutover`、`math-eval-grader`、`medical-claims-processing`、`mp-checkpoint-consolidation`、`music-harmony`、`mvcc-lsm-compaction`、`nextjs-performance`、`ontology-kg-querying`、`payments-pipeline-fix`、`photonic-waveguide-routing`、`pretrain-shard-corruption`、`production-planning`、`protein-autointerp-disulfide`、`react-lead-form`、`retro-console-soc`、`risk-scorer-replay`、`roy-polymorph-cn`、`rs-archive-clone`、`satb-audio-transcription`、`session-window-debug`、`sglang-qwen-burst`、`shadow-relay`、`sound-change-cascade`、`takens-embedding-lean`、`telecom-entity-resolution`、`uefi-bootkit`、`vba-userform-port`、`vf2-speedup-networkx`、`vllm-deepseek-streaming`、`vpp-loss-divergence`、`wal-recovery-ordering`、`wdm-design`。

- 页面说明 Terminal-Bench 是 wide and dynamic，会持续加入新任务和改进任务；因此 66 个任务只适用于本次固定版本页面。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 页面说明该版本包含 GPU 和多容器任务，并推荐 Modal 或 Daytona；因此它不是只覆盖普通单容器、CPU-only 的代码补全场景。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

### 提示词、工具、上下文

- 公开页面给出了任务集合和运行方式，但没有给出一份统一的完整 system prompt、每个 Agent 的完整 prompt bundle、上下文窗口上限、采样参数、temperature、工具 schema 或每次提交的原始对话记录。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- Harbor 官方任务结构文档可以确认任务包含 instruction、environment 和 test script；任务说明在 `instruction.md`，配置在 `task.toml`，测试脚本通常为 `tests/test.sh`。[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)
- Harbor 的 Job 文档说明 Trial 轨迹可包含 Agent 的 tool calls、observations 和多模态内容，但这属于 Harbor 的观测/结果展示能力，不等于 Terminal-Bench 4.0 为所有 Agent 规定了同一组工具或多模态输入。[来源：Harbor 官方评测运行文档](https://www.harborframework.com/docs/run-jobs/run-evals)
- 可确定的最低层工具环境是“终端任务 + Harbor 沙箱”；具体 Agent 能否使用 shell、文件操作、网络、编辑器、浏览器或其他工具，以及工具调用格式，必须按 Agent 实现逐条核实。目标页面本身没有统一工具合同。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)、[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)

### 上下文和资源

- 任务 instruction、容器环境、测试脚本和资源配置共同构成评测输入；Harbor 文档允许任务声明 CPU、内存、存储、GPU、GPU 类型和网络策略。[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)
- Harbor 文档说明环境网络模式可以是 `public`、`no-network` 或 `allowlist`，默认行为和任务/运行时设置有关；不能仅凭 benchmark 名称推断所有任务使用同一网络策略。[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)
- 目标页面没有给出 Terminal-Bench 4.0 的统一最大执行时长、统一 CPU/内存/GPU 配额或统一上下文窗口；这些应按任务和 Agent/Provider 配置查看。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)、[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)

### 成功判定

- Harbor 任务的测试脚本负责验证 Agent 是否完成 instruction，并写出 `/logs/verifier/reward.txt` 或 `/logs/verifier/reward.json`；`reward.txt` 通常用 `1` 表示成功、`0` 表示失败，`reward.json` 也可以提供多个数值 reward。[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)
- Harbor 官方任务差异文档说明，在原 Terminal-Bench 格式中，测试命令输出由 benchmark parser 映射为 binary reward；Harbor 格式把 reward 产出责任放到任务测试脚本，并支持非二元 reward。[来源：Harbor 官方 Terminal-Bench 格式差异文档](https://www.harborframework.com/docs/tasks/task-difference)
- 因此可以确认任务成功信号来自 verifier/test reward；但目标页面没有逐任务公开“成功”定义、部分得分细节或每个任务的分数聚合说明。不能把所有任务都假设成完全相同的布尔测试。[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)、[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

### 重复次数

- 排行榜 schema 要求 `n_trials`，但当前可见表格没有显示该列；本次无法从页面表格逐行核实每个 Agent+Model+Effort 组合到底跑了多少次。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 官方 README 的 Oracle `-k 5` 是“运行 Oracle solutions 5x 来确认环境工作正常”的建议，不是排行榜每条提交的重复次数，也不应拿来替代 `n_trials`。[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)
- 目标页面显示 `accuracy_ci95_half_width`，但没有公开每条记录的 trials 关联、成功数原始值或 CI 算法；因此不能用误差值反推重复次数。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

## 可比性规则

1. **先锁版本**：只在相同的 `terminal-bench/terminal-bench@4`、相同任务快照和相同 `4-0-0` 排行榜规则内比较；不要把 `latest`、其他 revision 或旧版结果直接合并。官方 README 说明 benchmark 持续更新并使用 tagged releases。[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)
2. **按组合比较**：把 Agent、Model、Effort 作为联合实验条件。`Codex + GPT-6 Astra + max` 与 `Codex + GPT-6 Astra + low` 是不同实验条件，即使 Model 展示名相同。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
3. **不要跨表格列偷换指标**：`accuracy` 是排名字段；Tokens 和 Cost 是资源/成本字段，不是准确率。页面没有定义 Accuracy/Cost 的官方综合指标。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
4. **保留误差值**：若比较两个相近分数，必须同时保留页面的 `± accuracy_ci95_half_width`，但不能把重叠或不重叠直接解释为正式统计显著性，因为页面没有公开 CI 计算和检验规则。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
5. **不能混用重复次数**：只有在 `n_trials`、任务集合、harness、模型版本和资源条件均明确一致时，才适合做精确的重复实验比较；当前页面没有展示逐行 `n_trials`。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
6. **不能把 Vendor 视为唯一变量**：不同 Vendor 记录同时改变了 Agent、工具、提示词实现、模型、Effort、Token 消耗和可能的环境配置，因此表格是 Agent-Model 系统结果，不是纯模型能力排行榜。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

## 时效性与偏差风险

- **任务漂移**：官方明确称任务会持续更新和改进；同名任务在不同版本中不能假定完全相同。[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)
- **版本选择偏差**：本次只观察到 4.0 的 66 个任务，不能代表所有 Terminal-Bench 版本或未来任务池。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- **提交选择偏差**：公开榜单只显示已经提交并被纳入当前榜单的 18 条可见记录；页面没有完整候选池，不能把未出现的 Vendor/Model 解释为不支持或能力较弱。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- **Harness 混杂**：Agent 名称不同意味着不同运行器和工具策略；同一 Model 在不同 Agent 中也可能产生不同结果。排行榜没有提供统一 prompt/tool 协议以消除该混杂。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- **Effort 混杂**：同一 Codex/GPT-6 Astra 在 low、medium、high、xhigh、max 下有不同分数、Token 和成本；把这些行合并成一个模型均值会丢失重要条件。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- **环境异质性**：页面说明包含 GPU 和多容器任务，Harbor 又支持多种环境 Provider、资源和网络策略；硬件、Provider、镜像、网络和超时差异可能影响结果。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)、[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)
- **成本不可直接跨 Vendor 比较**：页面只提供格式化的 Cost 字段，未公开定价快照、是否包含环境成本、缓存成本口径或货币换算规则。Cost 适合做页面内的描述性参考，不适合直接当作 Coding Plan 价格或单位性价比。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- **CI 解释风险**：`±` 字段名是 95% CI 半宽，但页面没有说明统计单位、抽样方法或独立性假设；不应自行把它转换为精确的显著性结论。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- **可复现性风险**：公开 Model 展示名没有底层版本 ID、prompt 版本、系统配置或完整轨迹；重复运行可能受到模型服务和任务环境变化影响。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

## 证据等级

- **A：页面直接可见或页面机器可读元数据**：数据集版本 4、排行榜 `4-0-0`、标题、任务数、任务名、排行榜列、18 条当前可见记录、分数、组织、模型展示名、Effort、Token、Cost、排行榜创建/更新时间。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- **B：官方 Harbor/Terminal-Bench 文档明确说明**：Harbor 是运行 harness；安装/运行方式；任务由 instruction、environment、test script 组成；reward 文件和成功判定机制；默认指标的通用平均规则；许可证。[来源：Harbor 官方运行 Terminal-Bench 教程](https://www.harborframework.com/docs/tutorials/running-terminal-bench)、[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)、[来源：Harbor 官方指标文档](https://www.harborframework.com/docs/datasets/metrics)、[来源：Terminal-Bench 官方 LICENSE](https://github.com/harbor-framework/terminal-bench/blob/main/LICENSE)
- **C：无法从限定来源确认或只能做谨慎分析**：每条提交的完整 prompt、上下文长度、工具 schema、底层模型 ID、精确 `n_trials`、CI 公式、完整资源配置、完整轨迹、成本口径和跨版本等价性。报告对这些内容不做事实性补全。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

## 对 Coding Plan 的可用范围

### 可以使用

- 作为“终端 Agent 完成多样化、复杂任务的公开相对信号”，辅助判断某个 Coding Plan 所提供的**确切模型/Agent 组合**是否值得进一步试用；使用时必须保留版本、Effort、Agent 和采集日期。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 作为终端操作、文件修改、调试、环境内执行和程序化验证等综合工作流的补充证据；这些能力方向与 Terminal-Bench 的终端任务定位一致。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)、[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)
- 在同一版本、同一 Agent、同一 Effort、同一模型展示版本条件下，把 Accuracy、误差值、Tokens 和 Cost 作为描述性输入；不要把它们未经说明合成一个新分数。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 在 Coding Plan 推荐中作为能力维度的一项输入，与官方套餐价格、额度、地区可用性、并发限制、速率限制和实际用户条件分开建模。Terminal-Bench 本身不提供这些套餐事实。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

### 不能使用

- 不能把某一条 Model+Agent 排名直接转换成 Vendor 的 Coding Plan 排名；计划可能提供不同模型版本、不同 Agent、不同限额和不同地区服务条件。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 不能用榜单 Accuracy 推断套餐价格、月度额度、消息/Token 配额、并发、响应速度、地区支付可用性、服务稳定性或退款政策；这些都不在该 benchmark 页面定义内。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 不能把 Cost 列当作 Coding Plan 订阅价格、真实用户边际成本或跨 Vendor 的单位成本；其口径和定价快照未公开。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 不能把 Terminal-Bench 4.0 结果外推为通用聊天、前端视觉质量、长期仓库维护、代码可维护性、安全性、部署可靠性、产品支持质量或所有编程任务能力。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
- 不能把页面排名当作严格的统计显著性排序，也不能因两条记录的 `±` 区间看起来不同就自行断言真实能力差异。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)

## 未解决问题

1. 当前公开页面没有逐条显示 `n_trials`、successes 或 trial ID；需要官方可访问的 leaderboard row/trial 导出才能确认每条提交的重复次数和分母。[来源：Harbor 官方排行榜 CLI 文档](https://www.harborframework.com/docs/hosted-harbor/cli-leaderboards)、[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
2. 页面没有说明 `accuracy` 的确切公式：是按任务平均、按 trial 平均、缺失 reward 如何处理，还是提交者上传后的预聚合值；Harbor 通用指标文档的默认平均规则不能自动证明 TB4 排行榜采用了同一实现。[来源：Harbor 官方指标文档](https://www.harborframework.com/docs/datasets/metrics)、[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
3. 页面没有公开 `accuracy_ci95_half_width` 的统计公式、抽样单位、是否按任务聚类、是否考虑重复运行相关性或如何处理非二元 reward。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
4. 页面没有为每个 Agent 提供完整 system prompt、工具定义、工具权限、终端交互协议、重试策略、最大步数、超时、上下文窗口或模型采样参数。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
5. 页面没有公开每个任务在 4.0 版本中的完整资源、网络、镜像、超时和 verifier 细节；Harbor 通用任务文档只能说明这些字段在框架中存在。[来源：Harbor 官方任务结构文档](https://www.harborframework.com/docs/tasks)、[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
6. 页面展示的是模型友好名称而非统一底层 model ID 或供应商快照 ID；因此同名显示名的精确可复现性仍未解决。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
7. 页面未说明 Cost 的计价来源、汇率/单位、缓存 Token 处理和环境成本边界；不能建立可靠的跨模型成本结论。[来源：Harbor Hub 指定页面](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=leaderboard&leaderboard=4-0-0)
8. 页面没有提供可直接下载的、含完整元数据和 trial 关联的公开快照；若要用于生产推荐，仍需在下一次采集时重新记录页面更新时间和公开行，不能把本文件当成永久榜单。[来源：Harbor 官方排行榜 CLI 文档](https://www.harborframework.com/docs/hosted-harbor/cli-leaderboards)、[来源：Terminal-Bench 官方 README](https://github.com/harbor-framework/terminal-bench/blob/main/README.md)

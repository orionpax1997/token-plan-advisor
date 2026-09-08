# Artificial Analysis Intelligence 调研

- **指定来源/目标 URL**：<https://artificialanalysis.ai/#intelligence>
- **维护主体**：Artificial Analysis, Inc.。网站 Terms of Use 将该公司列为站点及站点内容的权利主体；Artificial Analysis 自称提供独立的 AI 模型、推理服务与系统 benchmark。证据等级：A。
  - 来源：<https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf>
  - 来源：<https://artificialanalysis.ai/methodology/>
- **实际采集时间**：2026-09-08 06:33 UTC。
- **本次范围**：只核查 Artificial Analysis 官方主页、官方 Intelligence Index 方法页、官方指数详情页、官方 Data API 文档和官方法律条款；没有引入其他 benchmark 作为外部比较依据。方法页中出现的组成评测名称仅作为 Artificial Analysis Intelligence Index v4.1.1 的官方组成部分记录。

## 1. 页面与数据时间

- 目标主页当前把 Intelligence 区块标为 **Artificial Analysis Intelligence Index v4.1.1**，并列出 9 个组成评测：GDPval-AA v2、𝜏³-Banking、Terminal-Bench v2.1、SciCode、Humanity's Last Exam、GPQA Diamond、CritPt、AA-Omniscience、AA-LCR。证据等级：A。
  - 来源：<https://artificialanalysis.ai/#intelligence>
- 主页活动流显示 `Methodology updated · 20 Aug`，并显示 27 Aug 等模型/文章活动；页面没有给出这些活动的年份，也没有一个统一的“数据最后更新时间”字段。因此不能把活动流日期当作指数数据的精确发布日期。证据等级：A。
  - 来源：<https://artificialanalysis.ai/#intelligence>
- 官方 API 文档把当前指数版本写为 v4.1.1；但 API 返回字段 `intelligence_index_version` 是去掉 `v` 的 major.minor 数字（例如 `4.1`），不反映 patch 版本。官方说明 patch 版本仍可能因 grader 或数据集版本升级而改变分数。证据等级：A。
  - 来源：<https://artificialanalysis.ai/data-api/docs>
- 主页本次页面快照在 Intelligence Index 图表中显示 `29 of 624 models`；指数详情页本次页面快照显示 `30 of 612 models`。两个官方视图的分子/分母不同，且页面是动态数据，不能合并成一个稳定的“总覆盖数”，也不能把图表展示数当作完整已评测全集。证据等级：A；“不能合并”的结论为 B 级解释。
  - 来源：<https://artificialanalysis.ai/#intelligence>
  - 来源：<https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index>
- 主页的 Frontier Language Model Intelligence over time 图表显示 `17 of 58 model creators`，这只是该图表视图的展示范围；它不证明 Artificial Analysis 只覆盖 58 个 Vendor，也不证明 17 个 Vendor 的所有模型都进入指数。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/#intelligence>
- 模型级 API 数据包含 `name`、`slug`、`release_date`、`model_creator.name` 等字段；因此模型版本/变体应按 Artificial Analysis 的模型条目和 release date 记录，而不是只按 Vendor 名称归并。证据等级：A。
  - 来源：<https://artificialanalysis.ai/data-api/docs>

## 2. 定位与数据获取方式

- Artificial Analysis 将 Intelligence Index 定义为综合语言模型能力的合成指标，覆盖 reasoning、knowledge、maths、programming；官方同时明确所有评测指标都有局限，未必适用于每种使用场景。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- 页面可通过目标主页的公开图表查看 headline Intelligence Index 及组成评测入口。本报告的页面事实通过官方网页内容采集；没有把页面图表抓取为一个永久数据集，也没有调用需要密钥的 API。证据等级：A。
  - 来源：<https://artificialanalysis.ai/#intelligence>
- 官方 Data API 的 base URL 是 `https://artificialanalysis.ai/api/v2`。API 需要在 `x-api-key` header 中提供组织 API key；官方建议密钥只放在服务端，不要放进浏览器或移动端。证据等级：A。
  - 来源：<https://artificialanalysis.ai/data-api/docs>
- Free API 提供公开语言模型 endpoint 的 headline indices、中位性能和输入/输出价格；Pro 提供模型级详情、完整价格、性能分位数等；Commercial 才提供 Provider 级数据、性能时间序列和经协商的扩展数据。没有相应 tier 时，官方文档说明会返回 403。证据等级：A。
  - 来源：<https://artificialanalysis.ai/data-api/docs>
- 官方 API 速率限制为固定 24 小时窗口：Free 100 次、Pro 500 次、Commercial 自定义；所有 API 使用均要求注明 Artificial Analysis 来源，API 使用同时受 Terms of Use 和 Data Platform Terms 约束。证据等级：A。
  - 来源：<https://artificialanalysis.ai/data-api/docs>
- 官方 Terms of Use 对网站访问授予的是可撤销、非转让、非独占、有限的个人非商业使用许可；条款禁止商业利用网站或其展示内容，也禁止复制、分发、下载、自动化查询、strip/scrape/mine 数据（公共搜索引擎在条款规定范围内的例外除外）。因此不能把公开页面当作允许批量抓取、再发布或建立竞品服务的开放数据许可。证据等级：A。
  - 来源：<https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf>
- API 页面另行说明可通过 Commercial package 协商客户产品、报告和数据 feed 的再分发权；在获得明确商业授权前，本报告只把 API/网页数据作为内部研究证据，不主张外部再分发权。证据等级：A。
  - 来源：<https://artificialanalysis.ai/data-api>
  - 来源：<https://artificialanalysis.ai/data-api/docs>

## 3. 评测对象、能力指标与权重

### 3.1 评测对象

- 评测对象是语言模型条目，包括 proprietary 和 open-weights 模型；页面的 Open Weights 视图还标注商业使用受限或非商业许可状态。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/>
  - 来源：<https://artificialanalysis.ai/#intelligence>
- 一个条目可能包含模型名称、推理/非推理变体、推理 effort 或 fallback 等配置；官方 API 通过 `name`、`slug`、`reasoning_model`、`release_date` 等字段描述模型条目。不同配置不应在没有核对条目的情况下视为同一个可比对象。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/data-api/docs>
  - 来源：<https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index>
- 当前 Index 是以模型能力为中心的综合分数，不是 Coding Plan、订阅方案、Provider 可用性或单一 API endpoint 的分数。官方主页将模型 Intelligence、Speed、Cost per Task 分开展示；API 也将模型、Provider、价格、性能分开建模。证据等级：A；用于 Coding Plan 的界限为 B 级解释。
  - 来源：<https://artificialanalysis.ai/#intelligence>
  - 来源：<https://artificialanalysis.ai/data-api/docs>

### 3.2 Index 原始组成与指标定义

官方方法页给出以下 v4.1.1 组成、题量/任务量、重复次数、响应类型、原始评分方式和权重。表内“原始指标”保留官方术语，不把不同评分器自行改写成同一种绝对正确率。证据等级：A。

| 类别/类别权重 | 评测 | 题量或任务量 | 重复次数 | 响应与工具 | 原始评分定义 | Index 权重 |
|---|---|---:|---:|---|---|---:|
| Agents / 34% | GDPval-AA v2 | 220 tasks | 1 | Agent 产出文件；使用工具 | 两个模型提交物由三模型 judge panel 盲比，拟合 Bradley-Terry/Elo；人类专家交付物锚定 1000；用于 Index 时按 `clamp((Elo - 500) / 2000)` 归一化 | 20% |
| Agents / 34% | 𝜏³-Banking | 97 | 5 | Agent-user 双方控制模拟、知识检索；使用工具 | 后端数据库状态评估，pass@1；是否完成实际状态变更，而不是只评对话质量 | 14% |
| Coding / 24% | Terminal-Bench v2.1 | 89 | 3 | 终端任务执行；方法表标为不使用工具 | 测试套件 pass/fail，pass@1；任务验证套件必须全部通过才成功 | 16% |
| Coding / 24% | SciCode | 288 个 test-set subproblems | 3 | Python 代码；方法表标为不使用工具 | 代码执行、pass@1、subproblem 计分；代码必须通过所有 unit tests，并使用科学家标注的背景提示 | 8% |
| General / 18% | AA-LCR | 100 | 3 | Open Answer；方法表标为不使用工具 | Equality Checker LLM 判定，pass@1 | 6% |
| General / 18% | AA-Omniscience | 6,000 | 1 | Open Answer；方法表标为不使用工具 | Accuracy 占 8%；`1 - Hallucination Rate` 占 4%；拒答不因“不猜”受到与错误猜测相同的惩罚 | 12%（其中 8%+4%） |
| Scientific Reasoning / 24% | Humanity's Last Exam (HLE) | 2,158 | 1 | Open Answer；方法表标为不使用工具 | Equality Checker LLM 判定，pass@1 | 12% |
| Scientific Reasoning / 24% | GPQA Diamond | 198 | 5 | 四选一；方法表标为不使用工具 | Regex 提取答案，pass@1 | 6% |
| Scientific Reasoning / 24% | CritPt | 70 | 5 | Python functions、symbolic expressions、numerical answers；方法表标为不使用工具 | 官方 grading server，pass@1 | 6% |

- 四类权重为 Agents 34%、Coding 24%、Scientific Reasoning 24%、General 18%，总和为 100%；这意味着 Index 对 agentic work 的权重高于 Coding 子类。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- 主页将 Intelligence Index 标为“Higher is better”；主页和指数详情页同时把 cost per task 标为越低越好、把 output token/task 和 time per task 单独展示，不能把它们当作 Intelligence 分数的组成指标。证据等级：A。
  - 来源：<https://artificialanalysis.ai/#intelligence>
  - 来源：<https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index>
- 官方页面没有在高层说明中给出一个可独立重算所有九个组成分数的统一公开公式；已明确公开的是分类/评测权重、各评测的原始评分方法，以及 GDPval-AA v2 的归一化方式。其余分数的具体归一化、截断和合成细节若未在相应方法段落另行说明，不应自行假设。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>

## 4. Harness、任务集、提示词、工具、上下文与成功判定

### 4.1 统一设置

- 官方原则称所有模型在一致的 prompting strategy、temperature settings 和 evaluation criteria 下评测；使用 zero-shot instruction prompting，不提供 examples/demonstrations。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- 非 reasoning 模型默认 temperature 为 0；reasoning 模型为 0.6，除非模型厂商另有推荐。非 reasoning 模型最大输出为 16,384 tokens，但模型上下文或自身最大输出上限更小时会下调；reasoning 模型使用模型创建者披露的最大允许输出，并按模型单独设置。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- API 失败自动重试最多 30 次；全部 30 次失败的问题会人工复核；持续 API 故障影响结果时不发布。官方也提示专有模型的所有可用 API 都阻止某一问题时可能降低分数。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- 官方通常使用 pass@1：第一次尝试得到正确答案才计为正确；有多次重复时，将所有 repeats 的测试实例一起聚合。重复次数并不统一，按评测分别为 1、3 或 5。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- Agentic benchmark 的主要 sandbox provider 是 e2b。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>

### 4.2 各评测环境

- **GDPval-AA v2**：使用 Artificial Analysis 的 Stirrup agent harness；每个任务建立新的 E2B sandbox，载入参考文件并安装任务所需包。模型可自行调用 Web Fetch、Web Search、View Image（有视觉能力时）、Code Exec、Finish、Abandon Task 六类工具。每个任务最多 250 turns；提交一个或多个文件后由三模型 judge panel 对同一任务的两个提交物盲比。官方方法页说明其任务基础是公开 gold task set，并对部分 Office 文件做了兼容性 metadata 修复，但没有改变文档正文、幻灯片内容或布局。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **𝜏³-Banking**：使用 97 个任务、每题 5 次重复；agent 处理约 700 份互联政策文档，执行检索和多步工具调用，最终按后端数据库状态判定；启用 BM25 lexical search 和 grep，单次 repeat 最多 200 steps。用户模拟器和自然语言 assertion judge 使用官方方法页列出的 GPT-5.4 Mini（medium）。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **Terminal-Bench v2.1**：使用 Terminus 2 agent harness 和 E2B sandbox；89 个终端任务、每题 3 次重复；通过任务自带 verification suite 判定，所有测试必须通过。agent 最多 250 episodes，每任务 timeout 为 7,200 秒，除非任务自行规定更长时间。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **SciCode**：Python 科学计算任务，使用科学家标注的 background information 作为 prompt 上下文，按 subproblem 计分，代码执行并以 pass@1 判定；方法表说明代码必须通过所有 unit tests。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **AA-LCR**：100 个 text-based hard questions，覆盖 Company Reports、Industry Reports、Government Consultations、Academia、Legal、Marketing Materials、Survey Reports 七类文档；每题输入约 100k tokens（用 cl100k_base 测量），要求至少 128K context window；总输入约 3M unique tokens、约 230 份文档；由 GPT-5.6 Luna（medium）作 equality checker，pass@1 判定。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **AA-Omniscience**：6,000 个问题、42 个主题；回答分为 `CORRECT`、`INCORRECT`、`PARTIAL_ANSWER`、`NOT_ATTEMPTED`，由 GPT-5.6 Luna（medium）评分；错误 hallucination 扣分，拒答保持中性。Index 同时使用 Accuracy 和 Non-Hallucination Rate 两个成分。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **Humanity's Last Exam**：使用 2,158 个 text-only questions，来自官方方法页所述版本的 text-only 子集；涵盖 mathematics、humanities、natural sciences；使用从原始方法改编的 equality-checker prompt、GPT-5.6 Luna（medium）和 pass@1。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **GPQA Diamond**：198 个 biology、physics、chemistry 四选一问题；使用 regex 提取选项，pass@1；每题 5 次重复。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **CritPt**：70 个 challenge-level test-set challenges，每题 5 次重复；先让模型带 reasoning 完成 challenge，再用第二步把响应格式化为 grader 所需代码格式；答案包括数值、SymPy symbolic expression 和 Python function，并由官方 grading server 判断，pass@1；两步 token usage/cost 都计入。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>

### 4.3 提示词、上下文与模型版本

- 官方方法页公开了“zero-shot、清晰指令、无示例”的总原则，并在部分评测段落公开了 agent system/task prompt、equality checker、answer extraction 和格式化流程；但没有声明九个评测共享一个完全相同的 prompt，也没有保证所有私有任务、全部 judge system prompt、所有 API 参数或每次调用的完整 trace 均公开。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- GDPval 的 prompt 会插入相关 task prompt、reference files 和 finish tool details；AA-LCR、HLE、AA-Omniscience 等使用专门的 equality-checker/judge 流程；SciCode 明确加入科学家标注背景；CritPt 使用两步解析。这些差异是评测定义的一部分，不能只把结果解释为“裸模型回答能力”。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- 当前网页方法内容列出的若干 grader/harness 版本包括 GPT-5.6 Luna（medium）、GPT-5.4 Mini（medium）、GDPval 三模型 judge panel，以及 Stirrup/Terminus 2 等 harness。grader、数据集或 harness 更新会改变可比性；具体模型条目的 release date 和名称应从 API 的模型元数据读取。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
  - 来源：<https://artificialanalysis.ai/data-api/docs>
- API 文档示例展示了 `name`（例如带 reasoning effort 的模型名）、`slug`、`release_date`、`reasoning_model`、`context_window_tokens` 和 `model_creator` 字段；这是记录模型版本与运行变体所需的字段，但示例 JSON 本身不是本次主页快照中所有模型的实际结果。证据等级：A。
  - 来源：<https://artificialanalysis.ai/data-api/docs>

## 5. 成本与 token 指标的口径

- Intelligence Index 的 cost per task 是按各评测权重加权的单任务成本；官方定义使用模型运行工作负载实际消耗的 input、cached、output token 价格，再除以任务数。模型输出或 reasoning token 越多，即使单 token 价格相同，单任务成本也可能更高。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/>
  - 来源：<https://artificialanalysis.ai/#intelligence>
- Index 评测的 token count 优先使用模型 API provider 报告的 token 数；没有时使用 canonical tokenizer fallback。cache hit rate 与成本还结合 live measured typical cache hit rate，而非只使用评测运行时的一次测量。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- API 的 Free 数据只提供 headline index、中位性能和 input/output pricing；Pro 才包含完整评测集、token counts、blended pricing、context window、parameters、modalities、licensing 等更完整字段；因此不同 tier 返回的数据不可当作同一完整数据集。证据等级：A。
  - 来源：<https://artificialanalysis.ai/data-api/docs>
- Cost per Intelligence Index task 是按 API/Provider 价格和实际 token 使用计算的外部运行成本，不是某个 Coding Plan 的订阅价格、套餐额度或用户实际账单。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/>
  - 来源：<https://artificialanalysis.ai/#intelligence>

## 6. 可比性规则

1. **优先同版本比较**：只在同一 Index 版本、同一组成评测、同一权重和相同筛选口径内比较。v4.1.1 与其他 major/minor 版本不应直接做数值排序；官方说明 minor 版本可能改变评测、任务子集、grader、评分/归一化、权重、锚点或刷新数据。证据等级：A。
   - 来源：<https://artificialanalysis.ai/data-api/docs>
2. **保留 patch 版本**：API 的 `4.1` 不能替代网页上的 `v4.1.1`；patch 版本可能改变分数但 API major.minor 字段不体现 patch。比较时必须保存网页/方法页显示的完整版本。证据等级：A。
   - 来源：<https://artificialanalysis.ai/data-api/docs>
3. **同一模型条目比较**：要同时核对 `name`、`slug`、release date、reasoning/non-reasoning、effort/fallback 等变体；不能把不同推理强度或 fallback 配置的结果平均成 Vendor 分数。证据等级：A/B。
   - 来源：<https://artificialanalysis.ai/data-api/docs>
4. **区分原始指标**：GDPval 的 Elo、Terminal-Bench 的测试通过率、AA-Omniscience 的 accuracy/non-hallucination、GPQA 的选项准确率并非同一种原始量；只能使用 Artificial Analysis 已归一化的 Index 分数做官方定义内的综合比较，不能自行把各列当作同一种成功率。证据等级：A/B。
   - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
5. **注意重复次数**：同一 Index 中不同评测重复 1、3、5 次不等；pass@1 是跨 repeats 聚合后的口径，不能把重复次数当作 pass@5，也不能把一次任务的成功概率直接与另一评测的重复结果比较。证据等级：A/B。
   - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
6. **比较时记录页面快照**：主页和详情页已经出现 `29/624` 与 `30/612` 的覆盖差异；模型新增、隐藏或重新评测会改变榜单组成。应保存访问时间、页面版本、过滤器和 API tier。证据等级：A/B。
   - 来源：<https://artificialanalysis.ai/#intelligence>
   - 来源：<https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index>
7. **GDPval 特别规则**：其 Elo 结果锚定人类专家，并按模型加入时间冻结后归一化；因此新增模型、judge panel 或参考参数变化可能影响解释，不能把它当成静态绝对百分比。证据等级：A。
   - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>

## 7. 时效性、偏差与不确定性风险

- **版本漂移**：方法页、grader、数据集版本、sandbox/harness、权重和归一化会更新；同一个模型的历史分数未必能与当前分数直接比较。API 文档明确说明 minor/patch 变化可能改分。证据等级：A。
  - 来源：<https://artificialanalysis.ai/data-api/docs>
- **动态覆盖风险**：主页和详情页当前覆盖数字不一致，图表通常只是部分展示；不能据此宣称完整 Vendor/模型覆盖。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/#intelligence>
  - 来源：<https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index>
- **综合权重风险**：Agents 占 34%，Coding 占 24%，Scientific Reasoning 占 24%，General 占 18%；指数更像综合智能/agentic 能力信号，不是等权 coding benchmark。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **语言与模态偏差**：官方称 Index 主要是 text-based、English-language；image input、speech input 和 multilingual performance 单独评测。因此 Index 不能直接代表中文、视觉或语音能力。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **任务分布风险**：GDPval、AA-LCR、AA-Omniscience 等任务覆盖专业工作、长上下文、知识与事实可靠性；这些任务与某个具体个人开发者仓库、编译链、IDE、终端工作流未必相同。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **评分器风险**：多个评测使用 Equality Checker LLM、单一/多模型 judge panel、regex 或官方 grading server；judge 模型的能力、偏好、提示词和版本可能影响结果。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **随机性与样本量风险**：Artificial Analysis 估计整个 Index 在特定模型、所有组成数据集进行超过 10 次重复实验时的 95% CI 小于 ±1%；官方同时明确单个评测的 CI 可能更宽。因此不能给每个模型或每个子评测自动套用 ±1%。证据等级：A。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **配置差异风险**：temperature 对 reasoning/non-reasoning 模型不同，reasoning 输出上限按模型创建者披露值设置；上下文窗口、API 失败重试和 endpoint 行为也会影响实际结果。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **成功判定风险**：pass@1、测试套件全通过、数据库状态、文件 rubric、Elo 盲比和 LLM equality checking 衡量的是不同类型的成功；“Index 分数更高”不等于每种任务的绝对成功率都更高。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **可复现性风险**：官方维护内部数据集副本，部分 agent/文件环境和完整 prompt/评测 trace 并不等于公开可本地重跑的完整 harness；没有拿到相同版本、相同 API endpoint、相同任务/文件和 judge 配置时，不应声称复现了官方分数。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **许可与数据访问风险**：网站 Terms 禁止自动化抓取和商业复制；API 虽有免费 tier，也要求 key、归因并受 tier/速率/再分发条款约束。生产集成需要按官方 API 或书面商业授权执行。证据等级：A。
  - 来源：<https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf>
  - 来源：<https://artificialanalysis.ai/data-api/docs>

## 8. 证据等级

- **A：直接一手事实**：目标主页当前显示的 Index 版本、组成评测、图表字段和动态覆盖数；方法页的权重、题量、重复次数、评分方法、温度、输出上限、重试、harness、工具和上下文；API 文档的版本、字段、tier、限流、归因；法律条款的许可和禁止事项。
- **B：基于 A 的限定性解释**：Index 更适合作为综合能力信号；同版本、同模型条目、同快照比较更可靠；它可作为 Coding Plan 的模型能力输入但不能替代套餐事实。
- **未解决/不应补猜**：主页图表覆盖数字的确切筛选规则和完整全集；所有模型的评测版本、endpoint/Provider 细节和逐题结果；九个评测统一合成前每项的完整归一化公式；每一次运行的 seed、完整 API 请求、所有 judge prompt、所有私有任务和完整 confidence interval；网页活动流日期的年份和统一数据更新时间。

## 9. 对 Coding Plan 的可用范围

- **可用**：把 v4.1.1 的 Index 作为“模型综合能力”的一个外部信号；把其中 Coding 24%（Terminal-Bench v2.1 16% + SciCode 8%）作为与终端任务、Python 科学代码、测试通过相关的方向性证据；把 Agents 34% 作为工具编排、长任务和文件交付能力的方向性证据。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **可用**：在比较候选模型时保存完整模型名、reasoning/effort 变体、release date、Index version、采集时间和页面/API tier；在同一快照内将该分数与 Coding Plan 的官方价格、额度、地区可用性和工具政策分开评估。模型字段和版本规则来自官方 API；后半句是本项目的使用边界。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/data-api/docs>
- **有限可用**：如果 Coding Plan 的实际工作流主要是终端操作、代码生成、测试修复或多步 agent 任务，Terminal-Bench、SciCode、GDPval-AA、𝜏³-Banking 等组成结果比单一综合分更有解释力；仍需核对任务环境是否相同。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- **不可直接使用**：Cost per Intelligence Index task 只能作为按 API 价格和 token 消耗计算的外部成本参考，不能用来推导 Coding Plan 月费、套餐额度、超额费用或用户实际成本。证据等级：A/B。
  - 来源：<https://artificialanalysis.ai/methodology/>
  - 来源：<https://artificialanalysis.ai/#intelligence>

## 10. 禁止推断

- 不得把 Artificial Analysis Intelligence Index 排名直接当作 Coding Plan 排名、套餐性价比排名或购买建议。
- 不得从模型分数推断某个 Coding Plan 是否包含该模型、是否在用户所在地区可用、是否有相同上下文/工具/system prompt、是否允许商用或是否有同一额度。
- 不得把综合 Index 分数当作代码编译成功率、单元/集成测试通过率、SWE issue resolution rate、仓库级重构成功率、代码可维护性、安全性或生产可靠性。
- 不得把 Coding 类 24% 当作完整 coding 能力；它只由官方列出的 Terminal-Bench v2.1 和 SciCode 组成，Agents、General、Scientific Reasoning 仍占其余 76%。
- 不得把 GDPval 的 Elo、AA-Omniscience 的可靠性分数、AA-LCR 的长上下文分数或任何子评测分数解释为统一的百分比正确率。
- 不得把主页当前显示的 29/624 或详情页的 30/612 当作永久、完整、相互一致的模型覆盖全集，也不得据此推导 Vendor 市占或模型发布覆盖率。
- 不得把 v4.1 API 字段当作完整 v4.1.1 版本；不得跨版本、跨不同筛选器或跨不同模型变体直接比较小数差异。
- 不得把 Index 的 English/text-only 结果推断为中文、多语言、图像、语音或视频能力；官方明确这些方向单独评测。
- 不得在没有官方授权时批量抓取网页、再发布原始数据、把数据嵌入商业产品或建立竞品服务。

## 11. 未解决问题

1. 主页与指数详情页在同一采集时点给出不同的模型覆盖分子/分母；官方没有在页面上解释这两个视图的筛选、分页或更新时间差异。
2. 官方公布了每个组成评测的权重和许多原始评分方式，但当前公开方法页没有给出所有九项从原始分数到 0-100 Index 贡献的完整统一归一化公式。
3. API 的指数版本字段不带 patch；若只使用 API，无法仅凭 `intelligence_index_version=4.1` 识别 v4.1.1，必须同时保留网页/方法页版本。
4. 官方没有在本次可见页面中为每个模型/每个子评测统一公开逐项置信区间、样本方差、seed 和完整重复轨迹。
5. 主页活动流给出“20 Aug”“27 Aug”等日期但不显示年份，也没有统一的页面数据更新时间字段。
6. 评测模型的完整 endpoint、Provider、实际模型权重/部署版本、所有模型的 reasoning effort 与 fallback 细节，需要通过相应 API tier 或官方模型详情进一步核对，不能从主页图表补猜。
7. 公开方法说明了部分 prompt 模板、工具和 judge，但没有证明所有九个评测的完整任务提示、system prompt、工具 schema、调用参数和执行 trace 都可公开重跑。
8. 未发现官方页面允许将 Intelligence Index 原始网页内容用于本项目外部商业再分发的通用许可；API 的 Commercial redistribution 需要单独确认合同范围。

## 12. 结论

Artificial Analysis Intelligence Index v4.1.1 是由 9 个评测组成、偏重 Agents 的综合语言模型能力指标。它对 Coding Plan 的合理用途是提供同一版本快照内的模型能力参考，尤其帮助区分终端/代码测试和 agentic workflow 的方向性表现；它不能替代套餐价格、额度、地区可用性、模型访问权或真实用户工作流验证。后续使用时应保留完整版本 `v4.1.1`、模型条目与变体、采集时间、覆盖视图、API tier 和官方来源 URL，并把所有未解决问题作为数据质量限制呈现。

主要来源：

- <https://artificialanalysis.ai/#intelligence>
- <https://artificialanalysis.ai/methodology/intelligence-benchmarking>
- <https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index>
- <https://artificialanalysis.ai/data-api/docs>
- <https://artificialanalysis.ai/data-api>
- <https://artificialanalysis.ai/methodology/>
- <https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf>

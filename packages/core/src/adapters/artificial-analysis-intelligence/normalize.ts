import type { BenchmarkCollection, BenchmarkRecord, BenchmarkSourceRef, CapabilityTag } from "../../schema/benchmark.ts";
import type { BenchmarkSnapshot } from "../_shared.ts";
import {
  parseApiDocs,
  parseHomepage,
  parseIndexDetail,
  parseMethodology,
  parseMethodologyLanding,
  parseTerms,
  type HomepageSnapshot,
  type IndexDetailSnapshot,
  type MethodologyEvalRow,
  type MethodologySnapshot,
} from "./parse.ts";
import { SRC } from "./sources.ts";

// ---------------------------------------------------------------------------
// 条件与禁止推断文案：来源为随包 fixture 的官方转写快照与 research/15-04（本批事实基准）。
// AA 网站 ToS 禁止抓取/复制页面内容，fixture 为结构化转写；条件对整份 v4.1.1 快照一致，
// 逐记录携带以保证记录自足、可独立导出。
// ---------------------------------------------------------------------------

/** 统一 prompt 口径（方法页「统一设置」）。 */
const UNIFIED_PROMPT_POLICY =
  "官方统一 zero-shot instruction prompting，不提供 examples/demonstrations；部分评测公开 agent system/task prompt、equality checker、answer extraction 与格式化流程，但官方未声明九个评测共享同一 prompt，也未保证全部 judge system prompt、私有任务与完整 trace 公开";

/** 统一输出设置（温度 + 最大输出；方法页「统一设置」，对所有组成评测一致）。 */
const UNIFIED_OUTPUT_SETTINGS =
  "统一输出设置：非 reasoning 模型最大输出 16,384 tokens（模型上下文或自身最大输出上限更低时下调），reasoning 模型使用模型创建者披露的最大允许输出并按模型单独设置；temperature：非 reasoning 模型 0、reasoning 模型 0.6（厂商另有推荐除外）";

/** API 失败重试（方法页「统一设置」）。 */
const API_RETRY_NOTE = "API 失败自动重试最多 30 次，全部失败的问题人工复核；持续 API 故障影响结果时不发布";

/**
 * 全部记录共享的禁止推断前缀（research/15-04 §10 + ticket 03 要求）。
 * 覆盖：Plan 排名/可用性推断、Coding 权重不完整、子评测语义混同、覆盖数全集、
 * 版本拼接、模态外推、未授权抓取/再分发、重加权命名、权重当分数、重复次数误读。
 * 数字（类别权重、Coding 拆分、覆盖数）从 fixture 插值，避免快照刷新后文案失真。
 */
function buildSharedProhibitedInferences(
  methodology: MethodologySnapshot,
  homepage: HomepageSnapshot,
  indexDetail: IndexDetailSnapshot,
): string[] {
  const categoryWeight = (category: string): number =>
    methodology.category_weights_percent[category] ?? 0;
  const evalWeight = (evalName: string): number =>
    methodology.evals.find((e) => e.eval_name === evalName)?.index_weight_percent ?? 0;
  const codingWeight = categoryWeight("Coding");
  const outsideCoding = 100 - codingWeight;
  return [
    "不得把 Artificial Analysis Intelligence Index 排名直接当作 Coding Plan 排名、套餐性价比排名或购买建议",
    "不得从模型分数推断某个 Coding Plan 是否包含该模型、是否在用户所在地区可用、是否有相同上下文/工具/system prompt、是否允许商用或是否有同一额度",
    "不得把综合 Index 分数当作代码编译成功率、单元/集成测试通过率、SWE issue resolution rate、仓库级重构成功率、代码可维护性、安全性或生产可靠性",
    `不得把 Coding 类 ${codingWeight}% 当作完整 coding 能力：它只由官方列出的 Terminal-Bench v2.1（${evalWeight("Terminal-Bench v2.1")}%）和 SciCode（${evalWeight("SciCode")}%）组成，其余类别仍占 ${outsideCoding}%`,
    "不得把 GDPval 的 Elo、AA-Omniscience 的可靠性分数、AA-LCR 的长上下文分数或任何子评测分数解释为统一的百分比正确率",
    `不得把主页当前显示的 ${homepage.intelligence_chart_coverage.display} 或详情页的 ${indexDetail.intelligence_index_coverage.display} 当作永久、完整、相互一致的模型覆盖全集，也不得据此推导 Vendor 市占或模型发布覆盖率`,
    "不得把 v4.1 API 字段当作完整 v4.1.1 版本；不得跨版本、跨不同筛选器或跨不同模型变体直接比较小数差异",
    "不得把 Index 的 English/text-only 结果推断为中文、多语言、图像、语音或视频能力（官方明确这些方向单独评测）",
    "不得在未获得官方授权时批量抓取网页、再发布原始数据、把数据嵌入商业产品或建立竞品服务（网站 ToS 与 API 条款约束；授权申请为待办）",
    "禁止自行重新加权本记录所载官方权重后仍称 Artificial Analysis Intelligence Index，禁止把 Index 拆成 Coding Plan 总分",
    "不得把本记录的官方权重值当作模型能力分数；本批快照未含逐模型分数（进入 unresolved_facts）",
    "同一 Index 中不同评测重复 1、3、5 次不等，pass@1 为跨 repeats 聚合口径；不得把重复次数当作 pass@k，也不得跨评测比较重复结果",
  ];
}

/**
 * 权重记录的归一化说明：identity（官方原值）+ 完整官方权重表随每条记录保存
 * （ticket 03：完整版本号与官方权重必须随每条记录保存）。
 */
function weightNormalizationMethod(methodology: MethodologySnapshot): string {
  const categoryWeights = Object.entries(methodology.category_weights_percent)
    .filter(([key]) => key !== "sum_check")
    .map(([category, percent]) => `${category} ${percent}%`)
    .join("、");
  const evalWeights = methodology.evals
    .map((e) => (e.index_weight_breakdown ? `${e.eval_name} ${e.index_weight_percent}%（${e.index_weight_breakdown}）` : `${e.eval_name} ${e.index_weight_percent}%`))
    .join("、");
  return (
    `identity：官方 ${methodology.index_version} Index 权重原值保存于 raw_metric.metric_value；` +
    `完整版本与官方权重随本记录保存——类别权重 ${categoryWeights}；组成评测权重 ${evalWeights}；` +
    `metric_space 限定为同一 ${methodology.index_version} 版本的官方结构权重空间，仅同版本内解释；` +
    "禁止自行重新加权后仍称 Artificial Analysis Intelligence Index，禁止把 Index 拆成 Coding Plan 总分"
  );
}

// ---------------------------------------------------------------------------
// 记录装配
// ---------------------------------------------------------------------------

/** 权重记录共享的快照环境。 */
interface SnapshotContext {
  /** 快照落盘时间（fixture manifest captured_at）。 */
  capturedAt: string;
  methodologyUrl: string;
  indexVersion: string;
  methodologyUpdatedNote: string;
  /** cost per task 官方口径（方法总览页原文，透传进每条记录的 cost_basis）。 */
  costBasisValue: string;
}

/**
 * 可映射到注册表能力标签的组成评测（探索 02 Answer 注册表的 AA 行）：
 *   - terminal_agent_completion ← AA 的 Terminal-Bench 组成项；
 *   - code_execution_correctness ← AA 的 SciCode/Terminal-Bench 组成项；
 *   - agent_tool_orchestration ← AA Agents 类组成项；
 *   - long_context_understanding ← AA-LCR。
 * 其余 4 项（AA-Omniscience、HLE、GPQA Diamond、CritPt）无对应注册表标签，
 * 不伪造 capability 映射，改在 task_set.domains 逐项保存（含官方权重与任务数）。
 */
interface ComponentSpec {
  /** fixture eval_name 精确匹配。 */
  evalName: string;
  /** record_id 段（ASCII slug）。 */
  slug: string;
  capability: CapabilityTag[];
  /** harness 概称（完整环境细节在 conditions.tool_environment 原文保留）。 */
  harness: string;
  extraProhibitions: string[];
}

const COMPONENT_SPECS: ComponentSpec[] = [
  {
    evalName: "GDPval-AA v2",
    slug: "gdpval-aa-v2",
    capability: ["agent_tool_orchestration"],
    harness: "Stirrup agent harness（E2B sandbox，每任务新建）",
    extraProhibitions: [
      "不得把 GDPval-AA 的 Elo 当静态绝对百分比：结果锚定人类专家交付物（1000）、按模型加入时间冻结后归一化，新增模型/judge panel/参考参数变化可能影响解释",
    ],
  },
  {
    evalName: "𝜏³-Banking",
    slug: "tau3-banking",
    capability: ["agent_tool_orchestration"],
    harness: "𝜏³-Banking 官方 agent-user 模拟环境（judge 与用户模拟器：GPT-5.4 Mini medium）",
    extraProhibitions: [
      "不得把 𝜏³-Banking 结果与真实银行系统或其他业务工作流 benchmark 混同：判定依赖 GPT-5.4 Mini 用户模拟器与自然语言 assertion judge",
    ],
  },
  {
    evalName: "Terminal-Bench v2.1",
    slug: "terminal-bench-v2-1",
    capability: ["terminal_agent_completion", "code_execution_correctness"],
    harness: "Terminus 2 agent harness + E2B sandbox",
    extraProhibitions: [
      "不得把 Terminus 2 + E2B 环境下的 Terminal-Bench v2.1 结果当裸模型结果或任意终端工作流结果（与 Terminal-Bench 官方 Harbor 榜单为不同 harness 口径，不得跨来源拼接）",
    ],
  },
  {
    evalName: "SciCode",
    slug: "scicode",
    capability: ["code_execution_correctness"],
    harness: "官方 SciCode 评测流程（方法页未命名独立 harness）",
    extraProhibitions: [
      "不得把 SciCode 的 subproblem 计分当仓库级科学计算能力（依赖科学家标注背景提示与 unit tests 全通过判定）",
    ],
  },
  {
    evalName: "AA-LCR",
    slug: "aa-lcr",
    capability: ["long_context_understanding"],
    harness: "官方 AA-LCR 评测流程（Open Answer + equality checker，方法页未命名独立 harness）",
    extraProhibitions: [
      "不得把 AA-LCR 的长上下文结果外推为任意仓库上下文或 Coding Plan 实际窗口（官方条件：每题输入约 100k tokens、至少 128K context window）",
    ],
  },
];

function sourceSnapshot(ctx: SnapshotContext, artifactLocator: string): BenchmarkRecord["source_snapshot"] {
  return {
    source_ids: [SRC.methodology],
    artifact: artifactLocator,
    revision: `index_version=${ctx.indexVersion}, methodology_updated=${ctx.methodologyUpdatedNote}, captured_at=${ctx.capturedAt}`,
    url: ctx.methodologyUrl,
    captured_at: ctx.capturedAt,
  };
}

function subjectIdentity(spec: ComponentSpec): BenchmarkRecord["subject_identity"] {
  const notApplicable = (note: string) => ({
    value: null,
    status: "not_applicable" as const,
    note,
    source_ids: [] as string[],
  });
  return {
    subject_kind: "benchmark_component",
    model_display_name: spec.evalName,
    model_api_id_or_snapshot: notApplicable("benchmark_component 主体为组成评测定义，不绑定模型条目"),
    vendor: notApplicable("组件无 provider/vendor 概念；维护主体见 benchmark.maintainer"),
    agent_or_harness: spec.harness,
    reasoning_effort_or_configuration: notApplicable("组件级记录不绑定单一模型推理配置"),
  };
}

function buildWeightRecord(
  spec: ComponentSpec,
  row: MethodologyEvalRow,
  normalizationMethod: string,
  sharedProhibitions: string[],
  ctx: SnapshotContext,
): BenchmarkRecord {
  // 官方权重表原值为百分数（如 16%），原值直存不换算（identity）。
  const weight = row.index_weight_percent;
  const promptPolicy = row.prompt_or_context_notes
    ? `${UNIFIED_PROMPT_POLICY} ${spec.evalName}：${row.prompt_or_context_notes}`
    : UNIFIED_PROMPT_POLICY;
  const contextDescription = row.context_requirements
    ? `${spec.evalName} 上下文要求：${row.context_requirements}。${UNIFIED_OUTPUT_SETTINGS}`
    : UNIFIED_OUTPUT_SETTINGS;
  return {
    record_id: `artificial-analysis-intelligence:${ctx.indexVersion}:${spec.slug}:official_index_weight`,
    capability: spec.capability,
    raw_metric: {
      metric_name: "official_index_weight",
      metric_value: weight,
      metric_unit: "percent_of_composite_index",
      metric_direction: "descriptive_only",
      note: `官方方法页权重表原值 ${row.index_weight_percent}%（${row.category} 类别权重 ${row.category_weight_percent}%）；探索 02 Answer：保留完整版本与官方权重后，官方 Index/组成评测可进模型能力输入`,
      numerator_and_denominator: {
        value: null,
        status: "not_applicable",
        note: "权重为官方发布常数，无计数分子/分母",
        source_ids: [],
      },
      confidence_interval_or_error: {
        value: null,
        status: "not_applicable",
        note: "权重为官方发布常数，无抽样区间；官方对 Index 分数的 95% CI<±1% 估计适用于模型分数，见 unresolved_facts",
        source_ids: [],
      },
    },
    normalized_metric: {
      value: weight,
      metric_space: `artificial-analysis-intelligence:${ctx.indexVersion}:official_index_weight`,
    },
    normalization_method: normalizationMethod,
    source_snapshot: sourceSnapshot(ctx, `methodology-intelligence-index.json#evals[eval_name=${spec.evalName}].index_weight_percent`),
    subject_identity: subjectIdentity(spec),
    conditions: {
      task_set_description: `${spec.evalName}：${row.n_tasks_description}；Artificial Analysis Intelligence Index ${ctx.indexVersion} 组成评测（${row.category} 类别权重 ${row.category_weight_percent}%，本评测 Index 权重 ${row.index_weight_percent}%；重复 ${row.repeats} 次；${row.response_and_tools}）`,
      prompt_policy: promptPolicy,
      tool_environment: `${row.harness_or_environment}。${API_RETRY_NOTE}`,
      context_limit_or_context_description: {
        value: contextDescription,
        status: "verified",
        source_ids: [SRC.methodology],
      },
      success_definition: `${row.scoring_method}（${row.judge_or_grader}）`,
      repeat_count: {
        value: row.repeats,
        status: "verified",
        note: "官方方法页权重表 repeats 列",
        source_ids: [SRC.methodology],
      },
      cost_and_token_metadata: {
        cost_basis: {
          value: ctx.costBasisValue,
          status: "verified",
          note: "官方方法页口径说明；本批未采集逐模型 cost 数值，且该口径为 API/Provider 外部运行成本，非订阅价格（token 计数优先 API provider 报告值，缺省 canonical tokenizer fallback，cache 结合 live measured typical cache hit rate）",
          source_ids: [SRC.methodology, SRC.methodologyLanding],
        },
      },
    },
    confidence_status: "point_estimate_only",
    evidence_level: "A",
    comparability_class: "reference_only",
    allowed_use: "explanation",
    prohibited_inferences: [...sharedProhibitions, ...spec.extraProhibitions],
  };
}

// ---------------------------------------------------------------------------
// 采集文档装配
// ---------------------------------------------------------------------------

const SOURCE_NOTE_NO_STATED_TIME = "来源页面未显示统一更新时间，以采集时间为准";

export function normalizeFromSnapshots(
  snapshots: BenchmarkSnapshot[],
  collectedAt: string,
  toolVersion: string,
): BenchmarkCollection {
  const byId = new Map(snapshots.map((s) => [s.source_id, s]));
  const homepageSnapshot = byId.get(SRC.homepage);
  const methodologySnapshot = byId.get(SRC.methodology);
  const methodologyLandingSnapshot = byId.get(SRC.methodologyLanding);
  const indexDetailSnapshot = byId.get(SRC.indexDetail);
  const apiDocsSnapshot = byId.get(SRC.apiDocs);
  const termsSnapshot = byId.get(SRC.terms);
  if (
    !homepageSnapshot ||
    !methodologySnapshot ||
    !methodologyLandingSnapshot ||
    !indexDetailSnapshot ||
    !apiDocsSnapshot ||
    !termsSnapshot
  ) {
    throw new Error(
      "Artificial Analysis 快照不完整：需要 homepage/methodology/methodology-landing/index-detail/api-docs/terms",
    );
  }

  const homepage = parseHomepage(homepageSnapshot.body);
  const methodology = parseMethodology(methodologySnapshot.body);
  const methodologyLanding = parseMethodologyLanding(methodologyLandingSnapshot.body);
  const indexDetail = parseIndexDetail(indexDetailSnapshot.body);
  const apiDocs = parseApiDocs(apiDocsSnapshot.body);
  parseTerms(termsSnapshot.body);

  const capturedAt = methodologySnapshot.captured_at;
  const indexVersion = methodology.index_version;
  if (homepage.intelligence_index_version_display !== `Artificial Analysis Intelligence Index ${indexVersion}`) {
    throw new Error(
      `版本不一致：homepage 显示 ${homepage.intelligence_index_version_display}，methodology 为 ${indexVersion}`,
    );
  }
  const ctx: SnapshotContext = {
    capturedAt,
    methodologyUrl: methodologySnapshot.url,
    indexVersion,
    methodologyUpdatedNote: `${homepage.activity_stream.methodology_updated}（年份未显示）`,
    costBasisValue: methodologyLanding.cost_per_task_definition,
  };

  // 完整版本 + 官方权重（类别与逐评测）在文档层固定保存一次，并随每条记录的
  // normalization_method 重复携带（ticket 03：随每条记录保存）。
  const normalizationMethod = weightNormalizationMethod(methodology);
  const sharedProhibitions = buildSharedProhibitedInferences(methodology, homepage, indexDetail);

  const records: BenchmarkRecord[] = [];
  const domainEntries: {
    domain: string;
    n_tasks: number;
    weight_percent: number;
    topics: string[];
  }[] = [];
  for (const row of methodology.evals) {
    // 组成评测逐项进入 task_set.domains（全部 9 项，含无注册表标签的 4 项）：
    // 数值化官方权重 + 类别/重复/任务口径/评分/judge/环境全透传，可机读重建 Index 官方加权方案。
    domainEntries.push({
      domain: row.eval_name,
      n_tasks: row.n_tasks,
      weight_percent: row.index_weight_percent,
      topics: [
        `category=${row.category}(${row.category_weight_percent}%)`,
        `index_weight=${row.index_weight_percent}%${row.index_weight_breakdown ? `（${row.index_weight_breakdown}）` : ""}`,
        `repeats=${row.repeats}`,
        `tasks=${row.n_tasks_description}`,
        `scoring=${row.scoring_method}`,
        `judge=${row.judge_or_grader}`,
        `environment=${row.harness_or_environment}`,
      ],
    });
    const spec = COMPONENT_SPECS.find((s) => s.evalName === row.eval_name);
    if (!spec) continue; // 无注册表能力标签的组成评测不伪造 record
    records.push(buildWeightRecord(spec, row, normalizationMethod, sharedProhibitions, ctx));
  }
  for (const spec of COMPONENT_SPECS) {
    if (!methodology.evals.some((row) => row.eval_name === spec.evalName)) {
      throw new Error(`fixture 权重表缺少组成评测：${spec.evalName}`);
    }
  }

  const totalTasks = domainEntries.reduce((sum, d) => sum + d.n_tasks, 0);
  const categoryWeight = (category: string): number => methodology.category_weights_percent[category] ?? 0;
  const evalWeight = (evalName: string): number =>
    methodology.evals.find((e) => e.eval_name === evalName)?.index_weight_percent ?? 0;
  const taskSetDescription =
    `Artificial Analysis Intelligence Index ${indexVersion} 的 9 个组成评测各自拥有独立任务集` +
    `（明细见 task_set.domains；n_tasks 为九者之和，不是单一统一任务集，各域任务口径以 topics 里的 tasks= 原文为准）。` +
    `官方类别权重：Agents ${categoryWeight("Agents")}%、Coding ${categoryWeight("Coding")}%、Scientific Reasoning ${categoryWeight("Scientific Reasoning")}%、General ${categoryWeight("General")}%` +
    `（Coding = Terminal-Bench v2.1 ${evalWeight("Terminal-Bench v2.1")}% + SciCode ${evalWeight("SciCode")}%）。` +
    `Index 对 agentic work 的权重（${categoryWeight("Agents")}%）高于 Coding 子类（${categoryWeight("Coding")}%）；` +
    `主页 ${homepage.intelligence_chart_coverage.display}、详情页 ${indexDetail.intelligence_index_coverage.display}` +
    `为两个不同官方视图的覆盖数，按快照差异保存，不合并成稳定总覆盖数。`;

  // 覆盖数差异 + API major.minor 版本差异写入 revision 描述（快照差异记录，不静默取一）。
  const revision =
    `homepage_intelligence_chart=${homepage.intelligence_chart_coverage.shown}_of_${homepage.intelligence_chart_coverage.of_total}_models, ` +
    `index_detail_page=${indexDetail.intelligence_index_coverage.shown}_of_${indexDetail.intelligence_index_coverage.of_total}_models, ` +
    `coverage_views_differ=snapshot_difference_not_merged, ` +
    `api_intelligence_index_version=${apiDocs.intelligence_index_version_field.example_value}, ` +
    `index_version_web=${indexVersion}, ` +
    `methodology_updated=${ctx.methodologyUpdatedNote}`;

  const sources: BenchmarkSourceRef[] = snapshots.map((snapshot) => {
    const note =
      snapshot.source_id === SRC.homepage
        ? `主页活动流显示 Methodology updated · ${homepage.activity_stream.methodology_updated} 但无年份、无统一数据更新时间字段，以采集时间为准`
        : SOURCE_NOTE_NO_STATED_TIME;
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      kind: snapshot.kind,
      fetched_at: capturedAt,
      last_updated_at: null,
      last_updated_note: note,
    };
  });

  return {
    schema_version: "1",
    collection: {
      adapter_id: "artificial-analysis-intelligence",
      mode: "fixture",
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    benchmark: {
      benchmark_id: "artificial-analysis-intelligence",
      benchmark_version: indexVersion,
      leaderboard_or_dataset_revision: revision,
      maintainer: "Artificial Analysis, Inc.",
      source_url: homepageSnapshot.url,
      artifact_generated_at: null,
      harness:
        "多 harness 组成（按组成评测）：GDPval-AA v2=Stirrup（E2B sandbox）、𝜏³-Banking=官方 agent-user 模拟环境（BM25 + grep，judge GPT-5.4 Mini medium）、Terminal-Bench v2.1=Terminus 2（E2B sandbox）；SciCode/AA-LCR 等为 API 直评 + judge 流程；agentic benchmark 主要 sandbox provider 为 e2b",
      license_and_access_notes: [
        "网站 Terms of Use 对访问授予可撤销、非转让、非独占、有限的个人非商业使用许可（aa-terms 快照）；权利主体为 Artificial Analysis, Inc.",
        "条款禁止商业利用网站或其展示内容，禁止复制、分发、下载、自动化查询与 strip/scrape/mine 数据（公共搜索引擎在条款规定范围内的例外除外）；公开页面不构成批量抓取、再发布或建立竞品服务的开放数据许可",
        "本 fixture 为官方页面事实的结构化转写（非页面全文/HTML——ToS 禁止复制与再分发页面内容），采集时点 2026-09-08T06:33Z，逐项事实可溯源至 sources[] 登记的官方 URL；刷新需人工访问官方页面或取得 API 授权",
        `Data API 需 ${apiDocs.auth.split("；")[0]}；Free/Pro/Commercial tier 数据范围与 24 小时限速（100/500/自定义）不同，无相应 tier 返回 403；归因要求：${apiDocs.attribution}`,
        "客户产品、报告与数据 feed 的再分发权需经 Commercial package 单独协商；取得明确商业授权前，本批数据仅作内部研究证据，不主张外部再分发权",
        "待办：Artificial Analysis 属 ToS 受限来源，自动化访问/商业使用的授权申请尚未提交（本批只做快照导入）；授权结果决定后续能否自动化刷新与再分发",
      ],
    },
    task_set: {
      description: taskSetDescription,
      n_tasks: totalTasks,
      n_repositories: 0,
      languages: [],
      domains: domainEntries,
    },
    records,
    sources,
    unresolved_facts: [
      {
        fact: "主页 Intelligence 图表显示 29 of 624 models、指数详情页显示 30 of 612 models：同一采集时点两个官方视图的覆盖分子/分母不同，官方未解释两视图的筛选、分页或更新时间差异",
        reason: "页面为动态数据且覆盖筛选规则未公布；本批按快照差异同时保存两个视图，不合并、不取一",
        how_to_resolve: "向官方确认两视图口径，或经授权 API 获取稳定模型全集后再统一覆盖口径",
      },
      {
        fact: "九个组成评测从原始分数到 0-100 Index 贡献的完整统一归一化公式未公开（仅 GDPval-AA v2 的 clamp((Elo - 500) / 2000) 归一化方式公开）",
        reason: "官方方法页只公布权重与各评测原始评分方法；其余归一化、截断与合成细节不得自行假设",
        how_to_resolve: "等待官方在方法页公布完整合成公式",
      },
      {
        fact: "API 的 intelligence_index_version 字段只有 major.minor（4.1），不反映 patch：仅凭 API 无法识别 v4.1.1，且 patch 升级可能因 grader/数据集版本改变分数",
        reason: "官方 API 文档明示该字段口径；网页/方法页显示的完整版本 v4.1.1 必须另行保存（本批已保存）",
        how_to_resolve: "使用 API 时同时保留网页版本号；或向官方确认 API 后续是否携带 patch",
      },
      {
        fact: "本批快照未含逐模型/逐配置的 Index 分数与组成评测分数（逐模型组成分数为 null：未取得 API tier 授权，本批只做快照导入）",
        reason: "网站条款限制自动化查询；模型级详情需要相应 API tier（Pro/Commercial）与 API key，Free tier 仅提供 headline indices",
        how_to_resolve: "取得相应 API tier 授权后，按官方模型条目字段（name/slug/release_date/reasoning_model/context_window_tokens/model_creator 等）导入逐模型分数",
      },
      {
        fact: "逐模型、逐子评测的置信区间、样本方差、seed 与完整重复轨迹未公开；官方仅估计整个 Index 在超过 10 次重复时 95% CI 小于 ±1%，单个评测 CI 可能更宽",
        reason: "官方页面未提供逐项统计明细；±1% 是 Index 级估计，不得自动套用到每个模型或子评测",
        how_to_resolve: "需要官方逐项统计发布或相应 API tier 数据",
      },
      {
        fact: "主页活动流日期（Methodology updated · 20 Aug、27 Aug 等）不显示年份，页面无统一的数据最后更新时间字段",
        reason: "活动流日期无法构成精确发布时间；不能把活动流日期当作指数数据的精确发布日期",
        how_to_resolve: "以采集时点为快照基准；如需精确发布时间需官方确认",
      },
      {
        fact: "评测模型的完整 endpoint、Provider、实际部署版本、全部模型的 reasoning effort 与 fallback 细节未在公开页面披露",
        reason: "需要相应 API tier 或官方模型详情核对；不得从主页图表补猜",
        how_to_resolve: "经授权 API 按模型条目字段核对",
      },
      {
        fact: "九个评测的完整任务提示、system prompt、工具 schema、调用参数与执行 trace 未证明可公开重跑（官方维护内部数据集副本，agentic 文件环境与完整 prompt/trace 不等于公开可本地重跑的 harness）",
        reason: "公开方法只披露部分 prompt 模板、工具与 judge；未获相同版本/endpoint/任务与 judge 配置时不得声称复现官方分数",
        how_to_resolve: "等待官方公开完整评测资产或提供授权访问",
      },
    ],
  };
}

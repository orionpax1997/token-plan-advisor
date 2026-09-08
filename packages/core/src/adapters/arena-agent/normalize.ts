import type { BenchmarkCollection, BenchmarkRecord, BenchmarkSourceRef } from "../../schema/benchmark.ts";
import type { BenchmarkSnapshot } from "../_shared.ts";
import {
  parseAgentModeHelp,
  parseCategoriesCost,
  parseLeaderboard,
  parseMethodology,
  parsePrivacy,
  parseTerms,
  type AgentModeHelpSnapshot,
  type CategoriesCostSnapshot,
  type LeaderboardRow,
  type LeaderboardSnapshot,
  type MethodologySnapshot,
  type TermsSnapshot,
} from "./parse.ts";
import { SRC } from "./sources.ts";

// ---------------------------------------------------------------------------
// 条件与禁止推断文案：来源为随包 fixture 的官方转写快照与 research/15-02（本批事实基准）。
// Arena 服务条款禁止程序化/自动化抓取；fixture 为页面公开字段的结构化快照。
// 条件对整份 leaderboard 一致，逐记录携带以保证记录自足、可独立导出。
// ---------------------------------------------------------------------------

/** 任务集描述：来自 methodology + agent-mode-help 与 leaderboard.scope.task_kinds_observed。 */
function buildTaskSetDescription(
  methodology: MethodologySnapshot,
  help: AgentModeHelpSnapshot,
  totalSessions: number,
  totalModels: number,
  pageUpdatedDisplay: string,
): string {
  const taskKinds = help.key_facts.task_kinds_observed.join("、");
  return (
    `Arena Agent leaderboard 官方页面 ${pageUpdatedDisplay} 显示的公开字段快照（${totalSessions} sessions、` +
    `${totalModels} models）。评测对象是 Agent orchestrator（${methodology.key_facts.evaluation_target}），` +
    `任务类型为真实用户 Agent 会话：${taskKinds}。` +
    `本页不是固定题集、没有固定 prompt/重复次数/seed，` +
    `不与固定编码/Coding Plan benchmark 同口径可比`
  );
}

/**
 * 全部记录共享的禁止推断前缀（research/15-02 §10 + ticket 04 要求）。
 * 数字（session 数、模型数、页面更新时间）从 fixture 插值，避免快照刷新后文案失真。
 */
function buildSharedProhibitedInferences(
  leaderboard: LeaderboardSnapshot,
  methodology: MethodologySnapshot,
): string[] {
  const totalSessions = leaderboard.page_meta.total_sessions_value;
  const totalModels = leaderboard.page_meta.total_models_value;
  const pageUpdated = leaderboard.page_meta.page_updated_display;
  return [
    "不得把 Arena Agent leaderboard 排名直接当作 Coding Plan 排名、套餐性价比排名或购买建议",
    `不得从模型分数推断某个 Coding Plan 是否包含该模型、是否在用户所在地区可用、是否有相同上下文/工具/system prompt、是否允许商用或是否有同一额度`,
    "不得把 Net Improvement 当作绝对成功率、单元/集成测试通过率、SWE issue resolution rate 或仓库级重构成功率",
    `不得跨不同日期/快照直接比较绝对 Net Improvement：时间衰减与新增模型会改变 baseline（${pageUpdated} 页面快照，${totalSessions} sessions、${totalModels} models）`,
    "不得把 Overall 排名解释为 coding-only 排名（任务是软件工程/研究/规划/文档/网页开发/文件分析的混合）",
    "不得把不同模型、工具、system prompt、上下文与 harness 的组合结果拆成纯模型分数，与其他 benchmark 横比",
    "不得把 Tool Hallucination / Bash Recovery 等指标强行同向解释——这些是 lower_is_better，发生率低好；不得把所有列都当同一种概率",
    "不得在未获得 Arena 明确许可时批量抓取网页、再发布原始数据、把数据嵌入商业产品或建立竞品服务（Terms 禁止自动化抓取与商业使用聚合数据；授权申请为待办）",
    "不得把 Arena Agent 的 P50 cost/task、output tokens/task 与 Plan 价格、额度或用户真实成本混算——这是真实任务工作流的 P50 统计，不是 headline correctness",
    "不得基于 Arena Agent 推断固定 API model id、模型 snapshot 或特定 Vendor 与 Coding Plan 的对应关系",
    "本批快照没有固定 task set、prompt、重复次数——这些限制进入 conditions 与 Unresolved Fact，不得用其他来源数据反推",
    "不得把真实用户任务、用户反馈、任务混合、模型版本漂移与隐私不可审计偏差当数据缺陷修复——它们是 Arena Agent 的固有限制",
  ];
}

/** Net Improvement 记录的归一化说明：identity（官方原值）+ Net Improvement 是 treatment effect 不是绝对成功率。 */
const NET_IMPROVEMENT_NORMALIZATION_TEMPLATE = (pageUpdated: string): string =>
  `identity：normalized_metric 直接采用官方 leaderboard 公开的 Net Improvement 数值（higher_is_better，95% CI），` +
  `metric_space 限定为同一 Arena Agent leaderboard 页面快照（${pageUpdated}）内的 agent_orchestrator_treatment_effect 指标空间；` +
  `Net Improvement 是相对随机化平均 baseline 的 treatment effect，不是绝对成功率；` +
  `总体值（Net Improvement）是 Confirmed Success、Praise/Complaint、Steerability、Bash Recovery、Tool Hallucination 五类信号的等权聚合，` +
  `不能跨不同日期或不同 baseline 直接比较`;

// ---------------------------------------------------------------------------
// 记录装配
// ---------------------------------------------------------------------------

/** Arena 记录共享的快照环境。 */
interface SnapshotContext {
  /** 快照落盘时间（fixture manifest captured_at）。 */
  capturedAt: string;
  /** 官方页面显示的更新时间（页面自述；非精确发布时分秒）。 */
  pageUpdatedDisplay: string;
  totalSessions: number;
  totalModels: number;
  leaderboardUrl: string;
  taskSetDescription: string;
}

/**
 * 计数口径：分母=官方页面公布的总 sessions；分子=本模型行 sessions。
 * 注意 share_of_sessions 是 ratio，不是整数——不能直接当 denominator；
 * 用整数计数口径（sessions / total_sessions）才能落进 schema 的
 * numerator_and_denominator 非负整数约束。
 */
function sessionCountFraction(row: LeaderboardRow, totalSessions: number) {
  return { numerator: row.sessions, denominator: totalSessions };
}

function sourceSnapshot(ctx: SnapshotContext, artifactLocator: string): BenchmarkRecord["source_snapshot"] {
  return {
    source_ids: [SRC.leaderboard, SRC.methodology],
    artifact: artifactLocator,
    revision: `page_updated=${ctx.pageUpdatedDisplay}, sessions=${ctx.totalSessions}, models=${ctx.totalModels}, captured_at=${ctx.capturedAt}`,
    url: ctx.leaderboardUrl,
    captured_at: ctx.capturedAt,
  };
}

function baseConditions(row: LeaderboardRow, taskSetDescription: string): BenchmarkRecord["conditions"] {
  return {
    task_set_description: taskSetDescription,
    // 真实用户 session + 随机分流；无固定 prompt
    prompt_policy:
      "Arena Agent Mode 通过随机分流将 session 分配给一个模型；每 session 可包含多个 task、长时间多轮交互和上下文 carry-over；没有固定 prompt、重复次数、seed 或统一公开的上下文窗口",
    tool_environment:
      "Agent Mode 提供 bash/sandbox、web search、file read/write、file upload 工具；system prompt 模板与工具 schema/版本未公开；评测对象是 Agent orchestrator（决定何时、如何调用工具的主模型）",
    // 上下文窗口未公开
    context_limit_or_context_description: {
      value: null,
      status: "unobtainable",
      note: "Arena Agent 没有固定题集/统一公开的上下文窗口；session 上下文受工具与 carry-over 影响",
      source_ids: [],
    },
    success_definition:
      "Net Improvement = 相对随机化平均 baseline 的 treatment effect（不是绝对成功率），总体值是 Confirmed Success、Praise/Complaint、Steerability、Bash Recovery、Tool Hallucination 五类信号的等权聚合；Confirmed Success = 用户对 task 轨迹 approve/disapprove；Praise/Complaint = task 内表扬是否多于抱怨；Steerability = 用户纠正后模型是否有效修正；Bash Recovery = bash 失败后恢复到成功命令的行为（重试少好）；Tool Hallucination = 调用不存在工具或向工具字段泄漏无效内容（发生率低好）",
    // 真实用户 session，不存在 n_trials / 重复次数概念
    repeat_count: {
      value: null,
      status: "not_applicable",
      note: "Arena Agent 是真实用户工作流，没有重复次数/seed；session 数是分母口径",
      source_ids: [],
    },
    cost_and_token_metadata: {
      cost_basis: {
        value: null,
        status: "not_applicable",
        note: "Arena Agent 的 p50_cost_per_task_usd 是真实任务工作流的 P50 统计，不进 headline correctness；价格字段是 page-level 模型 price_per_million_input/output USD，与套餐价格口径不可直接换算",
        source_ids: [],
      },
    },
  };
}

function subjectIdentity(row: LeaderboardRow): BenchmarkRecord["subject_identity"] {
  return {
    subject_kind: "model_configuration",
    model_display_name: row.model,
    // 官方未声明为不可变 API ID / snapshot，全部保持未知
    model_api_id_or_snapshot: {
      value: null,
      status: "unobtainable",
      note: "Arena Agent 官方未声明 model 标签为不可变 API model id / snapshot；不以展示名或分数反推",
      source_ids: [],
    },
    vendor: {
      value: row.vendor,
      status: "verified",
      source_ids: [SRC.leaderboard],
    },
    agent_or_harness: "Arena Agent Mode（orchestrator K=1；评测对象为 Agent orchestrator，非裸模型）",
    reasoning_effort_or_configuration: {
      value: null,
      status: "not_applicable",
      note: "Arena Agent 不公开 reasoning effort / 模型配置；orchestrator 配置为 K=1",
      source_ids: [],
    },
  };
}

interface SignalSpec {
  /** fixture signals_definition.name 精确匹配。 */
  name: string;
  /** record_id 段。 */
  slug: string;
  /** capability 标签（探索 02 Answer 注册表的 Arena 行）。 */
  capability: BenchmarkRecord["capability"];
  /** 指标原始方向（higher_is_better / lower_is_better），不统一换算方向。 */
  direction: "higher_is_better" | "lower_is_better";
  /** 失败值/解释；用于在禁止推断文案中显式标注原始方向。 */
  directionNote: string;
  /** 当前记录在 row 中读取的字段名。 */
  rowField: keyof LeaderboardRow;
}

/**
 * 五个组件信号（Confirmed Success、Praise/Complaint、Steerability、Bash Recovery、
 * Tool Hallucination）的方向差异显式保存——Bash Recovery 与 Tool Hallucination
 * 是 lower_is_better，发生率低好；其余三者 higher_is_better。记录不做方向统一
 * 归一化到同一尺度。
 */
const SIGNAL_SPECS: SignalSpec[] = [
  {
    name: "confirmed_success",
    slug: "confirmed_success",
    capability: ["observed_workflow_reliability"],
    direction: "higher_is_better",
    directionNote: "用户对 task 轨迹 approve/disapprove",
    rowField: "confirmed_success",
  },
  {
    name: "praise_vs_complaint",
    slug: "praise_vs_complaint",
    capability: ["observed_workflow_reliability"],
    direction: "higher_is_better",
    directionNote: "task 内表扬是否多于抱怨",
    rowField: "praise_vs_complaint",
  },
  {
    name: "steerability",
    slug: "steerability",
    capability: ["observed_workflow_reliability"],
    direction: "higher_is_better",
    directionNote: "用户纠正后模型是否有效修正",
    rowField: "steerability",
  },
  {
    name: "bash_recovery",
    slug: "bash_recovery",
    capability: ["observed_workflow_reliability"],
    direction: "lower_is_better",
    directionNote: "bash 失败后成功恢复行为的累计发生率——重试少好（lower_is_better）",
    rowField: "bash_recovery",
  },
  {
    name: "tool_hallucination",
    slug: "tool_hallucination",
    capability: ["observed_workflow_reliability"],
    direction: "lower_is_better",
    directionNote: "调用不存在工具或向工具字段泄漏无效内容的累计发生率——发生率低好（lower_is_better）",
    rowField: "tool_hallucination",
  },
];

function buildNetImprovementRecord(
  row: LeaderboardRow,
  sharedProhibitions: string[],
  ctx: SnapshotContext,
): BenchmarkRecord {
  return {
    record_id: `arena-agent:leaderboard:${row.rank}:${slugify(row.model)}:net_improvement`,
    capability: ["agent_tool_orchestration"],
    raw_metric: {
      metric_name: "net_improvement",
      metric_value: row.net_improvement,
      metric_unit: "ratio",
      metric_direction: "higher_is_better",
      numerator_and_denominator: {
        // 计数口径：本模型 sessions / 页面公布总 sessions
        value: sessionCountFraction(row, ctx.totalSessions),
        status: "verified",
        source_ids: [SRC.leaderboard],
      },
      confidence_interval_or_error: {
        value: {
          ci_low: row.net_improvement_ci_lo,
          ci_high: row.net_improvement_ci_hi,
          // 半宽从两端点推导；CI 公式官方未公开
          half_width: (row.net_improvement_ci_hi - row.net_improvement_ci_lo) / 2,
          method: "页面公开 95% 置信区间（计算公式未公开）",
        },
        status: "verified",
        source_ids: [SRC.leaderboard],
      },
      note: "Net Improvement 是相对随机化平均 baseline 的 treatment effect，不是绝对成功率；总体值是 Confirmed Success、Praise/Complaint、Steerability、Bash Recovery、Tool Hallucination 五类信号的等权聚合",
    },
    normalized_metric: {
      value: row.net_improvement,
      metric_space: `arena-agent:${ctx.pageUpdatedDisplay}:net_improvement`,
    },
    normalization_method: NET_IMPROVEMENT_NORMALIZATION_TEMPLATE(ctx.pageUpdatedDisplay),
    source_snapshot: sourceSnapshot(
      ctx,
      `leaderboard.json#rows[rank=${row.rank}].net_improvement`,
    ),
    subject_identity: subjectIdentity(row),
    conditions: baseConditions(row, ctx.taskSetDescription),
    confidence_status: "confidence_interval_reported",
    evidence_level: "A",
    comparability_class: "reference_only",
    allowed_use: "explanation",
    prohibited_inferences: [
      ...sharedProhibitions,
      "Net Improvement 与 Confirmed Success、Praise/Complaint、Steerability、Bash Recovery、Tool Hallucination 五类信号的等权聚合——不得把 Net Improvement 等同于任一单类信号",
    ],
  };
}

function buildSignalRecord(
  row: LeaderboardRow,
  spec: SignalSpec,
  sharedProhibitions: string[],
  ctx: SnapshotContext,
): BenchmarkRecord {
  const value = row[spec.rowField];
  if (typeof value !== "number") {
    throw new Error(`signal ${spec.name} 缺少数值字段：${row.model}`);
  }
  return {
    record_id: `arena-agent:leaderboard:${row.rank}:${slugify(row.model)}:${spec.slug}`,
    capability: spec.capability,
    raw_metric: {
      metric_name: spec.name,
      metric_value: value,
      metric_unit: "ratio",
      // 不统一换算方向：原始方向保留
      metric_direction: spec.direction,
      // 计数口径：本模型 sessions / 页面公布总 sessions
      numerator_and_denominator: {
        value: sessionCountFraction(row, ctx.totalSessions),
        status: "verified",
        source_ids: [SRC.leaderboard],
      },
      // 页面只公开 Net Improvement 的 CI；单类信号无独立 CI
      confidence_interval_or_error: {
        value: null,
        status: "unobtainable",
        note: "官方页面只对 Net Improvement 公开 95% CI；五类组件信号未单独公开 CI（计算公式亦未公开）",
        source_ids: [],
      },
      note: spec.directionNote,
    },
    // 组件信号 metric_space 命名包含方向差异标识（higher/lower），
    // 强制下游区分方向、不得把所有列当同一种概率。
    normalized_metric: {
      value,
      metric_space: `arena-agent:${ctx.pageUpdatedDisplay}:observed_signal_${spec.direction === "higher_is_better" ? "higher" : "lower"}:${spec.name}`,
    },
    normalization_method:
      `identity：normalized_metric 直接采用官方 leaderboard 公开的 ${spec.name} 数值；` +
      `原始方向 ${spec.direction} 原样保留，不做方向统一或归一化到同一尺度；` +
      `metric_space 限定为同一 Arena Agent leaderboard 页面快照内的 ${spec.direction === "higher_is_better" ? "higher_is_better" : "lower_is_better"} 信号指标空间`,
    source_snapshot: sourceSnapshot(
      ctx,
      `leaderboard.json#rows[rank=${row.rank}].${spec.rowField}`,
    ),
    subject_identity: subjectIdentity(row),
    conditions: baseConditions(row, ctx.taskSetDescription),
    confidence_status: "point_estimate_only",
    evidence_level: "A",
    comparability_class: "reference_only",
    allowed_use: "explanation",
    prohibited_inferences: [
      ...sharedProhibitions,
      `不得把 ${spec.name}（${spec.direction}）与其他 ${spec.direction === "higher_is_better" ? "lower_is_better" : "higher_is_better"} 信号同向解释或强行平均——方向差异显式保留`,
    ],
  };
}

function buildResourceRecord(
  row: LeaderboardRow,
  sharedProhibitions: string[],
  ctx: SnapshotContext,
  costTokenDefinition: string,
  pricingFieldDefinition: string,
): BenchmarkRecord {
  return {
    record_id: `arena-agent:leaderboard:${row.rank}:${slugify(row.model)}:resource_usage`,
    capability: ["benchmark_resource_usage"],
    raw_metric: {
      metric_name: "p50_cost_and_output_tokens_per_task",
      metric_unit: "USD per task + tokens per task",
      metric_direction: "descriptive_only",
      // cost/token + price 双口径：p50 工作流 + page-level price
      aggregates: {
        p50_cost_per_task_usd: row.p50_cost_per_task_usd,
        p50_output_tokens_per_task: row.p50_output_tokens_per_task,
        price_per_million_input_usd: row.price_per_million_input_usd,
        price_per_million_output_usd: row.price_per_million_output_usd,
      },
      numerator_and_denominator: {
        // p50 cost/token 是平台统计连续量，不是 head-to-head 计数
        value: null,
        status: "not_applicable",
        note: "p50 cost/output tokens 是真实任务工作流的 P50 统计（连续量），不是 head-to-head 计数；不适用 sessions/total_sessions 分子分母口径",
        source_ids: [],
      },
      confidence_interval_or_error: {
        value: null,
        status: "unobtainable",
        note: "官方未公开 P50 工作流统计的方差/CI；page-level price 字段无 CI 概念",
        source_ids: [],
      },
      note: `${costTokenDefinition}；${pricingFieldDefinition}`,
    },
    normalized_metric: null,
    normalization_method:
      "none：cost/token/price 保留官方原值（raw_metric.aggregates）；不做来源内归一化，不与 Plan 价格额度混算；page-level price 字段与套餐价格口径不可直接换算",
    source_snapshot: sourceSnapshot(
      ctx,
      `leaderboard.json#rows[rank=${row.rank}]#resource_usage`,
    ),
    subject_identity: subjectIdentity(row),
    conditions: baseConditions(row, ctx.taskSetDescription),
    confidence_status: "point_estimate_only",
    evidence_level: "A",
    comparability_class: "reference_only",
    allowed_use: "explanation",
    prohibited_inferences: [
      ...sharedProhibitions,
      "不得把 p50_cost_per_task_usd / p50_output_tokens_per_task 与 Plan 价格、额度或用户真实成本混算",
      "不得把 price_per_million_input/output USD 字段当 Coding Plan 套餐价格——口径不同",
    ],
  };
}

// ---------------------------------------------------------------------------
// 采集文档装配
// ---------------------------------------------------------------------------

const SOURCE_NOTE_NO_STATED_TIME = "来源页面未显示精确更新时间，以采集时间为准";

function slugify(model: string): string {
  // 用于 record_id 段：保留 ASCII 字母数字与连字符，把其他字符替换为 -
  return model
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeFromSnapshots(
  snapshots: BenchmarkSnapshot[],
  collectedAt: string,
  toolVersion: string,
): BenchmarkCollection {
  const byId = new Map(snapshots.map((s) => [s.source_id, s]));
  const leaderboardSnapshot = byId.get(SRC.leaderboard);
  const methodologySnapshot = byId.get(SRC.methodology);
  const helpSnapshot = byId.get(SRC.agentModeHelp);
  const categoriesSnapshot = byId.get(SRC.categoriesCost);
  const termsSnapshot = byId.get(SRC.terms);
  const privacySnapshot = byId.get(SRC.privacy);
  if (
    !leaderboardSnapshot ||
    !methodologySnapshot ||
    !helpSnapshot ||
    !categoriesSnapshot ||
    !termsSnapshot ||
    !privacySnapshot
  ) {
    throw new Error(
      "Arena Agent 快照不完整：需要 leaderboard/methodology/agent-mode-help/categories-cost/terms/privacy",
    );
  }

  const leaderboard = parseLeaderboard(leaderboardSnapshot.body);
  const methodology = parseMethodology(methodologySnapshot.body);
  const help = parseAgentModeHelp(helpSnapshot.body);
  const categories = parseCategoriesCost(categoriesSnapshot.body);
  const terms = parseTerms(termsSnapshot.body);
  parsePrivacy(privacySnapshot.body); // 形状校验

  // cost/token + price 双口径说明（categories fixture 原文；进 resource 记录 note，保证记录自足）
  const costTokenDefinition = categories.key_facts.cost_metric_definition;
  const pricingFieldDefinition = categories.key_facts.pricing_data_field;

  const capturedAt = leaderboardSnapshot.captured_at;
  const pageUpdated = leaderboard.page_meta.page_updated_display;
  const totalSessions = leaderboard.page_meta.total_sessions_value;
  const totalModels = leaderboard.page_meta.total_models_value;
  const ctx: SnapshotContext = {
    capturedAt,
    pageUpdatedDisplay: pageUpdated,
    totalSessions,
    totalModels,
    leaderboardUrl: leaderboardSnapshot.url,
    taskSetDescription: buildTaskSetDescription(
      methodology,
      help,
      totalSessions,
      totalModels,
      pageUpdated,
    ),
  };

  const sharedProhibitions = buildSharedProhibitedInferences(leaderboard, methodology);

  const records: BenchmarkRecord[] = [];
  for (const row of leaderboard.rows) {
    records.push(buildNetImprovementRecord(row, sharedProhibitions, ctx));
    for (const spec of SIGNAL_SPECS) {
      records.push(buildSignalRecord(row, spec, sharedProhibitions, ctx));
    }
    records.push(buildResourceRecord(row, sharedProhibitions, ctx, costTokenDefinition, pricingFieldDefinition));
  }

  const sources: BenchmarkSourceRef[] = snapshots.map((snapshot) => {
    const note =
      snapshot.source_id === SRC.leaderboard
        ? `页面显示更新时间 ${pageUpdated}；本采集时点 ${capturedAt}`
        : SOURCE_NOTE_NO_STATED_TIME;
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      kind: snapshot.kind,
      fetched_at: capturedAt,
      // leaderboard 页面自述更新时间；其他来源页面无统一更新时间字段
      last_updated_at: snapshot.source_id === SRC.leaderboard ? pageUpdated : null,
      last_updated_note: note,
    };
  });

  const taskKinds = help.key_facts.task_kinds_observed.join("、");
  return {
    schema_version: "1",
    collection: {
      adapter_id: "arena-agent",
      mode: "fixture",
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    benchmark: {
      benchmark_id: "arena-agent",
      benchmark_version: pageUpdated,
      // baseline 漂移与快照时间写入 revision：跨日期不可直接比较
      leaderboard_or_dataset_revision:
        `page_updated=${pageUpdated}, sessions=${totalSessions}, models=${totalModels}, ` +
        `baseline_treatment_effect=true, baseline_drift=true, no_fixed_task_set=true, no_fixed_prompt=true, ` +
        `captured_at=${capturedAt}`,
      maintainer: "Arena Intelligence, Inc. d/b/a Arena",
      source_url: leaderboardSnapshot.url,
      // 页面自述更新时间为日期粒度，不是 ISO 时刻
      artifact_generated_at: null,
      harness: "Arena Agent Mode（orchestrator K=1；评测对象为 Agent orchestrator，非裸模型）",
      license_and_access_notes: [
        `服务条款权利主体：${terms.rights_holder}`,
        `条款许可：${terms.license_grant}`,
        `条款禁止：${terms.prohibitions.join("；")}`,
        `数据来源：${terms.data_origin}；robots.txt 明确禁止自动化抓取（${terms.robots_txt}）`,
        "本 fixture 为官方页面公开字段的结构化快照（非页面 HTML 全文），采集时点 2026-09-08T07:00Z，逐项事实可溯源至 sources[] 登记的官方 URL；刷新需人工访问官方页面或取得 Arena 明确许可",
        "API 与第三方数据 feed 未公开；如需自动化访问，需先取得 Arena 明确书面许可（授权申请为待办）",
        "本批数据仅作内部研究证据（reference_only / explanation）；不主张外部再分发权或商业使用许可",
        `适用范围：${categories.scope_limits}`,
        "comparability_scope：混合任务（软件工程/研究/规划/文档/网页开发/文件分析），仅在同快照 + 同类别条件下可比；不与 Coding-only 排名或其他静态题集 benchmark 横比",
      ],
    },
    task_set: {
      // task set 不是固定题集——没有 n_tasks；记录任务类型分布与 session 数。
      description:
        `Arena Agent leaderboard 任务类型：${taskKinds}（${help.scope_limits}）。` +
        `本页不是固定题集、没有固定 prompt/重复次数/seed；session 总数 ${totalSessions}、模型数 ${totalModels}，` +
        `页面显示更新时间 ${pageUpdated}。无 n_tasks 概念——记录任务类型分布与 session/model 计数。`,
      n_tasks: 0,
      n_repositories: 0,
      languages: [],
    },
    records,
    sources,
    unresolved_facts: [
      {
        fact: "Arena Agent 没有固定任务集、没有固定 prompt、没有公开的重复次数/seed——官方未公布 prompt bundle、system prompt、工具 schema/版本与完整可重跑 harness",
        reason: "Arena Agent 是真实用户工作流；服务条款禁止自动化抓取，公开方法论未给出可本地复现的运行配置",
        how_to_resolve: "取得 Arena 明确许可后向官方确认可公开重跑的最小数据集与工具/上下文规范",
      },
      {
        fact: "Net Improvement 的 95% CI 计算公式与抽样单位未公开；五类组件信号未单独公开 CI 与方差/seed",
        reason: "官方页面只对 Net Improvement 公开 95% CI 区间端点（未给方法），其余五类组件信号无独立 CI",
        how_to_resolve: "等待官方公布 CI 公式与逐信号抽样口径；在此之前不得用 CI 端点反推样本量或重复次数",
      },
      {
        fact: `Net Improvement 是相对随机化平均 baseline 的 treatment effect；跨不同日期快照不能直接比较绝对值（baseline 随时间衰减与新增模型漂移）`,
        reason: `官方方法论明示 Net Improvement 不是绝对成功率、跨日不可比；本批快照为页面 ${pageUpdated} 显示`,
        how_to_resolve: "只比较同快照内的相对表现并查看 95% CI；跨日比较需重新采集并对齐 baseline",
      },
      {
        fact: "官方未公开模型 API id、snapshot、reasoning effort、system prompt 与 vendor 字段以外的可识别信息",
        reason: "Arena 公开字段仅 model 标签、vendor、session 数；vendor 字段采用官方值但无独立开放许可证可机器核对",
        how_to_resolve: "不得以展示名或结果反推 API ID；如需建立模型→Coding Plan 映射，需先取得 Arena 许可并核对官方模型清单",
      },
      {
        fact: "p50_cost_per_task_usd / p50_output_tokens_per_task 与 price_per_million_input/output 的口径不同：P50 是真实任务工作流统计、price 是 page-level USD/M token",
        reason: "官方方法论明确成本/token 是 P50 统计而非 headline correctness；price 字段未与套餐价格口径对接",
        how_to_resolve: "不得与 Plan 价格、额度或用户真实成本直接换算；如需成本对比应分别说明口径",
      },
      {
        fact: "数据可能来自真实用户内容（隐私政策：汇总/去标识化/用于评估与产品改进）；真实用户任务、用户反馈、任务混合、模型版本漂移与隐私不可审计是主要偏差来源",
        reason: "隐私政策原文；不得当作数据缺陷修复——这是 Arena Agent 的固有限制",
        how_to_resolve: "下游使用应承认偏差来源并避免把相对排名解释为绝对能力",
      },
      {
        fact: "Agent Mode 通过随机分流将 session 分配给一个模型；任务类型为软件工程/研究/规划/文档/网页开发/文件分析的混合，不解释为 coding-only 排名",
        reason: "Overall 是混合任务分布；细分任务域结果不在本批快照导入范围",
        how_to_resolve: "如需 coding-only 视角，应取得 Arena 明确许可后访问细分任务域结果或采用其他 coding benchmark 互为补充",
      },
    ],
  };
}

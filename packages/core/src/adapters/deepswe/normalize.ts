import type { BenchmarkCollection, BenchmarkRecord, BenchmarkSourceRef } from "../../schema/benchmark.ts";
import type { BenchmarkSnapshot } from "../_shared.ts";
import {
  parseLeaderboard,
  parseRelease,
  parseTasks,
  type LeaderboardRow,
} from "./parse.ts";
import { SRC } from "./sources.ts";

// ---------------------------------------------------------------------------
// 条件与禁止推断文案：来源为随包 fixture 的官方原文与 research/15-01（本批事实基准）。
// 这些条件对整份 v1.1 leaderboard 快照一致，逐记录携带以保证记录自足、可独立导出。
// ---------------------------------------------------------------------------

const TASK_SET_DESCRIPTION_PREFIX = "DeepSWE v1.1：官方 tasks artifact 列出";
const TASK_SET_DESCRIPTION_SUFFIX =
  "个活跃开源仓库（语言分布见 task_set.languages）；Harbor 任务格式（task.toml + instruction.md + environment + 测试/评分配置），每任务固定 base commit 与独立环境。";

const PROMPT_POLICY =
  "每任务自带 instruction.md 提示词；参考 patch 不用于 grading 且 agent 应不可见；harness 侧 system prompt 模板未随 leaderboard artifact 公布。";

const TOOL_ENVIRONMENT =
  "mini-swe-agent（Pier + Modal 执行编排，官方 scope：imported Pier jobs）；示例任务 agent 与 verifier 容器均 no-network、无 MCP server；示例资源上限 2 CPU / 8192 MB 内存 / 20480 MB 存储，agent timeout 10800 秒、verifier timeout 1800 秒（逐任务可能不同）。";

const SUCCESS_DEFINITION =
  "官方 grader 将测试节点分为 f2p/p2p：存在 f2p、全部 f2p 通过且无 p2p 失败则 reward=1；缺失结果与 skipped 不算通过，重复节点 worst-status-wins。官方 unit 原文：\"pass@1 is attempt pass rate over scored rollout attempts. pass@4 is tasks with at least one passing rollout divided by tasks attempted. Context-window failures and agent timeouts are scored failures; provider/verifier/network errors are excluded.\"";

const RESOURCE_UNIT =
  "混合单位：cost=USD/评分 attempt，tokens=token/评分 attempt，steps=步/评分 attempt，duration=秒/评分 attempt（官方：Efficiency aggregates are over every scored attempt）";

const PASS_PROHIBITED_INFERENCE_PREFIX = [
  "不得把 Pass@1/Pass@4 当作任意 Coding Plan 用户成功率或套餐质量分数",
  "不得据此推断套餐价格、配额、SLA、延迟、并发或编辑器体验",
  "不得把 mini-swe-agent（Pier + Modal）结果当裸模型结果",
  "不得把 v1 与 v1.1 拼接为同口径时间序列（评分、verifier 与提交条件不同）",
  "不得把同一模型不同 reasoning effort 的结果无权重平均成模型分数",
  "不得以模型展示名或结果反推未公开的 API model id、snapshot 或 Vendor",
];

const RESOURCE_PROHIBITED_INFERENCE_PREFIX = [
  "不得把 cost/token/steps/duration 当质量分数或能力分数",
  "不得把 cost/token/steps/duration 与 Plan 价格、额度或用户真实成本混算",
  "不得跨配置或跨来源比较成本（70 个配置中仅 5 个给出官方 cost_basis 价格口径）",
  "不得把 mini-swe-agent 的资源消耗当任意 Plan 的用户边际成本",
];

const PASS_NORMALIZATION_PREFIX =
  "identity：normalized_metric 直接采用官方 leaderboard-live.json 数值，metric_space 限定为同一 DeepSWE release（v1.1）的";

const PASS_NORMALIZATION_SUFFIX =
  "指标空间；仅同 release + 同 harness + 同 reasoning effort 的配置可直接比较，不跨指标、不跨 release、不跨来源换算。";

const RESOURCE_NORMALIZATION_METHOD =
  "none：cost/token/steps/duration 保留官方聚合原值（raw_metric.aggregates，Efficiency aggregates are over every scored attempt）；各配置价格口径不全公开，不做来源内归一化，不与 Plan 价格额度混算。";

/**
 * 资源聚合字段（官方字段名原样保留，逐行透传）：
 * 前 13 个在 70 行 leaderboard 中均有；后 10 个仅部分配置携带（在场即透传，
 * 缺失则省略键——官方未发布该口径，不用其他字段补齐）。
 */
const AGGREGATE_KEYS = [
  "mean_cost_usd",
  "median_cost_usd",
  "mean_input_tokens",
  "median_input_tokens",
  "mean_output_tokens",
  "median_output_tokens",
  "mean_cache_tokens",
  "mean_duration_seconds",
  "median_duration_seconds",
  "mean_agent_steps",
  "median_agent_steps",
  "median_peak_context_tokens",
  "median_output_tokens_to_pass",
  "mean_uncached_input_tokens",
  "median_uncached_input_tokens",
  "mean_cache_read_tokens",
  "median_cache_read_tokens",
  "mean_cache_write_tokens",
  "median_cache_write_tokens",
  "mean_compute_units",
  "median_compute_units",
  "mean_reasoning_tokens",
  "median_reasoning_tokens",
] as const;

const SOURCE_NOTE_NO_STATED_TIME = "来源页面未显示更新时间，以采集时间为准";

const PASS1_ONLY_INTERVAL_NOTE =
  "官方 run-to-run 区间为 pass@1 口径（ci_passed/ci_attempted 与 n_passed/n_attempted 同源，区间中心为 pass@1），未提供 pass@4 区间";

// ---------------------------------------------------------------------------
// 记录装配
// ---------------------------------------------------------------------------

/** 同一 leaderboard 行派生的多条记录共享的快照环境。 */
interface SnapshotContext {
  /** 官方 artifact 自述生成时间（发布时间口径）。 */
  generatedAt: string;
  /** 快照落盘时间（fixture manifest captured_at）。 */
  capturedAt: string;
  leaderboardUrl: string;
  taskSetDescription: string;
}

function vendorField(row: LeaderboardRow): BenchmarkRecord["subject_identity"]["vendor"] {
  // 官方 provider 字段存在且非空 → 采用官方值；缺失/为空 → 保持 null，不以展示名或结果反推。
  if (typeof row.provider === "string" && row.provider.length > 0) {
    return { value: row.provider, status: "verified", source_ids: [SRC.leaderboard] };
  }
  return {
    value: null,
    status: "unobtainable",
    note: "官方 provider 字段缺失或为空；不以模型展示名或结果反推",
    source_ids: [],
  };
}

function effortField(
  row: LeaderboardRow,
): BenchmarkRecord["subject_identity"]["reasoning_effort_or_configuration"] {
  if (typeof row.reasoning_effort === "string" && row.reasoning_effort.length > 0) {
    return { value: row.reasoning_effort, status: "verified", source_ids: [SRC.leaderboard] };
  }
  // 官方 default 配置：reasoning_effort=null 是官方明示的配置状态（not_applicable），不是数据缺失
  return {
    value: null,
    status: "not_applicable",
    note: `官方 default 配置（config=${row.config}）未设置 reasoning effort`,
    source_ids: [],
  };
}

function costBasisField(row: LeaderboardRow): BenchmarkRecord["conditions"]["cost_and_token_metadata"] {
  if (typeof row.cost_basis === "string" && row.cost_basis.length > 0) {
    return { cost_basis: { value: row.cost_basis, status: "verified", raw: row.cost_basis, source_ids: [SRC.leaderboard] } };
  }
  return {
    cost_basis: {
      value: null,
      status: "unobtainable",
      note: "官方 leaderboard 未给出该配置的 cost_basis（价格口径）",
      source_ids: [],
    },
  };
}

function sourceSnapshot(row: LeaderboardRow, ctx: SnapshotContext) {
  return {
    source_ids: [SRC.leaderboard],
    artifact: `leaderboard-live.json#rows[config=${row.config}]`,
    revision: `generated_at=${ctx.generatedAt}`,
    url: ctx.leaderboardUrl,
    captured_at: ctx.capturedAt,
  };
}

/** 模型 API ID：官方榜单标签未声明为不可变 API id / snapshot，全部保持未知。 */
function modelApiIdField(): BenchmarkRecord["subject_identity"]["model_api_id_or_snapshot"] {
  return {
    value: null,
    status: "unobtainable",
    note: "官方 leaderboard 的 model 标签未声明为不可变 API model id / snapshot",
    source_ids: [],
  };
}

function subjectIdentity(row: LeaderboardRow): BenchmarkRecord["subject_identity"] {
  return {
    subject_kind: "model_configuration",
    model_display_name: row.model,
    model_api_id_or_snapshot: modelApiIdField(),
    vendor: vendorField(row),
    agent_or_harness: row.harness,
    reasoning_effort_or_configuration: effortField(row),
  };
}

function baseConditions(row: LeaderboardRow, taskSetDescription: string): BenchmarkRecord["conditions"] {
  return {
    task_set_description: taskSetDescription,
    prompt_policy: PROMPT_POLICY,
    tool_environment: TOOL_ENVIRONMENT,
    context_limit_or_context_description: {
      value: null,
      status: "unobtainable",
      note: "官方未公开上下文窗口上限与截断策略（research/15-01）",
      source_ids: [],
    },
    success_definition: SUCCESS_DEFINITION,
    repeat_count: {
      value: row.n_runs,
      status: "verified",
      note: "官方 leaderboard n_runs 字段（重复整轮数）",
      source_ids: [SRC.leaderboard],
    },
    cost_and_token_metadata: costBasisField(row),
  };
}

function buildPassRecord(
  row: LeaderboardRow,
  metric: "pass@1" | "pass@4",
  ctx: SnapshotContext,
): BenchmarkRecord {
  const isPass1 = metric === "pass@1";
  return {
    record_id: `deepswe:v1.1:${row.config}:${metric}`,
    capability: ["repository_task_completion", "code_execution_correctness"],
    raw_metric: {
      metric_name: metric,
      metric_value: isPass1 ? row.pass_at_1 : row.pass_at_4,
      metric_unit: "ratio",
      metric_direction: "higher_is_better",
      numerator_and_denominator: {
        value: isPass1
          ? { numerator: row.n_passed, denominator: row.n_attempted }
          : { numerator: row.n_tasks_passed_any, denominator: row.n_tasks_attempted },
        status: "verified",
        source_ids: [SRC.leaderboard],
      },
      // 官方区间仅针对 pass@1 口径；pass@4 无区间，保持 null 不借用（不猜测）
      confidence_interval_or_error: isPass1
        ? {
            value: { ci_low: row.ci_lo, ci_high: row.ci_hi, half_width: row.ci_half, method: row.ci_method },
            status: "verified",
            source_ids: [SRC.leaderboard],
          }
        : { value: null, status: "unobtainable", note: PASS1_ONLY_INTERVAL_NOTE, source_ids: [] },
    },
    normalized_metric: {
      value: isPass1 ? row.pass_at_1 : row.pass_at_4,
      metric_space: `deepswe:v1.1:${metric}`,
    },
    normalization_method: `${PASS_NORMALIZATION_PREFIX}${metric}${PASS_NORMALIZATION_SUFFIX}`,
    source_snapshot: sourceSnapshot(row, ctx),
    subject_identity: subjectIdentity(row),
    conditions: baseConditions(row, ctx.taskSetDescription),
    confidence_status: isPass1 ? "confidence_interval_reported" : "point_estimate_only",
    evidence_level: "A",
    comparability_class: "direct_same_config",
    allowed_use: "scoring",
    prohibited_inferences: PASS_PROHIBITED_INFERENCE_PREFIX,
  };
}

function buildResourceRecord(row: LeaderboardRow, ctx: SnapshotContext): BenchmarkRecord {
  // 聚合字段逐键透传：键缺失（官方未发布该口径）则省略；官方给出 null 则保留 null。
  const aggregates: Record<string, number | null> = {};
  for (const key of AGGREGATE_KEYS) {
    const value = row[key];
    if (value === undefined) continue;
    aggregates[key] = typeof value === "number" ? value : null;
  }
  return {
    record_id: `deepswe:v1.1:${row.config}:resource_usage`,
    capability: ["benchmark_resource_usage"],
    raw_metric: {
      metric_name: "cost_token_steps_duration_aggregates",
      metric_unit: RESOURCE_UNIT,
      metric_direction: "descriptive_only",
      aggregates,
      numerator_and_denominator: {
        value: null,
        status: "unobtainable",
        note: "资源聚合的分母为全部评分 attempts（官方 scope 说明），未提供逐配置分子/分母",
        source_ids: [],
      },
      confidence_interval_or_error: {
        value: null,
        status: "unobtainable",
        note: "官方 run-to-run 区间仅针对 pass 指标，资源聚合未提供区间",
        source_ids: [],
      },
    },
    normalized_metric: null,
    normalization_method: RESOURCE_NORMALIZATION_METHOD,
    source_snapshot: sourceSnapshot(row, ctx),
    subject_identity: subjectIdentity(row),
    conditions: baseConditions(row, ctx.taskSetDescription),
    confidence_status: "point_estimate_only",
    evidence_level: "A",
    comparability_class: "reference_only",
    allowed_use: "explanation",
    prohibited_inferences: RESOURCE_PROHIBITED_INFERENCE_PREFIX,
  };
}

// ---------------------------------------------------------------------------
// 采集文档装配
// ---------------------------------------------------------------------------

export function normalizeFromSnapshots(
  snapshots: BenchmarkSnapshot[],
  collectedAt: string,
  toolVersion: string,
): BenchmarkCollection {
  const byId = new Map(snapshots.map((s) => [s.source_id, s]));
  const releaseSnapshot = byId.get(SRC.release);
  const leaderboardSnapshot = byId.get(SRC.leaderboard);
  const tasksSnapshot = byId.get(SRC.tasks);
  if (!releaseSnapshot || !leaderboardSnapshot || !tasksSnapshot) {
    throw new Error("DeepSWE 快照不完整：需要 release/leaderboard/tasks artifact");
  }

  const release = parseRelease(releaseSnapshot.body);
  const leaderboard = parseLeaderboard(leaderboardSnapshot.body);
  const tasks = parseTasks(tasksSnapshot.body);

  const capturedAt = leaderboardSnapshot.captured_at;
  const generatedAt = leaderboard.generated_at;
  const revision = `leaderboard-live generated_at=${generatedAt}`;
  const taskSetDescription = `${TASK_SET_DESCRIPTION_PREFIX} ${tasks.nTasks} 个任务、${tasks.nRepositories} ${TASK_SET_DESCRIPTION_SUFFIX}`;
  const ctx: SnapshotContext = {
    generatedAt,
    capturedAt,
    leaderboardUrl: leaderboardSnapshot.url,
    taskSetDescription,
  };

  const records: BenchmarkRecord[] = [];
  for (const row of leaderboard.rows) {
    records.push(
      buildPassRecord(row, "pass@1", ctx),
      buildPassRecord(row, "pass@4", ctx),
      buildResourceRecord(row, ctx),
    );
  }

  const sources: BenchmarkSourceRef[] = snapshots.map((snapshot) => {
    if (snapshot.source_id === SRC.leaderboard) {
      return {
        source_id: snapshot.source_id,
        url: snapshot.url,
        kind: snapshot.kind,
        fetched_at: capturedAt,
        last_updated_at: generatedAt,
        last_updated_note: "artifact 自述 generated_at",
      };
    }
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      kind: snapshot.kind,
      fetched_at: capturedAt,
      last_updated_at: null,
      last_updated_note: SOURCE_NOTE_NO_STATED_TIME,
    };
  });

  return {
    schema_version: "1",
    collection: {
      adapter_id: "deepswe",
      mode: "fixture",
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    benchmark: {
      benchmark_id: "deepswe",
      benchmark_version: release.release_id,
      leaderboard_or_dataset_revision: revision,
      maintainer: "Datacurve",
      source_url: "https://deepswe.datacurve.ai/",
      artifact_generated_at: generatedAt,
      harness: "mini-swe-agent + Pier + Modal",
      license_and_access_notes: [
        "官方仓库代码为 Apache License 2.0（见 deepswe-license 快照）；该许可不自动覆盖引用的第三方仓库、任务数据、模型输出或其他第三方内容，未发现独立的 DeepSWE 数据集许可证",
        "官网要求 benchmark 数据不进入训练语料，并提供 deep-swe-canary GUID；提交自有模型或 agent 需联系维护方",
        "官方公开任务、trials 与 leaderboard JSON artifacts；trials.json（31,617 条 trial）未随本包分发（体积约 51MB），URL 见 adapters/deepswe/sources.ts 注释",
      ],
    },
    task_set: {
      description: taskSetDescription,
      n_tasks: tasks.nTasks,
      n_repositories: tasks.nRepositories,
      languages: tasks.languageCounts,
    },
    records,
    sources,
    unresolved_facts: [
      {
        fact: "DeepSWE 任务 provenance：官方 tasks manifest 标注 source_dataset = swe-bench-ultra，与官网「任务原创」声明存在未解释的差异",
        reason: "维护方未公开两者关系；任务内容的第三方许可亦需单独核查（research/15-01 未解决问题 5）",
        how_to_resolve: "向 Datacurve 确认 swe-bench-ultra 与任务原创声明的关系及任务数据许可边界",
      },
      {
        fact: "DeepSWE v1.1 的上下文窗口上限与截断策略未公开",
        reason: "leaderboard artifact 与官方运行说明均未给出；直接影响结果解释与复现",
        how_to_resolve: "等待官方公布逐任务运行配置或维护方说明",
      },
      {
        fact: "70 个 leaderboard 配置中仅 5 个（gpt-6-astra 各 effort）给出 cost_basis 价格口径，其余 cost 聚合缺少可解释口径",
        reason: "官方 artifact 仅部分行携带 cost_basis 字段；跨配置成本比较因此不成立",
        how_to_resolve: "向维护方确认其余配置的成本口径后再做任何成本解释",
      },
      {
        fact: "模型标签与不可变 API model id / snapshot 的对应关系未公开",
        reason: "官方 leaderboard 仅提供展示口径的 model 标签，provider 字段大量缺失或为空",
        how_to_resolve: "需要官方确认标签→API ID 映射；在此之前不得以展示名或结果反推",
      },
      {
        fact: "数据许可边界未完全明确：仓库 Apache-2.0 不自动覆盖第三方任务内容与模型输出，无独立数据集许可证",
        reason: "官方未见独立数据许可声明；官网仅要求 benchmark 数据不进入训练语料（deep-swe-canary）",
        how_to_resolve: "如需对外再分发或训练用途，先逐项核查任务、输出与 artifacts 的许可",
      },
    ],
  };
}

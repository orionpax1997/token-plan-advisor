import type { BenchmarkCollection, BenchmarkRecord, BenchmarkSourceRef } from "../../schema/benchmark.ts";
import type { BenchmarkSnapshot } from "../_shared.ts";
import {
  parsePageMeta,
  parsePrivateLeaderboard,
  parsePublicBaselines,
  parsePublicTasks,
  type PrivateLeaderboardRow,
  type PublicBaselineRow,
} from "./parse.ts";
import { SRC } from "./sources.ts";

// ---------------------------------------------------------------------------
// 条件与禁止推断文案：来源为随包 fixture 的官方原文与 research/15-06（本批事实基准）。
// ---------------------------------------------------------------------------

const TASK_SET_DESCRIPTION =
  "Zapier AutomationBench 1.0.6：官方 held-out private task set（页面 '600+' 任务，每 domain 独立私有集）+ 公开 600-task 仓库（6 domain × 100 tasks）作为两个不同数据集标识，README 明确 leaderboard 用私有集、本地用公开集，两者不 1:1 等价。本 fixture 落盘页面截至 2026-09-08 06:32:56 UTC 当时可见的私有 leaderboard 前 10 条 + 公开 6 domain 摘要。";

const PROMPT_POLICY =
  "公开任务代码使用 system + user 消息：system prompt 要求执行 workflow、不要提问、使用约 50 个 tool-using turns，并对已处理/跳过项目做总结；user 消息给出业务请求与若干上下文线索。私有 held-out leaderboard 的精确 prompt bundle 未公开。";

const TOOL_ENVIRONMENT =
  "API mode（官方 leaderboard 明确）：仅两个工具 —— search（在 API schemas 上做 BM25 keyword search，返回 top 5 candidate）、execute（method、URL、body 模拟 curl/fetch，发现正确 endpoint 本身就是任务挑战）；公开 runner 支持 api/zapier/limited_zapier 三种 toolset 模式；最大 50 steps。";

const SUCCESS_DEFINITION =
  "task_completed_correctly（headline）：strict all-assertions pass rate，每个任务的 task_completed_correctly 是 0 或 1，所有 assertions 都通过才记 1；官方榜单分数是纳入评分任务上该值的平均。partial_credit：通过断言数占全部断言数（0.0–1.0），仅作诊断/RL dense reward，不是 headline score。deterministic assertions，不使用 LLM-as-judge。partial_credit 不作为单独 record 输出（页面未公开逐行数值），其定义与诊断语义在此 success_definition 与 prohibited_inferences 中保留。";

const RESOURCE_UNIT_PRIVATE =
  "页面 Cost / task 列（USD）：仅 vendor list pricing（如 Gemini 标准价）与 fallback 排除说明（第 5 名 Fable 5.1 + Opus 5 fallback 成本仅 Fable 5.1 部分，不含 fallback tokens）；页面未公开完整 cost 公式（reasoning/cached/tool-call/retry/批处理折扣）。";

const PASS_PROHIBITED_INFERENCE_PREFIX = [
  "不得把 task_completed_correctly / partial_credit 当作任意 Coding Plan 用户成功率或套餐质量分数",
  "不得据此推断套餐价格、配额、SLA、延迟、并发、上下文窗口、地区可用性或编辑器体验",
  "不得跨官方私有 held-out leaderboard 与公开 600-task 仓库拼接、补齐或换算分数（README 明确不 1:1 等价）",
  "不得把同一 Model 的不同 effort（Low/Medium/High/XHigh/Max）合并为单一模型分数",
  "不得把 Fable 5.1 + Opus 5 fallback 组合的分数当作单一模型能力结果（页面说明 fallback 由 Opus 5 完成约 40% 任务）",
  "不得把 partial_credit 当作 headline 排行榜分数（README 明确 partial_credit 仅诊断）",
  "不得跨 benchmark version（1.0.6 与未来版本）拼接时间序列；CHANGELOG 明确私有任务会因 bug 修复而调难",
  "不得把 domain 分数在未知任务数/聚合规则下平均成总分",
  "不得以模型展示名或结果反推未公开的 API model id、snapshot、Vendor、prompt bundle 或 sampling 参数",
  // ticket 02 §6 要求 Zapier 需标明数据集来源后才决定 scoring。本批把 strict 记录的 allowed_use
  // 保守设为 explanation（不进 scoring），由下游消费者在固定 benchmark version + 私有 task set
  // + 单一 model+effort+domain 等条件下决定是否纳入评分，禁止 Adapter 单方面决定 scoring。
  "本记录为私有 held-out leaderboard 描述性信号；allowed_use=explanation，禁止直接进入严格排名。下游须在固定 benchmark version + task_set_kind=private_held_out + 单 model/effort/domain 条件下重新评估 allowed_use。",
];

const RESOURCE_PROHIBITED_INFERENCE_PREFIX = [
  "不得把 Cost / task 当质量分数或能力分数",
  "不得把 Cost / task 与 Plan 价格、额度、用户真实成本混算",
  "不得跨 Vendor 比较 Cost（页面未公开成本公式、是否包含 reasoning/cached/tool-call/retry/fallback/batch 折扣；第 5 名成本明确排除 fallback tokens）",
  "不得把 Gemini 标准 list pricing 与 Plan 促销价混算（页面脚注同时给出两种价格；榜单 Cost 列仅 list pricing）",
];

const PASS_NORMALIZATION_METHOD_PRIVATE =
  "identity：normalized_metric 直接采用 leaderboard.json 数值，metric_space 限定为同一 Zapier AutomationBench 1.0.6 私有 held-out leaderboard 指标空间；仅同 dataset + 同 benchmark version + 同 task set（private_held_out）+ 同 vendor + 同 model + 同 effort 的配置可直接比较，不跨 task set、不跨 benchmark version、不跨来源换算。";

const RESOURCE_NORMALIZATION_METHOD =
  "none：Cost / task 保留页面原值（raw_metric.aggregates）；各模型的定价口径与计算式未公开，不做来源内归一化，不与 Plan 价格额度混算。";

const SOURCE_NOTE_NO_STATED_TIME = "来源页面或文档未显示独立更新时间，以本次快照采集时间为准";
const PAGE_LEADERBOARD_NOTE = "zapier.com/benchmarks 页面 Published 与 last-modified";

// ---------------------------------------------------------------------------
// 资源聚合字段（页面 Cost / task 透传；在场即透传）
// ---------------------------------------------------------------------------

const AGGREGATE_KEYS = ["cost_per_task_usd"] as const;

// ---------------------------------------------------------------------------
// 记录装配
// ---------------------------------------------------------------------------

interface SnapshotContext {
  /** 页面 Published time。 */
  pagePublishedAt: string;
  /** 页面 last-modified。 */
  pageLastModifiedAt: string;
  /** 快照落盘时间（fixture manifest captured_at）。 */
  capturedAt: string;
  leaderboardPageUrl: string;
  benchmarkVersion: string;
}

function configKeyPrivate(row: PrivateLeaderboardRow): string {
  return `${row.model}|${row.effort}`;
}

/** Vendor：采用页面 vendor 字段（页面直接显示：OpenAI/Anthropic/Google）。 */
function vendorField(row: PrivateLeaderboardRow): BenchmarkRecord["subject_identity"]["vendor"] {
  return {
    value: row.vendor,
    status: "verified",
    source_ids: [SRC.privateLeaderboard],
  };
}

function effortField(row: PrivateLeaderboardRow): BenchmarkRecord["subject_identity"]["reasoning_effort_or_configuration"] {
  return {
    value: row.effort,
    status: "verified",
    source_ids: [SRC.privateLeaderboard],
  };
}

/** Fallback 组合配置（如 Fable 5.1 + Opus 5 fallback）在 agent_or_harness 中显式标注。 */
function agentOrHarness(row: PrivateLeaderboardRow): string {
  if (row.is_fallback_combo) {
    return `AutomationBench agent（fallback combo: ${row.display_name}）`;
  }
  return "AutomationBench agent（API mode：search + execute）";
}

function modelApiIdField(): BenchmarkRecord["subject_identity"]["model_api_id_or_snapshot"] {
  return {
    value: null,
    status: "unobtainable",
    note: "页面与 README 仅给出模型展示名，未声明为不可变 API model id 或带日期 snapshot",
    source_ids: [],
  };
}

function subjectIdentityPrivate(row: PrivateLeaderboardRow): BenchmarkRecord["subject_identity"] {
  return {
    subject_kind: "model_configuration",
    model_display_name: row.model,
    model_api_id_or_snapshot: modelApiIdField(),
    vendor: vendorField(row),
    agent_or_harness: agentOrHarness(row),
    reasoning_effort_or_configuration: effortField(row),
  };
}

function baseConditionsPrivate(row: PrivateLeaderboardRow, taskSetDescription: string): BenchmarkRecord["conditions"] {
  return {
    task_set_description: taskSetDescription,
    prompt_policy: PROMPT_POLICY,
    tool_environment: TOOL_ENVIRONMENT,
    context_limit_or_context_description: {
      value: null,
      status: "unobtainable",
      note: "页面未公开各模型的上下文窗口上限、截断策略或采样参数（research/15-06）",
      source_ids: [],
    },
    success_definition: SUCCESS_DEFINITION,
    repeat_count: {
      value: null,
      status: "unobtainable",
      note:
        "页面只说 run-to-run variance 通常在 1% 以内，未给出每模型/每任务的重复次数与随机种子；公开 runner rollouts_per_example=1 是公开集默认值，不能推断官方榜单重复次数",
      source_ids: [],
    },
    cost_and_token_metadata: {
      cost_basis: {
        value: null,
        status: "unobtainable",
        note:
          "页面 Cost / task 口径未公开：是否含 reasoning/cached input/tool-call/retry/fallback tokens、批处理折扣、汇率换算规则均未给出；第 5 名成本明确排除 fallback tokens",
        source_ids: [],
      },
    },
  };
}

function sourceSnapshotPrivate(row: PrivateLeaderboardRow, ctx: SnapshotContext, artifactField: string) {
  return {
    source_ids: [SRC.privateLeaderboard],
    artifact: `private-leaderboard.json#rows[rank=${row.rank}, model=${row.model}, effort=${row.effort}].${artifactField}`,
    revision: `benchmark_version=${ctx.benchmarkVersion}, task_set_kind=private_held_out, captured_at=${ctx.capturedAt}`,
    url: ctx.leaderboardPageUrl,
    captured_at: ctx.capturedAt,
  };
}

function buildStrictRecord(row: PrivateLeaderboardRow, ctx: SnapshotContext): BenchmarkRecord {
  // Fallback 组合在 prohibited_inferences 中追加独立条目，禁止把 fallback 组合当单一模型。
  const extraProhibitions = row.is_fallback_combo
    ? [
        "不得把 fallback 组合的 task_completed_correctly 当成单一主模型（Fable 5.1）的能力结果；Opus 5 处理约 40% 任务（657 个中的 260 个）",
      ]
    : [];
  return {
    record_id: `zapier-private:${ctx.benchmarkVersion}:${configKeyPrivate(row)}:task_completed_correctly`,
    capability: ["business_workflow_state_completion"],
    raw_metric: {
      metric_name: "task_completed_correctly",
      metric_value: row.score,
      metric_unit: "ratio",
      metric_direction: "higher_is_better",
      numerator_and_denominator: {
        value: null,
        status: "unobtainable",
        note:
          "页面未公开精确私有任务数与 strict 通过断言数；页面给出 '600+' 私有任务，README 明确每个 domain 独立私有任务集且会因 bug 修复调难",
        source_ids: [],
      },
      // 页面只声明 "run-to-run variance typically within 1%"，未公开 CI 公式、抽样单位、独立性假设。
      // 此处不输出 confidence_interval_or_error（schema 要求 confidence_status=point_estimate_only 时
      // interval.value 必须为 null），改用一条 note 描述页面声明的 1% variance 上界作为已知事实。
      confidence_interval_or_error: {
        value: null,
        status: "unobtainable",
        note: "页面未提供逐行 CI；仅声明 'run-to-run variance typically within 1%'，未公开 CI 公式、抽样单位与独立性假设，不得据此构造统计显著性结论",
        source_ids: [],
      },
    },
    normalized_metric: {
      value: row.score,
      metric_space: `zapier-automationbench:${ctx.benchmarkVersion}:task_completed_correctly`,
    },
    normalization_method: PASS_NORMALIZATION_METHOD_PRIVATE,
    source_snapshot: sourceSnapshotPrivate(row, ctx, "score"),
    subject_identity: subjectIdentityPrivate(row),
    conditions: baseConditionsPrivate(row, TASK_SET_DESCRIPTION),
    // 页面未公开 CI：状态为 point_estimate_only，禁止消费者把本记录的 variance 上界当成统计 CI。
    confidence_status: "point_estimate_only",
    evidence_level: "A",
    // ticket 02 §6：Zapier 需标明数据集来源后决定 allowed_use。本批已在 record_id/prohibited_inferences
    // 中显式标记 task_set_kind=private_held_out；保守设为 explanation，由下游在固定条件下重评估。
    comparability_class: "direct_same_config",
    allowed_use: "explanation",
    prohibited_inferences: [...PASS_PROHIBITED_INFERENCE_PREFIX, ...extraProhibitions],
  };
}

function buildResourceRecordPrivate(row: PrivateLeaderboardRow, ctx: SnapshotContext): BenchmarkRecord {
  const aggregates: Record<string, number | null> = {};
  for (const key of AGGREGATE_KEYS) {
    aggregates[key] = row[key];
  }
  return {
    record_id: `zapier-private:${ctx.benchmarkVersion}:${configKeyPrivate(row)}:cost_per_task`,
    capability: ["benchmark_resource_usage"],
    raw_metric: {
      metric_name: "cost_per_task_aggregates",
      metric_unit: RESOURCE_UNIT_PRIVATE,
      metric_direction: "descriptive_only",
      aggregates,
      numerator_and_denominator: {
        value: null,
        status: "unobtainable",
        note: "页面 Cost / task 分母未公开（是否含 reasoning/cached/tool-call/retry/fallback tokens）",
        source_ids: [],
      },
      confidence_interval_or_error: {
        value: null,
        status: "unobtainable",
        note: "页面未给出 Cost / task 的 run-to-run 区间",
        source_ids: [],
      },
    },
    normalized_metric: null,
    normalization_method: RESOURCE_NORMALIZATION_METHOD,
    source_snapshot: sourceSnapshotPrivate(row, ctx, "cost_per_task_usd"),
    subject_identity: subjectIdentityPrivate(row),
    conditions: baseConditionsPrivate(row, TASK_SET_DESCRIPTION),
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
  const pageMetaSnapshot = byId.get(SRC.pageMeta);
  const privateLeaderboardSnapshot = byId.get(SRC.privateLeaderboard);
  const publicTasksSnapshot = byId.get(SRC.publicTasks);
  const publicBaselinesSnapshot = byId.get(SRC.publicBaselines);
  if (!pageMetaSnapshot || !privateLeaderboardSnapshot || !publicTasksSnapshot || !publicBaselinesSnapshot) {
    throw new Error(
      "Zapier AutomationBench 快照不完整：需要 pageMeta/privateLeaderboard/publicTasks/publicBaselines",
    );
  }

  const pageMeta = parsePageMeta(pageMetaSnapshot.body);
  const privateLeaderboard = parsePrivateLeaderboard(privateLeaderboardSnapshot.body);
  const publicTasks = parsePublicTasks(publicTasksSnapshot.body);
  const publicBaselines = parsePublicBaselines(publicBaselinesSnapshot.body);

  const capturedAt = pageMetaSnapshot.captured_at;
  const ctx: SnapshotContext = {
    pagePublishedAt: pageMeta.published_time_utc,
    pageLastModifiedAt: pageMeta.last_modified_utc,
    capturedAt,
    leaderboardPageUrl: pageMetaSnapshot.url,
    benchmarkVersion: pageMeta.benchmark_version,
  };

  const records: BenchmarkRecord[] = [];

  // ---- 私有 held-out leaderboard：每行 2 记录（strict + cost），不输出 partial_credit 独立 record。
  // partial_credit 在 success_definition + prohibited_inferences 中独立保留（ticket 02 §6
  // "为独立字段"由 record-level 字段语义承载；页面未公开逐行数值，不另立 record）。
  for (const row of privateLeaderboard.rows) {
    records.push(buildStrictRecord(row, ctx), buildResourceRecordPrivate(row, ctx));
  }

  const sources: BenchmarkSourceRef[] = snapshots.map((snapshot) => {
    if (snapshot.source_id === SRC.page || snapshot.source_id === SRC.privateLeaderboard) {
      // 页面/榜单：last_updated_at = 页面 last-modified
      return {
        source_id: snapshot.source_id,
        url: snapshot.url,
        kind: snapshot.kind,
        fetched_at: capturedAt,
        last_updated_at: ctx.pageLastModifiedAt,
        last_updated_note: PAGE_LEADERBOARD_NOTE,
      };
    }
    if (snapshot.source_id === SRC.readme) {
      return {
        source_id: snapshot.source_id,
        url: snapshot.url,
        kind: snapshot.kind,
        fetched_at: capturedAt,
        last_updated_at: null,
        last_updated_note: SOURCE_NOTE_NO_STATED_TIME,
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

  // public baseline 模型列表（仅展示名+vendor，不引用第三方未公开页面数字）以 reference 形式
  // 追加在 license_and_access_notes；不在 records 中制造 evidence_level=B 的空 record。
  const publicBaselineModels = publicBaselines.rows
    .map((r: PublicBaselineRow) => `${r.display_name}（${r.vendor}）`)
    .join("；");

  return {
    schema_version: "1",
    collection: {
      adapter_id: "zapier-automationbench",
      mode: "fixture",
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    benchmark: {
      benchmark_id: "zapier-automationbench",
      benchmark_version: pageMeta.benchmark_version,
      leaderboard_or_dataset_revision: `private_leaderboard page_published=${ctx.pagePublishedAt}, page_last_modified=${ctx.pageLastModifiedAt}, task_sets=private_held_out+public_600_task_repo`,
      maintainer: "Zapier, Inc.",
      source_url: "https://zapier.com/benchmarks",
      artifact_generated_at: ctx.pageLastModifiedAt,
      harness: "AutomationBench runner（api mode 默认；search + execute；max 50 steps；公开 rollouts_per_example=1）",
      license_and_access_notes: [
        "官方仓库 LICENSE 为 MIT（zapier-license 快照），范围覆盖 Zapier 原创的 benchmark code、test frameworks、simulation logic、mock data generators、configuration files、documentation",
        "MIT 不覆盖仓库内由公开第三方 API 文档独立推导的 API schema representations（不应把 MIT 解释为授予第三方知识产权）",
        "官方 held-out private task set 不发布，外部无法仅凭公开仓库完整复现官方榜单数字",
        "Hub 排行榜 CLI 管理/上传接口需登录或 API key（公开榜单页面无需登录）",
        "公开 simple domain 200 任务明确不纳入 benchmark score；本批未引入第三方未公开页面数字",
        `公开 600-task 仓库 README 列出 baseline 模型展示名（仅作 reference，禁止视为可评分配置）：${publicBaselineModels}`,
      ],
    },
    task_set: {
      description: TASK_SET_DESCRIPTION,
      // 公开 600-task 集是 benchmark 的一部分（任务清单来自公开仓库）；私有集任务数 '600+' 未精确公布。
      n_tasks: publicTasks.total_tasks,
      n_repositories: 0,
      languages: [],
      // Zapier 的业务域划分（6 domain × 100 tasks）放在 task_set.domains，避免污染 languages 语义。
      domains: publicTasks.domains.map((d) => ({
        domain: d.name,
        n_tasks: d.n_tasks,
        topics: d.topics,
      })),
    },
    records,
    sources,
    unresolved_facts: [
      {
        fact: "私有 held-out task set 精确任务数未公开：页面仅给 '600+'，README 明确私有集与公开 600-task 分离且不发布",
        reason: "私有任务为维护方持有；不能从 '600+' 反推精确分子分母",
        how_to_resolve: "向 Zapier 维护方确认私有集任务数",
      },
      {
        fact: "官方 leaderboard 每个模型/effort 运行次数、每任务是否重复、随机种子、run-to-run variance 1% 的具体计算方法均未公开",
        reason: "页面只声明 'run-to-run variance typically within 1%'，未给出每模型运行次数与重复结构",
        how_to_resolve: "向 Zapier 维护方确认榜单运行配置；公开 runner rollouts_per_example=1 是公开集默认值，不能推断官方榜单",
      },
      {
        fact: "页面所列模型展示名（如 GPT 6 Astra、Fable 5.1、Opus 5、Gemini 3.8 Flash 等）不对应不可变 API model id 或带日期 snapshot",
        reason: "页面与 README 仅给出模型展示名，未给出底层 provider model ID、权重/snapshot hash、system/developer prompt、采样参数或采集/运行日期",
        how_to_resolve: "需要官方确认标签→API ID 映射；不得以展示名或结果反推",
      },
      {
        fact: "Cost / task 的完整计算式未公开：是否包含 reasoning tokens、cached input、tool-call token、重试、fallback、批处理折扣、汇率换算等均未给出",
        reason: "页面只给数字；第 5 名脚注只明确 fallback tokens 被排除，不能据此补全其他条目公式",
        how_to_resolve: "向 Zapier 与各 Vendor 确认成本口径后再做跨 Vendor 成本比较",
      },
      {
        fact: "公开 600-task 集与私有 held-out set 的 domain 分布、任务难度、断言数量与版本差异未完全公开",
        reason: "README 仅说 'similar task distribution and assertion framework' 且 private set purposely harder",
        how_to_resolve: "向维护方确认两数据集差异；不得假设两者 1:1 等价",
      },
      {
        fact: "Fable 5.1 + Opus 5 fallback 组合的实际组合成本（包含 fallback tokens）未公布",
        reason: "页面 cost 列明确仅 Fable 5.1 部分；真实组合成本更高",
        how_to_resolve: "向维护方确认 fallback 组合的完整成本；不得把组合分数与单一成本混算",
      },
      {
        fact: "官方榜单完整 95 条记录（页面标注另有 85 条）未展开",
        reason: "页面正文仅直接给出前十与 domain 摘要；本次读取未在页面正文展开剩余 85 条",
        how_to_resolve: "刷新页面快照时同时记录完整列表，或向维护方确认完整名单",
      },
      {
        fact: "页面 '2B+ monthly tasks across 3.7M companies' 与 benchmark 任务设计之间的抽样/脱敏/授权/代表性关系未公开",
        reason: "页面没有给出数据卡或采样说明；这些数字是背景定位，不等于 benchmark 样本量",
        how_to_resolve: "向维护方确认任务来源授权；不得把背景数字等同于 benchmark 样本量",
      },
    ],
  };
}

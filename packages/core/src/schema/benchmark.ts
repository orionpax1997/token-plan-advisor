import { z } from "zod";
import { field, UnresolvedFact } from "./plan.ts";

/** 未能核验事实：与 Plan Schema 共用同一结构（同一绑定，避免同名类型分叉）。 */
export { UnresolvedFact };

// ---------------------------------------------------------------------------
// Benchmark Record Schema v1（探索 02 Answer：Benchmark Adapter 最小输入/输出）
//
// 与 Plan Schema 的关系：benchmark 记录的主体是模型、Agent/harness 或组合配置；
// Plan 是独立的商业产品对象。两者分开建模（探索 02「Coding Plan 关联规则」第 1 条），
// 本 schema 不引用 PlanCollection，也不做任何 Plan 分数推断。
//
// 字段级质量状态（QualityStatuses + field 包装）与三时间戳约定沿用核心包：
//   采集（collection.collected_at） / 发布（sources[].last_updated_at，页面或
//   artifact 自述；null 表示未显示，以采集时点为准） / 快照（sources[].fetched_at
//   = fixture manifest captured_at；记录级 source_snapshot.captured_at 同口径）。
// ---------------------------------------------------------------------------

/** 9 类标准化能力标签（探索 02 Answer「标准化能力映射」注册表，顺序与 ticket 01 一致）。 */
export const CapabilityTags = [
  "repository_task_completion",
  "terminal_agent_completion",
  "code_execution_correctness",
  "agent_tool_orchestration",
  "frontend_visual_preference",
  "business_workflow_state_completion",
  "long_context_understanding",
  "observed_workflow_reliability",
  "benchmark_resource_usage",
] as const;
export type CapabilityTag = (typeof CapabilityTags)[number];

/** 证据等级（CONTEXT.md Evidence Level）：A=可核验原始事实 / B=方法与声明 / C=无法核验。 */
export const EvidenceLevels = ["A", "B", "C"] as const;
export type EvidenceLevel = (typeof EvidenceLevels)[number];

/**
 * 可比性分级（CONTEXT.md Comparability Class 四级）：
 *   direct_same_config         同源同版本同配置，可直接比较；
 *   source_internal_normalized 仅来源内归一化后可比较；
 *   reference_only             仅作参考（解释/筛选，不进严格数值排名）；
 *   not_comparable             完全不可比较，必须排除。
 */
export const ComparabilityClasses = [
  "direct_same_config",
  "source_internal_normalized",
  "reference_only",
  "not_comparable",
] as const;
export type ComparabilityClass = (typeof ComparabilityClasses)[number];

/** 允许用途：进入后续评分 | 仅作解释 | 必须排除。 */
export const AllowedUses = ["scoring", "explanation", "exclude"] as const;
export type AllowedUse = (typeof AllowedUses)[number];

/** 置信度状态：官方给出误差区间 / 仅点估计 / 无法确定。 */
export const ConfidenceStatuses = [
  "confidence_interval_reported",
  "point_estimate_only",
  "unknown",
] as const;
export type ConfidenceStatus = (typeof ConfidenceStatuses)[number];

/** Benchmark 来源种类（官方 artifact / 官方文档 / 官方许可证；与 Plan 来源种类分立）。 */
export const BenchmarkSourceKinds = [
  "leaderboard_artifact",
  "release_manifest",
  "task_set_artifact",
  "official_docs",
  "official_license",
] as const;
export type BenchmarkSourceKind = (typeof BenchmarkSourceKinds)[number];

// ---------------------------------------------------------------------------
// 字段包装：与 Plan Schema 同构的字段级质量状态（沿用核心包既有约定，直接复用 field()）
// ---------------------------------------------------------------------------

const StringField = () => field(z.string());
const NumberField = () => field(z.number());

// ---------------------------------------------------------------------------
// raw_metric：benchmark 原始指标（含分母与误差，探索 02 输入字段全集的指标侧）
// ---------------------------------------------------------------------------

const NumeratorAndDenominator = z.strictObject({
  numerator: z.number().int().nonnegative(),
  denominator: z.number().int().nonnegative(),
});

const ConfidenceInterval = z.strictObject({
  ci_low: z.number(),
  ci_high: z.number(),
  half_width: z.number().nonnegative(),
  method: z.string(),
});

export const RawMetric = z
  .strictObject({
    metric_name: z.string(),
    /** 单值指标的数值；资源类聚合记录（aggregates）省略或为 null。 */
    metric_value: z.number().nullable().optional(),
    /**
     * 资源类聚合信号（cost/token/steps/duration）专用：以官方字段名为键、
     * 原值保存；value=null 表示官方未给出该聚合，不得以其他字段反推。
     */
    aggregates: z.record(z.string(), z.number().nullable()).optional(),
    metric_unit: z.string(),
    /** higher_is_better / lower_is_better；描述性资源信号用 descriptive_only。 */
    metric_direction: z.enum(["higher_is_better", "lower_is_better", "descriptive_only"]),
    /** 计数口径（如 pass@1 的通过 attempts / 计分 attempts）；不可得时显式 null。 */
    numerator_and_denominator: field(NumeratorAndDenominator),
    /** 官方误差区间与口径（如 95% run-to-run 区间）；不可得时显式 null。 */
    confidence_interval_or_error: field(ConfidenceInterval),
    note: z.string().optional(),
  })
  .check((ctx) => {
    const m = ctx.value as RawMetric;
    const hasValue = m.metric_value !== null && m.metric_value !== undefined;
    const hasAggregates = m.aggregates !== undefined;
    if (hasValue === hasAggregates) {
      ctx.issues.push({
        code: "custom",
        message: "raw_metric 的 metric_value 与 aggregates 必须二选一非空（单值指标用前者，资源聚合用后者）",
        input: m,
      });
    }
  });
export type RawMetric = z.output<typeof RawMetric>;

// ---------------------------------------------------------------------------
// 记录：一次采集内「配置 × 指标」的标准化能力信号
// ---------------------------------------------------------------------------

export const BenchmarkRecord = z
  .strictObject({
    /** 全文档唯一；形如 <benchmark_id>:<version>:<config>:<metric>。 */
    record_id: z.string(),
    /**
     * 本结果证据的标准化能力标签（注册表子集，≥1）。
     * 一条 benchmark 结果可同时证据多个能力（如 DeepSWE 的 verifier 判定的
     * Pass@1 同时是 repository_task_completion 与 code_execution_correctness）；
     * 用数组而非复制成多条记录，避免后续评分重复计权。
     */
    capability: z.array(z.enum(CapabilityTags)).min(1),
    raw_metric: RawMetric,
    /**
     * 标准化数值：只能在来源定义的同一指标空间内生成
     * （metric_space = <benchmark_id>:<version>:<metric>）；
     * 不同来源、不同指标之间不产生统一分数。无可归一化时为 null。
     */
    normalized_metric: z
      .strictObject({ value: z.number(), metric_space: z.string() })
      .nullable(),
    /** 归一化方法说明；identity=原值保留，none=不做归一化。必须总是填写。 */
    normalization_method: z.string().min(1),
    /** 来源快照：本记录数值来自哪个官方 artifact 的哪一部分，快照时间为何时。 */
    source_snapshot: z.strictObject({
      source_ids: z.array(z.string()).min(1),
      /** artifact 内定位（如 leaderboard-live.json#rows[config=…]）。 */
      artifact: z.string(),
      revision: z.string().nullable(),
      url: z.string().url(),
      /** 快照落盘时间（fixture 模式 = manifest captured_at）。 */
      captured_at: z.string(),
    }),
    /** 主体身份：benchmark 记录的主体是配置，不是 Plan（探索 02 关联规则 1）。 */
    subject_identity: z.strictObject({
      /** v1 仅支持配置级主体；裸模型结果须由 conditions 中的 harness 说明。 */
      subject_kind: z.enum(["model_configuration"]),
      /** 官方榜单上的模型标签（展示口径；不得据此反推 API ID 或 Vendor）。 */
      model_display_name: z.string(),
      /** 不可变 API model id / snapshot；官方未声明时保持 null（unknown stays null）。 */
      model_api_id_or_snapshot: StringField(),
      /** 官方给出的 provider/vendor 字段；缺失时保持 null，不得以模型名或结果反推。 */
      vendor: StringField(),
      agent_or_harness: z.string(),
      /** reasoning effort 或官方配置名；官方未设置（default 配置）时 null + not_applicable。 */
      reasoning_effort_or_configuration: StringField(),
    }),
    /** 测试条件（探索 02 输入字段全集的条件侧）。 */
    conditions: z.strictObject({
      task_set_description: z.string(),
      prompt_policy: z.string(),
      tool_environment: z.string(),
      /** 上下文窗口/截断策略；官方未公开时保持 null（DeepSWE 即此情形）。 */
      context_limit_or_context_description: StringField(),
      success_definition: z.string(),
      /** 官方重复次数（n_runs 等）；不得由误差值反推。 */
      repeat_count: NumberField(),
      cost_and_token_metadata: z.strictObject({
        /** 官方价格口径说明（cost_basis）；未公开时保持 null——成本不可跨配置解释。 */
        cost_basis: StringField(),
      }),
    }),
    confidence_status: z.enum(ConfidenceStatuses),
    evidence_level: z.enum(EvidenceLevels),
    comparability_class: z.enum(ComparabilityClasses),
    allowed_use: z.enum(AllowedUses),
    /** 禁止推断清单：本记录不得被用于的推断（逐条机读字符串，供下游策略检查）。 */
    prohibited_inferences: z.array(z.string()).min(1),
  })
  .check((ctx) => {
    const r = ctx.value as BenchmarkRecord;
    // 证据等级 → 允许用途（探索 02「证据等级与使用范围」表）：
    // C 只能记录为未知或排除，不进入任何使用；B 不能作为严格排名依据（不进 scoring）。
    if (r.evidence_level === "C" && r.allowed_use !== "exclude") {
      ctx.issues.push({
        code: "custom",
        message: "evidence_level=C 的记录只能 exclude（只能记录为未知或排除，不进入评分）",
        input: r,
      });
    }
    if (r.evidence_level === "B" && r.allowed_use === "scoring") {
      ctx.issues.push({
        code: "custom",
        message: "evidence_level=B 的记录不能进入 scoring（缺少运行细节时不能作为严格排名依据）",
        input: r,
      });
    }
    // 资源类信号仅描述性：cost/token/steps/duration 只能作解释，不进评分，
    // 也不得与 Plan 价格额度混算（ticket 01 / 探索 02）。
    if (r.capability.includes("benchmark_resource_usage") && r.allowed_use !== "explanation") {
      ctx.issues.push({
        code: "custom",
        message: "capability 含 benchmark_resource_usage 的记录 allowed_use 只能是 explanation（仅描述性信号）",
        input: r,
      });
    }
    // 完全不可比较 → 必须排除。
    if (r.comparability_class === "not_comparable" && r.allowed_use !== "exclude") {
      ctx.issues.push({
        code: "custom",
        message: "comparability_class=not_comparable 的记录必须 exclude",
        input: r,
      });
    }
    // 置信度状态与区间字段互为充要。
    const interval = r.raw_metric.confidence_interval_or_error;
    if (r.confidence_status === "confidence_interval_reported" && interval.value === null) {
      ctx.issues.push({
        code: "custom",
        message: "confidence_status=confidence_interval_reported 时 confidence_interval_or_error 不得为 null",
        input: r,
      });
    }
    if (r.confidence_status !== "confidence_interval_reported" && interval.value !== null) {
      ctx.issues.push({
        code: "custom",
        message: `confidence_interval_or_error 非空时 confidence_status 必须是 confidence_interval_reported（得到 ${r.confidence_status}）`,
        input: r,
      });
    }
  });
export type BenchmarkRecord = z.output<typeof BenchmarkRecord>;

// ---------------------------------------------------------------------------
// 来源引用与采集文档
// ---------------------------------------------------------------------------

/**
 * Benchmark 来源引用：三时间戳沿用核心包约定——
 * fetched_at=快照落盘时点（fixture=manifest captured_at）、
 * last_updated_at=页面/artifact 自述发布时间（null=未显示，以采集时点为准，
 * 此时 last_updated_note 含「以采集时间为准」）、collected_at 在 collection 层。
 */
export const BenchmarkSourceRef = z.strictObject({
  source_id: z.string(),
  url: z.string().url(),
  kind: z.enum(BenchmarkSourceKinds),
  fetched_at: z.string(),
  last_updated_at: z.string().nullable(),
  last_updated_note: z.string().optional(),
});
export type BenchmarkSourceRef = z.output<typeof BenchmarkSourceRef>;

/**
 * Benchmark Collection：一次 Benchmark Adapter 采集的完整输出。
 * benchmark 记录是版本化快照：以官方已发布 revision 的快照为输入，
 * 不含对动态榜单的实时抓取（探索 02 实现约束）。
 */
export const BenchmarkCollection = z.strictObject({
  schema_version: z.literal("1"),
  collection: z.strictObject({
    adapter_id: z.string(),
    mode: z.enum(["fixture", "live"]),
    collected_at: z.string(),
    tool_version: z.string(),
  }),
  benchmark: z.strictObject({
    benchmark_id: z.string(),
    benchmark_version: z.string(),
    /** leaderboard/dataset revision 标识；官方未给出时 null。 */
    leaderboard_or_dataset_revision: z.string().nullable(),
    maintainer: z.string(),
    source_url: z.string().url(),
    /** 官方 artifact 自述生成时间（发布时间口径）；未给出时 null。 */
    artifact_generated_at: z.string().nullable(),
    /** 官方执行编排（如 mini-swe-agent + Pier + Modal）；未公开时 null。 */
    harness: z.string().nullable(),
    license_and_access_notes: z.array(z.string()),
  }),
  task_set: z.strictObject({
    description: z.string(),
    n_tasks: z.number().int().nonnegative(),
    n_repositories: z.number().int().nonnegative(),
    languages: z.array(z.strictObject({ language: z.string(), n_tasks: z.number().int().nonnegative() })),
    /**
     * 业务域划分（适用于按业务/能力域拆分任务的 benchmark，如 Zapier AutomationBench
     * 的 6 个 business domain）。与 languages 并列，不互斥——同一 task set 可以同时声明
     * 语言分布与业务域分布；不存在域信息的 benchmark 留空。
     */
    domains: z
      .array(
        z.strictObject({
          domain: z.string(),
          n_tasks: z.number().int().nonnegative(),
          topics: z.array(z.string()).optional(),
        }),
      )
      .optional(),
  }),
  records: z.array(BenchmarkRecord).min(1),
  sources: z.array(BenchmarkSourceRef).min(1),
  unresolved_facts: z.array(UnresolvedFact),
});
export type BenchmarkCollection = z.output<typeof BenchmarkCollection>;

// ---------------------------------------------------------------------------
// 校验入口
// ---------------------------------------------------------------------------

export type BenchmarkValidationResult =
  | { ok: true; value: BenchmarkCollection }
  | { ok: false; issues: string[] };

/** 采集输出必须通过 Benchmark Schema v1 校验后才允许发出（CLI 的最后一道闸）。 */
export function validateBenchmarkCollection(input: unknown): BenchmarkValidationResult {
  const result = BenchmarkCollection.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      issues: result.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      ),
    };
  }
  const value = result.data;
  // normalized_metric 只能落在本文档声明的同一 benchmark release 指标空间内；
  // 跨来源/跨版本统一分数在这里被直接拒绝。
  const prefix = `${value.benchmark.benchmark_id}:${value.benchmark.benchmark_version}:`;
  const issues: string[] = [];
  for (const record of value.records) {
    const normalized = record.normalized_metric;
    if (normalized !== null && !normalized.metric_space.startsWith(prefix)) {
      issues.push(
        `${record.record_id}: normalized_metric.metric_space "${normalized.metric_space}" 不在本文档的 ${prefix} 指标空间内（禁止跨来源/跨版本统一分）`,
      );
    }
  }
  const recordIds = new Set<string>();
  for (const record of value.records) {
    if (recordIds.has(record.record_id)) {
      issues.push(`${record.record_id}: record_id 重复`);
    }
    recordIds.add(record.record_id);
  }
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value };
}

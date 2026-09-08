import { z } from "zod";

// ---------------------------------------------------------------------------
// 受控词表（与探索 01 §7.4/§7.5 及 CONTEXT.md 领域词汇对齐）
// ---------------------------------------------------------------------------

/** Plan Type：不同类型不默认放入同一个排行榜直接比较（CONTEXT.md）。 */
export const PlanTypes = ["coding-subscription", "general-subscription", "api-usage"] as const;

/** 额度原语枚举（探索 01 §7.5.2）。 */
export const QuotaModels = [
  "messages_5h",
  "credits_5h_weekly",
  "usd_equivalence",
  "usage_tier",
  "concurrency",
  "relative_multiplier",
] as const;
export type QuotaModel = (typeof QuotaModels)[number];

/** 字段级质量状态：已验证/部分获取/过期/来源冲突/不可获取/不适用。 */
export const QualityStatuses = [
  "verified",
  "partial",
  "stale",
  "source_conflict",
  "unobtainable",
  "not_applicable",
] as const;

/** 失败分类枚举（探索 01 §7.4）。 */
export const FailureCodes = [
  "OK",
  "OK_MD",
  "JS_RENDERED_DATA",
  "JS_RENDERED_EMPTY",
  "RENDER_DEPENDENT",
  "LOGIN_REQUIRED",
  "API_AVAILABLE",
  "CF_BLOCKED",
  "GONE",
  "SPA",
  "DEPRECATED",
  "STALE_SNAPSHOT",
  "STALE_CONFLICT",
  "REGION_BLOCKED",
  "TIME_DEPENDENT",
] as const;

/** 来源种类，对应探索 01 §7.3 的来源优先级（数值越小优先级越高）。 */
export const SourceKinds = ["pricing_page", "docs_help", "announcement", "console", "legal"] as const;
export type SourceKind = (typeof SourceKinds)[number];
export const SourceKindPriority: Record<(typeof SourceKinds)[number], number> = {
  pricing_page: 1,
  docs_help: 2,
  announcement: 3,
  console: 4,
  legal: 5,
};

// ---------------------------------------------------------------------------
// 基础构件
// ---------------------------------------------------------------------------

const QualityStatus = z.enum(QualityStatuses);
export type QualityStatus = (typeof QualityStatuses)[number];

const FailureCode = z.enum(FailureCodes);
export type FailureCode = (typeof FailureCodes)[number];

const statusesRequiringSource: ReadonlySet<QualityStatus> = new Set([
  "verified",
  "partial",
  "stale",
  "source_conflict",
]);
const statusesRequiringNullValue: ReadonlySet<QualityStatus> = new Set(["unobtainable", "not_applicable"]);

/**
 * 字段级可追溯值包装：value + 质量状态 + 官方原文（raw）+ 来源。
 * 未知（value=null + unobtainable）、零值（value=0 + verified）与
 * 不适用（value=null + not_applicable）由此在结构上可区分。
 */
function field<T extends z.ZodType>(value: T) {
  return z
    .strictObject({
      value: value.nullable(),
      status: QualityStatus,
      raw: z.string().optional(),
      note: z.string().optional(),
      failure_code: FailureCode.optional(),
      source_ids: z.array(z.string()),
    })
    .check((ctx) => {
      // 泛型成员在 zod 映射类型中丢失，运行时形状是稳定的，这里显式收窄。
      const f = ctx.value as PlanField<unknown>;
      if (f.value === null && !statusesRequiringNullValue.has(f.status)) {
        ctx.issues.push({
          code: "custom",
          message: `value 为 null 时 status 必须是 unobtainable 或 not_applicable（得到 ${f.status}）`,
          input: f,
        });
      }
      if (f.value !== null && statusesRequiringNullValue.has(f.status)) {
        ctx.issues.push({
          code: "custom",
          message: `status 为 ${f.status} 时 value 必须为 null`,
          input: f,
        });
      }
      if (statusesRequiringSource.has(f.status) && f.source_ids.length === 0) {
        ctx.issues.push({
          code: "custom",
          message: `status 为 ${f.status} 的字段必须给出至少一个 source_id`,
          input: f,
        });
      }
    });
}

export type PlanField<T> = {
  value: T | null;
  status: QualityStatus;
  raw?: string;
  note?: string;
  failure_code?: FailureCode;
  source_ids: string[];
};

function booleanField() {
  return field(z.boolean());
}
function stringField() {
  return field(z.string());
}
function numberField() {
  return field(z.number());
}

// ---------------------------------------------------------------------------
// 价格
// ---------------------------------------------------------------------------

const BillingPeriods = ["monthly", "quarterly", "annual", "weekly", "daily", "one_time"] as const;
export type BillingPeriod = (typeof BillingPeriods)[number];

const PriceEntry = z
  .strictObject({
    amount: field(z.number()),
    currency: field(z.string()),
    billing_period: z.enum(BillingPeriods),
    /** standard=标准价 / starting_at=官方起价 / promotional=限时促销 / discounted=折扣价。 */
    price_type: z.enum(["standard", "starting_at", "promotional", "discounted"]),
    effective_from: z.string().nullable(),
    effective_until: z.string().nullable(),
    status: QualityStatus,
    note: z.string().optional(),
    failure_code: FailureCode.optional(),
    source_ids: z.array(z.string()),
  })
  .check((ctx) => {
    const p = ctx.value as PriceEntry;
    if (p.amount.value !== null && p.currency.value === null) {
      ctx.issues.push({
        code: "custom",
        message: "价格金额非空时必须携带币种",
        input: p,
      });
    }
    if (p.amount.value === null && !statusesRequiringNullValue.has(p.status)) {
      ctx.issues.push({
        code: "custom",
        message: `价格金额为 null 时 status 必须是 unobtainable 或 not_applicable（得到 ${p.status}）`,
        input: p,
      });
    }
    if (p.amount.value !== null && statusesRequiringNullValue.has(p.status)) {
      ctx.issues.push({ code: "custom", message: `status 为 ${p.status} 时价格金额必须为 null`, input: p });
    }
    if (statusesRequiringSource.has(p.status) && p.source_ids.length === 0) {
      ctx.issues.push({ code: "custom", message: "该质量状态的价目必须给出至少一个 source_id", input: p });
    }
  });
export type PriceEntry = z.output<typeof PriceEntry>;

// ---------------------------------------------------------------------------
// 额度
// ---------------------------------------------------------------------------

const QuotaWindow = z.strictObject({
  window_type: z.enum(["5h_rolling", "weekly", "monthly", "daily", "other"]),
  /** 窗口起点口径：从消费起算 / 从订阅起算 / 自然周期。 */
  window_anchor: z.enum(["from_consumption", "from_subscription", "calendar", "unspecified"]).nullable(),
  amount: field(z.number()),
  unit: z.string().nullable(),
  status: QualityStatus,
  raw: z.string().optional(),
  note: z.string().optional(),
  failure_code: FailureCode.optional(),
  source_ids: z.array(z.string()),
});
export type QuotaWindow = z.output<typeof QuotaWindow>;

const QuotaSpec = z.strictObject({
  quota_model: z.enum(QuotaModels),
  windows: z.array(QuotaWindow),
});
export type QuotaSpec = z.output<typeof QuotaSpec>;

const ModelMultiplier = z.strictObject({
  model_code: z.string(),
  input: field(z.number()),
  cached_input: field(z.number()),
  output: field(z.number()),
});
export type ModelMultiplier = z.output<typeof ModelMultiplier>;

const McpMultiplier = z.strictObject({
  tool: z.string(),
  input: field(z.number()).optional(),
  cached_input: field(z.number()).optional(),
  output: field(z.number()),
});
export type McpMultiplier = z.output<typeof McpMultiplier>;

const CreditFormula = z.strictObject({
  raw: z.string(),
  divisor: z.number(),
});
export type CreditFormula = z.output<typeof CreditFormula>;

/** 采集级额度体系：credits × 模型乘数的结构化原语，原始表达保留在 raw 中。 */
const QuotaSystem = z.strictObject({
  quota_model: z.enum(QuotaModels),
  unit: stringField(),
  formula: field(CreditFormula),
  model_multipliers: z.array(ModelMultiplier),
  mcp_multipliers: z.array(McpMultiplier),
  off_peak_discount: field(z.number()),
  peak_hours: stringField(),
});
export type QuotaSystem = z.output<typeof QuotaSystem>;

// ---------------------------------------------------------------------------
// 模型生命周期
// ---------------------------------------------------------------------------

const ModelAvailability = z.strictObject({
  /** "all" 或引用 plan_id 的数组。 */
  plans: z.union([z.literal("all"), z.array(z.string())]),
  /** supported=可直调 / routed=请求被路由到其他模型 / unavailable=不可用。 */
  state: z.enum(["supported", "routed", "unavailable"]),
  routed_to: z.string().nullable().default(null),
  status: QualityStatus,
  raw: z.string().optional(),
  note: z.string().optional(),
  failure_code: FailureCode.optional(),
  source_ids: z.array(z.string()),
}).check((ctx) => {
  const a = ctx.value as ModelAvailability;
  if (a.state === "routed" && a.routed_to === null) {
    ctx.issues.push({ code: "custom", message: "state 为 routed 时必须给出 routed_to", input: a });
  }
});
export type ModelAvailability = z.output<typeof ModelAvailability>;

const ModelEntry = z.strictObject({
  model_code: z.string(),
  release_date: stringField(),
  deprecation_date: stringField(),
  availability: z.array(ModelAvailability),
});
export type ModelEntry = z.output<typeof ModelEntry>;

// ---------------------------------------------------------------------------
// 地区可用性（五维独立建模，禁止合并为单一支持/不支持）
// ---------------------------------------------------------------------------

const AvailabilityDim = z.strictObject({
  state: z.enum(["officially_available", "officially_restricted", "officially_conditional", "unconfirmed"]),
  status: QualityStatus,
  evidence_raw: z.string().optional(),
  note: z.string().optional(),
  failure_code: FailureCode.optional(),
  source_ids: z.array(z.string()),
});
export type AvailabilityDim = z.output<typeof AvailabilityDim>;

const RegionalAvailability = z.strictObject({
  region_code: z.string(),
  registration: AvailabilityDim,
  payment: AvailabilityDim,
  network_access: AvailabilityDim,
  service_policy: AvailabilityDim,
  feature_restrictions: AvailabilityDim,
});
export type RegionalAvailability = z.output<typeof RegionalAvailability>;

// ---------------------------------------------------------------------------
// 数据政策
// ---------------------------------------------------------------------------

const TrainingUse = z.strictObject({
  value: z.strictObject({ allowed: z.boolean() }).nullable(),
  status: QualityStatus,
  raw: z.string().optional(),
  note: z.string().optional(),
  failure_code: FailureCode.optional(),
  source_ids: z.array(z.string()),
});
export type TrainingUse = z.output<typeof TrainingUse>;

const DataPolicy = z.strictObject({
  training_use: TrainingUse,
  processing_location: stringField(),
  data_retention: stringField(),
  zdr_offered: booleanField(),
});
export type DataPolicy = z.output<typeof DataPolicy>;

// ---------------------------------------------------------------------------
// Plan 与采集文档
// ---------------------------------------------------------------------------

const Plan = z.strictObject({
  plan_id: z.string(),
  plan_name: z.string(),
  plan_type: z.enum(PlanTypes),
  audience: z.enum(["individual", "team"]).nullable(),
  price_list: z.array(PriceEntry),
  quota: QuotaSpec,
  rate_limits: stringField(),
  context_window_tokens: numberField(),
  refund_policy: stringField(),
  cancellation_notice: stringField(),
  purchase_url: stringField(),
  data_policy: DataPolicy,
});
export type Plan = z.output<typeof Plan>;

const SourceRef = z.strictObject({
  source_id: z.string(),
  url: z.string().url(),
  source_kind: z.enum(SourceKinds),
  /** 采集方抓取时间（ISO 8601）。 */
  fetched_at: z.string(),
  /** 页面自述的更新/发布时间；null 表示页面未显示（以 fetched_at 为准）。 */
  last_updated_at: z.string().nullable(),
  last_updated_note: z.string().optional(),
  http_status: z.number().optional(),
  failure_code: FailureCode.optional(),
});
export type SourceRef = z.output<typeof SourceRef>;

const UnresolvedFact = z.strictObject({
  fact: z.string(),
  reason: z.string(),
  failure_code: FailureCode.optional(),
  how_to_resolve: z.string().optional(),
});
export type UnresolvedFact = z.output<typeof UnresolvedFact>;

const SourceChainAttempt = z.strictObject({
  source_id: z.string(),
  kind: z.enum(SourceKinds),
  /** 是否成功获取（http_status=200 且 body 非空）。 */
  ok: z.boolean(),
  failure_code: FailureCode.optional(),
  http_status: z.number().optional(),
  error_note: z.string().optional(),
});
export type SourceChainAttempt = z.output<typeof SourceChainAttempt>;

const SourceChainRef = z.strictObject({
  /** 回退链标识；同一 Provider 内唯一。 */
  chain_id: z.string(),
  /** 回退链意图：覆盖哪类事实（"价目" / "积分规则" / "法律条款"）。 */
  purpose: z.string(),
  /** 按优先级升序排列的尝试记录；首条为首选来源。 */
  attempts: z.array(SourceChainAttempt).min(1),
  /** 链内首个 ok=true 的 source_id；整链失败时为 null。 */
  chosen_source_id: z.string().nullable(),
}).check((ctx) => {
  const c = ctx.value as SourceChainRef;
  const sourceIds = new Set(c.attempts.map((a) => a.source_id));
  if (c.chosen_source_id !== null && !sourceIds.has(c.chosen_source_id)) {
    ctx.issues.push({
      code: "custom",
      message: `chosen_source_id ${c.chosen_source_id} 不在 attempts 列表内`,
      input: c,
    });
  }
  const okAttempts = c.attempts.filter((a) => a.ok);
  if (c.chosen_source_id === null && okAttempts.length > 0) {
    ctx.issues.push({
      code: "custom",
      message: "chosen_source_id 为 null 时 attempts 中不应有 ok=true 的来源",
      input: c,
    });
  }
  if (c.chosen_source_id !== null && okAttempts.length === 0) {
    ctx.issues.push({
      code: "custom",
      message: "chosen_source_id 非 null 时 attempts 中至少应有一条 ok=true",
      input: c,
    });
  }
});
export type SourceChainRef = z.output<typeof SourceChainRef>;

const Promotion = z.strictObject({
  description: z.string(),
  kind: z.enum(["quota", "price"]),
  effective_from: z.string().nullable(),
  effective_until: z.string().nullable(),
  status: QualityStatus,
  raw: z.string().optional(),
  note: z.string().optional(),
  failure_code: FailureCode.optional(),
  source_ids: z.array(z.string()),
});
export type Promotion = z.output<typeof Promotion>;

const RegionalVariant = z.strictObject({
  variant_id: z.string(),
  operator_entity: stringField(),
  jurisdiction: stringField(),
});
export type RegionalVariant = z.output<typeof RegionalVariant>;

/**
 * Plan Schema v1：一次 Data Provider 采集的完整输出。
 * 同一公司的不同 Regional Variant 各自独立建模（CONTEXT.md）。
 */
export const PlanCollection = z.strictObject({
  schema_version: z.literal("1"),
  collection: z.strictObject({
    provider_id: z.string(),
    mode: z.enum(["fixture", "live"]),
    collected_at: z.string(),
    tool_version: z.string(),
  }),
  vendor: z.strictObject({
    vendor_id: z.string(),
    display_name: z.string(),
  }),
  regional_variant: RegionalVariant.nullable(),
  /** 官方声明的支付通道（全套餐通用）；notes 保留 3DS 等重要限制原文。 */
  payment: z.strictObject({
    methods: z.array(z.string()),
    notes: z.array(z.string()),
  }),
  quota_system: QuotaSystem,
  models: z.array(ModelEntry),
  plans: z.array(Plan).min(1),
  regional_availability: z.array(RegionalAvailability),
  promotions: z.array(Promotion),
  sources: z.array(SourceRef).min(1),
  /**
   * 回退链快照：每条链记录首选与备选入口的抓取结果与最终采纳。
   * 失败原因、实际使用的来源与回退路径可从本字段追溯（tpa CLI 输出契约）。
   */
  source_chains: z.array(SourceChainRef),
  unresolved_facts: z.array(UnresolvedFact),
});
export type PlanCollection = z.output<typeof PlanCollection>;

// ---------------------------------------------------------------------------
// 校验入口
// ---------------------------------------------------------------------------

export type ValidationResult =
  | { ok: true; value: PlanCollection }
  | { ok: false; issues: string[] };

/** 采集输出必须通过 Plan Schema v1 校验后才允许发出（CLI 的最后一道闸）。 */
export function validatePlanCollection(input: unknown): ValidationResult {
  const result = PlanCollection.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return {
    ok: false,
    issues: result.error.issues.map(
      (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
    ),
  };
}

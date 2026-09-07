import type {
  FailureCode,
  PlanCollection,
  PlanField,
  QualityStatus,
  QuotaModel,
  SourceRef,
  UnresolvedFact,
} from "../../schema/plan.ts";
import type { RawSnapshot } from "./load.ts";
import { SRC } from "./sources.ts";
import { extractFacts, extractStatedDate, type ExtractedFacts } from "./extract.ts";

const STALE_PRICE_NOTE = "2026-04-21 迁移公告所载官方价目，公告原文标注 based on current pricing, for reference only";

/** 官方原文 + 来源齐全的已验证字段。 */
function verified<T>(value: T, raw: string | undefined, sourceIds: string[]): PlanField<T> {
  return {
    value,
    status: "verified",
    ...(raw !== undefined ? { raw } : {}),
    source_ids: sourceIds,
  };
}

function unobtainable<T>(failureCode?: FailureCode, note?: string): PlanField<T> {
  return {
    value: null,
    status: "unobtainable",
    source_ids: [],
    ...(failureCode ? { failure_code: failureCode } : {}),
    ...(note ? { note } : {}),
  };
}

const OVERVIEW_IDS = [SRC.overview];

/** 结构化乘数条目：每个数字都携带命中的原文。 */
function multiplierField(value: number | null, raw: string, sourceIds: string[]): PlanField<number> {
  if (value === null) return unobtainable();
  return { value, status: "verified", raw, source_ids: sourceIds };
}

interface TierSpec {
  plan_id: string;
  plan_name: string;
  label: string;
  audience: "individual" | "team";
  /** 2026-04-21 迁移公告中的历史价（现价不可得时的最近官方口径）。 */
  legacy: { monthly: number; quarterly: number; annual: number } | null;
}

const TIERS: TierSpec[] = [
  { plan_id: "zai-glm-coding-lite", plan_name: "GLM Coding Plan Lite", label: "Lite", audience: "individual", legacy: { monthly: 18, quarterly: 48.6, annual: 172.8 } },
  { plan_id: "zai-glm-coding-pro", plan_name: "GLM Coding Plan Pro", label: "Pro", audience: "individual", legacy: { monthly: 72, quarterly: 194.4, annual: 691.2 } },
  { plan_id: "zai-glm-coding-max", plan_name: "GLM Coding Plan Max", label: "Max", audience: "individual", legacy: { monthly: 160, quarterly: 432, annual: 1536 } },
  { plan_id: "zai-glm-team-standard-seat", plan_name: "GLM Coding Plan Team — Standard Seat", label: "Standard Seat", audience: "team", legacy: null },
  { plan_id: "zai-glm-team-premium-seat", plan_name: "GLM Coding Plan Team — Premium Seat", label: "Premium Seat", audience: "team", legacy: null },
];

/** 页面自述时间戳的抽取标签（法律条款 "Last Update" / 公告 "Publication date"）。 */
const STATED_DATE_LABELS: Record<string, string[]> = {
  [SRC.terms]: ["\\*\\*Last Update"],
  [SRC.privacy]: ["\\*\\*Last Update"],
  [SRC.usageRevision]: ["Publication date"],
  [SRC.transition]: ["Publication date"],
};

export function normalizeCollection(input: {
  snapshots: RawSnapshot[];
  facts: ExtractedFacts;
  mode: "fixture" | "live";
  collectedAt: string;
  toolVersion: string;
}): PlanCollection {
  const { snapshots, facts, mode, collectedAt, toolVersion } = input;
  const overviewIds = OVERVIEW_IDS;

  // ---- 额度体系（credits × 模型乘数） ----
  const modelMultipliers = facts.multipliers
    .filter((m) => !m.is_mcp)
    .map((m) => ({
      model_code: m.product_name,
      input: multiplierField(m.input, String(m.input ?? m.raw), overviewIds),
      cached_input: multiplierField(m.cached_input, String(m.cached_input ?? m.raw), overviewIds),
      output: multiplierField(m.output, String(m.output), overviewIds),
    }));
  const mcpMultipliers = facts.multipliers
    .filter((m) => m.is_mcp)
    .map((m) => ({
      tool: m.product_name,
      output: multiplierField(m.output, String(m.output), overviewIds),
    }));

  const quotaSystem: PlanCollection["quota_system"] = {
    quota_model: "credits_5h_weekly",
    unit: verified("credits", "credits", overviewIds),
    formula: facts.formulas.model_credit_raw
      ? verified(
          { raw: facts.formulas.model_credit_raw, divisor: facts.formulas.divisor ?? 0 },
          facts.formulas.model_credit_raw,
          overviewIds,
        )
      : unobtainable(),
    model_multipliers: modelMultipliers,
    mcp_multipliers: mcpMultipliers,
    off_peak_discount: facts.offPeak
      ? multiplierField(facts.offPeak.discount, facts.offPeak.raw, overviewIds)
      : unobtainable(),
    peak_hours: facts.offPeak?.peak_hours_raw
      ? verified(facts.offPeak.peak_hours_raw, facts.offPeak.peak_hours_raw, overviewIds)
      : unobtainable(),
  };

  // ---- 模型清单与生命周期 ----
  const models: PlanCollection["models"] = [];
  for (const code of facts.models.supported) {
    models.push({
      model_code: code,
      release_date: unobtainable(undefined, "官方文档未给出模型发布日期"),
      deprecation_date: unobtainable(),
      availability: [
        {
          plans: "all",
          state: "supported",
          routed_to: null,
          status: "verified",
          raw: `All plans support ${facts.models.supported.join(", ")}.`,
          source_ids: overviewIds,
        },
      ],
    });
  }
  for (const routed of facts.models.routed) {
    models.push({
      model_code: routed.model_code,
      release_date: unobtainable(undefined, "官方文档未给出模型发布日期"),
      deprecation_date: unobtainable(undefined, "官方仅声明请求被路由，未给出弃用日期"),
      availability: [
        {
          plans: "all",
          state: "routed",
          routed_to: routed.routed_to,
          status: "verified",
          raw: routed.raw,
          source_ids: overviewIds,
        },
      ],
    });
  }
  // 订阅页 meta 列出但文档未确认的模型 → 来源冲突，不静默择一
  const knownCodes = new Set([
    ...facts.models.supported,
    ...facts.models.routed.map((r) => r.model_code),
  ]);
  for (const code of facts.subscribeMeta?.models ?? []) {
    if (knownCodes.has(code)) continue;
    models.push({
      model_code: code,
      release_date: unobtainable(),
      deprecation_date: unobtainable(),
      availability: [
        {
          plans: "all",
          state: "unavailable",
          routed_to: null,
          status: "source_conflict",
          note: "订阅页 meta 列出该模型，但 devpack 文档的 Supported Models 未列出；是否可直调无法确认",
          source_ids: [SRC.subscribe, SRC.overview],
        },
      ],
    });
  }

  // ---- 五档套餐 ----
  const plans: PlanCollection["plans"] = TIERS.map((tier) => {
    const quotaRow =
      tier.audience === "individual"
        ? facts.quotasIndividual.find((r) => r.plan_label === tier.label)
        : facts.quotasTeam.find((r) => r.plan_label === tier.label);

    const windows: PlanCollection["plans"][number]["quota"]["windows"] = [];
    if (quotaRow) {
      const sourceIds =
        tier.audience === "individual" ? [SRC.overview] : [SRC.teamplan];
      windows.push(
        {
          window_type: "5h_rolling",
          window_anchor: "from_consumption",
          amount: verified(quotaRow.five_hour, quotaRow.raw, sourceIds),
          unit: "credits",
          status: "verified",
          source_ids: sourceIds,
        },
        {
          window_type: "weekly",
          window_anchor: "from_subscription",
          amount: verified(quotaRow.weekly, quotaRow.raw, sourceIds),
          unit: "credits",
          status: "verified",
          raw: "resets every 7 days",
          source_ids: sourceIds,
        },
      );
    } else {
      windows.push({
        window_type: "5h_rolling",
        window_anchor: "from_consumption",
        amount: unobtainable(),
        unit: "credits",
        status: "unobtainable",
        source_ids: [],
      });
    }

    // ---- 价格 ----
    const priceList: PlanCollection["plans"][number]["price_list"] = [];
    if (tier.label === "Lite" && facts.startingPrice) {
      priceList.push({
        amount: verified(facts.startingPrice.amount, facts.startingPrice.raw, [
          SRC.overview,
          SRC.subscribe,
        ]),
        currency: verified(facts.startingPrice.currency, facts.startingPrice.raw, [SRC.overview]),
        billing_period: "monthly",
        price_type: "starting_at",
        effective_from: null,
        effective_until: null,
        status: "verified",
        source_ids: [SRC.overview, SRC.subscribe],
      });
    } else if (tier.label !== "Lite") {
      // 现价未从官方静态渠道确认：显式未知，归因 LOGIN_REQUIRED
      priceList.push({
        amount: unobtainable("LOGIN_REQUIRED", "z.ai/subscribe 正文为客户端渲染，现价需登录后核验"),
        currency: unobtainable(),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "unobtainable",
        failure_code: "LOGIN_REQUIRED",
        source_ids: [],
      });
    }
    if (tier.legacy) {
      const legacyTable = facts.legacyPrices;
      const legacyFor = (period: "monthly" | "quarterly" | "annual") =>
        legacyTable.find((t) => t.billing_period === period)?.prices.find((p) => p.plan_label === tier.label);
      for (const period of ["monthly", "quarterly", "annual"] as const) {
        const entry = legacyFor(period);
        priceList.push({
          amount: verified(entry?.amount ?? tier.legacy[period], entry?.raw ?? String(tier.legacy[period]), [
            SRC.transition,
          ]),
          currency: verified("USD", "USD", [SRC.transition]),
          billing_period: period,
          price_type: "standard",
          effective_from: null,
          effective_until: null,
          status: "stale",
          note: STALE_PRICE_NOTE,
          source_ids: [SRC.transition],
        });
      }
    }

    // ---- 数据政策（按受众区分） ----
    const trainingUse: PlanField<{ allowed: boolean }> = facts.dataPolicy.individual_training_raw
      ? {
          value: { allowed: tier.audience === "individual" ? true : false },
          status: "verified",
          raw:
            tier.audience === "individual"
              ? facts.dataPolicy.individual_training_raw
              : facts.dataPolicy.team_training_raw ?? facts.dataPolicy.individual_training_raw,
          source_ids:
            tier.audience === "individual" ? [SRC.terms] : [SRC.teamplan],
        }
      : unobtainable();

    return {
      plan_id: tier.plan_id,
      plan_name: tier.plan_name,
      plan_type: "coding-subscription",
      audience: tier.audience,
      price_list: priceList,
      quota: {
        quota_model: "credits_5h_weekly" as QuotaModel,
        windows,
      },
      rate_limits: {
        value:
          "并发限额绑定套餐档位（Max > Pro > Lite），平台按资源可用性动态调整；非高峰时段动态提升。数值化限额仅登录后台可见。",
        status: "partial",
        source_ids: [SRC.usagePolicy],
      } satisfies PlanField<string>,
      context_window_tokens: unobtainable(undefined, "Coding Plan 官方文档未给出上下文窗口数值"),
      refund_policy: facts.refund
        ? verified("购买确认后不支持退款", facts.refund, [SRC.usagePolicy])
        : unobtainable(),
      cancellation_notice:
        facts.cancellation.usage_policy_raw && facts.cancellation.faq_raw
          ? facts.cancellation.usage_policy_raw === facts.cancellation.faq_raw
            ? verified(
                `at least ${facts.cancellation.usage_policy_raw} before next billing date`,
                facts.cancellation.usage_policy_raw,
                [SRC.usagePolicy],
              )
            : {
                value: `Usage Policy: at least ${facts.cancellation.usage_policy_raw}; FAQ: at least ${facts.cancellation.faq_raw}`,
                status: "source_conflict" as QualityStatus,
                raw: `Usage Policy: "${facts.cancellation.usage_policy_raw}"; FAQ: "${facts.cancellation.faq_raw}"`,
                source_ids: [SRC.usagePolicy, SRC.faq],
              }
          : unobtainable(),
      purchase_url: verified(
        "https://z.ai/subscribe",
        "Log in to the Z.ai API Platform → Payment Method → Subscription",
        [SRC.usagePolicy],
      ),
      data_policy: {
        training_use: trainingUse,
        processing_location: facts.dataPolicy.processing_location
          ? verified(facts.dataPolicy.processing_location, facts.dataPolicy.processing_location, [
              SRC.privacy,
            ])
          : unobtainable(),
        data_retention: unobtainable(undefined, "官方未给出明确的内容保留期限"),
        zdr_offered: unobtainable(undefined, "官方未声明零数据保留（ZDR）选项"),
      },
    };
  });

  // ---- 五维地区可用性 ----
  const unconfirmedNote = "已核查 ToS/Privacy/Subscription Terms/FAQ：官方未发布针对该维度的中国大陆专项声明；页面不可达不作为限制的证据";
  const cnEntry: PlanCollection["regional_availability"][number] = {
    region_code: "CN",
    registration: {
      state: "unconfirmed",
      status: "unobtainable",
      note: unconfirmedNote,
      source_ids: [],
    },
    payment: {
      state: "unconfirmed",
      status: "unobtainable",
      note: "官方支付示例为 bank card or PayPal，未公布可用卡种国家清单；支付宝/微信未见于官方页",
      source_ids: [],
    },
    network_access: {
      state: "unconfirmed",
      status: "unobtainable",
      note: unconfirmedNote,
      source_ids: [],
    },
    service_policy: {
      state: "unconfirmed",
      status: "unobtainable",
      evidence_raw: facts.exportControl?.raw,
      note: "出口管制禁用地区不含中国大陆",
      source_ids: facts.exportControl ? [SRC.terms] : [],
    },
    feature_restrictions: {
      state: "unconfirmed",
      status: "unobtainable",
      note: unconfirmedNote,
      source_ids: [],
    },
  };

  const regionCodes: Record<string, string> = {
    Iran: "IR",
    "North Korea": "KP",
    Cuba: "CU",
    Crimea: "UA-CRIMEA",
    Donetsk: "UA-DONETSK",
    Zaporizhzhia: "UA-ZAPORIZHZHIA",
  };
  const restrictedRegions: PlanCollection["regional_availability"] = (facts.exportControl?.regions ?? [])
    .map((name) => {
      // 未映射到 ISO 风格代码的地区不静默丢弃：退化为原文 slug
      const code = regionCodes[name] ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return {
        region_code: code,
        registration: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
        payment: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
        network_access: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
        service_policy: {
          state: "officially_restricted",
          status: "verified",
          evidence_raw: facts.exportControl?.raw,
          source_ids: [SRC.terms],
        },
        feature_restrictions: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
      } satisfies PlanCollection["regional_availability"][number];
    })
    .filter((r) => r !== null);

  // ---- 限时促销 ----
  const promotions: PlanCollection["promotions"] = facts.campaign
    ? [
        {
          description:
            "GLM-5.3-Flash Usage Campaign：活动期内每日 23:00–09:00（UTC+8），经 ZCode 使用 GLM-5.3-Flash 零配额消耗，其他支持的工具配额翻倍",
          kind: "quota",
          effective_from: facts.campaign.effective_from,
          effective_until: facts.campaign.effective_until,
          status: "verified",
          raw: facts.campaign.raw,
          source_ids: [SRC.eventFlash],
        },
      ]
    : [];

  // ---- 来源清单（三时间戳） ----
  const sources: SourceRef[] = snapshots.map((snapshot) => {
    const labels = STATED_DATE_LABELS[snapshot.source_id];
    const stated = labels ? extractStatedDate(snapshot.body, labels) : null;
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      source_kind: snapshot.kind,
      fetched_at: snapshot.fetched_at,
      last_updated_at: stated,
      last_updated_note:
        stated === null
          ? "页面未显示更新时间，以采集时间为准"
          : snapshot.kind === "announcement"
            ? "页面显示 Publication date"
            : "页面显示 Last Update",
      http_status: snapshot.http_status,
      failure_code: snapshot.failure_code,
    };
  });

  // ---- Unresolved Facts ----
  const unresolvedFacts: UnresolvedFact[] = [
    {
      fact: "新 credits 制下 Pro/Max 套餐现价（含季付/年付折扣）",
      reason:
        "z.ai/subscribe 正文为重度客户端渲染（RENDER_DEPENDENT），fixture/静态抓取仅能核验 meta；现价另需登录后台才能确认（LOGIN_REQUIRED）",
      failure_code: "LOGIN_REQUIRED",
      how_to_resolve: "登录 z.ai/subscribe 或控制台订阅页读取当前价目",
    },
    {
      fact: "Team Plan Standard/Premium Seat 的当前价格",
      reason: "同上，需登录核验",
      failure_code: "LOGIN_REQUIRED",
      how_to_resolve: "登录 z.ai/subscribe 切换 Team 视图读取",
    },
    {
      fact: "模型的上下文窗口数值",
      reason: "devpack 全部文档页未给出上下文窗口；官方文档缺失",
    },
    {
      fact: "数值化并发/速率限制（RPM 或并发数）",
      reason: "官方仅给出口径（Max > Pro > Lite、动态调整、非高峰提升），数值仅在登录后台 rate-limits 页",
      failure_code: "LOGIN_REQUIRED",
      how_to_resolve: "登录 z.ai/manage-apikey/rate-limits 查看",
    },
    {
      fact: "GLM-5-Turbo 是否仍可在 Coding Plan 内直调",
      reason: "订阅页 meta 列出该模型，devpack 文档 Supported Models 未列出（来源冲突）",
      failure_code: "STALE_CONFLICT",
    },
    {
      fact: "中国大陆用户注册/支付 z.ai 的实际可行性",
      reason: "官方未发布中国大陆专项条款（注册、支付卡种清单、端点可达性均无声明）；不猜测",
      how_to_resolve: "需要用户实机补充信息",
    },
    {
      fact: "GLM-4.6V（Vision Understanding MCP）不再有独立乘数行",
      reason:
        "2026-09 上旬快照的乘数表中 Vision Understanding 已并入 GLM-5.3-Flash 行（含视觉 MCP 字样），独立 1.2/0.3/2.7 乘数行不再出现；以采集时刻文档为准",
    },
    {
      fact: "bigmodel.cn 中国区是否在售同类 GLM Coding Plan 及其定价",
      reason: "中国区为独立 Regional Variant（独立主体/币种/法域），不属于本 Provider 采集范围",
    },
  ];

  return {
    schema_version: "1",
    collection: {
      provider_id: "zai-glm-coding-plan",
      mode,
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    vendor: { vendor_id: "zhipu-ai", display_name: "Z.ai（智谱）" },
    regional_variant: {
      variant_id: "z-ai-international",
      operator_entity: verified(
        "JINGSHENG HENGXING TECHNOLOGY PTE.LTD",
        "JINGSHENG HENGXING TECHNOLOGY PTE.LTD",
        [SRC.terms],
      ),
      jurisdiction: verified("Singapore", "shall be governed by the laws of Singapore", [
        SRC.terms,
      ]),
    },
    payment: {
      methods: facts.payment.methods,
      notes: facts.payment.three_ds_note ? [facts.payment.three_ds_note] : [],
    },
    quota_system: quotaSystem,
    models,
    plans,
    regional_availability: [cnEntry, ...restrictedRegions],
    promotions,
    sources,
    unresolved_facts: unresolvedFacts,
  };
}

/** 供 normalize 使用的 facts 抽取入口（保持纯函数边界清晰）。 */
export function normalizeFromSnapshots(snapshots: RawSnapshot[], mode: "fixture" | "live", collectedAt: string, toolVersion: string): PlanCollection {
  return normalizeCollection({
    snapshots,
    facts: extractFacts(snapshots),
    mode,
    collectedAt,
    toolVersion,
  });
}

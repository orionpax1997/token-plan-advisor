import type {
  PlanCollection,
  PlanCollectionPayload,
  PlanField,
  QuotaWindow,
  SourceRef,
  UnresolvedFact,
} from "../../../schema/plan.ts";
import type { FailureCode } from "../../../schema/plan.ts";
import type { RawSnapshot } from "../../_shared.ts";
import { deriveSourceChains } from "../../_shared.ts";
import { extractFacts, extractStatedDate, type Attributed, type ExtractedFacts } from "./extract.ts";
import { CURSOR_START_CHAINS, CURSOR_START_SOURCES } from "./sources.ts";

/** 已验证字段的工厂：value + raw + source_ids。 */
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

function notApplicable<T>(note?: string): PlanField<T> {
  return {
    value: null,
    status: "not_applicable",
    source_ids: [],
    ...(note ? { note } : {}),
  };
}

/** 归因结果 → 字段级 source_ids；未命中时回退为链候选数组。 */
function srcOf<T>(attributed: Attributed<T>, chainId: string): string[] {
  if (attributed.sourceId) return [attributed.sourceId];
  const chain = CURSOR_START_CHAINS.find((c) => c.chain_id === chainId);
  return chain?.source_ids ?? [];
}

export function normalizeCollection(input: {
  snapshots: RawSnapshot[];
  facts: ExtractedFacts;
  mode: "fixture" | "live";
  collectedAt: string;
  toolVersion: string;
}): PlanCollectionPayload {
  const { snapshots, facts, mode, collectedAt, toolVersion } = input;
  const { chains: sourceChainsOut, resolution } = deriveSourceChains(snapshots, CURSOR_START_CHAINS);

  function chainSrc(chainId: string): string[] {
    const chosen = resolution.get(chainId);
    if (chosen) return [chosen];
    const chain = CURSOR_START_CHAINS.find((c) => c.chain_id === chainId);
    return chain?.source_ids ?? [];
  }

  const pricingIds = chainSrc("cursor-start-pricing");
  const availabilityIds = chainSrc("cursor-start-availability");
  const priceFactIds = srcOf(facts.pricing, "cursor-start-pricing");
  const indiaOnlyIds = srcOf(facts.indiaOnly, "cursor-start-availability");

  // ---- 双池不适用于 Start：仅有第一方模型用量，无美元等值池、无 on-demand ----
  const windows: QuotaWindow[] = [
    {
      window_type: "monthly",
      window_anchor: "from_subscription",
      amount: unobtainable(undefined, "官方未公布 Start 档用量数值口径"),
      unit: "first-party model usage（Cursor Start，仅第一方模型）",
      status: "unobtainable",
      raw: facts.firstPartyOnly.fact?.firstPartyOnly ?? facts.firstPartyOnly.fact?.grokEffort ?? undefined,
      note: "Cursor Start 不含 Other Models 美元等值池，亦无 on-demand 溢出计费；与全球档的 usd_equivalence 原语不可比，故不混入 USD 主体数据",
      source_ids: facts.firstPartyOnly.sourceId ? srcOf(facts.firstPartyOnly, "cursor-start-pricing") : [],
    },
  ];

  const plan: PlanCollection["plans"][number] = {
    plan_id: "cursor-start",
    plan_name: "Cursor Start",
    plan_type: "coding-subscription",
    audience: "individual",
    price_list: [
      facts.pricing.fact
        ? {
            amount: verified(facts.pricing.fact.monthlyInr, facts.pricing.fact.raw, priceFactIds),
            currency: verified("INR", "₹（印度卢比，税含价）", priceFactIds),
            billing_period: "monthly",
            price_type: "standard",
            effective_from: null,
            effective_until: null,
            status: "verified",
            note: facts.pricing.fact.taxInclusive ? "税含价（tax-inclusive）；无年付口径" : "无年付口径",
            source_ids: priceFactIds,
          }
        : {
            amount: unobtainable(undefined, "官方来源未给出 Start 月价"),
            currency: verified("INR", "₹（印度卢比）", priceFactIds),
            billing_period: "monthly",
            price_type: "standard",
            effective_from: null,
            effective_until: null,
            status: "unobtainable",
            source_ids: priceFactIds,
          },
    ],
    quota: {
      // Start 仅含第一方模型用量：不是美元等值池，选 usage_tier 表达"档位内含用量"
      quota_model: "usage_tier",
      windows,
    },
    rate_limits: facts.firstPartyOnly.fact?.grokEffort
      ? verified(
          "Grok 固定 medium effort（档位内固定推理力度）",
          facts.firstPartyOnly.fact.grokEffort,
          srcOf(facts.firstPartyOnly, "cursor-start-pricing"),
        )
      : unobtainable(undefined, "官方未公布 Start 档速率/推理力度数值以外的口径"),
    context_window_tokens: unobtainable(undefined, "官方未公布 Start 档上下文窗口数值"),
    refund_policy: unobtainable(undefined, "官方抓取内容未给出 Start 档退款条款"),
    cancellation_notice: unobtainable(undefined, "官方抓取内容未给出 Start 档取消条款"),
    purchase_url: verified(
      "https://cursor.com/dashboard/billing",
      "Start 订购/管理经登录后 Dashboard（INR 结算）",
      pricingIds,
    ),
    data_policy: {
      training_use: unobtainable(
        undefined,
        "Cursor Start 专页未单独披露训练政策；账号级 Privacy Mode/ToS §1.3 政策见 anysphere-cursor 主采集",
      ),
      processing_location: unobtainable(undefined, "官方未披露 Start 档处理位置"),
      data_retention: unobtainable(undefined, "Cursor Start 专页未单独披露保留政策；账号级 ZDR 口径见 anysphere-cursor 主采集"),
      zdr_offered: unobtainable(undefined, "Start 专页未单独声明 ZDR；账号级口径见 anysphere-cursor 主采集"),
    },
  };

  // ---- 来源清单（三时间戳）----
  const sources: SourceRef[] = snapshots.map((snapshot) => {
    const stated = extractStatedDate(snapshot.body);
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      source_kind: snapshot.kind,
      fetched_at: snapshot.fetched_at,
      last_updated_at: stated,
      ...(stated
        ? { last_updated_note: "页面显示发布/更新时间" }
        : { last_updated_note: "页面未显示更新时间（帮助中心/文档页均无页面级时间戳），以采集时间为准" }),
      http_status: snapshot.http_status,
      ...(snapshot.failure_code !== undefined ? { failure_code: snapshot.failure_code } : {}),
    };
  });
  sources.sort((a, b) => {
    const orderA = CURSOR_START_SOURCES.findIndex((s) => s.source_id === a.source_id);
    const orderB = CURSOR_START_SOURCES.findIndex((s) => s.source_id === b.source_id);
    return orderA - orderB;
  });

  // ---- 五维地区可用性（IN：Start 的唯一运营地区）----
  const regional_availability: PlanCollection["regional_availability"] = [
    {
      region_code: "IN",
      registration: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw:
          facts.phoneVerification.fact ?? "须验证印度手机号（Indian phone number verification）",
        note: "仅限印度；须印度手机号验证",
        source_ids: srcOf(facts.phoneVerification, "cursor-start-pricing"),
      },
      payment: {
        state: "officially_available",
        status: "verified",
        evidence_raw: [
          facts.payment.fact?.upi ? `UPI` : null,
          facts.payment.fact?.cards ?? "Indian credit and debit cards（3D Secure authentication is required）",
        ]
          .filter(Boolean)
          .join("；"),
        note: "INR 税含价结算；3DS 强制",
        source_ids: srcOf(facts.payment, "cursor-start-pricing"),
      },
      network_access: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw:
          facts.indiaOnly.fact?.vpn ??
          "If you access Cursor from outside India or use a VPN, your requests may be blocked",
        note: "官方具备并声明了地区访问控制（反 VPN）；证明该机制对 Start 档生效",
        source_ids: indiaOnlyIds,
      },
      service_policy: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw:
          facts.indiaOnly.fact?.onlyIndia ?? "Cursor Start is only available in India",
        note: "印度专属区域档；官方表态 availability may expand to more regions over time（属意向表述，非承诺）",
        source_ids: indiaOnlyIds,
      },
      feature_restrictions: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw: [
          facts.firstPartyOnly.fact?.firstPartyOnly ?? "仅含第一方模型（Cursor 自研/Grok 联训系列）",
          facts.noOnDemand.fact,
          facts.firstPartyOnly.fact?.grokEffort,
        ]
          .filter(Boolean)
          .join("；"),
        note: "无 Other Models 第三方池、无 on-demand；功能集为全球档子集",
        source_ids: srcOf(facts.firstPartyOnly, "cursor-start-pricing"),
      },
    },
  ];

  // ---- Unresolved Facts ----
  const unresolvedFacts: UnresolvedFact[] = [];

  unresolvedFacts.push(
    {
      fact: "Cursor Start 档用量限额的数值口径",
      reason: "官方仅描述档位构成（第一方模型、Grok 固定 medium effort），未公布数值",
      how_to_resolve: "关注 cursor.com/help/account-and-billing/cursor-start 更新",
    },
    {
      fact: "Cursor Start 是否提供年付",
      reason: "官方页面仅给 ₹649/月税含价，未提及年付选项",
    },
    {
      fact: "Cursor Start 的运营主体是否为独立印度主体",
      reason: "官方未声明独立印度主体；产品由 Anysphere 运营、印度专属运营，法域按印度限定",
      how_to_resolve: "关注官方公告或印度实体注册信息披露",
    },
  );

  return {
    schema_version: "1",
    collection: {
      provider_id: "anysphere-cursor-start-in",
      mode,
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    vendor: { vendor_id: "anysphere", display_name: "Anysphere (Cursor Start — India)" },
    regional_variant: {
      variant_id: "cursor-start-in",
      operator_entity: unobtainable(
        undefined,
        "官方未声明独立印度运营主体；产品由 Anysphere 运营（印度专属区域档）",
      ),
      jurisdiction: verified(
        "India",
        facts.indiaOnly.fact?.onlyIndia ?? "Cursor Start is only available in India",
        indiaOnlyIds,
      ),
    },
    payment: {
      methods: [
        "UPI",
        "Indian credit and debit cards（3D Secure authentication is required）",
      ],
      notes: [
        facts.pricing.fact?.taxInclusive ? "₹649/月为税含价（tax-inclusive）" : "INR 税含价",
        "须验证印度手机号；跨区/VPN 访问可能被阻断",
      ],
    },
    quota_system: {
      quota_model: "usage_tier",
      unit: verified(
        "first-party model usage（仅第一方模型）",
        facts.firstPartyOnly.fact?.firstPartyOnly ?? "Cursor's first-party models",
        srcOf(facts.firstPartyOnly, "cursor-start-pricing"),
      ),
      formula: notApplicable("Start 档无积分/美元等值换算公式"),
      model_multipliers: [],
      mcp_multipliers: [],
      off_peak_discount: notApplicable("Start 档无高峰/非高峰差价"),
      peak_hours: notApplicable("无高峰时段定义"),
    },
    models: [
      {
        model_code: "grok-4.5",
        release_date: unobtainable(undefined, "发布日期未纳入本次来源集"),
        deprecation_date: unobtainable(),
        availability: [
          {
            plans: ["cursor-start"],
            state: "supported",
            routed_to: null,
            status: "verified",
            raw: facts.firstPartyOnly.fact?.grokEffort
              ? `第一方模型（Start 档）；${facts.firstPartyOnly.fact.grokEffort}`
              : "第一方模型（Start 档）",
            source_ids: srcOf(facts.firstPartyOnly, "cursor-start-pricing"),
          },
        ],
      },
    ],
    plans: [plan],
    regional_availability,
    promotions: [],
    sources,
    source_chains: sourceChainsOut,
    unresolved_facts: unresolvedFacts,
  };
}

export function normalizeFromSnapshots(
  snapshots: RawSnapshot[],
  mode: "fixture" | "live",
  collectedAt: string,
  toolVersion: string,
): PlanCollectionPayload {
  return normalizeCollection({
    snapshots,
    facts: extractFacts(snapshots),
    mode,
    collectedAt,
    toolVersion,
  });
}

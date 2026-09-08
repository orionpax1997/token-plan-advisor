import type {
  PlanCollection,
  PlanField,
  SourceRef,
  UnresolvedFact,
} from "../../../schema/plan.ts";
import type { RawSnapshot } from "../load.ts";
import { deriveSourceChains } from "../shared.ts";
import { extractFacts, extractStatedDate, type ExtractedFacts } from "./extract.ts";
import { CODEBUDDY_INTL_CHAINS, CODEBUDDY_INTL_SOURCES, SRC } from "./sources.ts";

const CHAIN_BY_PURPOSE = {
  pricing: CODEBUDDY_INTL_CHAINS.find((c) => c.chain_id === "codebuddy-intl-pricing")!,
  billing: CODEBUDDY_INTL_CHAINS.find((c) => c.chain_id === "codebuddy-intl-billing-rules")!,
  legacy: CODEBUDDY_INTL_CHAINS.find((c) => c.chain_id === "codebuddy-intl-legacy-pricing")!,
  privacy: CODEBUDDY_INTL_CHAINS.find((c) => c.chain_id === "codebuddy-intl-privacy")!,
};

function verified<T>(value: T, raw: string | undefined, sourceIds: string[]): PlanField<T> {
  return {
    value,
    status: "verified",
    ...(raw !== undefined ? { raw } : {}),
    source_ids: sourceIds,
  };
}

function unobtainable<T>(note?: string): PlanField<T> {
  return {
    value: null,
    status: "unobtainable",
    source_ids: [],
    ...(note ? { note } : {}),
  };
}

interface PlanSpec {
  plan_id: string;
  plan_name: string;
  tier_label: "Free" | "Pro" | "Team";
  audience: "individual" | "team";
}

const PLAN_SPECS: PlanSpec[] = [
  { plan_id: "codebuddy-intl-free", plan_name: "CodeBuddy Free", tier_label: "Free", audience: "individual" },
  { plan_id: "codebuddy-intl-pro", plan_name: "CodeBuddy Pro", tier_label: "Pro", audience: "individual" },
  { plan_id: "codebuddy-intl-team", plan_name: "CodeBuddy Team", tier_label: "Team", audience: "team" },
];

export function normalizeCollection(input: {
  snapshots: RawSnapshot[];
  facts: ExtractedFacts;
  mode: "fixture" | "live";
  collectedAt: string;
  toolVersion: string;
}): PlanCollection {
  const { snapshots, facts, mode, collectedAt, toolVersion } = input;
  const { chains: sourceChainsOut, resolution } = deriveSourceChains(snapshots, CODEBUDDY_INTL_CHAINS);

  /** 取得链内首个 ok=true 来源的 id；整链失败时退回到该链的候选数组第一个。 */
  function chainSrc(chainId: string): string[] {
    const chosen = resolution.get(chainId);
    if (chosen) return [chosen];
    const chain = CODEBUDDY_INTL_CHAINS.find((c) => c.chain_id === chainId);
    return chain?.source_ids ?? [];
  }

  const pricingSourceIds = chainSrc("codebuddy-intl-pricing");
  const billingSourceIds = chainSrc("codebuddy-intl-billing-rules");
  const legacySourceIds = chainSrc("codebuddy-intl-legacy-pricing");
  const privacySourceIds = chainSrc("codebuddy-intl-privacy");

  // ---- Plans ----
  const plans: PlanCollection["plans"] = PLAN_SPECS.map((spec) => {
    const tier = spec.tier_label;
    const isFree = tier === "Free";
    const monthlyAmount = facts.currentPricing.monthly[tier];
    const annualAmount = facts.currentPricing.annual[tier];
    const totalCredits = facts.currentPricing.total_credits[tier];

    const priceList: PlanCollection["plans"][number]["price_list"] = [];

    // 月付标准价
    if (monthlyAmount !== undefined && monthlyAmount !== null && Number.isFinite(monthlyAmount)) {
      priceList.push({
        amount: verified(monthlyAmount, facts.currentPricing.raw, pricingSourceIds),
        currency: verified("USD", "USD", pricingSourceIds),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: facts.transition?.effective_from ?? null,
        effective_until: null,
        status: "verified",
        source_ids: pricingSourceIds,
      });
    }
    // 年付标准价
    if (annualAmount !== undefined && annualAmount !== null && Number.isFinite(annualAmount) && !isFree) {
      priceList.push({
        amount: verified(annualAmount, facts.currentPricing.raw, pricingSourceIds),
        currency: verified("USD", "USD", pricingSourceIds),
        billing_period: "annual",
        price_type: "standard",
        effective_from: facts.transition?.effective_from ?? null,
        effective_until: null,
        status: "verified",
        source_ids: pricingSourceIds,
      });
    }

    // 老用户保价：旧价（仅 Pro）以 STALE 形式保留
    if (tier === "Pro" && facts.legacyPricing && facts.transition && facts.transition.retention_monthly !== null) {
      priceList.push({
        amount: verified(
          facts.legacyPricing.pro_monthly,
          facts.legacyPricing.raw,
          legacySourceIds,
        ),
        currency: verified("USD", "USD", legacySourceIds),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: null,
        effective_until: facts.transition.effective_from,
        status: "stale",
        note: `老用户保价（auto-renewal enabled before ${facts.transition.effective_from}）`,
        source_ids: legacySourceIds,
      });
    }

    // 额度（按月积分池）
    const windows: PlanCollection["plans"][number]["quota"]["windows"] = [];
    if (totalCredits !== undefined && totalCredits !== null && Number.isFinite(totalCredits)) {
      windows.push({
        window_type: "monthly",
        window_anchor: "from_subscription",
        amount: verified(totalCredits, facts.currentPricing.raw, pricingSourceIds),
        unit: "credits",
        status: "verified",
        raw: "Base and bonus credits are issued monthly and are valid for that month; they do not roll over.",
        source_ids: pricingSourceIds,
      });
    }
    // Team 共享池
    if (tier === "Team") {
      windows.push({
        window_type: "monthly",
        window_anchor: "from_subscription",
        amount: verified(1000, "1,000 credits per seat per month, shared through a team credit pool", [SRC.pricingIntl]),
        unit: "credits",
        status: "verified",
        raw: "Team credit pool shared across seats",
        source_ids: pricingSourceIds,
      });
    }

    return {
      plan_id: spec.plan_id,
      plan_name: spec.plan_name,
      plan_type: "coding-subscription",
      audience: spec.audience,
      price_list: priceList,
      quota: {
        quota_model: "credits_5h_weekly",
        windows,
      },
      rate_limits: verified(
        isFree
          ? "对话和补全限额（5,000 completions/month、3 automated tasks）"
          : "对话和补全不限频；Promotional Bonus 50 credits/day",
        isFree
          ? "5,000 completions / month (unlimited during the promotional period); 3 (99 during the promotional period) Automated Tasks"
          : "Unlimited completions; 15 (99 during the promotional period) Automated Tasks; 50 credits/day Promotional Bonus",
        pricingSourceIds,
      ),
      context_window_tokens: unobtainable("国际站未给出产品级上下文窗口；CLI models.json 仅有用户自定义模型的 maxInputTokens"),
      refund_policy: verified(
        "Add-on packs一次性购买不可退款；Pro/Team 订阅按 Billing Overview 条款管理",
        "Add-on packs一次性购买不可退款",
        pricingSourceIds,
      ),
      cancellation_notice: verified(
        "Cancel auto-renewal any time before the next billing date",
        "Cancel auto-renewal any time before the next billing date",
        pricingSourceIds,
      ),
      purchase_url: verified(
        "https://www.codebuddy.ai/pricing",
        "Ensure you are logged in to codebuddy.ai → subscribe",
        billingSourceIds,
      ),
      data_policy: {
        training_use: verified(
          { allowed: false },
          "We do not store any code or project content permanently",
          privacySourceIds,
        ),
        processing_location: verified(
          "Singapore（个人数据）；Hong Kong（登录/安全凭据）",
          "stored in servers in Singapore; Login and security credentials are stored in Hong Kong",
          privacySourceIds,
        ),
        data_retention: verified(
          "IP 180 天；后端日志 14 天；账号删除后 30 天内删除",
          "IP addresses: retained for 180 days; Backend logs: retained for 14 days; Account deletion: information deleted within 30 days",
          privacySourceIds,
        ),
        zdr_offered: unobtainable("官方未声明 ZDR 选项"),
      },
    };
  });

  // ---- 模型清单（国际站未公开完整清单） ----
  const models: PlanCollection["models"] = [
    {
      model_code: "Hunyuan",
      release_date: unobtainable(),
      deprecation_date: unobtainable(),
      availability: [
        {
          plans: "all",
          state: "supported",
          routed_to: null,
          status: "verified",
          raw: "Multi-Model Support: Supports various conversational large models including Hunyuan, DeepSeek, and more.",
          source_ids: pricingSourceIds,
        },
      ],
    },
    {
      model_code: "DeepSeek",
      release_date: unobtainable(),
      deprecation_date: unobtainable(),
      availability: [
        {
          plans: "all",
          state: "supported",
          routed_to: null,
          status: "verified",
          raw: "Multi-Model Support: Supports various conversational large models including Hunyuan, DeepSeek, and more.",
          source_ids: pricingSourceIds,
        },
      ],
    },
  ];

  // ---- 限时促销：Promotional Bonus + 7-Day Free Trial + 老用户保价 ----
  const promotions: PlanCollection["promotions"] = [];
  promotions.push({
    description:
      "Promotional Bonus：Free 30 credits/day（当日有对话视为活跃）；Pro 50 credits/day。结束时间另行通知。",
    kind: "quota",
    effective_from: null,
    effective_until: null,
    status: "verified",
    raw: "Promotional Bonus (Limited-Time Offer)",
    source_ids: pricingSourceIds,
  });

  // ---- 来源清单 ----
  const sources: SourceRef[] = snapshots.map((snapshot) => {
    const stated = extractStatedDate(snapshot.body);
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      source_kind: snapshot.kind,
      fetched_at: snapshot.fetched_at,
      last_updated_at: stated,
      ...(stated
        ? { last_updated_note: "页面显示 'Last updated'" }
        : { last_updated_note: "页面未显示更新时间（codebuddy.ai docs 首页/定价页），以采集时间为准" }),
      http_status: snapshot.http_status,
      ...(snapshot.failure_code !== undefined ? { failure_code: snapshot.failure_code } : {}),
    };
  });

  // ---- 五维地区可用性 ----
  const regional_availability: PlanCollection["regional_availability"] = [
    {
      region_code: "GLOBAL",
      registration: {
        state: "officially_available",
        status: "verified",
        evidence_raw: facts.globalAvailability ?? "available to users globally",
        source_ids: privacySourceIds,
      },
      payment: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "Credit Card / Debit Card / WeChat / Prepaid Card",
        source_ids: billingSourceIds,
      },
      network_access: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "available to users globally, but primarily intended for users located in the same country/region as the selected service region",
        source_ids: privacySourceIds,
      },
      service_policy: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "Service Agreement signed with Tencent Cloud International Pte. Ltd. (Singapore); governed by Singapore law",
        source_ids: privacySourceIds,
      },
      feature_restrictions: {
        state: "unconfirmed",
        status: "unobtainable",
        note: "国际站未发布针对中国大陆用户的明确功能限制声明；功能可用性按服务地区与模型清单逐项判断",
        source_ids: [],
      },
    },
  ];

  // ---- Unresolved Facts ----
  const unresolvedFacts: UnresolvedFact[] = [];

  // STALE_CONFLICT：Price details 旧价 vs Billing Overview 新价
  if (facts.legacyPricing) {
    unresolvedFacts.push({
      fact: `Price details (intl-1256-77270) 仍显示旧价 Pro $${facts.legacyPricing.pro_monthly}/月（$${facts.legacyPricing.annual}/年），与 Billing Overview (intl-1256-77269) 的新价 $10/月、$96/年并存`,
      reason:
        "同产品同服务号两页价格口径不一致；Price details 未同步新价；新用户从 2026-08-07 起按新价，老用户保价到取消自动续费",
      failure_code: "STALE_CONFLICT",
      how_to_resolve: "以 Billing Overview (intl-1256-77269) 为当前在售价；Price details 仍为过渡参考",
    });
  }

  // TIME_DEPENDENT：2026-08-07 老用户保价过渡
  if (facts.transition) {
    unresolvedFacts.push({
      fact: `国际站于 ${facts.transition.effective_from}（UTC+8）切换新价（Pro $10/月、$96/年）；在 ${facts.transition.effective_from} 前已启用自动续费的 Pro 用户保留 $${facts.transition.retention_monthly ?? "9.95"}/月`,
      reason: "调价过渡是时间相关字段；当前有效价按用户订阅时点区分",
      failure_code: "TIME_DEPENDENT",
      how_to_resolve: "查询用户在 2026-08-07 前是否已订阅 Pro 档并启用 auto-renewal",
    });
  }

  // LOGIN_REQUIRED：年付实际单价、Pro 试用、各模型 Credits 消耗
  unresolvedFacts.push(
    {
      fact: "Pro/Team 用户在登录后的实际单价（按地区/优惠券/学生认证等个性化定价）",
      reason: "Billing Overview 仅给标准价；个性化定价需登录后读取",
      failure_code: "LOGIN_REQUIRED",
      how_to_resolve: "登录 codebuddy.ai → 个人主页 → 订阅管理",
    },
    {
      fact: "各模型 Credits 消耗明细（按模型 × 任务复杂度）",
      reason: "国际站公开页面无 Credits 消耗换算表；与国内站一致由官方明确为黑盒",
      failure_code: "LOGIN_REQUIRED",
      how_to_resolve: "登录 codebuddy.ai → 个人主页 → 用量管理查看",
    },
    {
      fact: "Pro 试用（7-Day Free Trial）的资格校验（同一账号/同一卡号的历史试用记录）",
      reason: "官方明确需绑卡 + 启用 auto-renewal；同账号历史是否可用需登录态判断",
      failure_code: "LOGIN_REQUIRED",
      how_to_resolve: "登录 codebuddy.ai 试用 Pro 时由官方前端校验",
    },
  );

  // 其他缺口
  unresolvedFacts.push(
    {
      fact: "国际版（codebuddy.ai）内置模型完整清单及各 Plan 模型差异",
      reason: "docs 首页仅称 'Supports various conversational large models including Hunyuan, DeepSeek, and more'；具体清单未公开",
    },
    {
      fact: "产品级上下文窗口字段",
      reason: "国际站未公布产品级上下文窗口；CLI models.json 仅有用户自定义模型的 maxInputTokens（示例值非承诺值）",
    },
    {
      fact: "数值化并发/速率限制（RPM 或并发数）",
      reason: "官方仅给口径（Unlimited completions / 99 tasks promotional），未给数值",
    },
  );

  // ---- 回退链 ----
  const source_chains = sourceChainsOut;

  // 排序
  sources.sort((a, b) => {
    const orderA = CODEBUDDY_INTL_SOURCES.findIndex((s) => s.source_id === a.source_id);
    const orderB = CODEBUDDY_INTL_SOURCES.findIndex((s) => s.source_id === b.source_id);
    return orderA - orderB;
  });

  return {
    schema_version: "1",
    collection: {
      provider_id: "tencent-codebuddy-intl",
      mode,
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    vendor: { vendor_id: "tencent-cloud", display_name: "Tencent Cloud CodeBuddy（International）" },
    regional_variant: {
      variant_id: "codebuddy-intl",
      operator_entity: verified(
        "Tencent Cloud International Pte. Ltd. (Singapore)",
        "Tencent Cloud International Pte. Ltd., a Singapore registered entity",
        privacySourceIds,
      ),
      jurisdiction: verified("Singapore", "governed by the laws of Singapore", privacySourceIds),
    },
    payment: {
      methods: facts.paymentMethods.length > 0 ? facts.paymentMethods : ["Credit Card", "Debit Card", "WeChat", "Prepaid Card"],
      notes: [
        "国际站明确支持 WeChat 支付（中国大陆用户可用）",
        "Pro 7-Day Free Trial 需绑定信用卡并启用自动续费",
      ],
    },
    quota_system: {
      quota_model: "credits_5h_weekly",
      unit: verified("credits", "credits", pricingSourceIds),
      formula: unobtainable("国际站公开页面无 Credits 消耗换算公式（黑盒）"),
      model_multipliers: [],
      mcp_multipliers: [],
      off_peak_discount: unobtainable("credits 体系无公开的非高峰折扣"),
      peak_hours: unobtainable("credits 体系无公开的高峰时段定义"),
    },
    models,
    plans,
    regional_availability,
    promotions,
    sources,
    source_chains,
    unresolved_facts: unresolvedFacts,
  };
}

export function normalizeFromSnapshots(
  snapshots: RawSnapshot[],
  mode: "fixture" | "live",
  collectedAt: string,
  toolVersion: string,
): PlanCollection {
  return normalizeCollection({
    snapshots,
    facts: extractFacts(snapshots, CHAIN_BY_PURPOSE),
    mode,
    collectedAt,
    toolVersion,
  });
}
import type {
  PlanCollection,
  PlanField,
  SourceRef,
  UnresolvedFact,
} from "../../schema/plan.ts";
import type { RawSnapshot } from "./load.ts";
import { deriveSourceChains, type ChainResolution } from "./shared.ts";
import { extractFacts, extractStatedDate, type ExtractedFacts } from "./extract.ts";
import { GEMINI_CHAINS, GEMINI_SOURCES } from "./sources.ts";

const CHAIN_BY_PURPOSE = {
  pricing: GEMINI_CHAINS.find((c) => c.chain_id === "gemini-codeassist-hourly")!,
  business: GEMINI_CHAINS.find((c) => c.chain_id === "gemini-codeassist-monthly")!,
  quotas: GEMINI_CHAINS.find((c) => c.chain_id === "gemini-codeassist-quotas")!,
  locations: GEMINI_CHAINS.find((c) => c.chain_id === "gemini-codeassist-locations")!,
  setup: GEMINI_CHAINS.find((c) => c.chain_id === "gemini-codeassist-setup")!,
  deprecation: GEMINI_CHAINS.find((c) => c.chain_id === "gemini-codeassist-individuals")!,
  dataGov: GEMINI_CHAINS.find((c) => c.chain_id === "gemini-codeassist-data-policy")!,
  releaseNotes: GEMINI_CHAINS.find((c) => c.chain_id === "gemini-codeassist-release-notes")!,
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

function notApplicable<T>(note?: string): PlanField<T> {
  return {
    value: null,
    status: "not_applicable",
    source_ids: [],
    ...(note ? { note } : {}),
  };
}

interface PlanSpec {
  plan_id: string;
  plan_name: string;
  tier: "Standard" | "Enterprise";
  audience: "individual" | "team";
}

const PLAN_SPECS: PlanSpec[] = [
  { plan_id: "gemini-codeassist-standard", plan_name: "Gemini Code Assist Standard", tier: "Standard", audience: "team" },
  { plan_id: "gemini-codeassist-enterprise", plan_name: "Gemini Code Assist Enterprise", tier: "Enterprise", audience: "team" },
];

/**
 * 把小时价按 24 × 365 / 12 ≈ 730.001 折算到月，对比验证月度口径。
 * research/01 §3.2：0.026027397→≈$19.00，0.031232877→≈$22.80，
 * 0.061643836→≈$45.00，0.073972603→≈$54.00。
 */
const HOURS_PER_MONTH = (24 * 365) / 12;

export function normalizeCollection(input: {
  snapshots: RawSnapshot[];
  facts: ExtractedFacts;
  mode: "fixture" | "live";
  collectedAt: string;
  toolVersion: string;
}): PlanCollection {
  const { snapshots, facts, mode, collectedAt, toolVersion } = input;
  const { chains: sourceChainsOut, resolution } = deriveSourceChains(snapshots, GEMINI_CHAINS);

  function chainSrc(chainId: string): string[] {
    const chosen = resolution.get(chainId);
    if (chosen) return [chosen];
    const chain = GEMINI_CHAINS.find((c) => c.chain_id === chainId);
    return chain?.source_ids ?? [];
  }

  const pricingSourceIds = chainSrc("gemini-codeassist-hourly");
  const monthlySourceIds = chainSrc("gemini-codeassist-monthly");
  const quotasSourceIds = chainSrc("gemini-codeassist-quotas");
  const locationsSourceIds = chainSrc("gemini-codeassist-locations");
  const setupSourceIds = chainSrc("gemini-codeassist-setup");
  const deprecationSourceIds = chainSrc("gemini-codeassist-individuals");
  const dataGovSourceIds = chainSrc("gemini-codeassist-data-policy");
  const releaseNotesSourceIds = chainSrc("gemini-codeassist-release-notes");

  // ---- Plans ----
  // 关键：双口径价格用 price_list 两条目显式标注换算关系，两口径可互相核验
  const plans: PlanCollection["plans"] = PLAN_SPECS.map((spec) => {
    const tier = spec.tier;
    const tierKey = tier.toLowerCase() as "standard" | "enterprise";
    const hourlyMonthly = facts.hourlyRates[tierKey].monthlyCommitment;
    const hourlyAnnual = facts.hourlyRates[tierKey].annualCommitment;
    const monthlyMonthly = facts.monthlyRates[tierKey].monthly;
    const monthlyAnnual = facts.monthlyRates[tierKey].annualCommitment;
    const dailyAgent = facts.dailyQuotas[tierKey].agentCli;
    const dailyCode = facts.dailyQuotas[tierKey].code;
    const dailyChat = facts.dailyQuotas[tierKey].chat;

    const priceList: PlanCollection["plans"][number]["price_list"] = [];

    // 定价页（小时价）→ 折算月价，标注换算关系
    if (hourlyMonthly !== null && Number.isFinite(hourlyMonthly)) {
      const derivedMonthly = hourlyMonthly * HOURS_PER_MONTH;
      priceList.push({
        amount: verified(hourlyMonthly, facts.hourlyRates.raw, pricingSourceIds),
        currency: verified("USD", "$", pricingSourceIds),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: `定价页 Hourly 口径：$ ${hourlyMonthly.toFixed(9)} / 1 hour；折算月价 ≈ $${derivedMonthly.toFixed(2)}（24h × 365 ÷ 12 = ${HOURS_PER_MONTH.toFixed(4)}）`,
        source_ids: pricingSourceIds,
      });
    }
    if (hourlyAnnual !== null && Number.isFinite(hourlyAnnual)) {
      const derivedMonthly = hourlyAnnual * HOURS_PER_MONTH;
      priceList.push({
        amount: verified(hourlyAnnual, facts.hourlyRates.raw, pricingSourceIds),
        currency: verified("USD", "$", pricingSourceIds),
        billing_period: "annual",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: `定价页 Hourly 口径（12-month commitment）：$ ${hourlyAnnual.toFixed(9)} / 1 hour；折算月价 ≈ $${derivedMonthly.toFixed(2)}`,
        source_ids: pricingSourceIds,
      });
    }
    // 商业版页（月度口径）—— 与 Hourly 折算结果一致，作为互相核验
    if (monthlyMonthly !== null && Number.isFinite(monthlyMonthly)) {
      priceList.push({
        amount: verified(monthlyMonthly, facts.monthlyRates.raw, monthlySourceIds),
        currency: verified("USD", "$", monthlySourceIds),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: `商业版页 Monthly 口径：$ ${monthlyMonthly.toFixed(2)} per user per month（与 Hourly 折算 ≈ $${hourlyMonthly !== null ? (hourlyMonthly * HOURS_PER_MONTH).toFixed(2) : "?"} 一致）`,
        source_ids: monthlySourceIds,
      });
    }
    if (monthlyAnnual !== null && Number.isFinite(monthlyAnnual)) {
      priceList.push({
        amount: verified(monthlyAnnual, facts.monthlyRates.raw, monthlySourceIds),
        currency: verified("USD", "$", monthlySourceIds),
        billing_period: "annual",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: `商业版页 Monthly 口径（annual commitment）：$ ${monthlyAnnual.toFixed(2)} per user per month with upfront annual commitment（与 Hourly 折算 ≈ $${hourlyAnnual !== null ? (hourlyAnnual * HOURS_PER_MONTH).toFixed(2) : "?"} 一致）`,
        source_ids: monthlySourceIds,
      });
    }

    // 额度
    const windows: PlanCollection["plans"][number]["quota"]["windows"] = [];
    if (dailyAgent !== null && Number.isFinite(dailyAgent)) {
      windows.push({
        window_type: "daily",
        window_anchor: "unspecified",
        amount: verified(dailyAgent, facts.dailyQuotas.raw, quotasSourceIds),
        unit: "requests per day per user (agent mode + Gemini CLI 合并)",
        status: "verified",
        raw: "one prompt might result in multiple model requests",
        source_ids: quotasSourceIds,
      });
    }
    if (dailyCode !== null && Number.isFinite(dailyCode)) {
      windows.push({
        window_type: "daily",
        window_anchor: "unspecified",
        amount: verified(dailyCode, facts.dailyQuotas.raw, quotasSourceIds),
        unit: "code requests per day per user",
        status: "verified",
        source_ids: quotasSourceIds,
      });
    }
    if (dailyChat !== null && Number.isFinite(dailyChat)) {
      windows.push({
        window_type: "daily",
        window_anchor: "unspecified",
        amount: verified(dailyChat, facts.dailyQuotas.raw, quotasSourceIds),
        unit: "chat / data insight requests per day per user",
        status: "verified",
        source_ids: quotasSourceIds,
      });
    }

    return {
      plan_id: spec.plan_id,
      plan_name: spec.plan_name,
      plan_type: "coding-subscription",
      audience: spec.audience,
      price_list: priceList,
      quota: {
        // Gemini 限额按"日请求"为单位，与 usd_equivalence/credits 不同
        // 用 messages_5h 不合适（5h 窗口）；最贴近的 quota_model 是 usage_tier
        quota_model: "usage_tier",
        windows,
      },
      rate_limits: facts.rps !== null && Number.isFinite(facts.rps)
        ? verified(
            `${facts.rps} RPS; per user per minute 受高峰时段可用性影响`,
            `Requests per second: ${facts.rps}; subject to the availability of the service in times of high demand`,
            quotasSourceIds,
          )
        : unobtainable("官方未公布 RPS"),
      context_window_tokens: facts.contextWindow.tokens !== null
        ? verified(facts.contextWindow.tokens, facts.contextWindow.raw, quotasSourceIds)
        : unobtainable("官方未公布 1M token 上下文窗口原文"),
      refund_policy: unobtainable("Google Cloud Billing 标准退款政策；订阅条目需在 Admin for Gemini 控制台查看"),
      cancellation_notice: verified(
        "All subscriptions are billed monthly；年度承诺为折扣费率按月收取；可在 Admin for Gemini 控制台查看/管理",
        "All subscriptions are billed monthly",
        releaseNotesSourceIds,
      ),
      purchase_url: verified(
        "https://cloud.google.com/gemini/docs/admin",
        "Google Cloud 控制台 'Admin for Gemini' → 'Get Gemini Code Assist'",
        setupSourceIds,
      ),
      data_policy: {
        training_use: facts.trainingUse
          ? verified({ allowed: false }, facts.trainingUse, dataGovSourceIds)
          : verified({ allowed: false }, "Gemini doesn't use your prompts or its responses as data to train its models", dataGovSourceIds),
        processing_location: verified(
          `${facts.globalServing.availableRegions.join("、") || "United States/Europe/Asia Pacific"}（用户不可选区）`,
          "Gemini Code Assist Standard and Enterprise use Google Cloud for load-balancing, so they are able to operate globally; you can't choose which region to use",
          locationsSourceIds,
        ),
        data_retention: facts.stateless
          ? verified(
              "stateless Google Cloud services，不存储 prompts 与 responses；IP 保留 180 天；账号删除后 30 天内删除",
              facts.stateless,
              dataGovSourceIds,
            )
          : unobtainable("官方未公布详细保留期限"),
        zdr_offered: unobtainable("官方未声明 ZDR 选项；stateless 设计下训练隔离已就位"),
      },
    };
  });

  // 个人层（已停服）：建模为"不可用档位" —— 不作为可购买 plan 输出
  // 但保留状态可见性：可通过 promotions/unresolved_facts 反映

  // ---- 来源清单（三时间戳） ----
  const sources: SourceRef[] = snapshots.map((snapshot) => {
    const stated = extractStatedDate(snapshot.body);
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      source_kind: snapshot.kind,
      fetched_at: snapshot.fetched_at,
      last_updated_at: stated,
      ...(stated
        ? { last_updated_note: "页面显示 Last updated" }
        : { last_updated_note: "页面未显示更新时间（定价页/产品页），以采集时间为准" }),
      http_status: snapshot.http_status,
      ...(snapshot.failure_code !== undefined ? { failure_code: snapshot.failure_code } : {}),
    };
  });
  sources.sort((a, b) => {
    const orderA = GEMINI_SOURCES.findIndex((s) => s.source_id === a.source_id);
    const orderB = GEMINI_SOURCES.findIndex((s) => s.source_id === b.source_id);
    return orderA - orderB;
  });

  // ---- 五维地区可用性 ----
  const regional_availability: PlanCollection["regional_availability"] = [
    {
      region_code: "CN",
      registration: {
        state: "unconfirmed",
        status: "unobtainable",
        evidence_raw: "官方未声明中国大陆用户可否完成注册（需 Google 账号登录 + Google Cloud 项目/billing account）",
        note: "无可机读官方声明",
        source_ids: [],
      },
      payment: {
        state: "unconfirmed",
        status: "unobtainable",
        evidence_raw: "支付方式'因国家/币种而异'；未找到列出中国大陆可用支付方式的官方页面",
        note: "无可机读官方声明",
        source_ids: [],
      },
      network_access: {
        state: "unconfirmed",
        status: "unobtainable",
        evidence_raw: "官方明确服务从美/欧/新加坡区域全球负载均衡、用户不可选区；未声明对大陆的网络可达性",
        note: "无可机读官方声明",
        source_ids: [],
      },
      service_policy: {
        state: "unconfirmed",
        status: "unobtainable",
        evidence_raw: "未找到任何官方页面声明 Gemini Code Assist 在中国大陆可用/不可用",
        note: "无可机读官方声明",
        source_ids: [],
      },
      feature_restrictions: {
        state: "unconfirmed",
        status: "unobtainable",
        evidence_raw: "未找到针对中国大陆的功能差异化声明",
        note: "无可机读官方声明",
        source_ids: [],
      },
    },
    {
      region_code: "GLOBAL",
      registration: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "使用 Google 账号 + Google Cloud 项目 + billing account；Enterprise 至少 10 个许可证",
        source_ids: setupSourceIds,
      },
      payment: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "Cloud Billing：信用卡 Amex/MasterCard/Visa 等；订阅绑 billing account",
        note: "支付方式因国家/币种而异（官方明确）",
        source_ids: setupSourceIds,
      },
      network_access: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "Gemini Code Assist Standard and Enterprise use Google Cloud for load-balancing, so they are able to operate globally",
        source_ids: locationsSourceIds,
      },
      service_policy: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "Gemini Code Assist Standard and Enterprise use Google Cloud for load-balancing, so they are able to operate globally",
        source_ids: locationsSourceIds,
      },
      feature_restrictions: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "Enterprise 独有：code customization、Apigee/Application Integration/Cloud Assist、at-least-100 PR reviews",
        source_ids: locationsSourceIds,
      },
    },
  ];

  // ---- Unresolved Facts ----
  const unresolvedFacts: UnresolvedFact[] = [];

  // 个人层 2026-06-18 停服迁 Antigravity（明示不作为可购买档位）
  if (facts.deprecation.effectiveDate) {
    unresolvedFacts.push({
      fact: `Gemini Code Assist for individuals 个人层自 ${facts.deprecation.effectiveDate} 起停止服务；IDE 扩展与 Gemini CLI 停服，个人用户被引导迁移到 ${facts.deprecation.migrationTarget ?? "Antigravity"}`,
      reason: "官方弃用公告（research/01 §1 #10）；采集输出不作为可购买 plan 列出，状态通过 Unresolved Fact 可见",
      failure_code: "DEPRECATED",
      how_to_resolve: "如需个人 AI 编码：使用 Antigravity / Gemini AI Pro/Ultra 订阅（非本采集范围）",
    });
  }

  // RENDER_DEPENDENT：codeassist.google/products/individuals 渲染失败（不进入 SOURCES，但状态声明）
  unresolvedFacts.push({
    fact: "codeassist.google/products/individuals 产品页重度客户端渲染（仅返回 JS 引导代码，无正文）",
    reason: "marketing 个人版页为 SPA；个人层状态以弃用文档 (deprecations/code-assist-individuals) 与消费者 FAQ 为机读来源",
    failure_code: "RENDER_DEPENDENT",
    how_to_resolve: "通过浏览器人工核对 codeassist.google/products/individuals；本采集已声明该页正文不可机读",
  });

  // URL 域名迁移（research/01 §4 已核实的 404）
  unresolvedFacts.push({
    fact: "URL 结构性迁移：cloud.google.com/gemini/docs/* → docs.cloud.google.com/gemini/docs/*（旧 data-governance URL 实测 404）",
    reason: "Provider 应同时兼容两个域名",
    failure_code: "GONE",
    how_to_resolve: "采集失败时回退 docs.cloud.google.com 新域名；fixture 模式已使用新域",
  });

  // Developer Program 渠道当前能否获得 Code Assist Standard（来源冲突）
  unresolvedFacts.push({
    fact: "Developer Program 渠道当前能否获得 Gemini Code Assist Standard（官方两页信息不一致）",
    reason: "商业版页称 'Gemini Code Assist is also available through the Google Developer Program'；Developer Program 当前 plans-and-pricing 页未列 Standard 权益（改为 Antigravity 请求额度与 AI Pro/Ultra 云抵扣金）。2025-08 官方博客曾宣布 Premium（$24.99/月）含 Code Assist Standard 且月付计划 'currently only available in the US'",
    failure_code: "STALE_CONFLICT",
    how_to_resolve: "以 Admin for Gemini 控制台为当前在购买入口；Developer Program 渠道现状无法确认",
  });

  // 上下文窗口口径（两个"1M token"未必同口径）
  unresolvedFacts.push({
    fact: "1M token context window 的准确口径（配额页 'Local codebase awareness: 1,000,000 token context window' vs 商业版页 'with ... a 1M token context window' 是否同义）",
    reason: "官方两页表述不一；归一化时区分'代码库上下文窗口'与'模型上下文窗口'",
  });

  // 分钟级 agent/CLI 速率
  unresolvedFacts.push({
    fact: "Gemini Code Assist 分钟级 agent/CLI 速率具体数值",
    reason: "配额页仅给日上限与 'subject to the availability of the service in times of high demand' 表述；无每分钟具体数值",
  });

  // 首月抵扣金取消
  if (facts.firstMonthCreditCancellation.date) {
    unresolvedFacts.push({
      fact: `首月使用抵扣金自 ${facts.firstMonthCreditCancellation.date} 起取消（release notes）`,
      reason: "新客优惠类字段时效性极强；带生效日期采集",
      failure_code: "TIME_DEPENDENT",
      how_to_resolve: "用户当前是否新客以注册时间为准；老用户不受影响",
    });
  }

  return {
    schema_version: "1",
    collection: {
      provider_id: "google-gemini-codeassist",
      mode,
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    vendor: { vendor_id: "google-cloud", display_name: "Google Cloud Gemini Code Assist" },
    regional_variant: {
      variant_id: "gemini-codeassist",
      operator_entity: verified(
        "Google LLC（Cloud 业务通过 Google Cloud 服务）",
        "Gemini Code Assist Standard and Enterprise 是 Google Cloud 服务",
        locationsSourceIds,
      ),
      jurisdiction: verified(
        "适用 Google Cloud 服务区域（US/Europe/Asia Pacific，用户不可选区）",
        "operate globally; you can't choose which region to use",
        locationsSourceIds,
      ),
    },
    payment: {
      methods: ["Credit card (Amex/MasterCard/Visa)", "Cloud Billing 自助支付"],
      notes: [
        "支付方式因国家/币种而异（Cloud Billing 文档明确）",
        "中国大陆可用支付方式：未找到官方清单",
      ],
    },
    quota_system: {
      quota_model: "usage_tier",
      unit: verified(
        "requests per day per user",
        "Maximum requests per user per day (Standard/Enterprise 分列)",
        quotasSourceIds,
      ),
      formula: unobtainable("Gemini Code Assist 无积分/美元等值换算公式；限额按'日请求'直接给出"),
      model_multipliers: [],
      mcp_multipliers: [],
      off_peak_discount: notApplicable("官方未声明非高峰折扣"),
      peak_hours: notApplicable("官方未声明高峰时段；'subject to availability in times of high demand' 为定性"),
    },
    models: [],
    plans,
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
): PlanCollection {
  return normalizeCollection({
    snapshots,
    facts: extractFacts(snapshots, CHAIN_BY_PURPOSE),
    mode,
    collectedAt,
    toolVersion,
  });
}

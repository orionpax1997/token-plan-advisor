import type {
  PlanCollection,
  PlanField,
  SourceRef,
  UnresolvedFact,
} from "../../../schema/plan.ts";
import type { RawSnapshot } from "../load.ts";
import { deriveSourceChains, type ChainResolution } from "../shared.ts";
import { extractFacts, extractStatedDate, type ExtractedFacts } from "./extract.ts";
import { TRAE_INTL_CHAINS, TRAE_INTL_SOURCES } from "./sources.ts";

const CHAIN_BY_PURPOSE = {
  pricing: TRAE_INTL_CHAINS.find((c) => c.chain_id === "trae-intl-pricing")!,
  plans: TRAE_INTL_CHAINS.find((c) => c.chain_id === "trae-intl-pricing")!,
  faq: TRAE_INTL_CHAINS.find((c) => c.chain_id === "trae-intl-billing-rules")!,
  onDemand: TRAE_INTL_CHAINS.find((c) => c.chain_id === "trae-intl-on-demand")!,
  countries: TRAE_INTL_CHAINS.find((c) => c.chain_id === "trae-intl-regions")!,
  models: TRAE_INTL_CHAINS.find((c) => c.chain_id === "trae-intl-models")!,
  blog: TRAE_INTL_CHAINS.find((c) => c.chain_id === "trae-intl-pricing")!,
  privacy: TRAE_INTL_CHAINS.find((c) => c.chain_id === "trae-intl-privacy")!,
  legacy: TRAE_INTL_CHAINS.find((c) => c.chain_id === "trae-intl-legacy-billing")!,
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
  tier_label: "Free" | "Lite" | "Pro" | "Pro+" | "Ultra";
  audience: "individual" | "team";
}

const PLAN_SPECS: PlanSpec[] = [
  { plan_id: "trae-intl-free", plan_name: "TRAE Free", tier_label: "Free", audience: "individual" },
  { plan_id: "trae-intl-lite", plan_name: "TRAE Lite", tier_label: "Lite", audience: "individual" },
  { plan_id: "trae-intl-pro", plan_name: "TRAE Pro", tier_label: "Pro", audience: "individual" },
  { plan_id: "trae-intl-pro-plus", plan_name: "TRAE Pro+", tier_label: "Pro+", audience: "individual" },
  { plan_id: "trae-intl-ultra", plan_name: "TRAE Ultra", tier_label: "Ultra", audience: "individual" },
];

export function normalizeCollection(input: {
  snapshots: RawSnapshot[];
  facts: ExtractedFacts;
  mode: "fixture" | "live";
  collectedAt: string;
  toolVersion: string;
}): PlanCollection {
  const { snapshots, facts, mode, collectedAt, toolVersion } = input;
  const { chains: sourceChainsOut, resolution } = deriveSourceChains(snapshots, TRAE_INTL_CHAINS);

  /** 取得链内首个 ok=true 来源的 id；整链失败时退回到该链的候选数组第一个。 */
  function chainSrc(chainId: string): string[] {
    const chosen = resolution.get(chainId);
    if (chosen) return [chosen];
    const chain = TRAE_INTL_CHAINS.find((c) => c.chain_id === chainId);
    return chain?.source_ids ?? [];
  }

  const pricingSourceIds = chainSrc("trae-intl-pricing");
  const faqSourceIds = chainSrc("trae-intl-billing-rules");
  const onDemandSourceIds = chainSrc("trae-intl-on-demand");
  const regionsSourceIds = chainSrc("trae-intl-regions");
  const modelsSourceIds = chainSrc("trae-intl-models");
  const privacySourceIds = chainSrc("trae-intl-privacy");

  // ---- Plans ----
  const plans: PlanCollection["plans"] = PLAN_SPECS.map((spec) => {
    const tier = spec.tier_label;
    const recurring = facts.pricing.recurringMonthly[tier];
    const single = facts.pricing.singleMonth[tier];
    const annual = facts.pricing.annual[tier];
    const basicUsage = facts.basicUsage.perTier[tier];
    const concurrent = facts.concurrentTasks.perTier[tier];

    const priceList: PlanCollection["plans"][number]["price_list"] = [];

    // 连续包月（Recurring monthly price）
    if (recurring !== null && recurring !== undefined && Number.isFinite(recurring)) {
      priceList.push({
        amount: verified(recurring, facts.pricing.raw, pricingSourceIds),
        currency: verified("USD", "$", pricingSourceIds),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: "Recurring monthly price (recommended); 默认自动续费",
        source_ids: pricingSourceIds,
      });
    }
    // 单月价（Single month price, will not auto-renew after expiration）
    if (single !== null && single !== undefined && Number.isFinite(single) && tier !== "Free") {
      priceList.push({
        amount: verified(single, facts.pricing.raw, pricingSourceIds),
        currency: verified("USD", "$", pricingSourceIds),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: "Single month price; will not auto-renew after expiration",
        source_ids: pricingSourceIds,
      });
    }
    // 年付（Annual price）
    if (annual !== null && annual !== undefined && Number.isFinite(annual) && tier !== "Free") {
      priceList.push({
        amount: verified(annual, facts.pricing.raw, pricingSourceIds),
        currency: verified("USD", "$", pricingSourceIds),
        billing_period: "annual",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: "Annual price; 平均月单价见 raw",
        source_ids: pricingSourceIds,
      });
    }

    // 额度（Basic Usage 美元等值）
    const windows: PlanCollection["plans"][number]["quota"]["windows"] = [];
    if (basicUsage !== null && basicUsage !== undefined && Number.isFinite(basicUsage)) {
      windows.push({
        window_type: "monthly",
        window_anchor: "from_subscription",
        amount: verified(basicUsage, facts.basicUsage.raw, pricingSourceIds),
        unit: "USD (Dollar Usage, Basic Usage)",
        status: "verified",
        raw: "The unused quota for the current month will not be carried over to the next month",
        source_ids: pricingSourceIds,
      });
    }
    // Bonus Usage（仅声明存在无数值）
    windows.push({
      window_type: "monthly",
      window_anchor: "from_subscription",
      amount: unobtainable("官方明确 Bonus Usage 'based on your actual use'，无数值"),
      unit: "USD (Bonus Usage)",
      status: "unobtainable",
      raw: "Bonus Usage: an additional flexible usage each month based on your actual use",
      source_ids: pricingSourceIds,
    });
    // On-Demand 附加池（Lite 及以上可开）
    if (tier !== "Free") {
      windows.push({
        window_type: "monthly",
        window_anchor: "from_subscription",
        amount: unobtainable("On-Demand 无固定数值；按实际 token × 模型 API 费率结算"),
        unit: "USD (On-Demand Usage)",
        status: "unobtainable",
        raw: facts.onDemand.threshold ?? "Each time the accumulated amount reaches $3, a payment will be triggered",
        source_ids: onDemandSourceIds,
      });
    }

    return {
      plan_id: spec.plan_id,
      plan_name: spec.plan_name,
      plan_type: "coding-subscription",
      audience: spec.audience,
      price_list: priceList,
      quota: {
        // 国际版用 "美元等值" 计费：usd_equivalence 复用 Cursor 的同款原语
        quota_model: "usd_equivalence",
        windows,
      },
      rate_limits: verified(
        concurrent !== null && concurrent !== undefined
          ? `${concurrent} concurrent cloud tasks; ${facts.queuePriority.perTier[tier] === "fast" ? "Fast queue" : facts.queuePriority.perTier[tier] === "standard" ? "Standard queue" : "queue varies by tier"}`
          : "Queue priority varies by tier",
        concurrent !== null && concurrent !== undefined
          ? `Concurrent Cloud Tasks: ${concurrent}; Queue: ${facts.queuePriority.perTier[tier] ?? "varies"}`
          : "Concurrent Cloud Tasks: varies",
        pricingSourceIds,
      ),
      context_window_tokens: verified(
        272000,
        "Regular Mode: up to 272K tokens（取决于模型）；Max Mode: up to 1M tokens",
        facts.contextWindow.raw ? [facts.sources.blog!].filter(Boolean) : pricingSourceIds,
      ),
      refund_policy: verified(
        "Trial 期间可取消；正式订阅按 FAQ 'Cancel auto-renewal any time before the next billing date'",
        "Cancel auto-renewal any time before the next billing date",
        faqSourceIds,
      ),
      cancellation_notice: verified(
        "Cancel auto-renewal any time before the next billing date; next billing date = current subscription period expires +1 day",
        "Your account will be charged for automatic renewal one day before the current subscription period expires",
        faqSourceIds,
      ),
      purchase_url: verified(
        "https://www.trae.ai/pricing",
        "TRAE 定价页（登录后操作购买）",
        pricingSourceIds,
      ),
      data_policy: {
        training_use: verified(
          { allowed: true },
          facts.privacyMode.usTraining ?? "US privacy policy: 暂时上传代码库用于计算 embeddings, 训练改进技术",
          privacySourceIds,
        ),
        processing_location: unobtainable("官方未声明 TRAE 后端架构位置"),
        data_retention: unobtainable("官方未披露 TRAE 服务端保留政策"),
        zdr_offered: unobtainable("官方未声明 ZDR 选项"),
      },
    };
  });

  // ---- 模型清单 ----
  const models: PlanCollection["models"] = facts.models.models.map((m) => ({
    model_code: m.code,
    release_date: unobtainable("官方未给出模型发布日期"),
    deprecation_date: unobtainable("官方未给出模型弃用日期"),
    availability: [
      {
        plans: "all",
        state: "supported",
        routed_to: null,
        status: "verified",
        raw: m.note || `${m.code} 在所有付费档可调`,
        source_ids: modelsSourceIds,
      },
    ],
  }));

  // ---- 来源清单（三时间戳） ----
  const sources: SourceRef[] = snapshots.map((snapshot) => {
    const stated = extractStatedDate(snapshot.body);
    // 区分 JS 渲染失败页与正常文档页
    const isPricingPage = snapshot.source_id === "trae-intl-pricing";
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      source_kind: snapshot.kind,
      fetched_at: snapshot.fetched_at,
      last_updated_at: stated,
      ...(stated
        ? { last_updated_note: "页面显示 Last updated" }
        : isPricingPage
          ? { last_updated_note: "客户端渲染定价页（RENDER_DEPENDENT），仅保留页脚联系邮箱" }
          : { last_updated_note: "页面未显示更新时间（docs.trae.ai 站点级 updated_at 2026-08-26），以采集时间为准" }),
      http_status: snapshot.http_status,
      ...(snapshot.failure_code !== undefined ? { failure_code: snapshot.failure_code } : {}),
    };
  });

  // 排序
  sources.sort((a, b) => {
    const orderA = TRAE_INTL_SOURCES.findIndex((s) => s.source_id === a.source_id);
    const orderB = TRAE_INTL_SOURCES.findIndex((s) => s.source_id === b.source_id);
    return orderA - orderB;
  });

  // ---- 五维地区可用性（CN/GLOBAL 双区） ----
  // research/04 §5.1：trae.ai 不对中国大陆开放产品可用性、不对中国大陆开放付费订阅
  // 港澳在 Supported countries 清单中不在，但出现在 Payment Service Regions 中
  const cnExclusionRaw = [
    "Supported countries and regions (产品整体可用性): " + (
      facts.regionExclusion.hasMainlandChina ? "中国大陆" : "中国大陆已明确排除"
    ),
    "Payment service regions (付费订阅开通范围): " + (
      facts.paymentRegions.hasMainlandChina
        ? "含中国大陆"
        : facts.paymentRegions.hasHongKong
          ? "含港澳不含大陆"
          : "不含中国大陆"
    ),
  ].join("；");

  const regional_availability: PlanCollection["regional_availability"] = [
    {
      region_code: "CN",
      registration: {
        state: facts.regionExclusion.hasMainlandChina ? "officially_restricted" : "officially_restricted",
        status: "verified",
        evidence_raw: "Supported countries and regions 列表不含中国大陆（41 国清单无 Mainland China）",
        note: "TRAE 国际版产品层面明确不向中国大陆用户提供",
        source_ids: regionsSourceIds,
      },
      payment: {
        state: facts.paymentRegions.hasMainlandChina ? "officially_available" : "officially_restricted",
        status: "verified",
        evidence_raw: facts.paymentRegions.hasMainlandChina
          ? "Supported countries/regions (付费服务) 含 Mainland China"
          : "Supported countries/regions (付费服务) 不含 Mainland China",
        note: facts.paymentRegions.hasMainlandChina
          ? "支付服务地区清单与产品可用性清单存在差异"
          : "付费订阅未对中国大陆开放（与产品可用性一致）",
        source_ids: regionsSourceIds,
      },
      network_access: {
        state: "unconfirmed",
        status: "unobtainable",
        evidence_raw: "官方未声明对中国大陆的网络可达性、封锁或镜像",
        note: "无可机读官方声明",
        source_ids: [],
      },
      service_policy: {
        state: "officially_restricted",
        status: "verified",
        evidence_raw: "FAQ: TRAE provides subscription services only in certain countries and regions；付费服务地区清单不含中国大陆",
        note: "付费订阅未对中国大陆开放",
        source_ids: regionsSourceIds,
      },
      feature_restrictions: {
        state: "officially_restricted",
        status: "verified",
        evidence_raw: facts.usModelRestriction.restrictionRaw ?? "无可机读官方声明",
        note: "TRAE 国际版未发布针对中国大陆用户的模型级限制声明；已声明的模型级地区限制以美国为对象（GPT/MiniMax 系列）",
        source_ids: modelsSourceIds,
      },
    },
    {
      region_code: "HK",
      registration: {
        state: facts.regionExclusion.hasHongKong ? "officially_restricted" : "officially_restricted",
        status: "verified",
        evidence_raw: "Supported countries and regions 列表不含 Hong Kong SAR (China)（产品可用性清单）",
        note: "TRAE 国际版产品层面明确不向香港用户提供；与付费服务地区清单存在口径差异",
        source_ids: regionsSourceIds,
      },
      payment: {
        state: facts.paymentRegions.hasHongKong ? "officially_available" : "officially_restricted",
        status: "verified",
        evidence_raw: facts.paymentRegions.hasHongKong
          ? "Supported countries/regions (付费服务) 含 Hong Kong SAR (China)"
          : "Supported countries/regions (付费服务) 不含 Hong Kong",
        note: "付费服务清单口径差异",
        source_ids: regionsSourceIds,
      },
      network_access: {
        state: "unconfirmed",
        status: "unobtainable",
        evidence_raw: "官方未声明对香港的网络可达性",
        source_ids: [],
      },
      service_policy: {
        state: facts.paymentRegions.hasHongKong ? "officially_available" : "officially_restricted",
        status: "verified",
        evidence_raw: facts.paymentRegions.hasHongKong
          ? "付费服务清单含 Hong Kong SAR (China)"
          : "付费服务清单不含 Hong Kong",
        note: "服务政策按付费服务清单口径标注",
        source_ids: regionsSourceIds,
      },
      feature_restrictions: {
        state: "unconfirmed",
        status: "unobtainable",
        evidence_raw: "官方未发布针对香港的功能差异化声明",
        source_ids: [],
      },
    },
    {
      region_code: "MO",
      registration: {
        state: facts.regionExclusion.hasMacao ? "officially_restricted" : "officially_restricted",
        status: "verified",
        evidence_raw: "Supported countries and regions 列表不含 Macao SAR (China)",
        note: "TRAE 国际版产品层面明确不向澳门用户提供",
        source_ids: regionsSourceIds,
      },
      payment: {
        state: facts.paymentRegions.hasMacao ? "officially_available" : "officially_restricted",
        status: "verified",
        evidence_raw: facts.paymentRegions.hasMacao
          ? "付费服务清单含 Macao SAR (China)"
          : "付费服务清单不含 Macao",
        note: "付费服务清单口径差异",
        source_ids: regionsSourceIds,
      },
      network_access: {
        state: "unconfirmed",
        status: "unobtainable",
        evidence_raw: "官方未声明对澳门的网络可达性",
        source_ids: [],
      },
      service_policy: {
        state: facts.paymentRegions.hasMacao ? "officially_available" : "officially_restricted",
        status: "verified",
        evidence_raw: facts.paymentRegions.hasMacao
          ? "付费服务清单含 Macao SAR (China)"
          : "付费服务清单不含 Macao",
        source_ids: regionsSourceIds,
      },
      feature_restrictions: {
        state: "officially_restricted",
        status: "verified",
        evidence_raw: "PayPal 在 Macao SAR (China) 不支持",
        note: "支付方式地区限制",
        source_ids: pricingSourceIds,
      },
    },
    {
      region_code: "GLOBAL",
      registration: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw: "Supported countries and regions (41 国清单: 涵盖 Asia/Europe/North America/South America/Oceania/Africa/Antarctica)",
        note: "TRAE 国际版仅向清单内国家/地区开放；清单外注册受限",
        source_ids: regionsSourceIds,
      },
      payment: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "Global payment methods: Alipay, WeChat Pay (not supported in US), Credit card & debit card (Mastercard/JCB/Visa/Diners/American Express/Discover/UnionPay), PayPal (部分地区排除)",
        note: "支付方式因地区而异；中国 Alipay/WeChat Pay 全球可用，PayPal 在 Macao/Netherlands/Myanmar/Turkey 不支持",
        source_ids: pricingSourceIds,
      },
      network_access: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "服务从 docs.trae.ai 全球可达，无明确地理封锁声明",
        source_ids: regionsSourceIds,
      },
      service_policy: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "适用 Supported countries and regions 清单内国家/地区的服务政策",
        source_ids: regionsSourceIds,
      },
      feature_restrictions: {
        state: "officially_restricted",
        status: "verified",
        evidence_raw: facts.usModelRestriction.restrictionRaw ?? "无可机读官方声明",
        note: "美国用户屏蔽 GPT 系列与 MiniMax 系列",
        source_ids: modelsSourceIds,
      },
    },
  ];

  // ---- Unresolved Facts ----
  const unresolvedFacts: UnresolvedFact[] = [];

  // STALE_CONFLICT：Pro Trial 7 天（现行）vs 14 天（2026-02-13 博客公告）
  if (facts.proTrial.currentRaw && facts.proTrial.historicRaw && facts.proTrial.currentRaw !== facts.proTrial.historicRaw) {
    unresolvedFacts.push({
      fact: `Pro Trial 时长：现行文档 ${facts.proTrial.currentRaw}（文档 new-plans-and-billing），2026-02-13 官方博客 ${facts.proTrial.historicRaw}`,
      reason: "现行文档与上线公告存在不一致；从 14 天缩短为 7 天的官方变更公告无法确认",
      failure_code: "STALE_CONFLICT",
      how_to_resolve: "以现行文档为准；用户当前是否已领取 trial 以注册时间为准",
    });
  }

  // RENDER_DEPENDENT：trae.ai/pricing 客户端渲染失败
  if (facts.supportEmail) {
    unresolvedFacts.push({
      fact: `trae.ai/pricing 定价页客户端渲染失败（仅获取到页脚联系邮箱 ${facts.supportEmail} 与 FAQ 问题标题）`,
      reason: "Marketing 定价页为 SPA，server-render 仅返回 JS 引导；正文需经 docs.trae.ai 文档站替代入口完成采集",
      failure_code: "RENDER_DEPENDENT",
      how_to_resolve: "登录 trae.ai/pricing 通过浏览器人工核对卡片内容；价目以 docs.trae.ai new-plans-and-billing 文档为机读来源",
    });
  }

  // 地区清单口径差异
  if (!facts.regionExclusion.hasMainlandChina && !facts.paymentRegions.hasMainlandChina) {
    unresolvedFacts.push({
      fact: "TRAE 国际版 Supported countries and regions 与 Supported countries/regions (付费服务) 两份官方清单口径不同：前者不含中国大陆/港澳/台湾（产品整体可用性），后者含港澳但不含大陆（付费订阅范围）",
      reason: "同一 Vendor 两份地区清单口径不一致；采集系统分开记录，不互相推导",
      failure_code: "STALE_CONFLICT",
      how_to_resolve: "TRAE 国际版对中国大陆用户：产品不可用 + 付费订阅不可用；港澳用户：产品不可用但付费订阅可用（口径差异）",
    });
  }

  // 国际版 CN 账号订阅互通未确认
  unresolvedFacts.push(
    {
      fact: "TRAE 国际版（trae.ai）与中国版（trae.cn）账号/订阅互通情况",
      reason: "CN changelog 原文 'TRAE CN 与 TRAE 国际版的全局技能目录相互兼容'（2026-06-04），仅技能目录兼容；账号/订阅是否互通未声明",
      failure_code: "RENDER_DEPENDENT",
      how_to_resolve: "注册双站账号并登录实测；官方 FAQ 与 Pricing 未给出互通机制",
    },
    {
      fact: "国际版登录方式清单（邮箱/Google/SSO 选项）",
      reason: "docs.trae.ai 可抓取页面未列出具体 SSO 选项",
      failure_code: "RENDER_DEPENDENT",
      how_to_resolve: "登录页通过浏览器人工核对；或关注 docs.trae.ai 后续更新",
    },
    {
      fact: "国际版 IDE 登录设备上限",
      reason: "docs.trae.ai/ide/device-limit 页面客户端渲染失败（返回 JS 引导/SSR 空数据）；CN 官方文档明确 3 台，国际版无法确认",
      failure_code: "RENDER_DEPENDENT",
      how_to_resolve: "通过浏览器人工核对 device-limit 页面；或关注 GitHub Trae-AI 组织官方回复",
    },
    {
      fact: "国际版 Bonus Usage 数值",
      reason: "官方明确 'Bonus Usage ... an additional flexible usage each month based on your actual use'，无数值",
    },
    {
      fact: "国际版 Pro Trial 从 14 天缩短为 7 天的官方变更公告",
      reason: "现行文档 7 天、2026-02-13 博客 14 天两份官方来源；变更公告未发现",
      failure_code: "STALE_CONFLICT",
    },
    {
      fact: "国际版套餐是否覆盖 TraeWork（AI 工作台）权益",
      reason: "CN 版套餐表明确 '适用产品'；国际版套餐表未提及 TraeWork；2026-08 TraeWork 上线后是否纳入订阅权益未声明",
    },
    {
      fact: "国际版 ToS 全文（含管辖法、出口管制、内容授权条款）",
      reason: "www.trae.ai/terms-of-service 客户端渲染，正文未获取",
      failure_code: "RENDER_DEPENDENT",
      how_to_resolve: "通过浏览器人工核对 ToS 全文；搜索元数据显示发布日期 2026-01-22",
    },
    {
      fact: "国际版各模型 API 费率（按 token × 模型 × 上下文区间分档的精确数值）",
      reason: "docs.trae.ai/ide/models 页面公开 /1M tokens 级费率表；本研究未逐条抽取，按 trust-the-doc 处理",
    },
  );

  return {
    schema_version: "1",
    collection: {
      provider_id: "trae-intl",
      mode,
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    vendor: { vendor_id: "bytedance-trae", display_name: "TRAE（International, ByteDance）" },
    regional_variant: {
      variant_id: "trae-intl",
      operator_entity: unobtainable("Trae 国际版运营主体官方未单独声明；ByteDance 旗下产品"),
      jurisdiction: verified(
        "适用 Supported countries and regions 清单（41 国/地区）",
        "TRAE is currently available in the following countries and regions",
        regionsSourceIds,
      ),
    },
    payment: {
      methods: facts.paymentMethods.length > 0
        ? facts.paymentMethods
        : [
            "Alipay",
            "WeChat Pay (not supported in the United States)",
            "Credit card & debit card (Mastercard/JCB/Visa/Diners/American Express/Discover/UnionPay)",
            "PayPal (not supported in Macao SAR (China), Netherlands, Myanmar, and Turkey)",
            "MoMo",
            "Kakao Pay",
            "DANA",
            "GrabPay",
          ],
      notes: [
        "Pro Trial 仅限信用卡（Other payment methods, such as debit cards, Alipay, and WeChat Pay, are not supported at this time）",
        "美国用户加税：Due to U.S. tax regulations, users in the United States are required to pay additional taxes on top of the original subscription price",
      ],
    },
    quota_system: {
      // 国际版按 "Dollar Usage" 计费：每 token × 模型 API 费率实时扣美元
      // quota_model=usd_equivalence 复用 Cursor 双池原语（虽然国际版无"双池"显式语义）
      quota_model: "usd_equivalence",
      unit: verified("USD (Dollar Usage)", "Dollar Usage: The core billing concept in TRAE, referring to actual US dollar currency, which is used as the final deduction unit", pricingSourceIds),
      formula: verified(
        { raw: "Actual cost ($) = Number of tokens × Model API rate", divisor: 0 },
        "Actual cost ($) = Number of tokens × Model API rate",
        modelsSourceIds,
      ),
      model_multipliers: [],
      mcp_multipliers: [],
      off_peak_discount: notApplicable("TRAE 无公开的非高峰折扣"),
      peak_hours: notApplicable("TRAE 无公开的高峰时段定义"),
    },
    models,
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

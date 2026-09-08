import type {
  PlanCollection,
  PlanField,
  SourceRef,
  UnresolvedFact,
} from "../../../schema/plan.ts";
import type { RawSnapshot } from "../load.ts";
import { deriveSourceChains, type ChainResolution } from "../shared.ts";
import { extractFacts, extractStatedDate, type ExtractedFacts } from "./extract.ts";
import { TRAE_CN_CHAINS, TRAE_CN_SOURCES } from "./sources.ts";

const CHAIN_BY_PURPOSE = {
  pricing: TRAE_CN_CHAINS.find((c) => c.chain_id === "trae-cn-pricing")!,
  plans: TRAE_CN_CHAINS.find((c) => c.chain_id === "trae-cn-billing-rules")!,
  models: TRAE_CN_CHAINS.find((c) => c.chain_id === "trae-cn-models")!,
  deviceLimit: TRAE_CN_CHAINS.find((c) => c.chain_id === "trae-cn-device-limits")!,
  privacy: TRAE_CN_CHAINS.find((c) => c.chain_id === "trae-cn-privacy")!,
  quickstart: TRAE_CN_CHAINS.find((c) => c.chain_id === "trae-cn-registration")!,
  comingSoon: TRAE_CN_CHAINS.find((c) => c.chain_id === "trae-cn-billing-rules")!,
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
  tier_label: "会员 Lite" | "会员 Pro" | "会员 Pro+" | "会员 Ultra";
  audience: "individual" | "team";
}

const PLAN_SPECS: PlanSpec[] = [
  { plan_id: "trae-cn-lite", plan_name: "TRAE 会员 Lite", tier_label: "会员 Lite", audience: "individual" },
  { plan_id: "trae-cn-pro", plan_name: "TRAE 会员 Pro", tier_label: "会员 Pro", audience: "individual" },
  { plan_id: "trae-cn-pro-plus", plan_name: "TRAE 会员 Pro+", tier_label: "会员 Pro+", audience: "individual" },
  { plan_id: "trae-cn-ultra", plan_name: "TRAE 会员 Ultra", tier_label: "会员 Ultra", audience: "individual" },
];

export function normalizeCollection(input: {
  snapshots: RawSnapshot[];
  facts: ExtractedFacts;
  mode: "fixture" | "live";
  collectedAt: string;
  toolVersion: string;
}): PlanCollection {
  const { snapshots, facts, mode, collectedAt, toolVersion } = input;
  const { chains: sourceChainsOut, resolution } = deriveSourceChains(snapshots, TRAE_CN_CHAINS);

  function chainSrc(chainId: string): string[] {
    const chosen = resolution.get(chainId);
    if (chosen) return [chosen];
    const chain = TRAE_CN_CHAINS.find((c) => c.chain_id === chainId);
    return chain?.source_ids ?? [];
  }

  const pricingSourceIds = chainSrc("trae-cn-pricing");
  const billingSourceIds = chainSrc("trae-cn-billing-rules");
  const modelsSourceIds = chainSrc("trae-cn-models");
  const deviceLimitSourceIds = chainSrc("trae-cn-device-limits");
  const privacySourceIds = chainSrc("trae-cn-privacy");
  const quickstartSourceIds = chainSrc("trae-cn-registration");

  // ---- Plans ----
  const plans: PlanCollection["plans"] = PLAN_SPECS.map((spec) => {
    const tier = spec.tier_label;
    const isLite = tier === "会员 Lite";
    const single = facts.pricing.singleMonth[tier];
    const recurring = facts.pricing.recurringMonthly[tier];
    const credits = facts.credits.perTier[tier];
    const concurrent = facts.concurrentTasks.perTier[tier];

    const priceList: PlanCollection["plans"][number]["price_list"] = [];

    // 官方计费周期口径：31 个自然日（非自然月）。随每个价目条目标注，避免与自然月混淆。
    const cycleNote =
      facts.billingPeriod.periodDays !== null
        ? `；计费周期：${facts.billingPeriod.periodDays} 个自然日（官方口径，非自然月；订阅生效日起算）`
        : "";

    // 单月价
    if (single !== null && single !== undefined && Number.isFinite(single)) {
      priceList.push({
        amount: verified(single, facts.pricing.raw, pricingSourceIds),
        currency: verified("CNY", "元/¥", pricingSourceIds),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: `单月价格${cycleNote}`,
        source_ids: pricingSourceIds,
      });
    }
    // 连续包月（订阅式）
    if (recurring !== null && recurring !== undefined && Number.isFinite(recurring)) {
      priceList.push({
        amount: verified(recurring, facts.pricing.raw, pricingSourceIds),
        currency: verified("CNY", "元/¥", pricingSourceIds),
        billing_period: "monthly",
        price_type: "discounted",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: `连续包月折扣价（默认自动续费，可随时取消）${cycleNote}`,
        source_ids: pricingSourceIds,
      });
    }
    // 首月优惠（Lite/Pro 限时首月价）
    if (isLite && facts.firstMonthOffer.lite !== null && Number.isFinite(facts.firstMonthOffer.lite)) {
      priceList.push({
        amount: verified(facts.firstMonthOffer.lite, facts.firstMonthOffer.raw, billingSourceIds),
        currency: verified("CNY", "元/¥", billingSourceIds),
        billing_period: "monthly",
        price_type: "promotional",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: "限时首月优惠（仅限付费新用户，第 2 个月恢复 ¥45）",
        source_ids: billingSourceIds,
      });
    }
    if (tier === "会员 Pro" && facts.firstMonthOffer.pro !== null && Number.isFinite(facts.firstMonthOffer.pro)) {
      priceList.push({
        amount: verified(facts.firstMonthOffer.pro, facts.firstMonthOffer.raw, billingSourceIds),
        currency: verified("CNY", "元/¥", billingSourceIds),
        billing_period: "monthly",
        price_type: "promotional",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: "限时首月优惠（仅限付费新用户，第 2 个月恢复 ¥89）",
        source_ids: billingSourceIds,
      });
    }

    // 额度
    const windows: PlanCollection["plans"][number]["quota"]["windows"] = [];
    if (credits) {
      // Lite 仅 Work 专属积分；其余三档通用积分
      if (isLite && credits.workOnly !== null) {
        windows.push({
          window_type: "monthly",
          window_anchor: "from_subscription",
          amount: verified(credits.workOnly, facts.credits.raw, billingSourceIds),
          unit: "credits (Work 专属积分)",
          status: "verified",
          raw: "会员 Lite 仅适用 TraeWork；通用积分不可用",
          source_ids: billingSourceIds,
        });
      } else if (!isLite && credits.general !== null) {
        windows.push({
          window_type: "monthly",
          window_anchor: "from_subscription",
          amount: verified(credits.general, facts.credits.raw, billingSourceIds),
          unit: "credits (通用积分)",
          status: "verified",
          raw: "通用积分：同时适用于 TraeCode 和 TraeWork",
          source_ids: billingSourceIds,
        });
      }
    }
    // 计费周期（31 个自然日）作为窗口 anchor 信息进入 raw
    if (facts.billingPeriod.periodDays !== null) {
      windows.push({
        window_type: "monthly",
        window_anchor: "from_subscription",
        amount: unobtainable(
          `CN 计费周期：${facts.billingPeriod.periodDays} 个自然日（与国际版 Legacy 的 30 calendar days 不同）；积分按 31 个自然日发放/失效`,
        ),
        unit: "credits (周期：自然日)",
        status: "not_applicable",
        raw: facts.billingPeriod.raw,
        source_ids: billingSourceIds,
      });
    }

    return {
      plan_id: spec.plan_id,
      plan_name: spec.plan_name,
      plan_type: isLite ? "general-subscription" : "coding-subscription",
      audience: spec.audience,
      price_list: priceList,
      quota: {
        quota_model: "credits_5h_weekly",
        windows,
      },
      rate_limits: verified(
        concurrent !== null && concurrent !== undefined
          ? `${concurrent} 个云端任务并行；付费档高峰期优先使用`
          : "高峰期优先使用（付费档）",
        concurrent !== null && concurrent !== undefined
          ? `云端任务并行数量上限：${concurrent}`
          : "高峰期优先使用：✅",
        billingSourceIds,
      ),
      context_window_tokens: unobtainable("CN 文档未公布个人版产品级上下文窗口数值；Max 模式已在 2026-08-07 上线但个人版未提供模型 × 上下文分档表"),
      refund_policy: unobtainable("CN 文档未给出个人会员退款条款"),
      cancellation_notice: verified(
        "支持连续包月；目前不支持将会员套餐降至更低档位；套餐到期后不再续费即可",
        "目前不支持将会员套餐降至更低档位",
        billingSourceIds,
      ),
      purchase_url: verified(
        "https://www.trae.cn/pricing",
        "直接前往 TRAE CN 官网的定价页面进行订阅",
        pricingSourceIds,
      ),
      data_policy: {
        training_use: verified(
          { allowed: true },
          facts.privacyMode.privacyMode ?? "你的相关信息（包括对话内容、代码片段及 AI 生成的输出结果）可能会被用于数据分析、产品优化以及模型训练；开启隐私模式后，TraeCode 将不会将你的任何对话内容……用于上述用途",
          privacySourceIds,
        ),
        processing_location: verified("中国大陆", "TRAE CN 面向中国大陆市场运营；豆包大模型备案公示 (ide_intro-to-llm.md)", pricingSourceIds),
        data_retention: unobtainable("CN 文档未公布积分/对话/代码库保留期限"),
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
        raw: m.gate ? `${m.code}：${m.gate}` : `${m.code} 在所有付费档可调`,
        source_ids: modelsSourceIds,
      },
    ],
  }));

  // ---- 来源清单（三时间戳） ----
  const sources: SourceRef[] = snapshots.map((snapshot) => {
    const stated = extractStatedDate(snapshot.body);
    const isPricingPage = snapshot.source_id === "trae-cn-pricing";
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      source_kind: snapshot.kind,
      fetched_at: snapshot.fetched_at,
      last_updated_at: stated,
      ...(stated
        ? { last_updated_note: "页面显示更新时间" }
        : isPricingPage
          ? { last_updated_note: "客户端渲染定价页（RENDER_DEPENDENT），仅获取页头导航与标题" }
          : { last_updated_note: "页面未显示更新时间（docs.trae.cn），以采集时间为准" }),
      http_status: snapshot.http_status,
      ...(snapshot.failure_code !== undefined ? { failure_code: snapshot.failure_code } : {}),
    };
  });
  sources.sort((a, b) => {
    const orderA = TRAE_CN_SOURCES.findIndex((s) => s.source_id === a.source_id);
    const orderB = TRAE_CN_SOURCES.findIndex((s) => s.source_id === b.source_id);
    return orderA - orderB;
  });

  // ---- 五维地区可用性（CN：无地区清单如实标注为未确认） ----
  const regional_availability: PlanCollection["regional_availability"] = [
    {
      region_code: "CN",
      registration: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "登录方式：手机号、抖音账号、苹果账号、稀土掘金账号",
        source_ids: quickstartSourceIds,
      },
      payment: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "抖音支付、支付宝、微信支付（连续包月暂不支持微信支付）；增购积分支持开票",
        source_ids: pricingSourceIds,
      },
      network_access: {
        state: "unconfirmed",
        status: "unobtainable",
        evidence_raw: "官方未声明 TRAE CN 服务节点位置或对大陆网络可达性的具体说明",
        note: "面向中国大陆市场运营的事实性观察（.cn 域名、抖音/支付宝/微信支付、备案公示）不替代官方服务政策声明",
        source_ids: [],
      },
      service_policy: {
        // CN 无明确"仅限中国大陆"声明：如实标为"无官方地区政策声明"
        state: "unconfirmed",
        status: "unobtainable",
        evidence_raw: "CN 文档未发布任何'仅限中国大陆用户'或完整支持地区清单",
        note: "无官方地区政策声明；不下默认可用结论",
        source_ids: [],
      },
      feature_restrictions: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw: "CN 内置模型集与国际版不同（无 GPT/Gemini；以 Seed/GLM/DeepSeek/Kimi/Qwen 为主）；会员档位门控（Seed-Evolving/DeepSeek-V4-Flash 正式版/Kimi-K3 仅 Pro+ 及以上）",
        source_ids: modelsSourceIds,
      },
    },
  ];

  // ---- Unresolved Facts ----
  const unresolvedFacts: UnresolvedFact[] = [];

  // RENDER_DEPENDENT：trae.cn/pricing 客户端渲染失败
  unresolvedFacts.push({
    fact: "trae.cn/pricing 定价页客户端渲染失败（仅获取到页头导航与标题）",
    reason: "Marketing 定价页为 SPA，server-render 仅返回 JS 引导；正文需经 docs.trae.cn 文档站替代入口完成采集",
    failure_code: "RENDER_DEPENDENT",
    how_to_resolve: "登录 trae.cn/pricing 通过浏览器人工核对卡片内容；价目以 docs.trae.cn ide_plans-and-billing.md 文档为机读来源",
  });

  // TRAE 国际版账号/订阅互通未确认（CN 视角）
  unresolvedFacts.push({
    fact: "TRAE 中国版（trae.cn）与国际版（trae.ai）账号/订阅互通情况",
    reason: "CN changelog 原文 'TRAE CN 与 TRAE 国际版的全局技能目录相互兼容'（2026-06-04），仅技能目录兼容；账号/订阅是否互通未声明",
    failure_code: "RENDER_DEPENDENT",
    how_to_resolve: "注册双站账号并登录实测；官方 FAQ 与 Pricing 未给出互通机制",
  });

  // CN 个人版各模型积分消耗率未公开
  unresolvedFacts.push({
    fact: "TRAE CN 个人版各内置模型的积分消耗率",
    reason: "官方仅声明黑盒规则（'仅调用 TRAE 内置模型时会消耗积分；调用自定义模型不会消耗积分'）；企业版有 Token 刊例价表，个人版是否同价无法确认",
  });

  // CN 官方地区政策未声明
  unresolvedFacts.push({
    fact: "TRAE CN 是否有官方'仅限中国大陆用户'或完整支持地区声明",
    reason: "CN 文档未发布任何地区清单或国别排除声明；仅事实性观察指向中国大陆市场",
  });

  // CN 个人版是否强制实名认证
  unresolvedFacts.push({
    fact: "TRAE CN 注册是否强制实名认证",
    reason: "官方未在可抓取页面说明手机号以外的实名认证要求",
  });

  return {
    schema_version: "1",
    collection: {
      provider_id: "trae-cn",
      mode,
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    vendor: { vendor_id: "bytedance-trae", display_name: "TRAE（CN, ByteDance）" },
    regional_variant: {
      variant_id: "trae-cn",
      operator_entity: unobtainable("TRAE CN 运营主体官方未单独声明；ByteDance 旗下产品"),
      jurisdiction: unobtainable("CN 文档未发布官方地区政策声明；运营法域按中国大陆事实性观察（不替代官方声明）"),
    },
    payment: {
      methods: facts.paymentMethods.length > 0
        ? facts.paymentMethods
        : ["抖音支付", "支付宝", "微信支付（连续包月暂不支持）"],
      notes: [
        "增购积分支持开票",
        "微信支付不支持连续包月；连续包月仅抖音支付/支付宝可用",
      ],
    },
    quota_system: {
      quota_model: "credits_5h_weekly",
      unit: verified("credits (积分)", "积分：TRAE CN 的额度单位", billingSourceIds),
      formula: unobtainable("TRAE CN 个人版未公开各模型积分消耗率（黑盒）"),
      model_multipliers: [],
      mcp_multipliers: [],
      off_peak_discount: verified(
        0.25,
        "Seed 模型福利：Seed-2.1-Turbo 与 Seed-Code 模型计费享 2.5 折",
        billingSourceIds,
      ),
      peak_hours: notApplicable("TRAE CN 无公开的高峰时段定义；'高峰期优先使用' 为定性权益"),
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

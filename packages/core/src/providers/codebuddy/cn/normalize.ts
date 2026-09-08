import type {
  PlanCollection,
  PlanCollectionPayload,
  PlanField,
  UnresolvedFact,
} from "../../../schema/plan.ts";
import type { RawSnapshot } from "../../_shared.ts";
import { deriveSourceChains } from "../../_shared.ts";
import {
  buildSources,
  makeChainSrc,
  sortSourcesByRegistry,
  unobtainable,
  verified,
} from "../../normalize-shared.ts";
import { extractFacts, extractStatedDate, type ExtractedFacts } from "./extract.ts";
import { CODEBUDDY_CN_CHAINS, CODEBUDDY_CN_SOURCES, SRC } from "./sources.ts";

const CHAIN_BY_PURPOSE = {
  pricing: CODEBUDDY_CN_CHAINS.find((c) => c.chain_id === "codebuddy-cn-pricing")!,
  version: CODEBUDDY_CN_CHAINS.find((c) => c.chain_id === "codebuddy-cn-version")!,
  billing: CODEBUDDY_CN_CHAINS.find((c) => c.chain_id === "codebuddy-cn-billing")!,
  credits: CODEBUDDY_CN_CHAINS.find((c) => c.chain_id === "codebuddy-cn-credits-rules")!,
  faq: CODEBUDDY_CN_CHAINS.find((c) => c.chain_id === "codebuddy-cn-faq")!,
};

const PROMOTION_DOUBLE_CREDITS_NOTE =
  "加赠积分/月（限时）=基础积分/月；活动区间外的标准价为'基础积分/月'列";

/** 已验证字段的工厂：value + raw + source_ids（从 normalize-shared 引入）。 */
interface PlanSpec {
  plan_id: string;
  plan_name: string;
  tier_label: string;
  audience: "individual" | "team";
}

const INDIVIDUAL_PLANS: PlanSpec[] = [
  { plan_id: "codebuddy-cn-experience", plan_name: "CodeBuddy 体验版", tier_label: "体验版", audience: "individual" },
  { plan_id: "codebuddy-cn-standard", plan_name: "CodeBuddy 标准版", tier_label: "标准版", audience: "individual" },
  { plan_id: "codebuddy-cn-premium", plan_name: "CodeBuddy 高级版", tier_label: "高级版", audience: "individual" },
  { plan_id: "codebuddy-cn-flagship", plan_name: "CodeBuddy 旗舰版", tier_label: "旗舰版", audience: "individual" },
];

const ENTERPRISE_PLANS: PlanSpec[] = [
  { plan_id: "codebuddy-cn-saas-enterprise", plan_name: "CodeBuddy SaaS 企业版", tier_label: "SaaS 企业版", audience: "team" },
  { plan_id: "codebuddy-cn-exclusive-cloud-enterprise", plan_name: "CodeBuddy 专有云企业版", tier_label: "专有云企业版", audience: "team" },
  { plan_id: "codebuddy-cn-private-enterprise", plan_name: "CodeBuddy 私有化企业版", tier_label: "私有化企业版", audience: "team" },
];

export function normalizeCollection(input: {
  snapshots: RawSnapshot[];
  facts: ExtractedFacts;
  mode: "fixture" | "live";
  collectedAt: string;
  toolVersion: string;
}): PlanCollectionPayload {
  const { snapshots, facts, mode, collectedAt, toolVersion } = input;
  const { chains: sourceChainsOut, resolution } = deriveSourceChains(snapshots, CODEBUDDY_CN_CHAINS);
  // 字段级 source_ids：链内首个 ok 来源，整链失败回退候选数组（可从 CLI 输出追溯）
  const chainSrc = makeChainSrc(resolution, CODEBUDDY_CN_CHAINS);

  const pricingSourceIds = chainSrc("codebuddy-cn-pricing");
  const creditsSourceIds = chainSrc("codebuddy-cn-credits-rules");
  const faqSourceIds = chainSrc("codebuddy-cn-faq");
  const versionSourceIds = chainSrc("codebuddy-cn-version");

  // ---- 个人版 Plans ----
  const plans: PlanCollection["plans"] = INDIVIDUAL_PLANS.map((spec) => {
    const tier = spec.tier_label;
    const isFree = tier === "体验版";
    const monthlyAmount = facts.individualPricing.monthly[tier];
    const annualAmount = facts.individualPricing.annual[tier];
    const totalCredits = facts.individualCredits.total[tier];
    const bonusCredits = facts.individualCredits.bonus[tier];

    const priceList: PlanCollection["plans"][number]["price_list"] = [];
    // 月付
    if (monthlyAmount !== undefined && Number.isFinite(monthlyAmount)) {
      priceList.push({
        amount: verified(monthlyAmount, facts.individualPricing.raw, pricingSourceIds),
        currency: verified("CNY", "元", pricingSourceIds),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        source_ids: pricingSourceIds,
      });
    }
    // 连续包月（年付一次性折扣：按月算的优惠价）
    const monthlyDisc = facts.individualPricing.monthlyDiscount[tier];
    if (monthlyDisc !== undefined && Number.isFinite(monthlyDisc) && !isFree) {
      priceList.push({
        amount: verified(monthlyDisc, facts.individualPricing.raw, pricingSourceIds),
        currency: verified("CNY", "元", pricingSourceIds),
        billing_period: "monthly",
        price_type: "discounted",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: "连续包月折扣价（默认自动续费，可随时取消）",
        source_ids: pricingSourceIds,
      });
    }
    // 年付
    if (annualAmount !== undefined && Number.isFinite(annualAmount)) {
      priceList.push({
        amount: verified(annualAmount, facts.individualPricing.raw, pricingSourceIds),
        currency: verified("CNY", "元", pricingSourceIds),
        billing_period: "annual",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        source_ids: pricingSourceIds,
      });
    }
    // 连续包年
    const annualDisc = facts.individualPricing.annualDiscount[tier];
    if (annualDisc !== undefined && Number.isFinite(annualDisc) && !isFree) {
      priceList.push({
        amount: verified(annualDisc, facts.individualPricing.raw, pricingSourceIds),
        currency: verified("CNY", "元", pricingSourceIds),
        billing_period: "annual",
        price_type: "discounted",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: "连续包年折扣价（订阅式年付，可随时取消）",
        source_ids: pricingSourceIds,
      });
    }

    // 月度积分
    const windows: PlanCollection["plans"][number]["quota"]["windows"] = [];
    if (totalCredits !== undefined && Number.isFinite(totalCredits)) {
      const raw = facts.individualCredits.raw;
      windows.push({
        window_type: "monthly",
        window_anchor: "from_subscription",
        amount: verified(totalCredits, raw, creditsSourceIds),
        unit: "credits",
        status: "verified",
        raw: "积分按月发放，当月有效、不累积结转",
        source_ids: creditsSourceIds,
      });
    }
    if (bonusCredits !== undefined && Number.isFinite(bonusCredits) && bonusCredits > 0) {
      // 加赠积分是限时活动（双倍 Credits）的产物；本身是已验证事实，活动区间在 promotions 中带日期采集
      windows.push({
        window_type: "monthly",
        window_anchor: "from_subscription",
        amount: verified(bonusCredits, facts.individualCredits.raw, pricingSourceIds),
        unit: "credits",
        status: "verified",
        raw: "加赠积分/月（限时）",
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
          ? "对话和问答频率限制（官方未给出具体数值）；代码补全限 5,000 次/月（限免无限次）"
          : "对话问答不限频；代码补全无限次",
        isFree ? "高频使用对话和问答时会触发限频" : "对话问答不限频",
        pricingSourceIds,
      ),
      context_window_tokens: unobtainable(undefined, "官方未给出 Coding Plan 上下文窗口数值；仅个别模型简介标 1M 上下文"),
      refund_policy: verified(
        "个人版订阅一经购买不支持退款；加量包一经购买不支持退款",
        "个人版订阅一经购买不支持退款；加量包一经购买不支持退款",
        creditsSourceIds,
      ),
      cancellation_notice: verified(
        "连续包月 / 连续包年默认自动续费；可在个人主页 → 订阅管理关闭自动续费；到期后降级为体验版",
        "连续包月 / 连续包年默认自动续费，可随时在个人主页取消；到期后降级为体验版",
        creditsSourceIds,
      ),
      purchase_url: verified(
        "https://www.codebuddy.cn/docs/ide/Account/pricing",
        "登录 codebuddy.cn 官网 → 个人主页 → 订阅管理",
        pricingSourceIds,
      ),
      data_policy: {
        training_use: verified(
          { allowed: false },
          "用户代码不作为模型训练数据（默认）",
          faqSourceIds,
        ),
        processing_location: verified("中国大陆", "腾讯云服务", pricingSourceIds),
        data_retention: verified(
          "积分基础 1 个月内有效；赠送积分自到账日起 1 个月内有效",
          "基础积分：自发放日起 1 个月内有效；加赠积分：自发放日起 1 个月内有效；赠送积分：自到账日起 1 个月内有效",
          creditsSourceIds,
        ),
        zdr_offered: unobtainable(undefined, "官方未声明 ZDR 选项"),
      },
    };
  });

  // ---- 企业版 Plans ----
  for (const spec of ENTERPRISE_PLANS) {
    const tier = spec.tier_label;
    const isPrivate = tier === "私有化企业版";
    const monthly = facts.enterprisePricing.monthly[tier];
    const annual = facts.enterprisePricing.annual[tier];

    const priceList: PlanCollection["plans"][number]["price_list"] = [];
    if (monthly !== undefined && Number.isFinite(monthly)) {
      priceList.push({
        amount: verified(monthly, facts.enterprisePricing.raw, pricingSourceIds),
        currency: verified("CNY", "元", pricingSourceIds),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        source_ids: pricingSourceIds,
      });
    }
    if (annual !== undefined && Number.isFinite(annual)) {
      priceList.push({
        amount: verified(annual, facts.enterprisePricing.raw, pricingSourceIds),
        currency: verified("CNY", "元", pricingSourceIds),
        billing_period: "annual",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        source_ids: pricingSourceIds,
      });
    }

    const windows: PlanCollection["plans"][number]["quota"]["windows"] = isPrivate
      ? []
      : [
          {
            window_type: "monthly",
            window_anchor: "from_subscription",
            amount: verified(2000, "包含 2000 Credits/人，每月刷新", pricingSourceIds),
            unit: "credits",
            status: "verified",
            raw: "Credits 团队内共享使用",
            source_ids: pricingSourceIds,
          },
        ];

    plans.push({
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
        isPrivate ? "无用量限制（私有化部署）" : "对话问答不限频",
        isPrivate ? "无用量限制" : "对话问答不限频",
        pricingSourceIds,
      ),
      context_window_tokens: unobtainable(),
      refund_policy: verified(
        isPrivate ? "以合同约定为准" : "不支持退款",
        "加量包一经购买不支持退款",
        creditsSourceIds,
      ),
      cancellation_notice: verified(
        "订阅到期后续费按当时官方价目执行；取消需提前联系商务",
        "连续包月 / 连续包年默认自动续费",
        creditsSourceIds,
      ),
      purchase_url: verified(
        "https://cloud.tencent.com/product/acc",
        "Tencent Cloud 产品页",
        pricingSourceIds,
      ),
      data_policy: {
        training_use: verified({ allowed: false }, "用户代码不作为模型训练数据（默认）", faqSourceIds),
        processing_location: verified("中国大陆", "腾讯云服务", pricingSourceIds),
        data_retention: unobtainable(),
        zdr_offered: unobtainable(),
      },
    });
  }

  // ---- 模型清单 ----
  const models: PlanCollection["models"] = facts.modelList.models.map((m) => ({
    model_code: m.code,
    release_date: unobtainable(undefined, "官方未给出模型发布日期"),
    deprecation_date: unobtainable(undefined, "官方未给出模型弃用日期"),
    availability: [
      {
        plans: "all",
        state: "supported",
        routed_to: null,
        status: "verified",
        raw: m.note || `${m.code} 在所有付费档可调`,
        source_ids: pricingSourceIds,
      },
    ],
  }));

  // ---- 限时促销 ----
  const promotions: PlanCollection["promotions"] = [];
  if (facts.doubleCreditsCampaign) {
    promotions.push({
      description: "双倍 Credits 活动：标准版/高级版/旗舰版每月实得积分翻倍（加赠积分=基础积分）",
      kind: "quota",
      effective_from: facts.doubleCreditsCampaign.effective_from,
      effective_until: facts.doubleCreditsCampaign.effective_until,
      status: "verified",
      raw: facts.doubleCreditsCampaign.raw,
      source_ids: pricingSourceIds,
    });
  }

  // ---- 来源清单（三时间戳） ----
  const sources = buildSources(
    snapshots,
    (snapshot) => extractStatedDate(snapshot.body),
    (_snapshot, stated) =>
      stated === null ? "页面未显示更新时间，以采集时间为准" : "页面显示 '最近更新时间'",
  );

  // ---- 五维地区可用性 ----
  const regional_availability: PlanCollection["regional_availability"] = [
    {
      region_code: "CN",
      registration: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "腾讯云账号 + 微信扫码认证 / QQ 扫码认证 / 人脸识别认证",
        source_ids: pricingSourceIds,
      },
      payment: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "微信支付、QQ 钱包、网银支付",
        source_ids: pricingSourceIds,
      },
      network_access: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "国内站部署于腾讯云；插件连接域名 copilot.tencent.com",
        source_ids: faqSourceIds,
      },
      service_policy: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "国内站产品页/文档未发布任何关于服务地区范围或国别排除的声明",
        source_ids: pricingSourceIds,
      },
      feature_restrictions: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "国内站功能集与企业版/个人版功能差异按产品页定义",
        source_ids: pricingSourceIds,
      },
    },
  ];

  // ---- Unresolved Facts ----
  const unresolvedFacts: UnresolvedFact[] = [];

  // STALE_CONFLICT：1749/126592 旧价 vs 109769 新三档并存
  if (facts.legacyPricingInBilling) {
    unresolvedFacts.push({
      fact: `计费概述页面（cloud-1749-126592）仍显示旧价个人专业版 ${facts.legacyPricingInBilling.monthly} 元/月（${facts.legacyPricingInBilling.annual} 元/年），与版本说明（cloud-1749-109769）的新三档（标准版/高级版/旗舰版）并存；当前有效价以版本说明与 codebuddy.cn 定价页为准`,
      reason:
        "同产品同文档号内两页口径不一致；计费概述未同步新价；不静默采用其中之一",
      failure_code: "STALE_CONFLICT",
      how_to_resolve: "登录个人主页或联系商务确认当前在售档位；计费概述页面将随下次同步下线",
    });
  }

  // 老用户保价
  if (facts.legacyRetention) {
    unresolvedFacts.push({
      fact: `原个人专业版 ${facts.legacyRetention.monthly} 元/月档老用户 2026-12-31 前按 ${facts.legacyRetention.monthly} 元/月续费，2027-01-01 起按 70 元/月续费`,
      reason: "老用户保价是过渡条款；新用户不享受；本 Provider 不建模旧档位",
      failure_code: "TIME_DEPENDENT",
      how_to_resolve: "查看用户在 2026-07-01 前是否已订阅个人专业版档位",
    });
  }

  // LOGIN_REQUIRED：年付实际单价 / 个人加量包价格 / 各模型 Credits 消耗明细
  unresolvedFacts.push(
    {
      fact: "个人版年付实际单价（连续包年）登录后展示",
      reason: "codebuddy.cn 定价页仅列连续包年优惠价 672/1344/6720 元；登录后个人主页可能有专属价；定价页未给出'年付实际单价（连续包年）'的字段语义",
      failure_code: "LOGIN_REQUIRED",
      how_to_resolve: "登录 codebuddy.cn → 个人主页 → 订阅管理 → 选择对应档位读取",
    },
    {
      fact: "各模型 Credits 消耗明细（按模型 × Token × 任务复杂度）",
      reason: "官方明确需登录个人主页 → 用量管理查看；公开页面无换算表",
      failure_code: "LOGIN_REQUIRED",
      how_to_resolve: "登录 codebuddy.cn → 个人主页 → 用量管理查看各模型消耗明细",
    },
    {
      fact: "企业版团队内 Credits 共享池的实际扣减规则（席位变更/成员离开/新增成员的额度重算）",
      reason: "官方仅给总池公式（订阅席位 × 2,000 Credits/月）；实际扣减规则需商务合同确认",
      failure_code: "LOGIN_REQUIRED",
      how_to_resolve: "联系商务或在企业管理后台查阅订阅规则",
    },
    {
      fact: "体验版'对话和问答频率限制'的具体数值",
      reason: "官方仅写'高频使用对话和问答时会触发限频'，无数值",
    },
    {
      fact: "数值化并发/速率限制（RPM 或并发数）",
      reason: "官方仅给口径（对话问答不限频/限频），未给数值",
    },
    {
      fact: "CodeBuddy 国际站（codebuddy.ai）与国内站账号/订阅互通情况",
      reason: "官方 FAQ 明确两个站账号体系独立；互通机制未声明",
    },
  );

  // ---- 回退链 ----
  const source_chains = sourceChainsOut;

  // 将来源清单按 registry 排序，便于阅读
  sortSourcesByRegistry(sources, CODEBUDDY_CN_SOURCES);

  return {
    schema_version: "1",
    collection: {
      provider_id: "tencent-codebuddy-cn",
      mode,
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    vendor: { vendor_id: "tencent-cloud", display_name: "腾讯云 CodeBuddy（中国站）" },
    regional_variant: {
      variant_id: "codebuddy-cn",
      operator_entity: verified(
        "腾讯云计算（北京）有限责任公司",
        "腾讯云账号体系，签约主体为腾讯云计算（北京）有限责任公司",
        facts.sources.version ? [facts.sources.version] : versionSourceIds,
      ),
      jurisdiction: verified("中国大陆", "中国大陆法律框架", facts.sources.version ? [facts.sources.version] : versionSourceIds),
    },
    payment: {
      methods: facts.paymentMethods.length > 0 ? facts.paymentMethods : ["微信支付", "QQ 钱包", "网银支付"],
      notes: [
        "个人套餐自动续费经微信支付扣款",
        "港澳台个人可通过微信扫码认证通道完成实名认证",
      ],
    },
    quota_system: {
      quota_model: "credits_5h_weekly",
      unit: verified("credits", "积分（Credits）", pricingSourceIds),
      formula: facts.creditFormula
        ? verified(
            { raw: facts.creditFormula, divisor: 0 },
            facts.creditFormula,
            creditsSourceIds,
          )
        : unobtainable(undefined, "官方仅声明黑盒规则，未给出除数"),
      model_multipliers: [],
      mcp_multipliers: [],
      off_peak_discount: unobtainable(undefined, "credits 体系无公开的非高峰折扣"),
      peak_hours: unobtainable(undefined, "credits 体系无公开的高峰时段定义"),
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
): PlanCollectionPayload {
  return normalizeCollection({
    snapshots,
    facts: extractFacts(snapshots, CHAIN_BY_PURPOSE),
    mode,
    collectedAt,
    toolVersion,
  });
}
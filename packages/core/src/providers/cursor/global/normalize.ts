import type {
  PlanCollection,
  PlanCollectionPayload,
  PlanField,
  QualityStatus,
  QuotaWindow,
  SourceRef,
  UnresolvedFact,
} from "../../../schema/plan.ts";
import type { FailureCode } from "../../../schema/plan.ts";
import type { RawSnapshot } from "../load.ts";
import { deriveSourceChains, type ChainResolution } from "../shared.ts";
import {
  extractFacts,
  extractStatedDate,
  type Attributed,
  type ExtractedFacts,
} from "./extract.ts";
import { CURSOR_CHAINS, CURSOR_SOURCES, SRC } from "./sources.ts";

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

/** 不适用字段的工厂：usd_equivalence 体系下积分公式/高峰时段等概念整体不适用。 */
function notApplicable<T>(note?: string): PlanField<T> {
  return {
    value: null,
    status: "not_applicable",
    source_ids: [],
    ...(note ? { note } : {}),
  };
}

/**
 * 归因结果 → 字段级 source_ids。
 * 抽取命中时用实际命中的来源（JS 渲染定价页的替代入口落在字段级可追溯）；
 * 整组未命中时回退为该链的链级回退数组（链 chosen 与候选可从 source_chains 追溯）。
 */
function srcOf<T>(attributed: Attributed<T>, chainFallbackIds: string[]): string[] {
  return attributed.sourceId ? [attributed.sourceId] : chainFallbackIds;
}

interface TierSpec {
  plan_id: string;
  plan_name: string;
  /** 帮助中心表行名。 */
  tier: string;
  /** 定价页 JSON-LD Offer 名；不在 JSON-LD 中的档位为 null。 */
  jsonLdName: string | null;
  audience: "individual" | "team";
}

const TIERS: TierSpec[] = [
  { plan_id: "cursor-hobby", plan_name: "Hobby", tier: "Hobby", jsonLdName: "Hobby", audience: "individual" },
  { plan_id: "cursor-pro", plan_name: "Pro", tier: "Pro", jsonLdName: "Pro", audience: "individual" },
  { plan_id: "cursor-pro-plus", plan_name: "Pro+", tier: "Pro+", jsonLdName: "Pro+", audience: "individual" },
  { plan_id: "cursor-ultra", plan_name: "Ultra", tier: "Ultra", jsonLdName: "Ultra", audience: "individual" },
  { plan_id: "cursor-teams-standard", plan_name: "Teams Standard", tier: "Teams Standard", jsonLdName: "Teams", audience: "team" },
  { plan_id: "cursor-teams-premium", plan_name: "Teams Premium", tier: "Teams Premium", jsonLdName: null, audience: "team" },
  { plan_id: "cursor-enterprise", plan_name: "Enterprise", tier: "Enterprise", jsonLdName: null, audience: "team" },
];

const PAID_INDIVIDUAL_IDS = ["cursor-pro", "cursor-pro-plus", "cursor-ultra"];

/** 三方模型可用的档位（"paid plans unlock all models"；Hobby 子集官方未公布）。 */
const THIRD_PARTY_PLAN_IDS = [...PAID_INDIVIDUAL_IDS, "cursor-teams-standard", "cursor-teams-premium"];

const USD_EQUIVALENCE_NOTE =
  "美元等值语义：额度按所调模型的官方 API 费率从池中扣减（usage is not 1:1 by token count），不是 messages/tokens 计数单位，不与 messages/tokens 混算";

/** 币种字段工厂：个人与团队计划以 USD 报价（ToS §4.1）。 */
function usdCurrency(sourceIds: string[]): PlanField<string> {
  return verified("USD", "all fees are in U.S. Dollars", sourceIds);
}

function slugifyModelName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function normalizeCollection(input: {
  snapshots: RawSnapshot[];
  facts: ExtractedFacts;
  mode: "fixture" | "live";
  collectedAt: string;
  toolVersion: string;
}): PlanCollectionPayload {
  const { snapshots, facts, mode, collectedAt, toolVersion } = input;
  const { chains: sourceChainsOut, resolution } = deriveSourceChains(snapshots, CURSOR_CHAINS);

  /** 取得链内首个 ok=true 来源的 id；整链失败时退回到该链的候选数组（用于无归因的字段）。 */
  function chainSrc(chainId: string): string[] {
    const chosen = resolution.get(chainId);
    if (chosen) return [chosen];
    const chain = CURSOR_CHAINS.find((c) => c.chain_id === chainId);
    return chain?.source_ids ?? [];
  }

  const pricingSourceIds = chainSrc("cursor-pricing");
  const quotaSourceIds = chainSrc("cursor-quota-pools");
  const regionalSourceIds = chainSrc("cursor-regional");
  const dataPolicySourceIds = chainSrc("cursor-data-policy");
  const historySourceIds = chainSrc("cursor-pricing-history");
  const teamsAnnualSourceIds = chainSrc("cursor-teams-annual");
  const usageVisibilitySourceIds = chainSrc("cursor-usage-visibility");
  const personalYearlySourceIds = chainSrc("cursor-personal-yearly");

  // ---- 关键事实的来源归因（命中则单元素；未命中则回退为链级数组） ----
  const jsonLdIds = srcOf(facts.jsonLd, pricingSourceIds);
  const helpTableIds = srcOf(facts.helpPriceTable, pricingSourceIds);
  const poolIds = srcOf(facts.otherModelsPool, quotaSourceIds);
  const firstPartyIds = srcOf(facts.firstPartyPool, quotaSourceIds);
  const usageResetIds = srcOf(facts.usageReset, quotaSourceIds);
  const iosIds = srcOf(facts.iosChina, regionalSourceIds);
  const regionsIds = srcOf(facts.modelRegions, regionalSourceIds);
  const tosIds = srcOf(facts.exportControl, regionalSourceIds);
  const privacyIds = srcOf(facts.privacyMode, dataPolicySourceIds);
  const adminApiIds = srcOf(facts.adminApi, usageVisibilitySourceIds);

  const jsonLdOffers = facts.jsonLd.fact?.offers ?? [];

  /** JSON-LD Offer 价（JS 渲染定价页内嵌结构化数据）。 */
  function jsonLdPrice(name: string): { price: number; raw: string } | null {
    const offer = jsonLdOffers.find((o) => o.name === name && o.currency === "USD");
    if (!offer) return null;
    return { price: offer.price, raw: JSON.stringify({ "@type": "Offer", name: offer.name, price: offer.price, priceCurrency: offer.currency }) };
  }

  /** 帮助中心表月付价。 */
  function helpTablePrice(tier: string): { price: number; raw: string } | null {
    const row = facts.helpPriceTable.fact?.rows[tier];
    if (!row || row.monthly === null) return null;
    return { price: row.monthly, raw: row.raw };
  }

  // ---- Plans ----
  const plans: PlanCollection["plans"] = TIERS.map((spec) => {
    const isTeams = spec.audience === "team";
    const isPersonalPaid = PAID_INDIVIDUAL_IDS.includes(spec.plan_id);

    // -- 价目 --
    const priceList: PlanCollection["plans"][number]["price_list"] = [];

    const fromJsonLd = spec.jsonLdName ? jsonLdPrice(spec.jsonLdName) : null;
    const fromHelpRow = helpTablePrice(spec.tier);
    if (fromJsonLd) {
      priceList.push({
        amount: verified(fromJsonLd.price, fromJsonLd.raw, jsonLdIds),
        currency: usdCurrency(tosIds),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        ...(spec.tier === "Hobby" ? { note: "免费档，无需信用卡" } : {}),
        source_ids: jsonLdIds,
      });
    } else if (fromHelpRow) {
      // 定价页 JSON-LD 未覆盖的档位（Teams Premium）从帮助中心表回退采集
      priceList.push({
        amount: verified(fromHelpRow.price, fromHelpRow.raw, helpTableIds),
        currency: usdCurrency(tosIds),
        billing_period: "monthly",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        source_ids: helpTableIds,
      });
    } else {
      // 档位存在但所有候选来源都无数值（Enterprise 官方即 Custom；其余档位属于来源整链失败后的降级）
      priceList.push({
        amount: unobtainable(undefined, spec.plan_id === "cursor-enterprise" ? "Custom——按合同报价（contact-sales），官方无公开定价" : "所有候选来源均未提供本档月付价"),
        currency: usdCurrency(tosIds),
        billing_period: "monthly",
        // Enterprise 的 Custom 报价本质是起价；其余档位是标准月付价"读不到"，不是"无标准价"
        price_type: spec.plan_id === "cursor-enterprise" ? "starting_at" : "standard",
        effective_from: null,
        effective_until: null,
        status: "unobtainable",
        ...(spec.plan_id === "cursor-enterprise" ? { note: "定价页卡片显示 'Enterprise: Custom'" } : {}),
        source_ids: pricingSourceIds,
      });
    }

    // Teams 年付（官方数值仅 Teams 有：$32/$96 per seat per month）
    if (isTeams && facts.teamsPricing.fact) {
      const tp = facts.teamsPricing.fact;
      const annual = spec.plan_id === "cursor-teams-standard" ? tp.standardAnnual : tp.premiumAnnual;
      priceList.push({
        amount: verified(annual, tp.raw, teamsAnnualSourceIds),
        currency: usdCurrency(tosIds),
        billing_period: "annual",
        price_type: "standard",
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: "按 seat 计费（年付价折算到每月 per seat）；账单按 active paid seat",
        source_ids: teamsAnnualSourceIds,
      });
    }

    // 个人年付：官方仅声明 20% 折扣，具体月单价需登录 Stripe checkout → 显式不可获取
    if (isPersonalPaid) {
      const discountQuote = facts.yearlyDiscount.fact;
      priceList.push({
        amount: unobtainable(
          "LOGIN_REQUIRED",
          discountQuote
            ? `官方仅声明 "${discountQuote}"；具体月单价需登录 Stripe checkout 确认（官方展示文本不含 $16/$48/$160 等换算值）`
            : "具体月单价需登录 Stripe checkout 确认",
        ),
        currency: usdCurrency(tosIds),
        billing_period: "annual",
        price_type: "discounted",
        effective_from: null,
        effective_until: null,
        status: "unobtainable",
        note: "年付 20% 折扣为官方声明；本采集不自行换算月单价",
        source_ids: srcOf(facts.yearlyDiscount, personalYearlySourceIds),
      });
    }

    // -- 双池额度（usd_equivalence）--
    const onDemandSuffix = facts.onDemand.fact?.noMarkup
      ? `on-demand 溢出计费：池耗尽后可开启 on-demand 按月后付（billed in arrears），费率与池内相同（${facts.onDemand.fact.noMarkup}）`
      : "on-demand 溢出计费：池耗尽后可开启 on-demand，按相同模型 API 费率后付";
    const teamsOrderSuffix =
      isTeams && facts.teamsPoolOrder.fact ? ` Teams 池耗尽顺序：${facts.teamsPoolOrder.fact}` : "";
    // Teams/Enterprise 第三方请求另加 Cursor Token Rate（含 BYOK）——附加费不单看池面值
    const tokenRateSuffix =
      isTeams && facts.tokenRate.fact
        ? `；第三方模型请求另加 Cursor Token Rate：${facts.tokenRate.fact.rate}${facts.tokenRate.fact.appliesTo ? `（${facts.tokenRate.fact.appliesTo}；含 BYOK）` : "（含 BYOK）"}`
        : "";
    // Pro 2025-06 改制历史：用量制为准，请求制口径仅作来源注释（原文经 pricing-history 链归因）
    const transitionNote =
      spec.plan_id === "cursor-pro"
        ? ` 2025-06-16 起 Pro 由请求制（${facts.pricingTransition.fact?.legacyRaw ?? "500 requests per month, with Sonnet models costing two requests"}）改为用量制；2025-07-04 官方澄清道歉并退款（${facts.pricingApology.fact ?? "'unlimited usage' was only for Auto"}）。本采集以现行用量制为准，请求制口径仅作来源注释。`
        : "";

    const windows: QuotaWindow[] = [];

    // 池 1：Cursor Models（第一方池，官方无数值）
    {
      const statement =
        facts.firstPartyPool.fact ??
        (spec.tier === "Hobby" ? (facts.helpPriceTable.fact?.rows["Hobby"]?.otherModels ?? null) : null);
      const teamsAllowance = isTeams ? (facts.helpPriceTable.fact?.rows[spec.tier]?.otherModels ?? null) : null;
      windows.push({
        window_type: "monthly",
        window_anchor: "from_subscription",
        amount: unobtainable(undefined, "官方故意不公布本池数值"),
        unit: "USD-equivalent @ 模型 API 费率（Cursor Models 池）",
        status: "unobtainable",
        raw: statement ?? teamsAllowance ?? undefined,
        note: isTeams
          ? `${USD_EQUIVALENCE_NOTE}；${onDemandSuffix}${teamsOrderSuffix}${tokenRateSuffix}`
          : `${USD_EQUIVALENCE_NOTE}；${onDemandSuffix}`,
        source_ids: statement ? firstPartyIds : [],
      });
    }

    // 池 2：Other Models（第三方池，美元等值有官方数值）
    {
      const perTierValue = facts.otherModelsPool.fact?.perTier[spec.tier === "Pro+" ? "Pro+" : spec.tier];
      const teamsAllowance = isTeams ? (facts.helpPriceTable.fact?.rows[spec.tier]?.otherModels ?? null) : null;
      const poolRaw = facts.otherModelsPool.fact?.raw;
      if (perTierValue !== undefined) {
        windows.push({
          window_type: "monthly",
          window_anchor: "from_subscription",
          amount: verified(perTierValue, poolRaw, poolIds),
          unit: "USD-equivalent @ 模型 API 费率（Other Models 池）",
          status: "verified",
          note: `${USD_EQUIVALENCE_NOTE}；${onDemandSuffix}${tokenRateSuffix}。${transitionNote.trim()}`,
          // 池数值来自 quota 链；Pro 的改制历史注释来自 pricing-history 链（来源注释可机读追溯）
          source_ids: spec.plan_id === "cursor-pro" ? [...poolIds, ...historySourceIds] : poolIds,
        });
      } else {
        windows.push({
          window_type: "monthly",
          window_anchor: "from_subscription",
          amount: unobtainable(),
          unit: "USD-equivalent @ 模型 API 费率（Other Models 池）",
          status: "unobtainable",
          raw: teamsAllowance ?? poolRaw,
          note: isTeams
            ? `${USD_EQUIVALENCE_NOTE}；${onDemandSuffix}${teamsOrderSuffix}${tokenRateSuffix}。官方未给出绝对数值${spec.plan_id === "cursor-teams-premium" ? "（'5x the usage of a Standard seat' 为相对倍数，不按 5×$20 推算）" : ""}。${transitionNote.trim()}`
            : `${USD_EQUIVALENCE_NOTE}；${onDemandSuffix}。${spec.plan_id === "cursor-hobby" ? "Hobby 档为 'Limited'，无数值。" : ""}${transitionNote.trim()}`,
          source_ids: teamsAllowance ? helpTableIds : [],
        });
      }
    }

    // -- 计划 --
    return {
      plan_id: spec.plan_id,
      plan_name: spec.plan_name,
      plan_type: "coding-subscription",
      audience: spec.audience,
      price_list: priceList,
      quota: {
        quota_model: "usd_equivalence",
        windows,
      },
      rate_limits: unobtainable(
        undefined,
        "官方未公布用户级速率数值；限额表现为用量池消耗 + on-demand。Admin API 自身限速 20 requests/min per team（非用户级）。历史 'fast requests/slow requests' 术语已随 2025-06 改制退场",
      ),
      context_window_tokens: unobtainable(
        undefined,
        "官方未公布 plan 级上下文窗口数值；模型级默认/最大上下文见 models 表（Claude 系可扩展至 1M tokens，同价）",
      ),
      refund_policy: unobtainable(
        undefined,
        "官方抓取内容未给出通用退款条款；2025-07-04 曾就 Pro 改制一次性澄清并退款（见 quota 历史注释与 pricing-history 链）",
      ),
      cancellation_notice: facts.usageReset.fact
        ? verified(
            "订阅自购买日起按月/年自动续费；用量随账单周期按月重置，未用完不结转",
            facts.usageReset.fact,
            usageResetIds,
          )
        : unobtainable(undefined, "官方抓取内容未给出计费周期口径"),
      purchase_url: verified(
        spec.plan_id === "cursor-hobby"
          ? "https://cursor.com/pricing"
          : spec.plan_id === "cursor-enterprise"
            ? "https://cursor.com/contact-sales"
            : isTeams
              ? "https://cursor.com/team/new-team"
              : "https://cursor.com/api/auth/checkoutDeepControl?yearly=false",
        spec.plan_id === "cursor-hobby"
          ? "定价页免费档入口"
          : spec.plan_id === "cursor-enterprise"
            ? "Enterprise 按合同报价（Contact sales）"
            : isTeams
              ? "团队创建入口"
              : "定价页 Get Pro 按钮（Stripe checkout）；计划变更经 cursor.com/dashboard/billing（Stripe portal，需登录）",
        pricingSourceIds,
      ),
      data_policy: {
        training_use: facts.trainingClause.fact
          ? verified(
              { allowed: false },
              facts.trainingClause.fact,
              tosIds,
            )
          : facts.privacyMode.fact
            ? verified(
                { allowed: false },
                facts.privacyMode.fact.privacyMode,
                privacyIds,
              )
            : unobtainable(undefined, "官方抓取内容未给出训练用途声明"),
        processing_location: facts.dataResidency.fact
          ? {
              value: `Enterprise 可选 US-only 数据驻留（Model pricing +10% uplift）；默认处理位置未披露`,
              status: "partial",
              raw: facts.dataResidency.fact.raw,
              note: "个人/团队计划未披露默认处理位置；EU+Iceland inference-only 覆盖可申请（enterprise 文档）",
              source_ids: srcOf(facts.dataResidency, dataPolicySourceIds),
            }
          : unobtainable(undefined, "官方未披露处理位置"),
        data_retention: facts.privacyMode.fact?.zdr
          ? verified(
              `多数模型在 Cursor 的 ZDR（零数据保留）协议下运行${facts.privacyMode.fact.fableException ? `；例外：${facts.privacyMode.fact.fableException}` : ""}`,
              facts.privacyMode.fact.zdr,
              privacyIds,
            )
          : unobtainable(undefined, "官方未披露数据保留口径"),
        zdr_offered: facts.privacyMode.fact?.zdr
          ? verified(true, facts.privacyMode.fact.zdr, privacyIds)
          : unobtainable(undefined, "官方未声明 ZDR 选项"),
      },
    };
  });

  // ---- 模型清单 ----
  const models: PlanCollection["models"] = [];
  const catalog = facts.modelCatalog.fact;
  if (catalog) {
    const catalogIds = srcOf(facts.modelCatalog, quotaSourceIds);
    for (const m of catalog.firstParty) {
      models.push({
        model_code: slugifyModelName(m.name),
        release_date: unobtainable(undefined, "第一方模型发布日期未纳入本次来源集（官方博客逐模型公告）"),
        deprecation_date: unobtainable(),
        availability: [
          {
            plans: "all",
            state: "supported",
            routed_to: null,
            status: "verified",
            raw: `第一方模型（Cursor Models 池）：${m.name}；官方上下文 ${m.context}。Hobby 档可用模型子集较小（官方未公布明细）`,
            source_ids: catalogIds,
          },
        ],
      });
    }
    for (const m of catalog.thirdParty) {
      models.push({
        model_code: slugifyModelName(m.name),
        release_date: unobtainable(undefined, "第三方模型的发布日期以原厂商公告为准，不在 Cursor 采集范围"),
        deprecation_date: unobtainable(),
        availability: [
          {
            plans: THIRD_PARTY_PLAN_IDS,
            state: "supported",
            routed_to: null,
            status: "verified",
            raw: `${m.note}；官方上下文 ${m.context}`,
            source_ids: catalogIds,
          },
        ],
      });
    }
  }

  // ---- 限时促销（模型价，带到期日；采集时点已过期则另发 TIME_DEPENDENT 提示）----
  const promotions: PlanCollection["promotions"] = [];
  if (facts.launchPromo.fact) {
    promotions.push({
      description: `模型价限时促销：${facts.launchPromo.fact.raw}`,
      kind: "price",
      effective_from: null,
      effective_until: facts.launchPromo.fact.effectiveUntil,
      status: "verified",
      raw: facts.launchPromo.fact.raw,
      source_ids: srcOf(facts.launchPromo, quotaSourceIds),
    });
  }

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
        ? { last_updated_note: "页面显示 'Last updated'/'Published' 时间" }
        : {
            last_updated_note:
              "页面未显示更新时间（帮助中心/文档/营销页均无页面级时间戳），以采集时间为准",
          }),
      http_status: snapshot.http_status,
      ...(snapshot.failure_code !== undefined ? { failure_code: snapshot.failure_code } : {}),
    };
  });
  sources.sort((a, b) => {
    const orderA = CURSOR_SOURCES.findIndex((s) => s.source_id === a.source_id);
    const orderB = CURSOR_SOURCES.findIndex((s) => s.source_id === b.source_id);
    return orderA - orderB;
  });

  // ---- 五维地区可用性 ----
  const regional_availability: PlanCollection["regional_availability"] = [
    {
      region_code: "GLOBAL",
      registration: {
        state: "officially_available",
        status: "verified",
        evidence_raw:
          facts.registrationTerms.fact ??
          "注册需账号；Hobby 档 'No credit card required'",
        note: "通用前提：达到属地成年年龄且遵守当地法律；无'支持国家清单'",
        source_ids: srcOf(facts.registrationTerms, regionalSourceIds),
      },
      payment: {
        state: "officially_available",
        status: "verified",
        evidence_raw:
          facts.selfServePayment.fact?.cards ??
          "Self-serve plans support all major credit and debit cards.（经 Stripe checkout）",
        note: "iOS 内购由 Apple 作为 merchant of record（仅月付 Pro/Pro+/Ultra）；Enterprise 可发票/电汇",
        source_ids: srcOf(facts.selfServePayment, pricingSourceIds),
      },
      network_access: {
        state: "unconfirmed",
        status: "unobtainable",
        note: "官方未发布面向网页版产品的地区访问限制声明；无声明不构成'全球可访问'的官方确认（抓取失败也不作为限制证据）",
        source_ids: [],
      },
      service_policy: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw: facts.exportControl.fact ?? "ToS §17.5 出口管制条款",
        note: "通用贸易条款（美国禁运国家/地区），非特定地区排除",
        source_ids: tosIds,
      },
      feature_restrictions: {
        state: "officially_available",
        status: "verified",
        evidence_raw:
          "The available models depend on your plan. Hobby users have access to a smaller set, while paid plans unlock all models.",
        note: "模型级地区限制由模型提供商决定，见各地区条目",
        source_ids: pricingSourceIds,
      },
    },
    {
      region_code: "CN",
      registration: {
        state: "unconfirmed",
        status: "unobtainable",
        note: "官方未声明中国大陆用户可否注册；亦无'支持国家清单'。提供简体中文文档（cursor.com/cn/docs）不构成可用性承诺",
        source_ids: [],
      },
      payment: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw:
          facts.iosChina.fact ??
          "iOS 内购计划 available in every region where Cursor is on the App Store, which is everywhere except mainland China",
        note: "唯一明确的大陆排除是 iOS 内购渠道（支付维度）；大陆银行卡能否经 Stripe 完成自助订阅官方未声明",
        source_ids: iosIds,
      },
      network_access: {
        state: "unconfirmed",
        status: "unobtainable",
        note: "官方未声明中国大陆的网络可达性；页面无法访问或抓取失败不作为官方政策限制的证据",
        source_ids: [],
      },
      service_policy: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw: facts.exportControl.fact ?? "ToS §17.5 出口管制条款",
        note: "通用合规条款，未点名中国大陆（中国大陆不属美国全面禁运地区）；注册前提含'遵守当地法律'",
        source_ids: tosIds,
      },
      feature_restrictions: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw:
          facts.modelRegions.fact?.modelRestriction ??
          "certain models may not be available in your region. When this happens, those models won't appear in Cursor, but all other models continue to work",
        note: "模型级地区限制由 provider 决定；受影响时表现为部分模型不显示而非服务不可用。iOS 内购渠道在大陆整体不可用（见支付维度）",
        source_ids: regionsIds,
      },
    },
  ];

  // ---- Unresolved Facts ----
  const unresolvedFacts: UnresolvedFact[] = [];

  // API_AVAILABLE：Admin API 能力声明（仅声明，不登录、不读取账户数据）
  unresolvedFacts.push({
    fact: `Teams/Enterprise 的实际用量与支出可经 Admin API 程序化获取${facts.adminApi.fact?.endpoints.length ? `（端点：${facts.adminApi.fact.endpoints.join("、")}）` : ""}${facts.adminApi.fact?.auth ? `；认证：${facts.adminApi.fact.auth}` : ""}${facts.adminApi.fact?.rateLimit ? `；限速：${facts.adminApi.fact.rateLimit}` : ""}`,
    reason:
      "API_AVAILABLE 声明：本次仅记录能力，未登录、未调用、未读取任何账户数据；且 API 不输出套餐包含额度的官方数值（第一方池无数值），个人计划无 Admin API 通道",
    failure_code: "API_AVAILABLE",
    how_to_resolve: "由用户提供团队 API Key 后经 Admin API 拉取团队用量；个人计划用量仅能登录 Dashboard（Spending 页）查看",
  });

  // LOGIN_REQUIRED：个人年付实际单价
  unresolvedFacts.push({
    fact: "个人计划（Pro/Pro+/Ultra）年付的具体月单价",
    reason: facts.yearlyDiscount.fact
      ? `定价页为客户端渲染且仅声明 "${facts.yearlyDiscount.fact}"；具体月单价在登录 Stripe checkout 后才显示（官方展示文本不含换算值）`
      : "定价页为客户端渲染；具体月单价需登录 Stripe checkout 确认",
    failure_code: "LOGIN_REQUIRED",
    how_to_resolve: "登录 cursor.com/dashboard/billing（Stripe portal）读取年付实际月单价",
  });

  // LOGIN_REQUIRED：个人用量页
  unresolvedFacts.push({
    fact: "个人计划的实际用量与剩余额度",
    reason: "个人计划无 Admin API；用量仅登录后 Dashboard（Spending 页）可见",
    failure_code: "LOGIN_REQUIRED",
    how_to_resolve: "登录 cursor.com/dashboard 查看 Spending 页",
  });

  // TIME_DEPENDENT：已到期仍展示的模型价促销
  if (facts.launchPromo.fact) {
    unresolvedFacts.push({
      fact: `模型价促销 "${facts.launchPromo.fact.raw}" 的到期日（${facts.launchPromo.fact.effectiveUntil}）早于本采集时点`,
      reason: "文档页在到期日后仍展示促销价属时效性残留；当前有效模型价需以页面更新为准",
      failure_code: "TIME_DEPENDENT",
      how_to_resolve: "复查 docs/models-and-pricing 页面促销段落是否已移除",
    });
  }

  // 数值缺口（官方故意不公开或未公布，非采集失败）
  unresolvedFacts.push(
    {
      fact: "第一方池（Cursor Models）的数值口径",
      reason: facts.firstPartyPool.fact
        ? `官方仅表述 "${facts.firstPartyPool.fact}"，属官方故意不公开而非采集失败；Admin API 亦不输出包含额度定义`
        : "官方未公布第一方池数值",
      how_to_resolve: "关注官方博客与 /terms/pricing 版本化 URL 的口径变化",
    },
    {
      fact: "Hobby 档 'Limited Agent requests / Limited Tab completions' 的具体数值",
      reason: facts.hobbyLimits.fact
        ? `官方仅给出定性表述（${[facts.hobbyLimits.fact.agent, facts.hobbyLimits.fact.tab].filter(Boolean).join("、")}），无数值`
        : "官方仅给出定性表述，无数值",
    },
    {
      fact: "数值化并发/速率限制（RPM、并发会话数）",
      reason: "官方页面无数值字段；限额表现为用量池消耗 + on-demand",
    },
    {
      fact: "Cursor Router（Auto 拆分为 Cost/Balance/Intelligence）的 GA 日期与发布公告",
      reason: "官方公告 URL 未定位成功（blog/cursor-router 404）；现行规则以帮助中心为准",
    },
    {
      fact: "当前注册流程是否附带 Pro 限时试用",
      reason: "本次抓取的全部官方页面均未提及 trial",
    },
  );

  // Auto 模式成本歧义（同名 Auto 三模式成本差 2–4 倍）
  if (facts.autoModes.fact?.comparison) {
    unresolvedFacts.push({
      fact: `Auto 模式成本口径：${facts.autoModes.fact.comparison}`,
      reason: "同名 'Auto' 在 Cost/Balance/Intelligence 三模式间成本差可达 2–4 倍，且路由模型身份对外隐藏",
      how_to_resolve: "跨 Vendor 归一化时按 '通道+模型+模式' 组合计算，不使用单一 Auto 均价",
    });
  }

  return {
    schema_version: "1",
    collection: {
      provider_id: "anysphere-cursor",
      mode,
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    vendor: { vendor_id: "anysphere", display_name: "Anysphere (Cursor)" },
    regional_variant: null,
    payment: {
      methods: [
        "Credit and debit cards（经 Stripe checkout，自助计划）",
        "Apple In-App Purchase（iOS，月付 Pro/Pro+/Ultra）",
        "Invoice / wire transfer（Enterprise，联系销售）",
      ],
      notes: [
        facts.iosChina.fact
          ? `iOS 内购渠道：${facts.iosChina.fact}`
          : "iOS 内购渠道：在 App Store 上架地区可用，中国大陆除外",
        facts.selfServePayment.fact?.resellers ??
          "Cursor subscriptions are only sold directly through cursor.com（官方禁经分销商）",
        facts.paymentTerms.fact?.stripe ?? "支付经 Stripe 处理（ToS §4.3）",
        "计划变更/取消经 cursor.com/dashboard/billing（Stripe portal，需登录）",
      ],
    },
    quota_system: {
      quota_model: "usd_equivalence",
      unit: verified(
        "USD 等值（按模型 API 费率扣减，双池制）",
        // raw 存官方原文：帮助中心表 Other Models 列 / 文档站美元等值句
        facts.otherModelsPool.fact?.raw ?? facts.onDemand.fact?.noMarkup ?? undefined,
        quotaSourceIds,
      ),
      formula: notApplicable("usd_equivalence 无积分换算公式；额度即美元等值，直接按模型 API 价从池中扣减"),
      model_multipliers: [],
      mcp_multipliers: [],
      off_peak_discount: notApplicable("usd_equivalence 体系无高峰/非高峰差价（Auto Cost 为固定 per-M token 价）"),
      peak_hours: notApplicable("无高峰时段定义"),
    },
    models,
    plans,
    regional_availability,
    promotions,
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

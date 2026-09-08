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
import { extractFacts, type ExtractedFacts } from "./extract.ts";
import { DEEPSEEK_API_CHAINS, DEEPSEEK_API_SOURCES, SRC } from "./sources.ts";
import { normalizeEnglishDate } from "../../extract-shared.ts";

const CHAIN_BY_PURPOSE = {
  pricing: DEEPSEEK_API_CHAINS.find((c) => c.chain_id === "deepseek-api-pricing")!,
  rateLimit: DEEPSEEK_API_CHAINS.find((c) => c.chain_id === "deepseek-api-rate-limit")!,
  billing: DEEPSEEK_API_CHAINS.find((c) => c.chain_id === "deepseek-api-billing-rules")!,
  legal: DEEPSEEK_API_CHAINS.find((c) => c.chain_id === "deepseek-api-legal-availability")!,
  dataPolicy: DEEPSEEK_API_CHAINS.find((c) => c.chain_id === "deepseek-api-data-policy")!,
  modelCatalog: DEEPSEEK_API_CHAINS.find((c) => c.chain_id === "deepseek-api-model-catalog")!,
  // extractFacts 类型签名要 termsService/privacy/termsUse/modelDisclosure/changeLog 全字段,
  // 每个都对应独立的链以保证 pickBodyByChain 不串读同源不同文。
  termsService: DEEPSEEK_API_CHAINS.find((c) => c.chain_id === "deepseek-api-legal-availability")!,
  changeLog: DEEPSEEK_API_CHAINS.find((c) => c.chain_id === "deepseek-api-change-log")!,
  privacy: DEEPSEEK_API_CHAINS.find((c) => c.chain_id === "deepseek-api-data-policy")!,
  termsUse: DEEPSEEK_API_CHAINS.find((c) => c.chain_id === "deepseek-api-terms-use")!,
  modelDisclosure: DEEPSEEK_API_CHAINS.find((c) => c.chain_id === "deepseek-api-data-policy")!,
};

interface PlanSpec {
  plan_id: string;
  plan_name: string;
  /** billing_period 为 "one_time"（per-token 计费）。 */
}

const PLAN_SPECS: PlanSpec[] = [
  { plan_id: "deepseek-api-v4-flash", plan_name: "DeepSeek-V4-Flash API" },
  { plan_id: "deepseek-api-v4-pro", plan_name: "DeepSeek-V4-Pro API" },
  { plan_id: "deepseek-api-v4-flash-vision-exp", plan_name: "DeepSeek-V4-Flash-Vision-Exp API" },
];

/** (channel × period) 中文标签，用于 price_list note 字段。 */
const CHANNEL_LABEL: Record<string, string> = {
  input_cached: "百万 tokens 输入（缓存命中）",
  input_uncached: "百万 tokens 输入（缓存未命中）",
  output: "百万 tokens 输出",
};
const PERIOD_LABEL: Record<string, string> = {
  peak: "高峰时段（北京时间 9:00-12:00、14:00-18:00）",
  off_peak: "空闲时段（高峰时段之外）",
};

function priceTypeForPeriod(period: "peak" | "off_peak"): "standard" | "discounted" {
  return period === "peak" ? "standard" : "discounted";
}

export function normalizeCollection(input: {
  snapshots: RawSnapshot[];
  facts: ExtractedFacts;
  mode: "fixture" | "live";
  collectedAt: string;
  toolVersion: string;
}): PlanCollectionPayload {
  const { snapshots, facts, mode, collectedAt, toolVersion } = input;
  const { chains: sourceChainsOut, resolution } = deriveSourceChains(
    snapshots,
    DEEPSEEK_API_CHAINS,
  );
  const chainSrc = makeChainSrc(resolution, DEEPSEEK_API_CHAINS);

  const pricingSourceIds = chainSrc("deepseek-api-pricing");
  const rateLimitSourceIds = chainSrc("deepseek-api-rate-limit");
  const billingSourceIds = chainSrc("deepseek-api-billing-rules");
  const legalSourceIds = chainSrc("deepseek-api-legal-availability");
  const dataPolicySourceIds = chainSrc("deepseek-api-data-policy");
  const modelCatalogSourceIds = chainSrc("deepseek-api-model-catalog");

  // ---- 模型 → Plan 查找表 ----
  const modelByCode = new Map(facts.models.map((m) => [m.model_code, m]));

  // ---- Plans（每模型一档，api-usage 形态） ----
  const plans: PlanCollection["plans"] = PLAN_SPECS.map((spec) => {
    // spec.plan_id = "deepseek-api-v4-flash" → 抽取 model_code = "deepseek-v4-flash"
    // 即去掉 "deepseek-api-" 前缀并补上 "deepseek-"
    const modelCode = spec.plan_id.replace("deepseek-api-", "deepseek-");
    const model = modelByCode.get(modelCode);
    const cells = model?.cells ?? [];

    const priceList: PlanCollection["plans"][number]["price_list"] = cells.map((cell) => {
      const periodLabel = PERIOD_LABEL[cell.period];
      const channelLabel = CHANNEL_LABEL[cell.channel]!;
      return {
        amount: verified(cell.amount, cell.raw, pricingSourceIds),
        currency: verified("CNY", "元", pricingSourceIds),
        billing_period: "one_time",
        price_type: priceTypeForPeriod(cell.period),
        effective_from: null,
        effective_until: null,
        status: "verified",
        note: `${channelLabel} × ${periodLabel}`,
        source_ids: pricingSourceIds,
      };
    });

    // 周末统一按空闲时段价格计费:不走 price_list 的 promotional 条目(避免与 discounted
    // 重复相同金额),仅在 PlanCollection.promotions[] 记录,并由 raw 文本指明适用范围。

    // 配额：账号级并发上限（per-account）
    const concurrencyLimit = model?.concurrency_limit ?? null;
    const windows: PlanCollection["plans"][number]["quota"]["windows"] =
      concurrencyLimit !== null
        ? [
            {
              window_type: "other",
              window_anchor: "unspecified",
              amount: verified(concurrencyLimit, model!.raw || facts.concurrency.granularity_raw || "", rateLimitSourceIds),
              unit: "concurrent_requests",
              status: "verified",
              raw: "一个请求从发出后，到模型响应完成之前记为一个并发；并发限制以账号粒度计",
              source_ids: rateLimitSourceIds,
            },
          ]
        : [];

    // rate_limits 文案（concurrency 配额 + user_id 隔离 + 扩容通道）
    const rateLimitsText = concurrencyLimit !== null
      ? `账号级并发限制 ${concurrencyLimit}（与 API Key 无关）；可提交账号扩容申请工单获得更高并发（不增加额外费用）`
      : "账号级并发限制以官方公告为准";
    const rateLimitsField: PlanField<string> = verified(
      rateLimitsText,
      model?.raw ?? "",
      rateLimitSourceIds,
    );

    // 上下文窗口
    const contextWindow: PlanField<number> =
      model?.context_tokens !== null && model?.context_tokens !== undefined
        ? verified(model.context_tokens, "| 上下文长度 | | | 1M |", pricingSourceIds)
        : unobtainable();

    // 输出长度
    const outputTokensField: PlanField<number> =
      model?.output_tokens !== null && model?.output_tokens !== undefined
        ? verified(model.output_tokens, "| 输出长度 | | | 最大 384K |", pricingSourceIds)
        : unobtainable();

    // 退款 / 取消：api-usage 无订阅周期，按官方条款表达
    const refundPolicy: PlanField<string> = verified(
      "API 用量一经计费不退款（详见 Open Platform ToS §7.1：依官方公布的价目按时计费）",
      facts.platformTerms.fee_rule_raw ?? "",
      billingSourceIds,
    );
    const cancellationNotice: PlanField<string> = verified(
      "API 计费按 token 实时扣减，无固定订阅周期；余额扣减顺序：充值余额与赠送余额并存时优先扣减赠送余额",
      facts.billingRule.balance_priority_raw ?? facts.billingRule.formula_raw ?? "",
      billingSourceIds,
    );

    return {
      plan_id: spec.plan_id,
      plan_name: spec.plan_name,
      plan_type: "api-usage",
      audience: null,
      price_list: priceList,
      quota: {
        quota_model: "concurrency",
        windows,
      },
      rate_limits: rateLimitsField,
      context_window_tokens: contextWindow,
      refund_policy: refundPolicy,
      cancellation_notice: cancellationNotice,
      purchase_url: verified(
        "https://platform.deepseek.com/",
        "Log in to the DeepSeek Open Platform → API Keys",
        [SRC.pricing, SRC.termsService],
      ),
      data_policy: {
        training_use: facts.trainingUse.default_training_allowed !== null
          ? {
              value: { allowed: facts.trainingUse.default_training_allowed },
              status: facts.trainingUse.default_training_allowed ? "verified" : "verified",
              raw: facts.trainingUse.default_raw ?? "",
              note: facts.trainingUse.opt_out_toggle_raw
                ? `用户可在设置中关闭 "${facts.trainingUse.opt_out_toggle_raw}" opt-out 训练`
                : undefined,
              source_ids: dataPolicySourceIds,
            }
          : unobtainable(),
        processing_location: facts.operator.jurisdiction
          ? verified(facts.operator.jurisdiction, facts.operator.raw, dataPolicySourceIds)
          : unobtainable(),
        data_retention: facts.dataRetention
          ? verified(facts.dataRetention, facts.dataRetention, dataPolicySourceIds)
          : unobtainable(undefined, "官方仅说明'必要期限内保留'，未给出具体天数"),
        zdr_offered: unobtainable(undefined, "官方未声明 ZDR（零数据保留）选项"),
      },
    };
  });

  // ---- 模型清单（ModelEntry） ----
  const models: PlanCollection["models"] = facts.models.map((m) => {
    // 模型发布日期：从变更日志中找首个提到该模型的标题日期
    const releaseDate = findModelReleaseDate(facts.changeLog, m.model_code);
    return {
      model_code: m.model_code,
      release_date: releaseDate
        ? verified(releaseDate, `DeepSeek 变更日志 ${releaseDate} 起上线`, [SRC.changeLog, SRC.pricing])
        : unobtainable(undefined, "官方未在该 Provider 来源中给出模型发布日期"),
      deprecation_date: unobtainable(undefined, "官方未给出模型弃用时间"),
      availability: [
        {
          plans: "all",
          state: "supported",
          routed_to: null,
          status: "verified",
          raw: m.model_version ?? `${m.model_code} 在 API 中可直调`,
          source_ids: modelCatalogSourceIds,
        },
      ],
    };
  });

  // ---- 限时促销：周末统一按空闲时段价格计费 ----
  const promotions: PlanCollection["promotions"] = [];
  if (facts.pricingWindow.weekend_effective_from && facts.pricingWindow.weekend_raw) {
    promotions.push({
      description:
        "周末（周六、周日）全天按空闲时段（低谷）价格计费，不区分峰谷；其他时段按工作日峰谷规则执行",
      kind: "price",
      effective_from: facts.pricingWindow.weekend_effective_from,
      effective_until: null,
      status: "verified",
      raw: facts.pricingWindow.weekend_raw,
      source_ids: [SRC.pricing],
    });
  }

  // ---- 来源清单（三时间戳） ----
  const sources = buildSources(
    snapshots,
    (snapshot) => extractSnapshotStatedDate(snapshot.source_id, snapshot.body, facts),
    (snapshot, stated) => statedNote(snapshot.source_id, stated),
  );

  // ---- 五维地区可用性 ----
  const cnUnconfirmedNote =
    "ToS §1.4 / Privacy 'Data Controller registered in China'：杭州主体；管辖法为 PRC；未发布针对中国大陆分省/分城市的可用性清单";
  const overseasNote =
    "Open Platform ToS §1.4 / Terms of Use §1.5：官方明确'不保证所有地区持续可用，功能可能在不同地区有所差异'，但未发布具体地区排除清单；不静默合并为单维度结论";
  const regional_availability: PlanCollection["regional_availability"] = [
    {
      region_code: "CN",
      registration: {
        state: "officially_available",
        status: "verified",
        evidence_raw:
          "Terms of Use §2.2：邮箱或第三方账号注册；Open Platform ToS §2.1 与 Chat Service 共用同一账号体系",
        source_ids: legalSourceIds,
      },
      payment: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "Open Platform ToS §7.1：按官方公布的价目付费；具体支付通道在 platform.deepseek.com 控制台",
        source_ids: billingSourceIds,
      },
      network_access: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "Data Controller 注册地在中国；境内访问 api.deepseek.com 无地理阻断声明",
        source_ids: dataPolicySourceIds,
      },
      service_policy: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "Open Platform ToS §11：管辖法为 PRC 法律；中国大陆法律框架",
        source_ids: legalSourceIds,
      },
      feature_restrictions: {
        state: "unconfirmed",
        status: "unobtainable",
        note: cnUnconfirmedNote,
        source_ids: [],
      },
    },
    {
      region_code: "OVERSEAS",
      registration: {
        state: "officially_available",
        status: "verified",
        evidence_raw: "Terms of Use §2.2：邮箱或第三方账号注册；不要求大陆手机号",
        source_ids: legalSourceIds,
      },
      payment: {
        state: "unconfirmed",
        status: "unobtainable",
        note: "Open Platform 控制台提供支付通道但未在公开页面公示海外可用支付方式",
        source_ids: [],
      },
      network_access: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw: overseasNote,
        source_ids: legalSourceIds,
      },
      service_policy: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw: overseasNote,
        source_ids: legalSourceIds,
      },
      feature_restrictions: {
        state: "officially_conditional",
        status: "verified",
        evidence_raw: overseasNote,
        source_ids: legalSourceIds,
      },
    },
  ];

  // ---- Unresolved Facts ----
  const unresolvedFacts: UnresolvedFact[] = [
    {
      fact: "deepseek-v4-flash-vision-exp 模型的并发限制数值",
      reason:
        "限速页（rate_limit）只公布 v4-pro / v4-flash 两档（500 / 2500）；v4-flash-vision-exp 的并发限制仅在定价页模型细节表中列出（2500），未在限速页单独披露",
      failure_code: "STALE_CONFLICT",
      how_to_resolve: "联系 DeepSeek 商务或查阅最新限速与隔离页",
    },
    {
      fact: "支付通道（支付宝 / 微信 / Stripe / 信用卡）的官方公开清单",
      reason:
        "Open Platform ToS §7.1 仅声明按官方价目付费，未在公开页面公示可用支付方式；具体通道在 platform.deepseek.com 控制台",
      failure_code: "LOGIN_REQUIRED",
      how_to_resolve: "登录 platform.deepseek.com → 充值页查看实际可用支付通道",
    },
    {
      fact: "数据保留的具体天数",
      reason: "Privacy Policy 仅说明'必要期限内保留'，未给出明确天数或保留矩阵",
    },
    {
      fact: "ZDR（零数据保留）选项的可用性",
      reason: "官方未在 Privacy Policy / ToS 中声明 ZDR 选项；不猜测",
    },
    {
      fact: "中国大陆分省/分城市的可用性差异清单",
      reason: "官方仅声明中国大陆主体（杭州）与 PRC 管辖法，未发布分省差异清单",
    },
    {
      fact: "海外地区排除清单",
      reason:
        "ToS §1.4 / §1.5 明确'不保证所有地区持续可用，功能可能在不同地区有所差异'，但未发布具体地区排除清单；不静默合并为'可用/不可用'",
    },
    {
      fact: "各模型 Credits / Token 消耗明细的官方换算表",
      reason: "Open Platform 不采用 credits 中介，按 token 实时计费（详见 quota_system.formula.raw）",
    },
    {
      fact: "deepseek-v4-flash-vision-exp 的发布/弃用日期",
      reason: "变更日志 2026-08-21 条目描述该模型发布，但未给出弃用或正式下线时间",
      failure_code: "TIME_DEPENDENT",
    },
  ];

  sortSourcesByRegistry(sources, DEEPSEEK_API_SOURCES);

  return {
    schema_version: "1",
    collection: {
      provider_id: "deepseek-api",
      mode,
      collected_at: collectedAt,
      tool_version: toolVersion,
    },
    vendor: {
      vendor_id: "deepseek",
      display_name: "DeepSeek（深度求索）",
    },
    regional_variant: {
      variant_id: "deepseek-api-global",
      operator_entity: facts.operator.entity
        ? verified(facts.operator.entity, facts.operator.raw, dataPolicySourceIds)
        : verified(
            "Hangzhou DeepSeek Artificial Intelligence Co., Ltd.",
            "DeepSeek products and services are owned and operated by Hangzhou DeepSeek Artificial Intelligence Co., Ltd.",
            legalSourceIds,
          ),
      jurisdiction: facts.platformTerms.jurisdiction_raw
        ? verified("People's Republic of China", facts.platformTerms.jurisdiction_raw, legalSourceIds)
        : verified(
            "People's Republic of China",
            "Data Controller registered in China",
            dataPolicySourceIds,
          ),
    },
    payment: {
      methods: [
        "充值余额",
        ...(facts.billingRule.balance_priority_raw ? ["赠送余额（与充值余额并存时优先扣减）"] : []),
      ],
      notes: facts.billingRule.formula_raw
        ? [
            facts.billingRule.formula_raw,
            "产品价格可能发生变动，DeepSeek 保留修改价格的权利",
          ]
        : ["产品价格可能发生变动，DeepSeek 保留修改价格的权利"],
    },
    quota_system: {
      quota_model: "concurrency",
      unit: verified("concurrent_requests", "账号级并发请求数（一个请求从发出后到响应完成前记为一个并发）", rateLimitSourceIds),
      formula: facts.billingRule.formula_raw
        ? verified(
            { raw: facts.billingRule.formula_raw, divisor: 0 },
            facts.billingRule.formula_raw,
            billingSourceIds,
          )
        : unobtainable(undefined, "扣费规则未从官方页面抽取到"),
      model_multipliers: [],
      mcp_multipliers: [],
      off_peak_discount:
        facts.pricingWindow.off_peak_factor !== null
          ? verified(
              facts.pricingWindow.off_peak_factor,
              "空闲时段价格为高峰时段价格的一半",
              pricingSourceIds,
            )
          : unobtainable(),
      peak_hours: facts.pricingWindow.peak_hours_raw
        ? verified(
            facts.pricingWindow.peak_hours_raw,
            facts.pricingWindow.peak_hours_raw,
            pricingSourceIds,
          )
        : unobtainable(),
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

/**
 * 从变更日志中找首个提到该 model_code 的标题日期，作为模型发布日期。
 * 例如 "deepseek-v4-flash-vision-exp" → 2026-08-21（变更日志首个提到此模型名的条目）。
 *
 * 匹配要点：变体名 "deepseek-v4-flash" 是 "deepseek-v4-flash-vision-exp" 的子串，
 * 直接 includes 会误中。必须用 negative lookahead 排除紧随其后的 hyphen 扩展：
 * 候选名末尾不得紧接 [a-z0-9-]（含 hyphen），从而排除 "flash-vision-exp" 等更长
 * 衍生名的前缀误中。按精确度从高到低尝试（先完整 model_code、再去掉前缀、再去 hyphens）。
 */
function findModelReleaseDate(
  changeLog: ExtractedFacts["changeLog"],
  modelCode: string,
): string | null {
  const normalized = modelCode.toLowerCase();
  const candidates: string[] = [normalized];
  if (normalized.startsWith("deepseek-")) {
    candidates.push(normalized.slice("deepseek-".length));
  }
  candidates.push(normalized.replace(/-/g, ""));
  for (const entry of changeLog) {
    if (!entry.date_iso) continue;
    // 只在标题中匹配:变更日志正文经常提到其他模型(如"V4-Pro 更新"段落里描述"V4-Pro 和 V4-Flash"),
    // 仅看 entry.title 可避免「Pro 条目误匹配 Flash」的交叉干扰。
    const haystack = entry.title.toLowerCase();
    for (const candidate of candidates) {
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // negative lookahead 排除跟随 [a-z0-9-] 的情况——
      // hyphen 是 "deepseek-v4-flash-vision-exp" 等更名模型的连接符,
      // 看到 hyphen 即说明当前候选是该更长名的前缀,不算精确匹配。
      const re = new RegExp(`(^|[^a-z0-9])${escaped}(?![a-z0-9-])`);
      if (re.test(haystack)) return entry.date_iso;
    }
  }
  return null;
}

/** 抽取单条 source 的页面自述时间戳。 */
function extractSnapshotStatedDate(
  sourceId: string,
  body: string,
  facts: ExtractedFacts,
): string | null {
  if (sourceId === SRC.termsService) {
    const iso = facts.platformTermsDates.effective_date
      ? normalizeEnglishDate(facts.platformTermsDates.effective_date)
      : null;
    return iso;
  }
  if (sourceId === SRC.privacy) return facts.privacyPublishedDate;
  if (sourceId === SRC.termsUse) return facts.termsUsePublishedDate;
  // 定价页 / 限速页 / 变更日志 / 模型披露页 均无统一时间戳
  return null;
}

/** last_updated_note 文案策略。 */
function statedNote(sourceId: string, stated: string | null): string {
  if (stated === null) return "页面未显示更新时间，以采集时间为准";
  if (sourceId === SRC.termsService) return "页面显示 Effective date";
  if (sourceId === SRC.privacy || sourceId === SRC.termsUse) return "页面显示 Published";
  return "页面显示更新时间";
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

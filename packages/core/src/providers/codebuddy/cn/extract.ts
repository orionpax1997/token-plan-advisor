import type { RawSnapshot } from "../load.ts";

/**
 * CodeBuddy 中国站确定性抽取：从 .md 原文抽取价格、积分、模型、地区等事实。
 * 每个抽取结果保留命中的官方原文（raw），保证可追溯；
 * 抽取不到返回 null，由归一化层降级为 Unresolved Fact 而非猜测。
 */

function bodyOf(snapshots: RawSnapshot[], sourceId: string): string {
  return snapshots.find((s) => s.source_id === sourceId)?.body ?? "";
}

/** 按链顺序尝试读取首个非空 body；该链所有候选均无内容时返回空串。 */
export function pickBodyByChain(
  snapshots: RawSnapshot[],
  chain: { source_ids: string[] },
): string {
  for (const id of chain.source_ids) {
    const body = bodyOf(snapshots, id);
    if (body.length > 0) return body;
  }
  return "";
}

export interface ExtractedTier {
  plan_id: string;
  plan_name: string;
  tier_label: string;
  audience: "individual" | "team";
  pricing: {
    monthly: number | null;
    monthly_discount: number | null; // 连续包月
    annual: number | null;
    annual_discount: number | null; // 连续包年
    currency: string;
    raw: string;
  };
  quota: {
    base_credits: number | null;
    bonus_credits: number | null;
    total_credits: number | null;
    raw: string;
  };
}

const INDIVIDUAL_LABELS = ["体验版", "标准版", "高级版", "旗舰版"] as const;
const ENTERPRISE_LABELS = ["SaaS 企业版", "专有云企业版", "私有化企业版"] as const;

/**
 * 抽取个人版定价表（月付/连续包月/年付/连续包年）。
 * 表格行示例：| 标准版 | 99 元/月 | 70 元/月 | 840 元/年 | 672 元/年 |
 */
export function extractIndividualPricing(pricingBody: string): {
  monthly: Record<string, number>;
  monthlyDiscount: Record<string, number>;
  annual: Record<string, number>;
  annualDiscount: Record<string, number>;
  raw: string;
} {
  const monthly: Record<string, number> = {};
  const monthlyDiscount: Record<string, number> = {};
  const annual: Record<string, number> = {};
  const annualDiscount: Record<string, number> = {};
  let raw = "";
  for (const label of INDIVIDUAL_LABELS) {
    if (label === "体验版") {
      monthly[label] = 0;
      monthlyDiscount[label] = 0;
      annual[label] = 0;
      annualDiscount[label] = 0;
      continue;
    }
    const re = new RegExp(
      `^\\|\\s*${label}\\s*\\|\\s*([\\d,]+)\\s*元/月\\s*\\|\\s*([\\d,]+)\\s*元/月\\s*\\|\\s*([\\d,]+)\\s*元/年\\s*\\|\\s*([\\d,]+)\\s*元/年\\s*\\|`,
      "m",
    );
    const m = pricingBody.match(re);
    if (!m) continue;
    const monthlyNum = Number(m[1]!.replace(/,/g, ""));
    const monthlyDiscNum = Number(m[2]!.replace(/,/g, ""));
    const annualNum = Number(m[3]!.replace(/,/g, ""));
    const annualDiscNum = Number(m[4]!.replace(/,/g, ""));
    if ([monthlyNum, monthlyDiscNum, annualNum, annualDiscNum].some((n) => !Number.isFinite(n))) continue;
    monthly[label] = monthlyNum;
    monthlyDiscount[label] = monthlyDiscNum;
    annual[label] = annualNum;
    annualDiscount[label] = annualDiscNum;
    raw = m[0].trim();
  }
  return { monthly, monthlyDiscount, annual, annualDiscount, raw };
}

/**
 * 抽取积分表（基础/加赠/实得）。
 * 表格行示例：| 标准版 | 2,000 | 2,000 | 4,000 |
 */
export function extractIndividualCredits(pricingBody: string): {
  base: Record<string, number>;
  bonus: Record<string, number>;
  total: Record<string, number>;
  raw: string;
} {
  const base: Record<string, number> = {};
  const bonus: Record<string, number> = {};
  const total: Record<string, number> = {};
  let raw = "";
  for (const label of INDIVIDUAL_LABELS) {
    if (label === "体验版") {
      base[label] = 500;
      bonus[label] = 0;
      total[label] = 500;
      continue;
    }
    const re = new RegExp(
      `^\\|\\s*${label}\\s*\\|\\s*([\\d,]+)\\s*\\|\\s*([\\d,]+)\\s*\\|\\s*([\\d,]+)\\s*\\|`,
      "m",
    );
    const m = pricingBody.match(re);
    if (!m) continue;
    const baseNum = Number(m[1]!.replace(/,/g, ""));
    const bonusNum = Number(m[2]!.replace(/,/g, ""));
    const totalNum = Number(m[3]!.replace(/,/g, ""));
    if ([baseNum, bonusNum, totalNum].some((n) => !Number.isFinite(n))) continue;
    base[label] = baseNum;
    bonus[label] = bonusNum;
    total[label] = totalNum;
    raw = m[0].trim();
  }
  return { base, bonus, total, raw };
}

/**
 * 抽取企业版定价（SaaS / 专有云 / 私有化）。
 * 表格行示例：| SaaS 企业版 | 198 元/人/月（2,376 元/人/年） | 1 坐席 |
 */
export function extractEnterprisePricing(pricingBody: string): {
  monthly: Record<string, number>;
  annual: Record<string, number>;
  minSeats: Record<string, number>;
  raw: string;
} {
  const monthly: Record<string, number> = {};
  const annual: Record<string, number> = {};
  const minSeats: Record<string, number> = {};
  let raw = "";
  for (const label of ENTERPRISE_LABELS) {
    if (label === "私有化企业版") {
      monthly[label] = Number.NaN; // 详情请咨询
      annual[label] = Number.NaN;
      minSeats[label] = 0;
      continue;
    }
    const re = new RegExp(
      `^\\|\\s*${label}\\s*\\|\\s*([\\d,]+)\\s*元/人/月（([\\d,]+)\\s*元/人/年）\\s*\\|\\s*([\\d,]+)\\s*坐席`,
      "m",
    );
    const m = pricingBody.match(re);
    if (!m) continue;
    const monthlyNum = Number(m[1]!.replace(/,/g, ""));
    const annualNum = Number(m[2]!.replace(/,/g, ""));
    const seatsNum = Number(m[3]!.replace(/,/g, ""));
    if ([monthlyNum, annualNum, seatsNum].some((n) => !Number.isFinite(n))) continue;
    monthly[label] = monthlyNum;
    annual[label] = annualNum;
    minSeats[label] = seatsNum;
    raw = m[0].trim();
  }
  return { monthly, annual, minSeats, raw };
}

/** 抽取"双倍 Credits"活动区间。 */
export function extractDoubleCreditsCampaign(
  pricingBody: string,
): { effective_from: string; effective_until: string; raw: string } | null {
  // 正文用"翻倍"、章节标题用"双倍 Credits"；均匹配
  const m = pricingBody.match(/(\d{4}-\d{2}-\d{2})\s*至\s*(\d{4}-\d{2}-\d{2})\s*[期，][\s\S]*?(?:翻倍|双倍)/);
  if (!m) return null;
  return { effective_from: m[1]!, effective_until: m[2]!, raw: m[0].trim() };
}

/** 抽取老用户保价条款（个人专业版 58 元档续费）。 */
export function extractLegacyRetention(versionDocBody: string): {
  monthly: number;
  effective_until: string;
  raw: string;
} | null {
  const m = versionDocBody.match(/个人专业版\s*(\d+)\s*元.*?(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日.*?自动续费/);
  if (!m) return null;
  const monthly = Number(m[1]);
  const until = `${m[2]}-${m[3]!.padStart(2, "0")}-${m[4]!.padStart(2, "0")}`;
  return { monthly, effective_until: until, raw: m[0].trim() };
}

/** 抽取计费概述页面中的旧价口径（个人专业版 58 元/月、696 元/年）。 */
export function extractLegacyPricingInBilling(billingBody: string): {
  monthly: number;
  annual: number;
  raw: string;
} | null {
  const m = billingBody.match(/个人专业版\s*\|\s*(\d+)\s*元\/人\/月\s*\|\s*(\d+)\s*元\/人\/年\s*\|\s*([\d,]+)\s*Credits\/月/);
  if (!m) return null;
  const monthly = Number(m[1]);
  const annual = Number(m[2]);
  if (!Number.isFinite(monthly) || !Number.isFinite(annual)) return null;
  return { monthly, annual, raw: m[0].trim() };
}

/** 抽取模型清单（按行：模型名 + 上下文长度或特征）。 */
export function extractModelList(versionDocBody: string): {
  models: { code: string; context_1m: boolean; note: string }[];
  raw: string;
} {
  const models: { code: string; context_1m: boolean; note: string }[] = [];
  let raw = "";
  const re = /^([A-Za-z0-9.\-]+(?:-\w+)?)[\s\u4e00-\u9fa5]*([^|\n]*)$/gm;
  for (const m of versionDocBody.matchAll(re)) {
    const code = m[1]!;
    if (!/^[A-Z][A-Za-z0-9.\-]+$/.test(code)) continue;
    if (code === "ID") continue; // 误匹配
    const note = (m[2] ?? "").trim();
    const context1m = note.includes("1M") || note.includes("1M 上下文");
    if (!code.match(/^(GLM|Hy3|MiniMax|Kimi|Deepseek|Hunyuan)/)) continue;
    models.push({ code, context_1m: context1m, note });
    raw = `${raw}\n${m[0].trim()}`;
  }
  // 去重
  const seen = new Set<string>();
  const deduped = models.filter((m) => {
    if (seen.has(m.code)) return false;
    seen.add(m.code);
    return true;
  });
  return { models: deduped, raw: raw.trim() };
}

/** 抽取支付方式（个人套餐与企业套餐通用）。 */
export function extractPaymentMethods(pricingBody: string): string[] {
  const methods = new Set<string>();
  const re = /支付方式[\s\S]*?(?=\n##|\n#|$)/;
  const section = pricingBody.match(re)?.[0] ?? "";
  for (const m of section.matchAll(/[-*]\s*([^\n]+)/g)) {
    methods.add(m[1]!.trim());
  }
  return [...methods];
}

/** 抽取"积分消耗"官方黑盒声明（用于 quota_system.formula.raw）。 */
export function extractCreditFormula(creditsBody: string): string | null {
  return creditsBody.match(/Credits 消耗量[^.\n]*?\。/)?.[0]?.trim() ?? null;
}

/** 抽取页面自述的更新时间戳（"最近更新时间：YYYY-MM-DD HH:MM:SS"）。 */
export function extractStatedDate(body: string): string | null {
  const m = body.match(/最近更新时间[：:]\s*(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export interface ExtractedFacts {
  individualPricing: ReturnType<typeof extractIndividualPricing>;
  individualCredits: ReturnType<typeof extractIndividualCredits>;
  enterprisePricing: ReturnType<typeof extractEnterprisePricing>;
  doubleCreditsCampaign: ReturnType<typeof extractDoubleCreditsCampaign>;
  legacyRetention: ReturnType<typeof extractLegacyRetention>;
  legacyPricingInBilling: ReturnType<typeof extractLegacyPricingInBilling>;
  modelList: ReturnType<typeof extractModelList>;
  paymentMethods: string[];
  creditFormula: string | null;
  /** 抽出时实际使用的各链首位非空 body 对应的 source_id（用于字段层 source_ids 透传）。 */
  sources: {
    pricing: string | null;
    version: string | null;
    billing: string | null;
    credits: string | null;
    faq: string | null;
  };
}

export function extractFacts(snapshots: RawSnapshot[], chains: {
  pricing: { source_ids: string[] };
  version: { source_ids: string[] };
  billing: { source_ids: string[] };
  credits: { source_ids: string[] };
  faq: { source_ids: string[] };
}): ExtractedFacts {
  const pricingBody = pickBodyByChain(snapshots, chains.pricing);
  const versionBody = pickBodyByChain(snapshots, chains.version);
  const billingBody = pickBodyByChain(snapshots, chains.billing);
  const creditsBody = pickBodyByChain(snapshots, chains.credits);
  const faqBody = pickBodyByChain(snapshots, chains.faq);

  const firstId = (chain: { source_ids: string[] }) => {
    for (const id of chain.source_ids) {
      if (bodyOf(snapshots, id).length > 0) return id;
    }
    return null;
  };

  return {
    individualPricing: extractIndividualPricing(pricingBody),
    individualCredits: extractIndividualCredits(pricingBody),
    enterprisePricing: extractEnterprisePricing(pricingBody),
    doubleCreditsCampaign: extractDoubleCreditsCampaign(pricingBody),
    legacyRetention: extractLegacyRetention(pricingBody),
    legacyPricingInBilling: extractLegacyPricingInBilling(billingBody),
    modelList: extractModelList(versionBody),
    paymentMethods: extractPaymentMethods(pricingBody),
    creditFormula: extractCreditFormula(creditsBody),
    sources: {
      pricing: firstId(chains.pricing),
      version: firstId(chains.version),
      billing: firstId(chains.billing),
      credits: firstId(chains.credits),
      faq: firstId(chains.faq),
    },
  };
}
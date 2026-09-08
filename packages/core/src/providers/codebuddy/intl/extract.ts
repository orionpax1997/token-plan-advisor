import type { RawSnapshot } from "../load.ts";

/**
 * CodeBuddy 国际站确定性抽取。
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

const PLAN_LABELS = ["Free", "Pro", "Team"] as const;

/**
 * 抽取国际站新价（Pro $10/月、$96/年；Team $40/seat/月）。
 * 表格行示例：| Pro | $10.00 / month | $96.00 / year ($8.00 / month, billed annually) | 2,000 (1,000 base + 1,000 bonus) |
 */
export function extractCurrentPricing(pricingBody: string): {
  monthly: Record<string, number | null>;
  annual: Record<string, number | null>;
  total_credits: Record<string, number | null>;
  raw: string;
} {
  const monthly: Record<string, number | null> = {};
  const annual: Record<string, number | null> = {};
  const total_credits: Record<string, number | null> = {};
  let raw = "";
  for (const label of PLAN_LABELS) {
    if (label === "Free") {
      monthly[label] = 0;
      annual[label] = 0;
      total_credits[label] = 100;
      continue;
    }
    const re = new RegExp(
      `^\\|\\s*${label}\\s*\\|\\s*\\$([\\d.]+)\\s*(?:\\/\\s*seat\\s*)?\\/\\s*month\\s*\\|\\s*\\$([\\d.]+)\\s*(?:\\/\\s*seat\\s*)?\\/\\s*year[^|]*\\|\\s*([^|]+)\\|`,
      "m",
    );
    const m = pricingBody.match(re);
    if (!m) continue;
    const monthlyNum = Number(m[1]);
    const annualNum = Number(m[2]);
    const totalRaw = m[3]!.trim();
    const totalMatch = totalRaw.match(/([\d,]+)/);
    const totalNum = totalMatch ? Number(totalMatch[1]!.replace(/,/g, "")) : null;
    if (!Number.isFinite(monthlyNum) || !Number.isFinite(annualNum)) continue;
    monthly[label] = monthlyNum;
    annual[label] = annualNum;
    total_credits[label] = totalNum;
    raw = m[0].trim();
  }
  return { monthly, annual, total_credits, raw };
}

/**
 * 抽取旧价（Pro $9.95/月、$119.40/年）——来自 Price details (77270)。
 */
export function extractLegacyPricing(priceDetailsBody: string): {
  pro_monthly: number;
  annual: number;
  raw: string;
} | null {
  const monthlyMatch = priceDetailsBody.match(/Pro monthly\s*\|\s*\*\*\$([\d.]+)\s*\/\s*month\*\*/);
  const annualMatch = priceDetailsBody.match(/Pro annual\s*\|\s*\*\*\$([\d.]+)\s*\/\s*year\*\*/);
  if (!monthlyMatch || !annualMatch) return null;
  const monthly = Number(monthlyMatch[1]);
  const annual = Number(annualMatch[1]);
  if (!Number.isFinite(monthly) || !Number.isFinite(annual)) return null;
  return { pro_monthly: monthly, annual, raw: `${monthlyMatch[0]}\n${annualMatch[0]}`.trim() };
}

/**
 * 抽取 2026-08-07 调价生效日期与老用户保价条款。
 */
export function extractTransition(billingBody: string): {
  effective_from: string;
  raw: string;
  retention_monthly: number | null;
} | null {
  // 页面存在 "Effective August 7, 2026"（标题）与 "takes effect on August 7, 2026"（正文）两个信号；
  // 统一匹配 "effect"（含大小写）+ 非控制字符 + 日期；首个有效结果即调价生效日
  const m = billingBody.match(/effect[^:\n]*?(\w+ \d{1,2}, \d{4})/i);
  if (!m) return null;
  const retentionMatch = billingBody.match(/retain their subscription price of \$([\d.]+)\/month/);
  const retention = retentionMatch ? Number(retentionMatch[1]) : null;
  // 把英文日期转 YYYY-MM-DD（August 7, 2026 → 2026-08-07）
  const normalized = normalizeEnglishDate(m[1]!);
  if (!normalized) return null;
  return { effective_from: normalized, raw: m[0].trim(), retention_monthly: retention };
}

/**
 * 抽取支付方式（国际站官方列表）。
 */
export function extractPaymentMethods(billingBody: string): string[] {
  const methods = new Set<string>();
  const re = /Supported Payment Methods[\s\S]*?(?=\n##|\n#|$)/;
  const section = billingBody.match(re)?.[0] ?? "";
  for (const m of section.matchAll(/-\s*([^\n]+)/g)) {
    methods.add(m[1]!.trim());
  }
  return [...methods];
}

/** 抽取"available to users globally"声明原文。 */
export function extractGlobalAvailability(privacyBody: string): string | null {
  // 隐私政策原文可能不包含结尾句号；用非换行字符限制，避免贪心跳过多句
  const m = privacyBody.match(/available to users globally[^\n]*/);
  return m ? m[0].trim() : null;
}

/** 抽取"Last updated:" 日期（YYYY-MM-DD）。 */
export function extractStatedDate(body: string): string | null {
  const m = body.match(/Last updated:\s*(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // 兼容 "Last updated:" 为空的情形（codebuddy.ai 定价页）
  const alt = body.match(/Last updated:\s*\(empty\)/);
  if (alt) return null;
  return null;
}

export function normalizeEnglishDate(text: string): string | null {
  const m = text.match(/([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})/);
  if (!m) return null;
  const months: Record<string, string> = {
    January: "01", February: "02", March: "03", April: "04", May: "05", June: "06",
    July: "07", August: "08", September: "09", October: "10", November: "11", December: "12",
  };
  const month = months[m[1]!];
  if (!month) return null;
  return `${m[3]}-${month}-${m[2]!.padStart(2, "0")}`;
}

export interface ExtractedFacts {
  currentPricing: ReturnType<typeof extractCurrentPricing>;
  legacyPricing: ReturnType<typeof extractLegacyPricing>;
  transition: ReturnType<typeof extractTransition>;
  paymentMethods: string[];
  globalAvailability: string | null;
  /** 抽出时实际使用的各链首位非空 body 对应的 source_id（用于字段层 source_ids 透传）。 */
  sources: {
    pricing: string | null;
    billing: string | null;
    legacy: string | null;
    privacy: string | null;
  };
}

export function extractFacts(
  snapshots: RawSnapshot[],
  chains: {
    pricing: { source_ids: string[] };
    billing: { source_ids: string[] };
    legacy: { source_ids: string[] };
    privacy: { source_ids: string[] };
  },
): ExtractedFacts {
  const pricingBody = pickBodyByChain(snapshots, chains.pricing);
  const billingBody = pickBodyByChain(snapshots, chains.billing);
  const legacyBody = pickBodyByChain(snapshots, chains.legacy);
  const privacyBody = pickBodyByChain(snapshots, chains.privacy);

  const firstId = (chain: { source_ids: string[] }) => {
    for (const id of chain.source_ids) {
      if (bodyOf(snapshots, id).length > 0) return id;
    }
    return null;
  };

  return {
    currentPricing: extractCurrentPricing(pricingBody),
    legacyPricing: extractLegacyPricing(legacyBody),
    transition: extractTransition(billingBody),
    paymentMethods: extractPaymentMethods(billingBody),
    globalAvailability: extractGlobalAvailability(privacyBody),
    sources: {
      pricing: firstId(chains.pricing),
      billing: firstId(chains.billing),
      legacy: firstId(chains.legacy),
      privacy: firstId(chains.privacy),
    },
  };
}
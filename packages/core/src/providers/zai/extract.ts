import type { RawSnapshot } from "../_shared.ts";
import { bodyOf, normalizeEnglishDate } from "../extract-shared.ts";

/**
 * 确定性抽取层：从 docs.z.ai 的 .md 原文与订阅页 meta 中提取原始事实。
 * 每个抽取结果同时携带归一化值与命中的官方原文（raw），保证可追溯。
 * 抽取失败返回 null，由归一化层降级为 Unresolved Fact 而不是猜测。
 */

function textOf(cell: string): string {
  return cell
    .replace(/<[^>]*>/g, "")
    .replace(/\\\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function toNumber(raw: string): number | null {
  const n = Number(raw.replace(/,/g, "").replace(/\\/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** 抽取 "Last Update:" / "Publication date:" 行（官方自述时间戳）。 */
export function extractStatedDate(body: string, labels: string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(`${label}[:*]*\\s*([A-Z][a-z]+ \\d{1,2}, \\d{4})`);
    const m = body.match(re);
    if (m?.[1]) return normalizeEnglishDate(m[1]);
  }
  return null;
}

export interface ExtractedQuotaRow {
  plan_label: string;
  five_hour: number;
  weekly: number;
  raw: string;
}

/** 抽取 5 小时/周双池表格行（个人 Lite/Pro/Max 与团队 Standard/Premium Seat 共用形状）。 */
export function extractQuotaRows(body: string, planLabels: string[]): ExtractedQuotaRow[] {
  const rows: ExtractedQuotaRow[] = [];
  for (const label of planLabels) {
    const re = new RegExp(`^\\|\\s*${label}\\s*\\|\\s*([\\d,]+)\\s*\\|\\s*([\\d,]+)\\s*\\|\\s*$`, "gm");
    const m = body.match(re);
    if (!m?.[0]) continue;
    const cells = m[0].split("|").map((c) => c.trim());
    const fiveHour = toNumber(cells[2] ?? "");
    const weekly = toNumber(cells[3] ?? "");
    if (fiveHour === null || weekly === null) continue;
    rows.push({ plan_label: label, five_hour: fiveHour, weekly, raw: m[0].trim() });
  }
  return rows;
}

export interface ExtractedMultiplier {
  /** 模型名或 MCP 工具名（乘数表的 Product 列）。 */
  product_name: string;
  input: number | null;
  cached_input: number | null;
  output: number;
  raw: string;
  is_mcp: boolean;
}

/** 抽取乘数表（JSX 风格 HTML <table>，行含 Product Type rowspan）。 */
export function extractMultipliers(body: string): ExtractedMultiplier[] {
  const tableMatch = body.match(/<table>[\s\S]*?<\/table>/);
  if (!tableMatch) return [];
  const rows = tableMatch[0].match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
  const result: ExtractedMultiplier[] = [];
  let currentType = "";
  for (const row of rows) {
    const cells = (row.match(/<td[\s\S]*?<\/td>/g) ?? []).map(textOf);
    if (cells.length === 5) {
      currentType = cells[0]!;
      cells.shift();
    }
    if (cells.length !== 4) continue;
    const [name, input, cached, output] = cells;
    if (!name) continue;
    const isMcp = currentType.includes("MCP") || input === "—" || input === "-";
    const modelCode = name.replace(/\s*\(Including.*$/, "").replace(/\\$/, "").trim();
    const outputNum = toNumber(output ?? "");
    if (outputNum === null) continue;
    result.push({
      product_name: modelCode,
      input: isMcp ? null : toNumber(input ?? ""),
      cached_input: isMcp ? null : toNumber(cached ?? ""),
      output: outputNum,
      raw: cells.join(" | "),
      is_mcp: isMcp,
    });
  }
  return result;
}

/** 抽取 credits 计算公式原文（模型与 MCP 两条）。 */
export function extractFormulas(body: string): { model_credit_raw: string | null; mcp_credit_raw: string | null; divisor: number | null } {
  const modelCredit = body.match(/^\s*\*\s*(Model credit usage = .+)$/m)?.[1]?.trim() ?? null;
  const mcpCredit = body.match(/^\s*\*\s*(MCP tool credit usage = .+)$/m)?.[1]?.trim() ?? null;
  const divisorMatch = modelCredit?.match(/\/\s*([\d,]+)\s*$/);
  return {
    model_credit_raw: modelCredit,
    mcp_credit_raw: mcpCredit,
    divisor: divisorMatch ? toNumber(divisorMatch[1]!) : null,
  };
}

export interface ExtractedOffPeak {
  discount: number | null;
  raw: string;
  peak_hours_raw: string | null;
}

export function extractOffPeak(body: string): ExtractedOffPeak | null {
  const sentence = body.match(/\*\*(During off-peak hours[^*]+)\*\*/)?.[1]?.trim();
  if (!sentence) return null;
  const percent = sentence.match(/(\d+)% of the standard credit rate/);
  const peakHours = body.match(/\*\*Peak hours\*\*:\s*([^\n]+)\./)?.[1]?.trim() ?? null;
  return {
    discount: percent ? Number(percent[1]) / 100 : null,
    raw: sentence,
    peak_hours_raw: peakHours,
  };
}

export interface ExtractedModels {
  supported: string[];
  routed: { model_code: string; routed_to: string; raw: string }[];
}

/** 抽取支持模型与自动路由规则（Overview "Supported Models" 区块）。 */
export function extractModels(overviewBody: string): ExtractedModels {
  const supported: string[] = [];
  const routed: ExtractedModels["routed"] = [];
  // 页面存在两句 "All plans support ..."（另一句在讲 MCP 工具），取含模型名的句子
  for (const m of overviewBody.matchAll(/\*\s*All plans support (.+)\./g)) {
    if (!m[1]?.includes("GLM-")) continue;
    supported.push(
      ...m[1]
        .split(",")
        .map((s) => s.replace(/\*\*/g, "").trim())
        .filter((s) => /^GLM-[A-Za-z0-9.\-]+$/.test(s)),
    );
    break;
  }
  const routingLine = overviewBody.match(/\*\s*Requests for (.+)\./);
  if (routingLine?.[1]) {
    for (const m of overviewBody.matchAll(/requests for ([A-Za-z0-9\-/.]+) will (?:be )?automatically (?:be )?routed to ([A-Za-z0-9\-/.]+)/gi)) {
      for (const code of m[1]!.split("/")) {
        routed.push({ model_code: code.trim(), routed_to: m[2]!.trim().replace(/\.+$/, ""), raw: routingLine[1].trim() });
      }
    }
  }
  return { supported, routed };
}

export interface ExtractedStartingPrice {
  amount: number;
  currency: string;
  raw: string;
}

export function extractStartingPrice(overviewBody: string): ExtractedStartingPrice | null {
  const m = overviewBody.match(/Starting at just ([\d.]+)\s*(USD|CNY)\s*per month/);
  if (!m) return null;
  return { amount: Number(m[1]), currency: m[2]!, raw: m[0] };
}

export interface ExtractedSubscribeMeta {
  models: string[];
  plans_from_raw: string | null;
}

/** 订阅页 meta description：正文 RENDER_DEPENDENT，仅 meta 可静态核验。 */
export function extractSubscribeMeta(html: string): ExtractedSubscribeMeta | null {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  if (!m) return null;
  const content = m[1]!.replace(/&amp;/g, "&");
  const models: string[] = [];
  const listMatch = content.match(/like (.+?) for AI coding/);
  if (listMatch?.[1]) {
    for (const part of listMatch[1].split(/[,&]/)) {
      const name = part.trim();
      if (/^GLM-[A-Za-z0-9.\-]+$/.test(name)) models.push(name);
    }
  }
  const plansFrom = content.match(/Plans from ([\d.]+\/month)/);
  return { models, plans_from_raw: plansFrom ? `Plans from ${plansFrom[1]}` : null };
}

export interface ExtractedLegacyPriceTable {
  billing_period: "monthly" | "quarterly" | "annual";
  prices: { plan_label: string; amount: number; raw: string }[];
}

/** 抽取迁移公告的月/季/年价表（"Current Standard/Discounted Price" 列）。 */
export function extractLegacyPrices(transitionBody: string): ExtractedLegacyPriceTable[] {
  const sections: ExtractedLegacyPriceTable[] = [];
  const headings: [RegExp, "monthly" | "quarterly" | "annual"][] = [
    [/^Monthly Plan$/m, "monthly"],
    [/^Quarterly Plan$/m, "quarterly"],
    [/^Annual Plan$/m, "annual"],
  ];
  for (const [heading, period] of headings) {
    const start = transitionBody.search(heading);
    if (start < 0) continue;
    const next = headings
      .map(([h]) => ({ idx: transitionBody.slice(start + 1).search(h) }))
      .filter(({ idx }) => idx >= 0)
      .map(({ idx }) => idx)
      .sort((a, b) => a - b)[0];
    const section = transitionBody.slice(start, next === undefined ? undefined : start + 1 + next + 20);
    const prices: ExtractedLegacyPriceTable["prices"] = [];
    for (const m of section.matchAll(/^\|\s*(Lite|Pro|Max)\s*\|\s*\\\$([\d.]+)\s*\|/gm)) {
      const amount = Number(m[2]);
      if (Number.isFinite(amount)) {
        prices.push({ plan_label: m[1]!, amount, raw: m[0].trim() });
      }
    }
    if (prices.length > 0) sections.push({ billing_period: period, prices });
  }
  return sections;
}

export interface ExtractedPayment {
  methods: string[];
  three_ds_note: string | null;
}

export function extractPaymentMethods(usagePolicyBody: string, helpFaqBody: string): ExtractedPayment {
  const methods: string[] = [];
  const m = usagePolicyBody.match(/linked third-party payment method \(e\.g\., ([^)]+)\)/);
  if (m?.[1]) {
    for (const part of m[1].split(/\bor\b|,/)) {
      const name = part.trim();
      if (name) methods.push(name);
    }
  }
  const threeDs = helpFaqBody.match(/([^.\n]*3DS verification is not supported[^.\n]*\.)/)?.[1]?.trim() ?? null;
  return { methods, three_ds_note: threeDs };
}

export interface ExtractedCancellation {
  usage_policy_raw: string | null;
  faq_raw: string | null;
}

export function extractCancellation(usagePolicyBody: string, faqBody: string): ExtractedCancellation {
  const up = usagePolicyBody.match(/cancel \*\*at least ([^*]+)\*\* before the next billing date/)?.[1]?.trim() ?? null;
  const faq = faqBody.match(/cancel at least (.+?) before your next billing date/)?.[1]?.trim() ?? null;
  return { usage_policy_raw: up, faq_raw: faq };
}

export function extractRefund(usagePolicyBody: string): string | null {
  const sentence = usagePolicyBody.match(/once a subscription service is purchased[^*]*?refunds are not supported\./i)?.[0];
  return sentence ? sentence.trim() : null;
}

export interface ExtractedExportControl {
  regions: string[];
  raw: string;
}

export function extractExportControl(termsBody: string): ExtractedExportControl | null {
  const m = termsBody.match(
    /shall not be used for the benefit of, nor exported, re-exported, or transferred to:\s*\(a\) any person or entity located in ([^;]+);/,
  );
  if (!m?.[1]) return null;
  const regions = m[1]
    .replace(/\*\*/g, "")
    .split(",")
    .map((s) => s.replace(/\bor\b/, "").trim())
    .filter(Boolean);
  return { regions, raw: `(a) any person or entity located in ${m[1]}` };
}

export interface ExtractedDataPolicy {
  individual_training_raw: string | null;
  team_training_raw: string | null;
  processing_location: string | null;
}

export function extractDataPolicy(
  termsBody: string,
  privacyBody: string,
  teamPlanBody: string,
): ExtractedDataPolicy {
  const individualTraining =
    termsBody.match(/For individual users, we reserve the right to process any User Content[^.]*\./)?.[0]?.trim() ?? null;
  const privacyTraining =
    privacyBody.match(/including in developing, improving, or promoting our Services, such as when we train and improve our models\./)?.[0]?.trim() ??
    null;
  const individualTrainingRaw = individualTraining
    ? privacyTraining
      ? `${individualTraining} | Privacy Policy: ${privacyTraining}`
      : individualTraining
    : null;
  const teamTraining = teamPlanBody.match(/\*\*Data is not used for model training by default\*\*[^.]*\./)?.[0]?.trim() ?? null;
  const processing =
    privacyBody.match(/your personal data is generally processed in ([A-Za-z ]+?)\./)?.[1]?.trim() ?? null;
  return {
    individual_training_raw: individualTrainingRaw,
    team_training_raw: teamTraining,
    processing_location: processing,
  };
}

export interface ExtractedCampaign {
  effective_from: string | null;
  effective_until: string | null;
  raw: string;
  zero_quota_raw: string | null;
}

export function extractCampaign(body: string): ExtractedCampaign | null {
  const period = body.match(
    /Campaign period:\s*(\w+ \d{1,2}, \d{4}) to (\w+ \d{1,2}, \d{4})/,
  );
  if (!period) return null;
  const zeroQuota = body.match(/\*\*Zero quota consumption\*\* for unlimited usage/)?.[0] ?? null;
  return {
    effective_from: normalizeEnglishDate(period[1]!),
    effective_until: normalizeEnglishDate(period[2]!),
    raw: period[0],
    zero_quota_raw: zeroQuota,
  };
}

/** 汇总一次采集的全部抽取结果。 */
export interface ExtractedFacts {
  quotasIndividual: ExtractedQuotaRow[];
  quotasTeam: ExtractedQuotaRow[];
  multipliers: ExtractedMultiplier[];
  formulas: ReturnType<typeof extractFormulas>;
  offPeak: ExtractedOffPeak | null;
  models: ExtractedModels;
  startingPrice: ExtractedStartingPrice | null;
  subscribeMeta: ExtractedSubscribeMeta | null;
  legacyPrices: ExtractedLegacyPriceTable[];
  payment: ExtractedPayment;
  cancellation: ExtractedCancellation;
  refund: string | null;
  exportControl: ExtractedExportControl | null;
  dataPolicy: ExtractedDataPolicy;
  campaign: ExtractedCampaign | null;
}

export function extractFacts(snapshots: RawSnapshot[]): ExtractedFacts {
  const overview = bodyOf(snapshots, "devpack-overview");
  const teamplan = bodyOf(snapshots, "devpack-teamplan");
  const usagePolicy = bodyOf(snapshots, "devpack-usage-policy");
  const faq = bodyOf(snapshots, "devpack-faq");
  const helpFaq = bodyOf(snapshots, "help-faq");
  const transition = bodyOf(snapshots, "notice-transition");
  const terms = bodyOf(snapshots, "legal-terms-of-use");
  const privacy = bodyOf(snapshots, "legal-privacy-policy");
  const subscribe = bodyOf(snapshots, "subscribe-page");
  const eventNotice = bodyOf(snapshots, "notice-event-glm-53-flash");

  return {
    quotasIndividual: extractQuotaRows(overview, ["Lite", "Pro", "Max"]),
    quotasTeam: extractQuotaRows(teamplan, ["Standard Seat", "Premium Seat"]),
    multipliers: extractMultipliers(overview),
    formulas: extractFormulas(overview),
    offPeak: extractOffPeak(overview),
    models: extractModels(overview),
    startingPrice: extractStartingPrice(overview),
    subscribeMeta: extractSubscribeMeta(subscribe),
    legacyPrices: extractLegacyPrices(transition),
    payment: extractPaymentMethods(usagePolicy, helpFaq),
    cancellation: extractCancellation(usagePolicy, faq),
    refund: extractRefund(usagePolicy),
    exportControl: extractExportControl(terms),
    dataPolicy: extractDataPolicy(terms, privacy, teamplan),
    campaign: extractCampaign(eventNotice),
  };
}

import type { RawSnapshot } from "../../_shared.ts";
import { bodyOf, normalizeEnglishDate } from "../../extract-shared.ts";
import { SRC } from "./sources.ts";

/** 归因抽取结果：fact + 实际命中的来源 id（fact=null 表示全部候选未命中）。 */
export interface Attributed<T> {
  fact: T | null;
  sourceId: string | null;
}

/**
 * 按候选顺序对每个 body 应用抽取函数，返回首个非 null 结果及其来源 id。
 * Cursor 定价页正文为 JS 渲染（JSON-LD 除外），同一链内不同事实可能来自不同来源；
 * 本助手把"实际使用的替代来源"落到字段级，供 normalize 层写入 source_ids。
 */
function attribute<T>(snapshots: RawSnapshot[], ids: string[], fn: (body: string) => T | null): Attributed<T> {
  for (const id of ids) {
    const body = bodyOf(snapshots, id);
    if (body.length === 0) continue;
    const fact = fn(body);
    if (fact !== null) return { fact, sourceId: id };
  }
  return { fact: null, sourceId: null };
}

// ---------------------------------------------------------------------------
// 价目：JSON-LD（JS 渲染定价页内嵌）与帮助中心表格
// ---------------------------------------------------------------------------

export interface ExtractedJsonLd {
  offers: { name: string; price: number; currency: string }[];
  raw: string;
}

/**
 * 从定价页 HTML 内嵌的 JSON-LD 抽取 Offer 结构化数据。
 * cursor.com/pricing 的卡片布局经客户端渲染，但 JSON-LD 列出 Hobby 0/Pro 20/Pro+ 60/Ultra 200/Teams 40（USD）。
 */
export function extractJsonLdOffers(body: string): ExtractedJsonLd | null {
  const scripts = [...body.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  for (const script of scripts) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(script[1]!.trim());
    } catch {
      continue;
    }
    const nodes: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    const offers: ExtractedJsonLd["offers"] = [];
    let raw = "";
    const walk = (node: unknown): void => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      const obj = node as Record<string, unknown>;
      if (obj["@graph"]) walk(obj["@graph"]);
      if (obj["@type"] === "Offer" && typeof obj.name === "string") {
        const price = Number(obj.price);
        if (Number.isFinite(price)) {
          offers.push({ name: obj.name, price, currency: String(obj.priceCurrency ?? "") });
          raw = raw ? `${raw}\n${JSON.stringify(obj)}` : JSON.stringify(obj);
        }
      }
    };
    walk(parsed);
    if (offers.length > 0) return { offers, raw };
  }
  return null;
}

export interface ExtractedHelpPriceTable {
  /** tier 名（Hobby/Pro/Pro+/Ultra/Teams Standard/Teams Premium）→ 行内容。 */
  rows: Record<string, { monthly: number | null; otherModels: string; raw: string }>;
  raw: string;
}

/**
 * 抽取帮助中心定价表。行示例：
 * `| Hobby | Free | Limited |`、`| Pro | $20/mo | $20 |`、`| Teams Standard | $40/user/mo | Standard team allowance |`
 */
export function extractHelpPriceTable(body: string): ExtractedHelpPriceTable | null {
  const tierNames = ["Hobby", "Pro", "Pro+", "Ultra", "Teams Standard", "Teams Premium"] as const;
  const rows: ExtractedHelpPriceTable["rows"] = {};
  let raw = "";
  for (const tier of tierNames) {
    const re = new RegExp(`^\\|\\s*${tier.replace("+", "\\+")}\\s*\\|\\s*([^|]+)\\|\\s*([^|]+)\\|`, "m");
    const m = body.match(re);
    if (!m) continue;
    const priceCell = m[1]!.trim();
    const monthlyMatch = priceCell.match(/\$([\d,]+)\s*\/\s*(?:mo|user\/mo)/);
    const monthly = monthlyMatch ? Number(monthlyMatch[1]!.replace(/,/g, "")) : tier === "Hobby" ? 0 : null;
    rows[tier] = { monthly, otherModels: m[2]!.trim(), raw: m[0].trim() };
    raw = raw ? `${raw}\n${m[0].trim()}` : m[0].trim();
  }
  if (Object.keys(rows).length === 0) return null;
  return { rows, raw };
}

// ---------------------------------------------------------------------------
// 双池额度与 on-demand
// ---------------------------------------------------------------------------

export interface ExtractedOtherModelsPool {
  /** 数值型美元等值额度（Pro 20 / Pro+ 70 / Ultra 400）。 */
  perTier: Record<string, number>;
  raw: string;
}

/** 抽取 Other Models 池数值（帮助中心表第 3 列，或文档站 "at least $20 of third-party model usage" 句）。 */
export function extractOtherModelsPool(body: string): ExtractedOtherModelsPool | null {
  const perTier: Record<string, number> = {};
  let raw = "";
  for (const tier of ["Pro", "Pro+", "Ultra"] as const) {
    const re = new RegExp(`^\\|\\s*${tier.replace("+", "\\+")}\\s*\\|[^|]*\\|\\s*\\$([\\d,]+)\\s*\\|`, "m");
    const m = body.match(re);
    if (m) {
      perTier[tier] = Number(m[1]!.replace(/,/g, ""));
      raw = raw ? `${raw}\n${m[0].trim()}` : m[0].trim();
    }
  }
  if (Object.keys(perTier).length > 0) return { perTier, raw };
  const docs = body.match(/include at least \$([\d,]+) of third-party model usage each month[^.\n]*/);
  if (docs) {
    const baseline = Number(docs[1]!.replace(/,/g, ""));
    if (Number.isFinite(baseline)) return { perTier: { Pro: baseline }, raw: docs[0].trim() };
  }
  return null;
}

/** 抽取第一方池官方表述（无数值："Generous included usage"）。 */
export function extractFirstPartyPoolStatement(body: string): string | null {
  return (
    // 文档站加粗行（整行捕获，避免模型版本号"4.5"中的句点截断句子）
    body.match(/\*\*Cursor Models\*\*:\s*([^\n]+)/)?.[1]?.trim() ??
    body.match(/Generous included usage[^.\n]*/)?.[0]?.trim() ??
    null
  );
}

/** 抽取用量窗口口径（按月重置、不结转）。 */
export function extractUsageReset(body: string): string | null {
  return (
    body.match(/Usage resets monthly with your billing cycle\.\s*Unused usage does not roll over\./)?.[0]?.trim() ??
    body.match(/renews monthly or yearly based on your plan\./)?.[0]?.trim() ??
    null
  );
}

export interface ExtractedOnDemand {
  noMarkup: string | null;
  arrears: string | null;
  raw: string;
}

/** 抽取 on-demand 溢出计费口径（按相同 API 费率、后付）。 */
export function extractOnDemand(body: string): ExtractedOnDemand | null {
  const noMarkup = body.match(/billed at API rates[^.\n]*(?:no markup|without markup)[^.。\n]*\.?/)?.[0]?.trim() ?? null;
  const arrears = body.match(/billed in arrears[^.\n]*\.?/)?.[0]?.trim() ?? null;
  if (!noMarkup && !arrears) return null;
  return { noMarkup, arrears, raw: [noMarkup, arrears].filter(Boolean).join(" ") };
}

export interface ExtractedAutoModes {
  costPricing: string | null;
  comparison: string | null;
  raw: string;
}

/** 抽取 Auto 三模式计费口径（Cost 按 token、Balance/Intelligence 约 2–4 倍）。 */
export function extractAutoModes(body: string): ExtractedAutoModes | null {
  const costPricing = body.match(/Auto Cost pricing is set per million tokens[^.\n]*\./)?.[0]?.trim() ?? null;
  const comparison =
    body.match(/Balance and Intelligence cost about twice as much[^.\n]*\./)?.[0]?.trim() ?? null;
  if (!costPricing && !comparison) return null;
  return { costPricing, comparison, raw: [costPricing, comparison].filter(Boolean).join(" ") };
}

export interface ExtractedTokenRate {
  rate: string;
  appliesTo: string | null;
  raw: string;
}

/** 抽取 Cursor Token Rate（Teams/Enterprise 第三方请求附加费，含 BYOK）。 */
export function extractTokenRate(body: string): ExtractedTokenRate | null {
  const rate = body.match(/\$0\.25 per million tokens/)?.[0]?.trim() ?? null;
  if (!rate) return null;
  const appliesTo =
    body.match(/applies to input tokens, output tokens, and cached tokens[^.\n]*\./)?.[0]?.trim() ?? null;
  return { rate, appliesTo, raw: [rate, appliesTo].filter(Boolean).join(" ") };
}

/** 抽取 Teams 池耗尽后的切换顺序（第三方池 → Cursor Models 池 → on-demand）。 */
export function extractTeamsPoolOrder(body: string): string | null {
  return body.match(/if (?:the )?third[- ]party pool[^.\n]*(?:Cursor Models|first[- ]party)[^.。\n]*\.?/i)?.[0]?.trim() ?? null;
}

// ---------------------------------------------------------------------------
// 地区与渠道
// ---------------------------------------------------------------------------

/** 抽取 iOS 内购的中国大陆例外声明（支付渠道维度）。 */
export function extractIosChinaExclusion(body: string): string | null {
  return (
    body.match(/available in every region where Cursor is on the App Store[^.\n]*mainland China[^.\n]*\.?/)?.[0]?.trim() ??
    body.match(/everywhere except mainland China/)?.[0]?.trim() ??
    null
  );
}

export interface ExtractedModelRegionPolicy {
  modelRestriction: string;
  startIndia: string | null;
  vpn: string | null;
  raw: string;
}

/** 抽取模型级地区限制与 Cursor Start 印度限定（含反 VPN 措施）。 */
export function extractModelRegionPolicy(body: string): ExtractedModelRegionPolicy | null {
  const modelRestriction =
    body.match(/certain models may not be available in your region[^.\n]*\./)?.[0]?.trim() ??
    body.match(/those models won't appear in Cursor[^.\n]*\./)?.[0]?.trim() ??
    "";
  const startIndia = body.match(/Cursor Start[^.\n]*only available in India[^.\n]*\.?/)?.[0]?.trim() ?? null;
  const vpn = body.match(/If you access Cursor from outside India[^.\n]*\./)?.[0]?.trim() ?? null;
  if (!modelRestriction && !startIndia && !vpn) return null;
  return { modelRestriction, startIndia, vpn, raw: [modelRestriction, startIndia, vpn].filter(Boolean).join(" ") };
}

export interface ExtractedSelfServePayment {
  cards: string | null;
  resellers: string | null;
  raw: string;
}

/** 抽取自助支付方式与直售声明（定价页 FAQ）。 */
export function extractSelfServePayment(body: string): ExtractedSelfServePayment | null {
  const cards = body.match(/Self-serve plans support all major credit and debit cards[^.\n]*\./)?.[0]?.trim() ?? null;
  const resellers =
    body.match(/Cursor subscriptions are only sold directly through cursor\.com[^.\n]*\./)?.[0]?.trim() ?? null;
  if (!cards && !resellers) return null;
  return { cards, resellers, raw: [cards, resellers].filter(Boolean).join(" ") };
}

// ---------------------------------------------------------------------------
// 法律条款（ToS）
// ---------------------------------------------------------------------------

/** 抽取 ToS §1.3 训练限制（全大写原文）。 */
export function extractTrainingClause(body: string): string | null {
  return body.match(/ANYSPHERE WILL NOT USE CONTENT TO TRAIN[^.]*\./)?.[0]?.trim() ?? null;
}

/** 抽取 ToS §17.5 出口管制条款（正文含 "U.S." 缩写，不能按句号截断）。 */
export function extractExportControl(body: string): string | null {
  return body.match(/The Service may not be used in or for the benefit of[\s\S]*?under applicable trade laws\./)?.[0]?.trim() ?? null;
}

export interface ExtractedPaymentTerms {
  usdFees: string | null;
  stripe: string | null;
  raw: string;
}

/** 抽取 ToS §4 支付条款（USD 计价 + Stripe 处理）。 */
export function extractPaymentTerms(body: string): ExtractedPaymentTerms | null {
  const usdFees = body.match(/all fees are in U\.S\. Dollars/)?.[0]?.trim() ?? null;
  const stripe = body.match(/payments? (?:are|is) processed (?:through|by) Stripe[^.\n]*\.?/i)?.[0]?.trim() ?? null;
  if (!usdFees && !stripe) return null;
  return { usdFees, stripe, raw: [usdFees, stripe].filter(Boolean).join(" ") };
}

/** 抽取 ToS §2 注册前提（年龄 + 遵守当地法律）。 */
export function extractRegistrationTerms(body: string): string | null {
  return body.match(/at least the age of majority in your jurisdiction[^.]*\./)?.[0]?.trim() ?? null;
}

// ---------------------------------------------------------------------------
// 隐私 / 数据治理
// ---------------------------------------------------------------------------

export interface ExtractedPrivacyMode {
  privacyMode: string;
  zdr: string | null;
  fableException: string | null;
  raw: string;
}

/** 抽取 Privacy Mode 与 ZDR 口径。 */
export function extractPrivacyMode(body: string): ExtractedPrivacyMode | null {
  const privacyMode =
    body.match(/Privacy Mode[^.\n]*ensures your code is never used for training[^.\n]*\.?/)?.[0]?.trim() ??
    body.match(/ensures your code is never used for training[^.\n]*\.?/)?.[0]?.trim() ??
    "";
  const zdr = body.match(/Most models run under Cursor's ZDR agreements[^.\n]*\.?/)?.[0]?.trim() ?? null;
  const fableException =
    body.match(/Claude Fable 5[^.\n]*(?:data retention|数据保留)[^.\n]*\.?/)?.[0]?.trim() ??
    body.match(/(?:individual models|models) that require data retention[^.\n]*\.?/)?.[0]?.trim() ??
    null;
  if (!privacyMode && !zdr) return null;
  return { privacyMode, zdr, fableException, raw: [privacyMode, zdr].filter(Boolean).join(" ") };
}

export interface ExtractedDataResidency {
  usOnly: string;
  uplift: string | null;
  eu: string | null;
  raw: string;
}

/** 抽取数据驻留条款（Enterprise US-only +10%；EU inference-only 可申请）。 */
export function extractDataResidency(body: string): ExtractedDataResidency | null {
  const usOnly = body.match(/US-only data residency[^.\n]*\.?/)?.[0]?.trim() ?? "";
  const uplift = body.match(/incurs a 10% uplift[^.\n]*\.?/)?.[0]?.trim() ?? null;
  const eu = body.match(/EU \+ Iceland inference-only coverage[^.\n]*\.?/)?.[0]?.trim() ?? null;
  if (!usOnly) return null;
  return { usOnly, uplift, eu, raw: [usOnly, uplift, eu].filter(Boolean).join(" ") };
}

// ---------------------------------------------------------------------------
// Admin API（能力声明：不登录、不读取账户数据）
// ---------------------------------------------------------------------------

export interface ExtractedAdminApi {
  teamsOnly: string | null;
  auth: string | null;
  rateLimit: string | null;
  endpoints: string[];
  raw: string;
}

/** 抽取 Admin API 能力事实（Teams/Enterprise 限定、Basic 认证、20 req/min、端点清单）。 */
export function extractAdminApi(body: string): ExtractedAdminApi | null {
  const teamsOnly = body.match(/(?:only|exclusive(?:ly)?) (?:available )?for Teams and Enterprise[^.\n]*\.?/i)?.[0]?.trim() ?? null;
  const auth = body.match(/Basic Authentication with your (?:team )?API key/i)?.[0]?.trim() ?? null;
  const rateLimit = body.match(/Rate limited to 20 requests per minute per team/)?.[0]?.trim() ?? null;
  const endpoints = [...body.matchAll(/`?(?:GET|POST) (\/teams\/[a-z-]+)`?/g)].map((m) => m[1]!);
  if (!teamsOnly && !auth && !rateLimit && endpoints.length === 0) return null;
  return {
    teamsOnly,
    auth,
    rateLimit,
    endpoints: [...new Set(endpoints)],
    raw: [teamsOnly, auth, rateLimit].filter(Boolean).join(" "),
  };
}

// ---------------------------------------------------------------------------
// 定价改制历史（仅作来源注释，不建模旧档位）
// ---------------------------------------------------------------------------

export interface ExtractedPricingTransition {
  legacyRaw: string;
  raw: string;
}

/** 抽取 2025-06-16 改制公告中的 legacy 请求制原文。 */
export function extractPricingTransition(body: string): ExtractedPricingTransition | null {
  const legacyRaw =
    body.match(/500 requests per month[^.\n]*\./)?.[0]?.trim() ??
    body.match(/a limit of 500 requests per month[^.\n]*\.?/)?.[0]?.trim() ??
    null;
  if (!legacyRaw) return null;
  return { legacyRaw, raw: legacyRaw };
}

/** 抽取 2025-07-04 官方澄清（"unlimited" 仅限 Auto）。 */
export function extractPricingApology(body: string): string | null {
  return body.match(/['"]unlimited usage['"] was only for Auto[^.\n]*\.?/)?.[0]?.trim() ?? null;
}

// ---------------------------------------------------------------------------
// Teams 年付 / 个人年付折扣 / 限时促销 / 模型清单
// ---------------------------------------------------------------------------

export interface ExtractedTeamsPricing {
  standardMonthly: number;
  standardAnnual: number;
  premiumMonthly: number;
  premiumAnnual: number;
  premiumMultiplierRaw: string | null;
  raw: string;
}

/** 抽取 Teams 双价与 Premium 5x（2026-06 博客）。 */
export function extractTeamsPricing(body: string): ExtractedTeamsPricing | null {
  const standard = body.match(/\$(\d+) per seat per month[^.\n]*annual[^\n]*\$(\d+)/)?.[0]?.trim() ?? null;
  const standardAlt = body.match(/\$(\d+)\/seat\/mo[\s\S]{0,80}?annual[^\n]*?\$(\d+)\/seat\/mo/)?.[0]?.trim() ?? null;
  const premium = body.match(/\$(\d+) per (?:seat|user) per month[\s\S]{0,200}?\$(\d+)(?:\/seat\/mo| per seat per month)[^.\n]*Premium/)?.[0]?.trim() ?? null;
  const multiplier = body.match(/5x the usage of a Standard seat/)?.[0]?.trim() ?? null;
  const m = standard ?? standardAlt ?? premium;
  if (!m) return null;
  const numbers = [...m.matchAll(/\$(\d+)/g)].map((x) => Number(x[1]!));
  if (numbers.length < 4) return null;
  return {
    standardMonthly: numbers[0]!,
    standardAnnual: numbers[1]!,
    premiumMonthly: numbers[2]!,
    premiumAnnual: numbers[3]!,
    premiumMultiplierRaw: multiplier,
    raw: m,
  };
}

/** 抽取个人年付折扣声明（具体月单价需登录 Stripe checkout）。 */
export function extractYearlyDiscount(body: string): string | null {
  return body.match(/Yearly plans offer a 20% discount\.?/)?.[0]?.trim() ?? null;
}

export interface ExtractedLaunchPromo {
  raw: string;
  effectiveUntil: string;
}

/** 抽取模型价限时促销（带到期日）。 */
export function extractLaunchPromo(body: string): ExtractedLaunchPromo | null {
  const m = body.match(/Launch promotion: \$([\d,]+)\/M input and \$([\d,]+)\/M output through ([A-Za-z]+ \d{1,2}, \d{4})/);
  if (!m) return null;
  const parsed = normalizeEnglishDate(m[3]!);
  if (!parsed) return null;
  return { raw: m[0].trim(), effectiveUntil: parsed };
}

/** 抽取页面自述更新时间（"Last updated August 13, 2026" / 博客 "Published June 16, 2025"）；无则 null。 */
export function extractStatedDate(body: string): string | null {
  const m = body.match(/(?:Last updated|Published) ([A-Za-z]+ \d{1,2}, \d{4})/);
  return m ? normalizeEnglishDate(m[1]!) : null;
}

export interface ExtractedModelCatalog {
  firstParty: { name: string; context: string }[];
  thirdParty: { name: string; context: string; note: string }[];
  raw: string;
}

/**
 * 抽取模型清单（docs/models-and-pricing 模型表）。
 * 第一方（Cursor Models 池）：Composer 2.5、Grok 4.5/4.6；其余为第三方 frontier 模型。
 */
export function extractModelCatalog(body: string): ExtractedModelCatalog | null {
  const firstParty: ExtractedModelCatalog["firstParty"] = [];
  const thirdParty: ExtractedModelCatalog["thirdParty"] = [];
  let raw = "";
  const re = /^\|\s*([A-Za-z][A-Za-z0-9.\- ]*?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm;
  for (const m of body.matchAll(re)) {
    const name = m[1]!.trim();
    if (name === "Model" || name === "---") continue;
    const context = m[2]!.trim();
    const note = m[3]!.trim();
    if (/^(Composer|Grok) /.test(name)) {
      firstParty.push({ name, context });
    } else {
      thirdParty.push({ name, context, note });
    }
    raw = raw ? `${raw}\n${m[0].trim()}` : m[0].trim();
  }
  if (firstParty.length === 0 && thirdParty.length === 0) return null;
  return { firstParty, thirdParty, raw: raw.trim() };
}

/** 抽取 Hobby 档定性限额（无数值）。 */
export function extractHobbyLimits(body: string): { agent: string | null; tab: string | null } | null {
  const agent = body.match(/Limited Agent requests/)?.[0]?.trim() ?? null;
  const tab = body.match(/Limited Tab completions/)?.[0]?.trim() ?? null;
  if (!agent && !tab) return null;
  return { agent, tab };
}

/** 抽取 "unlimited tab completions" 口径（注意：unlimited 限定对象随时间漂移，须带原文）。 */
export function extractUnlimitedScope(body: string): string | null {
  return body.match(/unlimited tab completions(?:,[^.\n]*)?/)?.[0]?.trim() ?? null;
}

// ---------------------------------------------------------------------------
// 汇总
// ---------------------------------------------------------------------------

/** 一次采集的全部归因抽取结果。 */
export interface ExtractedFacts {
  jsonLd: Attributed<ExtractedJsonLd>;
  helpPriceTable: Attributed<ExtractedHelpPriceTable>;
  otherModelsPool: Attributed<ExtractedOtherModelsPool>;
  firstPartyPool: Attributed<string>;
  usageReset: Attributed<string>;
  onDemand: Attributed<ExtractedOnDemand>;
  autoModes: Attributed<ExtractedAutoModes>;
  tokenRate: Attributed<ExtractedTokenRate>;
  teamsPoolOrder: Attributed<string>;
  iosChina: Attributed<string>;
  modelRegions: Attributed<ExtractedModelRegionPolicy>;
  selfServePayment: Attributed<ExtractedSelfServePayment>;
  trainingClause: Attributed<string>;
  exportControl: Attributed<string>;
  paymentTerms: Attributed<ExtractedPaymentTerms>;
  registrationTerms: Attributed<string>;
  privacyMode: Attributed<ExtractedPrivacyMode>;
  dataResidency: Attributed<ExtractedDataResidency>;
  adminApi: Attributed<ExtractedAdminApi>;
  pricingTransition: Attributed<ExtractedPricingTransition>;
  pricingApology: Attributed<string>;
  teamsPricing: Attributed<ExtractedTeamsPricing>;
  yearlyDiscount: Attributed<string>;
  launchPromo: Attributed<ExtractedLaunchPromo>;
  modelCatalog: Attributed<ExtractedModelCatalog>;
  hobbyLimits: Attributed<{ agent: string | null; tab: string | null }>;
  unlimitedScope: Attributed<string>;
}

/** 抽取入口：候选顺序即回退顺序（定价页 JSON-LD → 帮助中心表 → 文档站）。 */
export function extractFacts(snapshots: RawSnapshot[]): ExtractedFacts {
  return {
    jsonLd: attribute(snapshots, [SRC.pricing, SRC.helpPricing], extractJsonLdOffers),
    helpPriceTable: attribute(snapshots, [SRC.helpPricing, SRC.docsModelsPricing], extractHelpPriceTable),
    otherModelsPool: attribute(snapshots, [SRC.helpPricing, SRC.docsModelsPricing], extractOtherModelsPool),
    firstPartyPool: attribute(snapshots, [SRC.docsModelsPricing, SRC.helpPricing], extractFirstPartyPoolStatement),
    usageReset: attribute(snapshots, [SRC.helpUsageLimits, SRC.docsModelsPricing], extractUsageReset),
    onDemand: attribute(snapshots, [SRC.helpOverages, SRC.docsModelsPricing], extractOnDemand),
    autoModes: attribute(snapshots, [SRC.helpOverages, SRC.docsModelsPricing], extractAutoModes),
    tokenRate: attribute(snapshots, [SRC.docsModelsPricing, SRC.helpOverages], extractTokenRate),
    teamsPoolOrder: attribute(snapshots, [SRC.helpUsageLimits, SRC.docsModelsPricing], extractTeamsPoolOrder),
    iosChina: attribute(snapshots, [SRC.helpAppStore], extractIosChinaExclusion),
    modelRegions: attribute(snapshots, [SRC.helpRegions], extractModelRegionPolicy),
    selfServePayment: attribute(snapshots, [SRC.pricing, SRC.helpPricing], extractSelfServePayment),
    trainingClause: attribute(snapshots, [SRC.tos, SRC.helpPrivacy], extractTrainingClause),
    exportControl: attribute(snapshots, [SRC.tos], extractExportControl),
    paymentTerms: attribute(snapshots, [SRC.tos], extractPaymentTerms),
    registrationTerms: attribute(snapshots, [SRC.tos], extractRegistrationTerms),
    privacyMode: attribute(snapshots, [SRC.helpPrivacy, SRC.docsPrivacyGovernance], extractPrivacyMode),
    dataResidency: attribute(snapshots, [SRC.docsPrivacyGovernance, SRC.helpPrivacy], extractDataResidency),
    adminApi: attribute(snapshots, [SRC.docsAdminApi], extractAdminApi),
    pricingTransition: attribute(snapshots, [SRC.blogNewTier, SRC.blogJune2025Pricing], extractPricingTransition),
    pricingApology: attribute(snapshots, [SRC.blogJune2025Pricing], extractPricingApology),
    teamsPricing: attribute(snapshots, [SRC.blogTeamsPricing, SRC.helpPricing], extractTeamsPricing),
    yearlyDiscount: attribute(snapshots, [SRC.helpReferral, SRC.helpPricing], extractYearlyDiscount),
    launchPromo: attribute(snapshots, [SRC.docsModelsPricing], extractLaunchPromo),
    modelCatalog: attribute(snapshots, [SRC.docsModelsPricing], extractModelCatalog),
    hobbyLimits: attribute(snapshots, [SRC.helpPricing, SRC.helpUsageLimits], extractHobbyLimits),
    unlimitedScope: attribute(snapshots, [SRC.helpUsageLimits, SRC.docsModelsPricing], extractUnlimitedScope),
  };
}

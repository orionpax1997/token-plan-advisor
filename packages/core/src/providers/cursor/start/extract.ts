import type { RawSnapshot } from "../../_shared.ts";
import { bodyOf, normalizeEnglishDate } from "../../extract-shared.ts";
import { SRC } from "./sources.ts";

/** 归因抽取结果：fact + 实际命中的来源 id（fact=null 表示全部候选未命中）。 */
export interface Attributed<T> {
  fact: T | null;
  sourceId: string | null;
}

/** 按候选顺序应用抽取函数，返回首个非 null 结果及其来源 id。 */
function attribute<T>(snapshots: RawSnapshot[], ids: string[], fn: (body: string) => T | null): Attributed<T> {
  for (const id of ids) {
    const body = bodyOf(snapshots, id);
    if (body.length === 0) continue;
    const fact = fn(body);
    if (fact !== null) return { fact, sourceId: id };
  }
  return { fact: null, sourceId: null };
}

export interface ExtractedStartPricing {
  monthlyInr: number;
  taxInclusive: boolean;
  raw: string;
}

/** 抽取 Cursor Start 月价（₹649，税含）。 */
export function extractStartPricing(body: string): ExtractedStartPricing | null {
  const m = body.match(/₹\s?([\d,]+)\s*per month[^.\n]*/);
  if (!m) return null;
  const monthlyInr = Number(m[1]!.replace(/,/g, ""));
  if (!Number.isFinite(monthlyInr)) return null;
  const taxInclusive = /tax[- ]inclusive/i.test(m[0]);
  return { monthlyInr, taxInclusive, raw: m[0].trim() };
}

/** 抽取支付方式（UPI + 印度卡 3DS）。 */
export function extractStartPayment(body: string): { upi: string | null; cards: string | null } | null {
  const upi = body.match(/UPI/)?.[0] ?? null;
  const cards = body.match(/Indian credit and debit cards[^.\n]*\./)?.[0]?.trim() ?? null;
  if (!upi && !cards) return null;
  return { upi, cards };
}

/** 抽取印度手机号验证前提。 */
export function extractPhoneVerification(body: string): string | null {
  return body.match(/Indian phone number[^.\n]*\.?/)?.[0]?.trim() ?? null;
}

/** 抽取地区限定与反 VPN 措施。 */
export function extractIndiaOnly(body: string): { onlyIndia: string | null; vpn: string | null } | null {
  const onlyIndia = body.match(/only available in India[^.\n]*\.?/)?.[0]?.trim() ?? null;
  const vpn = body.match(/If you access Cursor from outside India[^.\n]*\./)?.[0]?.trim() ?? null;
  if (!onlyIndia && !vpn) return null;
  return { onlyIndia, vpn };
}

/** 抽取第一方模型限定与 Grok 固定 effort。 */
export function extractFirstPartyOnly(body: string): { firstPartyOnly: string | null; grokEffort: string | null } | null {
  const firstPartyOnly =
    body.match(/first[- ]party models only[^.\n]*\.?/i)?.[0]?.trim() ??
    body.match(/Cursor's first[- ]party models[^.\n]*\.?/i)?.[0]?.trim() ??
    null;
  const grokEffort = body.match(/Grok[^.\n]*medium effort[^.\n]*\.?/i)?.[0]?.trim() ?? null;
  if (!firstPartyOnly && !grokEffort) return null;
  return { firstPartyOnly, grokEffort };
}

/** 抽取无第三方池/无 on-demand 的官方表述。 */
export function extractNoOnDemand(body: string): string | null {
  return body.match(/(?:no|not (?:include|available))[^.\n]*(?:on-demand|third[- ]party)[^.\n]*\.?/i)?.[0]?.trim() ?? null;
}

/** 抽取页面自述更新时间（英文日期）。 */
export function extractStatedDate(body: string): string | null {
  const m = body.match(/(?:Last updated|Published) ([A-Za-z]+ \d{1,2}, \d{4})/);
  if (!m) return null;
  return normalizeEnglishDate(m[1]!);
}

/** 一次采集的全部归因抽取结果。 */
export interface ExtractedFacts {
  pricing: Attributed<ExtractedStartPricing>;
  payment: Attributed<{ upi: string | null; cards: string | null }>;
  phoneVerification: Attributed<string>;
  indiaOnly: Attributed<{ onlyIndia: string | null; vpn: string | null }>;
  firstPartyOnly: Attributed<{ firstPartyOnly: string | null; grokEffort: string | null }>;
  noOnDemand: Attributed<string>;
}

/** 抽取入口：候选顺序即回退顺序。 */
export function extractFacts(snapshots: RawSnapshot[]): ExtractedFacts {
  return {
    pricing: attribute(snapshots, [SRC.startHelp, SRC.startBlog], extractStartPricing),
    payment: attribute(snapshots, [SRC.startHelp], extractStartPayment),
    phoneVerification: attribute(snapshots, [SRC.startHelp], extractPhoneVerification),
    indiaOnly: attribute(snapshots, [SRC.startRegions, SRC.startHelp], extractIndiaOnly),
    firstPartyOnly: attribute(snapshots, [SRC.startHelp, SRC.startBlog], extractFirstPartyOnly),
    noOnDemand: attribute(snapshots, [SRC.startHelp], extractNoOnDemand),
  };
}

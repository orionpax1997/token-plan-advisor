import type { RawSnapshot } from "../_shared.ts";
import { bodyOf, pickBodyByChain } from "../extract-shared.ts";

/**
 * Gemini Code Assist 确定性抽取：从 Google Cloud / codeassist.google / docs 站抽取
 * 价格、限额、模型、注册要求等事实。每个抽取结果保留命中的官方原文（raw），
 * 保证可追溯；抽取不到返回 null，由归一化层降级为 Unresolved Fact 而非猜测。
 */

// ---------------------------------------------------------------------------
// 双口径价格（Hourly / Monthly）
// ---------------------------------------------------------------------------

/**
 * 抽取定价页的小时费率（research/01 §2）。
 * 表格行示例（fixture）："- Standard: $0.031232877 / 1 hour"
 * 月度承诺 vs 12-month 承诺按章节（"### License fees (monthly commitment)" /
 * "### License fees (12-month commitment)"）分别抽取。
 */
export function extractHourlyRates(pricingBody: string): {
  standard: { monthlyCommitment: number | null; annualCommitment: number | null };
  enterprise: { monthlyCommitment: number | null; annualCommitment: number | null };
  raw: string;
} {
  const out = {
    standard: { monthlyCommitment: null as number | null, annualCommitment: null as number | null },
    enterprise: { monthlyCommitment: null as number | null, annualCommitment: null as number | null },
  };
  let raw = "";

  // 月度承诺段
  const monthlySection = pricingBody.match(/License fees \(monthly commitment\)([\s\S]*?)(?=### License fees|$)/)?.[1] ?? "";
  // 12-month 承诺段
  const annualSection = pricingBody.match(/License fees \(12-month commitment\)([\s\S]*?)(?=### |$)/)?.[1] ?? "";

  // Standard monthly commitment
  const stdM = monthlySection.match(/Standard:\s*\$([\d.]+)\s*\/\s*1\s*hour/i);
  if (stdM) {
    const v = Number(stdM[1]);
    if (Number.isFinite(v)) out.standard.monthlyCommitment = v;
    raw = raw ? `${raw}\n${stdM[0].trim()}` : stdM[0].trim();
  }
  // Standard 12-month commitment
  const stdA = annualSection.match(/Standard:\s*\$([\d.]+)\s*\/\s*1\s*hour/i);
  if (stdA) {
    const v = Number(stdA[1]);
    if (Number.isFinite(v)) out.standard.annualCommitment = v;
    raw = raw ? `${raw}\n${stdA[0].trim()}` : stdA[0].trim();
  }
  // Enterprise monthly commitment
  const entM = monthlySection.match(/Enterprise:\s*\$([\d.]+)\s*\/\s*1\s*hour/i);
  if (entM) {
    const v = Number(entM[1]);
    if (Number.isFinite(v)) out.enterprise.monthlyCommitment = v;
    raw = raw ? `${raw}\n${entM[0].trim()}` : entM[0].trim();
  }
  // Enterprise 12-month commitment
  const entA = annualSection.match(/Enterprise:\s*\$([\d.]+)\s*\/\s*1\s*hour/i);
  if (entA) {
    const v = Number(entA[1]);
    if (Number.isFinite(v)) out.enterprise.annualCommitment = v;
    raw = raw ? `${raw}\n${entA[0].trim()}` : entA[0].trim();
  }

  return { ...out, raw };
}

/**
 * 抽取商业版页的月度口径（research/01 §2）。
 * 表格行示例："- $22.80 per user per month"（在 ### Gemini Code Assist Standard 节下）
 */
export function extractMonthlyRates(businessBody: string): {
  standard: { monthly: number | null; annualCommitment: number | null };
  enterprise: { monthly: number | null; annualCommitment: number | null };
  raw: string;
} {
  const out = {
    standard: { monthly: null as number | null, annualCommitment: null as number | null },
    enterprise: { monthly: null as number | null, annualCommitment: null as number | null },
  };
  let raw = "";

  // Standard 段
  const standardSection = businessBody.match(/### Gemini Code Assist Standard([\s\S]*?)(?=### Gemini Code Assist Enterprise|$)/)?.[1] ?? "";
  // Enterprise 段
  const enterpriseSection = businessBody.match(/### Gemini Code Assist Enterprise([\s\S]*?)(?=## |$)/)?.[1] ?? "";

  // Standard monthly
  const stdM = standardSection.match(/\$([\d.]+)\s*per user per month/);
  if (stdM) {
    const v = Number(stdM[1]);
    if (Number.isFinite(v)) out.standard.monthly = v;
    raw = raw ? `${raw}\n${stdM[0].trim()}` : stdM[0].trim();
  }
  // Standard annual commitment
  const stdA = standardSection.match(/\$([\d.]+)\s*per user per month with an upfront annual commitment/);
  if (stdA) {
    const v = Number(stdA[1]);
    if (Number.isFinite(v)) out.standard.annualCommitment = v;
    raw = raw ? `${raw}\n${stdA[0].trim()}` : stdA[0].trim();
  }
  // Enterprise monthly
  const entM = enterpriseSection.match(/\$([\d.]+)\s*per user per month/);
  if (entM) {
    const v = Number(entM[1]);
    if (Number.isFinite(v)) out.enterprise.monthly = v;
    raw = raw ? `${raw}\n${entM[0].trim()}` : entM[0].trim();
  }
  // Enterprise annual commitment
  const entA = enterpriseSection.match(/\$([\d.]+)\s*per user per month with an upfront annual commitment/);
  if (entA) {
    const v = Number(entA[1]);
    if (Number.isFinite(v)) out.enterprise.annualCommitment = v;
    raw = raw ? `${raw}\n${entA[0].trim()}` : entA[0].trim();
  }

  return { ...out, raw };
}

// ---------------------------------------------------------------------------
// 限额（agent/CLI/code/chat）
// ---------------------------------------------------------------------------

/**
 * 抽取每日限额（research/01 §2）。
 * 表格行示例："| Standard | 1500 | 6000 | 960 |"
 */
export function extractDailyQuotas(quotasBody: string): {
  standard: { agentCli: number | null; code: number | null; chat: number | null };
  enterprise: { agentCli: number | null; code: number | null; chat: number | null };
  raw: string;
} {
  const out = {
    standard: { agentCli: null as number | null, code: null as number | null, chat: null as number | null },
    enterprise: { agentCli: null as number | null, code: null as number | null, chat: null as number | null },
  };
  let raw = "";

  // Standard 行
  const std = quotasBody.match(/^\|\s*Standard\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|/m);
  if (std) {
    out.standard.agentCli = Number(std[1]!.replace(/,/g, ""));
    out.standard.code = Number(std[2]!.replace(/,/g, ""));
    out.standard.chat = Number(std[3]!.replace(/,/g, ""));
    raw = std[0].trim();
  }
  // Enterprise 行
  const ent = quotasBody.match(/^\|\s*Enterprise\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|/m);
  if (ent) {
    out.enterprise.agentCli = Number(ent[1]!.replace(/,/g, ""));
    out.enterprise.code = Number(ent[2]!.replace(/,/g, ""));
    out.enterprise.chat = Number(ent[3]!.replace(/,/g, ""));
    raw = raw ? `${raw}\n${ent[0].trim()}` : ent[0].trim();
  }

  return { ...out, raw };
}

/** 抽取每秒请求（"Requests per second: 2"）。 */
export function extractRps(quotasBody: string): number | null {
  const m = quotasBody.match(/Requests per second:\s*(\d+)/);
  if (!m) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : null;
}

/** 抽取上下文窗口（1M tokens）。 */
export function extractContextWindow(quotasBody: string, businessBody: string): {
  tokens: number | null;
  raw: string;
} {
  const quotas = quotasBody.match(/1,000,000\s*token\s*context\s*window/i)?.[0]?.trim();
  const business = businessBody.match(/1M\s*token\s*context\s*window/i)?.[0]?.trim();
  const raw = quotas ?? business ?? "";
  let tokens: number | null = null;
  if (raw) tokens = 1000000;
  return { tokens, raw };
}

/** 抽取代码自定义仓库上限（20,000）。 */
export function extractCustomizationRepos(quotasBody: string): number | null {
  const m = quotasBody.match(/Code customization repositories:\s*(\d{1,3}(?:,\d{3})*)/i);
  if (!m) return null;
  const v = Number(m[1]!.replace(/,/g, ""));
  return Number.isFinite(v) ? v : null;
}

// ---------------------------------------------------------------------------
// 服务区域与注册要求
// ---------------------------------------------------------------------------

/** 抽取"全球服务、用户不可选区"原文（research/01 §2）。 */
export function extractGlobalServing(locationsBody: string): {
  raw: string;
  availableRegions: string[];
  hasChinaMainland: boolean;
} {
  // 区域清单：US/Europe/APAC
  const regions: string[] = [];
  if (/United States|Iowa|Oregon|Las Vegas|N\. Virginia/.test(locationsBody)) regions.push("United States");
  if (/Belgium|Finland/.test(locationsBody)) regions.push("Europe");
  if (/Singapore/.test(locationsBody)) regions.push("Asia Pacific");
  return {
    raw: locationsBody.match(/operate globally[\s\S]{0,400}/i)?.[0]?.trim() ?? "",
    availableRegions: regions,
    hasChinaMainland: /China(?! \(|Hong|Macao)/i.test(locationsBody),
  };
}

/** 抽取 Enterprise 至少 10 许可证。 */
export function extractMinLicenses(setupBody: string): number | null {
  const m = setupBody.match(/purchasing Enterprise[^.\n]*?at least (\d+) licenses/i);
  if (!m) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : null;
}

/** 抽取注册要求（Google Cloud 项目 + billing account + 启用 API + IAM 角色）。 */
export function extractRegistrationRequirements(setupBody: string): {
  googleCloudProject: boolean;
  billingAccount: boolean;
  apiEnablement: string | null;
  iamRole: string | null;
  raw: string;
} {
  const googleCloudProject = /Google Cloud project/i.test(setupBody);
  const billingAccount = /billing account/i.test(setupBody);
  const apiEnablement = setupBody.match(/enable the ([a-z.]+)\s+API/i)?.[0]?.trim()
    ?? setupBody.match(/`([a-z.]+)`/)?.[1]
    ?? null;
  const iamRole = setupBody.match(/consumerprocurement\.orders\.place/i)?.[0] ?? null;
  return {
    googleCloudProject,
    billingAccount,
    apiEnablement,
    iamRole,
    raw: setupBody.match(/To purchase[^.\n]*\.[\s\S]{0,400}/i)?.[0]?.trim() ?? "",
  };
}

/** 抽取 30 天免费试用 + 最多 50 用户。 */
export function extractFreeTrial(businessBody: string): {
  days: number | null;
  maxUsers: number | null;
  raw: string;
} {
  const daysMatch = businessBody.match(/(\d+)-day free trial/);
  const days = daysMatch ? Number(daysMatch[1]) : null;
  const usersMatch = businessBody.match(/up to (\d+) users? during (?:the )?trial/i)
    ?? businessBody.match(/(\d+) users? maximum/i);
  const maxUsers = usersMatch ? Number(usersMatch[1]) : null;
  return {
    days: days !== null && Number.isFinite(days) ? days : null,
    maxUsers: maxUsers !== null && Number.isFinite(maxUsers) ? maxUsers : null,
    raw: businessBody.match(/free trial[^.\n]*\.?/i)?.[0]?.trim() ?? "",
  };
}

// ---------------------------------------------------------------------------
// 个人层停服状态
// ---------------------------------------------------------------------------

/**
 * 抽取个人层 2026-06-18 停服公告。
 * 返回值 truthy 表示已停服。
 */
export function extractIndividualsDeprecation(deprecationBody: string): {
  effectiveDate: string | null;
  migrationTarget: string | null;
  raw: string;
} {
  const months: Record<string, string> = {
    January: "01", February: "02", March: "03", April: "04", May: "05", June: "06",
    July: "07", August: "08", September: "09", October: "10", November: "11", December: "12",
  };

  let effectiveDate: string | null = null;

  // ISO 格式优先
  const isoMatch = deprecationBody.match(/Effective\s+(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    effectiveDate = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  } else {
    // "Effective June 18, 2026" 形式
    const longMatch = deprecationBody.match(/Effective\s+([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (longMatch) {
      const month = months[longMatch[1]!];
      if (month) {
        effectiveDate = `${longMatch[3]}-${month}-${longMatch[2]!.padStart(2, "0")}`;
      }
    }
  }

  const migration = deprecationBody.match(/migrating? (?:to|towards) (Antigravity)/i)?.[1]
    ?? deprecationBody.match(/(Antigravity)[\s\S]{0,200}?migrate/i)?.[1]
    ?? null;
  return {
    effectiveDate,
    migrationTarget: migration,
    raw: deprecationBody.match(/transitioning to Antigravity[\s\S]{0,300}/i)?.[0]?.trim()
      ?? deprecationBody.slice(0, 400).trim(),
  };
}

// ---------------------------------------------------------------------------
// 数据治理
// ---------------------------------------------------------------------------

/** 抽取"Gemini 不使用 prompts/responses 作训练"声明。 */
export function extractTrainingUse(dataGovBody: string): string | null {
  return dataGovBody.match(/Gemini doesn't use your prompts or its responses as data to train its models/i)?.[0]?.trim() ?? null;
}

/** 抽取"stateless 不存储 prompts/responses"声明。 */
export function extractStateless(dataGovBody: string): string | null {
  return dataGovBody.match(/stateless Google Cloud services[^.\n]*\./i)?.[0]?.trim() ?? null;
}

// ---------------------------------------------------------------------------
// 发布说明
// ---------------------------------------------------------------------------

/** 抽取首月抵扣金 2026-08-20 取消声明。 */
export function extractFirstMonthCreditCancellation(releaseNotesBody: string): {
  date: string | null;
  raw: string;
} {
  const date = releaseNotesBody.match(/2026-08-20/);
  const cancellation = releaseNotesBody.match(/first[- ]month[^.\n]*?credit[^.\n]*?(?:discontinued|cancel|no longer)/i)?.[0]?.trim();
  return {
    date: date ? "2026-08-20" : null,
    raw: cancellation ?? "",
  };
}

// ---------------------------------------------------------------------------
// 公共
// ---------------------------------------------------------------------------

/** 抽取页面自述更新时间（"Last updated YYYY-MM-DD"）。 */
export function extractStatedDate(body: string): string | null {
  const m = body.match(/Last updated[^\n]*?(\d{4})-(\d{2})-(\d{2})/i);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // 兼容 "Last updated 2026-06-11 UTC" 形式
  const alt = body.match(/Last updated[^\n]*?(\d{4})-(\d{2})-(\d{2}) UTC/i);
  return alt ? `${alt[1]}-${alt[2]}-${alt[3]}` : null;
}

// ---------------------------------------------------------------------------
// 汇总
// ---------------------------------------------------------------------------

export interface ExtractedFacts {
  hourlyRates: ReturnType<typeof extractHourlyRates>;
  monthlyRates: ReturnType<typeof extractMonthlyRates>;
  dailyQuotas: ReturnType<typeof extractDailyQuotas>;
  rps: number | null;
  contextWindow: ReturnType<typeof extractContextWindow>;
  customizationRepos: number | null;
  globalServing: ReturnType<typeof extractGlobalServing>;
  minLicenses: number | null;
  registration: ReturnType<typeof extractRegistrationRequirements>;
  freeTrial: ReturnType<typeof extractFreeTrial>;
  deprecation: ReturnType<typeof extractIndividualsDeprecation>;
  trainingUse: string | null;
  stateless: string | null;
  firstMonthCreditCancellation: ReturnType<typeof extractFirstMonthCreditCancellation>;
  /** 抽出时实际使用的各链首位非空 body 对应的 source_id（用于字段层 source_ids 透传）。 */
  sources: {
    pricing: string | null;
    business: string | null;
    quotas: string | null;
    locations: string | null;
    setup: string | null;
    deprecation: string | null;
    dataGov: string | null;
    releaseNotes: string | null;
  };
}

export function extractFacts(
  snapshots: RawSnapshot[],
  chains: {
    pricing: { source_ids: string[] };
    business: { source_ids: string[] };
    quotas: { source_ids: string[] };
    locations: { source_ids: string[] };
    setup: { source_ids: string[] };
    deprecation: { source_ids: string[] };
    dataGov: { source_ids: string[] };
    releaseNotes: { source_ids: string[] };
  },
): ExtractedFacts {
  const pricingBody = pickBodyByChain(snapshots, chains.pricing);
  const businessBody = pickBodyByChain(snapshots, chains.business);
  const quotasBody = pickBodyByChain(snapshots, chains.quotas);
  const locationsBody = pickBodyByChain(snapshots, chains.locations);
  const setupBody = pickBodyByChain(snapshots, chains.setup);
  const deprecationBody = pickBodyByChain(snapshots, chains.deprecation);
  const dataGovBody = pickBodyByChain(snapshots, chains.dataGov);
  const releaseNotesBody = pickBodyByChain(snapshots, chains.releaseNotes);

  const firstId = (chain: { source_ids: string[] }) => {
    for (const id of chain.source_ids) {
      if (bodyOf(snapshots, id).length > 0) return id;
    }
    return null;
  };

  return {
    hourlyRates: extractHourlyRates(pricingBody),
    monthlyRates: extractMonthlyRates(businessBody),
    dailyQuotas: extractDailyQuotas(quotasBody),
    rps: extractRps(quotasBody),
    contextWindow: extractContextWindow(quotasBody, businessBody),
    customizationRepos: extractCustomizationRepos(quotasBody),
    globalServing: extractGlobalServing(locationsBody),
    minLicenses: extractMinLicenses(setupBody),
    registration: extractRegistrationRequirements(setupBody),
    freeTrial: extractFreeTrial(businessBody),
    deprecation: extractIndividualsDeprecation(deprecationBody),
    trainingUse: extractTrainingUse(dataGovBody),
    stateless: extractStateless(dataGovBody),
    firstMonthCreditCancellation: extractFirstMonthCreditCancellation(releaseNotesBody),
    sources: {
      pricing: firstId(chains.pricing),
      business: firstId(chains.business),
      quotas: firstId(chains.quotas),
      locations: firstId(chains.locations),
      setup: firstId(chains.setup),
      deprecation: firstId(chains.deprecation),
      dataGov: firstId(chains.dataGov),
      releaseNotes: firstId(chains.releaseNotes),
    },
  };
}

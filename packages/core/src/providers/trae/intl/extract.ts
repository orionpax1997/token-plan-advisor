import type { RawSnapshot } from "../load.ts";

/**
 * Trae 国际站确定性抽取：从 docs.trae.ai 帮助文档、博客与隐私政策抽取
 * 价格、额度、模型、地区等事实。每个抽取结果保留命中的官方原文（raw），
 * 保证可追溯；抽取不到返回 null，由归一化层降级为 Unresolved Fact 而非猜测。
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

const PLAN_LABELS = ["Free", "Lite", "Pro", "Pro+", "Ultra"] as const;
type PlanLabel = (typeof PLAN_LABELS)[number];

/**
 * 抽取国际版五档价格（连续包月 Recurring monthly / 单月 Single month / 年付 Annual）。
 * 表格行示例（research/04 §2.1）：
 * | Free | $0 | - | - | - |
 * | Pro | $10 | $15 | $90 | $20 |
 */
export function extractIntlPricing(plansBody: string): {
  recurringMonthly: Record<PlanLabel, number | null>;
  singleMonth: Record<PlanLabel, number | null>;
  annual: Record<PlanLabel, number | null>;
  raw: string;
} {
  const recurringMonthly: Record<PlanLabel, number | null> = {
    Free: 0, Lite: null, Pro: null, "Pro+": null, Ultra: null,
  };
  const singleMonth: Record<PlanLabel, number | null> = {
    Free: null, Lite: null, Pro: null, "Pro+": null, Ultra: null,
  };
  const annual: Record<PlanLabel, number | null> = {
    Free: null, Lite: null, Pro: null, "Pro+": null, Ultra: null,
  };
  let raw = "";

  for (const label of PLAN_LABELS) {
    if (label === "Free") {
      // Free 档无单月/年付价；recurring=0 在前面已初始化
      const m = plansBody.match(new RegExp(`^\\|\\s*${label}\\s*\\|\\s*\\$([\\d.]+|0)\\s*\\|`, "m"));
      if (m) raw = raw ? `${raw}\n${m[0].trim()}` : m[0].trim();
      continue;
    }
    // 行格式：| Lite | $3 | $4.5 | $27 (average $2.25/month) | $5 | ...
    // 年付列可能含括号注释（如 "$27 (average $2.25/month)"）；用 [^\n|]+ 容忍注释
    const labelEscaped = label.replace("+", "\\+");
    const re = new RegExp(
      `^\\|\\s*${labelEscaped}\\s*\\|\\s*\\$([\\d.]+)\\s*\\|\\s*\\$([\\d.]+)\\s*\\|\\s*\\$([\\d.]+)[^\\n|]*\\|`,
      "m",
    );
    const m = plansBody.match(re);
    if (!m) continue;
    const recurring = Number(m[1]);
    const single = Number(m[2]);
    const annualVal = Number(m[3]);
    if (!Number.isFinite(recurring) || !Number.isFinite(single) || !Number.isFinite(annualVal)) continue;
    recurringMonthly[label] = recurring;
    singleMonth[label] = single;
    annual[label] = annualVal;
    raw = raw ? `${raw}\n${m[0].trim()}` : m[0].trim();
  }
  return { recurringMonthly, singleMonth, annual, raw };
}

/**
 * 抽取 Basic Usage 美元等值额度（research/04 §2.1）。
 * 行示例：| Basic Usage/month | $3 | $5 | $20 | $90 | $400 |
 */
export function extractBasicUsage(plansBody: string): {
  perTier: Record<PlanLabel, number | null>;
  raw: string;
} {
  const perTier: Record<PlanLabel, number | null> = {
    Free: 3, Lite: 5, Pro: 20, "Pro+": 90, Ultra: 400,
  };
  let raw = "";
  // Basic Usage/month 列在第 5 列（Plan/Recurring/Single/Annual/Basic）；允许 Annual 单元格含括号注释
  const m = plansBody.match(/Basic Usage[^\n]*\$([\d.]+)[^\n]*\$([\d.]+)[^\n]*\$([\d.]+)[^\n]*\$([\d.]+)[^\n]*\$([\d.]+)/);
  if (m) {
    perTier.Free = 3; // 已知 Free Basic Usage=$3（独立行）
    perTier.Lite = Number(m[1]);
    perTier.Pro = Number(m[2]);
    perTier["Pro+"] = Number(m[3]);
    perTier.Ultra = Number(m[4]);
    raw = m[0].trim();
  }
  return { perTier, raw };
}

/**
 * 抽取 Concurrent Cloud Tasks 数值（Free/Lite/Pro/Pro+/Ultra）。
 * 行示例：| Ultra | $100 | $150 | $900 (average $75/month) | $400 | Unlimited | 20 | Fast queue | ✅ | ✅ |
 * 逐 plan 行匹配，避免跨行表头与数据行混淆问题。
 */
export function extractConcurrentTasks(plansBody: string): {
  perTier: Record<PlanLabel, number | null>;
  raw: string;
} {
  const perTier: Record<PlanLabel, number | null> = {
    Free: null, Lite: null, Pro: null, "Pro+": null, Ultra: null,
  };
  let raw = "";
  for (const label of PLAN_LABELS) {
    const labelEscaped = label.replace("+", "\\+");
    // 行格式：| <label> | <... 5 列> | <concurrent> | <queue> | <solo> | <early> |
    // Concurrent 是第 7 列；在 <label> 之后跳 5 个单元格后捕获
    const re = new RegExp(
      `^\\|\\s*${labelEscaped}\\s*\\|(?:[^|\\n]*\\|){5}\\s*(\\d+)\\s*\\|`,
      "m",
    );
    const m = plansBody.match(re);
    if (m) {
      const v = Number(m[1]);
      if (Number.isFinite(v)) {
        perTier[label] = v;
        raw = raw ? `${raw}\n${m[0].trim()}` : m[0].trim();
      }
    }
  }
  return { perTier, raw };
}

/**
 * 抽取 Autocompletion 限额（Free 5,000/月；Lite-Ultra Unlimited）。
 */
export function extractAutocompletion(plansBody: string): {
  freeLimit: string | null;
  paidUnlimited: string | null;
  raw: string;
} {
  const freeLimit = plansBody.match(/Autocompletion[^\n]*Free\s*[\s\S]{0,200}?(?:5,000|5000)/)?.[0]?.trim() ?? null;
  // 替代策略：抓 "5,000 times/month" 与 "Unlimited" 配对
  const freeAlt = plansBody.match(/Free[^\n]*\n[^\n]*5,000[^\n]*times\/month/)?.[0]?.trim() ?? null;
  const paid = plansBody.match(/Lite[\s\S]{0,200}?Unlimited/)?.[0]?.trim() ?? null;
  return {
    freeLimit: freeLimit ?? freeAlt,
    paidUnlimited: paid,
    raw: [freeLimit ?? freeAlt, paid].filter(Boolean).join("\n"),
  };
}

/**
 * 抽取队列优先级（Free Standard queue；Lite-Ultra Fast queue）。
 */
export function extractQueuePriority(plansBody: string): {
  perTier: Record<PlanLabel, "standard" | "fast" | null>;
  raw: string;
} {
  const perTier: Record<PlanLabel, "standard" | "fast" | null> = {
    Free: null, Lite: null, Pro: null, "Pro+": null, Ultra: null,
  };
  // Standard queue 行：仅 Free（表格行首匹配）
  const stdMatch = plansBody.match(/\|\s*Free\s*\|[^|]*\|\s*Standard\s*queue\s*\|/);
  if (stdMatch) perTier.Free = "standard";
  // Fast queue 行：Lite-Ultra 4 行（跨行匹配 "Fast queue" 出现）
  const fastSection = plansBody.match(/Fast queue\s*\|[^|\n]*(?:\|[❌✅]){2}/);
  // 简化：表头 Fast queue 出现即可推断 Lite/Pro/Pro+/Ultra 均为 Fast
  if (plansBody.includes("Fast queue")) {
    perTier.Lite = "fast";
    perTier.Pro = "fast";
    perTier["Pro+"] = "fast";
    perTier.Ultra = "fast";
  }
  return {
    perTier,
    raw: [stdMatch?.[0]?.trim(), fastSection?.[0]?.trim()].filter(Boolean).join("\n"),
  };
}

/**
 * 抽取上下文窗口口径（Regular 272K / Max 1M tokens）。
 */
export function extractContextWindow(blogBody: string): {
  regular: string | null;
  maxMode: string | null;
  raw: string;
} {
  const regular = blogBody.match(/Regular Mode:\s*up to ([\d,]+)\s*tokens/)?.[0]?.trim() ?? null;
  const maxMode = blogBody.match(/Max Mode:\s*up to ([\d,]+)\s*tokens/)?.[0]?.trim() ?? null;
  return {
    regular,
    maxMode,
    raw: [regular, maxMode].filter(Boolean).join("; "),
  };
}

/**
 * 抽取 Pro Trial 时长（现行 7-day；与博客 14-day 对比用于 STALE_CONFLICT 候选）。
 */
export function extractProTrialDuration(plansBody: string, blogBody: string): {
  currentRaw: string | null;
  historicRaw: string | null;
} {
  const current = plansBody.match(/(\d+)-day\s*(?:free\s*)?trial/i)?.[0]?.trim() ?? null;
  const historic = blogBody.match(/(\d+)-day\s*(?:free\s*)?Pro\s*trial/i)?.[0]?.trim() ?? null;
  return { currentRaw: current, historicRaw: historic };
}

/**
 * 抽取 On-Demand 触发条件（"每累计 $3 结算一次"）。
 */
export function extractOnDemandTrigger(onDemandBody: string): {
  threshold: string | null;
  planAvailability: string | null;
  raw: string;
} {
  const threshold = onDemandBody.match(/accumulated amount reaches \$([\d.]+)[^\n]*\./)?.[0]?.trim() ?? null;
  const planAvailability = onDemandBody.match(/Lite\s+and\s+above[^\n]*\.?/i)?.[0]?.trim()
    ?? onDemandBody.match(/plans?\s+can\s+enable[^.\n]*\.?/i)?.[0]?.trim()
    ?? null;
  return {
    threshold,
    planAvailability,
    raw: [threshold, planAvailability].filter(Boolean).join(" "),
  };
}

/**
 * 抽取 Pro Trial 资格条件（信用卡限定 + 注册后 48 小时内领取）。
 */
export function extractProTrialEligibility(plansBody: string): {
  creditCardOnly: string | null;
  claimWindow: string | null;
  raw: string;
} {
  const creditCardOnly = plansBody.match(/free trial is available only to users who pay with a credit card[^.\n]*\.?/)?.[0]?.trim() ?? null;
  const claimWindow = plansBody.match(/claim Pro Trial within (\d+) hours after registration/)?.[0]?.trim() ?? null;
  return {
    creditCardOnly,
    claimWindow,
    raw: [creditCardOnly, claimWindow].filter(Boolean).join(" "),
  };
}

/**
 * 抽取地区排除清单（research/04 §5.1：41 国清单不含中国大陆/香港/澳门/台湾）。
 * 仅返回与"被排除"相关的官方原文，避免假装声明实际未排除的范围。
 */
export function extractRegionExclusion(countriesBody: string): {
  exclusionRaw: string;
  hasMainlandChina: boolean;
  hasHongKong: boolean;
  hasMacao: boolean;
  hasTaiwan: boolean;
} {
  // 提取 Asia 列表段（"## Asia" 到下一个 "##" 标题之间）
  const asiaSection = countriesBody.match(/##\s*Asia\s*([\s\S]*?)(?=\n##\s|\n*$)/)?.[1] ?? "";
  const cleaned = asiaSection.replace(/[\u4e00-\u9fa5]+/g, "").trim();
  // "Mainland China" 模式：China 不在 "China (SAR)" 上下文中（即 SAR 后缀）
  // 用 String 方法检测 SAR 上下文，避免复杂 regex 平衡
  const hasSarChinaContext = /China \(/.test(asiaSection);
  const mainlandChinaRegex = /\bChina\b/i;
  return {
    exclusionRaw: cleaned,
    hasMainlandChina: !hasSarChinaContext && mainlandChinaRegex.test(asiaSection),
    hasHongKong: /Hong Kong/i.test(asiaSection),
    hasMacao: /Macao/i.test(asiaSection),
    hasTaiwan: /Taiwan/i.test(asiaSection),
  };
}

/**
 * 抽取支持国家清单原文（用于地区维度 evidence_raw）。
 */
export function extractSupportedCountriesRaw(countriesBody: string): string {
  const m = countriesBody.match(/TRAE is currently available in the following countries and regions\.[\s\S]*?(?=\n##\s|\n*$)/);
  return m ? m[0].trim() : countriesBody.slice(0, 800).trim();
}

/**
 * 抽取支付服务地区清单（含港澳、不含大陆）。
 */
export function extractPaymentServiceRegions(plansBody: string): {
  hasMainlandChina: boolean;
  hasHongKong: boolean;
  hasMacao: string | null;
  raw: string;
} {
  const m = plansBody.match(/Supported countries\/regions[\s\S]{0,1000}?(?=\n##\s|\n*$)/i);
  const section = m?.[0] ?? "";
  return {
    hasMainlandChina: /Mainland China|\bChina\b(?!\s*\(SAR)/.test(section),
    hasHongKong: /Hong Kong SAR \(China\)/.test(section),
    hasMacao: section.match(/Macao SAR \(China\)/)?.[0] ?? null,
    raw: section.slice(0, 1000).trim(),
  };
}

/**
 * 抽取支付方式清单（global + local）。
 */
export function extractPaymentMethods(plansBody: string): string[] {
  const methods = new Set<string>();
  const section = plansBody.match(/Global payment methods[\s\S]{0,2000}/i)?.[0] ?? plansBody;
  for (const m of section.matchAll(/-\s*"([^"]+)"/g)) {
    methods.add(m[1]!.trim());
  }
  for (const m of section.matchAll(/-\s*([A-Z][A-Za-z0-9 ]+ Pay)/g)) {
    methods.add(m[1]!.trim());
  }
  return [...methods];
}

/**
 * 抽取美国屏蔽 GPT/MiniMax 系列模型声明（research/04 §2.1/§5.1）。
 */
export function extractUsModelRestriction(modelsBody: string): {
  restrictionRaw: string | null;
} {
  const m = modelsBody.match(/(?:The following )?[Aa]I models are not available to users in the United States:\s*([^\n.]+)\./);
  return {
    restrictionRaw: m ? m[0].trim() : null,
  };
}

/**
 * 抽取国际版内置模型清单（原文）；与 CN 版清单作边界区分。
 */
export function extractIntlModels(modelsBody: string): {
  models: { code: string; note: string }[];
  raw: string;
} {
  const models: { code: string; note: string }[] = [];
  let raw = "";
  // 行示例：| GPT-5.4 | ... |
  const re = /^\|\s*([A-Z][A-Za-z0-9.\-]+(?:-\w+)?(?:\s*Preview)?)\s*\|\s*([^|\n]+)\|/gm;
  for (const m of modelsBody.matchAll(re)) {
    const code = m[1]!.trim();
    // 过滤表头与分隔符
    if (code === "Model" || code === "---") continue;
    const note = (m[2] ?? "").trim();
    models.push({ code, note });
    raw = raw ? `${raw}\n${m[0].trim()}` : m[0].trim();
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

/**
 * 抽取隐私模式（TraeWork 文档，国际站 IDE privacy-mode 渲染失败）。
 */
export function extractPrivacyMode(privacyBody: string): {
  raw: string;
  privacyMode: string | null;
  codebaseException: string | null;
  usTraining: string | null;
} {
  const privacyMode = privacyBody.match(/Privacy mode is enabled[^.\n]*\.?/)?.[0]?.trim()
    ?? privacyBody.match(/will not use[^.\n]*chat interactions[^.\n]*\.?/i)?.[0]?.trim()
    ?? null;
  const codebaseException = privacyBody.match(/will not use your codebase files[^.\n]*\.?/i)?.[0]?.trim() ?? null;
  const usTraining = privacyBody.match(/temporarily upload your codebase[^.\n]*\.?/i)?.[0]?.trim() ?? null;
  return {
    privacyMode,
    codebaseException,
    usTraining,
    raw: [privacyMode, codebaseException, usTraining].filter(Boolean).join(" "),
  };
}

/**
 * 抽取 Legacy 计费的 fast/slow requests 折算（"6 Fast Requests = $1 Dollar Usage"）。
 */
export function extractLegacyConversion(legacyBody: string): {
  rate: string | null;
  raw: string;
} {
  const m = legacyBody.match(/(\d+)\s*Fast\s*Requests?\s*=\s*\$\s*(\d+)\s*Dollar\s*Usage/);
  if (!m) return { rate: null, raw: "" };
  const rate = m[0].trim();
  return { rate, raw: rate };
}

/**
 * 抽取 Legacy 计费的月长度（"30 calendar days"）——现行 CN 为 31 个自然日，
 * 用于描述"每月=30 天"的历史口径。
 */
export function extractLegacyCalendarDays(legacyBody: string): string | null {
  return legacyBody.match(/Each month is calculated as (\d+)\s*calendar days/)?.[0]?.trim() ?? null;
}

/**
 * 抽取页脚联系邮箱——trae.ai/pricing 客户端渲染失败时唯一可读内容。
 */
export function extractSupportEmail(pricingBody: string): string | null {
  return pricingBody.match(/ussupport@mail\.traeai\.us/)?.[0] ?? null;
}

/** 抽取页面自述更新时间（docs 站不显示页面级时间戳，统一返回 null）。 */
export function extractStatedDate(body: string): string | null {
  const m = body.match(/(?:Last updated|Published)[: ]+(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1]!;
  const english = body.match(/(?:Last updated|Published) ([A-Za-z]+ \d{1,2}, \d{4})/);
  if (english) return normalizeEnglishDate(english[1]!);
  return null;
}

/** "February 13, 2026" → "2026-02-13"。 */
export function normalizeEnglishDate(text: string): string | null {
  const m = text.match(/([A-Za-z]+) (\d{1,2}), (\d{4})/);
  if (!m) return null;
  const months: Record<string, string> = {
    January: "01", February: "02", March: "03", April: "04", May: "05", June: "06",
    July: "07", August: "08", September: "09", October: "10", November: "11", December: "12",
  };
  const month = months[m[1]!];
  if (!month) return null;
  return `${m[3]}-${month}-${m[2]!.padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// 汇总
// ---------------------------------------------------------------------------

export interface ExtractedFacts {
  pricing: ReturnType<typeof extractIntlPricing>;
  basicUsage: ReturnType<typeof extractBasicUsage>;
  concurrentTasks: ReturnType<typeof extractConcurrentTasks>;
  autocompletion: ReturnType<typeof extractAutocompletion>;
  queuePriority: ReturnType<typeof extractQueuePriority>;
  contextWindow: ReturnType<typeof extractContextWindow>;
  proTrial: ReturnType<typeof extractProTrialDuration>;
  proTrialEligibility: ReturnType<typeof extractProTrialEligibility>;
  onDemand: ReturnType<typeof extractOnDemandTrigger>;
  regionExclusion: ReturnType<typeof extractRegionExclusion>;
  supportedCountriesRaw: string;
  paymentRegions: ReturnType<typeof extractPaymentServiceRegions>;
  paymentMethods: string[];
  usModelRestriction: ReturnType<typeof extractUsModelRestriction>;
  models: ReturnType<typeof extractIntlModels>;
  privacyMode: ReturnType<typeof extractPrivacyMode>;
  legacyConversion: ReturnType<typeof extractLegacyConversion>;
  legacyCalendarDays: string | null;
  supportEmail: string | null;
  /** 抽出时实际使用的各链首位非空 body 对应的 source_id（用于字段层 source_ids 透传）。 */
  sources: {
    pricing: string | null;
    plans: string | null;
    faq: string | null;
    onDemand: string | null;
    countries: string | null;
    models: string | null;
    blog: string | null;
    privacy: string | null;
    legacy: string | null;
  };
}

export function extractFacts(
  snapshots: RawSnapshot[],
  chains: {
    pricing: { source_ids: string[] };
    plans: { source_ids: string[] };
    faq: { source_ids: string[] };
    onDemand: { source_ids: string[] };
    countries: { source_ids: string[] };
    models: { source_ids: string[] };
    blog: { source_ids: string[] };
    privacy: { source_ids: string[] };
    legacy: { source_ids: string[] };
  },
): ExtractedFacts {
  const pricingBody = pickBodyByChain(snapshots, chains.pricing);
  const plansBody = pickBodyByChain(snapshots, chains.plans);
  const faqBody = pickBodyByChain(snapshots, chains.faq);
  const onDemandBody = pickBodyByChain(snapshots, chains.onDemand);
  const countriesBody = pickBodyByChain(snapshots, chains.countries);
  const modelsBody = pickBodyByChain(snapshots, chains.models);
  const blogBody = pickBodyByChain(snapshots, chains.blog);
  const privacyBody = pickBodyByChain(snapshots, chains.privacy);
  const legacyBody = pickBodyByChain(snapshots, chains.legacy);

  const firstId = (chain: { source_ids: string[] }) => {
    for (const id of chain.source_ids) {
      if (bodyOf(snapshots, id).length > 0) return id;
    }
    return null;
  };

  return {
    pricing: extractIntlPricing(plansBody),
    basicUsage: extractBasicUsage(plansBody),
    concurrentTasks: extractConcurrentTasks(plansBody),
    autocompletion: extractAutocompletion(plansBody),
    queuePriority: extractQueuePriority(plansBody),
    contextWindow: extractContextWindow(blogBody),
    proTrial: extractProTrialDuration(plansBody, blogBody),
    proTrialEligibility: extractProTrialEligibility(plansBody),
    onDemand: extractOnDemandTrigger(onDemandBody),
    regionExclusion: extractRegionExclusion(countriesBody),
    supportedCountriesRaw: extractSupportedCountriesRaw(countriesBody),
    paymentRegions: extractPaymentServiceRegions(plansBody),
    paymentMethods: extractPaymentMethods(plansBody),
    usModelRestriction: extractUsModelRestriction(modelsBody),
    models: extractIntlModels(modelsBody),
    privacyMode: extractPrivacyMode(privacyBody),
    legacyConversion: extractLegacyConversion(legacyBody),
    legacyCalendarDays: extractLegacyCalendarDays(legacyBody),
    supportEmail: extractSupportEmail(pricingBody),
    sources: {
      pricing: firstId(chains.pricing),
      plans: firstId(chains.plans),
      faq: firstId(chains.faq),
      onDemand: firstId(chains.onDemand),
      countries: firstId(chains.countries),
      models: firstId(chains.models),
      blog: firstId(chains.blog),
      privacy: firstId(chains.privacy),
      legacy: firstId(chains.legacy),
    },
  };
}

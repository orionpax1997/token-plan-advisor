import type { RawSnapshot } from "../../_shared.ts";

/**
 * TRAE 中国站确定性抽取。从 docs.trae.cn 帮助文档（.md 直链）抽取
 * 价格、积分、模型、设备等事实。每个抽取结果保留命中的官方原文（raw），
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

const PLAN_LABELS = ["会员 Lite", "会员 Pro", "会员 Pro+", "会员 Ultra"] as const;
type PlanLabel = (typeof PLAN_LABELS)[number];

/**
 * 抽取 CN 四档价格（单月价/连续包月价）。
 * 表格行示例（research/04 §2.2）：
 * | 会员 Lite | ¥49 | ¥45 | ... |
 * | 会员 Pro | ¥99 | ¥89 | ... |
 */
export function extractCnPricing(plansBody: string): {
  singleMonth: Record<PlanLabel, number | null>;
  recurringMonthly: Record<PlanLabel, number | null>;
  raw: string;
} {
  const singleMonth: Record<PlanLabel, number | null> = {
    "会员 Lite": null, "会员 Pro": null, "会员 Pro+": null, "会员 Ultra": null,
  };
  const recurringMonthly: Record<PlanLabel, number | null> = {
    "会员 Lite": null, "会员 Pro": null, "会员 Pro+": null, "会员 Ultra": null,
  };
  let raw = "";

  for (const label of PLAN_LABELS) {
    const labelEscaped = label.replace(/[+]/g, "\\+");
    const re = new RegExp(
      `^\\|\\s*${labelEscaped}\\s*\\|\\s*¥([\\d.]+)\\s*\\|\\s*¥([\\d.]+)\\s*\\|`,
      "m",
    );
    const m = plansBody.match(re);
    if (!m) continue;
    const single = Number(m[1]);
    const recurring = Number(m[2]);
    if (!Number.isFinite(single) || !Number.isFinite(recurring)) continue;
    singleMonth[label] = single;
    recurringMonthly[label] = recurring;
    raw = raw ? `${raw}\n${m[0].trim()}` : m[0].trim();
  }
  return { singleMonth, recurringMonthly, raw };
}

/**
 * 抽取积分池（Work 专属积分 / 通用积分）。
 * 行示例：| 会员 Lite | 2000 Work 专属积分 | ... |
 */
export function extractCredits(plansBody: string): {
  perTier: Record<PlanLabel, { workOnly: number | null; general: number | null }>;
  raw: string;
} {
  const perTier: Record<PlanLabel, { workOnly: number | null; general: number | null }> = {
    "会员 Lite": { workOnly: null, general: null },
    "会员 Pro": { workOnly: null, general: null },
    "会员 Pro+": { workOnly: null, general: null },
    "会员 Ultra": { workOnly: null, general: null },
  };
  let raw = "";
  for (const label of PLAN_LABELS) {
    const labelEscaped = label.replace(/[+]/g, "\\+");
    // Lite：2000 Work 专属积分（在表格第 5 列）
    // 表格列顺序：套餐 | 单月价格 | 连续包月 | 适用产品 | 通用积分/月 | ...
    const liteRe = new RegExp(
      `^\\|\\s*${labelEscaped}\\s*\\|[^\\n|]*\\|[^\\n|]*\\|[^\\n|]*\\|\\s*([\\d,]+)\\s*Work\\s*专属积分\\s*\\|`,
      "m",
    );
    const liteM = plansBody.match(liteRe);
    // Pro/Pro+/Ultra：4000/12000/40000 通用积分
    const generalRe = new RegExp(
      `^\\|\\s*${labelEscaped}\\s*\\|[^\\n|]*\\|[^\\n|]*\\|[^\\n|]*\\|\\s*([\\d,]+)\\s*通用积分\\s*\\|`,
      "m",
    );
    const generalM = plansBody.match(generalRe);

    if (label === "会员 Lite" && liteM) {
      const num = Number(liteM[1]!.replace(/,/g, ""));
      if (Number.isFinite(num)) {
        perTier[label].workOnly = num;
        raw = raw ? `${raw}\n${liteM[0].trim()}` : liteM[0].trim();
      }
    } else if (generalM) {
      const num = Number(generalM[1]!.replace(/,/g, ""));
      if (Number.isFinite(num)) {
        perTier[label].general = num;
        raw = raw ? `${raw}\n${generalM[0].trim()}` : generalM[0].trim();
      }
    }
  }
  return { perTier, raw };
}

/**
 * 抽取并发云任务上限。
 * 行示例：| 云端任务并行数量上限 | 2 个 | 10 个 | 10 个 | 20 个 |
 */
export function extractConcurrentTasks(plansBody: string): {
  perTier: Record<PlanLabel, number | null>;
  raw: string;
} {
  const perTier: Record<PlanLabel, number | null> = {
    "会员 Lite": null, "会员 Pro": null, "会员 Pro+": null, "会员 Ultra": null,
  };
  let raw = "";
  // 云端任务并行数量上限列在第 6 列；逐行匹配（表头与数据行分行）
  // 表格行格式："| 会员 Lite | ¥49 | ¥45 | 仅 TraeWork | 2000 Work 专属积分 | 2 个 | ✅ | ❌ |"
  // 用逐 plan 行匹配以避免跨行问题
  for (const label of PLAN_LABELS) {
    const labelEscaped = label.replace(/[+]/g, "\\+");
    // 5 个分隔列后的 "<n> 个"（第 6 列）
    const re = new RegExp(
      `^\\|\\s*${labelEscaped}\\s*\\|[^|\\n]*\\|[^|\\n]*\\|[^|\\n]*\\|[^|\\n]*\\|\\s*(\\d+)\\s*个\\s*\\|`,
      "m",
    );
    const m = plansBody.match(re);
    if (m) {
      const num = Number(m[1]);
      if (Number.isFinite(num)) {
        perTier[label] = num;
        raw = raw ? `${raw}\n${m[0].trim()}` : m[0].trim();
      }
    }
  }
  return { perTier, raw };
}

/**
 * 抽取计费周期口径（"31 个自然日"）。
 */
export function extractBillingPeriod(plansBody: string): {
  periodDays: number | null;
  raw: string;
} {
  const m = plansBody.match(/(\d+)\s*个自然日/);
  if (!m) return { periodDays: null, raw: "" };
  const days = Number(m[1]);
  return {
    periodDays: Number.isFinite(days) ? days : null,
    raw: m[0].trim(),
  };
}

/**
 * 抽取首月优惠（Lite ¥29.9 / Pro ¥69，仅限付费新用户）。
 */
export function extractFirstMonthOffer(plansBody: string): {
  lite: number | null;
  pro: number | null;
  raw: string;
} {
  const lite = plansBody.match(/会员 Lite[^。\n]*?首月 ¥([\d.]+)/)?.[1] ?? null;
  const pro = plansBody.match(/会员 Pro[^。\n]*?首月 ¥([\d.]+)/)?.[1] ?? null;
  const liteNum = lite ? Number(lite) : null;
  const proNum = pro ? Number(pro) : null;
  return {
    lite: liteNum !== null && Number.isFinite(liteNum) ? liteNum : null,
    pro: proNum !== null && Number.isFinite(proNum) ? proNum : null,
    raw: [lite ? `会员 Lite 首月 ¥${lite}` : null, pro ? `会员 Pro 首月 ¥${pro}` : null]
      .filter(Boolean)
      .join("; "),
  };
}

/**
 * 抽取支付方式（抖音支付/支付宝/微信支付 + 微信连续包月不支持）。
 */
export function extractPaymentMethods(plansBody: string): string[] {
  const methods = new Set<string>();
  // 抖音支付
  if (/抖音支付/.test(plansBody)) methods.add("抖音支付");
  if (/支付宝/.test(plansBody)) methods.add("支付宝");
  if (/微信支付/.test(plansBody)) methods.add("微信支付（连续包月暂不支持）");
  return [...methods];
}

/**
 * 抽取增购积分价格（每 1000 积分 50 元）。
 */
export function extractAddOnCredits(plansBody: string): {
  perThousand: number | null;
  validityDays: number | null;
  raw: string;
} {
  const m = plansBody.match(/每\s*(\d+)\s*积分\s*(\d+)\s*元/);
  let perThousand: number | null = null;
  let validityDays: number | null = null;
  if (m) {
    // 形如 "每 1000 积分 50 元"
    const credits = Number(m[1]);
    const yuan = Number(m[2]);
    if (Number.isFinite(credits) && Number.isFinite(yuan) && credits === 1000) {
      perThousand = yuan;
    }
  }
  const validity = plansBody.match(/增购积分[^。\n]*?(\d+)\s*个自然日/);
  if (validity) {
    const d = Number(validity[1]);
    if (Number.isFinite(d)) validityDays = d;
  }
  return {
    perThousand,
    validityDays,
    raw: [m?.[0]?.trim(), validity?.[0]?.trim()].filter(Boolean).join("; "),
  };
}

/**
 * 抽取设备数量限制（"3 台"）。
 */
export function extractDeviceLimit(deviceLimitBody: string): {
  limit: number | null;
  raw: string;
} {
  const m = deviceLimitBody.match(/(\d+)\s*台设备/);
  if (!m) return { limit: null, raw: "" };
  const limit = Number(m[1]);
  return {
    limit: Number.isFinite(limit) ? limit : null,
    raw: m[0].trim(),
  };
}

/**
 * 抽取登录方式（手机号/抖音/苹果/掘金）。
 */
export function extractLoginMethods(quickstartBody: string): {
  methods: string[];
  raw: string;
} {
  const methods: string[] = [];
  if (/手机号/.test(quickstartBody)) methods.push("手机号");
  if (/抖音账号/.test(quickstartBody)) methods.push("抖音账号");
  if (/苹果账号/.test(quickstartBody)) methods.push("苹果账号");
  if (/稀土掘金/.test(quickstartBody)) methods.push("稀土掘金账号");
  const raw = quickstartBody.match(/使用[^。]*?登录[^。]*?。/)?.[0]?.trim() ?? "";
  return { methods, raw };
}

/**
 * 抽取内置模型清单 + 会员档位门控（research/04 §2.2）。
 */
export function extractCnModels(modelsBody: string): {
  models: { code: string; gate: string | null }[];
  raw: string;
} {
  const models: { code: string; gate: string | null }[] = [];
  let raw = "";
  // 形如：| Seed-Evolving | ... | 仅限会员 Pro、会员 Pro+、会员 Ultra 和会员 Express 用户使用 |
  const re = /^\|\s*([A-Z][A-Za-z0-9.\-]+(?:-\w+)?)\s*\|[^|]*\|\s*([^|\n]+)\|/gm;
  for (const m of modelsBody.matchAll(re)) {
    const code = m[1]!.trim();
    if (code === "模型" || code === "---") continue;
    const gate = (m[2] ?? "").trim();
    models.push({ code, gate });
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
 * 抽取 CN 隐私模式口径。
 */
export function extractCnPrivacyMode(privacyBody: string): {
  raw: string;
  privacyMode: string | null;
  codebaseException: string | null;
} {
  const privacyMode = privacyBody.match(/开启隐私模式后[^。]*?用于上述用途。/)?.[0]?.trim()
    ?? privacyBody.match(/不会将你的任何对话内容[^。]*?用于上述用途。/)?.[0]?.trim()
    ?? null;
  const codebaseException = privacyBody.match(/不会将你的代码库文件[^。]*?用于[^。]*?。/)?.[0]?.trim() ?? null;
  return {
    privacyMode,
    codebaseException,
    raw: [privacyMode, codebaseException].filter(Boolean).join(" "),
  };
}

/**
 * 抽取积分计费上线公告（"以积分为核心的计费模式正式上线"）。
 */
export function extractComingSoonAnnouncement(comingSoonBody: string): {
  effectiveFrom: string | null;
  raw: string;
} {
  // 公告正文常含日期；我们不强行解析日期，统一 raw 保留
  const m = comingSoonBody.match(/以积分为核心的计费模式正式上线[^\n]*\n([^\n]*)/);
  return {
    effectiveFrom: null,
    raw: m ? m[0].trim() : comingSoonBody.slice(0, 200).trim(),
  };
}

/**
 * 抽取页面自述更新时间（CN 文档页不显示页面级时间戳）。
 */
export function extractStatedDate(body: string): string | null {
  const m = body.match(/(?:Last updated|最近更新|更新时间)[:：]\s*(\d{4}-\d{2}-\d{2})/);
  return m ? m[1]! : null;
}

// ---------------------------------------------------------------------------
// 汇总
// ---------------------------------------------------------------------------

export interface ExtractedFacts {
  pricing: ReturnType<typeof extractCnPricing>;
  credits: ReturnType<typeof extractCredits>;
  concurrentTasks: ReturnType<typeof extractConcurrentTasks>;
  billingPeriod: ReturnType<typeof extractBillingPeriod>;
  firstMonthOffer: ReturnType<typeof extractFirstMonthOffer>;
  paymentMethods: string[];
  addOnCredits: ReturnType<typeof extractAddOnCredits>;
  deviceLimit: ReturnType<typeof extractDeviceLimit>;
  loginMethods: ReturnType<typeof extractLoginMethods>;
  models: ReturnType<typeof extractCnModels>;
  privacyMode: ReturnType<typeof extractCnPrivacyMode>;
  comingSoon: ReturnType<typeof extractComingSoonAnnouncement>;
  /** 抽出时实际使用的各链首位非空 body 对应的 source_id（用于字段层 source_ids 透传）。 */
  sources: {
    pricing: string | null;
    plans: string | null;
    models: string | null;
    deviceLimit: string | null;
    privacy: string | null;
    quickstart: string | null;
    comingSoon: string | null;
  };
}

export function extractFacts(
  snapshots: RawSnapshot[],
  chains: {
    pricing: { source_ids: string[] };
    plans: { source_ids: string[] };
    models: { source_ids: string[] };
    deviceLimit: { source_ids: string[] };
    privacy: { source_ids: string[] };
    quickstart: { source_ids: string[] };
    comingSoon: { source_ids: string[] };
  },
): ExtractedFacts {
  const pricingBody = pickBodyByChain(snapshots, chains.pricing);
  const plansBody = pickBodyByChain(snapshots, chains.plans);
  const modelsBody = pickBodyByChain(snapshots, chains.models);
  const deviceLimitBody = pickBodyByChain(snapshots, chains.deviceLimit);
  const privacyBody = pickBodyByChain(snapshots, chains.privacy);
  const quickstartBody = pickBodyByChain(snapshots, chains.quickstart);
  const comingSoonBody = pickBodyByChain(snapshots, chains.comingSoon);

  const firstId = (chain: { source_ids: string[] }) => {
    for (const id of chain.source_ids) {
      if (bodyOf(snapshots, id).length > 0) return id;
    }
    return null;
  };

  return {
    pricing: extractCnPricing(plansBody),
    credits: extractCredits(plansBody),
    concurrentTasks: extractConcurrentTasks(plansBody),
    billingPeriod: extractBillingPeriod(plansBody),
    firstMonthOffer: extractFirstMonthOffer(plansBody),
    paymentMethods: extractPaymentMethods(plansBody),
    addOnCredits: extractAddOnCredits(plansBody),
    deviceLimit: extractDeviceLimit(deviceLimitBody),
    loginMethods: extractLoginMethods(quickstartBody),
    models: extractCnModels(modelsBody),
    privacyMode: extractCnPrivacyMode(privacyBody),
    comingSoon: extractComingSoonAnnouncement(comingSoonBody),
    sources: {
      pricing: firstId(chains.pricing),
      plans: firstId(chains.plans),
      models: firstId(chains.models),
      deviceLimit: firstId(chains.deviceLimit),
      privacy: firstId(chains.privacy),
      quickstart: firstId(chains.quickstart),
      comingSoon: firstId(chains.comingSoon),
    },
  };
}

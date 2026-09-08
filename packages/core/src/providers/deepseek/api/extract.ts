import type { RawSnapshot } from "../../_shared.ts";
import { pickBodyByChain } from "../../extract-shared.ts";

/**
 * DeepSeek API 确定性抽取：从 pricing / rate_limit / 法律条款 / 公告原文抽取
 * 价格、并发、模型版本、训练用途等事实。每个抽取结果保留命中的官方原文（raw），
 * 保证可追溯；抽取不到返回 null，由归一化层降级为 Unresolved Fact 而非猜测。
 *
 * 定价表 Markdown 形状（按列读取三个模型 × 通道 × 时段）：
 * | 价格分类 | 通道 | 时段 | flash | pro | vision-exp |
 * 表格列序号（split("|") 后）：通道段为 cells[2]，时段为 cells[3]，
 * flash 价为 cells[4]，pro 价为 cells[5]，vision 价为 cells[6]。
 * 峰谷两行的「价格分类」列在峰行为空，但 flash/pro/vision 的列序号不变。
 */

/** 单个 (channel × period) 价格单元；按模型 × 通道 × 时段三轴归一。 */
export interface ExtractedPriceCell {
  /** "input_cached" | "input_uncached" | "output"。 */
  channel: "input_cached" | "input_uncached" | "output";
  /** "peak" | "off_peak"。 */
  period: "peak" | "off_peak";
  amount: number;
  /** 命中的官方原文（用于 raw 字段）。 */
  raw: string;
}

export interface ExtractedModelPricing {
  model_code: string;
  /** 表格中的"模型版本"列，如 DeepSeek-V4-Flash-0731。 */
  model_version: string | null;
  /** 上下文长度（tokens）。 */
  context_tokens: number | null;
  /** 最大输出长度（tokens）。 */
  output_tokens: number | null;
  /** 账号级并发上限（per account）。 */
  concurrency_limit: number | null;
  /** 价格单元（每百万 tokens 单价，币种在 normalize 层补充）。 */
  cells: ExtractedPriceCell[];
  /** 表格中各 cell 命中的整行原文（用于 raw 字段）。 */
  raw: string;
}

/**
 * 抓取每个 (channel × period) 行的三模型价格；
 * cells[4] / cells[5] / cells[6] 在 off-peak / peak 两行结构下保持稳定。
 * 注意:Markdown 中峰谷两行是「rowspan」形态, peak 行的「价格分类」与「通道」列为空,
 * 需要带跨行状态(当前通道)扫描才能定位 peak 行。
 */
function extractPriceRow(
  body: string,
  channel: ExtractedPriceCell["channel"],
  raw: string[],
): { channel: ExtractedPriceCell["channel"]; period: ExtractedPriceCell["period"]; amounts: { flash: number | null; pro: number | null; vision: number | null }; row: string }[] {
  const tableBlock =
    body.match(/\|\s*模型[\s\S]*?(?=\n##\s|\s*$)/)?.[0] ?? "";
  const targets: { channel: ExtractedPriceCell["channel"]; period: ExtractedPriceCell["period"]; row: string; amounts: { flash: number | null; pro: number | null; vision: number | null } }[] = [];

  // 按物理行扫描;记录「当前通道」(Markdown rowspan):遇到通道标签行则更新 currentChannel
  let currentChannel: ExtractedPriceCell["channel"] | null = null;
  for (const line of tableBlock.split(/\n/)) {
    if (!line.includes("|")) continue;
    if (line.includes("百万tokens输入 （缓存命中）")) {
      currentChannel = "input_cached";
    } else if (line.includes("百万tokens输入 （缓存未命中）")) {
      currentChannel = "input_uncached";
    } else if (line.includes("百万tokens输出")) {
      currentChannel = "output";
    }
    if (!line.includes("空闲时段") && !line.includes("高峰时段")) continue;
    if (!currentChannel) continue;

    const period: ExtractedPriceCell["period"] = line.includes("高峰时段") ? "peak" : "off_peak";
    const cells = line.split("|").map((c) => c.trim());
    const flashCell = cells[4];
    const proCell = cells[5];
    const visionCell = cells[6];
    const num = (s: string | undefined) => {
      if (!s) return null;
      const n = Number(s.replace("元", "").trim());
      return Number.isFinite(n) ? n : null;
    };
    const row = line.trim();
    raw.push(row);
    targets.push({
      channel: currentChannel,
      period,
      amounts: { flash: num(flashCell), pro: num(proCell), vision: num(visionCell) },
      row,
    });
  }

  return targets.filter((t) => t.channel === channel);
}

const CHANNEL_LABELS: { label: string; key: ExtractedPriceCell["channel"] }[] = [
  { label: "百万tokens输入 （缓存命中）", key: "input_cached" },
  { label: "百万tokens输入 （缓存未命中）", key: "input_uncached" },
  { label: "百万tokens输出", key: "output" },
];

// PERIOD 字段由 extractPriceRow 在扫描每行时根据「是否含 高峰时段 / 空闲时段」派生。
// 这里不再保留 PERIOD_LABELS 常量——避免重复定义、单一实现。

/** 抽取定价表（per-model × cache hit/miss × peak/off-peak × input/output）。 */
export function extractModelPricing(pricingBody: string): ExtractedModelPricing[] {
  const models = [
    { model_code: "deepseek-v4-flash", tableVersion: "DeepSeek-V4-Flash-0731" },
    { model_code: "deepseek-v4-pro", tableVersion: "DeepSeek-V4-Pro-0813" },
    { model_code: "deepseek-v4-flash-vision-exp", tableVersion: "DeepSeek-V4-Flash-Vision-Exp" },
  ] as const;

  // 按通道扫描价格行（peak / off_peak 两行一并处理）
  const cellByModel: Record<string, ExtractedPriceCell[]> = {
    "deepseek-v4-flash": [],
    "deepseek-v4-pro": [],
    "deepseek-v4-flash-vision-exp": [],
  };
  const rowRaws: string[] = [];
  for (const c of CHANNEL_LABELS) {
    const rows = extractPriceRow(pricingBody, c.key, rowRaws);
    for (const row of rows) {
      const push = (model: string, amount: number | null, raw: string) => {
        if (amount === null) return;
        cellByModel[model]!.push({
          channel: row.channel,
          period: row.period,
          amount,
          raw,
        });
      };
      push("deepseek-v4-flash", row.amounts.flash, row.row);
      push("deepseek-v4-pro", row.amounts.pro, row.row);
      push("deepseek-v4-flash-vision-exp", row.amounts.vision, row.row);
    }
  }

  const tableBlock = pricingBody.match(/\|\s*模型[\s\S]*?(?=\n##\s|\s*$)/)?.[0] ?? "";

  return models.map((m) => {
    // 模型版本所在行（含 tableVersion 字符串）
    const versionLine =
      tableBlock
        .split(/\n/)
        .find((l) => l.includes(m.tableVersion) && l.includes("|")) ?? "";
    const versionRaw = versionLine.trim() || m.tableVersion;

    // 上下文与输出长度（三个模型均相同）
    const contextTokens = /1M/.test(tableBlock) ? 1_000_000 : null;
    const outputTokens = /384K/.test(tableBlock) ? 384_000 : null;

    // 并发限制：定价页表格中 `| 并发限制 | | | 2500 | 500 | 2500 |`
    // split("|") 后列序号为 0=前导空 / 1=标签 / 2-3=空 / 4=flash / 5=pro / 6=vision / 7=尾部空
    let concurrency: number | null = null;
    const concurrencyRow = pricingBody.match(/\|\s*并发限制[\s\S]*?\n/)?.[0] ?? "";
    if (concurrencyRow) {
      const cells = concurrencyRow.split("|").map((c) => c.trim());
      const colIndex =
        m.model_code === "deepseek-v4-flash" ? 4
        : m.model_code === "deepseek-v4-pro" ? 5
        : 6;
      const val = cells[colIndex];
      if (val) {
        const n = Number(val.replace(/[,\s]/g, ""));
        if (Number.isFinite(n)) concurrency = n;
      }
    }

    return {
      model_code: m.model_code,
      model_version: versionRaw,
      context_tokens: contextTokens,
      output_tokens: outputTokens,
      concurrency_limit: concurrency,
      cells: cellByModel[m.model_code]!,
      raw: rowRaws.join("\n"),
    };
  });
}

/** 抽取峰谷时段定义与周末政策。 */
export interface ExtractedPricingWindow {
  /** 高峰时段定义原文（北京时间）。 */
  peak_hours_raw: string | null;
  /** 空闲时段扣减系数（按官方"高峰时段价格的一半"换算 = 0.5）。 */
  off_peak_factor: number | null;
  /** 周末政策的生效起点（YYYY-MM-DD）。 */
  weekend_effective_from: string | null;
  /** 周末政策原文。 */
  weekend_raw: string | null;
}

const CN_DATE_RE = /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/;

function toIsoCnDate(text: string): string | null {
  const m = text.match(CN_DATE_RE);
  if (!m) return null;
  return `${m[1]}-${m[2]!.padStart(2, "0")}-${m[3]!.padStart(2, "0")}`;
}

export function extractPricingWindow(pricingBody: string): ExtractedPricingWindow {
  const peakSentence = pricingBody.match(/高峰时段为北京时间\s*([^。]+)/)?.[1]?.trim() ?? null;
  const offPeakSentence = pricingBody.match(/(空闲时段价格为高峰时段价格的一半)/)?.[1]?.trim() ?? null;
  const weekendMatch = pricingBody.match(
    /北京时间\s*((?:\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日))[^,，]*?(?:起|开始).*?周末.*?统一按照低谷时段价格/,
  );
  const weekendEffectiveFrom = weekendMatch ? toIsoCnDate(weekendMatch[1]!) : null;
  return {
    peak_hours_raw: peakSentence,
    off_peak_factor: offPeakSentence ? 0.5 : null,
    weekend_effective_from: weekendEffectiveFrom,
    weekend_raw: weekendMatch?.[0]?.trim() ?? null,
  };
}

/** 抽取扣费规则原文与余额扣减顺序。 */
export interface ExtractedBillingRule {
  formula_raw: string | null;
  /** "充值余额" 与 "赠送余额" 扣减顺序原文。 */
  balance_priority_raw: string | null;
}

export function extractBillingRule(pricingBody: string): ExtractedBillingRule {
  const formula = pricingBody.match(/扣减费用\s*=\s*token\s*消耗量\s*×\s*模型单价/)?.[0]?.trim() ?? null;
  const balancePriority = pricingBody.match(
    /当充值余额与赠送余额同时存在时，优先扣减\s*(赠送余额|充值余额)/,
  )?.[0]?.trim() ?? null;
  return { formula_raw: formula, balance_priority_raw: balancePriority };
}

/** 抽取限速页：账号级并发上限（per model）。 */
export interface ExtractedConcurrency {
  limits: { model_code: string; limit: number; raw: string }[];
  /** "一个请求从发出后，到模型响应完成之前记为一个并发" 等口径原文。 */
  granularity_raw: string | null;
}

export function extractConcurrency(rateLimitBody: string): ExtractedConcurrency {
  const limits: ExtractedConcurrency["limits"] = [];
  const row = rateLimitBody.match(/\|\s*并发限制[\s\S]*?\n/)?.[0] ?? "";
  if (row) {
    const cells = row.split("|").map((c) => c.trim());
    const proVal = cells[3];
    const flashVal = cells[4];
    const pushIfNum = (model_code: string, val: string | undefined, raw: string) => {
      if (!val) return;
      const n = Number(val.replace(/[,\s]/g, ""));
      if (Number.isFinite(n)) limits.push({ model_code, limit: n, raw });
    };
    pushIfNum("deepseek-v4-pro", proVal, row.trim());
    pushIfNum("deepseek-v4-flash", flashVal, row.trim());
  }
  const granularity = rateLimitBody.match(
    /一个请求从发出后，到模型响应完成之前记为一个并发/,
  )?.[0] ?? null;
  return { limits, granularity_raw: granularity };
}

/** 抽取训练用途：默认策略 + opt-out 路径。 */
export interface ExtractedTrainingUse {
  /** "默认不主动训练" 这类原文。 */
  default_raw: string | null;
  /** opt-out 开关名称（如 "Improve the model for everyone"）。 */
  opt_out_toggle_raw: string | null;
  /** 默认是否启用训练；DeepSeek 默认不主动训练，仅"最小限度用于服务改进"。 */
  default_training_allowed: boolean | null;
}

export function extractTrainingUse(
  termsUseBody: string,
  privacyBody: string,
  _modelDisclosureBody: string,
): ExtractedTrainingUse {
  const optOutToggle =
    termsUseBody.match(/opt out by turning off\s*"([^"]+)"/)?.[1]?.trim() ?? null;
  const defaultRaw =
    termsUseBody.match(/we may, to a minimal extent, use Inputs and Outputs[\s\S]{0,200}?individual/)?.[0]?.trim() ??
    privacyBody.match(/To improve and develop the Services and to train and improve our technology[\s\S]{0,200}?algorithms/)?.[0]?.trim() ??
    null;
  // Privacy Policy 明确给出 opt-out 选择：默认未取得同意不主动训练模型；可关闭开关
  const hasOptOut = /the right to opt-out of using your Personal Data for training our models/.test(privacyBody);
  return {
    default_raw: defaultRaw,
    opt_out_toggle_raw: optOutToggle,
    default_training_allowed: hasOptOut ? false : null,
  };
}

/** 抽取数据保留期（自然语言描述）。 */
export function extractDataRetention(privacyBody: string): string | null {
  const m = privacyBody.match(
    /We will retain your Personal Data only as long as needed to fulfill the purposes outlined[\s\S]{0,200}?permitted by law/,
  )?.[0]?.trim() ?? null;
  return m;
}

/** 抽取主体所在地（Data Controller）。 */
export function extractOperatorEntity(privacyBody: string): {
  entity: string;
  jurisdiction: string | null;
  raw: string;
} {
  const m = privacyBody.match(
    /Data Controller:\s*The Services are provided and controlled by\s+(.+?),\s*with its registered address in\s+([^.]+)\./,
  );
  if (!m) return { entity: "", jurisdiction: null, raw: "" };
  return {
    entity: m[1]!.trim(),
    jurisdiction: m[2]!.trim().replace(/\s*\(["']we["']\s+or\s+["']us["']\)\s*/i, "").trim(),
    raw: m[0]?.trim() ?? "",
  };
}

/** 抽取 Open Platform ToS 中的管辖法与扣费相关条款。 */
export interface ExtractedPlatformTerms {
  jurisdiction_raw: string | null;
  fee_rule_raw: string | null;
  availability_caveat_raw: string | null;
}

export function extractPlatformTerms(termsServiceBody: string): ExtractedPlatformTerms {
  const jurisdiction =
    termsServiceBody.match(
      /shall be governed by the laws of the\s+([^.]+)\./,
    )?.[0]?.trim() ?? null;
  const feeRule =
    termsServiceBody.match(
      /You shall pay the corresponding fees[\s\S]{0,200}?pricing page of the Open Platform/,
    )?.[0]?.trim() ?? null;
  const availability =
    termsServiceBody.match(
      /We make no warranty that the Services are available[\s\S]{0,200}?different jurisdictions/,
    )?.[0]?.trim() ?? null;
  return {
    jurisdiction_raw: jurisdiction,
    fee_rule_raw: feeRule,
    availability_caveat_raw: availability,
  };
}

/** 抽取 Terms of Use 的账号注册要求（"Email or third-party account"）。 */
export function extractAccountRegistration(termsUseBody: string): string | null {
  return (
    termsUseBody.match(
      /register an account using your\s+([^.]+?)\s+as per the page instructions/,
    )?.[0]?.trim() ?? null
  );
}

/** 抽取变更日志中的最新发布日期（用于回填 model version 的发布/弃用时间）。 */
export interface ExtractedChangeLogEntry {
  date_cn: string;
  date_iso: string;
  title: string;
  raw: string;
}

export function extractChangeLog(changeLogBody: string): ExtractedChangeLogEntry[] {
  const entries: ExtractedChangeLogEntry[] = [];
  // 章节日期原文可含「年/月/日」或 ISO「YYYY-MM-DD」;二者都允许进入字符类
  const sectionRe = /## 时间[:：]\s*([\d\s年月日:\-]+)([\s\S]*?)(?=\n## 时间|\n# |\s*$)/g;
  for (const m of changeLogBody.matchAll(sectionRe)) {
    const dateCn = m[1]!.trim();
    const body = m[2] ?? "";
    const title = body.match(/###\s*([^\n]+)/)?.[1]?.trim() ?? "";
    const cnDateMatch = dateCn.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    let dateIso = "";
    if (cnDateMatch) {
      dateIso = `${cnDateMatch[1]}-${cnDateMatch[2]!.padStart(2, "0")}-${cnDateMatch[3]!.padStart(2, "0")}`;
    } else {
      const enMatch = dateCn.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (enMatch) {
        dateIso = `${enMatch[1]}-${enMatch[2]!.padStart(2, "0")}-${enMatch[3]!.padStart(2, "0")}`;
      }
    }
    entries.push({
      date_cn: dateCn,
      date_iso: dateIso,
      title,
      raw: m[0]?.trim() ?? "",
    });
  }
  return entries;
}

/** 抽取页面自述时间戳（Open Platform ToS 有 "Release date" / "Effective date"）。 */
export function extractPlatformTermsDates(termsServiceBody: string): {
  release_date: string | null;
  effective_date: string | null;
} {
  const release = termsServiceBody.match(/Release date:\s*([A-Z][a-z]+\s+\d{1,2},\s*\d{4})/);
  const effective = termsServiceBody.match(/Effective date:\s*([A-Z][a-z]+\s+\d{1,2},\s*\d{4})/);
  return {
    release_date: release?.[1]?.trim() ?? null,
    effective_date: effective?.[1]?.trim() ?? null,
  };
}

/** 抽取 Privacy Policy 的 "Published" 日期（YYYY-MM-DD）。 */
export function extractPrivacyPublishedDate(privacyBody: string): string | null {
  return privacyBody.match(/Published:\s*(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
}

/** 抽取 Terms of Use 的 "Published" 日期。 */
export function extractTermsUsePublishedDate(termsUseBody: string): string | null {
  return termsUseBody.match(/Published:\s*(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// 汇总一次采集的全部抽取结果
// ---------------------------------------------------------------------------

export interface ExtractedFacts {
  models: ExtractedModelPricing[];
  pricingWindow: ExtractedPricingWindow;
  billingRule: ExtractedBillingRule;
  concurrency: ExtractedConcurrency;
  trainingUse: ExtractedTrainingUse;
  dataRetention: string | null;
  operator: ReturnType<typeof extractOperatorEntity>;
  platformTerms: ExtractedPlatformTerms;
  platformTermsDates: ReturnType<typeof extractPlatformTermsDates>;
  privacyPublishedDate: string | null;
  termsUsePublishedDate: string | null;
  accountRegistration: string | null;
  changeLog: ExtractedChangeLogEntry[];
}

export function extractFacts(
  snapshots: RawSnapshot[],
  chains: {
    pricing: { source_ids: string[] };
    rateLimit: { source_ids: string[] };
    termsService: { source_ids: string[] };
    privacy: { source_ids: string[] };
    termsUse: { source_ids: string[] };
    modelDisclosure: { source_ids: string[] };
    changeLog: { source_ids: string[] };
  },
): ExtractedFacts {
  const pricingBody = pickBodyByChain(snapshots, chains.pricing);
  const rateLimitBody = pickBodyByChain(snapshots, chains.rateLimit);
  const termsServiceBody = pickBodyByChain(snapshots, chains.termsService);
  const privacyBody = pickBodyByChain(snapshots, chains.privacy);
  const termsUseBody = pickBodyByChain(snapshots, chains.termsUse);
  const modelDisclosureBody = pickBodyByChain(snapshots, chains.modelDisclosure);
  const changeLogBody = pickBodyByChain(snapshots, chains.changeLog);

  return {
    models: extractModelPricing(pricingBody),
    pricingWindow: extractPricingWindow(pricingBody),
    billingRule: extractBillingRule(pricingBody),
    concurrency: extractConcurrency(rateLimitBody),
    trainingUse: extractTrainingUse(termsUseBody, privacyBody, modelDisclosureBody),
    dataRetention: extractDataRetention(privacyBody),
    operator: extractOperatorEntity(privacyBody),
    platformTerms: extractPlatformTerms(termsServiceBody),
    platformTermsDates: extractPlatformTermsDates(termsServiceBody),
    privacyPublishedDate: extractPrivacyPublishedDate(privacyBody),
    termsUsePublishedDate: extractTermsUsePublishedDate(termsUseBody),
    accountRegistration: extractAccountRegistration(termsUseBody),
    changeLog: extractChangeLog(changeLogBody),
  };
}

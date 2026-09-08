import type { FailureCode, SourceKind } from "../../../schema/plan.ts";
import type { SourceChainSpec, SourceSpec } from "../../_shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  pricing: "deepseek-api-pricing",
  rateLimit: "deepseek-api-rate-limit",
  termsService: "deepseek-api-terms-service",
  privacy: "deepseek-api-privacy",
  termsUse: "deepseek-api-terms-use",
  modelDisclosure: "deepseek-api-model-disclosure",
  changeLog: "deepseek-api-change-log",
} as const;

/**
 * DeepSeek API（杭州主体，开放平台）来源注册表。
 * 本 Provider 是首批 api-usage Plan Type：定价按模型 × 通道 × 时段区分；
 * 来源种类遵循探索 01 §7.3 的优先级（定价页 → 文档/帮助 → 公告 → 法律条款）。
 * api-docs.deepseek.com 的 .md 文档页可静态核验（OK_MD）；cdn.deepseek.com/policies
 * 的法律页同为 HTML 可读（OK）；更新日志（zh-cn/updates/）按公告类别登记。
 */
export const DEEPSEEK_API_SOURCES: SourceSpec[] = [
  {
    source_id: SRC.pricing,
    url: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/",
    file: "deepseek-api-pricing.md",
    kind: "pricing_page",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.rateLimit,
    url: "https://api-docs.deepseek.com/zh-cn/quick_start/rate_limit/",
    file: "deepseek-api-rate-limit.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.changeLog,
    url: "https://api-docs.deepseek.com/zh-cn/updates/",
    file: "deepseek-api-change-log.md",
    kind: "announcement",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.termsService,
    url: "https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html",
    file: "deepseek-api-terms-of-service.md",
    kind: "legal",
    ok_code: "OK",
  },
  {
    source_id: SRC.termsUse,
    url: "https://cdn.deepseek.com/policies/en-US/deepseek-terms-of-use.html",
    file: "deepseek-api-terms-of-use.md",
    kind: "legal",
    ok_code: "OK",
  },
  {
    source_id: SRC.privacy,
    url: "https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html",
    file: "deepseek-api-privacy-policy.md",
    kind: "legal",
    ok_code: "OK",
  },
  {
    source_id: SRC.modelDisclosure,
    url: "https://cdn.deepseek.com/policies/en-US/model-algorithm-disclosure.html",
    file: "deepseek-api-model-disclosure.md",
    kind: "legal",
    ok_code: "OK",
  },
];

/**
 * 回退链配置。每条链按来源优先级升序尝试，首个成功者作为 chosen_source_id。
 * api-usage 的关键事实分布：
 * - pricing：定价表（每百万 tokens 单价、并发上限、模型版本、上下文长度）走定价页
 *   → 限速与隔离页（并发上限 / user_id）→ 公告（峰谷时段政策窗口）
 * - legal-availability：地区/管辖/支付条款走 Open Platform ToS → Terms of Use
 * - data-policy：训练用途/保留/转移走 Privacy Policy → Model Algorithm Disclosure → Terms of Use
 * - billing-rules：扣费规则与余额扣减顺序走定价页 → Open Platform ToS §7
 * - model-catalog：模型清单与版本日期走定价页 → 公告更新日志
 * - terms-use：Terms of Use 全文（账号注册/全局条款）单独链，
 *   与 legal-availability 互补——避免 pickBodyByChain 把 termsUse 与 termsService 混读。
 */
export const DEEPSEEK_API_CHAINS: SourceChainSpec[] = [
  {
    chain_id: "deepseek-api-pricing",
    purpose: "DeepSeek API 定价表（每百万 tokens 单价 × 时段）与并发上限",
    source_ids: [SRC.pricing, SRC.rateLimit, SRC.changeLog],
  },
  {
    chain_id: "deepseek-api-billing-rules",
    purpose: "扣费规则、余额扣减顺序与价格调整条款",
    source_ids: [SRC.pricing, SRC.termsService, SRC.changeLog],
  },
  {
    chain_id: "deepseek-api-rate-limit",
    purpose: "账号级并发限速与 user_id 隔离粒度",
    source_ids: [SRC.rateLimit, SRC.pricing],
  },
  {
    chain_id: "deepseek-api-legal-availability",
    purpose: "Open Platform ToS 地区可用性与服务政策",
    source_ids: [SRC.termsService],
  },
  {
    chain_id: "deepseek-api-terms-use",
    purpose: "Terms of Use 全文：账号注册、全局条款、AI 内容条款",
    source_ids: [SRC.termsUse],
  },
  {
    chain_id: "deepseek-api-data-policy",
    purpose: "数据政策：训练用途、保留期、国际转移、ZDR",
    source_ids: [SRC.privacy, SRC.modelDisclosure, SRC.termsUse],
  },
  {
    chain_id: "deepseek-api-model-catalog",
    purpose: "模型清单与版本日期（V4-Flash-0731 / V4-Pro-0813 / V4-Flash-Vision-Exp）",
    source_ids: [SRC.pricing, SRC.changeLog],
  },
  {
    chain_id: "deepseek-api-change-log",
    purpose: "DeepSeek API 更新日志原文（按日期顺序的发布/弃用/价格调整记录）",
    source_ids: [SRC.changeLog],
  },
];

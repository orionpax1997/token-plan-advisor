import type { TraeSourceSpec } from "../load.ts";
import type { SourceChainSpec } from "../shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  /**
   * 中国站定价页（trae.cn/pricing）：客户端渲染，仅获取页头导航与标题。
   * 失败分类 `RENDER_DEPENDENT` 与探索 01 §7.4 一致。
   */
  pricing: "trae-cn-pricing",
  /** 核心计费文档（ide_plans-and-billing，docs.trae.cn 全站支持 .md 直链）。 */
  plansAndBilling: "trae-cn-plans-and-billing",
  /** 积分计费上线公告（2026-07-30 上线以积分为核心的计费模式）。 */
  comingSoon: "trae-cn-coming-soon",
  /** 内置模型（含会员档位门控）。 */
  models: "trae-cn-models",
  /** 设备数量限制（明确 3 台）。 */
  deviceLimit: "trae-cn-device-limit",
  /** 隐私模式（CN 文档，IDE privacy-mode 中文版）。 */
  privacyMode: "trae-cn-privacy-mode",
  /** 快速开始：登录方式、官网域名。 */
  quickstart: "trae-cn-quickstart",
  /** 更新日志（按日期，CN 版本线 v3.3.x）。 */
  changelog: "trae-cn-changelog",
} as const;

/**
 * TRAE 中国站（trae.cn，RMB，积分计费）来源注册表。
 * 种类遵循探索 01 §7.3 的来源优先级（定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）。
 *
 * 营销定价页 trae.cn/pricing 为客户端渲染（仅获取页头导航与标题），正文需经
 * docs.trae.cn 帮助文档替代入口（research/04 §1.2）。定价页 `ok_code = RENDER_DEPENDENT`，
 * 表示抓取 200 但无可机读正文。
 *
 * 与国际版的关键差异：CN 无地区清单；CN 计费周期为"31 个自然日"（与国际版 Legacy 的
 * "30 calendar days" 不同）；CN 运营主体为字节跳动中国主体。
 */
export const TRAE_CN_SOURCES: TraeSourceSpec[] = [
  {
    source_id: SRC.pricing,
    url: "https://www.trae.cn/pricing",
    file: "trae-cn-pricing.html",
    kind: "pricing_page",
    ok_code: "RENDER_DEPENDENT",
  },
  {
    source_id: SRC.plansAndBilling,
    url: "https://docs.trae.cn/ide_plans-and-billing.md",
    file: "trae-cn-plans-and-billing.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.comingSoon,
    url: "https://docs.trae.cn/ide_coming-soon.md",
    file: "trae-cn-coming-soon.md",
    kind: "announcement",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.models,
    url: "https://docs.trae.cn/ide_models.md",
    file: "trae-cn-models.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.deviceLimit,
    url: "https://docs.trae.cn/ide_device-limit.md",
    file: "trae-cn-device-limit.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.privacyMode,
    url: "https://docs.trae.cn/ide_privacy-mode.md",
    file: "trae-cn-privacy-mode.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.quickstart,
    url: "https://docs.trae.cn/ide_get-started-with-trae.md",
    file: "trae-cn-quickstart.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.changelog,
    url: "https://docs.trae.cn/ide_changelog.md",
    file: "trae-cn-changelog.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
];

/**
 * 回退链配置：每条链按来源优先级升序尝试，首个成功者作为 chosen_source_id。
 *
 * 与 Trae 国际版相同：营销定价页 (RENDER_DEPENDENT) 在 SOURCES 中以记录失败码，
 * 但价目链把可读文档站放在首位——`pickBodyByChain` 会取首个非空 body，
 * RENDER_DEPENDENT 页 body 虽非空但无可机读价表；让文档站作为实际抽取来源。
 */
export const TRAE_CN_CHAINS: SourceChainSpec[] = [
  {
    chain_id: "trae-cn-pricing",
    purpose: "TRAE CN 四档会员价目（文档站 plans-and-billing → pricing 页 RENDER_DEPENDENT）",
    source_ids: [SRC.plansAndBilling, SRC.pricing],
  },
  {
    chain_id: "trae-cn-billing-rules",
    purpose: "TRAE CN 计费周期（31 自然日）、积分规则、自动续费",
    source_ids: [SRC.plansAndBilling, SRC.comingSoon],
  },
  {
    chain_id: "trae-cn-models",
    purpose: "TRAE CN 内置模型（含会员档位门控：Seed-Evolving/DeepSeek-V4-Flash/Kimi-K3）",
    source_ids: [SRC.models, SRC.plansAndBilling],
  },
  {
    chain_id: "trae-cn-device-limits",
    purpose: "TRAE CN 设备数量限制（明确 3 台）",
    source_ids: [SRC.deviceLimit],
  },
  {
    chain_id: "trae-cn-privacy",
    purpose: "TRAE CN 隐私模式（中文版口径）",
    source_ids: [SRC.privacyMode],
  },
  {
    chain_id: "trae-cn-registration",
    purpose: "TRAE CN 登录方式与官网域名（手机号/抖音/苹果/掘金）",
    source_ids: [SRC.quickstart],
  },
];

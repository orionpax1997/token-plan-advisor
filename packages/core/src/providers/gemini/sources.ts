import type { SourceSpec as GeminiSourceSpec, SourceChainSpec } from "../_shared.ts";

/** 来源 id 常量：normalize 层引用，避免字面量散落。 */
export const SRC = {
  /** Google Cloud Gemini 定价页（Hourly/Monthly 切换，Standard/Enterprise 月度承诺与年承诺）。 */
  pricing: "gemini-codeassist-pricing",
  /** 商业版产品页（每用户每月 $22.80/$19/$54/$45 + 30 天免费试用）。 */
  business: "gemini-codeassist-business",
  /** 配额与系统限制（agent/CLI/code/chat 四类每日限额 + 1M token 上下文窗口）。 */
  quotas: "gemini-codeassist-quotas",
  /** 服务区域（无中国大陆区域；用户不可选区）。 */
  locations: "gemini-codeassist-locations",
  /** 标准/企业版购买/设置/注册要求文档。 */
  setup: "gemini-codeassist-setup",
  /** 订阅管理（Admin for Gemini 入口，含 Enterprise 至少 10 许可证要求）。 */
  admin: "gemini-codeassist-admin",
  /** 个人层弃用公告（2026-06-18 起停服迁 Antigravity）。 */
  deprecation: "gemini-codeassist-individuals-deprecation",
  /** 消费者账户/个人层状态与迁移 FAQ。 */
  consumer: "gemini-codeassist-consumer",
  /** 数据治理（Gemini 不使用 prompts/responses 作训练；stateless）。 */
  dataGovernance: "gemini-codeassist-data-governance",
  /** 安全/隐私/合规（IP 赔付、SOC/ISO 认证）。 */
  security: "gemini-codeassist-security",
  /** 发布说明（按日期）。 */
  releaseNotes: "gemini-codeassist-release-notes",
  /** Antigravity CLI 过渡公告（2026-05-19）。 */
  blogAntigravity: "gemini-codeassist-blog-antigravity",
} as const;

/**
 * Gemini Code Assist（Google Cloud）来源注册表。
 * 种类遵循探索 01 §7.3 的来源优先级（定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）。
 *
 * 个人层产品页（codeassist.google/products/individuals）重度客户端渲染
 * （research/01 §1 #4），仅返回 JS 引导代码；价目与停服状态以弃用文档为机读来源。
 * 该来源不进入采集（无可机读正文）→ 不在 SOURCES 数组中。
 */
export const GEMINI_SOURCES: GeminiSourceSpec[] = [
  {
    source_id: SRC.pricing,
    url: "https://cloud.google.com/products/gemini/pricing",
    file: "gemini-codeassist-pricing.md",
    kind: "pricing_page",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.business,
    url: "https://codeassist.google/products/business",
    file: "gemini-codeassist-business.md",
    kind: "pricing_page",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.quotas,
    url: "https://cloud.google.com/gemini/docs/quotas",
    file: "gemini-codeassist-quotas.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.locations,
    url: "https://cloud.google.com/gemini/docs/locations",
    file: "gemini-codeassist-locations.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.setup,
    url: "https://developers.google.com/gemini-code-assist/docs/set-up-gemini-standard-enterprise",
    file: "gemini-codeassist-setup.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.admin,
    url: "https://cloud.google.com/gemini/docs/admin",
    file: "gemini-codeassist-admin.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.deprecation,
    url: "https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals",
    file: "gemini-codeassist-individuals-deprecation.md",
    kind: "announcement",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.consumer,
    url: "https://developers.google.com/gemini-code-assist/docs/set-up-gemini",
    file: "gemini-codeassist-consumer.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.dataGovernance,
    url: "https://docs.cloud.google.com/gemini/docs/discover/data-governance",
    file: "gemini-codeassist-data-governance.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.security,
    url: "https://cloud.google.com/gemini/docs/codeassist/security-privacy-compliance",
    file: "gemini-codeassist-security.md",
    kind: "docs_help",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.releaseNotes,
    url: "https://cloud.google.com/gemini/docs/codeassist/release-notes",
    file: "gemini-codeassist-release-notes.md",
    kind: "announcement",
    ok_code: "OK_MD",
  },
  {
    source_id: SRC.blogAntigravity,
    url: "https://developers.googleblog.com/en/an-important-update-transitioning-gemini-cli-to-antigravity-cli/",
    file: "gemini-codeassist-blog-antigravity.md",
    kind: "announcement",
    ok_code: "OK_MD",
  },
];

/**
 * 回退链配置：每条链按来源优先级升序尝试，首个成功者作为 chosen_source_id。
 */
export const GEMINI_CHAINS: SourceChainSpec[] = [
  {
    chain_id: "gemini-codeassist-hourly",
    purpose: "Gemini Code Assist Standard/Enterprise Hourly 口径价格（定价页）",
    source_ids: [SRC.pricing],
  },
  {
    chain_id: "gemini-codeassist-monthly",
    purpose: "Gemini Code Assist Standard/Enterprise Monthly 口径价格（商业版页）",
    source_ids: [SRC.business, SRC.pricing],
  },
  {
    chain_id: "gemini-codeassist-quotas",
    purpose: "Gemini Code Assist 限额（agent/CLI/code/chat 四类每日 + 1M token 上下文窗口）",
    source_ids: [SRC.quotas, SRC.business],
  },
  {
    chain_id: "gemini-codeassist-locations",
    purpose: "Gemini Code Assist 服务区域（无中国大陆区域；用户不可选区）",
    source_ids: [SRC.locations],
  },
  {
    chain_id: "gemini-codeassist-setup",
    purpose: "Gemini Code Assist 注册要求与 Enterprise 至少 10 许可证",
    source_ids: [SRC.setup, SRC.admin],
  },
  {
    chain_id: "gemini-codeassist-individuals",
    purpose: "个人免费层 2026-06-18 停服迁 Antigravity 状态（弃用公告 + 消费者 FAQ）",
    source_ids: [SRC.deprecation, SRC.consumer, SRC.blogAntigravity],
  },
  {
    chain_id: "gemini-codeassist-data-policy",
    purpose: "数据治理与安全合规（stateless、不用于训练）",
    source_ids: [SRC.dataGovernance, SRC.security],
  },
  {
    chain_id: "gemini-codeassist-release-notes",
    purpose: "发布说明（按日期；首月抵扣金 2026-08-20 取消）",
    source_ids: [SRC.releaseNotes],
  },
];

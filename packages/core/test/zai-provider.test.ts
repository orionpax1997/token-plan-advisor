import { beforeAll, describe, expect, it } from "vitest";
import { createZaiProvider } from "../src/providers/zai/provider.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

const CAPTURED_AT = "2026-09-07T09:15:00.000Z";
const COLLECTED_AT = "2026-09-07T10:00:00.000Z";

let collection: PlanCollection;

beforeAll(async () => {
  const provider = createZaiProvider();
  const result = await provider.collect({
    mode: "fixture",
    now: () => new Date(COLLECTED_AT),
  });
  const validation = validatePlanCollection(result);
  if (!validation.ok) {
    throw new Error(`fixture 采集结果未通过 Schema 校验:\n${validation.issues.join("\n")}`);
  }
  collection = validation.value;
});

describe("z.ai Data Provider（fixture 模式）", () => {
  it("采集信封：provider 标识、fixture 模式、采集时间戳、Schema 版本", () => {
    expect(collection.schema_version).toBe("1");
    expect(collection.collection.provider_id).toBe("zai-glm-coding-plan");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.collection.collected_at).toBe(COLLECTED_AT);
    expect(collection.vendor.vendor_id).toBe("zhipu-ai");
    // 同公司的 z.ai 国际区是独立 Regional Variant（新加坡主体）
    expect(collection.regional_variant?.variant_id).toBe("z-ai-international");
    expect(collection.regional_variant?.operator_entity.value).toContain("PTE.LTD");
  });

  it("credits × 模型乘数被结构化：公式原文保留、除数与乘数为数值", () => {
    const system = collection.quota_system;
    expect(system.quota_model).toBe("credits_5h_weekly");
    // 原始表达可追溯
    expect(system.formula.value?.raw).toContain("Model credit usage =");
    expect(system.formula.source_ids).toContain("devpack-overview");
    // 归一化值可追溯
    expect(system.formula.value?.divisor).toBe(10000);
    const glm53 = system.model_multipliers.find((m) => m.model_code === "GLM-5.3");
    expect(glm53?.input.value).toBe(6.9);
    expect(glm53?.cached_input.value).toBe(1.7);
    expect(glm53?.output.value).toBe(24);
    expect(glm53?.input.raw).toBe("6.9");
    const flash = system.model_multipliers.find((m) => m.model_code === "GLM-5.3-Flash");
    expect(flash?.input.value).toBe(2.3);
    expect(flash?.cached_input.value).toBe(0.56);
    expect(flash?.output.value).toBe(8);
    const webSearch = system.mcp_multipliers.find((m) => m.tool === "Web Search");
    expect(webSearch?.output.value).toBe(1.2);
    // 非高峰 50% 计费与高峰时段定义
    expect(system.off_peak_discount.value).toBe(0.5);
    expect(system.peak_hours.value).toContain("14:00");
  });

  it("五档套餐的 5 小时/周双池 credits 逐档正确", () => {
    const expected = {
      "zai-glm-coding-lite": [2000, 10000],
      "zai-glm-coding-pro": [12000, 60000],
      "zai-glm-coding-max": [28000, 140000],
      "zai-glm-team-standard-seat": [15000, 66000],
      "zai-glm-team-premium-seat": [35000, 155000],
    } as const;
    expect(collection.plans).toHaveLength(5);
    for (const [planId, [fiveHour, weekly]] of Object.entries(expected)) {
      const plan = collection.plans.find((p) => p.plan_id === planId);
      expect(plan, planId).toBeDefined();
      expect(plan!.quota.quota_model).toBe("credits_5h_weekly");
      const fiveHourWindow = plan!.quota.windows.find((w) => w.window_type === "5h_rolling");
      const weeklyWindow = plan!.quota.windows.find((w) => w.window_type === "weekly");
      expect(fiveHourWindow?.amount.value, `${planId} 5h`).toBe(fiveHour);
      expect(weeklyWindow?.amount.value, `${planId} weekly`).toBe(weekly);
      // 窗口起点口径不同：5h 从消费起算，周池从订阅起算
      expect(fiveHourWindow?.window_anchor).toBe("from_consumption");
      expect(weeklyWindow?.window_anchor).toBe("from_subscription");
    }
  });

  it("价格：Lite 起价已验证；Pro/Max 现价不可获取且归因 LOGIN_REQUIRED；历史价为 stale", () => {
    const lite = collection.plans.find((p) => p.plan_id === "zai-glm-coding-lite")!;
    const starting = lite.price_list.find((p) => p.price_type === "starting_at");
    expect(starting?.amount.value).toBe(18);
    expect(starting?.amount.raw).toContain("Starting at just 18 USD per month");
    expect(starting?.currency.value).toBe("USD");
    expect(starting?.status).toBe("verified");

    for (const planId of ["zai-glm-coding-pro", "zai-glm-coding-max"]) {
      const plan = collection.plans.find((p) => p.plan_id === planId)!;
      const current = plan.price_list.find(
        (p) => p.price_type === "standard" && p.billing_period === "monthly" && p.effective_from === null,
      );
      // 新 credits 制下 Pro/Max 现价：官方静态渠道无法确认，且原因是需登录
      expect(current?.amount.value, planId).toBeNull();
      expect(current?.status, planId).toBe("unobtainable");
      expect(current?.failure_code, planId).toBe("LOGIN_REQUIRED");
      // 最近一次官方口径（2026-04-21 迁移公告，"for reference only"）标为 stale
      const staleMonthly = plan.price_list.find(
        (p) => p.price_type === "standard" && p.billing_period === "monthly" && p.status === "stale",
      );
      expect(staleMonthly?.amount.value, planId).toBeGreaterThan(0);
      expect(staleMonthly?.source_ids, planId).toContain("notice-transition");
      expect(staleMonthly?.note, planId).toContain("reference only");
    }
    // 季付/年付同样带时间断层标记
    const liteQuarterly = lite.price_list.find((p) => p.billing_period === "quarterly");
    expect(liteQuarterly?.amount.value).toBe(48.6);
    expect(liteQuarterly?.status).toBe("stale");
  });

  it("模型生命周期：supported 与 routed 状态、GLM-5-Turbo 来源冲突", () => {
    const byCode = (code: string) => collection.models.find((m) => m.model_code === code);
    expect(byCode("GLM-5.3")?.availability[0]).toMatchObject({ plans: "all", state: "supported" });
    expect(byCode("GLM-5.3-Flash")?.availability[0]).toMatchObject({ plans: "all", state: "supported" });
    // 旧模型请求被自动路由：状态是 routed 而非 supported，路由目标可追溯
    expect(byCode("GLM-5.2")?.availability[0]).toMatchObject({
      state: "routed",
      routed_to: "GLM-5.3",
    });
    expect(byCode("GLM-5.1")?.availability[0]).toMatchObject({
      state: "routed",
      routed_to: "GLM-5.3",
    });
    expect(byCode("GLM-4.7")?.availability[0]).toMatchObject({
      state: "routed",
      routed_to: "GLM-5.3-Flash",
    });
    // 订阅页 meta 列出 GLM-5-Turbo，devpack 文档未列：来源冲突显式标记
    const turbo = byCode("GLM-5-Turbo");
    expect(turbo?.availability[0]?.state).toBe("unavailable");
    expect(turbo?.availability[0]?.status).toBe("source_conflict");
    expect(turbo?.availability[0]?.source_ids).toContain("subscribe-page");
    // 模型发布/弃用时间官方未给出：未知状态（value=null + unobtainable）
    expect(byCode("GLM-5.3")?.release_date).toMatchObject({ value: null, status: "unobtainable" });
  });

  it("五维地区可用性：中国大陆逐维未确认；出口管制地区服务政策受限", () => {
    const cn = collection.regional_availability.find((r) => r.region_code === "CN");
    expect(cn).toBeDefined();
    // 五个维度独立建模，不合并为单一"支持/不支持"
    for (const dim of [
      cn!.registration,
      cn!.payment,
      cn!.network_access,
      cn!.service_policy,
      cn!.feature_restrictions,
    ]) {
      expect(dim.state).toBe("unconfirmed");
    }
    // 服务政策的"未确认"保留证据：出口管制清单未点名中国大陆
    expect(cn!.service_policy.evidence_raw).toContain("Iran, North Korea, Cuba");
    expect(cn!.service_policy.source_ids).toContain("legal-terms-of-use");

    const restricted = collection.regional_availability.filter(
      (r) => r.service_policy.state === "officially_restricted",
    );
    expect(restricted.length).toBeGreaterThanOrEqual(4);
    expect(restricted.map((r) => r.region_code)).toContain("IR");
  });

  it("数据政策：个人计划可训练、团队默认不训练、处理地新加坡", () => {
    const lite = collection.plans.find((p) => p.plan_id === "zai-glm-coding-lite")!;
    expect(lite.data_policy.training_use.value).toEqual({ allowed: true });
    expect(lite.data_policy.training_use.raw).toContain("train and improve our models");
    expect(lite.data_policy.processing_location.value).toBe("Singapore");

    const premium = collection.plans.find((p) => p.plan_id === "zai-glm-team-premium-seat")!;
    expect(premium.data_policy.training_use.value).toEqual({ allowed: false });
    expect(premium.data_policy.training_use.raw).toContain("not used for model training by default");
  });

  it("来源冲突不静默择一：取消提前期 3 天 vs 24 小时", () => {
    const lite = collection.plans.find((p) => p.plan_id === "zai-glm-coding-lite")!;
    expect(lite.cancellation_notice.status).toBe("source_conflict");
    expect(lite.cancellation_notice.value).toContain("3 days");
    expect(lite.cancellation_notice.value).toContain("24 hours");
    expect(lite.cancellation_notice.source_ids).toEqual(
      expect.arrayContaining(["devpack-usage-policy", "devpack-faq"]),
    );
  });

  it("三时间戳：fetched_at 取快照时点；页面自述更新时间可区分", () => {
    expect(collection.sources.length).toBeGreaterThanOrEqual(11);
    for (const source of collection.sources) {
      expect(source.fetched_at).toBe(CAPTURED_AT);
    }
    const byId = (id: string) => collection.sources.find((s) => s.source_id === id)!;
    // 页面带 "Last Update" 的来源
    expect(byId("legal-privacy-policy").last_updated_at).toBe("2025-09-29");
    expect(byId("legal-terms-of-use").last_updated_at).toBe("2026-04-14");
    // 公告带 "Publication date"
    expect(byId("notice-usage-revision").last_updated_at).toBe("2026-07-30");
    expect(byId("notice-transition").last_updated_at).toBe("2026-04-21");
    // devpack 文档页不显示更新时间：null 并注明以采集时间为准
    const overview = byId("devpack-overview");
    expect(overview.last_updated_at).toBeNull();
    expect(overview.last_updated_note).toContain("采集时间为准");
  });

  it("限时促销带生效日期：GLM-5.3-Flash 活动区间", () => {
    const campaign = collection.promotions.find((p) => p.description.includes("GLM-5.3-Flash"));
    expect(campaign).toBeDefined();
    expect(campaign?.kind).toBe("quota");
    expect(campaign?.effective_from).toBe("2026-09-03");
    expect(campaign?.effective_until).toBe("2026-09-20");
  });

  it("Unresolved Facts：登录后才能确认与官方未声明的缺口全部列出", () => {
    const facts = collection.unresolved_facts;
    const contains = (needle: string) => facts.some((f) => f.fact.includes(needle));
    // 价格缺口
    const priceFact = facts.find((f) => f.fact.includes("Pro/Max") && f.fact.includes("现价"));
    expect(priceFact?.failure_code).toBe("LOGIN_REQUIRED");
    // 其余官方未声明/未公开的缺口
    expect(contains("上下文窗口")).toBe(true);
    expect(contains("并发")).toBe(true);
    expect(contains("GLM-5-Turbo")).toBe(true);
    expect(contains("中国大陆")).toBe(true);
  });

  it("确定性：同一时钟两次采集输出完全一致", async () => {
    const provider = createZaiProvider();
    const second = await provider.collect({ mode: "fixture", now: () => new Date(COLLECTED_AT) });
    expect(second).toEqual(collection);
  });
});

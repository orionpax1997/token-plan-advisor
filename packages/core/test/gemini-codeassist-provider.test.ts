import { beforeAll, describe, expect, it } from "vitest";
import { createGeminiCodeAssistProvider } from "../src/providers/gemini/provider.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

const CAPTURED_AT = "2026-09-07T09:15:00.000Z";
const COLLECTED_AT = "2026-09-08T10:00:00.000Z";

let collection: PlanCollection;

beforeAll(async () => {
  const provider = createGeminiCodeAssistProvider();
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

describe("Gemini Code Assist Data Provider（fixture 模式）", () => {
  it("采集信封：Gemini Code Assist provider_id、regional_variant", () => {
    expect(collection.collection.provider_id).toBe("google-gemini-codeassist");
    expect(collection.vendor.vendor_id).toBe("google-cloud");
    expect(collection.regional_variant?.variant_id).toBe("gemini-codeassist");
  });

  it("双口径价格：Hourly 与 Monthly 各 2 条（4 条目 / plan）显式标注换算关系", () => {
    expect(collection.plans.length).toBe(2);
    const standard = collection.plans.find((p) => p.plan_id === "gemini-codeassist-standard")!;
    // 4 个 verified 价格条目
    expect(standard.price_list.length).toBe(4);
    // 全部 USD
    for (const entry of standard.price_list) {
      expect(entry.currency.value).toBe("USD");
      expect(entry.status).toBe("verified");
    }
    // Hourly 折算月价与 Monthly 口径一致
    const standardHourlyMonthly = standard.price_list.find(
      (p) => p.billing_period === "monthly" && p.price_type === "standard",
    );
    const standardMonthlyMonthly = standard.price_list.filter(
      (p) => p.billing_period === "monthly" && p.price_type === "standard",
    )[1]; // 第二个是 Monthly 页来源
    expect(standardHourlyMonthly?.amount.value).toBeCloseTo(0.031232877, 9);
    expect(standardMonthlyMonthly?.amount.value).toBe(22.8);
    // 折算备注
    expect(standardHourlyMonthly?.note).toContain("折算月价 ≈ $22.80");
    expect(standardMonthlyMonthly?.note).toContain("≈ $22.80");
    expect(standardMonthlyMonthly?.note).toContain("一致");

    const enterprise = collection.plans.find((p) => p.plan_id === "gemini-codeassist-enterprise")!;
    const entHourlyMonthly = enterprise.price_list.find(
      (p) => p.billing_period === "monthly" && p.price_type === "standard",
    );
    expect(entHourlyMonthly?.amount.value).toBeCloseTo(0.073972603, 9);
    expect(entHourlyMonthly?.note).toContain("折算月价 ≈ $54.00");
  });

  it("Annual commitment 价格：Hourly 折算月价与 Monthly $19/$45 一致", () => {
    const standard = collection.plans.find((p) => p.plan_id === "gemini-codeassist-standard")!;
    const annualHourly = standard.price_list.find(
      (p) => p.billing_period === "annual" && p.price_type === "standard",
    );
    expect(annualHourly?.note).toContain("≈ $19.00");
    const enterprise = collection.plans.find((p) => p.plan_id === "gemini-codeassist-enterprise")!;
    const entAnnualHourly = enterprise.price_list.find(
      (p) => p.billing_period === "annual" && p.price_type === "standard",
    );
    expect(entAnnualHourly?.note).toContain("≈ $45.00");
  });

  it("每日限额：Standard 1500 agent+CLI / 6000 code / 960 chat；Enterprise 2000/6000/960", () => {
    const standard = collection.plans.find((p) => p.plan_id === "gemini-codeassist-standard")!;
    const agent = standard.quota.windows.find((w) => w.unit?.includes("agent mode"));
    const code = standard.quota.windows.find((w) => w.unit?.includes("code requests"));
    const chat = standard.quota.windows.find((w) => w.unit?.includes("chat"));
    expect(agent?.amount.value).toBe(1500);
    expect(code?.amount.value).toBe(6000);
    expect(chat?.amount.value).toBe(960);

    const enterprise = collection.plans.find((p) => p.plan_id === "gemini-codeassist-enterprise")!;
    expect(
      enterprise.quota.windows.find((w) => w.unit?.includes("agent mode"))?.amount.value,
    ).toBe(2000);
  });

  it("上下文窗口：1M tokens verified 进入 context_window_tokens", () => {
    const standard = collection.plans.find((p) => p.plan_id === "gemini-codeassist-standard")!;
    expect(standard.context_window_tokens.value).toBe(1000000);
    expect(standard.context_window_tokens.status).toBe("verified");
  });

  it("RPS：2 RPS 进入 rate_limits（research/01 §2）", () => {
    const standard = collection.plans.find((p) => p.plan_id === "gemini-codeassist-standard")!;
    expect(standard.rate_limits.value).toContain("2 RPS");
  });

  it("个人层 2026-06-18 停服迁 Antigravity：以 DEPRECATED 进入 Unresolved Fact", () => {
    const deprecated = collection.unresolved_facts.find(
      (f) => f.failure_code === "DEPRECATED" && f.fact.includes("2026-06-18"),
    );
    expect(deprecated).toBeDefined();
    expect(deprecated?.fact).toContain("Antigravity");
    // 不作为可购买 plan 输出（plans 数组不含 individuals）
    expect(collection.plans.find((p) => p.plan_id.includes("individual"))).toBeUndefined();
  });

  it("RENDER_DEPENDENT：codeassist.google/products/individuals 客户端渲染失败进入 Unresolved Fact", () => {
    const render = collection.unresolved_facts.find(
      (f) => f.failure_code === "RENDER_DEPENDENT" && f.fact.includes("individuals"),
    );
    expect(render).toBeDefined();
  });

  it("URL 域名迁移 GONE：cloud.google.com/gemini/docs/* → docs.cloud.google.com/gemini/docs/*", () => {
    const gone = collection.unresolved_facts.find(
      (f) => f.failure_code === "GONE" && f.fact.includes("cloud.google.com"),
    );
    expect(gone).toBeDefined();
  });

  it("Enterprise 至少 10 许可证：经 admin 链验证", () => {
    const enterprise = collection.plans.find((p) => p.plan_id === "gemini-codeassist-enterprise")!;
    // 购买/管理文档中明确 10 许可证（不在 plan 字段层表达，但来源链可达）
    const setupChain = collection.source_chains.find((c) => c.chain_id === "gemini-codeassist-setup");
    expect(setupChain).toBeDefined();
    expect(setupChain!.chosen_source_id).toBeTruthy();
  });

  it("回退链：hourly 与 monthly 两条独立链", () => {
    const hourlyChain = collection.source_chains.find((c) => c.chain_id === "gemini-codeassist-hourly");
    const monthlyChain = collection.source_chains.find((c) => c.chain_id === "gemini-codeassist-monthly");
    expect(hourlyChain).toBeDefined();
    expect(monthlyChain).toBeDefined();
    expect(hourlyChain!.chosen_source_id).toBe("gemini-codeassist-pricing");
    expect(monthlyChain!.chosen_source_id).toBe("gemini-codeassist-business");
  });

  it("data_policy：training_use=false（Gemini 不使用 prompts/responses 训练）", () => {
    const standard = collection.plans.find((p) => p.plan_id === "gemini-codeassist-standard")!;
    expect(standard.data_policy.training_use.value).toEqual({ allowed: false });
    expect(standard.data_policy.training_use.raw).toContain("doesn't use your prompts");
  });

  it("五维地区可用性：CN 全部 5 维度 unobtainable（无可机读官方声明）", () => {
    const cn = collection.regional_availability.find((r) => r.region_code === "CN")!;
    expect(cn.registration.status).toBe("unobtainable");
    expect(cn.payment.status).toBe("unobtainable");
    expect(cn.network_access.status).toBe("unobtainable");
    expect(cn.service_policy.status).toBe("unobtainable");
    expect(cn.feature_restrictions.status).toBe("unobtainable");
  });

  it("GLOBAL 维度：服务政策 officially_available（operate globally）", () => {
    const global = collection.regional_availability.find((r) => r.region_code === "GLOBAL")!;
    expect(global.service_policy.state).toBe("officially_available");
    expect(global.service_policy.evidence_raw).toContain("globally");
  });

  it("首月抵扣金 2026-08-20 取消：TIME_DEPENDENT 进入 Unresolved Fact", () => {
    const timeDep = collection.unresolved_facts.find(
      (f) => f.failure_code === "TIME_DEPENDENT" && f.fact.includes("2026-08-20"),
    );
    expect(timeDep).toBeDefined();
  });

  it("确定性：同一时钟两次采集输出完全一致", async () => {
    const provider = createGeminiCodeAssistProvider();
    const second = await provider.collect({ mode: "fixture", now: () => new Date(COLLECTED_AT) });
    expect(second).toEqual(collection);
  });
});

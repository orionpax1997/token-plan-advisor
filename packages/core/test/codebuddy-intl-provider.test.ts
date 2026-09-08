import { beforeAll, describe, expect, it } from "vitest";
import { createCodeBuddyIntlProvider } from "../src/providers/codebuddy/intl/provider.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

const CAPTURED_AT = "2026-09-07T09:15:00.000Z";
const COLLECTED_AT = "2026-09-07T10:00:00.000Z";

let collection: PlanCollection;

beforeAll(async () => {
  const provider = createCodeBuddyIntlProvider();
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

describe("CodeBuddy Intl Data Provider（fixture 模式）", () => {
  it("采集信封：Intl regional variant、新加坡主体、USD", () => {
    expect(collection.schema_version).toBe("1");
    expect(collection.collection.provider_id).toBe("tencent-codebuddy-intl");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.collection.collected_at).toBe(COLLECTED_AT);
    expect(collection.vendor.vendor_id).toBe("tencent-cloud");
    expect(collection.regional_variant?.variant_id).toBe("codebuddy-intl");
    expect(collection.regional_variant?.operator_entity.value).toMatch(/Singapore/i);
    expect(collection.regional_variant?.operator_entity.value).toMatch(/Pte\.?\s*Ltd\.?/i);
    expect(collection.regional_variant?.jurisdiction.value).toBe("Singapore");
  });

  it("价格：三档 Free/Pro/Team 全部已验证、币种 USD、月/年付多价目", () => {
    const plans = collection.plans.filter((p) => p.audience === "individual" || p.audience === "team");
    expect(plans.length).toBeGreaterThanOrEqual(3);
    for (const plan of plans) {
      const verifiedPrices = plan.price_list.filter(
        (p) => p.price_type === "standard" && p.status === "verified",
      );
      expect(verifiedPrices.length, plan.plan_id).toBeGreaterThanOrEqual(1);
      for (const entry of verifiedPrices) {
        expect(entry.currency.value).toBe("USD");
      }
    }
  });

  it("STALE_CONFLICT：Price details 旧价 $9.95/$119.40 与 Billing Overview 新价 $10/$96 并存", () => {
    const conflict = collection.unresolved_facts.find((f) =>
      (f.fact.includes("Price details") || f.fact.includes("$9.95")) &&
      (f.fact.includes("Billing Overview") || f.fact.includes("新价"))
    );
    expect(conflict, "应有旧价与新价并存的 STALE_CONFLICT 说明").toBeDefined();
    expect(conflict?.failure_code).toBe("STALE_CONFLICT");
  });

  it("TIME_DEPENDENT：老用户保价 2026-08-07 起切换为新价，记录到 promotions 或 STALE 价目", () => {
    const transition = collection.unresolved_facts.find((f) =>
      f.fact.includes("2026-08-07") || (f.fact.includes("auto-renewal") && f.fact.includes("保价")),
    );
    expect(transition, "应有 2026-08-07 老用户保价说明").toBeDefined();
    // 老用户保价的 Pro 价格应作为 STALE 价格保留
    const stalePrice = collection.plans
      .flatMap((p) => p.price_list)
      .find((p) => p.status === "stale" && p.price_type === "standard");
    expect(stalePrice, "应有 STALE 状态的老用户保价").toBeDefined();
  });

  it("LOGIN_REQUIRED：Pro 试用需绑卡、Team 实际单价、限额等需登录字段", () => {
    const loginFacts = collection.unresolved_facts.filter((f) => f.failure_code === "LOGIN_REQUIRED");
    expect(loginFacts.length).toBeGreaterThanOrEqual(1);
  });

  it("额度原语：credits 制独立建模", () => {
    expect(collection.quota_system.quota_model).toBe("credits_5h_weekly");
    for (const plan of collection.plans) {
      for (const w of plan.quota.windows) {
        expect(w.unit).toBe("credits");
      }
    }
  });

  it("五维地区可用性：声明 'available to users globally'，未排除任何国家", () => {
    const intl = collection.regional_availability.find((r) => r.region_code === "GLOBAL");
    expect(intl).toBeDefined();
    // 国际站声明全球可用，但因法域为新加坡，应在 service_policy 注明
    expect(intl!.service_policy.state).toBe("officially_available");
    expect(intl!.registration.state).toBe("officially_available");
    expect(intl!.payment.state).toBe("officially_available");
  });

  it("回退链：source_chains 至少记录价目链与 Billing 链", () => {
    expect(collection.source_chains.length).toBeGreaterThanOrEqual(2);
    const pricing = collection.source_chains.find((c) => c.purpose.includes("价目") || c.purpose.includes("Billing"));
    expect(pricing).toBeDefined();
    expect(pricing!.attempts.length).toBeGreaterThanOrEqual(2);
    expect(pricing!.chosen_source_id).not.toBeNull();
  });

  it("来源清单：每条来源带 fetched_at、last_updated_at 可追溯", () => {
    expect(collection.sources.length).toBeGreaterThanOrEqual(3);
    for (const source of collection.sources) {
      expect(source.source_id).toBeTruthy();
      expect(source.fetched_at).toBe(CAPTURED_AT);
      expect(source.url).toMatch(/^https:\/\//);
    }
    // Billing Overview 页面带 "Last updated: 2026-08-07"
    const billing = collection.sources.find((s) => s.source_id === "intl-1256-77269");
    expect(billing?.last_updated_at).toBe("2026-08-07");
  });

  it("确定性：同一时钟两次采集输出完全一致", async () => {
    const provider = createCodeBuddyIntlProvider();
    const second = await provider.collect({ mode: "fixture", now: () => new Date(COLLECTED_AT) });
    expect(second).toEqual(collection);
  });
});
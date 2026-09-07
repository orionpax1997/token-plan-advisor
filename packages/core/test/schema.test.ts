import { describe, expect, it } from "vitest";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

/**
 * 构造一份覆盖全部必选区块的最小合法文档。
 * 各用例在其上覆盖自己关心的切片，保证断言聚焦在单一行为上。
 */
export function minimalCollection(): PlanCollection {
  return {
    schema_version: "1",
    collection: {
      provider_id: "zai-glm-coding-plan",
      mode: "fixture",
      collected_at: "2026-09-07T09:00:00.000Z",
      tool_version: "0.1.0",
    },
    vendor: { vendor_id: "zhipu-ai", display_name: "Z.ai（智谱）" },
    regional_variant: {
      variant_id: "z-ai-international",
      operator_entity: {
        value: "JINGSHENG HENGXING TECHNOLOGY PTE.LTD",
        status: "verified",
        source_ids: ["legal-terms-of-use"],
      },
      jurisdiction: {
        value: "Singapore",
        status: "verified",
        source_ids: ["legal-terms-of-use"],
      },
    },
    payment: { methods: ["bank card", "PayPal"], notes: [] },
    quota_system: {
      quota_model: "credits_5h_weekly",
      unit: { value: "credits", status: "verified", source_ids: ["devpack-overview"] },
      formula: {
        value: {
          raw: "Model credit usage = (Input tokens × Input multiplier + Cached Input tokens × Cached Input multiplier + Output tokens × Output multiplier) / 10,000",
          divisor: 10000,
        },
        status: "verified",
        source_ids: ["devpack-overview"],
      },
      model_multipliers: [
        {
          model_code: "GLM-5.3",
          input: { value: 6.9, status: "verified", raw: "6.9", source_ids: ["devpack-overview"] },
          cached_input: { value: 1.7, status: "verified", raw: "1.7", source_ids: ["devpack-overview"] },
          output: { value: 24, status: "verified", raw: "24", source_ids: ["devpack-overview"] },
        },
      ],
      mcp_multipliers: [],
      off_peak_discount: { value: 0.5, status: "verified", source_ids: ["devpack-overview"] },
      peak_hours: { value: "Mon-Fri 14:00-18:00 (UTC+8)", status: "verified", source_ids: ["devpack-overview"] },
    },
    models: [
      {
        model_code: "GLM-5.3",
        release_date: { value: null, status: "unobtainable", source_ids: [] },
        deprecation_date: { value: null, status: "unobtainable", source_ids: [] },
        availability: [
          {
            plans: "all",
            state: "supported",
            routed_to: null,
            status: "verified",
            source_ids: ["devpack-overview"],
          },
        ],
      },
    ],
    plans: [
      {
        plan_id: "zai-glm-coding-lite",
        plan_name: "GLM Coding Plan Lite",
        plan_type: "coding-subscription",
        audience: "individual",
        price_list: [
          {
            amount: { value: 18, status: "verified", raw: "Starting at just 18 USD per month", source_ids: ["devpack-overview"] },
            currency: { value: "USD", status: "verified", source_ids: ["devpack-overview"] },
            billing_period: "monthly",
            price_type: "starting_at",
            effective_from: null,
            effective_until: null,
            status: "verified",
            source_ids: ["devpack-overview"],
          },
        ],
        quota: {
          quota_model: "credits_5h_weekly",
          windows: [
            {
              window_type: "5h_rolling",
              window_anchor: "from_consumption",
              amount: { value: 2000, status: "verified", source_ids: ["devpack-overview"] },
              unit: "credits",
              status: "verified",
              source_ids: ["devpack-overview"],
            },
          ],
        },
        rate_limits: { value: null, status: "unobtainable", failure_code: "LOGIN_REQUIRED", source_ids: [] },
        context_window_tokens: { value: null, status: "unobtainable", source_ids: [] },
        refund_policy: {
          value: "non-refundable after purchase",
          status: "verified",
          source_ids: ["devpack-usage-policy"],
        },
        cancellation_notice: {
          value: "at least 3 days before next billing date",
          status: "verified",
          source_ids: ["devpack-usage-policy"],
        },
        purchase_url: { value: "https://z.ai/subscribe", status: "verified", source_ids: ["devpack-quick-start"] },
        data_policy: {
          training_use: {
            value: { allowed: true },
            status: "verified",
            source_ids: ["legal-terms-of-use"],
          },
          processing_location: { value: "Singapore", status: "verified", source_ids: ["legal-privacy-policy"] },
          data_retention: { value: null, status: "unobtainable", source_ids: [] },
          zdr_offered: { value: null, status: "not_applicable", source_ids: [] },
        },
      },
    ],
    regional_availability: [
      {
        region_code: "CN",
        registration: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
        payment: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
        network_access: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
        service_policy: {
          state: "officially_restricted",
          status: "verified",
          evidence_raw: "Iran, North Korea, Cuba, Crimea, Donetsk, or Zaporizhzhia",
          source_ids: ["legal-terms-of-use"],
        },
        feature_restrictions: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
      },
    ],
    promotions: [],
    sources: [
      {
        source_id: "devpack-overview",
        url: "https://docs.z.ai/devpack/overview.md",
        source_kind: "docs_help",
        fetched_at: "2026-09-07T09:00:00.000Z",
        last_updated_at: null,
      },
    ],
    unresolved_facts: [],
  };
}

describe("Plan Schema v1 校验", () => {
  it("接受覆盖全部必选区块的最小合法文档", () => {
    const result = validatePlanCollection(minimalCollection());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.collection.mode).toBe("fixture");
      expect(result.value.plans).toHaveLength(1);
    }
  });

  it("拒绝 Schema 未定义的 Plan Type", () => {
    const doc = minimalCollection();
    doc.plans[0]!.plan_type = "subscription" as never;
    const result = validatePlanCollection(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(JSON.stringify(result.issues)).toContain("plan_type");
    }
  });

  it("拒绝未知的质量状态（字段级状态是封闭枚举）", () => {
    const doc = minimalCollection();
    doc.plans[0]!.context_window_tokens = { value: null, status: "maybe", source_ids: [] } as never;
    const result = validatePlanCollection(doc);
    expect(result.ok).toBe(false);
  });

  it("未知、零值与不适用三种状态可区分", () => {
    const doc = minimalCollection();
    // 未知：当前价格未获取（字段与条目级状态一致，均为 unobtainable）
    doc.plans[0]!.price_list[0]!.amount = { value: null, status: "unobtainable", source_ids: [] };
    doc.plans[0]!.price_list[0]!.status = "unobtainable";
    doc.plans[0]!.price_list[0]!.failure_code = "LOGIN_REQUIRED";
    // 零值：促销期 0 元，是已核实的明确数字
    doc.plans[0]!.price_list.push({
      amount: { value: 0, status: "verified", source_ids: ["notice-event-glm-53-flash"] },
      currency: { value: "USD", status: "verified", source_ids: ["notice-event-glm-53-flash"] },
      billing_period: "monthly",
      price_type: "promotional",
      effective_from: "2026-09-03",
      effective_until: "2026-09-20",
      status: "verified",
      source_ids: ["notice-event-glm-53-flash"],
    });
    // 不适用：个人套餐无席位计费
    doc.plans[0]!.data_policy.zdr_offered = { value: null, status: "not_applicable", source_ids: [] };

    const result = validatePlanCollection(doc);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const prices = result.value.plans[0]!.price_list;
      expect(prices[0]).toMatchObject({ amount: { value: null, status: "unobtainable" } });
      expect(prices[1]).toMatchObject({ amount: { value: 0, status: "verified" } });
      expect(result.value.plans[0]!.data_policy.zdr_offered).toMatchObject({
        value: null,
        status: "not_applicable",
      });
    }
  });

  it("非空价格必须携带币种", () => {
    const doc = minimalCollection();
    doc.plans[0]!.price_list[0]!.currency = { value: null, status: "unobtainable", source_ids: [] };
    const result = validatePlanCollection(doc);
    expect(result.ok).toBe(false);
  });

  it("已验证/部分获取/过期/来源冲突的字段必须给出至少一个来源", () => {
    const doc = minimalCollection();
    doc.plans[0]!.refund_policy = { value: "non-refundable", status: "verified", source_ids: [] };
    const result = validatePlanCollection(doc);
    expect(result.ok).toBe(false);
  });

  it("unobtainable / not_applicable 字段的 value 必须为 null", () => {
    const doc = minimalCollection();
    doc.plans[0]!.context_window_tokens = { value: 200000, status: "unobtainable", source_ids: [] };
    const result = validatePlanCollection(doc);
    expect(result.ok).toBe(false);
  });

  it("每个来源必须带 fetched_at；last_updated_at 允许为 null（以采集时间为准）", () => {
    const doc = minimalCollection();
    const source = doc.sources[0]!;
    delete (source as Partial<typeof source>).fetched_at;
    expect(validatePlanCollection(doc).ok).toBe(false);

    const doc2 = minimalCollection();
    doc2.sources[0]!.last_updated_at = null;
    expect(validatePlanCollection(doc2).ok).toBe(true);
  });

  it("拒绝未知字段（输出契约是封闭的）", () => {
    const doc = minimalCollection() as Record<string, unknown>;
    doc.scores = { overall: 99 };
    const result = validatePlanCollection(doc as unknown as PlanCollection);
    expect(result.ok).toBe(false);
  });
});

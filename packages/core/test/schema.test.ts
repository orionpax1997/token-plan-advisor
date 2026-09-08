import { describe, expect, it } from "vitest";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";
import { minimalCollection } from "./helpers/minimal-collection.ts";

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

  it("支持 source_chains：记录每条回退链的尝试顺序、结果与最终选择", () => {
    const doc = minimalCollection();
    doc.source_chains = [
      {
        chain_id: "codebuddy-cn-pricing",
        purpose: "CodeBuddy 国内个人版价目与额度",
        attempts: [
          {
            source_id: "codebuddy-cn-pricing",
            kind: "pricing_page",
            ok: true,
            http_status: 200,
            failure_code: "OK",
          },
          {
            source_id: "cloud-1749-109769",
            kind: "docs_help",
            ok: false,
            http_status: 404,
            failure_code: "GONE",
            error_note: "页面不存在",
          },
        ],
        chosen_source_id: "codebuddy-cn-pricing",
      },
    ];
    const result = validatePlanCollection(doc);
    expect(result.ok).toBe(true);
  });

  it("回退链 chosen_source_id 为 null 表示整链失败", () => {
    const doc = minimalCollection();
    doc.source_chains = [
      {
        chain_id: "all-failed",
        purpose: "整链失败的极端示例",
        attempts: [
          {
            source_id: "first",
            kind: "pricing_page",
            ok: false,
            http_status: 403,
            failure_code: "CF_BLOCKED",
          },
          {
            source_id: "second",
            kind: "docs_help",
            ok: false,
            http_status: 0,
            error_note: "ECONNRESET",
          },
        ],
        chosen_source_id: null,
      },
    ];
    const result = validatePlanCollection(doc);
    expect(result.ok).toBe(true);
  });
});

describe("ranking_gate 门控标记（探索 01 §7.1）", () => {
  it("最小合法文档携带与派生结果一致的门控标记", () => {
    const result = validatePlanCollection(minimalCollection());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.ranking_gate).toEqual({ eligible: true, missing_core_fields: [] });
    }
  });

  it("拒绝 eligible 与缺失清单相互矛盾的标记", () => {
    const doc = minimalCollection();
    doc.ranking_gate = {
      eligible: true,
      missing_core_fields: [{ field_id: "price", reason: "不应出现" }],
    };
    expect(validatePlanCollection(doc).ok).toBe(false);

    const doc2 = minimalCollection();
    doc2.ranking_gate = { eligible: false, missing_core_fields: [] };
    expect(validatePlanCollection(doc2).ok).toBe(false);
  });

  it("门控标记与文档实际内容不符时校验失败（标记不可撒谎）", () => {
    const doc = minimalCollection();
    doc.plans[0]!.purchase_url = {
      value: null,
      status: "unobtainable",
      failure_code: "LOGIN_REQUIRED",
      source_ids: [],
    };
    // 文档里购买入口缺失，但门控仍声称 eligible → 校验必须拦下
    const result = validatePlanCollection(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.join("\n")).toContain("ranking_gate");
    }
  });

  it("拒绝 CoreFieldIds 之外的 field_id", () => {
    const doc = minimalCollection();
    doc.ranking_gate = {
      eligible: false,
      missing_core_fields: [{ field_id: "overall_score" as never, reason: "未知字段" }],
    };
    expect(validatePlanCollection(doc).ok).toBe(false);
  });
});

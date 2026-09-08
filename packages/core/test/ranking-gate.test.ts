import { beforeAll, describe, expect, it } from "vitest";
import { runCli } from "../src/cli.ts";
import { attachRankingGate, deriveRankingGate } from "../src/schema/gate.ts";
import {
  CoreFieldIds,
  validatePlanCollection,
  type PlanCollection,
  type PlanCollectionPayload,
} from "../src/schema/plan.ts";
import { minimalCollection } from "./helpers/minimal-collection.ts";

/** 从最小合法文档剥掉 ranking_gate，得到归一化层的原始产出。 */
function payload(): PlanCollectionPayload {
  const doc = minimalCollection();
  const { ranking_gate: _omit, ...rest } = doc;
  return structuredClone(rest);
}

describe("deriveRankingGate（§7.1 八项核心字段逐项派生）", () => {
  it("八项核心字段齐备时 eligible=true 且缺失清单为空", () => {
    const gate = deriveRankingGate(payload());
    expect(gate).toEqual({ eligible: true, missing_core_fields: [] });
  });

  it("价格缺失：所有价格条目都无金额/币种时给出 price 缺口并点名 Plan", () => {
    const doc = payload();
    for (const entry of doc.plans[0]!.price_list) {
      entry.amount = { value: null, status: "unobtainable", source_ids: [] };
      entry.currency = { value: null, status: "unobtainable", source_ids: [] };
    }
    const gate = deriveRankingGate(doc);
    expect(gate.eligible).toBe(false);
    const gap = gate.missing_core_fields.find((g) => g.field_id === "price");
    expect(gap?.reason).toContain("zai-glm-coding-lite");
  });

  it("计费周期缺失：price_list 为空的 Plan 同时触发 price 与 billing_period", () => {
    const doc = payload();
    doc.plans[0]!.price_list = [];
    const gate = deriveRankingGate(doc);
    const ids = gate.missing_core_fields.map((g) => g.field_id);
    expect(ids).toContain("price");
    expect(ids).toContain("billing_period");
    expect(gate.missing_core_fields.find((g) => g.field_id === "billing_period")?.reason).toContain(
      "zai-glm-coding-lite",
    );
  });

  it("额度原始表达缺失：windows 为空或既无 raw 又无数值时触发", () => {
    const empty = payload();
    empty.plans[0]!.quota.windows = [];
    expect(deriveRankingGate(empty).missing_core_fields.map((g) => g.field_id)).toContain(
      "quota_expression",
    );

    const opaque = payload();
    const win = opaque.plans[0]!.quota.windows[0]!;
    win.raw = "";
    win.amount = { value: null, status: "unobtainable", source_ids: [] };
    expect(deriveRankingGate(opaque).missing_core_fields.map((g) => g.field_id)).toContain(
      "quota_expression",
    );

    // 有原始表达即可（数值未获取不阻塞——原始表达是可比性底线）
    const rawOnly = payload();
    const win2 = rawOnly.plans[0]!.quota.windows[0]!;
    win2.raw = "约 2,000 credits / 5h";
    win2.amount = { value: null, status: "unobtainable", source_ids: [] };
    expect(deriveRankingGate(rawOnly).missing_core_fields.map((g) => g.field_id)).not.toContain(
      "quota_expression",
    );
  });

  it("模型清单缺失：models 为空，或模型缺少与 Plan 的绑定关系", () => {
    const noModels = payload();
    noModels.models = [];
    const gate = deriveRankingGate(noModels);
    const gap = gate.missing_core_fields.find((g) => g.field_id === "model_catalog");
    expect(gap?.reason).toContain("models 为空");

    const unbound = payload();
    unbound.models[0]!.availability = [];
    const gap2 = deriveRankingGate(unbound).missing_core_fields.find(
      (g) => g.field_id === "model_catalog",
    );
    expect(gap2?.reason).toContain("GLM-5.3");
  });

  it("地区支持缺失：无地区条目，或全部地区×维度均为 unconfirmed", () => {
    const noRegions = payload();
    noRegions.regional_availability = [];
    expect(deriveRankingGate(noRegions).missing_core_fields.map((g) => g.field_id)).toContain(
      "regional_support",
    );

    const allUnconfirmed = payload();
    for (const region of allUnconfirmed.regional_availability) {
      for (const dim of [
        region.registration,
        region.payment,
        region.network_access,
        region.service_policy,
        region.feature_restrictions,
      ]) {
        dim.state = "unconfirmed";
      }
    }
    const gate = deriveRankingGate(allUnconfirmed);
    expect(gate.missing_core_fields.map((g) => g.field_id)).toContain("regional_support");
    expect(gate.missing_core_fields.find((g) => g.field_id === "regional_support")?.reason).toContain(
      "unconfirmed",
    );
  });

  it("隐私/数据缺失：data_policy 四项全部不可获取时触发", () => {
    const doc = payload();
    const dp = doc.plans[0]!.data_policy;
    dp.training_use = { value: null, status: "unobtainable", source_ids: [] };
    dp.processing_location = { value: null, status: "unobtainable", source_ids: [] };
    dp.data_retention = { value: null, status: "unobtainable", source_ids: [] };
    dp.zdr_offered = { value: null, status: "unobtainable", source_ids: [] };
    const gap = deriveRankingGate(doc).missing_core_fields.find(
      (g) => g.field_id === "privacy_data",
    );
    expect(gap?.reason).toContain("zai-glm-coding-lite");
  });

  it("购买入口缺失：purchase_url 为 null 时触发并点名 Plan", () => {
    const doc = payload();
    doc.plans[0]!.purchase_url = {
      value: null,
      status: "unobtainable",
      failure_code: "LOGIN_REQUIRED",
      source_ids: [],
    };
    const gap = deriveRankingGate(doc).missing_core_fields.find(
      (g) => g.field_id === "purchase_entry",
    );
    expect(gap?.reason).toContain("zai-glm-coding-lite");
  });

  it("Plan 标识缺失：plan_id / plan_name 为空时触发", () => {
    const doc = payload();
    doc.plans[0]!.plan_id = "";
    const ids = deriveRankingGate(doc).missing_core_fields.map((g) => g.field_id);
    expect(ids).toContain("plan_identity");
  });

  it("缺口只点名实际缺失的 Plan，不牵连其他档位", () => {
    const doc = payload();
    doc.plans.push(structuredClone(doc.plans[0]!));
    doc.plans[1]!.plan_id = "second-plan";
    doc.plans[1]!.purchase_url = { value: null, status: "unobtainable", source_ids: [] };
    const gate = deriveRankingGate(doc);
    const gap = gate.missing_core_fields.find((g) => g.field_id === "purchase_entry");
    expect(gap?.reason).toContain("second-plan");
    expect(gap?.reason).not.toContain("zai-glm-coding-lite");
  });

  it("缺失清单的 field_id 全部在封闭枚举内，reason 非空", () => {
    const doc = payload();
    doc.models = [];
    doc.plans[0]!.price_list = [];
    const gate = deriveRankingGate(doc);
    for (const gap of gate.missing_core_fields) {
      expect(CoreFieldIds).toContain(gap.field_id);
      expect(gap.reason.length).toBeGreaterThan(0);
    }
  });
});

describe("attachRankingGate（归一化层装配入口）", () => {
  it("装配后的文档通过 Plan Schema v1 校验", () => {
    const result = validatePlanCollection(attachRankingGate(payload()));
    expect(result.ok).toBe(true);
  });

  it("装配的门控与文档内容一致（缺购买入口 → eligible=false）", () => {
    const doc = payload();
    doc.plans[0]!.purchase_url = { value: null, status: "unobtainable", source_ids: [] };
    const assembled = attachRankingGate(doc);
    expect(assembled.ranking_gate.eligible).toBe(false);
    expect(validatePlanCollection(assembled).ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CLI fixture 端到端：8 个 Provider 的真实门控结论（快照事实，刷新 fixture 时同步更新）
// ---------------------------------------------------------------------------

interface CollectAllOutput {
  collections: Record<string, PlanCollection>;
}

const ELIGIBLE = new Set(["codebuddy-intl", "cursor", "trae-intl", "trae-cn"]);

describe("CLI collect-all 输出中的门控结论（fixture 模式）", () => {
  let collections: Record<string, PlanCollection>;

  beforeAll(async () => {
    const out: string[] = [];
    const err: string[] = [];
    const code = await runCli(["collect-all"], {
      stdout: (s) => out.push(s),
      stderr: (s) => err.push(s),
    });
    expect(code).toBe(0);
    collections = (JSON.parse(out.join("")) as CollectAllOutput).collections;
  });

  it("每个 collection 都携带 ranking_gate 且通过 Schema 校验", () => {
    expect(Object.keys(collections)).toHaveLength(8);
    for (const [providerId, collection] of Object.entries(collections)) {
      expect(collection.ranking_gate, providerId).toBeDefined();
      const validation = validatePlanCollection(collection);
      expect(validation.ok, providerId).toBe(true);
    }
  });

  it("门控结论与快照事实一致：4 项可进入强排名，4 项存在缺口", () => {
    for (const [providerId, collection] of Object.entries(collections)) {
      expect(collection.ranking_gate.eligible, providerId).toBe(ELIGIBLE.has(providerId));
      expect(
        collection.ranking_gate.missing_core_fields.length === 0,
        providerId,
      ).toBe(collection.ranking_gate.eligible);
    }
  });

  it("z.ai：团队席位无官方现价 → price 缺口点名两个席位档", () => {
    const gate = collections["zai"]!.ranking_gate;
    const gap = gate.missing_core_fields.find((g) => g.field_id === "price");
    expect(gap).toBeDefined();
    expect(gap?.reason).toContain("zai-glm-team-standard-seat");
    expect(gap?.reason).toContain("zai-glm-team-premium-seat");
  });

  it("CodeBuddy 国内：私有化企业档无公开价目与额度、无模型清单 → 四项缺口", () => {
    const ids = collections["codebuddy-cn"]!.ranking_gate.missing_core_fields.map(
      (g) => g.field_id,
    );
    expect(ids).toContain("price");
    expect(ids).toContain("billing_period");
    expect(ids).toContain("quota_expression");
    expect(ids).toContain("model_catalog");
  });

  it("Gemini Code Assist：官方页无模型清单 → 恰好一项 model_catalog 缺口", () => {
    const gate = collections["gemini-codeassist"]!.ranking_gate;
    expect(gate.missing_core_fields).toHaveLength(1);
    expect(gate.missing_core_fields[0]!.field_id).toBe("model_catalog");
  });

  it("Cursor Start（INR）：无官方隐私/数据声明 → 恰好一项 privacy_data 缺口", () => {
    const gate = collections["cursor-start-in"]!.ranking_gate;
    expect(gate.missing_core_fields).toHaveLength(1);
    expect(gate.missing_core_fields[0]!.field_id).toBe("privacy_data");
  });
});

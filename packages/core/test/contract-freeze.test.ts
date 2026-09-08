import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { runCli } from "../src/cli.ts";
import type { PlanCollection } from "../src/schema/plan.ts";
import {
  BillingPeriods,
  CoreFieldIds,
  FailureCodes,
  PlanTypes,
  QualityStatuses,
  QuotaModels,
  SourceKinds,
} from "../src/schema/plan.ts";

/**
 * collect 输出契约冻结测试（ticket 05）。
 *
 * 本文件钉住 v1 契约的可见形状：顶层键集、版本号、封闭枚举、门控语义。
 * 任何断言失败都意味着契约发生了变化——必须：
 *   1. 在 docs/contracts/collect-output-v1.md 的「变更记录」追加条目并升版号；
 *   2. 同步更新本文件与全部受影响的 Provider 测试。
 * 静默改动契约形状是不允许的。
 */

const COLLECT_TOP_LEVEL_KEYS = [
  "schema_version",
  "collection",
  "vendor",
  "regional_variant",
  "payment",
  "quota_system",
  "models",
  "plans",
  "regional_availability",
  "promotions",
  "sources",
  "source_chains",
  "unresolved_facts",
  "ranking_gate",
].sort();

const COLLECT_ALL_TOP_LEVEL_KEYS = [
  "schema_version",
  "collected_at",
  "tool_version",
  "mode",
  "coverage_scope",
  "coverage_gaps",
  "errors",
  "collections",
].sort();

const COLLECTION_META_KEYS = ["provider_id", "mode", "collected_at", "tool_version"].sort();

const CONTRACT_DOC = fileURLToPath(new URL("../../../docs/contracts/collect-output-v1.md", import.meta.url));

interface CollectAllOutput {
  schema_version: string;
  collected_at: string;
  tool_version: string;
  mode: string;
  coverage_scope: {
    plan_types: string[];
    coding_subscription: { count: number; providers: string[] };
    api_usage: { count: number; providers: string[] };
  };
  coverage_gaps: { name: string; reason: string }[];
  errors: { provider_id: string; error: string }[];
  collections: Record<string, PlanCollection>;
}

describe("collect 契约冻结（v1）", () => {
  let collectJson: string;
  let collectAll: CollectAllOutput;

  beforeAll(async () => {
    const out: string[] = [];
    const err: string[] = [];
    const code1 = await runCli(["collect", "zai"], {
      stdout: (s) => out.push(s),
      stderr: (s) => err.push(s),
    });
    expect(code1).toBe(0);
    collectJson = out.join("");

    const out2: string[] = [];
    const err2: string[] = [];
    const code2 = await runCli(["collect-all"], {
      stdout: (s) => out2.push(s),
      stderr: (s) => err2.push(s),
    });
    expect(code2).toBe(0);
    collectAll = JSON.parse(out2.join("")) as CollectAllOutput;
  });

  it("collect 输出顶层键集与冻结清单完全一致（不增不减不改名）", () => {
    const doc = JSON.parse(collectJson) as Record<string, unknown>;
    expect(Object.keys(doc).sort()).toEqual(COLLECT_TOP_LEVEL_KEYS);
  });

  it("collect-all 输出顶层键集与冻结清单完全一致", () => {
    expect(Object.keys(collectAll).sort()).toEqual(COLLECT_ALL_TOP_LEVEL_KEYS);
  });

  it("collection 元数据块键集冻结（provider_id/mode/collected_at/tool_version）", () => {
    const doc = JSON.parse(collectJson) as PlanCollection;
    expect(Object.keys(doc.collection).sort()).toEqual(COLLECTION_META_KEYS);
    for (const collection of Object.values(collectAll.collections)) {
      expect(Object.keys(collection.collection).sort()).toEqual(COLLECTION_META_KEYS);
    }
  });

  it("schema_version 冻结为 \"1\"", () => {
    const doc = JSON.parse(collectJson) as PlanCollection;
    expect(doc.schema_version).toBe("1");
    expect(collectAll.schema_version).toBe("1");
    for (const collection of Object.values(collectAll.collections)) {
      expect(collection.schema_version).toBe("1");
    }
  });

  it("tool_version 随包版本（0.1.0）", () => {
    const doc = JSON.parse(collectJson) as PlanCollection;
    expect(doc.collection.tool_version).toBe("0.1.0");
    expect(collectAll.tool_version).toBe("0.1.0");
  });

  it("封闭枚举冻结：任何增删都是契约变更，须显式升版", () => {
    expect(PlanTypes).toEqual(["coding-subscription", "general-subscription", "api-usage"]);
    expect(QuotaModels).toEqual([
      "messages_5h",
      "credits_5h_weekly",
      "usd_equivalence",
      "usage_tier",
      "concurrency",
      "relative_multiplier",
    ]);
    expect(QualityStatuses).toEqual([
      "verified",
      "partial",
      "stale",
      "source_conflict",
      "unobtainable",
      "not_applicable",
    ]);
    expect(FailureCodes).toEqual([
      "OK",
      "OK_MD",
      "JS_RENDERED_DATA",
      "JS_RENDERED_EMPTY",
      "RENDER_DEPENDENT",
      "LOGIN_REQUIRED",
      "API_AVAILABLE",
      "CF_BLOCKED",
      "GONE",
      "SPA",
      "DEPRECATED",
      "STALE_SNAPSHOT",
      "STALE_CONFLICT",
      "REGION_BLOCKED",
      "TIME_DEPENDENT",
    ]);
    expect(SourceKinds).toEqual(["pricing_page", "docs_help", "announcement", "console", "legal"]);
    expect(BillingPeriods).toEqual(["monthly", "quarterly", "annual", "weekly", "daily", "one_time"]);
    expect(CoreFieldIds).toEqual([
      "price",
      "plan_identity",
      "billing_period",
      "quota_expression",
      "model_catalog",
      "regional_support",
      "privacy_data",
      "purchase_entry",
    ]);
  });

  it("契约冻结文档存在，声明 contract_version 1 并含变更记录章节", () => {
    const content = readFileSync(CONTRACT_DOC, "utf8");
    expect(content).toContain("contract_version: 1");
    expect(content).toContain("## 变更记录");
    // 冻结声明与升版规则必须在文档中可检索
    expect(content).toContain("冻结");
    expect(content).toContain("升版");
  });

  it("门控语义冻结：ranking_gate 双字段且 eligible 与缺失清单互斥一致", () => {
    for (const [providerId, collection] of Object.entries(collectAll.collections)) {
      const gate = collection.ranking_gate;
      expect(gate, providerId).toBeDefined();
      expect(Object.keys(gate!).sort()).toEqual(["eligible", "missing_core_fields"]);
      expect(gate!.eligible, providerId).toBe(gate!.missing_core_fields.length === 0);
    }
  });

  it("coverage_scope 与 coverage_gaps 冻结:8 项 coding-subscription + 1 项 api-usage + 缺口如实声明", () => {
    const scope = collectAll.coverage_scope;
    expect(scope.plan_types).toEqual(["coding-subscription", "api-usage"]);
    expect(scope.coding_subscription.count).toBe(8);
    expect(scope.coding_subscription.providers).toHaveLength(8);
    expect(scope.api_usage.count).toBe(1);
    expect(scope.api_usage.providers).toContain("deepseek-api");
    expect(collectAll.coverage_gaps.length).toBeGreaterThanOrEqual(1);
    for (const gap of collectAll.coverage_gaps) {
      expect(gap.name).toBeTruthy();
      expect(gap.reason).toBeTruthy();
    }
  });
});

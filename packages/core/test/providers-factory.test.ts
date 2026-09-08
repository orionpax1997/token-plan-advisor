import { describe, expect, it } from "vitest";
import { normalizeFromSnapshots as normalizeCodeBuddyCn } from "../src/providers/codebuddy/cn/normalize.ts";
import { CODEBUDDY_CN_CHAINS, CODEBUDDY_CN_SOURCES } from "../src/providers/codebuddy/cn/sources.ts";
import { createSnapshotProvider, type SnapshotProviderSpec } from "../src/providers/factory.ts";
import { normalizeFromSnapshots as normalizeZai } from "../src/providers/zai/normalize.ts";
import { ZAI_SOURCES } from "../src/providers/zai/sources.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";
import { fakeLiveFetcher } from "./helpers/fake-live-fetcher.ts";

const COLLECTED_AT = "2026-09-07T11:00:00.000Z";
const now = () => new Date(COLLECTED_AT);
const FIXTURE_ROOT = new URL("../fixtures/", import.meta.url).pathname;

/** zai 形态：无回退链声明（chains: [] 为合法规格值，ticket 01）。 */
const ZAI_SPEC: SnapshotProviderSpec = {
  providerId: "zai-glm-coding-plan",
  fixtureDir: "zai",
  sources: ZAI_SOURCES,
  chains: [],
  normalizeFromSnapshots: normalizeZai,
};

/** codebuddy-cn 形态：有回退链的家族代表。 */
const CODEBUDDY_CN_SPEC: SnapshotProviderSpec = {
  providerId: "tencent-codebuddy-cn",
  fixtureDir: "codebuddy-cn",
  sources: CODEBUDDY_CN_SOURCES,
  chains: CODEBUDDY_CN_CHAINS,
  normalizeFromSnapshots: normalizeCodeBuddyCn,
};

describe("createSnapshotProvider（注册表工厂）", () => {
  it("fixture 模式：产出通过 schema 校验的 PlanCollection，元数据来自 spec 与包版本", async () => {
    const provider = createSnapshotProvider(ZAI_SPEC);
    const doc = await provider.collect({ mode: "fixture", now });
    expect(validatePlanCollection(doc).ok).toBe(true);
    expect(doc.collection.provider_id).toBe("zai-glm-coding-plan");
    expect(doc.collection.mode).toBe("fixture");
    expect(doc.collection.collected_at).toBe(COLLECTED_AT);
    expect(doc.collection.tool_version).toBe("0.1.0");
  });

  it("chains: [] 是合法规格：source_chains 恒为空数组（zai 形态）", async () => {
    const doc = await createSnapshotProvider(ZAI_SPEC).collect({ mode: "fixture", now });
    expect(doc.source_chains).toEqual([]);
  });

  it("有链家族：source_chains 从 spec.chains 派生，正常快照下整链 chosen", async () => {
    const doc = await createSnapshotProvider(CODEBUDDY_CN_SPEC).collect({ mode: "fixture", now });
    expect(validatePlanCollection(doc).ok).toBe(true);
    expect(doc.source_chains).toHaveLength(CODEBUDDY_CN_CHAINS.length);
    for (const chain of doc.source_chains) {
      expect(chain.chosen_source_id).not.toBeNull();
    }
  });

  it("ranking gate 接线：gate 存在且 eligible 与缺失清单互斥一致", async () => {
    for (const spec of [ZAI_SPEC, CODEBUDDY_CN_SPEC]) {
      const doc = await createSnapshotProvider(spec).collect({ mode: "fixture", now });
      expect(Object.keys(doc.ranking_gate).sort()).toEqual(["eligible", "missing_core_fields"]);
      expect(doc.ranking_gate.eligible).toBe(doc.ranking_gate.missing_core_fields.length === 0);
    }
  });

  it("live 模式：注入 fetcher 走同一条归一化路径，事实与 fixture 模式一致", async () => {
    const provider = createSnapshotProvider(ZAI_SPEC);
    const fixture = await provider.collect({ mode: "fixture", now });
    const live = await provider.collect({
      mode: "live",
      fetcher: fakeLiveFetcher(`${FIXTURE_ROOT}zai/`, ZAI_SOURCES),
      now,
    });
    expect(validatePlanCollection(live).ok).toBe(true);
    expect(live.plans).toEqual(fixture.plans);
    expect(live.models).toEqual(fixture.models);
    expect(live.unresolved_facts).toEqual(fixture.unresolved_facts);
    for (const source of live.sources) {
      expect(source.fetched_at).toBe(COLLECTED_AT);
    }
  });

  it("装配期 fail-fast：链引用未注册来源时拒绝构造", () => {
    const badSpec: SnapshotProviderSpec = {
      ...CODEBUDDY_CN_SPEC,
      chains: [{ chain_id: "bad-chain", purpose: "校验负例", source_ids: ["not-in-registry"] }],
    };
    expect(() => createSnapshotProvider(badSpec)).toThrow(/not-in-registry/);
  });
});

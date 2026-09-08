import { describe, expect, it } from "vitest";
import { createZaiProvider } from "../src/providers/zai/provider.ts";
import { createGeminiCodeAssistProvider } from "../src/providers/gemini/provider.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

/**
 * 实时抓取冒烟验证（ticket 05）：对至少 2 项候选发起真实网络采集，
 * 验证 live 路径在真实官方来源上端到端可用。
 *
 * 默认跳过（保证离线确定性测试套件不依赖网络）；运行方式：
 *   TPA_LIVE_SMOKE=1 pnpm --filter @token-plan-advisor/core exec vitest run test/live-smoke.test.ts
 *
 * 冒烟只验证「采集成功且输出合法」，不钉住线上具体数值（线上事实随时可变）；
 * 数值级回归由 fixture 快照测试承担。
 */

const ENABLED = process.env.TPA_LIVE_SMOKE === "1";

describe.skipIf(!ENABLED)("实时抓取冒烟（TPA_LIVE_SMOKE=1，真实网络）", () => {
  it("z.ai：live 采集输出合法文档，来源同源抓取且门控在场", { timeout: 240_000 }, async () => {
    const doc: PlanCollection = await createZaiProvider().collect({ mode: "live" });
    const validation = validatePlanCollection(doc);
    expect(validation.ok, validation.ok ? "" : validation.issues.join("\n")).toBe(true);
    expect(doc.collection.mode).toBe("live");
    expect(doc.plans.length).toBeGreaterThanOrEqual(1);
    // 全部来源同一采集时钟，且为本次实时抓取（新近，非 fixture 快照时点）
    const fetchedAts = new Set(doc.sources.map((s) => s.fetched_at));
    expect(fetchedAts.size).toBe(1);
    const fetched = Date.parse(doc.sources[0]!.fetched_at);
    expect(Date.now() - fetched).toBeLessThan(10 * 60_000);
    expect(doc.ranking_gate).toBeDefined();
  });

  it("Gemini Code Assist：live 采集输出合法文档（12 个官方来源）", { timeout: 240_000 }, async () => {
    const doc: PlanCollection = await createGeminiCodeAssistProvider().collect({ mode: "live" });
    const validation = validatePlanCollection(doc);
    expect(validation.ok, validation.ok ? "" : validation.issues.join("\n")).toBe(true);
    expect(doc.collection.mode).toBe("live");
    expect(doc.plans.length).toBeGreaterThanOrEqual(1);
    expect(doc.sources.length).toBeGreaterThanOrEqual(10);
    const fetched = Date.parse(doc.sources[0]!.fetched_at);
    expect(Date.now() - fetched).toBeLessThan(10 * 60_000);
    expect(doc.ranking_gate).toBeDefined();
  });
});

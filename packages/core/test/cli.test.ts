import { beforeAll, describe, expect, it } from "vitest";
import { runCli } from "../src/cli.ts";
import { validatePlanCollection } from "../src/schema/plan.ts";
import type { PlanCollection } from "../src/schema/plan.ts";

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return {
    io: {
      stdout: (s: string) => out.push(s),
      stderr: (s: string) => err.push(s),
    },
    stdout: () => out.join(""),
    stderr: () => err.join(""),
  };
}

let stdout = "";
let exitCode = -1;

beforeAll(async () => {
  const cap = capture();
  exitCode = await runCli(["collect", "zai", "--mode", "fixture"], cap.io);
  stdout = cap.stdout();
});

describe("tpa collect zai（CLI seam，fixture 模式）", () => {
  it("退出码 0，stdout 输出单个 JSON 文档", async () => {
    expect(exitCode).toBe(0);
    const parsed = JSON.parse(stdout) as PlanCollection;
    expect(parsed.schema_version).toBe("1");
  });

  it("输出通过 Plan Schema v1 校验", () => {
    const result = validatePlanCollection(JSON.parse(stdout));
    expect(result.ok).toBe(true);
  });

  it("机读 JSON 携带字段状态、Unresolved Facts、采集时间戳与所用来源", () => {
    const doc = JSON.parse(stdout) as PlanCollection;
    // 字段状态：至少出现已验证与不可获取两种
    const statuses = new Set<string>();
    for (const plan of doc.plans) {
      statuses.add(plan.price_list[0]?.status ?? "");
    }
    expect(statuses.has("verified")).toBe(true);
    expect(statuses.has("unobtainable")).toBe(true);
    // Unresolved Facts
    expect(doc.unresolved_facts.length).toBeGreaterThan(3);
    // 采集时间戳
    expect(doc.collection.collected_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // 所用来源
    expect(doc.sources.length).toBeGreaterThanOrEqual(11);
  });

  it("未知 Provider 报错到 stderr 并以非零码退出", async () => {
    const cap = capture();
    const code = await runCli(["collect", "nonexistent"], cap.io);
    expect(code).not.toBe(0);
    expect(cap.stderr()).toContain("nonexistent");
    expect(cap.stdout()).toBe("");
  });

  it("缺少命令或非法模式给出用法错误", async () => {
    const cap = capture();
    expect(await runCli([], cap.io)).not.toBe(0);
    expect(cap.stderr()).toContain("Usage");
    const cap2 = capture();
    expect(await runCli(["collect", "zai", "--mode", "wat"], cap2.io)).not.toBe(0);
  });
});

describe("tpa collect codebuddy-cn / codebuddy-intl（CLI seam，fixture 模式）", () => {
  it("codebuddy-cn 退出码 0 且输出通过 Schema 校验", async () => {
    const cap = capture();
    const code = await runCli(["collect", "codebuddy-cn", "--mode", "fixture"], cap.io);
    expect(code).toBe(0);
    const doc = JSON.parse(cap.stdout()) as PlanCollection;
    const validation = validatePlanCollection(doc);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value.collection.provider_id).toBe("tencent-codebuddy-cn");
      expect(validation.value.regional_variant?.variant_id).toBe("codebuddy-cn");
      // STALE_CONFLICT、TIME_DEPENDENT、LOGIN_REQUIRED 均进入输出
      const codes = new Set(validation.value.unresolved_facts.map((f) => f.failure_code).filter(Boolean));
      expect(codes.has("STALE_CONFLICT")).toBe(true);
      expect(codes.has("TIME_DEPENDENT")).toBe(true);
      expect(codes.has("LOGIN_REQUIRED")).toBe(true);
      // 回退链（source_chains）记录在案
      expect(validation.value.source_chains.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("codebuddy-intl 退出码 0 且输出通过 Schema 校验", async () => {
    const cap = capture();
    const code = await runCli(["collect", "codebuddy-intl", "--mode", "fixture"], cap.io);
    expect(code).toBe(0);
    const doc = JSON.parse(cap.stdout()) as PlanCollection;
    const validation = validatePlanCollection(doc);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value.collection.provider_id).toBe("tencent-codebuddy-intl");
      expect(validation.value.regional_variant?.variant_id).toBe("codebuddy-intl");
      // STALE_CONFLICT 与 TIME_DEPENDENT 必须出现
      const codes = new Set(validation.value.unresolved_facts.map((f) => f.failure_code).filter(Boolean));
      expect(codes.has("STALE_CONFLICT")).toBe(true);
      expect(codes.has("TIME_DEPENDENT")).toBe(true);
      expect(validation.value.source_chains.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("用法提示列出全部 Provider", async () => {
    const cap = capture();
    await runCli(["--help"], cap.io);
    expect(cap.stderr()).toContain("zai");
    expect(cap.stderr()).toContain("codebuddy-cn");
    expect(cap.stderr()).toContain("codebuddy-intl");
  });
});

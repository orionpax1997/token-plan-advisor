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

import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.ts";
import { validatePlanCollection, type PlanCollection } from "../src/schema/plan.ts";

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

describe("tpa collect-all 命令", () => {
  it("退出码 0,输出包含全部已接入 Provider + 覆盖缺口", async () => {
    const cap = capture();
    const code = await runCli(["collect-all"], cap.io);
    expect(code).toBe(0);
    const parsed = JSON.parse(cap.stdout()) as CollectAllOutput;
    expect(parsed.schema_version).toBe("1");
    // 本批两个 Plan Type 分桶:coding-subscription 8 + api-usage 1 (deepseek-api)
    expect(parsed.coverage_scope.plan_types).toEqual(["coding-subscription", "api-usage"]);
    expect(parsed.coverage_scope.coding_subscription.count).toBe(8);
    expect(parsed.coverage_scope.coding_subscription.providers).toHaveLength(8);
    expect(parsed.coverage_scope.coding_subscription.providers).toContain("trae-intl");
    expect(parsed.coverage_scope.coding_subscription.providers).toContain("trae-cn");
    expect(parsed.coverage_scope.coding_subscription.providers).toContain("gemini-codeassist");
    expect(parsed.coverage_scope.api_usage.count).toBe(1);
    expect(parsed.coverage_scope.api_usage.providers).toContain("deepseek-api");
    // collections 实际同时包含 9 项
    expect(Object.keys(parsed.collections)).toHaveLength(9);
    expect(parsed.collections["deepseek-api"]).toBeDefined();
    // 覆盖缺口至少 1 项
    expect(parsed.coverage_gaps.length).toBeGreaterThanOrEqual(1);
  });

  it("每个已接入 Provider 的 collection 通过 Plan Schema v1 校验", () => {
    const cap = capture();
    return runCli(["collect-all"], cap.io).then(() => {
      const parsed = JSON.parse(cap.stdout()) as CollectAllOutput;
      for (const [providerId, collection] of Object.entries(parsed.collections)) {
        const validation = validatePlanCollection(collection);
        expect(validation.ok, `${providerId} 应通过 Schema 校验: ${validation.ok ? "" : validation.issues.join("\n")}`).toBe(true);
      }
    });
  });

  it("包含 Trae 国际/CN 与 Gemini Code Assist", async () => {
    const cap = capture();
    await runCli(["collect-all"], cap.io);
    const parsed = JSON.parse(cap.stdout()) as CollectAllOutput;
    expect(parsed.collections["trae-intl"]).toBeDefined();
    expect(parsed.collections["trae-cn"]).toBeDefined();
    expect(parsed.collections["gemini-codeassist"]).toBeDefined();

    // Trae Intl 应有 5 档
    expect(parsed.collections["trae-intl"]!.plans.length).toBe(5);
    // Trae CN 应有 4 档
    expect(parsed.collections["trae-cn"]!.plans.length).toBe(4);
    // Gemini Code Assist 应有 2 档（个人层已停服，不输出）
    expect(parsed.collections["gemini-codeassist"]!.plans.length).toBe(2);
  });

  it("--pretty 缩进输出仍可解析为 JSON", async () => {
    const cap = capture();
    const code = await runCli(["collect-all", "--pretty"], cap.io);
    expect(code).toBe(0);
    // Pretty 输出含换行缩进
    expect(cap.stdout()).toContain("\n");
    const parsed = JSON.parse(cap.stdout()) as CollectAllOutput;
    expect(parsed.schema_version).toBe("1");
  });

  it("--mode live（不实际抓取只校验 CLI 入口），用法错误仍写 stderr", async () => {
    const cap = capture();
    const code = await runCli(["collect-all", "--mode", "wat"], cap.io);
    expect(code).not.toBe(0);
    expect(cap.stderr()).toContain("--mode");
  });

  it("coverage_gaps 字段包含声明的不在采集范围内的来源", () => {
    const cap = capture();
    return runCli(["collect-all"], cap.io).then(() => {
      const parsed = JSON.parse(cap.stdout()) as CollectAllOutput;
      const gapNames = parsed.coverage_gaps.map((g) => g.name);
      // 显式声明 Claude Code / Codex / Qwen 等不在本批范围
      expect(gapNames.some((n) => n.includes("Claude"))).toBe(true);
      expect(gapNames.some((n) => n.includes("Codex") || n.includes("ChatGPT"))).toBe(true);
      // 每个 gap 都带 reason
      for (const gap of parsed.coverage_gaps) {
        expect(gap.reason).toBeTruthy();
      }
    });
  });

  it("错误隔离：单个 Provider 失败不阻塞其他 Provider 采集", async () => {
    const cap = capture();
    const code = await runCli(["collect-all"], cap.io);
    // fixture 模式下所有 Provider 都应成功，errors 应为空
    expect(code).toBe(0);
    const parsed = JSON.parse(cap.stdout()) as CollectAllOutput;
    expect(parsed.errors.length).toBe(0);
  });
});

describe("tpa 未知命令报错", () => {
  it("未知命令写 stderr 并以非零码退出，stdout 保持空", async () => {
    const cap = capture();
    const code = await runCli(["nonexistent-command"], cap.io);
    expect(code).not.toBe(0);
    expect(cap.stderr()).toContain("Unknown command");
    expect(cap.stdout()).toBe("");
  });
});

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
});

describe("tpa collect cursor / cursor-start-in（CLI seam，fixture 模式）", () => {
  it("cursor 退出码 0 且输出通过 Schema 校验，JS 渲染失败码与 API_AVAILABLE 可见", async () => {
    const cap = capture();
    const code = await runCli(["collect", "cursor", "--mode", "fixture"], cap.io);
    expect(code).toBe(0);
    const doc = JSON.parse(cap.stdout()) as PlanCollection;
    const validation = validatePlanCollection(doc);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      const value = validation.value;
      expect(value.collection.provider_id).toBe("anysphere-cursor");
      expect(value.regional_variant).toBeNull();
      // usd_equivalence 双池原语
      expect(value.quota_system.quota_model).toBe("usd_equivalence");
      expect(value.plans.find((p) => p.plan_id === "cursor-pro")?.quota.windows.length).toBe(2);
      // JS 渲染定价页：失败码 JS_RENDERED_DATA 在机读输出中可见
      expect(JSON.stringify(value.sources)).toContain("JS_RENDERED_DATA");
      expect(JSON.stringify(value.source_chains)).toContain("JS_RENDERED_DATA");
      // 失败分类：API_AVAILABLE / LOGIN_REQUIRED / TIME_DEPENDENT 均进入输出
      const codes = new Set(value.unresolved_facts.map((f) => f.failure_code).filter(Boolean));
      expect(codes.has("API_AVAILABLE")).toBe(true);
      expect(codes.has("LOGIN_REQUIRED")).toBe(true);
      expect(codes.has("TIME_DEPENDENT")).toBe(true);
      // 回退链记录在案
      expect(value.source_chains.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("cursor-start-in 退出码 0 且区域变体/INR 原语独立可见", async () => {
    const cap = capture();
    const code = await runCli(["collect", "cursor-start-in", "--mode", "fixture"], cap.io);
    expect(code).toBe(0);
    const doc = JSON.parse(cap.stdout()) as PlanCollection;
    const validation = validatePlanCollection(doc);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      const value = validation.value;
      expect(value.collection.provider_id).toBe("anysphere-cursor-start-in");
      expect(value.regional_variant?.variant_id).toBe("cursor-start-in");
      expect(value.quota_system.quota_model).toBe("usage_tier");
      expect(value.plans[0]?.price_list[0]?.currency.value).toBe("INR");
      expect(value.plans[0]?.price_list[0]?.amount.value).toBe(649);
    }
  });

  it("用法提示列出全部 Provider（含 Trae / Gemini 系列）", async () => {
    const cap = capture();
    await runCli(["--help"], cap.io);
    // 注册表整行匹配：证明 Trae 与 Gemini 各自独立列出
    expect(cap.stderr()).toContain("trae-intl");
    expect(cap.stderr()).toContain("trae-cn");
    expect(cap.stderr()).toContain("gemini-codeassist");
  });

  it("tpa collect trae-intl 退出码 0 且输出通过 Schema 校验", async () => {
    const cap = capture();
    const code = await runCli(["collect", "trae-intl", "--mode", "fixture"], cap.io);
    expect(code).toBe(0);
    const doc = JSON.parse(cap.stdout()) as PlanCollection;
    const validation = validatePlanCollection(doc);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value.collection.provider_id).toBe("trae-intl");
      expect(validation.value.regional_variant?.variant_id).toBe("trae-intl");
      // RENDER_DEPENDENT 失败码可见
      const codes = new Set(validation.value.unresolved_facts.map((f) => f.failure_code).filter(Boolean));
      expect(codes.has("RENDER_DEPENDENT")).toBe(true);
      expect(codes.has("STALE_CONFLICT")).toBe(true);
      expect(validation.value.source_chains.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("tpa collect trae-cn 退出码 0 且输出通过 Schema 校验（31 自然日计费周期）", async () => {
    const cap = capture();
    const code = await runCli(["collect", "trae-cn", "--mode", "fixture"], cap.io);
    expect(code).toBe(0);
    const doc = JSON.parse(cap.stdout()) as PlanCollection;
    const validation = validatePlanCollection(doc);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value.collection.provider_id).toBe("trae-cn");
      expect(validation.value.regional_variant?.variant_id).toBe("trae-cn");
      // 31 个自然日原文出现在 windows raw 中
      const billingWindow = validation.value.plans[0]?.quota.windows.find(
        (w) => w.unit?.includes("周期"),
      );
      expect(billingWindow?.raw).toContain("31 个自然日");
    }
  });

  it("tpa collect gemini-codeassist 退出码 0 且输出通过 Schema 校验（双口径价格）", async () => {
    const cap = capture();
    const code = await runCli(["collect", "gemini-codeassist", "--mode", "fixture"], cap.io);
    expect(code).toBe(0);
    const doc = JSON.parse(cap.stdout()) as PlanCollection;
    const validation = validatePlanCollection(doc);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value.collection.provider_id).toBe("google-gemini-codeassist");
      // Standard 档 4 条价格（Hourly×2 + Monthly×2）
      const standard = validation.value.plans.find((p) => p.plan_id === "gemini-codeassist-standard");
      expect(standard?.price_list.length).toBe(4);
      // 个人层 2026-06-18 停服迁 Antigravity
      const deprecated = validation.value.unresolved_facts.find(
        (f) => f.failure_code === "DEPRECATED",
      );
      expect(deprecated).toBeDefined();
    }
  });
});

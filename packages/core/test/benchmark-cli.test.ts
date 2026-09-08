import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { validateBenchmarkCollection } from "../src/schema/benchmark.ts";

const BIN = fileURLToPath(new URL("../dist/tpa.js", import.meta.url));
const hasBuild = existsSync(BIN);

function run(args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN, ...args], {
      env: { ...process.env, NODE_OPTIONS: "--disable-warning=ExperimentalWarning" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

/**
 * 真实进程端到端：spawn 编译产物 `node dist/tpa.js collect-benchmark deepswe`，
 * 验证外部行为——stdout 上是单个通过 Benchmark Schema v1 校验的机读 JSON 文档。
 * `pnpm test` 会先执行构建，因此该文件在常规流程中总是生效。
 */
describe.skipIf(!hasBuild)("tpa CLI 端到端（collect-benchmark，spawn dist/tpa.js）", () => {
  it("collect-benchmark deepswe 输出通过 Benchmark Schema 校验的机读 JSON", async () => {
    const result = await run(["collect-benchmark", "deepswe"]);
    if (result.code !== 0) {
      throw new Error(`CLI exited ${result.code}: ${result.stderr}`);
    }
    const parsed = JSON.parse(result.stdout);
    const validation = validateBenchmarkCollection(parsed);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value.collection.adapter_id).toBe("deepswe");
      expect(validation.value.benchmark.benchmark_version).toBe("v1.1");
      expect(validation.value.records.length).toBeGreaterThan(0);
    }
  });

  it("collect-benchmark terminal-bench 输出通过 Benchmark Schema 校验的机读 JSON", async () => {
    const result = await run(["collect-benchmark", "terminal-bench"]);
    if (result.code !== 0) {
      throw new Error(`CLI exited ${result.code}: ${result.stderr}`);
    }
    const parsed = JSON.parse(result.stdout);
    const validation = validateBenchmarkCollection(parsed);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value.collection.adapter_id).toBe("terminal-bench");
      expect(validation.value.benchmark.benchmark_version).toBe("v4.0");
      expect(validation.value.benchmark.leaderboard_or_dataset_revision).toContain("leaderboard=4-0-0");
      expect(validation.value.records.length).toBeGreaterThan(0);
    }
  });

  it("collect-benchmark zapier-automationbench 输出通过 Benchmark Schema 校验的机读 JSON", async () => {
    const result = await run(["collect-benchmark", "zapier-automationbench"]);
    if (result.code !== 0) {
      throw new Error(`CLI exited ${result.code}: ${result.stderr}`);
    }
    const parsed = JSON.parse(result.stdout);
    const validation = validateBenchmarkCollection(parsed);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value.collection.adapter_id).toBe("zapier-automationbench");
      expect(validation.value.benchmark.benchmark_version).toBe("1.0.6");
      // 私有 held-out 与公开 600-task 仓库作为不同数据集标识同时出现
      expect(validation.value.benchmark.leaderboard_or_dataset_revision).toContain("private_held_out");
      expect(validation.value.benchmark.leaderboard_or_dataset_revision).toContain("public_600_task_repo");
      // 公开仓库以 task_set.domains 表达，不进入 records
      expect(validation.value.task_set.domains).toHaveLength(6);
      expect(validation.value.records.length).toBeGreaterThan(0);
    }
  });

  it("collect-benchmark artificial-analysis-intelligence 输出通过 Benchmark Schema 校验的机读 JSON", async () => {
    const result = await run(["collect-benchmark", "artificial-analysis-intelligence"]);
    if (result.code !== 0) {
      throw new Error(`CLI exited ${result.code}: ${result.stderr}`);
    }
    const parsed = JSON.parse(result.stdout);
    const validation = validateBenchmarkCollection(parsed);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value.collection.adapter_id).toBe("artificial-analysis-intelligence");
      // 完整版本号含 patch（不得降级为 API 的 4.1）
      expect(validation.value.benchmark.benchmark_version).toBe("v4.1.1");
      // 9 个组成评测在 task_set.domains 全枚举；Index 覆盖数差异双视图保留
      expect(validation.value.task_set.domains).toHaveLength(9);
      expect(validation.value.benchmark.leaderboard_or_dataset_revision).toContain("29_of_624");
      expect(validation.value.benchmark.leaderboard_or_dataset_revision).toContain("30_of_612");
      expect(validation.value.records.length).toBeGreaterThan(0);
    }
  });

  it("未知 benchmark 来源 → 退出码 2，stderr 说明可用来源", async () => {
    const result = await run(["collect-benchmark", "nope"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("nope");
    expect(result.stderr).toContain("terminal-bench");
    expect(result.stderr).toContain("zapier-automationbench");
    expect(result.stderr).toContain("artificial-analysis-intelligence");
    expect(result.stdout).toBe("");
  });

  it("不接受 --mode（本批只有官方快照 fixture 一种输入）", async () => {
    const result = await run(["collect-benchmark", "deepswe", "--mode", "live"]);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
  });
});

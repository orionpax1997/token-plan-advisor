import { join } from "node:path";
import { readToolVersion, resolvePackageRoot } from "../../providers/_shared.ts";
import { loadBenchmarkSnapshots } from "../_shared.ts";
import type { BenchmarkAdapter } from "../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { ZAPIER_AUTOMATIONBENCH_SOURCES } from "./sources.ts";

/**
 * Zapier AutomationBench 1.0.6 的 Benchmark Adapter。
 * 官方快照导入 → 解析 → 标准化，全部在确定性代码内完成。
 *
 * 关键边界（research/15-06）：
 * 1. 官方私有 held-out leaderboard 与公开 600-task 仓库作为**两个不同的数据集标识**
 *    分开记录，跨两者分数不互相补齐、不换算；
 * 2. strict all-assertions（task_completed_correctly）与 partial_credit 为独立字段；
 * 3. Cost / task 仅归入 benchmark_resource_usage 描述性信号，不进 ranking；
 * 4. Fable 5.1 + Opus 5 fallback 组合（页面第 5 名）在 prohibited_inferences 中追加独立条目，
 *    禁止把 fallback 组合当作单一模型能力结果。
 */
export function createZapierAutomationBenchAdapter(): BenchmarkAdapter {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "zapier-automationbench");
  const toolVersion = readToolVersion(import.meta.url);

  return {
    adapterId: "zapier-automationbench",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadBenchmarkSnapshots(fixtureDir, ZAPIER_AUTOMATIONBENCH_SOURCES);
      return normalizeFromSnapshots(snapshots, now().toISOString(), toolVersion);
    },
  };
}

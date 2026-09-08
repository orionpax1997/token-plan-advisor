import { join } from "node:path";
import { readToolVersion, resolvePackageRoot } from "../../providers/_shared.ts";
import { loadBenchmarkSnapshots } from "../_shared.ts";
import type { BenchmarkAdapter } from "../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { DEEPSWE_SOURCES } from "./sources.ts";

/**
 * DeepSWE v1.1（Datacurve）的 Benchmark Adapter。
 * 官方快照导入 → 解析 → 标准化，全部在确定性代码内完成；
 * Pass@1/Pass@4 映射为 repository_task_completion 与 code_execution_correctness，
 * cost/token/steps/duration 仅归入 benchmark_resource_usage 描述性信号。
 */
export function createDeepSweAdapter(): BenchmarkAdapter {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "deepswe");
  const toolVersion = readToolVersion(import.meta.url);

  return {
    adapterId: "deepswe",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadBenchmarkSnapshots(fixtureDir, DEEPSWE_SOURCES);
      return normalizeFromSnapshots(snapshots, now().toISOString(), toolVersion);
    },
  };
}
